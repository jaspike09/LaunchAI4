
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { messages, agent, idea, capital, hours } = await req.json();

    // Personalities hardcoded here so we don't need external files
    const personas = {
      MentorAI: "Lead Strategy Advisor. Brutal, direct, and growth-focused.",
      MarketingAI: "Growth Hacker. Expert in 2026 virality and social arbitrage.",
      LawyerAI: "Risk Mitigator. Focused on liability, IP, and legal traps.",
      AccountantAI: "CFO. Focused on burn rate, ROI, and financial efficiency."
    };

    const systemPrompt = `You are ${agent} on the GEMS Board. 
    Mission: "${idea || 'Classified Venture'}". 
    Founder Stats: $${capital || 0} budget, ${hours || 0} hrs/week.
    Persona: ${personas[agent] || personas.MentorAI}
    Instructions: Be concise. Be blunt. Give 2026-specific advice.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return new Response(JSON.stringify({ error: error.error.message }), { status: 500 });
    }

    // Direct stream piping - No 'ai' or '@ai-sdk' dependencies needed
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: "Uplink Lost: " + error.message }), { status: 500 });
  }
}
