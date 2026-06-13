import crypto from 'crypto';
import { db } from './db';

// シンプルなパスワードハッシュ化（本番環境では bcrypt を使用）
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const auth = {
  // ユーザー登録
  register: (email: string, password: string, nickname: string) => {
    // メールアドレスの形式チェック
    if (!email.includes('@')) {
      return { success: false, message: 'メールアドレスが無効です' };
    }

    // 既存ユーザーチェック
    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return { success: false, message: 'このメールアドレスは既に登録されています' };
    }

    // パスワード検証
    if (password.length < 6) {
      return { success: false, message: 'パスワードは6文字以上である必要があります' };
    }

    try {
      const passwordHash = hashPassword(password);
      const user = db.createUser(email, passwordHash, nickname, 'member');
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

  // ログイン
  login: (email: string, password: string) => {
    const user = db.getUserByEmail(email);

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

  // パスワードリセット（シンプル版）
  resetPassword: (email: string, newPassword: string) => {
    const user = db.getUserByEmail(email);

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
