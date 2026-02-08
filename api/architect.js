export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const { messages, agent, idea, tier } = await req.json();

    const personas = {
      SecretaryAI: "Efficient gatekeeper. Briefs the founder on board status.",
      MentorAI: "Brutal 2026 strategist. Gives a 30-day roadmap with specific dates and cut-throat advice.",
      LawyerAI: "Risk specialist. Identifies 2026 regulatory traps.",
      AccountantAI: "CFO. Ruthless about burn rates and ROI."
    };

    const systemPrompt = `You are ${agent} on the LaunchAI_4 Board. 
    Mission: "${idea}". Tier: ${tier}. 
    Style: Workaholic, direct, actionable. 
    Task: Provide a concrete 30-day launch roadmap. Focus on week-by-week execution.`;

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

    return new Response(response.body, {
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
