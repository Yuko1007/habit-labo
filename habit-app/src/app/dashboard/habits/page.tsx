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

interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
}

export default function HabitsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [newHabitName, setNewHabitName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        fetchHabits(parsedUser.id);
      } catch {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchHabits = async (userId: string) => {
    try {
      const response = await fetch(`/api/habits?userId=${userId}`);
      const data = await response.json();
      if (data.success) {
        setHabits(data.habits);
      }
    } catch (err) {
      console.error('習慣取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newHabitName.trim()) {
      setError('習慣の名前を入力してください');
      return;
    }

    if (!user) return;

    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: newHabitName,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('習慣を追加しました');
        setNewHabitName('');
        await fetchHabits(user.id);
      } else {
        setError(data.message || '追加に失敗しました');
      }
    } catch (err) {
      setError('ネットワークエラーが発生しました');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">ログイン画面へリダイレクト中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-blue-600">🔥 習慣化アプリ</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">ようこそ、{user.nickname}さん</span>
              <button
                onClick={() => {
                  localStorage.removeItem('user');
                  router.push('/login');
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインナビゲーション */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4">
            <Link
              href="/dashboard"
              className="px-6 py-4 text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition"
            >
              マイページ
            </Link>
            <Link
              href="/dashboard/progress"
              className="px-6 py-4 text-gray-700 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition"
            >
              チームチャレンジ
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="px-6 py-4 text-yellow-600 hover:text-yellow-700 border-b-2 border-transparent hover:border-yellow-600 transition"
              >
                管理画面
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-blue-600 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* 習慣追加フォーム */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">習慣を追加</h2>
          <form onSubmit={handleAddHabit} className="space-y-4">
            <div>
              <label htmlFor="habitName" className="block text-sm font-medium text-gray-700 mb-2">
                習慣の名前（例：AI勉強、発信など）
              </label>
              <input
                id="habitName"
                type="text"
                required
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="例：毎日のLP作成"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 rounded-lg font-semibold hover:from-green-600 hover:to-teal-600 transition"
            >
              習慣を追加する
            </button>
          </form>
        </div>

        {/* 習慣一覧 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">あなたの習慣</h2>

          {habits.length === 0 ? (
            <p className="text-gray-500 text-center py-8">習慣がまだ登録されていません。上のフォームから習慣を追加してください。</p>
          ) : (
            <div className="space-y-4">
              {habits.map((habit) => (
                <div
                  key={habit.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <h3 className="text-lg font-semibold text-gray-800">{habit.name}</h3>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
