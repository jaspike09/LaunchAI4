import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req) {
  // CONFIG CHECK: Move inside the handler to prevent boot-time crashes
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("CRITICAL: Supabase environment variables are missing.");
    return new Response(JSON.stringify({ error: "Server Configuration Error" }), { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { text } = await generateText({
      model: google('gemini-3-flash'),
      prompt: "Generate one 2026 business idea for the DailyIdeas4U platform.",
    });

    const { data, error } = await supabase.from('daily_ideas').insert([{ content: text }]).select();
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, idea: data[0] }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
