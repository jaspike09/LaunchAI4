import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  }

  const { message, agent, idea } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // FIX: Switching to gemini-1.5-flash is required for 2026 stability
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are ${agent} on the GEMS Board for "${idea}". 
    Evaluate this: ${message}. 
    Provide a score out of 100 and brief, professional advice.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ text });
  } catch (error) {
    console.error("GEMS_LOG:", error);
    res.status(500).json({ error: error.message });
  }
}
