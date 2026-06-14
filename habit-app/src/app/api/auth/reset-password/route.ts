import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json();

    if (!email || !newPassword) {
      return NextResponse.json(
        { success: false, message: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: 'パスワードは6文字以上である必要があります' },
        { status: 400 }
      );
    }

    const user = await db.getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const passwordHash = hashPassword(newPassword);
    const result = await db.updateUserPassword(user.id, passwordHash);

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'パスワードをリセットしました',
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'リセットに失敗しました' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
