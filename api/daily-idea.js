import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export default async function handler(req) {
  // Security check for Vercel Cron
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { text } = await generateText({
    model: google('gemini-3-flash'),
    prompt: "Generate one business idea for Feb 2026 that is expected to generate immediate income. Include a 3-step 'Get Started' link guide. Format as JSON.",
  });

  // Here you would add code to post to your 'DailyIdeas4U' page via Webhook
  console.log("Daily Idea Generated:", text);

  return new Response(JSON.stringify({ success: true, idea: text }));
}
