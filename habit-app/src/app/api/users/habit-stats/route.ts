import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!userId || !year || !month) {
      return NextResponse.json(
        { success: false, message: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const stats = await db.getHabitMonthlyStats(userId, parseInt(year), parseInt(month));

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'エラーが発生しました' },
      { status: 500 }
    );
  }
}
