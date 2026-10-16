'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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

  // حالة الإحصائيات (خاصة بالمسؤول)
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
  }, []);

  // جلب الإحصائيات من الـ API عند تحميل الصفحة
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

  const t = {
    title: 'LinguaCode',
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
      minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc',
      display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px',
      fontFamily: 'sans-serif', direction: uiLang === 'ar' ? 'rtl' : 'ltr'
    }}>
      {/* Header */}
      <header style={{ width: '100%', maxWidth: '1000px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#818cf8', margin: 0 }}>{t.title}</h1>
        </div>

        {/* عداد الإحصائيات (خاص بحسابك فقط) */}
        {user?.primaryEmailAddress?.emailAddress === 'saraalkordi49@gmail.com' && (
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', color: '#38bdf8' }}>
            👥 المستخدمون: {stats.totalUsers} | 💻 المراجعات: {stats.totalReviews}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSignedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link 
                href="/history" 
                style={{ backgroundColor: '#334155', color: '#e2e8f0', padding: '8px 12px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.85rem' }}
              >
                {uiLang === 'ar' ? '📊 السجل' : '📊 History'}
              </Link>
              <UserButton />
            </div>
          ) : (
            <SignInButton mode="modal">
              <button style={{ backgroundColor: '#6366f1', color: '#ffffff', border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                {uiLang === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </button>
            </SignInButton>
          )}

          <button
            onClick={() => saveLang(uiLang === 'ar' ? 'en' : 'ar')}
            style={{ backgroundColor: '#334155', color: '#e2e8f0', border: '1px solid #475569', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            {t.langSwitch}
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {errorBanner && (
        <div style={{ width: '100%', maxWidth: '1000px', backgroundColor: '#7f1d1d', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{errorBanner}</span>
          <button onClick={() => setErrorBanner(null)} style={{ background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontWeight: 'bold' }}>{t.closeError}</button>
        </div>
      )}

      {/* Control Box */}
      <div style={{ width: '100%', maxWidth: '1000px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', marginBottom: '24px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>{t.targetPrompt}</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={{ backgroundColor: '#0f172a', color: '#e2e8f0', border: '1px solid #38bdf8', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
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
              style={{ backgroundColor: '#0f172a', color: '#cbd5e1', border: '1px solid #475569', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem', outline: 'none' }}
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
                  style={{ backgroundColor: '#334155', color: '#cbd5e1', border: '1px solid #475569', padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
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
              style={{ backgroundColor: '#334155', border: 'none', color: '#38bdf8', fontSize: '0.8rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
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
          style={{ border: isDragging ? '2px dashed #6366f1' : '1px solid transparent', borderRadius: '8px' }}
        >
          <textarea
            rows={7}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Paste your code here or drop a code file..."
            style={{ width: '100%', backgroundColor: '#0f172a', color: '#f1f5f9', padding: '12px', borderRadius: '8px', border: '1px solid #334155', fontFamily: 'monospace', fontSize: '0.9rem', boxSizing: 'border-box' }}
          />
        </div>

        <button
          onClick={handleReview}
          disabled={loading || !code.trim()}
          style={{ marginTop: '16px', width: '100%', backgroundColor: loading ? '#475569' : '#6366f1', color: '#ffffff', fontWeight: 'bold', padding: '14px', borderRadius: '8px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem' }}
        >
          {t.reviewButton}
        </button>
      </div>

      {/* Results View */}
      {result && (
        <div style={{ width: '100%', maxWidth: '1000px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* 1. Spoken Interview Pitch */}
          {result.interview_pitch && (
            <div style={{ backgroundColor: '#0284c7', border: '1px solid #38bdf8', borderRadius: '10px', padding: '20px', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 'bold', color: '#f0f9ff' }}>
                  {t.pitchTitle}
                </h3>
                <button 
                  onClick={() => handleCopy(result.interview_pitch || '', 'pitch')}
                  style={{ backgroundColor: '#0369a1', color: '#e0f2fe', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  {copied === 'pitch' ? (uiLang === 'ar' ? 'تم النسخ' : 'Copied') : (uiLang === 'ar' ? 'نسخ النص' : 'Copy Pitch')}
                </button>
              </div>
              <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px' }}>
                "{result.interview_pitch}"
              </p>
            </div>
          )}

          {/* 2. Logic Style Analysis */}
          {result.logic_type && (
            <div style={{
              backgroundColor: '#1e293b',
              border: `1px solid ${result.logic_type === 'industry' ? '#22c55e' : result.logic_type === 'exam' ? '#eab308' : '#38bdf8'}`,
              borderRadius: '10px',
              padding: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🧠</span>
                <h3 style={{ fontSize: '1rem', color: '#f8fafc', margin: 0, fontWeight: 'bold' }}>
                  {uiLang === 'ar' ? 'تحليل النمط البرمجي (Logic Style)' : 'Logic Style Detected'}
                  <span style={{ 
                    marginLeft: '10px', 
                    marginRight: '10px',
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem',
                    backgroundColor: result.logic_type === 'industry' ? '#065f46' : result.logic_type === 'exam' ? '#713f12' : '#1e3a8a',
                    color: '#fff'
                  }}>
                    {result.logic_type.toUpperCase()}
                  </span>
                </h3>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0, lineHeight: '1.5' }}>
                {result.logic_explanation}
              </p>
            </div>
          )}

          {/* 3. Naming & Comment Issues */}
          {result.naming_issues && result.naming_issues.length > 0 && (
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', color: '#f43f5e', marginTop: 0, marginBottom: '14px' }}>
                {uiLang === 'ar' ? '📛 مدقق التسميات والتعليقات (Idiom & Naming Inspector)' : '📛 Naming & Comment Issues'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.naming_issues.map((issue: any, idx: number) => (
                  <div key={idx} style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '12px', borderRadius: '8px' }}>
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
            <div style={{ width: '100%', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1rem', color: '#38bdf8', margin: 0, fontWeight: 'bold' }}>
                  {uiLang === 'ar' ? '📊 مقارنة التعديلات (Diff View)' : '📊 Code Changes Diff'}
                </h3>
                <button 
                  onClick={() => handleCopy(result.refactored_code || '', 'ref')} 
                  style={{ backgroundColor: '#334155', color: '#e2e8f0', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  {copied === 'ref' ? (uiLang === 'ar' ? 'تم النسخ' : 'Copied') : t.copyRefactored}
                </button>
              </div>
              <CodeDiff original={code} refactored={result.refactored_code} />
            </div>
          )}

          {/* 5. Variable Mapping Table */}
          {result.vocabulary && result.vocabulary.length > 0 && (
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', color: '#fbbf24', marginTop: 0, marginBottom: '14px' }}>{t.vocabTitle}</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: uiLang === 'ar' ? 'right' : 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #475569', color: '#94a3b8' }}>
                    <th style={{ padding: '8px' }}>{uiLang === 'ar' ? 'الأصلي' : 'Original'}</th>
                    <th style={{ padding: '8px' }}>{uiLang === 'ar' ? 'الاحترافي' : 'Professional'}</th>
                    <th style={{ padding: '8px' }}>{uiLang === 'ar' ? 'السبب' : 'Reason'}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.vocabulary.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #334155' }}>
                      <td style={{ padding: '8px', color: '#f43f5e', fontFamily: 'monospace' }}>{item.original}</td>
                      <td style={{ padding: '8px', color: '#4ade80', fontFamily: 'monospace', fontWeight: 'bold' }}>{item.professional}</td>
                      <td style={{ padding: '8px', color: '#cbd5e1' }}>{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 6. Explanation */}
          {result.explanation && (
            <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ fontSize: '1rem', color: '#818cf8', marginTop: 0, marginBottom: '12px' }}>{t.explanationTitle}</h3>
              <div 
                style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}
                dangerouslySetInnerHTML={{ __html: renderMarkdown(result.explanation) }}
              />
            </div>
          )}

        </div>
      )}
    </main>
  );
}