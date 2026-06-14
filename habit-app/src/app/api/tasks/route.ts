import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');
  const date = request.nextUrl.searchParams.get('date');
  const year = request.nextUrl.searchParams.get('year');
  const month = request.nextUrl.searchParams.get('month');

  if (!userId) {
    return NextResponse.json(
      { success: false, message: 'userIdが必要です' },
      { status: 400 }
    );
  }

  try {
    if (date) {
      const tasks = await db.getDailyTasksByUserAndDate(userId, date);
      return NextResponse.json({ success: true, tasks });
    } else if (year && month) {
      const tasks = await db.getDailyTasksByUserAndMonth(userId, parseInt(year), parseInt(month));
      return NextResponse.json({ success: true, tasks });
    } else {
      return NextResponse.json(
        { success: false, message: 'dateまたは year/month が必要です' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, habitId, date } = await request.json();

    if (!userId || !habitId || !date) {
      return NextResponse.json(
        { success: false, message: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    const task = await db.createDailyTask(userId, habitId, date);
    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}
