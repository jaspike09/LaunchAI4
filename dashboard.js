const SUPABASE_URL = 'https://yvgzyymjymrgjhhthgtj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Z3p5eW1qeW1yZ2poaHRoZ3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTc1MzIsImV4cCI6MjA4NTU3MzUzMn0.814FVde267XILaw-VA76Yuk6Y6BVQpCr_5fAF2KtBFw';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentAgent = "CoachAI";

// Security Check: Ensure user is logged in
async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        window.location.href = 'auth.html';
    } else {
        document.getElementById('userNameDisplay').innerText = user.email.split('@')[0];
    }
}

(function init() {
    checkUser();
    const idea = localStorage.getItem('userBusinessIdea') || "Your Venture";
    document.getElementById('ideaDisplay').innerText = idea;
    updateUIFromHistory();
})();

// ... (Rest of your sendMessage, openChat, and updateUI functions here) ...

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const chatBox = document.getElementById('chatBox');
    const text = input.value.trim();
    if (!text) return;

    chatBox.innerHTML += `<div class="bg-white/5 p-4 rounded-2xl text-right mb-4 ml-12"><p class="text-slate-200">${text}</p></div>`;
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    const loaderId = "loader-" + Date.now();
    chatBox.innerHTML += `<div id="${loaderId}" class="text-blue-500 text-xs animate-pulse p-2 uppercase">Processing...</div>`;

    try {
        const response = await fetch('/api/architect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: text, 
                agent: currentAgent, 
                idea: localStorage.getItem('userBusinessIdea') 
            })
        });
        const data = await response.json();
        document.getElementById(loaderId)?.remove();

        chatBox.innerHTML += `<div class="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl mb-4 mr-12">
            <p class="text-sm font-bold text-blue-400 mb-1">${currentAgent}:</p>
            <p class="text-slate-200">${data.text}</p>
        </div>`;
        
        saveBoardContext(currentAgent, data.text);
    } catch (err) {
        document.getElementById(loaderId).innerText = "Board Offline.";
    }
}
async function saveToCloud(ideaText) {
    const { data: { user } } = await _supabase.auth.getUser();
    
    if (user) {
        const { error } = await _supabase
            .from('profiles')
            .upsert({ 
                id: user.id, 
                business_idea: ideaText, 
                updated_at: new Date() 
            });
            
        if (error) console.error("Cloud Save Error:", error);
        else console.log("Business Vision Secured in Cloud.");
    }
}
