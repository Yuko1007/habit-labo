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

interface DailyTask {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  completed: boolean;
}

export default function CalendarPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        fetchTasks(parsedUser.id, currentDate);
      } catch {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router, currentDate]);

  const fetchTasks = async (userId: string, date: Date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const res = await fetch(`/api/tasks?userId=${userId}&year=${year}&month=${month}`);
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('タスク取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">読み込み中...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">ログイン画面へリダイレクト中...</div>;
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isDateCompleted = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.some((t) => t.date === dateStr && t.completed);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

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
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="px-0 py-3 text-sm border-b-2 border-transparent transition"
                style={{ color: '#1F2937' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#4F46E5')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#1F2937')}
              >
                管理画面
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
          {/* 月選択 */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center text-white rounded-full transition text-sm hover:opacity-80"
              style={{ backgroundColor: '#4F46E5' }}
            >
              ←
            </button>
            <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>
              {month + 1}月の進捗
            </h2>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 flex items-center justify-center text-white rounded-full transition text-sm hover:opacity-80"
              style={{ backgroundColor: '#4F46E5' }}
            >
              →
            </button>
          </div>

          {/* カレンダー */}
          <div className="grid grid-cols-7 gap-3">
            {/* 曜日ヘッダー */}
            {['日', '月', '火', '水', '木', '金', '土'].map((dayName) => (
              <div
                key={dayName}
                className="text-center font-bold text-sm py-2"
                style={{ color: '#6B7280' }}
              >
                {dayName}
              </div>
            ))}

            {/* カレンダー日付 */}
            {days.map((day, index) => {
              const isCompleted = day ? isDateCompleted(day) : false;
              return (
                <div
                  key={index}
                  className="aspect-square rounded-xl flex items-center justify-center text-lg font-semibold transition"
                  style={{
                    backgroundColor: day ? (isCompleted ? '#4F46E5' : '#F3F4F6') : 'transparent',
                    color: day ? (isCompleted ? '#FFFFFF' : '#9CA3AF') : 'transparent',
                    cursor: day ? 'default' : 'auto'
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* 凡例 */}
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid #E5E7EB' }}>
            <p className="text-sm" style={{ color: '#6B7280' }}>
              <span className="inline-block text-white px-3 py-1 rounded-full mr-3" style={{ backgroundColor: '#4F46E5' }}>
                完了
              </span>
              その日のやることをすべて完了した日
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
