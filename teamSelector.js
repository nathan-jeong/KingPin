// --- API Configuration and Backend Hooks ---
// ⚠️ TEMPLATE: Replace these with your actual backend URLs and logic
const API_BASE_URL = 'https://kingpin-backend-production.up.railway.app';

/**
 * Calculates wins and losses from matches (same logic as dashboard)
 */
function calculateTeamRecord(matches) {
    if (!Array.isArray(matches)) matches = [];
    
    let wins = 0;
    let losses = 0;
    
    matches.forEach(m => {
        if (m.teamWonMatch === true) {
            wins++;
        } else if (m.teamWonMatch === false) {
            losses++;
        }
    });
    
    return { wins, losses };
}

/**
 * Fetches matches for a specific team
 */
async function fetchTeamMatches(userId, teamId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/teams/${teamId}/matches`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.warn(`Could not fetch matches for team ${teamId}`);
            return [];
        }
        
        const data = await response.json();
        return data.matches || [];
    } catch (error) {
        console.error(`Error fetching matches for team ${teamId}:`, error);
        return [];
    }
}

/**
 * Fetches full team details including code
 */
async function fetchTeamDetails(userId, teamId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/teams/${teamId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.warn(`Could not fetch details for team ${teamId}`);
            return {};
        }
        
        const data = await response.json();
        return data.team || data;
    } catch (error) {
        console.error(`Error fetching team details for team ${teamId}:`, error);
        return {};
    }
}

/**
 * Fetches the list of teams from a backend API and calculates their records.
 */
async function fetchTeamsFromBackend() {
    console.log("Fetching teams from backend...");
    try {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            console.warn("No userId found in localStorage. Cannot fetch teams.");
            return [];
        }

        const response = await fetch(`${API_BASE_URL}/users/${userId}/teams`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const teamsData = await response.json();
        console.log("Teams fetched successfully:", teamsData);
        
        let teams = [];
        if (teamsData.teams && Array.isArray(teamsData.teams)) {
            teams = teamsData.teams;
        } else if (Array.isArray(teamsData)) {
            teams = teamsData;
        } else {
            console.warn("Response is not in expected format:", teamsData);
            return [];
        }

        console.log(`Found ${teams.length} teams, now fetching details and matches for each...`);

        // For each team, fetch full details and matches to get code and record
        for (let team of teams) {
            try {
                const [teamDetails, matches] = await Promise.all([
                    fetchTeamDetails(userId, team.teamId),
                    fetchTeamMatches(userId, team.teamId)
                ]);
                
                // Merge team details (includes code)
                if (teamDetails && typeof teamDetails === 'object') {
                    Object.assign(team, teamDetails);
                }
                
                // Calculate record
                const record = calculateTeamRecord(matches);
                team.wins = record.wins;
                team.losses = record.losses;
                
                console.log(`Loaded team ${team.displayName}: ${team.wins}-${team.losses}, code: ${team.code || 'N/A'}`);
            } catch (err) {
                console.error(`Failed to load details for team ${team.teamId}:`, err);
                // Set defaults if fetch fails
                team.wins = team.wins || 0;
                team.losses = team.losses || 0;
                team.code = team.code || 'N/A';
            }
        }

        console.log("All teams loaded:", teams);
        return teams;

    } catch (error) {
        console.error("Could not fetch teams:", error);
        return []; 
    }
}

/**
 * Saves a new team object to the backend API.
 */
async function saveNewTeamToBackend(newTeam) {
    console.log("Saving new team to backend:", newTeam);
    try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            throw new Error('User ID not found. Please log in first.');
        }

        const response = await fetch(`${API_BASE_URL}/users/${userId}/teams`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(newTeam),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server ${response.status}: ${errorText || response.statusText}`);
        }

        const savedTeam = await response.json();
        console.log("Team saved successfully:", savedTeam);
        return savedTeam; 
    } catch (error) {
        console.error("Could not save new team:", error);
        throw error;
    }
}

// --- DOM Elements ---
const scrollContainer = document.getElementById('team-scroll-container');
const ballIndicator = document.getElementById('ball-indicator');
const track = ballIndicator ? ballIndicator.parentElement : null; 
const modal = document.getElementById('team-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const newTeamForm = document.getElementById('new-team-form');
const submissionMessage = document.getElementById('submission-message');

let isDragging = false;
let currentTeamsData = []; 

// --- Data Handling ---

function extractYearFromDisplayName(displayName) {
    if (!displayName) return 0;
    const match = displayName.match(/\((\d{4})\)/);
    return match ? parseInt(match[1], 10) : 0;
}

function renderTeams(currentTeams) {
    scrollContainer.innerHTML = ''; 

    if (currentTeams.length === 0) {
        // UPDATED: Styling to match Dark Mode CSS
        scrollContainer.innerHTML = `
            <div class="team-card flex-shrink-0 w-64 h-80 flex flex-col justify-center items-center text-center opacity-70">
                <p class="text-xl font-medium text-gray-300">No teams yet!</p>
                <p class="text-sm text-gray-500 mt-2">Click 'Create New League/Team' to start.</p>
            </div>
        `;
        return;
    } 
    
    currentTeams.forEach(team => {
        const card = document.createElement('div');
        
        // UPDATED: Removed bg-white, border-gray, shadow-lg. 
        // We rely on the CSS class .team-card for colors and borders.
        card.className = "team-card flex-shrink-0 w-64 h-80 flex flex-col justify-center items-center text-center relative";
        
        card.dataset.teamId = team.teamId;
        card.dataset.displayName = team.displayName || 'Untitled Team';
        
        const wins = team.wins || 0;
        const losses = team.losses || 0;
        const teamCode = team.code || 'N/A';
        
        card.innerHTML = `
            <button class="delete-team-btn absolute top-2 right-2 text-gray-500 hover:text-white font-bold text-2xl transition-colors z-10" aria-label="Delete team">
                ×
            </button>
            <p class="team-name text-3xl font-semibold mb-4">${team.displayName || 'Untitled Team'}</p>
            <p class="text-lg text-gray-300 mb-2">Record: <span class="font-bold">${wins}-${losses}</span></p>
            <p class="text-sm text-gray-400">Code: <span class="font-mono font-semibold">${teamCode}</span></p>
        `;
        scrollContainer.appendChild(card);

        // Attach click listener for selection
        card.addEventListener('click', handleTeamCardClick);
        
        // Attach delete button listener
        const deleteBtn = card.querySelector('.delete-team-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent card click event
                handleDeleteTeam(team.teamId, team.displayName);
            });
        }
    });

    const padding = document.createElement('div');
    padding.className = 'flex-shrink-0 w-4 h-1';
    scrollContainer.appendChild(padding);
    
    const teamCountNumber = document.getElementById('team-count-number');
    if (teamCountNumber) {
        teamCountNumber.textContent = currentTeams.length;
    }
    updateBallPosition(); 
}

// --- Event Handlers ---

async function handleDeleteTeam(teamId, teamDisplayName) {
    const confirmed = confirm(`Are you sure you want to delete "${teamDisplayName}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
        const userId = localStorage.getItem('userId');
        const password = localStorage.getItem('password') || '';

        if (!userId) {
            alert('Error: User ID not found. Please log in again.');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/users/${userId}/teams/${teamId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server ${response.status}: ${errorText || response.statusText}`);
        }

        console.log(`Team ${teamId} deleted successfully`);
        currentTeamsData = currentTeamsData.filter(team => team.teamId !== teamId);
        renderTeams(currentTeamsData);

    } catch (error) {
        console.error('Error deleting team:', error);
        alert(`Failed to delete team: ${error.message}`);
    }
}

function handleTeamCardClick(event) {
    const card = event.currentTarget;
    
    // UPDATED: Only use 'selected'. The CSS handles the border color change.
    document.querySelectorAll('.team-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    
    const teamName = card.dataset.displayName || card.querySelector('p:first-child').textContent;
    const teamId = card.dataset.teamId;
    console.log(`Team Selected: ${teamName} (${teamId})`);
    
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });

    localStorage.setItem('teamId', teamId);
    localStorage.setItem('teamDisplayName', teamName);
    window.location.href = "dashboard.html";
}

// --- Modal Logic ---

function showModal() {
    if (modal) {
        modal.classList.remove('hidden');
    }
    if (submissionMessage) {
        submissionMessage.classList.add('hidden');
    }
}

function hideModal() {
    if (modal) {
        modal.classList.add('hidden');
    }
    if (newTeamForm) {
        newTeamForm.reset();
    }
}

async function handleSubmitNewTeam(e) { 
    e.preventDefault();
    
    const teamNameInput = document.getElementById('team-name');
    const teamYearInput = document.getElementById('team-year');
    const submitButton = document.getElementById('submit-team-btn');
    
    const name = teamNameInput.value.trim();
    const year = parseInt(teamYearInput.value, 10);
    
    if (!name || isNaN(year)) {
        if (submissionMessage) {
            submissionMessage.textContent = "Please enter a valid Team Name and Year.";
            submissionMessage.classList.remove('hidden');
        }
        return;
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Adding...';
    }
    if (submissionMessage) {
        submissionMessage.classList.add('hidden');
    }

    try {
        const userId = localStorage.getItem('userId');
        const password = localStorage.getItem('password');
        
        if (!userId) {
            if (submissionMessage) {
                submissionMessage.textContent = "Error: User not logged in. Please log in first.";
                submissionMessage.classList.remove('hidden');
            }
            return;
        }

        const newTeamPayload = {
            password: password,
            displayName: name + ' (' + year + ')'
        };

        const savedTeam = await saveNewTeamToBackend(newTeamPayload);
        
        if (!savedTeam.displayName) {
            savedTeam.displayName = newTeamPayload.displayName;
        }

        currentTeamsData.push(savedTeam);
        
        currentTeamsData.sort((a, b) => {
            const yearA = extractYearFromDisplayName(a.displayName);
            const yearB = extractYearFromDisplayName(b.displayName);
            return yearB - yearA; 
        }); 

        renderTeams(currentTeamsData);
        hideModal();
        
        // Reload the page to refresh the team list
        setTimeout(() => {
            window.location.reload();
        }, 500);
        
    } catch (error) {
        console.error("Error adding team: ", error);
        if (submissionMessage) {
            submissionMessage.textContent = "Failed to add team. Please try again. Check console for details.";
            submissionMessage.classList.remove('hidden');
        }
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'Submit Team';
        }
    }
}

if (openModalBtn) openModalBtn.addEventListener('click', showModal);
if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
if (newTeamForm) newTeamForm.addEventListener('submit', handleSubmitNewTeam);

// --- Bowling Ball Drag and Scroll Logic ---

function updateBallPosition() {
    if (isDragging || !ballIndicator || !track) return;
    
    const scrollWidth = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    const scrollPosition = scrollContainer.scrollLeft;

    if (scrollWidth > 0) {
        const scrollPercent = scrollPosition / scrollWidth;
        const maxTravel = track.clientWidth; 
        const newLeft = (scrollPercent * maxTravel); 
        
        ballIndicator.style.left = `${Math.max(0, Math.min(maxTravel, newLeft))}px`;
    } else {
        ballIndicator.style.left = `0px`;
    }
}

function startDrag(clientX) {
    isDragging = true;
    if (ballIndicator) {
        // The CSS handles cursor: grabbing via :active or .grabbing
        ballIndicator.classList.add('grabbing');
    }
}

function doDrag(clientX) {
    if (!isDragging || !ballIndicator || !track) return;
    
    const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    if (maxScrollLeft <= 0) return;

    const trackRect = track.getBoundingClientRect();
    
    let scrollRatio = (clientX - trackRect.left) / trackRect.width;
    scrollRatio = Math.max(0, Math.min(1, scrollRatio));
    
    const newScrollLeft = scrollRatio * maxScrollLeft;
    
    scrollContainer.scrollLeft = newScrollLeft;
    ballIndicator.style.left = `${scrollRatio * trackRect.width}px`;
}

function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    if (ballIndicator) {
        ballIndicator.classList.remove('grabbing');
    }
    updateBallPosition(); 
}

// Attach Drag/Scroll Listeners 
if (ballIndicator) {
    ballIndicator.addEventListener('mousedown', (e) => {
        e.preventDefault(); 
        startDrag(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
        doDrag(e.clientX);
    });
    window.addEventListener('mouseup', () => {
        endDrag();
    });

    ballIndicator.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        startDrag(touch.clientX);
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        doDrag(touch.clientX);
    }, { passive: false });
    window.addEventListener('touchend', () => {
        endDrag();
    });
}

if (scrollContainer) scrollContainer.addEventListener('scroll', updateBallPosition);
window.addEventListener('resize', updateBallPosition);

// --- Initialization ---

async function initializeApp() { 
    const fetchedTeams = await fetchTeamsFromBackend();
    
    fetchedTeams.sort((a, b) => {
        const yearA = extractYearFromDisplayName(a.displayName);
        const yearB = extractYearFromDisplayName(b.displayName);
        return yearB - yearA; 
    }); 
    
    currentTeamsData = fetchedTeams;
    renderTeams(currentTeamsData);

    const accountSettingsBtn = document.getElementById('account-settings-btn');
    if (accountSettingsBtn) {
        accountSettingsBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }
}

window.onload = initializeApp;
