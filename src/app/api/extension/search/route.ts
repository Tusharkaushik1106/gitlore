import { NextResponse } from 'next/server';
import { geminiAdapter } from '@/lib/gemini_adapter';
import type { NarrationMessage } from '@/lib/types';

// 1. Handle CORS Pre-flight (The "Check" before the "Send")
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-gitlore-extension-key',
    },
  });
}

export async function POST(req: Request) {
  try {
    // 2. Security & Load Shedding
    const secret = req.headers.get('x-gitlore-extension-key');
    if (secret !== process.env.GITLORE_EXTENSION_SECRET) {
      return NextResponse.json({ answer: 'Auth Failed' }, { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const { query, context }: { query?: string; context?: string } = await req.json();
    if (!query) return NextResponse.json({ answer: 'Ask something.' }, { headers: { 'Access-Control-Allow-Origin': '*' } });

    // Truncate context to prevent token overruns
    const truncatedContext = context ? context.substring(0, 5000) : 'No context provided.';

    const messages: NarrationMessage[] = [
      {
        id: 'search-prompt',
        role: 'user',
        content: `You are the GitLore Hologram AI.
Answer using ONLY the provided code context.
Keep it under 2 sentences.
Do NOT use Markdown. Return plain text only.

Context:
${truncatedContext}

Question: ${query}`,
        createdAt: new Date().toISOString(),
      },
    ];

    const completion = await geminiAdapter.chat({
      messages,
      config: {
        model: 'gemini-2.5-flash',
        maxTokens: 200,
        streaming: false,
      },
    });

    const aiResponse = completion.content.trim();

    // 3. Return with CORS Headers
    return NextResponse.json({ answer: aiResponse }, {
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error: any) {
    return NextResponse.json({ answer: 'System Overload. Try again.' }, { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}