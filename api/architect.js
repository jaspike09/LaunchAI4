import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const body = await req.json();
    
    // 1. EXTRACT DATA SAFELY
    // If frontend sends 'message' (singular), we wrap it in an array
    // If it sends 'messages' (plural), we use that
    const rawMessages = body.messages || (body.message ? [{ role: 'user', content: body.message }] : null);

    // 2. VALIDATION
    if (!rawMessages) {
      return new Response(JSON.stringify({ 
        error: "Invalid input: 'messages' array or 'message' string is required." 
      }), { status: 400 });
    }

    // 3. CALL AI
    const result = await streamText({
      model: google('gemini-1.5-flash'),
      messages: rawMessages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Architect API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
