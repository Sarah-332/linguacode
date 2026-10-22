export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';


const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// ─── Extended Corporate & Specialist Prompts ───
const stylePrompts: Record<string, { ar: string; en: string }> = {
  faang: {
    ar: `أنت خبير تدقيق لغوي ومراجع كود لمقابلات FAANG (Google, Meta, Amazon).
المطلوب صراحة:
1. إعادة كتابة الكود بالكامل بأسلوب احترافي وتسميات Silicon Valley Standard.
2. تصحيح القواعد والتعليقات باللغة الإنجليزية.
3. إضافة فقرة "interview_pitch": صياغة 2-3 جمل باللغة الإنجليزية الفصيحة ليشرح بها المطور كوده شفهياً للمقابل بطلاقة وثقة (Live Coding Interview Pitch).`,
    en: `You are a Code Language & Naming Specialist for FAANG Interviews (Google, Meta, Amazon).
PRIMARY FOCUS: Full Refactoring, FAANG Technical English, and Live Coding Pitch.
Rewrite code completely, fix non-native English, and provide a 2-3 sentence "interview_pitch" in fluent English for explaining the code during a live interview.`
  },
  microsoft: {
    ar: `أنت خبير تدقيق لغوي ومصطلحات مؤسسية في شركة Microsoft Enterprise.
المطلوب: تحويل المسميات الشائعة إلى أنماط Enterprise، وتوفير فقرة "interview_pitch" رسمية لشرح الهيكلية.`,
    en: `You are an Enterprise Terminology Specialist for Microsoft Enterprise. Focus on Enterprise Naming, Error Handling, and a formal "interview_pitch".`
  },
  fintech: {
    ar: `أنت خبير أنظمة مالية ومصرفية (FinTech & Banking Standards).
المطلوب: دقة المسميات المالية والأمان، مع فقرة "interview_pitch" تشرح معايير السلامة والدقة المالية.`,
    en: `You are a FinTech Specialist. Focus on Financial Naming Precision, Transaction Safety, and a concise "interview_pitch".`
  },
  competitive: {
    ar: `أنت موجه لغوي لمقابلات الشرح المباشر والمسابقات (LeetCode / Live Coding).
المطلوب: تحويل التسميات المختصرة لأسماء معبرة، وتوفير "interview_pitch" مبسط جداً وسهل النطق للشرح بطلاقة.`,
    en: `You are a Live Coding Coach. Convert cryptic names to self-documenting terms and provide a simple, conversational "interview_pitch".`
  },
  opensource: {
    ar: `أنت مراجع لغوي لمشاريع مفتوحة المصدر على GitHub. التركيز على JSDoc والتوثيق المفتوح وفقرة "interview_pitch" مخصصة للـ Pull Request description.`,
    en: `Open-Source GitHub Reviewer. Focus on JSDoc, modularity, clean phrasing, and a PR summary "interview_pitch".`
  },
  startup: {
    ar: `أنت موجه لغوي للشركات الناشئة (Y-Combinator style). كود حديث وسريع مع "interview_pitch" موجز ومباشر.`,
    en: `Startup Language Coach. Concise Tech English, modern refactoring, and a punchy "interview_pitch".`
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
    const targetPrompt = stylePrompts[target] || stylePrompts.faang;
    const systemPrompt = lang === 'ar' ? targetPrompt.ar : targetPrompt.en;

    const userMessageContent = `
CRITICAL TASK FOR TARGET: ${target.toUpperCase()}
1. FULLY REFACTOR AND CORRECT the source code to meet top-tier ${target.toUpperCase()} corporate standards.
2. AUDIT NON-NATIVE ENGLISH: Identify and fix non-native English phrasing, poor grammar, mixed-language comments, or confusing variable names.
3. PROVIDE AN "interview_pitch": 2-3 native English sentences explaining what the code does, designed for an interview setting.
4. RETURN A STRICT JSON OBJECT:
{
  "refactored_code": "Complete refactored code string",
  "vocabulary": [
    { "original": "tempVar", "professional": "suggestedVar", "reason": "Linguistic/Enterprise reasoning" }
  ],
  "explanation": "Explanation of refactoring & linguistic fixes",
  "interview_pitch": "2-3 sentences in fluent English to speak aloud in an interview",
  "naming_issues": [
    { "original_name": "tempVar", "suggested_name": "suggestedVar", "line": 1, "comment": "Grammar/idiom detail" }
  ],
  "logic_type": "exam" | "industry" | "mixed",
  "logic_explanation": "Academic vs Industry comparison"
}

Source Code:
\`\`\`
${code}
\`\`\`
`;

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o', // ترقية النموذج لقوة تحليل قصوى
        temperature: 0.3, // قيمة دقيقة لنتائج هندسية ولغوية صارمة
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessageContent },
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

    const user = await db.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: `${userId}@linguacode.app`,
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