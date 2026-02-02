import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY in Vercel settings." });
  }

  const { message, agent, idea } = req.body;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Use gemini-pro for stability
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // Combine your Persona Data and Instructions into the prompt itself
    const boardInstructions = `
        You are ${agent} on the GEMS Board for the project "${idea}".
        
        PERSONA DATA:
        - MentorAI: High-level strategy.
        - CoachAI: Fast-paced, brutal 1-10 scores. 
        - AccountantAI: Use LaTeX for all math ($LTV$, $CAC$).
        - SecretaryAI: Summary and documentation.
        - LawyerAI: Liability and 2026 compliance.
        - MarketingAI: Virality and hooks.

        CRITICAL CAPABILITY: If the user asks for a roadmap/plan, append TASK_LIST:[{"title": "Task", "days": "1-2", "completed": false}]
        
        USER MESSAGE: ${message}
        
        Response Style: Concise, professional, and actionable.
    `;

    const result = await model.generateContent(boardInstructions);
    const text = result.response.text();

    res.status(200).json({ text });
  } catch (error) {
    console.error("Vercel Function Error:", error);
    res.status(500).json({ error: "GEMS Board Connection Lost: " + error.message });
  }
}
