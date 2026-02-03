import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { message, agent, idea } = req.body;
    // We use gemini-2.0-flash-exp or gemini-1.5-flash
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Context: Startup idea is "${idea}". Role: You are the ${agent}. Question: ${message}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text });
  } catch (error) {
    console.error("Board Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
