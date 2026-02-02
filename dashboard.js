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
                document.getElementById('tierBadge').innerText = "A";
                document.getElementById('tierBadge').classList.replace('bg-blue-600', 'bg-purple-600');
                document.getElementById('tierName').innerText = "Architect Tier";
            }
            triggerInitialCritique(idea);
        })();

        async function triggerInitialCritique(idea) {
            openChat('CoachAI');
            const chatBox = document.getElementById('chatBox');
            const loaderId = "loader-init";
            chatBox.innerHTML += `<div id="${loaderId}" class="text-blue-500 text-xs animate-pulse p-2 uppercase tracking-widest font-bold">Board reviewing viability...</div>`;

            try {
                const response = await fetch('/api/architect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: "Give me an honest, brutal 1-10 viability score.", agent: "CoachAI", idea: idea })
                });
                const data = await response.json();
                document.getElementById(loaderId)?.remove();
                chatBox.innerHTML += `<div class="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl mb-4 mr-12"><p class="text-sm font-bold text-red-400 mb-1">CoachAI:</p><p class="text-slate-200">${data.text}</p></div>`;
            } catch (err) {
                if(document.getElementById(loaderId)) document.getElementById(loaderId).innerText = "Error connecting to GEMS.";
            }
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        function showSection(id) {
            ['overview', 'roadmap', 'chatArea'].forEach(s => document.getElementById(s).classList.add('hidden'));
            document.getElementById(id).classList.remove('hidden');
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active-link'));
            if(id !== 'chatArea') document.getElementById('link-' + id).classList.add('active-link');
            document.getElementById('sectionTitle').innerText = id.charAt(0).toUpperCase() + id.slice(1);
        }

        let currentAgent = "";
        function openChat(agent) {
            currentAgent = agent;
            showSection('chatArea');
            document.getElementById('sectionTitle').innerText = agent;
            const chatBox = document.getElementById('chatBox');
            let greeting = agent === 'AccountantAI' ? "Ready for fiscal audit. Should we start with **$Burn Rate$**?" : `Standing by for ${agent} protocols.`;
            
            chatBox.innerHTML = `<div class="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl mb-4"><p class="text-sm font-bold text-blue-400 mb-1">${agent}:</p><p class="text-slate-200">${greeting}</p></div>`;
        }

        async function sendMessage() {
    const input = document.getElementById('chatInput');
    const chatBox = document.getElementById('chatBox');
    if (!input.value.trim()) return;

    const text = input.value;
    // 1. Show user message
    chatBox.innerHTML += `<div class="bg-white/5 p-4 rounded-2xl text-right mb-4 ml-12"><p class="text-slate-200">${text}</p></div>`;
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    const loaderId = "loader-" + Date.now();
    chatBox.innerHTML += `<div id="${loaderId}" class="text-blue-500 text-xs animate-pulse p-2 uppercase">Processing...</div>`;

    try {
        const response = await fetch('/api/architect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, agent: currentAgent, idea: localStorage.getItem('userBusinessIdea') })
        });
        const data = await response.json();
        document.getElementById(loaderId)?.remove();

        // 2. Show AI response
        chatBox.innerHTML += `<div class="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl mb-4 mr-12"><p class="text-sm font-bold text-blue-400 mb-1">${currentAgent}:</p><p class="text-slate-200">${data.text}</p></div>`;
        
        // 3. RUN THE SAVE LOGIC HERE (Outside the HTML string!)
        saveBoardContext(currentAgent, data.text);

    } catch (err) {
        document.getElementById(loaderId).innerText = "Offline.";
    }
    chatBox.scrollTop = chatBox.scrollHeight;
} 
        /**
 * 4. PERSISTENCE & DYNAMIC PROGRESS
 */
function saveBoardContext(agent, dialogue) {
    // Save the conversation to history
    let history = JSON.parse(localStorage.getItem('gems_history') || '[]');
    history.push({ agent, text: dialogue, timestamp: new Date().toISOString() });
    localStorage.setItem('gems_history', JSON.stringify(history));

    // Update Progress UI
    const totalAgents = 6;
    const uniqueAgentsConsulted = new Set(history.map(h => h.agent)).size;
    const progressPercent = Math.round((uniqueAgentsConsulted / totalAgents) * 100);
    
    // Update the DOM elements
    const progressBars = document.querySelectorAll('.bg-blue-500.h-2');
    progressBars.forEach(bar => bar.style.width = progressPercent + '%');
    
    const progressText = document.querySelector('h3.text-blue-400');
    if (progressText) progressText.innerText = progressPercent + '%';

    const taskCount = document.querySelector('h3.text-green-400');
    if (taskCount) taskCount.innerText = `${uniqueAgentsConsulted} / ${totalAgents} Agents`;
}

// Update your sendMessage function to call this:
// Inside sendMessage(), right after: chatBox.innerHTML += `...${data.text}...`
// Add: saveBoardContext(currentAgent, data.text);

        function adminReset() {
            if (confirm("Reset App?")) { localStorage.clear(); window.location.href = 'index.html'; }
        }
        document.getElementById('chatInput').addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
    
