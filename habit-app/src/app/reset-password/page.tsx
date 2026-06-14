'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setStep('reset');
      } else {
        setError(data.message || 'メールアドレスが見つかりません');
      }
    } catch (err) {
      setError('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (newPassword.length < 6) {
      setError('パスワードは6文字以上である必要があります');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('パスワードをリセットしました。ログイン画面へリダイレクトします...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message || 'リセットに失敗しました');
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
          <p style={{ color: '#6B7280', fontSize: '14px', borderTop: '1px solid #E5E7EB', paddingTop: '0.5rem', margin: 0 }}>パスワードをリセット</p>
        </div>

        {/* フォーム */}
        <form onSubmit={step === 'email' ? handleCheckEmail : handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
          {error && (
            <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ backgroundColor: '#DCFCE7', border: '1px solid #BBF7D0', color: '#16A34A', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '13px' }}>
              {success}
            </div>
          )}

          {step === 'email' ? (
            <>
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
                  style={{ width: '100%', padding: '0.625rem 1rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontSize: '14px', color: '#1F2937', outline: 'none' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', backgroundColor: '#4F46E5', color: '#FFFFFF', padding: '0.625rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? '確認中...' : '確認'}
              </button>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="newPassword" style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6B7280', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  新しいパスワード（6文字以上）
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                  style={{ width: '100%', padding: '0.625rem 1rem', border: '1px solid #E5E7EB', borderRadius: '0.5rem', fontSize: '14px', color: '#1F2937', outline: 'none' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#4F46E5'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', backgroundColor: '#4F46E5', color: '#FFFFFF', padding: '0.625rem 1rem', borderRadius: '0.5rem', fontWeight: '600', fontSize: '14px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? 'リセット中...' : 'パスワードをリセット'}
              </button>
            </>
          )}

          {/* リンク */}
          <div style={{ textAlign: 'center', fontSize: '12px', color: '#6B7280' }}>
            <p style={{ margin: 0 }}>
              <Link href="/login" style={{ color: '#4F46E5', textDecoration: 'none' }} onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }} onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}>
                ログイン
              </Link>
              に戻る
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
