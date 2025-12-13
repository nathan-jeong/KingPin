// --- API Configuration and Backend Hooks ---
// ⚠️ TEMPLATE: Replace these with your actual backend URLs and logic
const API_BASE_URL = 'https://kingpin-backend-production.up.railway.app'; // Example Node.js/Express server URL

/**
 * Fetches the list of teams from a backend API.
 * ⚠️ TEMPLATE: Update this endpoint to match your backend route.
 * @returns {Promise<Array<Object>>} A promise that resolves with the team data.
 */
async function fetchTeamsFromBackend() {
    console.log("Fetching teams from backend...");
    try {
        // Get userId from localStorage (set during login)
        const userId = localStorage.getItem('userId');

        if (!userId) {
            console.warn("No userId found in localStorage. Cannot fetch teams.");
            return [];
        }

        // TODO: Replace with your actual backend endpoint
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
        
        // Handle response structure: { teams: [...] }
        if (teamsData.teams && Array.isArray(teamsData.teams)) {
            return teamsData.teams;
        }
        // If response is directly an array, return it
        if (Array.isArray(teamsData)) {
            return teamsData;
        }
        // Otherwise, return empty array
        console.warn("Response is not in expected format:", teamsData);
        return [];

    } catch (error) {
        console.error("Could not fetch teams:", error);
        return []; // Return empty array on error
    }
}

/**
 * Saves a new team object to the backend API.
 * ⚠️ TEMPLATE: Update this endpoint and schema to match your backend.
 * @param {Object} newTeam - The team data (name, year) to save.
 * @returns {Promise<Object>} A promise that resolves with the saved team object (including its new ID).
 */
async function saveNewTeamToBackend(newTeam) {
    console.log("Saving new team to backend:", newTeam);
    try {
        // Get userId from localStorage
        const userId = localStorage.getItem('userId');
        if (!userId) {
            throw new Error('User ID not found. Please log in first.');
        }

        // TODO: Replace with your actual backend endpoint and schema
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
        return savedTeam; // Backend should return the saved team with its ID
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
let currentTeamsData = []; // Store the fetched teams globally for re-rendering

// --- Data Handling ---

function renderTeams(currentTeams) {
    // ... (NO CHANGE HERE) ...
    // Remove all existing children
    scrollContainer.innerHTML = ''; 

    if (currentTeams.length === 0) {
        // Add a message if no teams exist
        scrollContainer.innerHTML = `
            <div class="team-card flex-shrink-0 w-64 h-80 bg-gray-100 border-4 border-dashed border-gray-400 rounded-xl p-6 flex flex-col justify-center items-center text-center">
                <p class="text-xl font-medium text-gray-500">No teams yet!</p>
                <p class="text-sm text-gray-400">Click 'Create New League/Team' to start.</p>
            </div>
        `;
    } 
    
    currentTeams.forEach(team => {
        const card = document.createElement('div');
        card.className = "team-card flex-shrink-0 w-64 h-80 bg-white border-4 border-gray-200 rounded-xl shadow-lg p-6 flex flex-col justify-center items-center text-center hover:shadow-xl hover:border-gray-300";
        card.dataset.teamId = team.teamId;
        card.dataset.displayName = team.displayName || 'Untitled Team';
        card.innerHTML = `
            <p class="text-3xl font-semibold mb-2">${team.displayName || 'Untitled Team'}</p>
            <!-- TODO: Add additional fields to display (e.g., player count, awards, etc.) -->
        `;
        scrollContainer.appendChild(card);

        // Attach click listener for selection
        card.addEventListener('click', handleTeamCardClick);
    });

    // Add padding element to ensure the last card can scroll fully into view
    const padding = document.createElement('div');
    padding.className = 'flex-shrink-0 w-4 h-1';
    scrollContainer.appendChild(padding);
    
    // Update UI elements
    const teamCountNumber = document.getElementById('team-count-number');
    if (teamCountNumber) {
        teamCountNumber.textContent = currentTeams.length;
    }
    updateBallPosition(); 
}

// --- Event Handlers ---

function handleTeamCardClick(event) {
    // ... (NO CHANGE HERE) ...
    const card = event.currentTarget;
    document.querySelectorAll('.team-card').forEach(c => c.classList.remove('selected', 'border-teal-600'));
    card.classList.add('selected', 'border-teal-600');
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
    // ... (NO CHANGE HERE) ...
    if (modal) {
        modal.classList.remove('hidden');
    }
    if (submissionMessage) {
        submissionMessage.classList.add('hidden');
    }
}

function hideModal() {
    // ... (NO CHANGE HERE) ...
    if (modal) {
        modal.classList.add('hidden');
    }
    if (newTeamForm) {
        newTeamForm.reset();
    }
}

/**
 * Handles the form submission, calling the backend save function and re-rendering.
 * @param {Event} e - The form submission event.
 */
async function handleSubmitNewTeam(e) { // NOW ASYNCHRONOUS
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
        // 1. Get userId from localStorage (set during login)
        const userId = localStorage.getItem('userId');
        const password = localStorage.getItem('password');

        
        if (!userId) {
            if (submissionMessage) {
                submissionMessage.textContent = "Error: User not logged in. Please log in first.";
                submissionMessage.classList.remove('hidden');
            }
            return;
        }

        // 2. Create the new team object with form data
        // TODO: Update payload based on your backend schema
        // Required fields: name, and any other fields your backend expects
        const newTeamPayload = {
            password: password,
            displayName: name + ' (' + year + ')'
            // TODO: Add other required fields (e.g., description, teamType, year, etc.)
        };

        // 3. Save to the backend (returns the full saved object with its ID)
        const savedTeam = await saveNewTeamToBackend(newTeamPayload);
        
        // Ensure displayName is set (in case backend doesn't return it)
        if (!savedTeam.displayName) {
            savedTeam.displayName = newTeamPayload.displayName;
        }

        // 4. Update the global data store with the new team
        currentTeamsData.push(savedTeam);
        
        // 5. Re-sort alphabetically by displayName
        currentTeamsData.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '')); 

        // 6. Re-render the list
        renderTeams(currentTeamsData);
        
        hideModal();
        
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

// Attach modal event listeners
if (openModalBtn) {
    openModalBtn.addEventListener('click', showModal);
}
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', hideModal);
}
if (newTeamForm) {
    newTeamForm.addEventListener('submit', handleSubmitNewTeam);
}

// --- Bowling Ball Drag and Scroll Logic (NO CHANGE HERE) ---

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
         // Hide ball if no scrolling is possible
        ballIndicator.style.left = `0px`;
    }
}

function startDrag(clientX) {
    isDragging = true;
    if (ballIndicator) {
        ballIndicator.classList.add('grabbing');
    }
}

function doDrag(clientX) {
    if (!isDragging || !ballIndicator || !track) return;
    
    const maxScrollLeft = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    
    if (maxScrollLeft <= 0) return;

    const trackRect = track.getBoundingClientRect();
    
    // Map the mouse position to a scroll ratio (0 to 1)
    let scrollRatio = (clientX - trackRect.left) / trackRect.width;
    
    // Clamp the ratio
    scrollRatio = Math.max(0, Math.min(1, scrollRatio));
    
    const newScrollLeft = scrollRatio * maxScrollLeft;
    
    // Update the scrollable container and the ball's visual position
    scrollContainer.scrollLeft = newScrollLeft;
    ballIndicator.style.left = `${scrollRatio * trackRect.width}px`;
}

function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    if (ballIndicator) {
        ballIndicator.classList.remove('grabbing');
    }
    // Force an update to ensure position is accurate after drag ends
    updateBallPosition(); 
}

// Attach Drag/Scroll Listeners 
if (ballIndicator) {
    // Mouse Events
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

    // Touch Events
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

// Scroll and Resize Listeners
if (scrollContainer) {
    scrollContainer.addEventListener('scroll', updateBallPosition);
}
window.addEventListener('resize', updateBallPosition);

// --- Initialization ---

async function initializeApp() { // NOW ASYNCHRONOUS
    // 1. Fetch data from the backend
    const fetchedTeams = await fetchTeamsFromBackend();
    
    // 2. Sort the data by displayName alphabetically
    fetchedTeams.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '')); 
    
    // 3. Store the data globally
    currentTeamsData = fetchedTeams;
    
    // 4. Render the list
    renderTeams(currentTeamsData);

    
    // 5. Attach Account Settings button listener
    const accountSettingsBtn = document.getElementById('account-settings-btn');
    if (accountSettingsBtn) {
        accountSettingsBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }
}

window.onload = initializeApp;
