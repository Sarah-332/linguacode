export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';

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