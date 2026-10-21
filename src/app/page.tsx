'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth, SignInButton, UserButton, useUser } from '@clerk/nextjs';
import CodeDiff from '../components/CodeDiff';

function renderMarkdown(text: string): string {
  if (!text) return '';
  let s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/^### (.*)$/gm, '<h4>$1</h4>');
  s = s.replace(/^## (.*)$/gm, '<h3>$1</h3>');
  s = s.replace(/^# (.*)$/gm, '<h2>$1</h2>');
  return s;
}

const templates = [
  {
    label: '🏫 C++ Search',
    lang: 'cpp',
    code: `int search(int a[], int n, int key) {\n  int x = -1;\n  for(int i=0; i<n; i++) {\n    if(a[i] == key) {\n      x = i;\n      break;\n    }\n  }\n  return x;\n}`
  },
  {
    label: '🏫 JS Filter',
    lang: 'javascript',
    code: `function get(d) {\n  let t = [];\n  for(let i = 0; i < d.length; i++) {\n    if(d[i].a == 1 && d[i].b != null) {\n      t.push(d[i]);\n    }\n  }\n  return t;\n}`
  },
  {
    label: '🏫 SQL Report',
    lang: 'sql',
    code: `SELECT a.id, a.n, b.t\nFROM users a\nJOIN orders b ON a.id = b.uid\nWHERE a.c = 1 AND b.p > 100\nORDER BY b.t DESC;`
  }
];

export default function Home() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [target, setTarget] = useState('faang');
  const [uiLang, setUiLang] = useState<'ar' | 'en'>('en');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stats, setStats] = useState({ totalUsers: 0, totalReviews: 0 });

  const [result, setResult] = useState<{
    refactored_code?: string;
    vocabulary?: { original: string; professional: string; reason: string }[];
    explanation?: string;
    interview_pitch?: string;
    naming_issues?: { original_name: string; suggested_name: string; line: number; comment: string }[];
    logic_type?: 'exam' | 'industry' | 'mixed';
    logic_explanation?: string;
  } | null>(null);

  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('linguacode-lang') as 'ar' | 'en' | null;
    if (saved) setUiLang(saved);

    // فحص ما إذا كان هناك كود معاد استخدامه قادم من السجل
    const reuseCode = localStorage.getItem('linguacode-reuse-code');
    const reuseLang = localStorage.getItem('linguacode-reuse-lang');
    if (reuseCode) {
      setCode(reuseCode);
      if (reuseLang) setLanguage(reuseLang);
      localStorage.removeItem('linguacode-reuse-code');
      localStorage.removeItem('linguacode-reuse-lang');
    }
  }, []);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          setStats(data);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const saveLang = (lang: 'ar' | 'en') => {
    setUiLang(lang);
    localStorage.setItem('linguacode-lang', lang);
  };

  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert(uiLang === 'ar' ? 'متصفحك لا يدعم النطق الصوتي' : 'Browser does not support speech synthesis');
    }
  };

  const handleExportReport = () => {
    if (!result) return;

    let content = `# LinguaCode Review Report\n\n`;
    if (result.interview_pitch) {
      content += `## 🎤 Spoken Interview Pitch\n"${result.interview_pitch}"\n\n`;
    }
    if (result.logic_type) {
      content += `## 🧠 Logic Style: ${result.logic_type.toUpperCase()}\n${result.logic_explanation}\n\n`;
    }
    if (result.refactored_code) {
      content += `## 💻 Refactored Code\n\`\`\`\n${result.refactored_code}\n\`\`\`\n\n`;
    }
    if (result.vocabulary && result.vocabulary.length > 0) {
      content += `## 📚 Variable Mapping\n`;
      result.vocabulary.forEach(v => {
        content += `- ${v.original} -> ${v.professional} (${v.reason})\n`;
      });
      content += `\n`;
    }
    if (result.explanation) {
      content += `## 📝 Detailed Explanation\n${result.explanation}\n`;
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LinguaCode-Report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const t = {
    title: 'LinguaCode',
    tagline: uiLang === 'ar' 
      ? 'مساعدك الذكي لمراجعة الكود وإتقان مصطلحات المقابلات التقنية بالإنجليزية' 
      : 'Your AI Assistant for Refactoring Code & Mastering Technical Interview English',
    quickExamples: uiLang === 'ar' ? 'أمثلة سريعة:' : 'Quick Examples:',
    selectLanguage: uiLang === 'ar' ? 'لغة البرمجة:' : 'Language:',
    autoDetect: uiLang === 'ar' ? 'تلقائي' : 'Auto-Detect',
    targetPrompt: uiLang === 'ar' ? 'الهدف الوظيفي:' : 'Career Target:',
    pasteCode: uiLang === 'ar' ? 'انسخ الكود أو اسحب ملف هنا:' : 'Paste code or drag & drop file:',
    uploadFile: uiLang === 'ar' ? '📁 رفع ملف' : '📁 Upload File',
    clearButton: uiLang === 'ar' ? 'مسح' : 'Clear',
    reviewButton: loading
      ? (uiLang === 'ar' ? 'جاري التحليل اللغوي...' : 'Reviewing Language & Code...')
      : (uiLang === 'ar' ? 'مراجعة الكود واللغة' : 'Review Code & Language'),
    copyRefactored: uiLang === 'ar' ? 'نسخ المحسن' : 'Copy Refactored',
    vocabTitle: uiLang === 'ar' ? 'جدول تحويل المتغيرات' : 'Corporate Vocabulary Mapping',
    explanationTitle: uiLang === 'ar' ? 'شرح التعديلات' : 'Explanation & Refactoring',
    pitchTitle: uiLang === 'ar' ? '🎤 كيف تشرح كودك في المقابلة؟ (Spoken Interview Pitch)' : '🎤 How to Explain in an Interview (Spoken Pitch)',
    closeError: uiLang === 'ar' ? 'إغلاق' : 'Dismiss',
    langSwitch: uiLang === 'ar' ? 'English' : 'العربية',
    listen: uiLang === 'ar' ? '🔊 استمع للنطق' : '🔊 Listen',
    exportReport: uiLang === 'ar' ? '📥 تحميل التقرير (MD)' : '📥 Export Report (.md)',
    targetOptions: {
      faang: uiLang === 'ar' ? '📊 FAANG (مقابلات Big Tech)' : '📊 FAANG Interview',
      microsoft: uiLang === 'ar' ? '🏢 Microsoft / مؤسسات' : '🏢 Enterprise / Microsoft',
      fintech: uiLang === 'ar' ? '🏦 FinTech / أنظمة مالية' : '🏦 FinTech & Banking',
      competitive: uiLang === 'ar' ? '🏆 LeetCode / شرح المقابلات' : '🏆 Competitive / Live Coding',
      opensource: uiLang === 'ar' ? '🌐 مفتوح المصدر / GitHub' : '🌐 Open‑Source / GitHub',
      startup: uiLang === 'ar' ? '🚀 شركة ناشئة / MVP' : '🚀 Startup / MVP'
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) setCode(content);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleReview = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult(null);
    setErrorBanner(null);
    setCopied(null);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, lang: uiLang, target }),
      });
      const data = await res.json();
      if (data.error) {
        setErrorBanner(data.error);
      } else if (data.refactored_code || data.explanation) {
        setResult(data);
      } else {
        setErrorBanner('Unexpected response format.');
      }
    } catch (err: any) {
      setErrorBanner(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #1e1b4b 0%, #0f172a 100%)',
      color: '#f8fafc',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px',
      fontFamily: 'system-ui, -apple-system, sans-serif', direction: uiLang === 'ar' ? 'rtl' : 'ltr'
    }}>
      {/* Header */}
      <header style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        
        {/* اللوغو والاسم */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ filter: 'drop-shadow(0 0 12px rgba(129, 140, 248, 0.4))' }}>
            <Image 
              src="/logo.png" 
              alt="LinguaCode Logo" 
              width={85} 
              height={85} 
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, letterSpacing: '-0.5px' }}>{t.title}</h1>
        </div>

        {/* عداد الإحصائيات (خاص بحسابك فقط) */}
        {user?.primaryEmailAddress?.emailAddress === 'saraalkordi49@gmail.com' && (
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', color: '#38bdf8', boxShadow: '0 0 10px rgba(56, 189, 248, 0.1)' }}>
            👥 المستخدمون: {stats.totalUsers} | 💻 المراجعات: {stats.totalReviews}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSignedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link 
                href="/history" 
                style={{ background: 'rgba(51, 65, 85, 0.8)', color: '#e2e8f0', padding: '8px 14px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '500', transition: 'all 0.2s', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                {uiLang === 'ar' ? '📊 السجل' : '📊 History'}
              </Link>
              <UserButton />
            </div>
          ) : (
            <SignInButton mode="modal">
              <button style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#ffffff', border: 'none', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
                {uiLang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            </SignInButton>
          )}

          <button
            onClick={() => saveLang(uiLang === 'ar' ? 'en' : 'ar')}
            style={{ background: 'rgba(51, 65, 85, 0.6)', color: '#e2e8f0', border: '1px solid #475569', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            {t.langSwitch}
          </button>
        </div>
      </header>

      {/* Hero Tagline */}
      <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0', marginBottom: '28px', textAlign: 'center', maxWidth: '750px', lineHeight: '1.5' }}>
        {t.tagline}
      </p>

      {/* Error Banner */}
      {errorBanner && (
        <div style={{ width: '100%', maxWidth: '1000px', backgroundColor: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontWeight: 'bold' }}>{t.closeError}</button>
        </div>
      )}

      {/* Control Box */}
      <div style={{ width: '100%', maxWidth: '1000px', background: 'rgba(30, 41, 59, 0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)', marginBottom: '32px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>{t.targetPrompt}</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={{ background: '#0f172a', color: '#e2e8f0', border: '1px solid #38bdf8', padding: '9px 14px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="faang">{t.targetOptions.faang}</option>
              <option value="microsoft">{t.targetOptions.microsoft}</option>
              <option value="fintech">{t.targetOptions.fintech}</option>
              <option value="competitive">{t.targetOptions.competitive}</option>
              <option value="opensource">{t.targetOptions.opensource}</option>
              <option value="startup">{t.targetOptions.startup}</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>{t.selectLanguage}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ background: '#0f172a', color: '#cbd5e1', border: '1px solid #475569', padding: '9px 14px', borderRadius: '8px', fontSize: '0.85rem', outline: 'none' }}
            >
              <option value="auto">{t.autoDetect}</option>
              <option value="cpp">C++</option>
              <option value="javascript">JavaScript</option>
              <option value="sql">SQL</option>
            </select>
          </div>

          <div>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '6px' }}>{t.quickExamples}</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => { setCode(tpl.code); setLanguage(tpl.lang); }}
                  style={{ background: 'rgba(51, 65, 85, 0.6)', color: '#cbd5e1', border: '1px solid #475569', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <label style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{t.pasteCode}</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
              style={{ display: 'none' }} 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ background: 'rgba(51, 65, 85, 0.8)', border: '1px solid #38bdf8', color: '#38bdf8', fontSize: '0.8rem', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}
            >
              {t.uploadFile}
            </button>
            {code && (
              <button
                onClick={() => setCode('')}
                style={{ backgroundColor: 'transparent', border: 'none', color: '#f43f5e', fontSize: '0.8rem', cursor: 'pointer' }}
              >
                {t.clearButton}
              </button>
            )}
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{ border: isDragging ? '2px dashed #6366f1' : '1px solid transparent', borderRadius: '10px' }}
        >
          <textarea
            rows={8}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Paste your code here or drop a code file..."
            style={{ width: '100%', background: '#0f172a', color: '#f1f5f9', padding: '14px', borderRadius: '10px', border: '1px solid #334155', fontFamily: 'monospace', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }}
          />
        </div>

        <button
          onClick={handleReview}
          disabled={loading || !code.trim()}
          style={{ marginTop: '18px', width: '100%', background: loading ? '#475569' : 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', color: '#ffffff', fontWeight: 'bold', padding: '14px', borderRadius: '10px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)' }}
        >
          {t.reviewButton}
        </button>
      </div>

      {/* Results View */}
      {result && (
        <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* زر تحميل التقرير */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleExportReport}
              style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid #38bdf8', color: '#38bdf8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', backdropFilter: 'blur(8px)' }}
            >
              {t.exportReport}
            </button>
          </div>

          {/* 1. Spoken Interview Pitch */}
          {result.interview_pitch && (
            <div style={{ background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.9) 0%, rgba(3, 105, 161, 0.9) 100%)', backdropFilter: 'blur(10px)', border: '1px solid #38bdf8', borderRadius: '14px', padding: '22px', color: '#fff', boxShadow: '0 8px 25px rgba(2, 132, 199, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', color: '#f0f9ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {t.pitchTitle}
                </h3>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => speakText(result.interview_pitch || '')}
                    style={{ background: '#0284c7', color: '#ffffff', border: '1px solid #7dd3fc', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
                  >
                    {t.listen}
                  </button>
                  <button 
                    onClick={() => handleCopy(result.interview_pitch || '', 'pitch')}
                    style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#f0f9ff', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    {copied === 'pitch' ? (uiLang === 'ar' ? 'تم النسخ' : 'Copied') : (uiLang === 'ar' ? 'نسخ النص' : 'Copy Pitch')}
                  </button>
                </div>
              </div>
              <p style={{ margin: 0, fontSize: '1rem', lineHeight: '1.7', fontStyle: 'italic', background: 'rgba(0,0,0,0.25)', padding: '14px 18px', borderRadius: '10px', borderLeft: '4px solid #7dd3fc' }}>
                "{result.interview_pitch}"
              </p>
            </div>
          )}

          {/* 2. Logic Style Analysis */}
          {result.logic_type && (
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              backdropFilter: 'blur(8px)',
              border: `1px solid ${result.logic_type === 'industry' ? '#22c55e' : result.logic_type === 'exam' ? '#eab308' : '#38bdf8'}`,
              borderRadius: '14px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🧠</span>
                <h3 style={{ fontSize: '1rem', color: '#f8fafc', margin: 0, fontWeight: 'bold' }}>
                  {uiLang === 'ar' ? 'تحليل النمط البرمجي (Logic Style)' : 'Logic Style Detected'}
                  <span style={{ 
                    marginLeft: '10px', 
                    marginRight: '10px',
                    padding: '3px 10px', 
                    borderRadius: '6px', 
                    fontSize: '0.75rem',
                    backgroundColor: result.logic_type === 'industry' ? '#065f46' : result.logic_type === 'exam' ? '#713f12' : '#1e3a8a',
                    color: '#fff',
                    fontWeight: 'bold'
                  }}>
                    {result.logic_type.toUpperCase()}
                  </span>
                </h3>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0, lineHeight: '1.6' }}>
                {result.logic_explanation}
              </p>
            </div>
          )}

          {/* 3. Naming & Comment Issues */}
          {result.naming_issues && result.naming_issues.length > 0 && (
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#f43f5e', marginTop: 0, marginBottom: '14px', fontWeight: 'bold' }}>
                {uiLang === 'ar' ? '📛 مدقق التسميات والتعليقات (Idiom & Naming Inspector)' : '📛 Naming & Comment Issues'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.naming_issues.map((issue: any, idx: number) => (
                  <div key={idx} style={{ background: '#0f172a', border: '1px solid #334155', padding: '12px 16px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ color: '#94a3b8' }}>Line {issue.line}:</span>
                      <span style={{ fontFamily: 'monospace' }}>
                        <code style={{ color: '#f43f5e', textDecoration: 'line-through' }}>{issue.original_name}</code>
                        {' → '}
                        <code style={{ color: '#4ade80', fontWeight: 'bold' }}>{issue.suggested_name}</code>
                      </span>
                    </div>
                    <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0 }}>{issue.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Diff View */}
          {result.refactored_code && (
            <div style={{ width: '100%', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid #334155', borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1.05rem', color: '#38bdf8', margin: 0, fontWeight: 'bold' }}>
                  {uiLang === 'ar' ? '📊 مقارنة التعديلات (Diff View)' : '📊 Code Changes Diff'}
                </h3>
                <button 
                  onClick={() => handleCopy(result.refactored_code || '', 'ref')} 
                  style={{ background: '#334155', color: '#e2e8f0', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  {copied === 'ref' ? (uiLang === 'ar' ? 'تم النسخ' : 'Copied') : t.copyRefactored}
                </button>
              </div>
              <CodeDiff original={code} refactored={result.refactored_code} />
            </div>
          )}

          {/* 5. Variable Mapping Table */}
          {result.vocabulary && result.vocabulary.length > 0 && (
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#fbbf24', marginTop: 0, marginBottom: '16px', fontWeight: 'bold' }}>{t.vocabTitle}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: uiLang === 'ar' ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #475569', color: '#94a3b8' }}>
                    <th style={{ padding: '10px' }}>{uiLang === 'ar' ? 'الأصلي' : 'Original'}</th>
                    <th style={{ padding: '10px' }}>{uiLang === 'ar' ? 'الاحترافي' : 'Professional'}</th>
                    <th style={{ padding: '10px' }}>{uiLang === 'ar' ? 'السبب' : 'Reason'}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.vocabulary.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '10px', color: '#f43f5e', fontFamily: 'monospace' }}>{item.original}</td>
                      <td style={{ padding: '10px', color: '#4ade80', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.professional}</td>
                      <td style={{ padding: '10px', color: '#cbd5e1' }}>{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 6. Explanation */}
          {result.explanation && (
            <div style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid #334155', borderRadius: '14px', padding: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#818cf8', marginTop: 0, marginBottom: '14px', fontWeight: 'bold' }}>{t.explanationTitle}</h3>
              <div 
                style={{ background: '#0f172a', padding: '18px', borderRadius: '10px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.7' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(result.explanation) }}
              />
            </div>
          )}

        </div>
      )}

      {/* Footer */}
      <footer style={{ marginTop: 'auto', paddingTop: '40px', paddingBottom: '12px', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
        © 2026 LinguaCode — Crafted for developers worldwide
      </footer>
    </main>
  );
}