/**
 * KINGPIN DASHBOARD LOGIC
 * Revised: Fixed logic gaps, removed inline CSS (relying on dashboard.css),
 * and improved top scorer sorting logic.
 */

const API_BASE = 'https://kingpin-backend-production.up.railway.app';
let currentTeamId = localStorage.getItem('teamId');
let currentUserId = localStorage.getItem('userId');
let currentPassword = localStorage.getItem('password');
let cachedPlayers = [];
let cachedMatches = [];
let cachedPlayerStats = [];
let cachedMatchSummaries = [];
let topSortState = { column: 'average', ascending: false };
let matchSortState = { column: 'date', ascending: false };

// 1. Sidebar Toggle Logic
// We attach this to window so the onclick="" in HTML can find it
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('visible');
    }
};

// ------------------------------------------------------------------
// AWARDS LOGIC
// ------------------------------------------------------------------

async function fetchAndDisplayAwards() {
    if (!currentUserId || !currentTeamId) {
        console.warn('Missing userId or teamId; cannot fetch awards.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const team = data.team || data;
        const awards = team.awardsList || [];

        renderAwardsList(awards);
    } catch (error) {
        console.error('Error fetching awards:', error);
        displayEmptyAwards();
    }
}

function renderAwardsList(awards) {
    const awardsList = document.getElementById('current-awards-list');
    if (!awardsList) return;
    
    awardsList.innerHTML = '';

    if (awards.length === 0) {
        displayEmptyAwards();
        return;
    }

    awards.forEach((award) => {
        const awardItem = document.createElement('div');
        // FIX: Use the class defined in dashboard.css instead of inline JS styles
        awardItem.className = 'award-item'; 
        
        // We use flex in CSS, but the structure needs to match
        awardItem.innerHTML = `
            <button class="delete-award-btn" aria-label="Delete award">&times;</button>
            <span style="display: flex; align-items: center; gap: 8px;">🏆 ${award}</span>
        `;
        
        awardsList.appendChild(awardItem);

        // Attach delete listener
        const deleteBtn = awardItem.querySelector('.delete-award-btn');
        deleteBtn.addEventListener('click', () => deleteAward(award));
    });
}

function displayEmptyAwards() {
    const awardsList = document.getElementById('current-awards-list');
    if (awardsList) {
        awardsList.innerHTML = '<div style="color: rgba(255, 255, 255, 0.5); font-style: italic; padding: 10px;">No awards created</div>';
    }
}

async function addAwardToBackend(awardTitle, awardYear) {
    if (!currentTeamId || !currentPassword) return false;

    try {
        const newAward = `${awardTitle} (${awardYear})`;
        const response = await fetch(`${API_BASE}/teams/${currentTeamId}/awards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword, award: newAward })
        });

        if (!response.ok) throw new Error('Save failed');

        const data = await response.json();
        renderAwardsList(data.awardsList || data);
        return true;
    } catch (error) {
        console.error('Error adding award:', error);
        return false;
    }
}

async function deleteAward(awardToDelete) {
    if (!currentTeamId || !currentPassword) return;

    // Optional: Add confirmation for deleting awards
    if(!confirm(`Delete award: "${awardToDelete}"?`)) return;

    try {
        const response = await fetch(`${API_BASE}/teams/${currentTeamId}/awards`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword, award: awardToDelete })
        });

        if (!response.ok) throw new Error('Delete failed');

        const data = await response.json();
        renderAwardsList(data.awardsList || data);
    } catch (error) {
        console.error('Error deleting award:', error);
    }
}

// ------------------------------------------------------------------
// PLAYER & MATCH STATS LOGIC
// ------------------------------------------------------------------

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

async function fetchMatches() {
    if (!currentUserId || !currentTeamId) return [];
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
//here starts the export feature

async function ensureMatchDetails(matches) {
    if (!currentUserId || !currentTeamId) return matches;

    const enriched = await Promise.all((matches || []).map(async (match) => {
        if (match && match.perPlayerData) return match;
        const matchId = match?.matchId || match?.id;
        if (!matchId) return match;

        try {
            const resp = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches/${matchId}`);
            if (!resp.ok) return match;
            const data = await resp.json();
            const detailed = data.match || data;
            return { ...match, ...detailed };
        } catch (err) {
            console.warn('Could not fetch match details for export', matchId, err);
            return match;
        }
    }));

    return enriched;
}

function escapeCsv(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (/[",\n]/.test(str)) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

function buildCsv(players, matches) {
    const playerLookup = (players || []).reduce((acc, p) => {
        acc[p.playerId] = p;
        return acc;
    }, {});

    const csvLines = [];
    
    // Build bowling sheet format: each match is a separate section
    (matches || []).forEach(match => {
        const matchId = match?.matchId || match?.id || '';
        const matchName = match?.opposingTeamName || match?.comment || `Match ${matchId}`;
        const matchDate = match?.date ? new Date(match.date).toLocaleDateString('en-US') : 'Date TBD';
        const perPlayer = match?.perPlayerData || {};

        // Match header section
        csvLines.push([`MATCH: ${matchName}`]);
        csvLines.push([`Date: ${matchDate}`]);
        csvLines.push([]); // Blank line

        // Bowling sheet header
        const header = ['Player Name', 'Grad Year', 'Game 1', 'Game 2', 'Game 3', 'Series', 'Average'];
        csvLines.push(header);

        // Player rows for this match
        const playerRows = [];
        Object.entries(perPlayer).forEach(([playerId, playerData]) => {
            const player = playerLookup[playerId] || {};
            const games = playerData?.games || {};
            
            const game1 = games['1'] && typeof games['1'].Score === 'number' ? games['1'].Score : '';
            const game2 = games['2'] && typeof games['2'].Score === 'number' ? games['2'].Score : '';
            const game3 = games['3'] && typeof games['3'].Score === 'number' ? games['3'].Score : '';
            
            // Calculate series and average
            const scores = [game1, game2, game3].filter(s => s !== '');
            const series = scores.reduce((sum, s) => sum + s, 0);
            const average = scores.length > 0 ? (series / scores.length).toFixed(1) : '';

            playerRows.push([
                player.displayName || 'Unknown Player',
                player.graduationYear || '',
                game1,
                game2,
                game3,
                series,
                average
            ]);
        });

        // Sort by player name
        playerRows.sort((a, b) => (a[0] || '').localeCompare(b[0] || ''));
        playerRows.forEach(row => csvLines.push(row));

        // Calculate team totals
        const teamGame1 = playerRows.reduce((sum, r) => sum + (r[2] || 0), 0);
        const teamGame2 = playerRows.reduce((sum, r) => sum + (r[3] || 0), 0);
        const teamGame3 = playerRows.reduce((sum, r) => sum + (r[4] || 0), 0);
        const teamSeries = teamGame1 + teamGame2 + teamGame3;
        const gamesPlayed = (teamGame1 > 0 ? 1 : 0) + (teamGame2 > 0 ? 1 : 0) + (teamGame3 > 0 ? 1 : 0);
        const teamAvg = gamesPlayed > 0 ? (teamSeries / gamesPlayed).toFixed(1) : '';

        csvLines.push([]); // Blank line before totals
        csvLines.push(['TEAM TOTAL', '', teamGame1, teamGame2, teamGame3, teamSeries, teamAvg]);
        
        // Add spacing between matches
        csvLines.push([]);
        csvLines.push([]);
    });

    if (!csvLines.length) return '';

    return csvLines.map(line => line.map(escapeCsv).join(',').trim()).join('\n');
}

function downloadCsv(csvText) {
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const today = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `kingpin-team-${currentTeamId || 'team'}-export-${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

async function exportTeamSpreadsheet() {
    if (!currentUserId || !currentTeamId) {
        alert('Please log in and select a team before exporting.');
        return;
    }

    const players = cachedPlayers.length ? cachedPlayers : await fetchPlayers();
    let matches = cachedMatches.length ? cachedMatches : await fetchMatches();

    if (!matches.length) {
        alert('No matches available to export yet.');
        return;
    }

    matches = await ensureMatchDetails(matches);
    const csv = buildCsv(players, matches);

    if (!csv) {
        alert('No game data found to export.');
        return;
    }

    downloadCsv(csv);
}
//here ends the export feature
function calculatePlayerAverages(players, matches) {
    const playerStats = {};

    // Initialize stats
    players.forEach(player => {
        playerStats[player.playerId] = {
            playerId: player.playerId,
            displayName: player.displayName,
            graduationYear: player.graduationYear || null,
            totalScore: 0,
            seriesPlayed: 0,
            average: 0
        };
    });

    // Process matches
    matches.forEach(match => {
        if (match.perPlayerData) {
            Object.keys(match.perPlayerData).forEach(playerId => {
                if (playerStats[playerId]) {
                    const playerData = match.perPlayerData[playerId];
                    if (playerData.games) {
                        let seriesTotal = 0;
                        let hasGames = false;
                        Object.values(playerData.games).forEach(game => {
                            if (game && typeof game.Score === 'number') {
                                seriesTotal += game.Score;
                                hasGames = true;
                            }
                        });
                        if (hasGames) {
                            playerStats[playerId].totalScore += seriesTotal;
                            playerStats[playerId].seriesPlayed++;
                        }
                    }
                }
            });
        }
    });

    // Calculate averages
    return Object.values(playerStats).map(stats => {
        if (stats.seriesPlayed > 0) {
            stats.average = stats.totalScore / stats.seriesPlayed;
        }
        return stats;
    });
}

function labelWithArrow(label, column, state) {
    if (state.column !== column) return label;
    return `${label} ${state.ascending ? '▲' : '▼'}`;
}

function formatDate(value) {
    if (!value) return 'Date TBD';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return 'Date TBD';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildMatchSummaries(matches) {
    return (matches || []).map(match => {
        let totalWood = 0;

        if (match.perPlayerData) {
            Object.values(match.perPlayerData).forEach(player => {
                if (player && player.games) {
                    Object.values(player.games).forEach(g => {
                        if (g && typeof g.Wood === 'number') {
                            totalWood += g.Wood;
                        } else if (g && typeof g.Score === 'number') {
                            totalWood += g.Score;
                        }
                    });
                }
            });
        }

        const rawDate = match.date || match.matchDate || null;
        const parsedDate = rawDate ? new Date(rawDate) : null;

        return {
            matchId: match.matchId || match.id,
            name: match.opposingTeamName || match.comment || `Match ${match.matchId || match.id}`,
            dateValue: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.getTime() : null,
            displayDate: formatDate(rawDate),
            totalWood,
            comment: match.comment || ''
        };
    });
}

function sortMatchSummaries(list) {
    const sorted = [...list];
    sorted.sort((a, b) => {
        let result = 0;
        if (matchSortState.column === 'wood') {
            result = (a.totalWood || 0) - (b.totalWood || 0);
        } else {
            const aDate = a.dateValue || 0;
            const bDate = b.dateValue || 0;
            result = aDate - bDate;
        }

        if (!matchSortState.ascending) result *= -1;
        if (result === 0) result = (b.totalWood || 0) - (a.totalWood || 0);
        return result;
    });
    return sorted;
}

async function loadTeamData() {
    if (!currentUserId || !currentTeamId) {
        cachedPlayers = [];
        cachedMatches = [];
        cachedPlayerStats = [];
        cachedMatchSummaries = [];
        renderTopScorers([]);
        renderMatchList();
        return;
    }

    cachedPlayers = await fetchPlayers();
    cachedMatches = await fetchMatches();
    cachedPlayerStats = calculatePlayerAverages(cachedPlayers, cachedMatches);
    cachedMatchSummaries = buildMatchSummaries(cachedMatches);

    renderTopScorers(cachedPlayerStats);
    renderMatchList();
}

async function deletePlayer(playerId, playerName) {
    if (!currentUserId || !currentTeamId || !currentPassword) return;

    if (!confirm(`Are you sure you want to remove ${playerName} from the team? This cannot be undone.`)) return;

    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players/${playerId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword })
        });

        if (!response.ok) throw new Error(`Server ${response.status}`);

        console.log(`Player ${playerId} deleted successfully`);
        loadTeamData(); // Refresh lists
    } catch (error) {
        console.error('Error deleting player:', error);
        alert(`Failed to delete player: ${error.message}`);
    }
}

function renderTopScorers(playerStats) {
    const container = document.getElementById('top-scorers-body');
    const nameBtn = document.getElementById('sort-player-name');
    const totalBtn = document.getElementById('sort-total-score');
    const avgBtn = document.getElementById('sort-average-score');

    if (!container) return;

    if (nameBtn) nameBtn.textContent = labelWithArrow('Player', 'name', topSortState);
    if (totalBtn) totalBtn.textContent = labelWithArrow('Total Score', 'total', topSortState);
    if (avgBtn) avgBtn.textContent = labelWithArrow('Average', 'average', topSortState);

    container.innerHTML = '';

    if (!playerStats || playerStats.length === 0) {
        container.innerHTML = '<div class="empty-row">No players on team yet</div>';
        return;
    }

    const sorted = [...playerStats].sort((a, b) => {
        let comparison = 0;
        if (topSortState.column === 'name') {
            comparison = (a.displayName || '').localeCompare(b.displayName || '', undefined, { sensitivity: 'base' });
        } else if (topSortState.column === 'total') {
            comparison = (a.totalScore || 0) - (b.totalScore || 0);
        } else {
            comparison = (a.average || 0) - (b.average || 0);
        }

        if (!topSortState.ascending) comparison *= -1;
        if (comparison === 0) comparison = (b.seriesPlayed || 0) - (a.seriesPlayed || 0);
        return comparison;
    });

    sorted.forEach(player => {
        const row = document.createElement('div');
        row.className = 'table-row';

        const nameCell = document.createElement('div');
        nameCell.className = 'table-cell name-cell';

        const playerLink = document.createElement('a');
        const gradSuffix = player.graduationYear ? ` (${player.graduationYear})` : ' (—)';
        playerLink.className = 'player-link';
        playerLink.href = '#';
        playerLink.textContent = `${player.displayName}${gradSuffix}`;
        playerLink.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('selectedPlayerId', player.playerId);
            window.location.href = 'plyrScores.html';
        });

        nameCell.appendChild(playerLink);

        const totalCell = document.createElement('div');
        totalCell.className = 'table-cell table-number';
        totalCell.textContent = (player.totalScore || 0).toLocaleString();

        const avgCell = document.createElement('div');
        avgCell.className = 'table-cell table-number';
        const avgDisplay = player.seriesPlayed > 0 ? (player.average || 0).toFixed(1) : '—';
        avgCell.textContent = avgDisplay;

        const gamesCell = document.createElement('div');
        gamesCell.className = 'table-cell table-number table-cell-games';
        gamesCell.textContent = player.seriesPlayed || 0;
        const actionCell = document.createElement('div');
        actionCell.className = 'table-cell table-actions';
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'icon-btn';
        deleteBtn.type = 'button';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Remove player';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePlayer(player.playerId, player.displayName);
        });
        actionCell.appendChild(deleteBtn);

        row.appendChild(nameCell);
        row.appendChild(totalCell);
        row.appendChild(avgCell);
        row.appendChild(gamesCell);
        row.appendChild(actionCell);

        container.appendChild(row);
    });
}

function renderMatchList() {
    const listEl = document.getElementById('match-list');
    const dateBtn = document.getElementById('sort-match-date');
    const woodBtn = document.getElementById('sort-match-wood');

    if (!listEl) return;

    if (!cachedMatchSummaries.length) {
        cachedMatchSummaries = buildMatchSummaries(cachedMatches);
    }

    const sorted = sortMatchSummaries(cachedMatchSummaries);

    if (dateBtn) dateBtn.textContent = labelWithArrow('Date', 'date', matchSortState);
    if (woodBtn) woodBtn.textContent = labelWithArrow('Total Wood', 'wood', matchSortState);

    listEl.innerHTML = '';

    if (sorted.length === 0) {
        listEl.innerHTML = '<div class="empty-row">No matches yet</div>';
        return;
    }

    sorted.forEach(match => {
        const row = document.createElement('div');
        row.className = 'match-row';
        row.dataset.matchId = match.matchId;

        row.innerHTML = `
            <div class="match-info">
                <a class="match-name" href="matchView.html" data-match-id="${match.matchId}">${match.name}</a>
            </div>
            <div class="match-meta">
                <span class="match-pill">${match.displayDate}</span>
                <span class="match-pill">Wood: ${match.totalWood || 0}</span>
            </div>
        `;

        listEl.appendChild(row);
    });
}

async function fetchAndDisplayTopScorers() {
    await loadTeamData();
}

// ------------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayAwards();
    loadTeamData();

    // -- Modal Helpers --
    const setupModal = (triggerId, modalId, closeClass) => {
        const trigger = document.getElementById(triggerId);
        const modal = document.getElementById(modalId);
        const closeBtn = modal ? modal.querySelector('.' + closeClass) : null;

        if (trigger && modal) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.remove('hidden');
                // Reset status messages when opening
                const status = modal.querySelector('p[id$="-status"]');
                if(status) status.textContent = '';
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        }
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        }
    };

    const topSortButtons = [
        { id: 'sort-player-name', column: 'name' },
        { id: 'sort-total-score', column: 'total' },
        { id: 'sort-average-score', column: 'average' }
    ];

    topSortButtons.forEach(btn => {
        const el = document.getElementById(btn.id);
        if (el) {
            el.addEventListener('click', () => {
                if (topSortState.column === btn.column) {
                    topSortState.ascending = !topSortState.ascending;
                } else {
                    topSortState.column = btn.column;
                    topSortState.ascending = (btn.column === 'name'); // numeric columns default high-to-low
                }
                renderTopScorers(cachedPlayerStats);
            });
        }
    });

    const matchSortButtons = [
        { id: 'sort-match-date', column: 'date' },
        { id: 'sort-match-wood', column: 'wood' }
    ];

    matchSortButtons.forEach(btn => {
        const el = document.getElementById(btn.id);
        if (el) {
            el.addEventListener('click', () => {
                if (matchSortState.column === btn.column) {
                    matchSortState.ascending = !matchSortState.ascending;
                } else {
                    matchSortState.column = btn.column;
                    matchSortState.ascending = false;
                }
                renderMatchList();
            });
        }
    });

    const matchList = document.getElementById('match-list');
    if (matchList) {
        matchList.addEventListener('click', (e) => {
            const link = e.target.closest('.match-name');
            if (!link) return;
            e.preventDefault();
            const matchId = link.dataset.matchId || link.closest('.match-row')?.dataset.matchId;
            if (matchId) localStorage.setItem('selectedMatchId', matchId);
            window.location.href = 'matchView.html';
        });
    }

    // 1. New Player Modal
    setupModal('add-new-player-link', 'new-player-modal', 'player-close-btn');

    const playerForm = document.getElementById('new-player-form');
    const playerStatus = document.getElementById('registration-status');

    if (playerForm) {
        playerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const playerName = document.getElementById('player-name').value.trim();
            const graduationYear = document.getElementById('graduation-year').value;
            
            if (!playerName || !currentUserId || !currentTeamId) return;
            
            playerStatus.textContent = 'Registering...';
            playerStatus.style.color = '#fff';

            try {
                const payload = { password: currentPassword, displayName: playerName };
                if (graduationYear) payload.graduationYear = parseInt(graduationYear, 10);

                const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('Registration failed');

                playerStatus.textContent = `Success! ${playerName} added.`;
                playerStatus.style.color = '#4CAF50';
                playerForm.reset();

                setTimeout(() => {
                    document.getElementById('new-player-modal').classList.add('hidden');
                    loadTeamData(); // Refresh data without full reload
                }, 1000);

            } catch (error) {
                playerStatus.textContent = 'Error registering player.';
                playerStatus.style.color = '#f87171';
            }
        });
    }

    // 2. Add Award Modal
    setupModal('add-award-popup-btn', 'add-award-modal', 'award-close-btn');

    const awardForm = document.getElementById('add-award-form');
    const awardTitleInput = document.getElementById('award-title');
    const awardTitleDisplay = document.getElementById('award-title-display');
    const awardStatus = document.getElementById('award-status');

    if (awardTitleInput && awardTitleDisplay) {
        awardTitleInput.addEventListener('input', (e) => {
            awardTitleDisplay.textContent = e.target.value.trim() || 'New Award Title';
        });
    }

    if (awardForm) {
        awardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = awardTitleInput.value.trim();
            const year = document.getElementById('award-year').value;
            
            if (!title) return;

            awardStatus.textContent = 'Saving...';
            awardStatus.style.color = '#fff';

            const success = await addAwardToBackend(title, year);

            if (success) {
                awardStatus.textContent = 'Award Saved!';
                awardStatus.style.color = '#4CAF50';
                awardForm.reset();
                awardTitleDisplay.textContent = 'New Award Title';
                setTimeout(() => {
                    document.getElementById('add-award-modal').classList.add('hidden');
                }, 1000);
            } else {
                awardStatus.textContent = 'Error saving award.';
                awardStatus.style.color = '#f87171';
            }
        });
    }

    const exportBtn = document.getElementById('export-spreadsheet-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTeamSpreadsheet);
    }
});
