import { NextRequest } from "next/server";
import { claudeAdapter } from "@/lib/claude_adapter";
import type { NarrationMessage } from "@/lib/types";
import { hasExtensionKey, extensionUsageDenied } from "@/lib/extensionAuth";
import { estimateTokens } from "@/lib/tokenUsage";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  console.log('--- RISK ANALYSIS REQUEST STARTED ---');
  
  try {
    // 1. Safe Authentication Check
    if (!hasExtensionKey(req)) {
      console.log('Error: Unauthorized request');
      return Response.json({ score: 0, reason: 'Unauthorized access.' }, { status: 401 });
    }

    // 2. Safe Body Parsing
    let functionCode: string;
    try {
      const body = await req.json();
      functionCode = body?.functionCode;

      if (!functionCode || typeof functionCode !== "string") {
        console.log('Error: No function code provided');
        return Response.json({ score: 0, reason: 'No code selected.' });
      }

      // Limit code length to prevent issues
      if (functionCode.length > 5000) {
        functionCode = functionCode.substring(0, 5000);
        console.log('Warning: Function code truncated to 5000 characters');
      }
    } catch (bodyError) {
      console.error('Body parse error:', bodyError);
      return Response.json({ score: 0, reason: 'Invalid request body.' });
    }

    const denied = await extensionUsageDenied(req, estimateTokens(functionCode) + 500);
    if (denied) {
      return Response.json({ score: 0, reason: denied.reason }, { status: 429 });
    }

    // 3. Call Claude with explicit JSON instructions
    let aiResponse: string;
    try {
      const messages: NarrationMessage[] = [
        {
          id: "risk-prompt",
          role: "user",
          content: `You are a senior code auditor. Analyze the following function.
Return a JSON object with this exact structure: { "score": number, "reason": "string" }.
Score is 1-10 (10 is high risk). Keep reason under 20 words.
Do NOT use Markdown blocks. Just raw JSON.

Code:
\`\`\`
${functionCode}
\`\`\``,
          createdAt: new Date().toISOString(),
        },
      ];

      const completion = await claudeAdapter.chat({
        messages,
        config: {
          streaming: false,
        },
      });

      aiResponse = completion.content || '';
      console.log('Raw AI Response:', aiResponse);
    } catch (aiError: any) {
      console.error('AI Call Error:', aiError);
      return Response.json({ 
        score: 0, 
        reason: `AI service error: ${aiError?.message || 'Unknown error'}` 
      });
    }

    // 4. Aggressive Cleaning (The Anti-Crash Mechanism)
    let cleanJson: string;
    try {
      // Remove markdown code blocks and whitespace
      cleanJson = aiResponse.replace(/```json|```/g, '').trim();
      
      // Find the first '{' and last '}' to handle extra text
      const firstBrace = cleanJson.indexOf('{');
      const lastBrace = cleanJson.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
      } else {
        throw new Error('No valid JSON structure found in AI response');
      }
    } catch (cleanError) {
      console.error('Cleaning Error:', cleanError);
      console.error('Original response:', aiResponse);
      return Response.json({ 
        score: 5, 
        reason: 'AI returned invalid format. Check server logs.' 
      });
    }

    // 5. Safe Parsing
    let data: { score: number; reason: string };
    try {
      data = JSON.parse(cleanJson);
      
      // Validate structure
      if (typeof data.score !== 'number' || typeof data.reason !== 'string') {
        throw new Error('Invalid data structure');
      }
      
      // Ensure score is in valid range
      data.score = Math.max(1, Math.min(10, Math.round(data.score)));
      
    } catch (parseError) {
      console.error('JSON Parse Failed:', parseError);
      console.error('Clean JSON attempted:', cleanJson);
      // Fallback if AI sends bad JSON
      return Response.json({ 
        score: 5, 
        reason: 'AI returned invalid format. Check server logs.' 
      });
    }

    console.log('--- RISK ANALYSIS SUCCESS ---');
    return Response.json(data);

  } catch (error: any) {
    // 6. Global Error Trap (Prevents 500 Errors)
    console.error('CRITICAL SERVER ERROR:', error);
    console.error('Error stack:', error?.stack);
    return Response.json({ 
      score: 0, 
      reason: `Server Error: ${error?.message || 'Unknown error'}` 
    });
  }
}
