export default async function handler(req) {
  // 1. Fetch all founders who haven't logged in today
  const { data: slackers } = await supabase
    .from('profiles')
    .select('phone, last_login, business_idea')
    .lt('last_login', new Date().toISOString().split('T')[0]);

  // 2. Loop through and send the "Chase" message via Twilio/SMS
  for (let founder of slackers) {
    console.log(`SecretaryAI Alert sent to: ${founder.phone}`);
    // await twilio.messages.create({ 
    //    body: `Founder! The Board is waiting on the "${founder.business_idea}" plan. Log in now!`, 
    //    to: founder.phone 
    // });
  }
  
  return new Response("Accountability check complete.");
}
