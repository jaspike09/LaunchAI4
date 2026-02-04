import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const { messages, agent, idea, focusHours, currentDay } = await req.json();

    // The single Gemini 3 instance adopts these personas based on the 'agent' sent from the frontend
    const boardDefinitions = {
      MentorAI: "A high-level venture strategist. Focus on scaling and massive growth.",
      IdeaValidatorAI: "A skeptical market analyst. Use 2026 data to find flaws in the business model.",
      MarketingAI: "A growth hacker. Focus on virality, 2026 social trends, and customer acquisition.",
      LawyerAI: "A legal expert. Focus on protection, liability, and current 2026 digital regulations.",
      AccountantAI: "A profit specialist. Focus on margins, tax set-asides, and 'Chaching' revenue.",
      SecretaryAI: "An accountability officer. Focus on the schedule and the 4-hour daily commitment.",
      CoachAI: "A performance psychologist. Focus on grit, mental clarity, and the 'thick and thin'."
    };

    const result = await streamText({
      // 2026 Production Model
      model: google('gemini-3-flash'),
      system: `
        You are currently acting as ${agent}: ${boardDefinitions[agent] || 'Expert Advisor'}.
        
        PROJECT DATA:
        - Founder's Idea: "${idea}"
        - Current Timeline: Day ${currentDay} of 30.
        - Commitment: ${focusHours} hours/day.
        
        EXECUTIVE INSTRUCTIONS:
        1. Adopt the specific persona of ${agent} perfectly.
        2. Be fun, straightforward, and strategic. 
        3. Every response must tell the founder exactly how to spend their ${focusHours} hours TODAY.
        4. Reference the 30-day "Chaching" launch goal.
        5. Provide a "Chaching Checklist" item at the end of every response.
      `,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Board Connection Error:', error);
    return new Response(JSON.stringify({ error: "The Board is currently in a meeting. Try again in 5 seconds." }), { status: 500 });
  }
}
