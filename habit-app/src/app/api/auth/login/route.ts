import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'メールアドレスとパスワードが必要です' },
        { status: 400 }
      );
    }

    const result = await auth.login(email, password);

    if (result.success) {
      // クッキーにユーザー情報を保存（1か月）
      const response = NextResponse.json(result, { status: 200 });
      response.cookies.set('user', JSON.stringify(result.user), {
        maxAge: 30 * 24 * 60 * 60, // 30日
        httpOnly: false, // JavaScriptからアクセス可能
      });
      return response;
    } else {
      return NextResponse.json(result, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
