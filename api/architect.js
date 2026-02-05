import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { messages, agent, idea, focusHours, currentDay } = body;
    
    // Explicitly define the model outside the object to avoid bundling syntax errors
    const geminiModel = google('gemini-1.5-flash');

    const result = await streamText({
      model: geminiModel,
      system: `
        IDENTITY: You are ${agent || 'MentorAI'}, a Managing Partner & DBA. 
        CONTEXT: Day ${currentDay || 1}/30 for "${idea || 'Stealth Venture'}".
        
        PHASE PROTOCOL:
        ${(currentDay || 1) <= 7 
          ? "COMMAND MODE: The user is in takeoff. Do not ask for input. Assign the highest-leverage task immediately." 
          : "STRATEGIC MODE: Provide advanced analysis."
        }
        
        GOAL: Ensure a win in a ${focusHours || 4}-hour block.
        TERMINATION: Always end with: "✅ DOCTORATE DIRECTIVE: [One specific task]"
      `,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Runtime Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
