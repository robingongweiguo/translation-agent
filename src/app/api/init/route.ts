import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const DEFAULT_DOMAINS = ['通用', '技术', '学术', '商务'];

export async function GET() {
  try {
    const existingDomains = await prisma.domain.count();
    
    if (existingDomains === 0) {
      for (const name of DEFAULT_DOMAINS) {
        await prisma.domain.create({ data: { name } });
      }
    }
    
    const existingLibraries = await prisma.termLibrary.count();
    
    if (existingLibraries === 0) {
      const library = await prisma.termLibrary.create({
        data: { name: 'AI 领域术语库', description: '人工智能相关术语' }
      });
      
      const defaultTerms = [
        { source: '大模型', target: 'Large Language Model (LLM)' },
        { source: '人工智能', target: 'Artificial Intelligence (AI)' },
        { source: '机器学习', target: 'Machine Learning' },
        { source: '深度学习', target: 'Deep Learning' },
        { source: '强化学习', target: 'Reinforcement Learning' },
        { source: '生成式AI', target: 'Generative AI' },
        { source: '参数微调', target: 'Parameter Fine-tuning' },
        { source: '神经网络', target: 'Neural Network' },
        { source: '自然语言处理', target: 'Natural Language Processing (NLP)' },
        { source: '计算机视觉', target: 'Computer Vision' },
      ];
      
      for (const term of defaultTerms) {
        await prisma.term.create({
          data: { ...term, libraryId: library.id, type: '关键词', sourceType: '导入', frequency: 1 }
        });
      }
    }
    
    return NextResponse.json({ success: true, message: '初始化完成' });
  } catch (error) {
    return NextResponse.json({ error: '初始化失败' }, { status: 500 });
  }
}
