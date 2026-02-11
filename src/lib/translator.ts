import ZAI from 'z-ai-web-dev-sdk';

export interface TermMatch {
  source: string;
  target: string;
}

export function extractMatchedTerms(
  text: string,
  glossary: Record<string, string>
): TermMatch[] {
  const matched: TermMatch[] = [];
  
  for (const [source, target] of Object.entries(glossary)) {
    const hasChinese = /[\u4e00-\u9fff]/.test(source);
    
    if (hasChinese) {
      if (text.includes(source)) {
        matched.push({ source, target });
      }
    } else {
      const pattern = new RegExp(`\\b${escapeRegExp(source)}\\b`, 'gi');
      if (pattern.test(text)) {
        matched.push({ source, target });
      }
    }
  }
  
  return matched;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function translateText(options: {
  text: string;
  domain?: string;
  glossary?: Record<string, string>;
}): Promise<{ translation: string; matchedTerms: TermMatch[] }> {
  const { text, domain = '通用', glossary = {} } = options;
  
  const zai = await ZAI.create();
  const matchedTerms = extractMatchedTerms(text, glossary);
  
  let systemPrompt = `你是一个专业的翻译专家，领域是【${domain}】。
请将以下文本翻译成地道的英文，输出只包含翻译结果，不要包含任何解释。`;
  
  if (matchedTerms.length > 0) {
    const glossaryStr = matchedTerms
      .map(t => `- ${t.source} -> ${t.target}`)
      .join('\n');
    
    systemPrompt = `你是一个专业的翻译专家，领域是【${domain}】。

【重要：必须严格遵守以下术语表】
${glossaryStr}
在翻译时，必须使用上述术语表中的对应译文，不得随意更改。

请将以下文本翻译成地道的英文，输出只包含翻译结果，不要包含任何解释。`;
  }
  
  const completion = await zai.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text }
    ],
    temperature: 0.3
  });
  
  const translation = completion.choices[0]?.message?.content || '';
  
  return { translation, matchedTerms };
}
