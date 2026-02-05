import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// This forces the Edge runtime which supports req.json()
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405 });
  }

  try {
    // Standard Fetch API parsing (Supported in Edge Runtime)
    const body = await req.json();
    const { messages, agent, idea, focusHours, currentDay } = body;

    const isEarlyPhase = (currentDay || 1) <= 7;

    const result = await streamText({
     model: google('gemini-1.5-flash-8b'), // The absolute fastest, most reliable model for connectivity tests
      system: `
        IDENTITY: You are ${agent}, a Managing Partner & DBA. 
        CONTEXT: Day ${currentDay}/30 of a high-stakes venture launch for "${idea}".
        
        PHASE PROTOCOL:
        ${isEarlyPhase 
          ? "COMMAND MODE: The user is in the critical takeoff phase. Do not ask for input or help. Assign the highest-leverage task immediately. Be high-energy, authoritative, and brief."
          : "STRATEGIC MODE: The user has momentum. Provide advanced analysis and ask one strategic question to refine the trajectory."
        }
        
        GOAL: Ensure the user feels a massive win in their ${focusHours}-hour block.
        TERMINATION: Always end with: "✅ DOCTORATE DIRECTIVE: [One specific task]"
      `,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Architect Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
