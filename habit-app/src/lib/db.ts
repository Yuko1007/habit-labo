import { User, Habit, DailyTask } from './types';
import crypto from 'crypto';

// シンプルなメモリデータベース（開発用）
// 本番環境では PostgreSQL や MongoDB に置き換える

const users: Map<string, User> = new Map();
const habits: Map<string, Habit> = new Map();
const dailyTasks: Map<string, DailyTask> = new Map();

// テスト用ユーザー自動作成
function initializeTestData() {
  const testPasswordHash = crypto.createHash('sha256').update('password123').digest('hex');
  const testUser: User = {
    id: 'test-user-1',
    email: 'test@example.com',
    nickname: 'テストユーザー',
    passwordHash: testPasswordHash,
    role: 'member',
    createdAt: new Date(),
  };
  users.set(testUser.id, testUser);

  const adminPasswordHash = crypto.createHash('sha256').update('admin123').digest('hex');
  const adminUser: User = {
    id: 'admin-user-1',
    email: 'admin@example.com',
    nickname: 'ゆうこ（管理者）',
    passwordHash: adminPasswordHash,
    role: 'admin',
    createdAt: new Date(),
  };
  users.set(adminUser.id, adminUser);
}

initializeTestData();

// ユーティリティ関数
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// User 操作
export const db = {
  // ユーザー
  createUser: (email: string, passwordHash: string, nickname: string, role: 'admin' | 'member' = 'member'): User => {
    const user: User = {
      id: generateId(),
      email,
      passwordHash,
      nickname,
      role,
      createdAt: new Date(),
    };
    users.set(user.id, user);
    return user;
  },

  getUserByEmail: (email: string): User | undefined => {
    return Array.from(users.values()).find(u => u.email === email);
  },

  getUserById: (id: string): User | undefined => {
    return users.get(id);
  },

  getAllUsers: (): User[] => {
    return Array.from(users.values());
  },

  deleteUser: (userId: string): boolean => {
    // ユーザーの習慣を削除
    const userHabits = Array.from(habits.values()).filter(h => h.userId === userId);
    for (const habit of userHabits) {
      habits.delete(habit.id);
    }
    // ユーザーのタスクを削除
    const userTasks = Array.from(dailyTasks.values()).filter(t => t.userId === userId);
    for (const task of userTasks) {
      dailyTasks.delete(task.id);
    }
    // ユーザーを削除
    return users.delete(userId);
  },

  // 習慣
  createHabit: (userId: string, name: string, description?: string): Habit => {
    const habit: Habit = {
      id: generateId(),
      userId,
      name,
      description,
      createdAt: new Date(),
    };
    habits.set(habit.id, habit);
    return habit;
  },

  getHabitsByUserId: (userId: string): Habit[] => {
    return Array.from(habits.values()).filter(h => h.userId === userId);
  },

  deleteHabit: (habitId: string): boolean => {
    return habits.delete(habitId);
  },

  // 毎日のタスク
  createDailyTask: (userId: string, habitId: string, date: string): DailyTask => {
    const task: DailyTask = {
      id: generateId(),
      userId,
      habitId,
      date,
      completed: false,
    };
    dailyTasks.set(task.id, task);
    return task;
  },

  getDailyTasksByUserAndDate: (userId: string, date: string): DailyTask[] => {
    return Array.from(dailyTasks.values()).filter(
      t => t.userId === userId && t.date === date
    );
  },

  getDailyTasksByUserAndMonth: (userId: string, year: number, month: number): DailyTask[] => {
    return Array.from(dailyTasks.values()).filter(t => {
      const [y, m] = t.date.split('-').map(Number);
      return t.userId === userId && y === year && m === month;
    });
  },

  updateDailyTask: (taskId: string, completed: boolean): DailyTask | undefined => {
    const task = dailyTasks.get(taskId);
    if (task) {
      task.completed = completed;
      if (completed) {
        task.completedAt = new Date();
      }
    }
    return task;
  },

  // 進捗統計
  getUserCompletionStats: (userId: string, year: number, month: number) => {
    const tasks = db.getDailyTasksByUserAndMonth(userId, year, month);
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    return {
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },

  // 習慣ごとの月間達成数を計算
  getHabitMonthlyStats: (userId: string, year: number, month: number) => {
    const userHabits = Array.from(habits.values()).filter(h => h.userId === userId);

    return userHabits.map(habit => {
      const tasksForHabit = Array.from(dailyTasks.values()).filter(t => {
        const [y, m] = t.date.split('-').map(Number);
        return t.userId === userId && t.habitId === habit.id && y === year && m === month;
      });

      const completed = tasksForHabit.filter(t => t.completed).length;
      const total = tasksForHabit.length;

      return {
        habitId: habit.id,
        habitName: habit.name,
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  },

  // ストリーク計算（連続達成日数）
  getStreakCount: (userId: string): number => {
    const userHabits = Array.from(habits.values()).filter(h => h.userId === userId);

    if (userHabits.length === 0) {
      return 0;
    }

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // その日のすべてのタスクを取得
      const tasksForDay = Array.from(dailyTasks.values()).filter(
        t => t.userId === userId && t.date === dateStr
      );

      // ユーザーが習慣を持っているかチェック
      if (tasksForDay.length === 0) {
        break;
      }

      // その日のすべてのタスクが完了しているかチェック
      const allCompleted = tasksForDay.every(t => t.completed);

      if (!allCompleted) {
        break;
      }

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  },
};
