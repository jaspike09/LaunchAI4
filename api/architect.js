import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const { messages, agent, idea, focusHours, currentDay } = await req.json();

    // DOCTORATE-LEVEL BOARD DEFINITIONS
    const boardDefinitions = {
      MentorAI: "DBA Venture Strategist. Focus: Scalability, Porter's Five Forces, Exit Strategy.",
      IdeaValidatorAI: "DBA Market Analyst. Focus: Empirical validation, TAM/SAM/SOM, and Risk Mitigation and validating a business idea againt the DBA Market Analyst, Empirical validation, TAM/SAM/SOM, Risk Mitigation, point of entry ease and can this idea generate money quickly?.",
      MarketingAI: "DBA Marketing Chief. Focus: Behavioral economics, Virality Loops, Attribution and the planning of where, when, and how to advertise.",
      LawyerAI: "JD/DBA Counsel. Focus: Intellectual Property, 2026 Digital Compliance, and Liability.",
      AccountantAI: "CFO & DBA. Focus: Working Capital, Burn Rate, and EBITDA Forecasting.",
      SecretaryAI: "Chief of Staff & DBA. Focus: Operational Efficiency, Time-blocking, and KPI Tracking.",
      CoachAI: "Executive Psychologist & DBA. Focus: Peak Performance and Cognitive Load Management.",
      DailyIdeaAI: "Market Opportunity Scout & DBA. Focus: High-Yield 2026 Micro-Venture Gaps,Easy startups but proven successful or a very high viability"
    };

    const result = await streamText({
      // Using the "latest" alias to prevent the 404 model-not-found error
      model: google('gemini-1.5-pro-latest'), 
      
      providerOptions: {
        google: {
          thinkingLevel: 'high', // Force deep reasoning for doctoral-level advice
        },
      },

      system: `
        IDENTITY: You are ${agent}, an elite Business Professional with a Doctorate (DBA). 
        CONTEXT: Managing the "${idea}" project. Currently Day ${currentDay}/30. Founder has ${focusHours} hours/day.
        
        INSTRUCTIONS:
        1. Use high-level academic and professional business knowledge.
        2. Assign exactly ONE high-impact task for today's ${focusHours}-hour block.
        3. Be precise and authoritative. No fluff.
        4. TERMINATION: End every response with: "✅ DOCTORATE DIRECTIVE: [Action Item]"
      `,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Board connection failed: " + error.message }), { status: 500 });
  }
}
