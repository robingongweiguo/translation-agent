import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const libraryId = searchParams.get('libraryId');
    
    if (libraryId) {
      const terms = await prisma.term.findMany({
        where: { libraryId },
        orderBy: { frequency: 'desc' }
      });
      return NextResponse.json({ success: true, terms });
    }
    
    const libraries = await prisma.termLibrary.findMany({
      include: { _count: { select: { terms: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    
    return NextResponse.json({
      success: true,
      libraries: libraries.map(lib => ({
        id: lib.id,
        name: lib.name,
        description: lib.description,
        termCount: lib._count.terms,
        createdAt: lib.createdAt,
        updatedAt: lib.updatedAt
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'createLibrary') {
      const library = await prisma.termLibrary.create({
        data: { name: body.name, description: body.description }
      });
      return NextResponse.json({ success: true, library });
    }
    
    if (body.action === 'addTerm') {
      const term = await prisma.term.upsert({
        where: { libraryId_source: { libraryId: body.libraryId, source: body.source } },
        update: { target: body.target },
        create: {
          libraryId: body.libraryId,
          source: body.source,
          target: body.target,
          type: body.type || '关键词',
          sourceType: '导入',
          frequency: 0
        }
      });
      return NextResponse.json({ success: true, term });
    }
    
    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'deleteLibrary') {
      await prisma.termLibrary.delete({ where: { id: body.libraryId } });
      return NextResponse.json({ success: true });
    }
    
    if (body.action === 'deleteTerm') {
      await prisma.term.delete({ where: { id: body.termId } });
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
