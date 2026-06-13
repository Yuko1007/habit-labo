'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        // クッキーとローカルストレージにユーザー情報を保存
        localStorage.setItem('user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.message || 'ログインに失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', padding: '3rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '28rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* ヘッダー */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#4F46E5', marginBottom: '0.25rem', margin: 0 }}>習慣LABO</h1>
          <p style={{ color: '#6B7280', fontSize: '12px', marginBottom: '0.5rem' }}>理想の未来へ一歩ずつ</p>
          <p style={{ color: '#6B7280', fontSize: '14px', borderTop: '1px solid #E5E7EB', paddingTop: '0.5rem', margin: 0 }}>ログイン</p>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
          {error && (
            <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {/* メールアドレス */}
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              style={{ width: '100%', padding: '0.625rem 1rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontSize: '14px', color: '#1F2937', outline: 'none', transition: 'all 0.2s' }}
              onFocus={(e) => { e.currentTarget.style.ring = '2px'; e.currentTarget.style.ringColor = '#4F46E5'; }}
              onBlur={(e) => { e.currentTarget.style.ring = 'none'; }}
            />
          </div>

          {/* パスワード */}
          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              パスワード
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              style={{ width: '100%', padding: '0.625rem 1rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontSize: '14px', color: '#1F2937', outline: 'none', transition: 'all 0.2s' }}
              onFocus={(e) => { e.currentTarget.style.ring = '2px'; e.currentTarget.style.ringColor = '#4F46E5'; }}
              onBlur={(e) => { e.currentTarget.style.ring = 'none'; }}
            />
          </div>

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#4F46E5', color: '#FFFFFF', padding: '0.625rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1, transition: 'all 0.2s' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.opacity = '1'; }}
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>

          {/* リンク */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '12px' }}>
            <p style={{ margin: 0 }}>
              <Link href="/reset-password" style={{ color: '#4F46E5', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }} onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}>
                パスワードを忘れた方
              </Link>
            </p>
            <p style={{ color: '#6B7280', margin: 0 }}>
              アカウントをお持ちでない方は
              <Link href="/register" style={{ color: '#4F46E5', textDecoration: 'none', marginLeft: '0.25rem' }} onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }} onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}>
                こちらから登録
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
