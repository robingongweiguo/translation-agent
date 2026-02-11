import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.feedback.count()
    ]);
    
    const stats = await prisma.feedback.aggregate({
      _avg: { rating: true },
      _count: { _all: true },
      where: { rating: { gte: 4 } }
    });
    
    return NextResponse.json({
      success: true,
      feedbacks,
      total,
      stats: {
        avgRating: stats._avg.rating || 0,
        highQualityCount: stats._count._all,
        totalCount: total
      }
    });
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const feedback = await prisma.feedback.create({
      data: {
        sourceText: body.sourceText,
        modelOutput: body.modelOutput,
        editedOutput: body.editedOutput,
        rating: body.rating || 4,
        isGolden: body.isGolden || false
      }
    });
    
    return NextResponse.json({ success: true, feedback });
  } catch (error) {
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}
