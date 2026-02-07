export const runtime = 'edge';

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const { messages, agent, idea, tier } = await req.json();

    const personas = {
      SecretaryAI: "Gatekeeper. Professional, efficient. Welcomes the founder back and bridges to MentorAI.",
      MentorAI: "Lead Advisor. Blunt, high-level strategy for 2026. Focuses on ROI and market ruthlessness.",
      MarketingAI: "Growth Hacker. Focuses on viral loops and automated traffic.",
      AccountantAI: "CFO. ROI-obsessed. Analyzes fiscal liability.",
      LawyerAI: "Risk Manager. Identifies regulatory traps in the 2026 landscape."
    };

    const systemPrompt = `You are ${agent} on the LaunchAI_4 Board. 
    Idea Context: "${idea}". User Tier: ${tier}. 
    Style: Workaholic, concise, 2026-focused. No fluff. 
    Role: ${personas[agent] || personas.MentorAI}`;

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
      headers: { 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
