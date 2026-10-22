'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamicImport from 'next/dynamic';
import { UserButton, SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

// استيراد محرر Monaco بشكل ديناميكي لتجنب مشاكل الـ SSR أثناء البناء
const Editor = dynamicImport(() => import('@monaco-editor/react'), { ssr: false });

const monacoLanguageMap: Record<string, string> = {
  cpp: 'cpp',
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  sql: 'sql',
  html: 'html',
  css: 'css',
  auto: 'javascript',
};

export default function Home() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [target, setTarget] = useState('faang');
  const [lang, setLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const currentLanguage = monacoLanguageMap[language] || 'javascript';

  const handleReview = async () => {
    if (!code.trim()) {
      setError('Please enter some code to review.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, lang, target }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* شريط أزرار المصادقة الواضح في الأعلى */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <SignedIn>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link href="/dashboard" style={{ backgroundColor: '#334155', color: '#f8fafc', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 'bold' }}>
                📊 لوحة التحكم (Dashboard)
              </Link>
              <UserButton />
            </div>
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button style={{ backgroundColor: '#4f46e5', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                🔑 تسجيل الدخول / Sign In
              </button>
            </SignInButton>
          </SignedOut>
        </div>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#818cf8', margin: 0 }}>⚡ Linguacode</h1>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '4px' }}>AI-Powered Code Refactoring & Interview Prep</p>
          </div>
        </header>

        {/* Controls Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Language</label>
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px' }}
            >
              <option value="auto">Auto-detect</option>
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="sql">SQL</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>Review Target</label>
            <select 
              value={target} 
              onChange={(e) => setTarget(e.target.value)}
              style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px' }}
            >
              <option value="faang">FAANG Interview</option>
              <option value="opensource">Open-Source / GitHub</option>
              <option value="microsoft">Microsoft Enterprise</option>
              <option value="startup">Startup MVP</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '6px' }}>UI / Explanation Lang</label>
            <select 
              value={lang} 
              onChange={(e) => setLang(e.target.value)}
              style={{ width: '100%', padding: '10px', backgroundColor: '#1e293b', color: '#f8fafc', border: '1px solid #334155', borderRadius: '8px' }}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>

        {/* Monaco Editor Replacement */}
        <div style={{ marginBottom: '20px', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <Editor
            height="350px"
            language={currentLanguage}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{
              minimap: { enabled: false },
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              fontSize: 14,
              fontFamily: "'Fira Code', 'Courier New', monospace",
            }}
            loading={<div style={{ padding: '20px', color: '#94a3b8' }}>Loading professional editor...</div>}
          />
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <button 
            onClick={() => setCode('')} 
            style={{ backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}
          >
            Clear Editor
          </button>

          <button 
            onClick={handleReview} 
            disabled={loading}
            style={{ backgroundColor: '#6366f1', color: '#ffffff', border: 'none', padding: '12px 28px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Analyzing Code...' : '✨ Review & Save Code'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #991b1b', color: '#fca5a5', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '24px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '1.4rem', color: '#38bdf8', marginTop: 0 }}>🔍 AI Review Results</h2>
            
            {result.reviewId && (
              <div style={{ marginBottom: '16px' }}>
                <span style={{ backgroundColor: '#065f46', color: '#a7f3d0', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem' }}>
                  Saved to database successfully!
                </span>
              </div>
            )}

            {result.explanation && (
              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1rem', color: '#cbd5e1' }}>Explanation:</h3>
                <p style={{ color: '#94a3b8', lineHeight: '1.6' }}>{result.explanation}</p>
              </div>
            )}

            {result.refactored_code && (
              <div>
                <h3 style={{ fontSize: '1rem', color: '#cbd5e1' }}>Refactored Code:</h3>
                <pre style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', overflowX: 'auto', color: '#34d399', fontSize: '0.9rem' }}>
                  <code>{result.refactored_code}</code>
                </pre>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}