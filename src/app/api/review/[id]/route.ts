import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';


const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const dynamic = 'force-dynamic';
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // فك الـ params سواء كانت Promise أو كائن عادي لضمان التوافق التام
  const resolvedParams = await Promise.resolve(params);
  const reviewId = resolvedParams.id;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user || review.userId !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.review.delete({ where: { id: reviewId } });

  return NextResponse.json({ success: true });
}