import { NextRequest, NextResponse } from 'next/server';
import { translateText } from '@/lib/translator';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, domain = '通用', libraryId } = body;
    
    if (!text) {
      return NextResponse.json({ error: '请提供要翻译的文本' }, { status: 400 });
    }
    
    let glossary: Record<string, string> = {};
    
    if (libraryId) {
      const terms = await prisma.term.findMany({ where: { libraryId } });
      glossary = terms.reduce((acc, term) => {
        acc[term.source] = term.target;
        return acc;
      }, {} as Record<string, string>);
    }
    
    const { translation, matchedTerms } = await translateText({ text, domain, glossary });
    
    await prisma.translationHistory.create({
      data: {
        sourceText: text,
        translatedText: translation,
        domain,
        usedGlossary: matchedTerms.length > 0,
        termCount: matchedTerms.length
      }
    });
    
    return NextResponse.json({
      success: true,
      translation,
      matchedTerms,
      termCount: matchedTerms.length
    });
  } catch (error) {
    return NextResponse.json({ error: '翻译失败' }, { status: 500 });
  }
}
