let currentAgent = "CoachAI";

/**
 * 1. INITIALIZATION
 */
(function init() {
    const isFounder = localStorage.getItem('launchAI_GodMode') === 'true';
    const isSubscribed = localStorage.getItem('isSubscribed') === 'true';
    const idea = localStorage.getItem('userBusinessIdea') || "Your Venture";

    if (!isFounder && !isSubscribed) {
        window.location.href = 'index.html?access=denied';
        return;
    }

    document.getElementById('ideaDisplay').innerText = idea;

    if (isFounder) {
        document.getElementById('adminReset').classList.remove('hidden');
        document.getElementById('userNameDisplay').innerText = "Architect";
        const badge = document.getElementById('tierBadge');
        badge.innerText = "A";
        badge.classList.replace('bg-blue-600', 'bg-purple-600');
        document.getElementById('tierName').innerText = "Architect Tier";
    }
    
    // Check for existing progress on load
    updateUIFromHistory();
    triggerInitialCritique(idea);
})();

/**
 * 2. CORE MESSAGING
 */
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

        chatBox.innerHTML += `<div class="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl mb-4 mr-12"><p class="text-sm font-bold text-blue-400 mb-1">${currentAgent}:</p><p class="text-slate-200">${data.text}</p></div>`;
        
        saveBoardContext(currentAgent, data.text);

    } catch (err) {
        const loader = document.getElementById(loaderId);
        if(loader) loader.innerText = "Connection lost. Check API.";
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * 3. AGENT & SECTION LOGIC
 */
function openChat(agent) {
    currentAgent = agent;
    showSection('chatArea');
    document.getElementById('sectionTitle').innerText = agent;
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

/**
 * 4. PERSISTENCE & DATA
 */
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

async function triggerInitialCritique(idea) {
    // Only trigger if history is empty to avoid annoying the user on refresh
    if (JSON.parse(localStorage.getItem('gems_history') || '[]').length > 0) return;

    openChat('CoachAI');
    // ... same fetch logic as sendMessage but specifically for the initial review ...
}

function adminReset() {
    if (confirm("Reset everything?")) { localStorage.clear(); window.location.href = 'index.html'; }
}

// Global listeners
document.getElementById('chatInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
