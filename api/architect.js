import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const { message, agent, idea } = req.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ text: "System Error: API Key missing." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // FORCE the stable v1 version to avoid 404s
        const model = genAI.getGenerativeModel(
            { model: "gemini-1.5-flash" }, 
            { apiVersion: 'v1' } 
        );

        const prompt = `Context: Startup Idea is "${idea}". 
                        Role: You are ${agent}, a world-class startup expert and board member. 
                        Task: Provide a sharp, executive-level response to the founder's message: "${message}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ text });

    } catch (error) {
        console.error("Gemini Backend Error:", error);
        return res.status(500).json({ 
            text: "The board is currently in a closed session. Check your connection or API limits.",
            details: error.message 
        });
    }
}
