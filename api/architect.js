// This tells Vercel to use the high-speed Edge runtime
export const config = {
  runtime: 'edge',
};

// We use "export async function POST" to match the Web Standard signature
export async function POST(req) {
  try {
    // In this modern signature, req.json() WILL work
    const { messages, agent, idea, tier } = await req.json();

    const personas = {
      SecretaryAI: "Gatekeeper. Professional, efficient.",
      MentorAI: "Lead Advisor. Blunt, high-level strategy for 2026.",
      MarketingAI: "Growth Hacker. Focuses on viral loops.",
      AccountantAI: "CFO. Analyzes fiscal liability.",
      LawyerAI: "Risk Manager. Identifies regulatory traps."
    };

    const systemPrompt = `You are ${agent} on the LaunchAI_4 Board. Idea: "${idea}". Tier: ${tier}. Style: Workaholic, concise. Role: ${personas[agent] || personas.MentorAI}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        stream: true,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      }),
    });

    // Return the stream directly to the browser
    return new Response(response.body, {
      headers: { 
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
