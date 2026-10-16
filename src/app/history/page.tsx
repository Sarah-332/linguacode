import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { UserButton } from '@clerk/nextjs';
import { PrismaClient } from '@prisma/client';
import Link from 'next/link';
import ReviewCard from './ReviewCard';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 1. المكون الفرعي الذي يجلب البيانات من قاعدة البيانات
async function HistoryContent({ searchParams }: { searchParams: Promise<{ target?: string; page?: string }> }) {
  const { userId } = await auth();
  if (!userId) {
    return <div className="p-8 text-center text-white"><p>Please sign in to view history.</p></div>;
  }

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return <div className="p-8 text-center text-white"><p>User not found.</p></div>;

  const resolvedParams = await searchParams;
  const targetFilter = resolvedParams?.target || 'all';
  const pageNum = parseInt(resolvedParams?.page || '1', 10);
  const pageSize = 20;

  const where: any = { userId: user.id };
  if (targetFilter !== 'all') {
    where.target = targetFilter;
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (pageNum - 1) * pageSize,
      take: pageSize,
    }),
    prisma.review.count({ where }),
  ]);

  return (
    <>
      {/* Filter buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'faang', 'opensource', 'microsoft', 'startup'].map((target) => (
          <Link
            key={target}
            href={`/history?target=${target}`}
            className={`px-4 py-1.5 rounded text-sm font-medium transition ${
              targetFilter === target
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {target === 'all' ? '📋 All' : target === 'faang' ? '🏢 FAANG' : target === 'opensource' ? '🌐 Open‑Source' : target === 'microsoft' ? '🏢 Enterprise' : '🚀 Startup'}
          </Link>
        ))}
      </div>

      {/* Reviews list */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-lg">No reviews found.</p>
          <Link href="/" className="text-indigo-400 underline mt-2 inline-block">Review your first code snippet</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <ReviewCard key={review.id} review={{...review, createdAt: review.createdAt.toISOString()}} onDelete={() => {}} />
          ))}
        </div>
      )}
    </>
  );
}

// 2. الصفحة الرئيسية مغلفة بـ Suspense
export default function HistoryPage({ searchParams }: { searchParams: Promise<{ target?: string; page?: string }> }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-indigo-400">📊 Linguacode History</h1>
          <div className="flex gap-4 items-center">
            <Link href="/" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition">
              ➕ New Review
            </Link>
            <UserButton />
          </div>
        </div>

        {/* تغليف استدعاء البيانات بـ Suspense لحل المشكلة */}
        <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading history...</div>}>
          <HistoryContent searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}