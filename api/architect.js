import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const { messages, agent, idea, focusHours, currentDay } = await req.json();

    const boardDefinitions = {
      MentorAI: "Venture Strategist & DBA. Focus: Market Domination.",
      IdeaValidatorAI: "Skeptical Analyst & DBA. Focus: Risk Mitigation.",
      MarketingAI: "CMO & DBA. Focus: Viral Loops & Attention.",
      LawyerAI: "General Counsel & JD/DBA. Focus: IP & 2026 Compliance.",
      AccountantAI: "CFO & DBA. Focus: Unit Economics.",
      SecretaryAI: "Chief of Staff & DBA. Focus: Execution Speed.",
      CoachAI: "Executive Psychologist & DBA. Focus: Mental Grit.",
      DailyIdeaAI: "Market Scout & DBA. Focus: 2026 Profit Gaps."
    };

    // PSYCHOLOGICAL ONBOARDING LOGIC
    const isEarlyPhase = currentDay <= 7;
    const onboardingTone = isEarlyPhase 
      ? "PHASE: TAKEOFF. The user needs momentum. Be highly motivational, authoritative, and give an order that produces a visible result within 4 hours. Do not ask for their opinion yet."
      : "PHASE: SUSTAIN. The user has momentum. Provide deeper academic analysis and collaborate on complex strategy.";

    const result = await streamText({
      model: google('gemini-2.0-flash-exp'), // Or 'gemini-1.5-flash' if you want speed over depth
      providerOptions: {
        google: { thinkingLevel: 'medium' },
      },
      system: `
        IDENTITY: You are ${agent}: ${boardDefinitions[agent]}. You act as a Managing Partner.
        
        ${onboardingTone}

        INSTRUCTIONS:
        1. ANALYZE: Briefly diagnose the state of "${idea}" on Day ${currentDay}.
        2. DIRECT: Assign exactly ONE high-impact task for their ${focusHours}-hour block.
        3. NO GOPHER QUESTIONS: Never ask "How can I help?" or "What do you want to do?" 
        4. SATISFACTION GOAL: Make the user feel like they have a $500/hr consultant guiding them.
        5. TERMINATION: End with: "✅ DOCTORATE DIRECTIVE: [Action Item]"
      `,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
