export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '../../../../lib/db';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // فك الـ params سواء كانت Promise أو كائن عادي لضمان التوافق التام
  const resolvedParams = await Promise.resolve(params);
  const reviewId = resolvedParams.id;

  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user || review.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await db.review.delete({ where: { id: reviewId } });

  return NextResponse.json({ success: true });
}