// ユーザー型
export interface User {
  id: string;
  email: string;
  nickname: string;
  passwordHash: string;
  role: 'admin' | 'member';
  createdAt: Date;
}

// 習慣型
export interface Habit {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date;
}

// 毎日のタスク型
export interface DailyTask {
  id: string;
  userId: string;
  habitId: string;
  date: string; // YYYY-MM-DD format
  completed: boolean;
  completedAt?: Date;
}

// ログイン結果型
export interface LoginResult {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    nickname: string;
    role: string;
  };
}
