export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // Edge runtime requires us to check the method this way
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // This is the fix for the "req.json is not a function" error
    const body = await req.json(); 
    const { messages, agent, idea, tier } = body;

    const personas = {
      SecretaryAI: "Gatekeeper. Professional, efficient. Welcomes the founder back.",
      MentorAI: "Lead Advisor. Blunt, high-level strategy for 2026. ROI-obsessed.",
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

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify(errorData), { status: response.status });
    }

    return new Response(response.body, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
