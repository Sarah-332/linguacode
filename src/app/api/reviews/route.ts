export const dynamic = 'force-dynamic';
import { db } from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    // 1. التحقق من تسجيل دخول المستخدم
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. قراءة معاملات الفلترة والصفحة من الرابط
    const { searchParams } = new URL(req.url);
    const target = searchParams.get('target');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 20;

    // 3. البحث عن المستخدم في قاعدة البيانات عبر clerkId (تم تغيير prisma إلى db)
    const user = await db.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ reviews: [], total: 0 });
    }

    // 4. بناء شرط البحث بناءً على الفلتر المحدد
    const where: any = { userId: user.id };
    if (target && ['faang', 'opensource', 'microsoft', 'startup'].includes(target)) {
      where.target = target;
    }

    // 5. جلب المراجعات وإجمالي العدد بالتوازي (تم تغيير prisma إلى db)
    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.review.count({ where }),
    ]);

    // 6. إرجاع النتيجة
    return NextResponse.json({ reviews, total, page, pageSize });
  } catch (error: any) {
    console.error('Linguacode GET Reviews error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}