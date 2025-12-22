const API_BASE = 'https://kingpin-backend-production.up.railway.app';

const currentUserId = localStorage.getItem('userId');
const currentTeamId = localStorage.getItem('teamId');
const selectedPlayerId = localStorage.getItem('selectedPlayerId');

let playerMatches = [];
let sortState = { column: 'name', ascending: true };

function formatDate(ms) {
    if (!ms) return '--';
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return '--';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function getSortValue(match, column) {
    switch (column) {
        case 'name': return (match.name || '').toLowerCase();
        case 'date': return match.date || 0;
        case 'g1': return match.games[0] && match.games[0].Score != null ? match.games[0].Score : -1;
        case 'g2': return match.games[1] && match.games[1].Score != null ? match.games[1].Score : -1;
        case 'g3': return match.games[2] && match.games[2].Score != null ? match.games[2].Score : -1;
        case 'series': return match.seriesTotal != null ? match.seriesTotal : -1;
        case 'avg': return match.avg != null ? match.avg : -1;
        default: return 0;
    }
}

function renderMatches() {
    const matchListEl = document.getElementById('match-list');
    if (!matchListEl) return;

    // Sort
    const sorted = [...playerMatches].sort((a, b) => {
        const av = getSortValue(a, sortState.column);
        const bv = getSortValue(b, sortState.column);
        if (av === bv) return 0;
        if (av > bv) return sortState.ascending ? 1 : -1;
        return sortState.ascending ? -1 : 1;
    });

    matchListEl.innerHTML = '';

    sorted.forEach((match, index) => {
        const isEven = index % 2 === 0;
        const bgColor = isEven ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700';
        const dateLabel = formatDate(match.date);

        const row = document.createElement('div');
        row.className = `${bgColor} p-4 sm:p-3 rounded-lg shadow-sm sm:shadow-none`;

        const varsityBadge = match.isVarsity ? `<span class="ml-2 inline-block bg-yellow-400 text-xs text-black font-semibold px-2 py-0.5 rounded">VARS</span>` : '';
        const mobileView = `
            <div class="sm:hidden space-y-2">
                <div class="flex items-center space-x-3">
                    <a href="matchView.html" data-match-id="${match.matchId}" class="match-link font-semibold text-lg text-indigo-600 dark:text-indigo-400">${match.name}</a>${varsityBadge}
                    <button data-match-id="${match.matchId}" class="view-comment-btn text-indigo-600 hover:text-indigo-700" aria-label="View comments">💬</button>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Date: ${dateLabel}</div>
                <div class="grid grid-cols-2 gap-y-1 text-sm items-center">
                    <div><span class="font-medium text-gray-500 dark:text-gray-400">Game Scores:</span> ${match.games.map(g=>g?g.Score:'-').join(', ')}</div>
                    <div class="flex items-center justify-end space-x-2">
                        <span class="font-medium text-gray-500 dark:text-gray-400">Avg:</span>
                        <span>${match.avg != null ? match.avg.toFixed(1) : '--'}</span>
                    </div>
                    <div><span class="font-medium text-gray-500 dark:text-gray-400">Series Total:</span> ${match.seriesTotal}</div>
                </div>
            </div>
        `;

        const desktopView = `
            <div class="hidden sm:grid grid-cols-12 gap-2 items-center text-sm">
                <div class="col-span-4 font-medium truncate">
                    <a href="matchView.html" data-match-id="${match.matchId}" class="match-link text-indigo-600 dark:text-indigo-400 hover:underline">${match.name}</a>${varsityBadge}
                </div>
                <div class="col-span-1 text-center">
                    <button data-match-id="${match.matchId}" class="view-comment-btn text-indigo-600 hover:text-indigo-700" aria-label="View comments">💬</button>
                </div>
                <div class="col-span-2 text-center">${dateLabel}</div>
                <div class="col-span-1 text-center">${match.games[0] && match.games[0].Score != null ? match.games[0].Score : '-'}</div>
                <div class="col-span-1 text-center">${match.games[1] && match.games[1].Score != null ? match.games[1].Score : '-'}</div>
                <div class="col-span-1 text-center">${match.games[2] && match.games[2].Score != null ? match.games[2].Score : '-'}</div>
                <div class="col-span-1 text-center">${match.seriesTotal}</div>
                <div class="col-span-1 text-center">${match.avg != null ? match.avg.toFixed(1) : '--'}</div>
            </div>
        `;

        row.innerHTML = mobileView + desktopView;
        matchListEl.appendChild(row);

        // Inline listener retained for redundancy; delegated listener handles most cases
        const btn = row.querySelector('.view-comment-btn');
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const commentText = match.comment && match.comment.trim() ? match.comment : '';
                const cleanedComment = commentText.replace(/\n?TeamScore:?\s*\d+\s*$/i, '').trim();
                if (!commentText) {
                    console.info('[plyrScores] Inline click: no comment text for matchId', match.matchId, 'name', match.name);
                } else {
                    console.info('[plyrScores] Inline click: showing comment for matchId', match.matchId, 'length', commentText.length);
                }
                const displayText = cleanedComment ? `<div class="whitespace-pre-wrap">${cleanedComment}</div>` : '<div class="text-gray-500 italic">No comments were left for this match.</div>';
                showModal('Match Notes', displayText);
            });
        } else {
            console.warn('[plyrScores] Inline: comment button not found for match row', match.matchId, match.name);
        }

        // Attach match link listener
        const link = row.querySelector('.match-link');
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.setItem('selectedMatchId', match.matchId);
                window.location.href = 'matchView.html';
            });
        }
    });
}

// Simple modal for showing comments or messages
function showModal(title, htmlContent) {
    console.info('[plyrScores] showModal called with title:', title);
    const id = 'plyr-modal';
    // Remove any existing modal first to ensure fresh state
    let existingModal = document.getElementById(id);
    if (existingModal) {
        existingModal.remove();
    }

    // Create new modal
    const modal = document.createElement('div');
    modal.id = id;
    modal.className = 'fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 text-black dark:text-white rounded-lg max-w-xl w-full p-6 mx-4 shadow-2xl">
            <div class="flex justify-between items-start mb-4">
                <h3 id="plyr-modal-title" class="text-lg font-bold text-indigo-600 dark:text-indigo-400"></h3>
                <button id="plyr-modal-close" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-2xl leading-none">&times;</button>
            </div>
            <div id="plyr-modal-body" class="text-sm"></div>
        </div>
    `;
    document.body.appendChild(modal);

    // Close button handler
    modal.querySelector('#plyr-modal-close').addEventListener('click', () => {
        modal.remove();
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Set content
    const titleEl = modal.querySelector('#plyr-modal-title');
    const bodyEl = modal.querySelector('#plyr-modal-body');
    titleEl.textContent = title || 'Details';
    bodyEl.innerHTML = htmlContent || '';
}

document.addEventListener('DOMContentLoaded', async () => {
    const playerNameEl = document.getElementById('player-name');
    const matchListEl = document.getElementById('match-list');

    // Delegated click handler for comment buttons (ensures capture after re-render)
    if (matchListEl) {
        matchListEl.addEventListener('click', (e) => {
            const btn = e.target.closest('.view-comment-btn');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();
            const matchId = btn.getAttribute('data-match-id');
            const match = playerMatches.find(m => String(m.matchId) === String(matchId));
            if (!match) {
                console.warn('[plyrScores] Delegated click: match not found for matchId', matchId);
                return;
            }
            const commentText = match.comment && match.comment.trim() ? match.comment : '';
            const cleanedComment = commentText.replace(/\n?TeamScore:?\s*\d+\s*$/i, '').trim();
            if (!commentText) {
                console.info('[plyrScores] Delegated click: no comment text for matchId', matchId);
            } else {
                console.info('[plyrScores] Delegated click: showing comment for matchId', matchId, 'len', commentText.length);
            }
            const displayText = cleanedComment ? `<div class="whitespace-pre-wrap">${cleanedComment}</div>` : '<div class="text-gray-500 italic">No comments were left for this match.</div>';
            showModal('Match Notes', displayText);
        });
    } else {
        console.warn('[plyrScores] match-list element not found; comment buttons will not work.');
    }

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
        playerMatches = matches.map(m => {
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
            const anyVarsity = games.some(g => g && g.isVarsity);

            return {
                matchId: m.matchId || m.id,
                name: m.opposingTeamName || m.comment || ('Match ' + (m.matchId || m.id)),
                date: m.date || null,
                games,
                seriesTotal,
                avg,
                totalWood,
                comment: m.comment || '',
                isVarsity: anyVarsity
            };
        }).filter(Boolean);

        renderMatches();

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
                if (g && g.Wood != null) totalWood += g.Wood;
            });
        });

        const totalGames = gameCounts[0] + gameCounts[1] + gameCounts[2];
        const overallAverage = totalGames > 0 ? (totalPoints / totalGames) : 0;
        const overallG1Avg = gameCounts[0] > 0 ? (totalG1 / gameCounts[0]) : 0;
        const overallG2Avg = gameCounts[1] > 0 ? (totalG2 / gameCounts[1]) : 0;
        const overallG3Avg = gameCounts[2] > 0 ? (totalG3 / gameCounts[2]) : 0;

        if (overallAvgValueEl) overallAvgValueEl.textContent = overallAverage.toFixed(1);
        if (g1AvgValueEl) g1AvgValueEl.textContent = overallG1Avg.toFixed(1);
        if (g2AvgValueEl) g2AvgValueEl.textContent = overallG2Avg.toFixed(1);
        if (g3AvgValueEl) g3AvgValueEl.textContent = overallG3Avg.toFixed(1);
        if (totalWoodValueEl) totalWoodValueEl.textContent = totalWood;

        // Navigation buttons
        const backToTeamSelectorBtn = document.getElementById('back-to-team-selector-btn');
        if (backToTeamSelectorBtn) {
            backToTeamSelectorBtn.addEventListener('click', () => {
                window.location.href = 'teamSelector.html';
            });
        }

        // Sorting header listeners (desktop)
        const sortables = [
            { id: 'sort-name', col: 'name' },
            { id: 'sort-date', col: 'date' },
            { id: 'sort-g1', col: 'g1' },
            { id: 'sort-g2', col: 'g2' },
            { id: 'sort-g3', col: 'g3' },
            { id: 'sort-series', col: 'series' },
            { id: 'sort-avg', col: 'avg' }
        ];

        sortables.forEach(s => {
            const el = document.getElementById(s.id);
            if (el) {
                el.addEventListener('click', () => {
                    if (sortState.column === s.col) {
                        sortState.ascending = !sortState.ascending;
                    } else {
                        sortState.column = s.col;
                        sortState.ascending = true;
                    }
                    renderMatches();
                });
            }
        });

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
