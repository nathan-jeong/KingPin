// Function to toggle the sidebar visibility (remains the same)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('visible'); 
}

// --- POP-UP MODAL LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Element selectors
    const newPlayerBtn = document.getElementById('new-player-btn');
    const modal = document.getElementById('new-player-modal');
    const closeBtn = modal.querySelector('.close-btn');
    const playerForm = document.getElementById('new-player-form');
    const statusMessage = document.getElementById('registration-status');

    // 2. Open Modal Listener
    if (newPlayerBtn) {
        newPlayerBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
    }

    // 3. Close Modal Listeners
    // A. Close button (X)
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }
    // B. Close when clicking outside the modal
    modal.addEventListener('click', (e) => {
        // Only close if the click target is the overlay itself (not the content box)
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    // 4. Form Submission Handler (Simulated registration)
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

    console.log('Dashboard components initialized. Data is ready to roll!');
});