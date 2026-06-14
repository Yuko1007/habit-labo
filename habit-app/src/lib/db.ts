import { User, Habit, DailyTask } from './types';
import crypto from 'crypto';
import { sql } from '@vercel/postgres';

let initialized = false;

async function initializeDatabase() {
  if (initialized) return;

  try {
    // テーブル作成
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        nickname TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS habits (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS daily_tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        habit_id TEXT NOT NULL,
        date TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (habit_id) REFERENCES habits(id)
      );
    `;

    // テスト用ユーザーを挿入（既に存在しない場合）
    const testPasswordHash = crypto.createHash('sha256').update('password123').digest('hex');
    const adminPasswordHash = crypto.createHash('sha256').update('admin123').digest('hex');

    await sql`
      INSERT INTO users (id, email, password_hash, nickname, role)
      VALUES ('test-user-1', 'test@example.com', ${testPasswordHash}, 'テストユーザー', 'member')
      ON CONFLICT DO NOTHING;
    `;

    await sql`
      INSERT INTO users (id, email, password_hash, nickname, role)
      VALUES ('admin-user-1', 'admin@example.com', ${adminPasswordHash}, 'ゆうこ（管理者）', 'admin')
      ON CONFLICT DO NOTHING;
    `;

    initialized = true;
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export const db = {
  // ユーザー
  createUser: async (email: string, passwordHash: string, nickname: string, role: 'admin' | 'member' = 'member'): Promise<User> => {
    await initializeDatabase();
    const id = generateId();
    const createdAt = new Date().toISOString();

    const result = await sql<User>`
      INSERT INTO users (id, email, password_hash, nickname, role, created_at)
      VALUES (${id}, ${email}, ${passwordHash}, ${nickname}, ${role}, ${createdAt})
      RETURNING id, email, password_hash as "passwordHash", nickname, role, created_at as "createdAt"
    `;

    return result.rows[0];
  },

  getUserByEmail: async (email: string): Promise<User | undefined> => {
    await initializeDatabase();
    const result = await sql<User>`
      SELECT id, email, password_hash as "passwordHash", nickname, role, created_at as "createdAt"
      FROM users WHERE email = ${email}
    `;

    return result.rows[0];
  },

  getUserById: async (id: string): Promise<User | undefined> => {
    await initializeDatabase();
    const result = await sql<User>`
      SELECT id, email, password_hash as "passwordHash", nickname, role, created_at as "createdAt"
      FROM users WHERE id = ${id}
    `;

    return result.rows[0];
  },

  getAllUsers: async (): Promise<User[]> => {
    await initializeDatabase();
    const result = await sql<User>`
      SELECT id, email, password_hash as "passwordHash", nickname, role, created_at as "createdAt"
      FROM users
    `;

    return result.rows;
  },

  deleteUser: async (userId: string): Promise<boolean> => {
    await initializeDatabase();

    await sql`DELETE FROM daily_tasks WHERE user_id = ${userId}`;
    await sql`DELETE FROM habits WHERE user_id = ${userId}`;
    const result = await sql`DELETE FROM users WHERE id = ${userId}`;

    return result.rowCount > 0;
  },

  // 習慣
  createHabit: async (userId: string, name: string, description?: string): Promise<Habit> => {
    await initializeDatabase();
    const id = generateId();
    const createdAt = new Date();

    const result = await sql<Habit>`
      INSERT INTO habits (id, user_id, name, description, created_at)
      VALUES (${id}, ${userId}, ${name}, ${description || null}, ${createdAt})
      RETURNING id, user_id as "userId", name, description, created_at as "createdAt"
    `;

    return result.rows[0];
  },

  getHabitsByUserId: async (userId: string): Promise<Habit[]> => {
    await initializeDatabase();
    const result = await sql<Habit>`
      SELECT id, user_id as "userId", name, description, created_at as "createdAt"
      FROM habits WHERE user_id = ${userId}
    `;

    return result.rows;
  },

  deleteHabit: async (habitId: string): Promise<boolean> => {
    await initializeDatabase();
    const result = await sql`DELETE FROM habits WHERE id = ${habitId}`;

    return result.rowCount > 0;
  },

  // 毎日のタスク
  createDailyTask: async (userId: string, habitId: string, date: string): Promise<DailyTask> => {
    await initializeDatabase();
    const id = generateId();

    const result = await sql<DailyTask>`
      INSERT INTO daily_tasks (id, user_id, habit_id, date, completed)
      VALUES (${id}, ${userId}, ${habitId}, ${date}, false)
      RETURNING id, user_id as "userId", habit_id as "habitId", date, completed
    `;

    return result.rows[0];
  },

  getDailyTasksByUserAndDate: async (userId: string, date: string): Promise<DailyTask[]> => {
    await initializeDatabase();
    const result = await sql<DailyTask>`
      SELECT id, user_id as "userId", habit_id as "habitId", date, completed
      FROM daily_tasks WHERE user_id = ${userId} AND date = ${date}
    `;

    return result.rows;
  },

  getDailyTasksByUserAndMonth: async (userId: string, year: number, month: number): Promise<DailyTask[]> => {
    await initializeDatabase();
    const monthStr = String(month).padStart(2, '0');
    const datePattern = `${year}-${monthStr}-%`;

    const result = await sql<DailyTask>`
      SELECT id, user_id as "userId", habit_id as "habitId", date, completed
      FROM daily_tasks WHERE user_id = ${userId} AND date LIKE ${datePattern}
    `;

    return result.rows;
  },

  updateDailyTask: async (taskId: string, completed: boolean): Promise<DailyTask | undefined> => {
    await initializeDatabase();
    const completedAt = completed ? new Date() : null;

    const result = await sql<DailyTask>`
      UPDATE daily_tasks
      SET completed = ${completed}, completed_at = ${completedAt}
      WHERE id = ${taskId}
      RETURNING id, user_id as "userId", habit_id as "habitId", date, completed
    `;

    return result.rows[0];
  },

  // 進捗統計
  getUserCompletionStats: async (userId: string, year: number, month: number) => {
    await initializeDatabase();
    const monthStr = String(month).padStart(2, '0');
    const datePattern = `${year}-${monthStr}-%`;

    const result = await sql`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed
      FROM daily_tasks
      WHERE user_id = ${userId} AND date LIKE ${datePattern}
    `;

    const row = result.rows[0];
    const total = parseInt(row.total) || 0;
    const completed = parseInt(row.completed) || 0;

    return {
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  },

  // 習慣ごとの月間達成数を計算
  getHabitMonthlyStats: async (userId: string, year: number, month: number) => {
    await initializeDatabase();
    const monthStr = String(month).padStart(2, '0');
    const datePattern = `${year}-${monthStr}-%`;

    const result = await sql`
      SELECT
        h.id,
        h.name,
        COUNT(dt.id) as total,
        SUM(CASE WHEN dt.completed THEN 1 ELSE 0 END) as completed
      FROM habits h
      LEFT JOIN daily_tasks dt ON h.id = dt.habit_id AND dt.date LIKE ${datePattern}
      WHERE h.user_id = ${userId}
      GROUP BY h.id, h.name
    `;

    return result.rows.map((row: any) => {
      const total = parseInt(row.total) || 0;
      const completed = parseInt(row.completed) || 0;

      return {
        habitId: row.id,
        habitName: row.name,
        completed,
        total,
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  },

  // ストリーク計算（連続達成日数）
  getStreakCount: async (userId: string): Promise<number> => {
    await initializeDatabase();
    const userHabits = await db.getHabitsByUserId(userId);

    if (userHabits.length === 0) {
      return 0;
    }

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];

      const tasksForDay = await db.getDailyTasksByUserAndDate(userId, dateStr);

      if (tasksForDay.length === 0) {
        break;
      }

      const allCompleted = tasksForDay.every(t => t.completed);

      if (!allCompleted) {
        break;
      }

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  },

  // パスワード更新
  updateUserPassword: async (userId: string, passwordHash: string): Promise<boolean> => {
    await initializeDatabase();
    const result = await sql`
      UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}
    `;

    return result.rowCount > 0;
  },
};
