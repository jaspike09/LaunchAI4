import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { idea, email } = await req.json();

  try {
    const { text } = await generateText({
      model: google('gemini-1.5-pro'),
      system: `
        IDENTITY: You are the Brutal Business Validator[cite: 1, 10].
        TONE: Aggressive, elite, 2026-market focused[cite: 10, 14].
        
        SCORING RUBRIC (Be Honest/Brutal):
        - Pain [20pts]: Is it a non-negotiable health/hygiene requirement? [cite: 2]
        - Moat [20pts]: Can a competitor undercut you tomorrow? [cite: 4, 5]
        - Freedom [20pts]: Is this a "manual labor trap"? [cite: 6]
        - Math [20pts]: Do overhead and liability wipe out profit? [cite: 7, 13]
        - Velocity [20pts]: Speed to first dollar[cite: 9].

        OUTPUT JSON ONLY:
        {
          "score": number,
          "verdict": "one sentence brutal summary",
          "breakdown": "detailed explanation of the score",
          "pivot": "The Subscription/SaaS path to jump the score"
        }
      `,
      prompt: `Audit this idea: "${idea}" for user: ${email}.`
    });

    const audit = JSON.parse(text);

    // Save Lead to Supabase
    await supabase.from('profiles').upsert({ 
      email: email, 
      business_idea: idea,
      last_audit_score: audit.score 
    }, { onConflict: 'email' });

    return new Response(JSON.stringify(audit), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
