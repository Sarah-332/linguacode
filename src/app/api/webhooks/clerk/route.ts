import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';
export const dynamic = 'force-dynamic';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// ─── Style Prompts for Linguacode ───
const stylePrompts: Record<string, { ar: string; en: string }> = {
  faang: {
    ar: `أنت مساعد الذكاء الاصطناعي في منصة Linguacode لمراجعة الكود. الهدف: معايير مقابلات FAANG. قدم كوداً قياسياً، نظيفاً، وخالياً من الأخطاء مع شرح احترافي بالعربية. أجب بصيغة JSON حصرياً تحتوي على: refactored_code, vocabulary (array of original, professional, reason), explanation.`,
    en: `You are the AI code review assistant for Linguacode. Target: FAANG Interview Standard. Provide clean, standard, bug-free code with a professional explanation. Return strictly in JSON format containing: refactored_code, vocabulary (array of original, professional, reason), explanation.`
  },
  opensource: {
    ar: `أنت مساعد الذكاء الاصطناعي في منصة Linguacode. الهدف: معايير مشاريع مفتوحة المصدر / GitHub. التركيز على التوثيق، قابلية الصيانة، والمعايير العالمية. أجب بصيغة JSON حصرياً.`,
    en: `You are the AI code review assistant for Linguacode. Target: Open-Source / GitHub Standard. Focus on documentation, maintainability, and global standards. Return strictly in JSON format.`
  },
  microsoft: {
    ar: `أنت مساعد الذكاء الاصطناعي في منصة Linguacode. الهدف: معايير المؤسسات / Microsoft. التركيز على الأمان، الأداء العالي، وهندسة البرمجيات القوية. أجب بصيغة JSON حصرياً.`,
    en: `You are the AI code review assistant for Linguacode. Target: Microsoft / Enterprise Standard. Focus on security, high performance, and robust software architecture. Return strictly in JSON format.`
  },
  startup: {
    ar: `أنت مساعد الذكاء الاصطناعي في منصة Linguacode. الهدف: شركة ناشئة / MVP. التركيز على السرعة، البساطة، والكفاءة العالية. أجب بصيغة JSON حصرياً.`,
    en: `You are the AI code review assistant for Linguacode. Target: Startup / MVP. Focus on speed, simplicity, and high efficiency. Return strictly in JSON format.`
  }
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code, language = 'auto', lang = 'en', target = 'faang' } = await req.json();

  if (!code?.trim()) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  try {
    // ─── 1. Build the system prompt based on target and language ───
    const targetPrompt = stylePrompts[target] || stylePrompts.faang;
    const systemPrompt = lang === 'ar' ? targetPrompt.ar : targetPrompt.en;

    // ─── 2. Call OpenRouter AI ───
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: code },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      const err = await aiResponse.text();
      return NextResponse.json({ error: `AI request failed: ${err}` }, { status: 500 });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '{}';
    const result = JSON.parse(content);

    // ─── 3. Save to database with Linguacode association ───
    const user = await db.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: `${userId}@linguacode.app`, // دمج اسم الموقع هنا
      },
    });

    const review = await db.review.create({
      data: {
        userId: user.id,
        originalCode: code,
        refactoredCode: result.refactored_code || null,
        vocabulary: result.vocabulary || [],
        explanation: result.explanation || null,
        target,
        language,
        uiLang: lang,
      },
    });

    // ─── 4. Return result with reviewId ───
    return NextResponse.json({
      ...result,
      reviewId: review.id,
    });
  } catch (error: any) {
    console.error('Linguacode Server error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
