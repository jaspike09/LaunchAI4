import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const body = await req.json();
    
    // Support both 'messages' (array) or 'message' (string) from frontend
    const messages = body.messages || (body.message ? [{ role: 'user', content: body.message }] : null);

    if (!messages) {
      return new Response(JSON.stringify({ error: "No prompt provided" }), { status: 400 });
    }

    const result = await streamText({
      // FIXED: gemini-1.5-flash is retired. Using gemini-2.0-flash.
      model: google('gemini-2.0-flash'), 
      messages: messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
