/**
 * KINGPIN MATCH VIEW LOGIC
 * Fetches and displays detailed match statistics from backend
 */

const API_BASE = 'https://kingpin-backend-production.up.railway.app';
let currentUserId = localStorage.getItem('userId');
let currentTeamId = localStorage.getItem('teamId');
let currentMatchId = localStorage.getItem('selectedMatchId');
let allMatches = [];
let currentMatchIndex = 0;
let userDisplayName = '';

// ------------------------------------------------------------------
// FETCH DATA FROM BACKEND
// ------------------------------------------------------------------

async function fetchMatches() {
    if (!currentUserId || !currentTeamId) {
        console.error('Missing userId or teamId');
        return [];
    }

    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.matches || [];
    } catch (error) {
        console.error('Error fetching matches:', error);
        return [];
    }
}

async function fetchMatchDetails(matchId) {
    if (!currentUserId || !currentTeamId || !matchId) {
        console.error('Missing required IDs');
        return null;
    }

    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches/${matchId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.match || data;
    } catch (error) {
        console.error('Error fetching match details:', error);
        return null;
    }
}

async function fetchPlayers() {
    if (!currentUserId || !currentTeamId) return [];
    
    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.players || [];
    } catch (error) {
        console.error('Error fetching players:', error);
        return [];
    }
}

async function fetchUserInfo() {
    if (!currentUserId) return null;
    
    try {
        const response = await fetch(`${API_BASE}/accounts/${currentUserId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.user || data;
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
}

function updateLeagueTitle() {
    const leagueTitle = document.getElementById('league-title');
    if (leagueTitle && userDisplayName) {
        leagueTitle.textContent = `${userDisplayName}'s League`;
    }
}

// ------------------------------------------------------------------
// RENDER MATCH DATA
// ------------------------------------------------------------------

async function renderMatchView() {
    if (!currentMatchId) {
        document.getElementById('opponent-name').textContent = 'No Match Selected';
        return;
    }

    // Fetch all matches and sort by date
    allMatches = await fetchMatches();
    allMatches.sort((a, b) => (a.date || 0) - (b.date || 0)); // Sort ascending by date

    // Find current match index
    currentMatchIndex = allMatches.findIndex(m => m.matchId === currentMatchId);
    if (currentMatchIndex === -1) {
        console.error('Match not found');
        return;
    }

    const match = allMatches[currentMatchIndex];
    const matchDetails = await fetchMatchDetails(currentMatchId);
    const players = await fetchPlayers();

    // Update UI with match info
    updateMatchHeader(match, matchDetails);
    await renderPlayerStats(matchDetails, players);
    updateNavigationButtons();
}

function updateMatchHeader(match, matchDetails) {
    const fullMatch = matchDetails || match;
    
    // Update opponent name
    const opponentName = fullMatch.opposingTeamName || 'Unknown Opponent';
    document.getElementById('opponent-name').textContent = `vs. ${opponentName}`;

    // Update date
    const matchDate = fullMatch.date ? new Date(fullMatch.date) : new Date();
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = matchDate.toLocaleDateString('en-US', dateOptions);
}

async function renderPlayerStats(matchDetails, players) {
    const tbody = document.getElementById('player-rows');
    if (!tbody) return;

    tbody.innerHTML = '';
    let teamTotal = 0;
    let totalGames = 0;

    // Create player lookup
    const playerLookup = {};
    players.forEach(player => {
        playerLookup[player.playerId] = player;
    });

    if (!matchDetails || !matchDetails.perPlayerData) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500">No player data available for this match</td></tr>';
        return;
    }

    // Process each player in the match
    Object.keys(matchDetails.perPlayerData).forEach(playerId => {
        const playerData = matchDetails.perPlayerData[playerId];
        const player = playerLookup[playerId];
        
        if (!player) return; // Skip if player not found

        const games = playerData.games || {};
        const game1 = games['1'] && typeof games['1'].Score === 'number' ? games['1'].Score : 0;
        const game2 = games['2'] && typeof games['2'].Score === 'number' ? games['2'].Score : 0;
        const game3 = games['3'] && typeof games['3'].Score === 'number' ? games['3'].Score : 0;
        
        const series = game1 + game2 + game3;
        const gamesCount = (game1 > 0 ? 1 : 0) + (game2 > 0 ? 1 : 0) + (game3 > 0 ? 1 : 0);
        const avg = gamesCount > 0 ? (series / gamesCount).toFixed(1) : '0.0';
        
        teamTotal += series;
        totalGames += gamesCount;

        const row = document.createElement('tr');
        row.className = 'table-row transition-colors';
        
        row.innerHTML = `
            <td class="py-4 px-6 font-semibold text-white">
                <a href="#" class="player-link hover:text-blue-400 transition-colors" data-player-id="${playerId}">
                    ${player.displayName}
                </a>
            </td>
            <td class="py-4 px-4 text-center text-slate-300">${game1 || '-'}</td>
            <td class="py-4 px-4 text-center text-slate-300">${game2 || '-'}</td>
            <td class="py-4 px-4 text-center text-slate-300">${game3 || '-'}</td>
            <td class="py-4 px-4 text-center text-slate-300">${series}</td>
            <td class="py-4 px-6 text-right text-slate-400 font-medium">${avg}</td>
        `;
        tbody.appendChild(row);
    });

    // Update totals
    document.getElementById('match-total-display').textContent = teamTotal;
    document.getElementById('team-series-total').textContent = teamTotal;
    
    const teamAvg = totalGames > 0 ? (teamTotal / totalGames).toFixed(1) : '0.0';
    document.getElementById('team-avg').textContent = teamAvg;

    // Attach click handlers to player links
    document.querySelectorAll('.player-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const playerId = e.target.dataset.playerId;
            if (playerId) {
                localStorage.setItem('selectedPlayerId', playerId);
                window.location.href = 'plyrScores.html';
            }
        });
    });
}

// ------------------------------------------------------------------
// NAVIGATION
// ------------------------------------------------------------------

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-match-btn');
    const nextBtn = document.getElementById('next-match-btn');

    // Left arrow (prev) goes to newer matches (higher index)
    if (prevBtn) {
        prevBtn.disabled = currentMatchIndex === allMatches.length - 1;
        prevBtn.style.opacity = currentMatchIndex === allMatches.length - 1 ? '0.3' : '1';
        prevBtn.style.cursor = currentMatchIndex === allMatches.length - 1 ? 'not-allowed' : 'pointer';
    }

    // Right arrow (next) goes to older matches (lower index)
    if (nextBtn) {
        nextBtn.disabled = currentMatchIndex === 0;
        nextBtn.style.opacity = currentMatchIndex === 0 ? '0.3' : '1';
        nextBtn.style.cursor = currentMatchIndex === 0 ? 'not-allowed' : 'pointer';
    }
}

// Left arrow: go back in time (to older matches, lower index)
function navigateToOlderMatch() {
    if (currentMatchIndex > 0) {
        currentMatchIndex--;
        currentMatchId = allMatches[currentMatchIndex].matchId;
        localStorage.setItem('selectedMatchId', currentMatchId);
        renderMatchView();
    }
}

// Right arrow: go forward in time (to newer matches, higher index)
function navigateToNewerMatch() {
    if (currentMatchIndex < allMatches.length - 1) {
        currentMatchIndex++;
        currentMatchId = allMatches[currentMatchIndex].matchId;
        localStorage.setItem('selectedMatchId', currentMatchId);
        renderMatchView();
    }
}

// ------------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    if (!currentUserId || !currentTeamId) {
        alert('Please log in first');
        window.location.href = 'KingPinLogin.html';
        return;
    }

    // Fetch user info and update league title
    const userInfo = await fetchUserInfo();
    if (userInfo) {
        userDisplayName = userInfo.displayName || userInfo.username || 'User';
        updateLeagueTitle();
    }

    // Render the match view
    renderMatchView();

    // Attach navigation button handlers
    const prevBtn = document.getElementById('prev-match-btn');
    const nextBtn = document.getElementById('next-match-btn');

    // Left arrow goes to newer matches (forward in time)
    if (prevBtn) {
        prevBtn.addEventListener('click', navigateToNewerMatch);
    }

    // Right arrow goes to older matches (backward in time)
    if (nextBtn) {
        nextBtn.addEventListener('click', navigateToOlderMatch);
    }

    // Add keyboard arrow key support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateToNewerMatch();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateToOlderMatch();
        }
    });

    // Delete match button
    const deleteBtn = document.getElementById('delete-match-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (!currentMatchId) {
                alert('No match selected to delete.');
                return;
            }

            const confirmed = confirm('Delete this match? This action cannot be undone.');
            if (!confirmed) return;

            const password = localStorage.getItem('password') || '';
            try {
                const resp = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches/${currentMatchId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                if (!resp.ok) {
                    const txt = await resp.text();
                    throw new Error(`Delete failed: ${resp.status} ${txt}`);
                }

                alert('Match deleted successfully.');
                // Clear selection and redirect to dashboard
                localStorage.removeItem('selectedMatchId');
                window.location.href = 'dashboard.html';
            } catch (err) {
                console.error('Error deleting match:', err);
                alert('Failed to delete match: ' + err.message);
            }
        });
    }
});
