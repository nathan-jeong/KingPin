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

document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display awards on page load
    fetchAndDisplayAwards();

    // ------------------------------------------------------------------
    // 1. New Player Modal Logic
    // ------------------------------------------------------------------
    const newPlayerBtn = document.getElementById('new-player-btn');
    const playerModal = document.getElementById('new-player-modal');
    const playerCloseBtn = playerModal.querySelector('.player-close-btn'); 
    const playerForm = document.getElementById('new-player-form');
    const statusMessage = document.getElementById('registration-status');

    // Open Player Modal Listener
    if (newPlayerBtn) {
        newPlayerBtn.addEventListener('click', () => {
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

    // Player Form Submission Handler (Simulated)
    if (playerForm) {
        playerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const playerName = document.getElementById('player-name').value;
            
            statusMessage.textContent = `Attempting to register ${playerName}...`;
            statusMessage.style.color = '#fff';

            // Simulate server response delay
            setTimeout(() => {
                statusMessage.textContent = `STRIKE! ${playerName} registered successfully! Welcome to the League.`;
                statusMessage.style.color = '#4CAF50'; // Green for success
                playerForm.reset(); // Clear the form
            }, 1500);
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
