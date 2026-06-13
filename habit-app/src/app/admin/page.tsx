'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  nickname: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser.role !== 'admin') {
          router.push('/dashboard');
          return;
        }
        setUser(parsedUser);
        fetchUsers();
      } catch {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/debug/users');
      const data = await res.json();
      setAllUsers(data);
    } catch (err) {
      console.error('ユーザー取得エラー:', err);
      setError('ユーザー情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('このメンバーを削除してもよろしいですか？')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (data.success) {
        setAllUsers(allUsers.filter((u) => u.id !== userId));
        setError('');
      } else {
        setError(data.message || 'メンバーの削除に失敗しました');
      }
    } catch (err) {
      console.error('削除エラー:', err);
      setError('削除に失敗しました');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">ログイン画面へリダイレクト中...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* ヘッダー */}
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#4F46E5', margin: 0 }}>習慣LABO</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B7280' }}>理想の未来へ一歩ずつ</p>
            </div>
            <div className="flex items-center space-x-3">
              <span style={{ color: '#1F2937' }} className="text-sm">{user.nickname}さん</span>
              <button
                onClick={() => {
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインナビゲーション */}
      <div className="bg-white" style={{ borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6">
            <Link
              href="/dashboard"
              className="px-0 py-3 text-sm border-b-2 border-transparent transition"
              style={{ color: '#1F2937' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#4F46E5')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1F2937')}
            >
              マイページ
            </Link>
            <Link
              href="/dashboard/progress"
              className="px-0 py-3 text-sm border-b-2 border-transparent transition"
              style={{ color: '#1F2937' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#4F46E5')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1F2937')}
            >
              チームチャレンジ
            </Link>
            <Link
              href="/admin"
              className="px-0 py-3 font-medium text-sm"
              style={{ color: '#4F46E5', borderBottom: '2px solid #4F46E5' }}
            >
              管理画面
            </Link>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#1F2937', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>メンバー管理</h2>

          {error && (
            <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA', color: '#DC2626', padding: '0.75rem 1rem', borderRadius: '0.5rem', fontSize: '13px', marginBottom: '1.5rem' }}>
              {error}
            </div>
          )}

          {allUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF' }}>
              <p>メンバーがいません</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="flex" style={{ backgroundColor: '#EEF2FF', borderBottom: '1px solid #E5E7EB' }}>
                  <div className="flex-1 px-4 py-3 font-semibold text-sm" style={{ color: '#4F46E5' }}>ニックネーム</div>
                  <div className="flex-1 px-4 py-3 font-semibold text-sm" style={{ color: '#4F46E5' }}>メールアドレス</div>
                  <div className="flex-1 px-4 py-3 font-semibold text-sm" style={{ color: '#4F46E5' }}>ロール</div>
                  <div className="w-32 px-4 py-3 text-center font-semibold text-sm" style={{ color: '#4F46E5' }}>アクション</div>
                </div>

                {allUsers.map((member, index) => (
                  <div key={member.id} className="flex" style={{ backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E5E7EB' }}>
                    <div className="flex-1 px-4 py-3 font-medium text-sm" style={{ color: '#1F2937' }}>{member.nickname}</div>
                    <div className="flex-1 px-4 py-3 text-sm" style={{ color: '#6B7280' }}>{member.email}</div>
                    <div className="flex-1 px-4 py-3 text-sm">
                      <span
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: member.role === 'admin' ? '#F3F4F6' : '#EEF2FF',
                          color: member.role === 'admin' ? '#6B7280' : '#4F46E5'
                        }}
                      >
                        {member.role === 'admin' ? '管理者' : 'メンバー'}
                      </span>
                    </div>
                    <div className="w-32 px-4 py-3 text-center text-sm">
                      {member.role !== 'admin' ? (
                        <button
                          onClick={() => handleDeleteUser(member.id)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: '#EF4444',
                            color: '#FFFFFF',
                            fontSize: '12px',
                            fontWeight: '600',
                            border: 'none',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#DC2626'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#EF4444'; }}
                        >
                          削除
                        </button>
                      ) : (
                        <span style={{ color: '#D1D5DB', fontSize: '12px' }}>—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
