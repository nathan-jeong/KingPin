const API_BASE = 'https://kingpin-backend-production.up.railway.app';

const currentUserId = localStorage.getItem('userId');
const currentTeamId = localStorage.getItem('teamId');
const selectedPlayerId = localStorage.getItem('selectedPlayerId');

document.addEventListener('DOMContentLoaded', async () => {
    const playerNameEl = document.getElementById('player-name');
    const matchListEl = document.getElementById('match-list');

    // Elements for Overall Stats
    const overallAvgValueEl = document.getElementById('overall-avg-value');
    const g1AvgValueEl = document.getElementById('g1-avg-value');
    const g2AvgValueEl = document.getElementById('g2-avg-value');
    const g3AvgValueEl = document.getElementById('g3-avg-value');
    const totalWoodValueEl = document.getElementById('total-wood-value');

    if (!currentUserId || !currentTeamId || !selectedPlayerId) {
        showMessage('Missing user, team, or player context. Please select a player from the dashboard.');
        return;
    }

    try {
        // Fetch player info
        const playerResp = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players/${selectedPlayerId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!playerResp.ok) throw new Error('Failed to load player profile');
        const playerData = await playerResp.json();
        const player = playerData.player || playerData;
        const displayName = player.displayName || 'Unknown Player';
        if (playerNameEl) playerNameEl.textContent = displayName;

        // Fetch matches for team
        const matchesResp = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!matchesResp.ok) throw new Error('Failed to load matches');
        const matchesJson = await matchesResp.json();
        const matches = matchesJson.matches || [];

        // Extract per-player match entries
        const playerMatches = matches.map(m => {
            const per = m.perPlayerData ? m.perPlayerData[selectedPlayerId] : null;
            if (!per || !per.games) return null;

            const games = [1,2,3].map(i => {
                const g = per.games[i];
                return g && g.Score != null ? { Score: g.Score, Wood: g.Wood, isVarsity: !!g.isVarsity } : null;
            });

            const seriesTotal = games.reduce((s, g) => s + (g && g.Score ? g.Score : 0), 0);
            const gamesCount = games.filter(g => g && g.Score != null).length;
            const avg = gamesCount > 0 ? (seriesTotal / gamesCount) : null;
            const totalWood = games.reduce((s, g) => s + (g && g.Wood ? g.Wood : 0), 0);

            return {
                matchId: m.matchId || m.id,
                name: m.opposingTeamName || m.comment || ('Match ' + m.matchId),
                date: m.date || null,
                games,
                seriesTotal,
                avg,
                totalWood
            };
        }).filter(Boolean);

        // Compute overall stats
        let totalG1 = 0, totalG2 = 0, totalG3 = 0, totalPoints = 0, totalWood = 0, gameCounts = [0,0,0];
        playerMatches.forEach(pm => {
            pm.games.forEach((g, idx) => {
                if (g && g.Score != null) {
                    if (idx === 0) { totalG1 += g.Score; gameCounts[0]++; }
                    if (idx === 1) { totalG2 += g.Score; gameCounts[1]++; }
                    if (idx === 2) { totalG3 += g.Score; gameCounts[2]++; }
                    totalPoints += g.Score;
                }
            });
            totalWood += pm.totalWood || 0;
        });

        const numMatches = playerMatches.length || 0;
        const overallG1Avg = gameCounts[0] ? (totalG1 / gameCounts[0]) : null;
        const overallG2Avg = gameCounts[1] ? (totalG2 / gameCounts[1]) : null;
        const overallG3Avg = gameCounts[2] ? (totalG3 / gameCounts[2]) : null;
        const overallAverage = (numMatches && (gameCounts[0]+gameCounts[1]+gameCounts[2])>0) ? (totalPoints / (gameCounts[0]+gameCounts[1]+gameCounts[2])) : null;

        if (overallAvgValueEl) overallAvgValueEl.textContent = overallAverage != null ? overallAverage.toFixed(1) : '--';
        if (g1AvgValueEl) g1AvgValueEl.textContent = overallG1Avg != null ? overallG1Avg.toFixed(1) : '--';
        if (g2AvgValueEl) g2AvgValueEl.textContent = overallG2Avg != null ? overallG2Avg.toFixed(1) : '--';
        if (g3AvgValueEl) g3AvgValueEl.textContent = overallG3Avg != null ? overallG3Avg.toFixed(1) : '--';
        if (totalWoodValueEl) totalWoodValueEl.textContent = totalWood;

        // Render match list
        if (matchListEl) {
            matchListEl.innerHTML = '';
            playerMatches.forEach((match, index) => {
                const isEven = index % 2 === 0;
                const bgColor = isEven ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700';

                const row = document.createElement('div');
                row.className = `${bgColor} p-4 sm:p-3 rounded-lg shadow-sm sm:shadow-none`;

                const mobileView = `
                    <div class="sm:hidden space-y-2">
                        <div class="font-semibold text-lg text-indigo-600 dark:text-indigo-400">${match.name}</div>
                        <div class="grid grid-cols-2 gap-y-1 text-sm">
                            <div><span class="font-medium text-gray-500 dark:text-gray-400">Game Scores:</span> ${match.games.map(g=>g?g.Score:'-').join(', ')}</div>
                            <div><span class="font-medium text-gray-500 dark:text-gray-400">Series Total:</span> ${match.seriesTotal}</div>
                            <div><span class="font-medium text-gray-500 dark:text-gray-400">Avg:</span> ${match.avg != null ? match.avg.toFixed(1) : '--'}</div>
                        </div>
                    </div>
                `;

                const desktopView = `
                    <div class="hidden sm:grid grid-cols-9 gap-2 items-center text-sm">
                        <div class="col-span-3 font-medium truncate">${match.name}</div>
                        <div class="col-span-1 text-center">${match.games[0] && match.games[0].Score != null ? match.games[0].Score : '-'}</div>
                        <div class="col-span-1 text-center">${match.games[1] && match.games[1].Score != null ? match.games[1].Score : '-'}</div>
                        <div class="col-span-1 text-center">${match.games[2] && match.games[2].Score != null ? match.games[2].Score : '-'}</div>
                        <div class="col-span-2 text-center">${match.seriesTotal}</div>
                        <div class="col-span-1 text-center">${match.avg != null ? match.avg.toFixed(1) : '--'}</div>
                    </div>
                `;

                row.innerHTML = mobileView + desktopView;
                matchListEl.appendChild(row);
            });
        }

        // Navigation buttons
        const backToTeamSelectorBtn = document.getElementById('back-to-team-selector-btn');
        if (backToTeamSelectorBtn) {
            backToTeamSelectorBtn.addEventListener('click', () => {
                window.location.href = 'teamSelector.html';
            });
        }

    } catch (err) {
        console.error('Error loading player matches:', err);
        showMessage('Failed to load player data. Please try again.');
    }
});

// Function to simulate a modal/message box instead of alert()
function showMessage(message) {
    const modalId = 'stat-message-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300 opacity-0';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-transform duration-300 scale-95">
                <h3 class="text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Notice</h3>
                <p class="mb-6" id="modal-content"></p>
                <button onclick="document.getElementById('${modalId}').style.opacity = '0'; setTimeout(() => document.getElementById('${modalId}').classList.add('hidden'), 300);"
                        class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition duration-150">
                    Close
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('modal-content').textContent = message;
    modal.classList.remove('hidden');
    // Force reflow to enable transition
    setTimeout(() => modal.style.opacity = '1', 10);
    setTimeout(() => modal.querySelector('div').style.transform = 'scale(1)', 10);
}
