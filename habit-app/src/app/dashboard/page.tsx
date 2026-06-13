'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTodayMessage } from '@/lib/messages';

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
  createdAt: string;
}

interface DailyTask {
  id: string;
  userId: string;
  habitId: string;
  date: string;
  completed: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayTasks, setTodayTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date().toISOString().split('T')[0]);
  const [newHabitName, setNewHabitName] = useState('');
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [allTasks, setAllTasks] = useState<DailyTask[]>([]);
  const [checkedTasks, setCheckedTasks] = useState<Set<string>>(new Set());
  const [todayMessage, setTodayMessage] = useState('');
  const [streak, setStreak] = useState(0);
  const [habitStats, setHabitStats] = useState<Array<{
    habitId: string;
    habitName: string;
    completed: number;
    total: number;
    rate: number;
  }>>([]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);

        // 今日のメッセージを取得
        if (parsedUser.createdAt) {
          const message = getTodayMessage(new Date(parsedUser.createdAt));
          setTodayMessage(message);
        }

        fetchData(parsedUser.id);
      } catch {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      fetchMonthlyTasks(user.id);
    }
  }, [currentDate, user]);

  const fetchData = async (userId: string) => {
    try {
      const habitsRes = await fetch(`/api/habits?userId=${userId}`);
      const habitsData = await habitsRes.json();
      if (habitsData.success) {
        setHabits(habitsData.habits);

        const todayRes = await fetch(`/api/tasks?userId=${userId}&date=${today}`);
        const todayData = await todayRes.json();

        if (todayData.success && todayData.tasks.length > 0) {
          setTodayTasks(todayData.tasks);
        } else {
          if (habitsData.habits.length > 0) {
            await createTodayTasks(userId, habitsData.habits);
          }
        }

        // ストリーク情報を取得
        const streakRes = await fetch(`/api/users/streak?userId=${userId}`);
        const streakData = await streakRes.json();
        if (streakData.success) {
          setStreak(streakData.streak);
        }

        // 習慣統計を取得
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1;
        const statsRes = await fetch(`/api/users/habit-stats?userId=${userId}&year=${year}&month=${month}`);
        const statsData = await statsRes.json();
        if (statsData.success) {
          setHabitStats(statsData.stats);
        }
      }
    } catch (err) {
      console.error('データ取得エラー:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyTasks = async (userId: string) => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const monthRes = await fetch(`/api/tasks?userId=${userId}&year=${year}&month=${month}`);
      const monthData = await monthRes.json();
      if (monthData.success) {
        setAllTasks(monthData.tasks);
      }
    } catch (err) {
      console.error('月単位のタスク取得エラー:', err);
    }
  };

  const createTodayTasks = async (userId: string, habitsList: Habit[]) => {
    try {
      const tasks: DailyTask[] = [];
      for (const habit of habitsList) {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            habitId: habit.id,
            date: today,
          }),
        });
        const data = await res.json();
        if (data.success) {
          tasks.push(data.task);
        }
      }
      setTodayTasks(tasks);
    } catch (err) {
      console.error('タスク作成エラー:', err);
    }
  };

  const handleToggleTask = (taskId: string) => {
    const newChecked = new Set(checkedTasks);
    if (newChecked.has(taskId)) {
      newChecked.delete(taskId);
    } else {
      newChecked.add(taskId);
    }
    setCheckedTasks(newChecked);
  };

  const handleSubmitTasks = async () => {
    try {
      // すべてのタスク更新を完了するまで待つ
      const updatePromises = Array.from(checkedTasks).map((taskId) =>
        fetch('/api/tasks/update', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            completed: true,
          }),
        })
      );

      await Promise.all(updatePromises);

      // 更新後、少し待ってからデータを再度取得
      setTimeout(() => {
        if (user) {
          fetchData(user.id).then(() => {
            fetchMonthlyTasks(user.id);
          });
        }
        // チェック状態をクリア
        setCheckedTasks(new Set());
      }, 300);
    } catch (err) {
      console.error('タスク送信エラー:', err);
    }
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
        setNewHabitName('');
        await fetchData(user.id);
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

  const completedCount = todayTasks.filter((t) => t.completed).length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* ヘッダー */}
      <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#4F46E5', margin: 0 }}>習慣LABO</h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6B7280' }}>理想の未来へ一歩ずつ</p>
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
              className="px-0 py-3 font-medium text-sm transition"
              style={{ color: '#4F46E5', borderBottom: '2px solid #4F46E5' }}
            >
              マイページ
            </Link>
            <Link
              href="/dashboard/progress"
              className="px-0 py-3 border-b-2 border-transparent hover:border-transparent transition text-sm"
              style={{ color: '#1F2937' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#4F46E5')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#1F2937')}
            >
              チームチャレンジ
            </Link>
            {user.role === 'admin' && (
              <Link
                href="/admin"
                className="px-0 py-3 border-b-2 border-transparent transition text-sm"
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 励ましメッセージ */}
        <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#EEF2FF', border: '1px solid #E5E7EB' }}>
          <p style={{ color: '#1F2937' }} className="font-semibold text-base leading-relaxed whitespace-pre-line">
            {todayMessage}
          </p>
        </div>

        {/* Myチェック */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: '#1F2937', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>Myチェック</h2>

          {/* 進捗表示 */}
          <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <p style={{ color: '#6B7280' }} className="text-xs font-semibold uppercase tracking-wide mb-3">本日の進捗</p>
            <div className="flex items-baseline gap-4">
              <div className="rounded-lg p-4" style={{ backgroundColor: '#EEF2FF' }}>
                <h3 className="text-5xl font-bold" style={{ color: '#4F46E5', margin: 0 }}>
                  {completedCount}
                </h3>
              </div>
              <span className="text-2xl font-semibold" style={{ color: '#9CA3AF' }}>/ {todayTasks.length}</span>
            </div>
            <p style={{ color: '#1F2937' }} className="text-sm mt-4 font-medium">
              {completedCount === todayTasks.length && todayTasks.length > 0
                ? '今日の目標をすべて達成しました！'
                : 'やることをやりきろう！'}
            </p>
            {todayTasks.length > 0 && (
              <div className="mt-4 w-full rounded-full h-2" style={{ backgroundColor: '#E5E7EB' }}>
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ backgroundColor: '#4F46E5', width: `${(completedCount / todayTasks.length) * 100}%` }}
                />
              </div>
            )}

            {streak > 0 && (
              <div className="mt-6 pt-6" style={{ borderTop: '1px solid #E5E7EB' }}>
                <p style={{ color: '#6B7280' }} className="text-sm font-medium">連続達成</p>
                <p className="text-3xl font-bold mt-2" style={{ color: '#4F46E5' }}>
                  {streak}日
                </p>
              </div>
            )}
          </div>

          {/* 習慣を追加フォーム */}
          <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: '#1F2937' }}>習慣を追加</h3>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleAddHabit} className="space-y-4">
              <div>
                <label htmlFor="habitName" className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#6B7280' }}>
                  習慣の名前
                </label>
                <input
                  id="habitName"
                  type="text"
                  required
                  value={newHabitName}
                  onChange={(e) => setNewHabitName(e.target.value)}
                  placeholder="例：AI勉強、発信など"
                  style={{ borderColor: '#E5E7EB', color: '#1F2937' }}
                  className="w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full text-white py-2.5 rounded-lg font-semibold text-sm transition hover:opacity-90"
                style={{ backgroundColor: '#4F46E5' }}
              >
                習慣を追加する
              </button>
            </form>
          </div>

          {/* やることリスト */}
          <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: '#1F2937' }}>今日のやること</h3>

            {habits.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: '#9CA3AF' }}>
                <p>習慣がまだ登録されていません。</p>
                <p>下の「My習慣」から習慣を追加してください。</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-5">
                  {todayTasks.map((task) => {
                    const habit = habits.find((h) => h.id === task.habitId);
                    const isChecked = checkedTasks.has(task.id);
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center space-x-3 p-3.5 rounded-lg border transition`}
                        style={{
                          backgroundColor: isChecked ? '#EEF2FF' : '#FFFFFF',
                          borderColor: '#E5E7EB'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleTask(task.id)}
                          style={{ accentColor: '#4F46E5' }}
                          className="w-5 h-5 cursor-pointer flex-shrink-0"
                        />
                        <span
                          className={`flex-1 text-sm font-medium`}
                          style={{ color: isChecked ? '#4F46E5' : '#1F2937' }}
                        >
                          {habit?.name || 'Unknown'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {checkedTasks.size > 0 && (
                  <button
                    onClick={handleSubmitTasks}
                    className="w-full text-white py-2.5 rounded-lg font-semibold text-sm transition hover:opacity-90"
                    style={{ backgroundColor: '#4F46E5' }}
                  >
                    {checkedTasks.size}個完了する
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* My習慣 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: '#1F2937', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>My習慣</h2>

          {/* 習慣サマリー */}
          <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            <h3 className="text-base font-semibold mb-4" style={{ color: '#1F2937' }}>習慣サマリー（今月）</h3>

            {habits.length === 0 ? (
              <p className="text-center py-6 text-sm" style={{ color: '#9CA3AF' }}>習慣がまだ登録されていません。</p>
            ) : (
              <div className="space-y-4">
                {habitStats.map((stat) => (
                  <div
                    key={stat.habitId}
                    className="rounded-lg p-4"
                    style={{ backgroundColor: '#F8FAFC', border: '1px solid #E5E7EB' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold" style={{ color: '#1F2937' }}>{stat.habitName}</h4>
                      <span className="text-xs font-bold" style={{ color: '#4F46E5', backgroundColor: '#EEF2FF', padding: '0.25rem 0.75rem', borderRadius: '0.375rem' }}>
                        {stat.completed}/{stat.total}
                      </span>
                    </div>
                    <div className="w-full rounded-full h-2" style={{ backgroundColor: '#E5E7EB' }}>
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ backgroundColor: '#4F46E5', width: `${stat.rate}%` }}
                      />
                    </div>
                    <p className="text-xs mt-2" style={{ color: '#6B7280' }}>達成率 {stat.rate}%</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Myステップ */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold" style={{ color: '#1F2937', borderBottom: '1px solid #E5E7EB', paddingBottom: '1rem' }}>Myステップ</h2>
          <div className="rounded-2xl shadow-sm p-6" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
            {/* 月選択 */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="w-8 h-8 flex items-center justify-center text-white rounded-full transition text-sm hover:opacity-80"
                style={{ backgroundColor: '#4F46E5' }}
              >
                ←
              </button>
              <h3 className="text-base font-semibold" style={{ color: '#1F2937' }}>
                {currentDate.getMonth() + 1}月 - {new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).getMonth() + 1}月
              </h3>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="w-8 h-8 flex items-center justify-center text-white rounded-full transition text-sm hover:opacity-80"
                style={{ backgroundColor: '#4F46E5' }}
              >
                →
              </button>
            </div>

            {/* 2ヶ月分のカレンダー */}
            <div className="grid grid-cols-2 gap-6">
              {/* 当月カレンダー */}
              <div>
                <p className="text-xs font-semibold mb-3 text-center" style={{ color: '#6B7280' }}>{currentDate.getMonth() + 1}月</p>
                <div className="grid grid-cols-7 gap-1">
                {/* 曜日ヘッダー */}
                {['日', '月', '火', '水', '木', '金', '土'].map((dayName) => (
                  <div
                    key={dayName}
                    className="text-center font-semibold text-xs py-2"
                    style={{ color: '#6B7280' }}
                  >
                    {dayName}
                  </div>
                ))}

                {/* カレンダー日付 */}
                {(() => {
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
                    return allTasks.some((t) => t.date === dateStr && t.completed);
                  };

                  return days.map((day, index) => {
                    const isCompleted = day ? isDateCompleted(day) : false;
                    return (
                      <div
                        key={index}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition`}
                        style={{
                          backgroundColor: day && isCompleted ? '#4F46E5' : day ? '#F3F4F6' : 'transparent',
                          color: day && isCompleted ? '#FFFFFF' : day ? '#9CA3AF' : 'transparent'
                        }}
                      >
                        {day}
                      </div>
                    );
                  });
                })()}
                </div>
              </div>

              {/* 翌月カレンダー */}
              <div>
                <p className="text-xs font-semibold mb-3 text-center" style={{ color: '#6B7280' }}>{new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).getMonth() + 1}月</p>
                <div className="grid grid-cols-7 gap-1">
                {/* 曜日ヘッダー */}
                {['日', '月', '火', '水', '木', '金', '土'].map((dayName) => (
                  <div
                    key={dayName}
                    className="text-center font-semibold text-xs py-2"
                    style={{ color: '#6B7280' }}
                  >
                    {dayName}
                  </div>
                ))}

                {/* カレンダー日付 */}
                {(() => {
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth() + 1;
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
                    return allTasks.some((t) => t.date === dateStr && t.completed);
                  };

                  return days.map((day, index) => {
                    const isCompleted = day ? isDateCompleted(day) : false;
                    return (
                      <div
                        key={index}
                        className={`aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition`}
                        style={{
                          backgroundColor: day && isCompleted ? '#4F46E5' : day ? '#F3F4F6' : 'transparent',
                          color: day && isCompleted ? '#FFFFFF' : day ? '#9CA3AF' : 'transparent'
                        }}
                      >
                        {day}
                      </div>
                    );
                  });
                })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
