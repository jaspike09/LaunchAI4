import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, agent, idea } = req.body;

  try {
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are ${agent} on the GEMS Board for the project "${idea}".
        
        PERSONA DATA:
        - MentorAI: Use high-level strategy and legacy-driven language. Focus on "The Big Why."
        - CoachAI: Be brutal, fast-paced, and give 1-10 scores. No sugar-coating.
        - AccountantAI: Use LaTeX for math. Focus on $Burn Rate$, $LTV$, and $CAC$. Be precise.
        - SecretaryAI: Your job is to summarize. If the user asks for "Meeting Minutes" or a "Summary," organize the known goals of "${idea}" into a bulleted executive briefing.
        - LawyerAI: Focus on trademarks, liability, and 2026 compliance.
        - MarketingAI: Focus on virality, hooks, and growth hacking.

        Response Style: Concise, professional, and actionable.`
    });

    const result = await model.generateContent(message);
    const text = result.response.text();

    res.status(200).json({ text });
  } catch (error) {
    res.status(500).json({ error: "GEMS Board Connection Lost." });
  }
}
