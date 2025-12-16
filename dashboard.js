// Function to toggle the sidebar visibility
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('visible'); 
}

const API_BASE = 'https://kingpin-backend-production.up.railway.app';
let currentTeamId = localStorage.getItem('teamId');
let currentUserId = localStorage.getItem('userId');
let currentPassword = localStorage.getItem('password');
let currentTeamDisplayName = localStorage.getItem('teamDisplayName');

// Function to fetch awards from backend and display them
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const team = data.team || data;
        const awards = team.awardsList || [];

        renderAwardsList(awards);
    } catch (error) {
        console.error('Error fetching awards:', error);
        displayEmptyAwards();
    }
}

// Function to render the awards list
function renderAwardsList(awards) {
    const awardsList = document.getElementById('current-awards-list');
    awardsList.innerHTML = '';

    if (awards.length === 0) {
        displayEmptyAwards();
        return;
    }

    awards.forEach((award, index) => {
        const awardItem = document.createElement('div');
        awardItem.classList.add('award-item');
        awardItem.style.display = 'flex';
        awardItem.style.justifyContent = 'space-between';
        awardItem.style.alignItems = 'center';
        awardItem.style.padding = '8px 12px';
        awardItem.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        awardItem.style.borderRadius = '6px';
        awardItem.innerHTML = `
            <span style="display: flex; align-items: center; gap: 8px; flex: 1;">🏆 <span>${award}</span></span>
            <button class="delete-award-btn" data-award="${award}" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 1.2rem; padding: 0 5px; flex-shrink: 0;">&times;</button>
        `;
        awardsList.appendChild(awardItem);

        // Attach delete listener
        const deleteBtn = awardItem.querySelector('.delete-award-btn');
        deleteBtn.addEventListener('click', () => deleteAward(award));
    });
}

// Function to display empty state
function displayEmptyAwards() {
    const awardsList = document.getElementById('current-awards-list');
    awardsList.innerHTML = '<div style="color: rgba(255, 255, 255, 0.5); font-style: italic;">No awards created</div>';
}

// Function to add award to backend
async function addAwardToBackend(awardTitle, awardYear) {
    if (!currentTeamId || !currentPassword) {
        console.error('Missing required fields for award creation.');
        return false;
    }

    try {
        const newAward = `${awardTitle} (${awardYear})`;

        // Add award using POST endpoint
        const response = await fetch(`${API_BASE}/teams/${currentTeamId}/awards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                password: currentPassword, 
                award: newAward
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Server ${response.status}`);
        }

        const data = await response.json();
        const updatedAwards = data.awardsList || data;
        
        // Render the updated awards list
        renderAwardsList(updatedAwards);
        return true;
    } catch (error) {
        console.error('Error adding award:', error);
        return false;
    }
}

// Function to delete award from backend
async function deleteAward(awardToDelete) {
    if (!currentTeamId || !currentPassword) {
        console.error('Missing required fields for award deletion.');
        return;
    }

    try {
        // Delete award using DELETE endpoint
        const response = await fetch(`${API_BASE}/teams/${currentTeamId}/awards`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                password: currentPassword, 
                award: awardToDelete
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Server ${response.status}`);
        }

        const data = await response.json();
        const updatedAwards = data.awardsList || data;
        
        // Render the updated awards list
        renderAwardsList(updatedAwards);
    } catch (error) {
        console.error('Error deleting award:', error);
    }
}

// Function to fetch all players for the current team
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

// Function to fetch all matches for the current team
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

// Function to calculate player averages from match data
function calculatePlayerAverages(players, matches) {
    const playerStats = {};

    // Initialize stats for all players
    players.forEach(player => {
        playerStats[player.playerId] = {
            playerId: player.playerId,
            displayName: player.displayName,
            totalScore: 0,
            gamesPlayed: 0,
            average: 0
        };
    });

    // Process all matches
    matches.forEach(match => {
        if (match.perPlayerData) {
            Object.keys(match.perPlayerData).forEach(playerId => {
                if (playerStats[playerId]) {
                    const playerData = match.perPlayerData[playerId];
                    if (playerData.games) {
                        // Process games 1, 2, 3
                        [1, 2, 3].forEach(gameNum => {
                            const game = playerData.games[gameNum];
                            if (game && game.Score !== undefined && game.Score !== null) {
                                playerStats[playerId].totalScore += game.Score;
                                playerStats[playerId].gamesPlayed++;
                            }
                        });
                    }
                }
            });
        }
    });

    // Calculate averages
    Object.values(playerStats).forEach(stats => {
        if (stats.gamesPlayed > 0) {
            stats.average = Math.round(stats.totalScore / stats.gamesPlayed);
        }
    });

    return Object.values(playerStats);
}

// Function to delete player from backend
async function deletePlayer(playerId, playerName) {
    if (!currentUserId || !currentTeamId || !currentPassword) {
        console.error('Missing required fields for player deletion.');
        return;
    }

    const confirmed = confirm(`Are you sure you want to remove ${playerName} from the team?`);
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players/${playerId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Server ${response.status}`);
        }

        console.log(`Player ${playerId} deleted successfully`);
        // Refresh the top scorers list
        fetchAndDisplayTopScorers();
    } catch (error) {
        console.error('Error deleting player:', error);
        alert(`Failed to delete player: ${error.message}`);
    }
}

// Function to render top scorers
function renderTopScorers(playerStats) {
    const topScorersList = document.getElementById('top-scorers-list');
    if (!topScorersList) return;

    topScorersList.innerHTML = '';

    if (playerStats.length === 0) {
        topScorersList.innerHTML = '<li style="color: rgba(255, 255, 255, 0.5); font-style: italic;">No players on team yet</li>';
        return;
    }

    // Separate players with games from those without
    const playersWithGames = playerStats.filter(p => p.gamesPlayed > 0);
    const playersWithoutGames = playerStats.filter(p => p.gamesPlayed === 0);

    let displayPlayers = [];
    
    if (playersWithGames.length > 0) {
        // Show top 5 players by average
        displayPlayers = playersWithGames.sort((a, b) => b.average - a.average).slice(0, 5);
    } else {
        // No match data, show all players (up to 5)
        displayPlayers = playersWithoutGames.slice(0, 5);
    }

    displayPlayers.forEach((player, index) => {
        const li = document.createElement('li');
        li.style.fontWeight = index === 0 && player.gamesPlayed > 0 ? '700' : '400';
        li.style.marginBottom = '5px';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        
        const link = document.createElement('a');
        link.href = '#';
        const avgDisplay = player.gamesPlayed > 0 ? player.average : 'N/A';
        link.textContent = `${player.displayName} (${avgDisplay})`;
        link.style.color = 'inherit';
        link.style.textDecoration = 'none';
        link.style.cursor = 'pointer';
        link.style.flex = '1';
        link.addEventListener('mouseover', () => {
            link.style.textDecoration = 'underline';
        });
        link.addEventListener('mouseout', () => {
            link.style.textDecoration = 'none';
        });
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Store player ID in localStorage
            localStorage.setItem('selectedPlayerId', player.playerId);
            console.log(`Selected player: ${player.displayName} (ID: ${player.playerId})`);
            // Navigate to player page (update with actual page URL)
            window.location.href = 'plyrScores.html';
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = '×';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.color = 'rgba(255, 255, 255, 0.5)';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '1.5rem';
        deleteBtn.style.padding = '0 5px';
        deleteBtn.style.marginLeft = '10px';
        deleteBtn.addEventListener('mouseover', () => {
            deleteBtn.style.color = '#fff';
        });
        deleteBtn.addEventListener('mouseout', () => {
            deleteBtn.style.color = 'rgba(255, 255, 255, 0.5)';
        });
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePlayer(player.playerId, player.displayName);
        });
        
        li.appendChild(link);
        li.appendChild(deleteBtn);
        topScorersList.appendChild(li);
    });
}

// Function to fetch and display top scorers
async function fetchAndDisplayTopScorers() {
    const players = await fetchPlayers();
    const matches = await fetchMatches();
    const playerStats = calculatePlayerAverages(players, matches);
    renderTopScorers(playerStats);
}

document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display awards on page load
    fetchAndDisplayAwards();
    
    // Fetch and display top scorers
    fetchAndDisplayTopScorers();

    // ------------------------------------------------------------------
    // 1. New Player Modal Logic
    // ------------------------------------------------------------------
    const newPlayerLink = document.getElementById('add-new-player-link');
    const playerModal = document.getElementById('new-player-modal');
    const playerCloseBtn = playerModal.querySelector('.player-close-btn'); 
    const playerForm = document.getElementById('new-player-form');
    const statusMessage = document.getElementById('registration-status');

    // Open Player Modal Listener
    if (newPlayerLink) {
        newPlayerLink.addEventListener('click', (e) => {
            e.preventDefault();
            playerModal.classList.remove('hidden');
        });
    }

    // Close Player Modal Listeners
    if (playerCloseBtn) {
        playerCloseBtn.addEventListener('click', () => {
            playerModal.classList.add('hidden');
        });
    }
    playerModal.addEventListener('click', (e) => {
        if (e.target === playerModal) {
            playerModal.classList.add('hidden');
        }
    });

    // Player Form Submission Handler (Backend integration)
    if (playerForm) {
        playerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const playerName = document.getElementById('player-name').value.trim();
            const graduationYear = document.getElementById('graduation-year').value;
            
            if (!playerName) {
                statusMessage.textContent = 'Please enter a player name.';
                statusMessage.style.color = '#f87171';
                return;
            }

            if (!currentUserId || !currentTeamId || !currentPassword) {
                statusMessage.textContent = 'Error: Missing user or team information.';
                statusMessage.style.color = '#f87171';
                return;
            }
            
            statusMessage.textContent = `Attempting to register ${playerName}...`;
            statusMessage.style.color = '#fff';

            try {
                const payload = {
                    password: currentPassword,
                    displayName: playerName
                };

                // Add graduationYear if provided (must be a valid number)
                if (graduationYear && graduationYear.trim() !== '') {
                    const yearNum = parseInt(graduationYear, 10);
                    if (!isNaN(yearNum)) {
                        payload.graduationYear = yearNum;
                    }
                }

                console.log('Creating player with payload:', JSON.stringify(payload));
                console.log('Endpoint:', `${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players`);

                const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const text = await response.text();
                    console.error('Server response:', response.status, text);
                    throw new Error(text || `Server ${response.status}`);
                }

                const data = await response.json();
                console.log('Player created successfully:', data);
                statusMessage.textContent = `STRIKE! ${playerName} registered successfully! Welcome to the League.`;
                statusMessage.style.color = '#4CAF50';
                playerForm.reset();

                // Auto-dismiss modal and reload page after 1.5 seconds
                setTimeout(() => {
                    playerModal.classList.add('hidden');
                    statusMessage.textContent = '';
                    window.location.reload();
                }, 1500);
            } catch (error) {
                console.error('Error registering player:', error);
                statusMessage.textContent = `Failed to register player: ${error.message}`;
                statusMessage.style.color = '#f87171';
            }
        });
    }

    // ------------------------------------------------------------------
    // 2. Add Award Modal Logic (With backend integration)
    // ------------------------------------------------------------------
    const addAwardBtn = document.getElementById('add-award-popup-btn');
    const awardModal = document.getElementById('add-award-modal');
    const awardCloseBtn = awardModal.querySelector('.award-close-btn');
    const awardForm = document.getElementById('add-award-form');
    const awardTitleInput = document.getElementById('award-title');
    const awardTitleDisplay = document.getElementById('award-title-display');
    const awardStatus = document.getElementById('award-status');
    
    // Open Award Modal Listener
    if (addAwardBtn) {
        addAwardBtn.addEventListener('click', () => {
            awardModal.classList.remove('hidden');
            awardStatus.textContent = ''; 
        });
    }

    // Close Award Modal Listeners
    if (awardCloseBtn) {
        awardCloseBtn.addEventListener('click', () => {
            awardModal.classList.add('hidden');
        });
    }
    awardModal.addEventListener('click', (e) => {
        if (e.target === awardModal) {
            awardModal.classList.add('hidden');
        }
    });

    // Update trophy title as user types
    if (awardTitleInput) {
        awardTitleInput.addEventListener('input', (e) => {
            const title = e.target.value.trim() || 'New Award Title';
            awardTitleDisplay.textContent = title;
        });
    }

    // Award Form Submission Handler (now with backend integration)
    if (awardForm) {
        awardForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = awardTitleInput.value.trim();
            const year = document.getElementById('award-year').value;

            if (!title || !year) {
                awardStatus.textContent = 'Please fill in all fields.';
                awardStatus.style.color = '#f87171';
                return;
            }

            awardStatus.textContent = `Saving award "${title}" for ${year}...`;
            awardStatus.style.color = '#fff';

            const success = await addAwardToBackend(title, year);

            if (success) {
                awardStatus.textContent = `Success! The team won the "${title}" in ${year}!`;
                awardStatus.style.color = '#4CAF50';
                awardForm.reset();
                awardTitleDisplay.textContent = 'New Award Title';

                // Auto-dismiss modal after 1 second
                setTimeout(() => {
                    awardModal.classList.add('hidden');
                }, 1000);
            } else {
                awardStatus.textContent = 'Failed to save award. Please try again.';
                awardStatus.style.color = '#f87171';
            }
        });
    }

    // ------------------------------------------------------------------
    // 3. Account Settings Icon Logic
    // ------------------------------------------------------------------
    const settingsIconBtn = document.getElementById('settings-icon-btn');
    if (settingsIconBtn) {
        settingsIconBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }

    console.log('Dashboard components initialized. Data is ready to roll!');
});
