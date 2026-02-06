import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  runtime: 'edge', // Using Edge for faster streaming
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { messages, agent, idea, capital, hours } = await req.json();

    // The "System Prompt" defines the AI's personality based on the GEMS Board member selected
    const systemPrompt = `You are ${agent} on the LaunchAI-4 GEMS Board. 
    The venture vision is: "${idea}". 
    The founder has ${capital} capital and ${hours} hours/week.
    Give blunt, high-leverage advice for the year 2026.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Faster and cheaper for 2026 audits
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
    });

    // Create a ReadableStream to pipe the AI tokens directly to your dashboard
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || "";
          controller.enqueue(encoder.encode(content));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("Architect AI Error:", error);
    return new Response(JSON.stringify({ error: "Uplink Lost." }), { status: 500 });
  }
}
