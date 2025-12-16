// --- State ---
const container = document.getElementById('player-rows-container');
const teamScoreDisplay = document.getElementById('team-score-display');
const locationInput = document.getElementById('location-input');
const locationError = document.getElementById('location-error');
const dateInput = document.getElementById('date-input');
const rowTemplate = document.getElementById('player-row-template');

// Preset List of Names (Placeholder Data)
const PRESET_ROSTER = [
    "John Doe",
    "Jane Smith",
    "Mike Johnson",
    "Sarah Williams",
    "Chris Brown",
    "Pat Taylor"
];

// --- Functions ---

/**
 * Handles navigation back to the dashboard.
 */
function goToDashboard() {
    // Logic to return to dashboard
    console.log("Navigating to dashboard...");
    if(confirm("Return to Dashboard? Unsaved progress will be lost.")) {
        // window.location.href = '/dashboard'; 
    }
}

/**
 * Adds a new player row to the container based on the template.
 * @param {string} name - The name of the player.
 */
function addPlayerRow(name) {
    const clone = rowTemplate.content.cloneNode(true);
    const row = clone.querySelector('.player-row');
    
    // Set the name
    const nameInput = row.querySelector('.player-name-input');
    nameInput.value = name;
    
    // Attach event listeners to the score inputs
    const inputs = row.querySelectorAll('.score-input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            updateRowTotal(row);
            updateTeamScore();
        });
    });

    container.appendChild(clone);
}

/**
 * Calculates the total score for a single player row and updates the display.
 * @param {HTMLElement} rowElement - The player row element.
 */
function updateRowTotal(rowElement) {
    const inputs = rowElement.querySelectorAll('.score-input');
    const totalDisplay = rowElement.querySelector('.player-total');
    let rowSum = 0;

    inputs.forEach(input => {
        // Use unary plus operator for fast integer conversion
        const val = +input.value || 0; 
        rowSum += val;
    });

    totalDisplay.textContent = rowSum;
}

/**
 * Calculates the grand total score for the entire team and updates the display.
 */
function updateTeamScore() {
    const allInputs = document.querySelectorAll('.score-input');
    let totalScore = 0;

    allInputs.forEach(input => {
        // Use unary plus operator for fast integer conversion
        const val = +input.value || 0; 
        totalScore += val;
    });

    teamScoreDisplay.textContent = totalScore;
}

/**
 * Validates the form data, collects match results, and simulates submission.
 */
function submitMatch() {
    const location = locationInput.value.trim();
    const date = dateInput.value;
    const score = teamScoreDisplay.textContent;
    
    // Reset Error States
    let hasError = false;
    locationInput.classList.remove('kingpin-input-error');
    locationError.classList.add('hidden');

    // Validate Location
    if (!location) {
        locationInput.classList.add('kingpin-input-error');
        locationError.classList.remove('hidden');
        hasError = true;
        // Optional: Focus the input
        locationInput.focus();
    }

    if (hasError) {
        alert("Please fill in the required fields highlighted in red.");
        return;
    }

    // Collect scores
    const results = [];
    const rows = document.querySelectorAll('.player-row');
    rows.forEach(row => {
        const name = row.querySelector('.player-name-input').value;
        const total = row.querySelector('.player-total').textContent;
        // Optionally collect individual game scores
        const gameScores = Array.from(row.querySelectorAll('.score-input')).map(input => +input.value || 0);
        
        results.push({ name, total: +total, gameScores });
    });

    const matchData = {
        location: location,
        date: date,
        teamScore: +score,
        details: results,
        timestamp: new Date().toISOString()
    };
    
    console.log("Submitting Match:", matchData);
    
    if(confirm(`Submit match at ${location} on ${date}?\nTeam Score: ${score}`)) {
        // Simulate successful submission by resetting the form
        
        // Reset location
        locationInput.value = '';
        
        // Reset all scores and totals
        document.querySelectorAll('.score-input').forEach(input => input.value = '');
        document.querySelectorAll('.player-total').forEach(total => total.textContent = '0');
        updateTeamScore(); // Updates the main team score display
        
        alert("Match submitted successfully! (Data logged to console)");
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set Default Date to Today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

    // Initialize rows based on the preset roster
    PRESET_ROSTER.forEach(name => {
        addPlayerRow(name);
    });
});
