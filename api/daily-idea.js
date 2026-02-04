import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req) {
  // 1. Safety Check: Ensure keys exist before trying to use them
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new Response(JSON.stringify({ 
      error: "System Configuration Missing: Check Vercel Environment Variables." 
    }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 2. Generate the Idea
    const { text } = await generateText({
      model: google('gemini-3-flash'),
      system: "You are the IdeaValidatorAI. Identify a high-profit 2026 business opportunity.",
      prompt: "Give me one business idea for today. Keep it punchy and actionable.",
    });

    // 3. Save to Database
    const { data, error } = await supabase
      .from('daily_ideas')
      .insert([{ content: text }])
      .select();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, data }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Worker Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
