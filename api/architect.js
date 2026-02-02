import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Use the API Key from Vercel Environment Variables
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    /**
     * FIX: We use 'gemini-1.5-flash-latest'. 
     * This ID is specifically designed to work across v1 and v1beta 
     * without triggering the 404 mismatch.
     */
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const { message, agent, idea } = req.body;

    const prompt = `You are ${agent} on the GEMS Board for "${idea}". 
    Evaluate this: ${message}. 
    Provide a score out of 100 and brief, professional advice.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ text });
  } catch (error) {
    console.error("GEMS_ERROR:", error);
    res.status(500).json({ error: error.message });
  }
}
