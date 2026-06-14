import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const users = await db.getAllUsers();
  return NextResponse.json(users);
}
