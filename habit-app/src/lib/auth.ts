import crypto from 'crypto';
import { db } from './db';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const auth = {
  register: async (email: string, password: string, nickname: string) => {
    if (!email.includes('@')) {
      return { success: false, message: 'メールアドレスが無効です' };
    }

    const existingUser = await db.getUserByEmail(email);
    if (existingUser) {
      return { success: false, message: 'このメールアドレスは既に登録されています' };
    }

    if (password.length < 6) {
      return { success: false, message: 'パスワードは6文字以上である必要があります' };
    }

    try {
      const passwordHash = hashPassword(password);
      const user = await db.createUser(email, passwordHash, nickname, 'member');
      return {
        success: true,
        message: '登録完了しました',
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          role: user.role,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      return { success: false, message: '登録に失敗しました' };
    }
  },

  login: async (email: string, password: string) => {
    const user = await db.getUserByEmail(email);

    if (!user) {
      return { success: false, message: 'メールアドレスまたはパスワードが正しくありません' };
    }

    const passwordHash = hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      return { success: false, message: 'メールアドレスまたはパスワードが正しくありません' };
    }

    return {
      success: true,
      message: 'ログイン成功',
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  },

  resetPassword: async (email: string, newPassword: string) => {
    const user = await db.getUserByEmail(email);

    if (!user) {
      return { success: false, message: 'ユーザーが見つかりません' };
    }

    if (newPassword.length < 6) {
      return { success: false, message: 'パスワードは6文字以上である必要があります' };
    }

    try {
      user.passwordHash = hashPassword(newPassword);
      return { success: true, message: 'パスワードをリセットしました' };
    } catch (error) {
      return { success: false, message: 'パスワードリセットに失敗しました' };
    }
  },
};
