const API_BASE = 'https://kingpin-backend-production.up.railway.app';
let currentTeamId = localStorage.getItem('teamId');
let currentUserId = localStorage.getItem('userId');
let teamData = [];
let sortState = {
    column: null,
    ascending: true
};

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
document.addEventListener('DOMContentLoaded', addBackToLoginButton);
