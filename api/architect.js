import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ text: "API Key missing in Vercel." });

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { message, agent, idea } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const result = await model.generateContent(`Role: ${agent}. Project: ${idea}. Query: ${message}`);
    const response = await result.response;
    const aiText = response.text();

    res.status(200).json({ text: aiText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ text: "The board is offline: " + error.message });
  }
}
