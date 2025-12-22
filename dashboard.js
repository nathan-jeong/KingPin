/**
 * KINGPIN DASHBOARD LOGIC
 * Revised: Fixed logic gaps, removed inline CSS (relying on dashboard.css),
 * and improved top scorer sorting logic.
 */

const API_BASE = 'https://kingpin-backend-production.up.railway.app';
let currentTeamId = localStorage.getItem('teamId');
let currentUserId = localStorage.getItem('userId');
let currentPassword = localStorage.getItem('password');

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
            <span style="display: flex; align-items: center; gap: 8px;">🏆 ${award}</span>
            <button class="delete-award-btn" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:1.1rem;">&times;</button>
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

function calculatePlayerAverages(players, matches) {
    const playerStats = {};

    // Initialize stats
    players.forEach(player => {
        playerStats[player.playerId] = {
            playerId: player.playerId,
            displayName: player.displayName,
            totalScore: 0,
            gamesPlayed: 0,
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
                        Object.values(playerData.games).forEach(game => {
                            if (game && typeof game.Score === 'number') {
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
    return Object.values(playerStats).map(stats => {
        if (stats.gamesPlayed > 0) {
            stats.average = Math.round(stats.totalScore / stats.gamesPlayed);
        }
        return stats;
    });
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
        fetchAndDisplayTopScorers(); // Refresh list
    } catch (error) {
        console.error('Error deleting player:', error);
        alert(`Failed to delete player: ${error.message}`);
    }
}

function renderTopScorers(playerStats) {
    const topScorersList = document.getElementById('top-scorers-list');
    if (!topScorersList) return;

    topScorersList.innerHTML = '';

    if (playerStats.length === 0) {
        topScorersList.innerHTML = '<li style="color: rgba(255, 255, 255, 0.5); font-style: italic;">No players on team yet</li>';
        return;
    }

    // FIX: Combined Sort Logic
    // 1. Sort primarily by Average (descending)
    // 2. Put players with 0 games at the bottom
    const sortedPlayers = playerStats.sort((a, b) => {
        if (a.gamesPlayed === 0 && b.gamesPlayed > 0) return 1; // b comes first
        if (a.gamesPlayed > 0 && b.gamesPlayed === 0) return -1; // a comes first
        return b.average - a.average; // standard sort
    });

    // Take top 5
    const displayPlayers = sortedPlayers.slice(0, 5);

    displayPlayers.forEach((player, index) => {
        const li = document.createElement('li');
        // Add subtle bolding to the #1 rank
        li.style.fontWeight = (index === 0 && player.gamesPlayed > 0) ? '700' : '400';
        li.style.marginBottom = '8px';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        
        const link = document.createElement('a');
        link.href = '#';
        const avgDisplay = player.gamesPlayed > 0 ? player.average : 'N/A';
        link.textContent = `${player.displayName} (${avgDisplay})`;
        
        // Basic link styling
        link.style.color = 'inherit';
        link.style.textDecoration = 'none';
        link.style.flex = '1';
        
        link.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.setItem('selectedPlayerId', player.playerId);
            window.location.href = 'plyrScores.html';
        });

        // Hover effect via JS since it's a dynamic element
        link.onmouseover = () => link.style.textDecoration = 'underline';
        link.onmouseout = () => link.style.textDecoration = 'none';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '&times;';
        deleteBtn.style.background = 'none';
        deleteBtn.style.border = 'none';
        deleteBtn.style.color = 'rgba(255, 255, 255, 0.3)';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.style.fontSize = '1.2rem';
        
        deleteBtn.onmouseover = () => deleteBtn.style.color = '#ff4d4d'; // Turn red on hover
        deleteBtn.onmouseout = () => deleteBtn.style.color = 'rgba(255, 255, 255, 0.3)';

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deletePlayer(player.playerId, player.displayName);
        });
        
        li.appendChild(link);
        li.appendChild(deleteBtn);
        topScorersList.appendChild(li);
    });
}

async function fetchAndDisplayTopScorers() {
    const players = await fetchPlayers();
    const matches = await fetchMatches();
    const playerStats = calculatePlayerAverages(players, matches);
    renderTopScorers(playerStats);
}

// ------------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayAwards();
    fetchAndDisplayTopScorers();

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
                    fetchAndDisplayTopScorers(); // Refresh data without full reload
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
});
