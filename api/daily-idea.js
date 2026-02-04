import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req) {
  // 1. VALIDATION GUARD: Check for keys before doing anything
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return new Response(
      JSON.stringify({ 
        error: "Server Configuration Missing: Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in Vercel/Environment variables." 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. INITIALIZE CLIENT INSIDE HANDLER
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    // 3. GENERATE 2026 BUSINESS IDEA
    const { text } = await generateText({
      model: google('gemini-3-flash'), // Optimized for 2026 performance
      system: `You are the IdeaValidatorAI. You specialize in identifying 2026 market gaps. 
               Focus on high-profit, zero-down-payment micro-SaaS or service businesses.`,
      prompt: "Generate one actionable business idea for today. Break it down into: 1. The Concept, 2. The 2026 Revenue Why, and 3. Your first 3 steps to start.",
    });

    // 4. PERSIST TO DATABASE
    const { error } = await supabase
      .from('daily_ideas')
      .insert([{ 
          content: text, 
          created_at: new Date().toISOString() 
      }]);

    if (error) throw error;

    // 5. SUCCESS RESPONSE
    return new Response(JSON.stringify({ 
      success: true, 
      timestamp: new Date().toISOString(),
      idea_preview: text.substring(0, 100) + "..." 
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error("Board Error:", error.message);
    return new Response(JSON.stringify({ error: "Executive Board Offline: " + error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
