// 1. CONFIGURATION
const SUPABASE_URL = 'https://yvgzyymjymrgjhhthgtj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Z3p5eW1qeW1yZ2poaHRoZ3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5OTc1MzIsImV4cCI6MjA4NTU3MzUzMn0.814FVde267XILaw-VA76Yuk6Y6BVQpCr_5fAF2KtBFw';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentAgent = "CoachAI";

/**
 * INIT: Runs when the page loads.
 * Authenticates user and pulls ALL data from the cloud.
 */
async function init() {
    const { data: { user } } = await _supabase.auth.getUser();
    
    if (!user) {
        window.location.href = 'auth.html';
        return;
    }

    // UI: Set User Name
    document.getElementById('userNameDisplay').innerText = user.email.split('@')[0];

    // UI: Check for God Mode (Architect Tier)
    if (localStorage.getItem('launchAI_GodMode') === 'true') {
        const badge = document.getElementById('tierBadge');
        document.getElementById('adminReset').classList.remove('hidden');
        badge.innerText = "A";
        badge.className = "w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center font-bold text-xs shadow-lg shadow-purple-500/20";
        document.getElementById('tierName').innerText = "Architect Tier";
    }

    // CLOUD LOAD: Get profile and roadmap
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
        if (data.roadmap) {
            renderRoadmap(data.roadmap);
        }
    } else {
        // Fallback to local if brand new user
        const localIdea = localStorage.getItem('userBusinessIdea') || "Your Venture";
        document.getElementById('ideaDisplay').innerText = localIdea;
        if (localIdea !== "Your Venture") saveToCloud(localIdea, "idea");
    }

    updateUIFromHistory();
}

// 2. MESSAGING SYSTEM
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

        // Sync Mission Statements
        if (currentAgent === 'SecretaryAI' || currentAgent === 'CoachAI') {
            saveToCloud(data.text, "mission");
        }

        // Special Detection for Roadmap JSON
        if (data.text.includes("TASK_LIST:")) {
            const jsonString = data.text.split("TASK_LIST:")[1];
            const tasks = JSON.parse(jsonString);
            syncRoadmapToCloud(tasks);
        }

    } catch (err) {
        if(document.getElementById(loaderId)) document.getElementById(loaderId).innerText = "Board Offline.";
    }
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 3. CLOUD SYNC & ROADMAP ENGINE
async function saveToCloud(content, type = "mission") {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    const updateData = { id: user.id, updated_at: new Date() };
    if (type === "idea") updateData.business_idea = content;
    else updateData.mission_statement = content;

    await _supabase.from('profiles').upsert(updateData);
}

async function syncRoadmapToCloud(tasksArray) {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    await _supabase.from('profiles').upsert({ 
        id: user.id, 
        roadmap: tasksArray, 
        updated_at: new Date() 
    });
    renderRoadmap(tasksArray);
}

function renderRoadmap(tasks) {
    const list = document.getElementById('roadmapList');
    if (!list) return;
    list.innerHTML = ""; 

    tasks.forEach((task, index) => {
        const isDone = task.completed;
        list.innerHTML += `
            <div class="glass-panel p-4 rounded-xl flex items-center justify-between border-l-4 ${isDone ? 'border-green-500 opacity-60' : 'border-blue-500'}">
                <div class="flex items-center space-x-4">
                    <input type="checkbox" ${isDone ? 'checked' : ''} onclick="toggleTask(${index})" class="w-5 h-5 rounded border-white/10 bg-white/5 text-blue-500">
                    <div>
                        <p class="font-bold ${isDone ? 'line-through text-slate-500' : 'text-white'}">${task.title}</p>
                        <p class="text-xs text-slate-400">${task.days}</p>
                    </div>
                </div>
            </div>`;
    });
}

async function toggleTask(index) {
    const { data: { user } } = await _supabase.auth.getUser();
    const { data } = await _supabase.from('profiles').select('roadmap').eq('id', user.id).single();
    let roadmap = data.roadmap;
    roadmap[index].completed = !roadmap[index].completed;
    syncRoadmapToCloud(roadmap);
}

// 4. UI UTILITIES
function saveBoardContext(agent, dialogue) {
    let history = JSON.parse(localStorage.getItem('gems_history') || '[]');
    history.push({ agent, text: dialogue, timestamp: new Date().toISOString() });
    localStorage.setItem('gems_history', JSON.stringify(history));
    updateUIFromHistory();
}

async function updateUIFromHistory() {
    // 1. Calculate Agent Progress (50% weight)
    const history = JSON.parse(localStorage.getItem('gems_history') || '[]');
    const uniqueAgents = new Set(history.map(h => h.agent)).size;
    const agentScore = (uniqueAgents / 6) * 50; 

    // 2. Calculate Task Progress (50% weight)
    let taskScore = 0;
    const { data: { user } } = await _supabase.auth.getUser();
    if (user) {
        const { data } = await _supabase.from('profiles').select('roadmap').eq('id', user.id).single();
        if (data && data.roadmap && data.roadmap.length > 0) {
            const completedTasks = data.roadmap.filter(t => t.completed).length;
            taskScore = (completedTasks / data.roadmap.length) * 50;
            
            // Update the task count display (e.g., 3 / 10 tasks)
            document.getElementById('taskCountText').innerText = `${completedTasks} / ${data.roadmap.length}`;
        }
    }

    // 3. Combine and Update UI
    const totalProgress = Math.round(agentScore + taskScore);
    const bar = document.getElementById('progressBar');
    
    if (bar) {
        bar.style.width = totalProgress + '%';
        // Change color based on progress
        if (totalProgress > 70) bar.className = "bg-green-500 h-2 rounded-full transition-all duration-500";
        else if (totalProgress > 30) bar.className = "bg-blue-500 h-2 rounded-full transition-all duration-500";
    }
    
    document.getElementById('progressPctText').innerText = totalProgress + '%';
}

function openChat(agent) {
    currentAgent = agent;
    showSection('chatArea');
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML = `<div class="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl mb-4"><p class="text-sm font-bold text-blue-400 mb-1">${agent}:</p><p class="text-slate-200">Standing by. How shall we proceed?</p></div>`;
}

function showSection(id) {
    ['overview', 'roadmap', 'chatArea'].forEach(s => document.getElementById(s).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active-link'));
    const link = document.getElementById('link-' + id);
    if(link) link.classList.add('active-link');
}

async function logout() {
    await _supabase.auth.signOut();
    localStorage.clear();
    window.location.href = 'auth.html';
}

function adminReset() {
    if (confirm("Reset everything?")) {
        _supabase.auth.signOut().then(() => { localStorage.clear(); window.location.href = 'index.html'; });
    }
}

// 5. START
document.getElementById('chatInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
init();
