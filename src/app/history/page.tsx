'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface HistoryItem {
  id: string;
  code: string;
  language: string;
  target: string;
  refactored_code?: string;
  interview_pitch?: string;
  createdAt: string;
}

export default function HistoryPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchHistory();
    } else if (isLoaded && !isSignedIn) {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  // دالة إعادة الاستخدام
  const handleReuse = (item: HistoryItem) => {
    // يمكن حفظ الكود واللغة ليتم ملؤهما في الصفحة الرئيسية
    localStorage.setItem('linguacode-reuse-code', item.code);
    localStorage.setItem('linguacode-reuse-lang', item.language);
    router.push('/');
  };

  // دالة حذف عنصر محدد
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متاكد من حذف هذا السجل؟')) return;
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // دالة مسح السجل بالكامل
  const handleClearAll = async () => {
    if (!confirm('هل أنت متاكد من مسح جميع السجلات؟')) return;
    try {
      const res = await fetch('/api/history?all=true', { method: 'DELETE' });
      if (res.ok) {
        setHistory([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isLoaded || loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <p>جاري تحميل السجل...</p>
      </main>
    );
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #1e1b4b 0%, #0f172a 100%)',
      color: '#f8fafc',
      padding: '32px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ width: '100%', maxWidth: '900px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Link href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold' }}>
            ← العودة للرئيسية
          </Link>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#818cf8' }}>📊 سجل المراجعات</h1>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              style={{ background: 'rgba(244, 63, 94, 0.2)', border: '1px solid #f43f5e', color: '#fca5a5', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              🗑️ مسح الكل
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '40px', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
            لا يوجد سجلات مراجعة سابقة بعد.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {history.map((item) => (
              <div key={item.id} style={{ background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 'bold' }}>
                    {item.language.toUpperCase()} • {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleReuse(item)}
                      style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                    >
                      🔄 إعادة استخدام
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ background: 'transparent', color: '#f43f5e', border: '1px solid #f43f5e', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      🗑️ حذف
                    </button>
                  </div>
                </div>

                <pre style={{ background: '#0f172a', padding: '10px', borderRadius: '6px', color: '#cbd5e1', fontSize: '0.85rem', overflowX: 'auto', margin: 0 }}>
                  {item.code.slice(0, 150)}{item.code.length > 150 ? '...' : ''}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}