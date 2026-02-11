import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const memories = await prisma.feedbackMemory.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      memories,
      stats: {
        whitelistCount: memories.filter(m => m.type === 'whitelist').length,
        blacklistCount: memories.filter(m => m.type === 'blacklist').length
      }
    });
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    await prisma.feedbackMemory.deleteMany({
      where: { term: body.term.toLowerCase() }
    });
    
    const memory = await prisma.feedbackMemory.create({
      data: { term: body.term.toLowerCase(), type: body.type }
    });
    
    return NextResponse.json({ success: true, memory });
  } catch (error) {
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}
