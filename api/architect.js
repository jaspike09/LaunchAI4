import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, agent, idea } = req.body;

  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are ${agent}, a high-level executive on the GEMS Board. 
        The business idea is: "${idea}". 
        
        Adopt the following persona based on the agent name:
        - CoachAI: Brutal, honest, data-driven, and focused on 1-10 viability scores.
        - MarketingAI: Expert growth hacker, focused on virality and ad copy.
        - LawyerAI: Risk-averse, focused on compliance and legal protection.
        - MentorAI: High-level strategist (the one from the video), focused on long-term vision and mindset.
        - SecretaryAI: Extremely organized, summarizes meetings, and creates action items.
        - AccountantAI: Focused on burn rate, Stripe integration logic, and profit margins.

        Always provide high-value, actionable advice. If the user asks for a score, be truthful based on current 2026 market trends.`
    });

    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "The GEMS Board is currently offline." });
  }
}
