const API_BASE = 'https://kingpin-backend-production.up.railway.app';
let currentTeamId = localStorage.getItem('teamId');
let currentUserId = localStorage.getItem('userId');
let teamData = [];
let sortState = {
    column: null,
    ascending: true
};

// Helper: treat zeros as "no score" and only count finite non-zero numbers
function isCountedScore(s) {
    return s != null && Number.isFinite(s) && Number(s) !== 0;
}

/**
 * Fetch all players for the current team
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
 * Fetch all matches for the current team
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

/**
 * Calculate player statistics from match data
 */
function calculatePlayerStats(players, matches) {
    const playerStats = {};

    // Initialize stats for all players
    players.forEach(player => {
        playerStats[player.playerId] = {
            playerId: player.playerId,
            displayName: player.displayName,
            graduationYear: player.graduationYear || null,
            matchesPlayed: 0,
            game1Total: 0,
            game1Count: 0,
            game2Total: 0,
            game2Count: 0,
            game3Total: 0,
            game3Count: 0,
            bestGame: 0
        };
    });

    // Process all matches
    matches.forEach(match => {
        if (match.perPlayerData) {
            Object.keys(match.perPlayerData).forEach(playerId => {
                if (playerStats[playerId]) {
                    const playerData = match.perPlayerData[playerId];
                    
                    // Increment matches played if player has any game data
                    let hasGameData = false;
                    
                    if (playerData.games) {
                        // Process each game and only count non-zero scores
                        [1, 2, 3].forEach(gameNum => {
                            const game = playerData.games[gameNum];
                            if (game && isCountedScore(game.Score)) {
                                const score = game.Score;
                                hasGameData = true;

                                if (gameNum === 1) {
                                    playerStats[playerId].game1Total += score;
                                    playerStats[playerId].game1Count++;
                                } else if (gameNum === 2) {
                                    playerStats[playerId].game2Total += score;
                                    playerStats[playerId].game2Count++;
                                } else if (gameNum === 3) {
                                    playerStats[playerId].game3Total += score;
                                    playerStats[playerId].game3Count++;
                                }

                                // Track best game
                                if (score > playerStats[playerId].bestGame) {
                                    playerStats[playerId].bestGame = score;
                                }
                            }
                        });
                    }
                    
                    if (hasGameData) {
                        playerStats[playerId].matchesPlayed++;
                    }
                }
            });
        }
    });

    // Calculate averages
    Object.values(playerStats).forEach(stats => {
        stats.game1Avg = stats.game1Count > 0 ? Math.round(stats.game1Total / stats.game1Count) : null;
        stats.game2Avg = stats.game2Count > 0 ? Math.round(stats.game2Total / stats.game2Count) : null;
        stats.game3Avg = stats.game3Count > 0 ? Math.round(stats.game3Total / stats.game3Count) : null;
        
        // Calculate total wood average
        const avgCount = (stats.game1Avg ? 1 : 0) + (stats.game2Avg ? 1 : 0) + (stats.game3Avg ? 1 : 0);
        const avgSum = (stats.game1Avg || 0) + (stats.game2Avg || 0) + (stats.game3Avg || 0);
        stats.totalWoodAvg = avgCount > 0 ? Math.round(avgSum / avgCount) : null;
    });

    return Object.values(playerStats);
}

/**
 * Sort team data by specified column
 */
function sortData(column) {
    // Toggle sort direction if clicking same column
    if (sortState.column === column) {
        sortState.ascending = !sortState.ascending;
    } else {
        sortState.column = column;
        sortState.ascending = true;
    }

    teamData.sort((a, b) => {
        let aVal, bVal;

        if (column === 'name') {
            aVal = a.displayName.toLowerCase();
            bVal = b.displayName.toLowerCase();
            return sortState.ascending 
                ? aVal.localeCompare(bVal) 
                : bVal.localeCompare(aVal);
        } else {
            // For numeric columns, treat null as -1 for sorting
            aVal = a[column] !== null ? a[column] : -1;
            bVal = b[column] !== null ? b[column] : -1;
            return sortState.ascending ? aVal - bVal : bVal - aVal;
        }
    });

    renderTeamStats();
}

/**
 * Renders the team member data into the HTML table.
 */
function renderTeamStats() {
    const tableBody = document.getElementById('team-stats-body');
    
    // Clear existing content
    tableBody.innerHTML = ''; 

    if (teamData.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-500 italic">
                    No players on team yet
                </td>
            </tr>
        `;
        return;
    }

    teamData.forEach(player => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-800 cursor-pointer'; 
        
        // Make row clickable to navigate to player scores page
        row.addEventListener('click', () => {
            // Store player ID in localStorage
            localStorage.setItem('selectedPlayerId', player.playerId);
            window.location.href = 'plyrScores.html';
        });

        const displayValue = (val) => val !== null ? val : 'N/A';

        row.innerHTML = `
            <td class="px-3 py-4 whitespace-nowrap md:px-6">
                <div class="text-sm font-medium text-white">${player.displayName}</div>
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-300 md:px-6">
                ${displayValue(player.graduationYear)}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-300 md:px-6">
                ${player.matchesPlayed}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-300 md:px-6">
                ${displayValue(player.game1Avg)}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-300 md:px-6">
                ${displayValue(player.game2Avg)}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-300 md:px-6">
                ${displayValue(player.game3Avg)}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-300 md:px-6">
                ${displayValue(player.totalWoodAvg)}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-300 md:px-6">
                ${displayValue(player.bestGame > 0 ? player.bestGame : null)}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Initialize the page
 */
async function initializePage() {
    // Set team title
    const teamDisplayName = localStorage.getItem('teamDisplayName') || 'Team';
    const teamTitle = document.getElementById('team-title');
    if (teamTitle) {
        teamTitle.textContent = `${teamDisplayName} Overview`;
    }
    
    // Fetch data
    const players = await fetchPlayers();
    const matches = await fetchMatches();
    
    // Calculate stats
    const playerStats = calculatePlayerStats(players, matches);
    
    // Sort alphabetically by default
    teamData = playerStats.sort((a, b) => a.displayName.localeCompare(b.displayName));
    
    // Render the table
    renderTeamStats();
}

// Run when the page loads
window.onload = () => {
    initializePage();
    
    // Add navigation button event listeners
    const accountSettingsBtn = document.getElementById('account-settings-btn');
    if (accountSettingsBtn) {
        accountSettingsBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }
    
    const backToTeamSelectorBtn = document.getElementById('back-to-team-selector-btn');
    if (backToTeamSelectorBtn) {
        backToTeamSelectorBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }
};
