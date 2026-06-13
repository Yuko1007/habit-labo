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

export default function ProgressPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allTasks, setAllTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        fetchData(currentDate);
      } catch {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router, currentDate]);

  const fetchData = async (date: Date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      // 全ユーザーを取得
      const usersRes = await fetch('/api/debug/users');
      const usersData = await usersRes.json();
      const memberUsers = usersData.filter((u: User) => u.role === 'member');
      setAllUsers(memberUsers);

      // 全メンバーのタスクを取得
      const allTasksData: DailyTask[] = [];
      for (const memberUser of memberUsers) {
        const res = await fetch(`/api/tasks?userId=${memberUser.id}&year=${year}&month=${month}`);
        const data = await res.json();
        if (data.success) {
          allTasksData.push(...data.tasks);
        }
      }
      setAllTasks(allTasksData);
    } catch (err) {
      console.error('データ取得エラー:', err);
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

  const isUserCompletedOnDate = (userId: string, day: number): boolean => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return allTasks.some((t) => t.userId === userId && t.date === dateStr && t.completed);
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
              className="px-0 py-3 font-medium text-sm"
              style={{ color: '#4F46E5', borderBottom: '2px solid #4F46E5' }}
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
              {month + 1}月の全員の進捗
            </h2>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 flex items-center justify-center text-white rounded-full transition text-sm hover:opacity-80"
              style={{ backgroundColor: '#4F46E5' }}
            >
              →
            </button>
          </div>

          {/* 進捗テーブル */}
          {allUsers.length === 0 ? (
            <p className="text-center text-sm" style={{ color: '#9CA3AF', padding: '1.5rem' }}>メンバーがまだいません</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* ヘッダー */}
                <div className="flex">
                  <div className="w-32 flex-shrink-0 px-3 py-2 font-semibold text-sm" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                    メンバー
                  </div>
                  <div className="flex px-1 py-2">
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const date = new Date(year, month, i + 1);
                      const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                      return (
                        <div key={i} className="w-10 text-center">
                          <div className="text-xs font-semibold mb-0.5" style={{ color: isWeekend ? '#4F46E5' : '#6B7280' }}>
                            {dayOfWeek}
                          </div>
                          <div className="text-xs font-bold" style={{ color: '#1F2937' }}>
                            {i + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ボディ */}
                {allUsers.map((memberUser, userIndex) => (
                  <div key={memberUser.id} className="flex" style={{ backgroundColor: userIndex % 2 === 0 ? '#FFFFFF' : '#F8FAFC' }}>
                    <div className="w-32 flex-shrink-0 px-3 py-2 font-medium text-sm flex items-center" style={{ backgroundColor: '#F8FAFC', borderRight: '1px solid #E5E7EB', color: '#1F2937' }}>
                      {memberUser.nickname}
                    </div>
                    <div className="flex px-1 py-2">
                      {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                        const day = dayIndex + 1;
                        const isCompleted = isUserCompletedOnDate(memberUser.id, day);
                        return (
                          <div key={dayIndex} className="w-10 flex justify-center">
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition"
                              style={{
                                backgroundColor: isCompleted ? '#4F46E5' : '#E5E7EB',
                                color: isCompleted ? '#FFFFFF' : '#9CA3AF'
                              }}
                            >
                              {isCompleted ? '✅' : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 凡例 */}
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              <span className="inline-block text-white px-2 py-0.5 rounded text-xs mr-2" style={{ backgroundColor: '#4F46E5' }}>
                ✅
              </span>
              その日のやることをすべて完了した
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
