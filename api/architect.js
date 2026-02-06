export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { messages, agent, idea, capital, hours } = await req.json();

    const systemPrompt = `You are ${agent} on the LaunchAI-4 GEMS Board. 
    The venture vision is: "${idea}". 
    The founder has ${capital} capital and ${hours} hours/week.
    Give blunt, high-leverage advice for the year 2026.`;

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
      const errorData = await response.json();
      console.error("OpenAI Error:", errorData);
      return new Response(JSON.stringify({ error: "OpenAI Uplink Failed" }), { status: 500 });
    }

    // This pipes the OpenAI stream directly back to your Dashboard.html
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error("Architect AI Error:", error);
    return new Response(JSON.stringify({ error: "Uplink Lost." }), { status: 500 });
  }
}
