import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, agent, idea } = req.body;

    // 1. Validate API Key exists
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ text: "Backend Error: Missing GEMINI_API_KEY environment variable." });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // 2. Explicitly use v1 and the flash model
        const model = genAI.getGenerativeModel(
            { model: "gemini-1.5-flash" }, 
            { apiVersion: 'v1' }
        );

        const prompt = `
            You are ${agent}, an elite startup consultant.
            Founder's Business Idea: ${idea}
            User Message: ${message}
            Instructions: Provide a concise, high-level strategic response.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ text });

    } catch (error) {
        console.error("Gemini System Error:", error);
        return res.status(500).json({ 
            text: "The Board is unreachable. Check Vercel logs.", 
            details: error.message 
        });
    }
}
