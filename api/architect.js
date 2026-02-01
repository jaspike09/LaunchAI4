export default async function handler(req, res) {
  // Ensure we are getting the data from the front-end
  const { message, idea, day } = JSON.parse(req.body);
  const apiKey = process.env.GEMINI_API_KEY;

  try {
    // 1. THE TRIAGE: Decide which GEM speaks
    const triagePrompt = `You are the Lead Orchestrator for LaunchAI.
    Founder Message: "${message}"
    Assign this to ONE GEM: Mentor, Coach, Secretary, Accountant, Lawyer, Marketing.
    Respond with ONLY the name.`;

    const triageRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: triagePrompt }] }] })
    });
    const triageData = await triageRes.json();
    const assignedRole = triageData.candidates[0].content.parts[0].text.trim();

    // 2. THE RESPONSE: The chosen GEM answers
    const executionPrompt = `You are the ${assignedRole} for LaunchAI. 
    Project: ${idea}. Day: ${day}.
    Founder: "${message}"
    Provide a concise, high-impact response in your specific persona.`;

    const finalRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: executionPrompt }] }] })
    });
    const finalData = await finalRes.json();

    // 3. RETURN DATA: Matches your sendMessage() function exactly
    res.status(200).json({
      role: assignedRole,
      text: finalData.candidates[0].content.parts[0].text
    });

  } catch (error) {
    res.status(500).json({ error: "Architect Offline", details: error.message });
  }
}
