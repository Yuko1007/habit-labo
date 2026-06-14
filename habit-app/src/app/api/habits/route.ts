import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userIdが必要です' },
      { status: 400 }
    );
  }

  try {
    const habits = await db.getHabitsByUserId(userId);
    return NextResponse.json({ success: true, habits });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, name, description } = await request.json();

    if (!userId || !name) {
      return NextResponse.json(
        { success: false, message: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    const habit = await db.createHabit(userId, name, description);
    return NextResponse.json({ success: true, habit }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}
