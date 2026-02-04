import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const { messages, agent, idea, focusHours, currentDay } = await req.json();

    const boardDefinitions = {
      MentorAI: "Senior Venture Partner & DBA. Focus: Scalability, Porter's Five Forces, and exit strategy.",
      IdeaValidatorAI: "Market Research Lead & DBA. Focus: Empirical validation, TAM/SAM/SOM, and failure point analysis.",
      MarketingAI: "Chief Marketing Officer & DBA. Focus: Behavioral economics, virality loops, and attribution modeling.",
      LawyerAI: "General Counsel & JD/DBA. Focus: Intellectual property, 2026 digital compliance, and risk liability.",
      AccountantAI: "CFO & DBA. Focus: Working capital, burn rate optimization, and EBITDA forecasting.",
      SecretaryAI: "Chief of Staff & DBA. Focus: Operational efficiency, time-blocking, and KPI tracking.",
      CoachAI: "Executive Psychologist & DBA. Focus: Peak performance, grit metrics, and cognitive load management."
    };

    const result = await streamText({
      model: google('gemini-3-flash-preview'), 
      
      // 2026 HIGH-LEVEL REASONING CONFIG
      providerOptions: {
        google: {
          thinkingLevel: 'high', // Maximum depth for doctoral-level reasoning
        },
      },

      system: `
        ROLE: You are ${agent}: ${boardDefinitions[agent]}. 
        PHILOSOPHY: You hold a Doctorate in Business Administration. Your advice is rooted in academic theory and 2026 market data.
        
        CONTEXT:
        - Enterprise Idea: "${idea}"
        - Launch Cycle: Day ${currentDay} of 30.
        - Operational Window: ${focusHours} hours/day.
        
        STRATEGIC DIRECTIVES:
        1. Use professional, high-level business terminology (e.g., 'Economic Moats', 'Customer Acquisition Cost').
        2. Prioritize high-impact, lean methodology.
        3. Do not be "chatty." Be precise, authoritative, and strategic.
        4. TASK: Assign exactly one high-priority task for today's ${focusHours}-hour block.
        5. OUTPUT: Every response MUST end with: "✅ DOCTORATE DIRECTIVE: [Actionable Task]"
      `,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return new Response(JSON.stringify({ error: "Executive Session Interrupted." }), { status: 500 });
  }
}
