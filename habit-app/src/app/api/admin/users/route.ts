import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    db.deleteUser(userId);

    return NextResponse.json({
      success: true,
      message: 'メンバーを削除しました',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}
