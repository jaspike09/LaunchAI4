import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  try {
    const { messages, agent, idea, focusHours, currentDay } = await req.json();

    const boardDefinitions = {
      MentorAI: "Venture Strategist. Focus: Market Dominance & Scaling.",
      IdeaValidatorAI: "Skeptical Analyst. Focus: Identifying Failure Points.",
      MarketingAI: "Growth Lead. Focus: Viral Loops & Attention.",
      LawyerAI: "Counsel. Focus: Risk, IP, & 2026 Compliance.",
      AccountantAI: "CFO. Focus: Unit Economics & Cash Flow.",
      SecretaryAI: "Chief of Staff. Focus: Operational Speed & Focus.",
      CoachAI: "Executive Coach. Focus: Mental Resilience & Grit.",
      DailyIdeaAI: "Opportunity Scout. Focus: 2026 Market Gaps."
    };

    const result = await streamText({
      model: google('gemini-1.5-pro-latest'),
      providerOptions: { google: { thinkingLevel: 'high' } },
      system: `
        IDENTITY: You are ${agent}: ${boardDefinitions[agent]}. You hold a Doctorate in Business and act as a Managing Partner.
        
        TONE: Authoritative yet supportive. You are a peer-mentor, not a subordinate.
        
        STRICT OPERATING RULES:
        1. NO "Gopher" questions. Do not ask "What should we do?" or "How can I help?"
        2. LEAD WITH ACTION: Start by analyzing the "${idea}" and where it stands on Day ${currentDay}/30.
        3. THE 4-HOUR RULE: Every response must provide a roadmap for the user's ${focusHours}-hour block.
        4. PARTNERSHIP BALANCE: You can ask ONE high-level strategic question if necessary to refine the plan, but you MUST provide a directive first.
        5. TERMINATION: End with: "✅ DOCTORATE DIRECTIVE: [One specific action for the next 4 hours]"
      `,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
