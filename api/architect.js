import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY");
    return res.status(500).json({ text: "Server configuration error." });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    const { message, agent, idea } = req.body;
    
    // UPDATED FOR 2026 STABILITY
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `You are the ${agent} for ${idea}. ${message}` }] }],
    });
    
    const response = await result.response;
    const aiText = response.text();

    res.status(200).json({ text: aiText });

  } catch (error) {
    console.error("GEMINI_API_ERROR:", error.message);
    res.status(500).json({ text: "The Board is currently unavailable. Error: " + error.message });
  }
}
