export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';


const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export async function GET() {
  try {
    // هنا كتبنا السطر الذي يسأل عن العدد الإجمالي للمستخدمين
    const totalUsers = await db.user.count();
    
    // ويمكننا أيضاً جلب عدد المراجعات الكلي للمنصة!
    const totalReviews = await db.review.count();

    return NextResponse.json({
      totalUsers,
      totalReviews,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}