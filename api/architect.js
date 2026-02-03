// api/architect.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Initialize Gemini with your Vercel Environment Variable
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  try {
    const { message, agent, idea } = req.body;

    // 3. Select the model (Flash is fastest for a "Board of Directors" chat)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 4. The System Prompt (Tells the AI how to act)
    const prompt = `
      You are the ${agent} (Board Member) for a startup.
      The startup idea is: "${idea}".
      
      User's Message: "${message}"
      
      Your Role: Provide a sharp, executive-level response as a ${agent}. 
      Keep it to 2-3 sentences. Be critical but constructive.
      Start your response with a "Viability Score: X/100".
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiText = response.text();

    // 5. Send the AI's wisdom back to the dashboard
    return res.status(200).json({ text: aiText });

  } catch (error) {
    console.error("Gemini Error:", error);
    return res.status(500).json({ error: "The Board is offline. Check Vercel logs." });
  }
}
