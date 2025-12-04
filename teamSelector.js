// --- In-Memory Data Storage ---
let teams = [
    // Conceptual initial teams for demonstration
    { id: 't1', name: 'The Pin Pals', year: 2024 },
    { id: 't2', name: 'Lane Lords', year: 2023 },
    { id: 't3', name: 'Split Happens', year: 2022 },
    { id: 't4', name: 'Gutter Gang', year: 2021 },
    { id: 't5', name: 'Bowling Stones', year: 2020 }
];

// --- DOM Elements ---
const scrollContainer = document.getElementById('team-scroll-container');
const ballIndicator = document.getElementById('ball-indicator');
const track = ballIndicator ? ballIndicator.parentElement : null; // Check if it exists
const modal = document.getElementById('team-modal');
const openModalBtn = document.getElementById('open-modal-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const newTeamForm = document.getElementById('new-team-form');
const submissionMessage = document.getElementById('submission-message');

let isDragging = false;


// --- Data Handling ---

function renderTeams(currentTeams) {
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
        card.dataset.teamId = team.id;
        card.innerHTML = `
            <p class="text-3xl font-semibold mb-2">${team.name || 'Untitled Team'}</p>
            <p class="text-xl text-gray-500">${team.year || 'N/A'}</p>
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
    const card = event.currentTarget;
    document.querySelectorAll('.team-card').forEach(c => c.classList.remove('selected', 'border-teal-600'));
    card.classList.add('selected', 'border-teal-600');
    const teamName = card.querySelector('p:first-child').textContent;
    console.log(`Team Selected: ${teamName}`);
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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

function handleSubmitNewTeam(e) {
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
        // 1. Create the new team object
        const newTeam = {
            id: 't' + Date.now(), // Simple unique ID
            name: name,
            year: year
        };

        // 2. Add to the in-memory array
        teams.push(newTeam);
        
        // 3. Sort the array (by year descending)
        teams.sort((a, b) => (b.year || 0) - (a.year || 0)); 

        // 4. Re-render the list
        renderTeams(teams);
        
        hideModal();
        
    } catch (error) {
        console.error("Error adding team: ", error);
        if (submissionMessage) {
            submissionMessage.textContent = "Failed to add team. Please try again.";
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

// Attach Drag/Scroll Listeners (wrapped in checks for ballIndicator and scrollContainer)
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

window.onload = () => {
    // Render the initial list of teams stored in the 'teams' array
    renderTeams(teams);
}
