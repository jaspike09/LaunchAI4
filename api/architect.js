import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google('gemini-1.5-flash'),
      messages,
    });

    // This is the most compatible way to return the stream
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Gemini Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
