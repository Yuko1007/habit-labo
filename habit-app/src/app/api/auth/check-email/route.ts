import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'メールアドレスが必要です' },
        { status: 400 }
      );
    }

    const user = await db.getUserByEmail(email);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'このメールアドレスは登録されていません' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'メールアドレスが確認されました' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
