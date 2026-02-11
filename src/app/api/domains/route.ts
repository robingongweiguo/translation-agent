import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const domains = await prisma.domain.findMany({
      include: { _count: { select: { feedbacks: true } } },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json({
      success: true,
      domains: domains.map(d => ({
        id: d.id,
        name: d.name,
        feedbackCount: d._count.feedbacks
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const count = await prisma.domain.count();
    
    if (count >= 10) {
      return NextResponse.json({ error: '最多10个领域' }, { status: 400 });
    }
    
    const domain = await prisma.domain.create({ data: { name: body.name } });
    return NextResponse.json({ success: true, domain });
  } catch (error) {
    return NextResponse.json({ error: '添加失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const count = await prisma.domain.count();
    
    if (count <= 1) {
      return NextResponse.json({ error: '至少保留1个领域' }, { status: 400 });
    }
    
    await prisma.domain.delete({ where: { id: body.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
