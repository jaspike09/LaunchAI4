// 1. CONFIGURATION & INITIALIZATION
const SUPABASE_URL = 'https://yvgzyymjymrgjhhthgtj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Z3p5eW1qeW1yZ2poaHRoZ3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTc1MzIsImV4cCI6MjA4NTU3MzUzMn0.814FVde267XILaw-VA76Yuk6Y6BVQpCr_5fAF2KtBFw';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentAgent = "CoachAI";

/**
 * Checks if the user is authenticated. 
 * Redirects to auth.html if not.
 */
async function checkUser() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        window.location.href = 'auth.html';
        return null;
    }
    document.getElementById('userNameDisplay').innerText = user.email.split('@')[0];
    return user;
}

/**
 * Loads user data from Supabase and initializes the UI
 */
async function init() {
    const user = await checkUser();
    if (!user) return;

    // Load Profile from Cloud
    const { data, error } = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (data) {
        document.getElementById('ideaDisplay').innerText = data.business_idea || "Your Venture";
        if (data.mission_statement) {
            // Update the welcome message with the actual mission statement
            const missionText = document.querySelector('#overview p.text-slate-300');
            if (missionText) missionText.innerText = data.mission_statement;
        }
    } else {
        // Fallback to localStorage if new user
        const localIdea = localStorage.getItem('userBusinessIdea') || "Your Venture";
        document.getElementById('ideaDisplay').innerText = localIdea;
        // Seed the cloud with the local idea if it exists
        if (localIdea !== "Your Venture") saveToCloud(localIdea, "idea");
    }

    updateUIFromHistory();
}

// 2. CORE MESSAGING ENGINE
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const chatBox = document.getElementById('chatBox');
    const text = input.value.trim();
    if (!text) return;

    // UI: User Message
    chatBox.innerHTML += `<div class="bg-white/5 p-4 rounded-2xl text-right mb-4 ml-12"><p class="text-slate-200">${text}</p></div>`;
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    // UI: Loader
    const loaderId = "loader-" + Date.now();
    chatBox.innerHTML += `<div id="${loaderId}" class="text-blue-500 text-xs animate-pulse p-2 uppercase">Board is deliberating...</div>`;

    try {
        const response = await fetch('/api/architect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: text, 
                agent: currentAgent, 
                idea: document.getElementById('ideaDisplay').innerText 
            })
        });
        const data = await response.json();
        document.getElementById(loaderId)?.remove();

        // UI: AI Response
        chatBox.innerHTML += `
            <div class="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl mb-4 mr-12">
                <p class="text-sm font-bold text-blue-400 mb-1">${currentAgent}:</p>
                <p class="text-slate-200">${data.text}</p>
            </div>`;
        
        // Save locally for UI progress
        saveBoardContext(currentAgent, data.text);

        // Save to Cloud if it's an executive summary
        if (currentAgent === 'SecretaryAI' || currentAgent === 'CoachAI') {
            saveToCloud(data.text, "mission");
        }

    } catch (err) {
        if(document.getElementById(loaderId)) {
            document.getElementById(loaderId).innerText = "Connection to GEMS Board lost.";
        }
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 3. DATABASE & PERSISTENCE
async function saveToCloud(content, type = "mission") {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    const updateData = { id: user.id, updated_at: new Date() };
    if (type === "idea") updateData.business_idea = content;
    else updateData.mission_statement = content;

    const { error } = await _supabase.from('profiles').upsert(updateData);
    if (error) console.error("Cloud Sync Error:", error.message);
}

function saveBoardContext(agent, dialogue) {
    let history = JSON.parse(localStorage.getItem('gems_history') || '[]');
    history.push({ agent, text: dialogue, timestamp: new Date().toISOString() });
    localStorage.setItem('gems_history', JSON.stringify(history));
    updateUIFromHistory();
}

function updateUIFromHistory() {
    const history = JSON.parse(localStorage.getItem('gems_history') || '[]');
    const uniqueAgents = new Set(history.map(h => h.agent)).size;
    const total = 6;
    const pct = Math.round((uniqueAgents / total) * 100);

    const bar = document.getElementById('progressBar');
    const pctText = document.getElementById('progressPctText');
    const taskText = document.getElementById('taskCountText');

    if(bar) bar.style.width = pct + '%';
    if(pctText) pctText.innerText = pct + '%';
    if(taskText) taskText.innerText = `${uniqueAgents} / ${total}`;
}

// 4. UI NAVIGATION
function openChat(agent) {
    currentAgent = agent;
    showSection('chatArea');
    const chatBox = document.getElementById('chatBox');
    
    let greeting = `Standing by for ${agent} protocols.`;
    if(agent === 'AccountantAI') greeting = "Ready for fiscal audit. Should we start with your **$Burn Rate$**?";
    
    chatBox.innerHTML = `<div class="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl mb-4"><p class="text-sm font-bold text-blue-400 mb-1">${agent}:</p><p class="text-slate-200">${greeting}</p></div>`;
}

function showSection(id) {
    ['overview', 'roadmap', 'chatArea'].forEach(s => document.getElementById(s).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active-link'));
    const activeLink = document.getElementById('link-' + id);
    if(activeLink) activeLink.classList.add('active-link');
    
    document.getElementById('sectionTitle').innerText = id === 'chatArea' ? currentAgent : id.charAt(0).toUpperCase() + id.slice(1);
}

function adminReset() {
    if (confirm("Reset everything?")) { 
        localStorage.clear(); 
        _supabase.auth.signOut().then(() => window.location.href = 'index.html');
    }
}

// 5. EVENT LISTENERS
document.getElementById('chatInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

// Run the engine
init();
