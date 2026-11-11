import { NextResponse } from 'next/server';
import { claudeAdapter } from '@/lib/claude_adapter';
import type { NarrationMessage } from '@/lib/types';
import { hasExtensionKey, extensionUsageDenied } from "@/lib/extensionAuth";
import { estimateTokens } from "@/lib/tokenUsage";

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
    if (!hasExtensionKey(req)) {
      return NextResponse.json({ answer: 'Auth Failed' }, { status: 401, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

    const body: { query?: string; context?: string } = await req.json();
    const query = typeof body.query === 'string' ? body.query.slice(0, 500) : '';
    const context = typeof body.context === 'string' ? body.context : '';
    if (!query) return NextResponse.json({ answer: 'Ask something.' }, { headers: { 'Access-Control-Allow-Origin': '*' } });

    // Truncate context to prevent token overruns
    const truncatedContext = context ? context.substring(0, 5000) : 'No context provided.';

    const denied = await extensionUsageDenied(req, estimateTokens(truncatedContext + query) + 300);
    if (denied) {
      return NextResponse.json({ answer: denied.reason }, { status: 429, headers: { 'Access-Control-Allow-Origin': '*' } });
    }

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

    const completion = await claudeAdapter.chat({
      messages,
      config: {
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