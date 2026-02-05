import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';
export const config = {
  runtime: 'edge',
};

// ... rest of your code
export default async function handler(req) {
// Inside your API files:
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Matches your Vercel key!

const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { text } = await generateText({
      // FIX: Using the versioned string to prevent 404
      model: google('gemini-1.5-pro'), 
      system: `
        You are the Opportunity Scout & Managing Partner. 
        TONE: Authoritative, elite, and execution-focused.
        MISSION: Generate a 2026 business gap. 
        MANDATE: Do not ask questions. Provide a direct 4-hour execution plan.
        TERMINATION: You must end with: "✅ DOCTORATE DIRECTIVE: [Action Item]"
      `,
      prompt: "Identify today's highest-leverage venture opportunity.",
    });

    const { data, error } = await supabase
      .from('daily_ideas')
      .insert([{ content: text }])
      .select();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, idea: data[0] }), { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
