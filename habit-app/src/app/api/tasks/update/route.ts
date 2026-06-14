import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: NextRequest) {
  try {
    const { taskId, completed } = await request.json();

    if (!taskId || completed === undefined) {
      return NextResponse.json(
        { success: false, message: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    const task = await db.updateDailyTask(taskId, completed);
    if (!task) {
      return NextResponse.json(
        { success: false, message: 'タスクが見つかりません' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}
