// Function to toggle the sidebar visibility (remains the same)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('visible'); 
}

// 🏆 NEW: Function to add the new award to the dashboard list
function displayAward(title, year) {
    const awardsList = document.getElementById('current-awards-list');
    
    // Create the new list item element
    const awardItem = document.createElement('div');
    awardItem.classList.add('award-item');
    
    // Construct the inner HTML: Trophy emoji, Title (Year)
    awardItem.innerHTML = `
        🏆 ${title} <span class="award-year">(${year})</span>
    `;
    
    // Insert the new award at the top of the list (most recent first)
    awardsList.prepend(awardItem);
}


document.addEventListener('DOMContentLoaded', () => {
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
    // 2. Add Award Modal Logic (With dynamic list update)
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

    // Award Form Submission Handler (MODIFIED to call displayAward)
    if (awardForm) {
        awardForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = awardTitleInput.value;
            const year = document.getElementById('award-year').value;

            if (title && year) {
                awardStatus.textContent = `Saving award "${title}" for ${year}...`;
                awardStatus.style.color = '#fff';

                // Simulate server response delay
                setTimeout(() => {
                    // Success! Now add the award to the list
                    displayAward(title, year); // <--- Updates the list
                    
                    awardStatus.textContent = `Success! The team won the "${title}" in ${year}!`;
                    awardStatus.style.color = '#4CAF50';
                    awardForm.reset();
                    // Reset trophy visual after successful submission
                    awardTitleDisplay.textContent = 'New Award Title';
                }, 1500);
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
