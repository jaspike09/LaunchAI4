import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { message, agent, idea } = req.body;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Use gemini-1.5-flash and force the stable v1 API version
        const model = genAI.getGenerativeModel(
            { model: "gemini-1.5-flash" }, 
            { apiVersion: 'v1' }
        );

        const prompt = `Context: Startup Idea is "${idea}". 
                        Role: You are ${agent}, a world-class startup expert. 
                        Task: Respond to the founder's message: "${message}"`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return res.status(200).json({ text: response.text() });

    } catch (error) {
        console.error("Gemini Error:", error);
        return res.status(500).json({ text: "Board signal lost.", details: error.message });
    }
}
