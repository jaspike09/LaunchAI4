import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const body = await req.json();
    const messages = body.messages;

    const result = await streamText({
      // Gemini 3 Flash is the 2026 workhorse. 
      // Fallback to 2.5-flash if your project is on the Stable tier.
      model: google('gemini-3-flash'), 
      messages: messages,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('2026 Model Error:', error);
    // Automatic failover to the most stable legacy model still active in 2026
    const fallback = await streamText({
      model: google('gemini-2.5-flash'),
      messages: body.messages,
    });
    return fallback.toTextStreamResponse();
  }
}
