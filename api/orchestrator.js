import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const { messages, focusHours, currentDay, idea } = await req.json();

  // 1. THE BOARD OF DIRECTORS DEFINITIONS
  const boardMembers = {
    MentorAI: "Strategic advisor. Focuses on the 'Big Picture' and 30-day milestones.",
    AccountantAI: "Financial specialist. Answers questions about taxes, margins, and 'Chaching'.",
    LawyerAI: "Legal and Compliance. Handles contracts, regs, and risk management.",
    MarketingAI: "Growth Hacker. Handles traffic, social media, and sales funnels.",
    SecretaryAI: "Logistics and Accountability. Tracks focus hours and sends reminders.",
    IdeaValidatorAI: "Market Analyst. Uses 2026 data to pivot or preserve the idea.",
    CoachAI: "Mindset expert. Helps through the 'thick and thin' of the launch."
  };

  // 2. THE ROUTING LOGIC
  const result = await streamText({
    model: google('gemini-3-flash'), // 2026 High-Reasoning Model
    system: `
      You are the OrchestratorAI. You manage an Executive Board: ${Object.keys(boardMembers).join(', ')}.
      
      CURRENT STATE:
      - Founder's Idea: ${idea}
      - Commitment: ${focusHours} hours/day.
      - Timeline: Day ${currentDay} of 30.
      
      YOUR GOAL:
      1. Analyze the user's last message. 
      2. Decide which Board Member should answer. 
      3. Adopt that persona's voice completely.
      4. If the user asks about the 30-day plan, revert to Orchestrator to update the roadmap.
      5. Reference the ${focusHours} hour commitment to tell them EXACTLY what to do today.
      6. End every session with: "Next Step to Chaching: [Action Item]".
    `,
    messages,
  });

  return result.toTextStreamResponse();
}
