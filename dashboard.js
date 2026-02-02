// 1. CONFIG & INITIALIZATION
const SUPABASE_URL = 'https://yvgzyymjymrgjhhthgtj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Z3p5eW1qeW1yZ2poaHRoZ3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTc1MzIsImV4cCI6MjA4NTU3MzUzMn0.814FVde267XILaw-VA76Yuk6Y6BVQpCr_5fAF2KtBFw';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentAgent = "CoachAI";

/**
 * Validates session and initializes cloud data
 */
async function init() {
    const { data: { user } } = await _supabase.auth.getUser();
    
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }

    // Update UI Profile Name
    document.getElementById('userNameDisplay').innerText = user.email.split('@')[0];

    // Check for "God Mode" / Architect Tier
    if (localStorage.getItem('launchAI_GodMode') === 'true') {
        document.getElementById('adminReset').classList.remove('hidden');
        document.getElementById('tierBadge').innerText = "A";
        document.getElementById('tierBadge').className = "w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs shadow-lg shadow-purple-500/20";
        document.getElementById('tierName').innerText = "Architect Tier";
    }

    // Load Data from Supabase Profiles table
    const { data, error } = await _supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (data) {
        document.getElementById('ideaDisplay').innerText = data.business_idea || "Your Venture";
        if (data.mission_statement) {
            document.getElementById('missionDisplay').innerText = data.mission_statement;
        }
    } else {
        // Fallback to LocalStorage if Cloud is empty
        const localIdea = localStorage.getItem('userBusinessIdea') || "Your Venture";
        document.getElementById('ideaDisplay').innerText = localIdea;
        if (localIdea !== "Your Venture") saveToCloud(localIdea, "idea");
    }

    updateUIFromHistory();
}

// 2. MESSAGING LOGIC
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const chatBox = document.getElementById('chatBox');
    const text = input.value.trim();
    if (!text) return;

    chatBox.innerHTML += `<div class="bg-white/5 p-4 rounded-2xl text-right mb-4 ml-12"><p class="text-slate-200">${text}</p></div>`;
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    const loaderId = "loader-" + Date.now();
    chatBox.innerHTML += `<div id="${loaderId}" class="text-blue-500 text-xs animate-pulse p-2 uppercase">GEMS Board processing...</div>`;

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

        chatBox.innerHTML += `
            <div class="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl mb-4 mr-12">
                <p class="text-sm font-bold text-blue-400 mb-1">${currentAgent}:</p>
                <p class="text-slate-200">${data.text}</p>
            </div>`;
        
        saveBoardContext(currentAgent, data.text);

        // Auto-Sync to Cloud if Agent gives summary/mission
        if (currentAgent === 'SecretaryAI' || currentAgent === 'CoachAI') {
            saveToCloud(data.text, "mission");
        }
    } catch (err) {
        if(document.getElementById(loaderId)) document.getElementById(loaderId).innerText = "Board Disconnected.";
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 3. DATA PERSISTENCE
async function saveToCloud(content, type = "mission") {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    const updateData = { id: user.id, updated_at: new Date() };
    if (type === "idea") updateData.business_idea = content;
    else updateData.mission_statement = content;

    const { error } = await _supabase.from('profiles').upsert(updateData);
    if (error) console.error("Cloud Error:", error.message);
    else console.log(`✅ ${type} synced.`);
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
    const pct = Math.round((uniqueAgents / 6) * 100);

    const bar = document.getElementById('progressBar');
    if(bar) bar.style.width = pct + '%';
    document.getElementById('progressPctText').innerText = pct + '%';
    document.getElementById('taskCountText').innerText = `${uniqueAgents} / 6`;
}

// 4. UI ACTIONS
function openChat(agent) {
    currentAgent = agent;
    showSection('chatArea');
    const chatBox = document.getElementById('chatBox');
    let msg = `Agent ${agent} initialized and ready for deployment.`;
    if(agent === 'AccountantAI') msg = "Balance sheet initialized. Define your current **runway** or **burn rate**.";
    
    chatBox.innerHTML = `<div class="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl mb-4"><p class="text-sm font-bold text-blue-400 mb-1">${agent}:</p><p class="text-slate-200">${msg}</p></div>`;
}

function showSection(id) {
    ['overview', 'roadmap', 'chatArea'].forEach(s => document.getElementById(s).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active-link'));
    const link = document.getElementById('link-' + id);
    if(link) link.classList.add('active-link');
    document.getElementById('sectionTitle').innerText = id === 'chatArea' ? currentAgent : id.charAt(0).toUpperCase() + id.slice(1);
}

async function logout() {
    await _supabase.auth.signOut();
    localStorage.clear();
    window.location.href = 'auth.html';
}

function adminReset() {
    if (confirm("Erase all data and reset authority?")) {
        _supabase.auth.signOut().then(() => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }
}

// 5. BOOTSTRAP
document.getElementById('chatInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
init();
