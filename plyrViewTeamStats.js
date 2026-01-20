const API_BASE = 'https://kingpin-backend-production.up.railway.app';
let currentTeamId = localStorage.getItem('teamId');
let currentUserId = localStorage.getItem('userId');
let teamData = [];
let sortState = { column: 'name', ascending: true };

// Function to add the "Back to Login" button functionality
function addBackToLoginButton() {
    const loginButton = document.getElementById('back-to-login');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            // Redirect to the KingPin/index.html page
            window.location.href = 'index.html';
        });
    }
}

// Ensure we have team and user IDs (fall back to teamCode lookup if needed)
async function ensureIdsFromTeamCode() {
    if (currentTeamId && currentUserId) return true;

    const teamCode = (localStorage.getItem('teamCode') || '').trim();
    if (!teamCode) {
        console.warn('No teamId/userId and no teamCode found in storage.');
        return false;
    }

    try {
        const endpoint = `${API_BASE}/teams/lookup?code=${encodeURIComponent(teamCode)}`;
        const resp = await fetch(endpoint, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
        if (!resp.ok) throw new Error(`Lookup failed ${resp.status}`);
        const data = await resp.json();
        currentTeamId = data.teamId || data.id || currentTeamId;
        currentUserId = data.userId || data.user_id || currentUserId;

        if (currentTeamId) localStorage.setItem('teamId', currentTeamId);
        if (currentUserId) localStorage.setItem('userId', currentUserId);
        return !!(currentTeamId && currentUserId);
    } catch (err) {
        console.error('Failed to resolve team/user from teamCode:', err);
        return false;
    }
}

function safeNumber(n) {
    const v = Number(n);
    return Number.isFinite(v) ? v : null;
}

// Treat zero as non-counted (absent/unused) when calculating averages
function isCountedScore(n) {
    const v = safeNumber(n);
    return v !== null && v !== 0;
}

function formatStat(n, digits = 1) {
    return Number.isFinite(n) ? n.toFixed(digits) : '--';
}

function buildPlayerStats(players, matches) {
    const stats = {};
    players.forEach(p => {
        stats[p.playerId || p.id] = {
            id: p.playerId || p.id,
            name: p.displayName || p.name || 'Unnamed Player',
            graduationYear: p.graduationYear || p.graduatingClass || '--',
            matchesPlayed: 0,
            g1: [],
            g2: [],
            g3: [],
            wood: [],
            bestGame: null
        };
    });

    matches.forEach(match => {
        if (!match.perPlayerData) return;
        Object.entries(match.perPlayerData).forEach(([playerId, pdata]) => {
            const entry = stats[playerId];
            if (!entry || !pdata || !pdata.games) return;

            const g1 = safeNumber(pdata.games[1]?.Score);
            const g2 = safeNumber(pdata.games[2]?.Score);
            const g3 = safeNumber(pdata.games[3]?.Score);
            const w1 = safeNumber(pdata.games[1]?.Wood);
            const w2 = safeNumber(pdata.games[2]?.Wood);
            const w3 = safeNumber(pdata.games[3]?.Wood);

            const recordedScores = [g1, g2, g3].filter(isCountedScore);
            const recordedWood = [w1, w2, w3].filter(v => v != null);

            if (recordedScores.length > 0) {
                entry.matchesPlayed += 1;
                if (isCountedScore(g1)) entry.g1.push(g1);
                if (isCountedScore(g2)) entry.g2.push(g2);
                if (isCountedScore(g3)) entry.g3.push(g3);
                recordedWood.forEach(w => entry.wood.push(w));

                const best = Math.max(...recordedScores);
                entry.bestGame = entry.bestGame != null ? Math.max(entry.bestGame, best) : best;
            }
        });
    });

    return Object.values(stats).map(s => {
        const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
        return {
            id: s.id,
            name: s.name,
            graduationYear: s.graduationYear,
            matchesPlayed: s.matchesPlayed,
            game1Avg: avg(s.g1),
            game2Avg: avg(s.g2),
            game3Avg: avg(s.g3),
            totalWoodAvg: avg(s.wood),
            bestGame: s.bestGame
        };
    });
}

function renderTeamTable(data) {
    const tbody = document.getElementById('team-stats-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!data.length) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" class="text-center py-6 text-gray-500">No stats available for this team.</td>';
        tbody.appendChild(row);
        return;
    }

    data.forEach(player => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-800 cursor-pointer';
        tr.innerHTML = `
            <td class="px-3 py-3 md:px-6 whitespace-nowrap font-semibold text-white">${player.name}</td>
            <td class="px-3 py-3 md:px-6 text-center text-gray-300">${player.graduationYear || '--'}</td>
            <td class="px-3 py-3 md:px-6 text-center text-gray-300">${player.matchesPlayed || 0}</td>
            <td class="px-3 py-3 md:px-6 text-center text-gray-300">${formatStat(player.game1Avg)}</td>
            <td class="px-3 py-3 md:px-6 text-center text-gray-300">${formatStat(player.game2Avg)}</td>
            <td class="px-3 py-3 md:px-6 text-center text-gray-300">${formatStat(player.game3Avg)}</td>
            <td class="px-3 py-3 md:px-6 text-center text-gray-300">${formatStat(player.totalWoodAvg)}</td>
            <td class="px-3 py-3 md:px-6 text-center text-gray-300">${player.bestGame != null ? player.bestGame : '--'}</td>
        `;

        tr.addEventListener('click', () => {
            if (player.id) {
                localStorage.setItem('selectedPlayerId', player.id);
                localStorage.setItem('selectedPlayerName', player.name || '');
            }
            window.location.href = 'plyrViewPlyrStats.html';
        });

        tbody.appendChild(tr);
    });
}

function sortData(column) {
    if (sortState.column === column) {
        sortState.ascending = !sortState.ascending;
    } else {
        sortState.column = column;
        sortState.ascending = true;
    }

    const sorted = [...teamData].sort((a, b) => {
        const av = a[column];
        const bv = b[column];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === 'string') {
            return sortState.ascending ? av.localeCompare(bv) : bv.localeCompare(av);
        }
        return sortState.ascending ? av - bv : bv - av;
    });

    renderTeamTable(sorted);
}

// Expose sortData for header onclick usage
window.sortData = sortData;

/**
 * Fetches all players for the current team
 */
async function fetchPlayers() {
    if (!currentUserId || !currentTeamId) {
        console.warn('Missing userId or teamId; cannot fetch players.');
        return [];
    }

    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.players || [];
    } catch (error) {
        console.error('Error fetching players:', error);
        return [];
    }
}

/**
 * Fetches all matches for the current team
 */
async function fetchMatches() {
    if (!currentUserId || !currentTeamId) {
        console.warn('Missing userId or teamId; cannot fetch matches.');
        return [];
    }

    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.matches || [];
    } catch (error) {
        console.error('Error fetching matches:', error);
        return [];
    }
}

// Add the button functionality when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    addBackToLoginButton();

    const hasIds = await ensureIdsFromTeamCode();
    if (!hasIds) {
        renderTeamTable([]);
        return;
    }

    const [players, matches] = await Promise.all([fetchPlayers(), fetchMatches()]);
    teamData = buildPlayerStats(players, matches);
    renderTeamTable(teamData);
});
