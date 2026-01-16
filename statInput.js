// --- Loading Overlay Functions ---
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

// --- State ---
const API_BASE = 'https://kingpin-backend-production.up.railway.app';
let container, teamScoreDisplay, opponentInput, opponentError;
let locationSelect, customLocationInput, locationError;
let dateInput, rowTemplate, commentInput;

// Fallback roster if backend unavailable
const PRESET_ROSTER = [
    "John Doe",
    "Jane Smith",
    "Mike Johnson",
    "Sarah Williams",
    "Chris Brown",
    "Pat Taylor"
];

let currentUserId = localStorage.getItem('userId');
let currentTeamId = localStorage.getItem('teamId');

// --- Location Management ---
let userLocations = []; // Cached locations from API

async function fetchLocationsFromAPI() {
    if (!currentUserId) {
        console.warn('No userId available to fetch locations');
        return [];
    }
    
    try {
        const resp = await fetch(`${API_BASE}/accounts/${currentUserId}/locations`);
        if (!resp.ok) {
            throw new Error(`Failed to fetch locations: ${resp.status}`);
        }
        const data = await resp.json();
        return data.locations || [];
    } catch (err) {
        console.error('Error fetching locations:', err);
        return [];
    }
}

async function createLocationViaAPI(locationName) {
    if (!currentUserId || !locationName) {
        throw new Error('Missing userId or location name');
    }
    
    const encodedLocation = encodeURIComponent(locationName.trim());
    const resp = await fetch(`${API_BASE}/accounts/${currentUserId}/locations?location=${encodedLocation}`);
    
    if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Failed to create location: ${resp.status} ${txt}`);
    }
    
    const data = await resp.json();
    return data.locations || [];
}

async function loadAndPopulateLocations() {
    userLocations = await fetchLocationsFromAPI();
    populateLocationDropdown();
}

function populateLocationDropdown() {
    const select = locationSelect;
    
    // Clear all options except the first one (blank) and last one (Custom)
    // We'll rebuild the options list
    const firstOption = select.options[0]; // "Select location..." option
    select.innerHTML = '';
    select.appendChild(firstOption);
    
    // Add all user locations from API
    userLocations.forEach(loc => {
        const option = document.createElement('option');
        option.value = loc;
        option.textContent = loc;
        select.appendChild(option);
    });
    
    // Add the "Custom..." option at the end
    const customOption = document.createElement('option');
    customOption.value = '__custom__';
    customOption.textContent = 'Custom...';
    select.appendChild(customOption);
}

function getSelectedLocation() {
    if (locationSelect.value === '__custom__') {
        return customLocationInput.value.trim();
    }
    return locationSelect.value;
}

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
function addPlayerRow(player) {
    // player can be a string (name) or object { playerId, displayName }
    const clone = rowTemplate.content.cloneNode(true);
    const row = clone.querySelector('.player-row');

    // Determine name and id
    let name = typeof player === 'string' ? player : (player.displayName || 'Unknown');
    const playerId = typeof player === 'string' ? null : (player.playerId || '');

    // Set the name and player-id
    const nameInput = row.querySelector('.player-name-input');
    nameInput.value = name;
    if (playerId) row.setAttribute('data-player-id', playerId);

    // Attach event listeners to the score inputs
    const inputs = row.querySelectorAll('.score-input');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            updateRowTotal(row);
            updateTeamScore();
        });
    });

    // Absence checkbox (new): toggles row appearance and disables inputs when absent
    const absence = row.querySelector('.absence-checkbox');
    if (absence) {
        absence.addEventListener('change', () => {
            const isAbsent = !!absence.checked;
            row.classList.toggle('opacity-60', isAbsent);
            // Disable score inputs when absent to avoid accidental edits
            row.querySelectorAll('.score-input').forEach(inp => inp.disabled = isAbsent);
        });
    }

    // Varsity checkbox doesn't affect totals but keep an accessible attribute
    const varsity = row.querySelector('.varsity-checkbox');
    if (varsity) {
        varsity.addEventListener('change', () => {
            row.classList.toggle('opacity-90', varsity.checked);
        });
    }

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
        // Sum numeric values; blank or invalid -> treated as 0 for totals
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
        const val = +input.value || 0;
        totalScore += val;
    });

    teamScoreDisplay.textContent = totalScore;
}

/**
 * Validates the form data, collects match results, and simulates submission.
 */
async function submitMatch() {
    const opponent = opponentInput.value.trim();
    const location = getSelectedLocation();
    const date = dateInput.value;
    const comment = commentInput ? commentInput.value.trim() : '';
    const score = +teamScoreDisplay.textContent || 0;
    
    // Reset Error States
    let hasError = false;
    opponentInput.classList.remove('kingpin-input-error');
    opponentError.classList.add('hidden');
    locationSelect.classList.remove('kingpin-input-error');
    customLocationInput.classList.remove('kingpin-input-error');
    locationError.classList.add('hidden');

    // Validate Opponent
    if (!opponent) {
        opponentInput.classList.add('kingpin-input-error');
        opponentError.classList.remove('hidden');
        hasError = true;
        opponentInput.focus();
    }
    
    // Validate Location
    if (!location) {
        if (locationSelect.value === '__custom__') {
            customLocationInput.classList.add('kingpin-input-error');
        } else {
            locationSelect.classList.add('kingpin-input-error');
        }
        locationError.classList.remove('hidden');
        hasError = true;
        if (!opponent) locationSelect.focus();
    }

    if (hasError) {
        alert("Please fill in the required fields highlighted in red.");
        return;
    }

    // Collect rows and build per-player payloads
    const rows = document.querySelectorAll('.player-row');
    const playerEntries = [];
    rows.forEach(row => {
        const playerId = row.getAttribute('data-player-id');
        const name = row.querySelector('.player-name-input').value;
        const isVarsity = !!row.querySelector('.varsity-checkbox')?.checked;
        const gameScores = Array.from(row.querySelectorAll('.score-input')).map(input => {
            const v = input.value;
            return v === '' ? null : +v;
        });

        const absenceChecked = !!row.querySelector('.absence-checkbox')?.checked;

        playerEntries.push({ playerId, name, isVarsity, gameScores, absent: absenceChecked });
    });

    if (!currentUserId || !currentTeamId) {
        alert('Missing user or team context. Please login and select a team.');
        return;
    }

    if (!confirm(`Submit match vs ${opponent} at ${location} on ${date}?\nTeam Score: ${score}`)) {
        return;
    }

    // Show loading overlay
    showLoading();

    // If custom location, create it via API first
    const isCustomLocation = locationSelect.value === '__custom__' && location;
    
    if (isCustomLocation) {
        try {
            console.log('[statInput] Creating new location via API:', location);
            userLocations = await createLocationViaAPI(location);
            populateLocationDropdown();
            console.log('[statInput] Location created successfully');
        } catch (err) {
            console.error('Failed to create location:', err);
            hideLoading();
            alert('Failed to create location: ' + err.message);
            return;
        }
    }

    // Build match create payload
    const password = localStorage.getItem('password') || '';

    const matchPayload = {
        password,
        opposingTeamName: opponent,
        date: date ? new Date(date).getTime() : Date.now(),
        comment: `Location: ${location}` + (comment ? `\n${comment}` : '') + `\nTeamScore:${score}`
    };

    // POST match then PUT per-player games
    try {
        const resp = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(matchPayload)
        });

        if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(`Create match failed: ${resp.status} ${txt}`);
        }

        const data = await resp.json();
        const match = data.match || data;
        const matchId = match.matchId || match.id;

        if (!matchId) throw new Error('No matchId returned from server');

        // Update match (attach teamScore/comment) using returned matchId before per-player uploads
        try {
            const updatePayload = { password, comment: matchPayload.comment };
            const updateResp = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches/${matchId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (!updateResp.ok) {
                const ut = await updateResp.text();
                console.warn('Match update (attach comment/teamScore) failed:', updateResp.status, ut);
            }
        } catch (uErr) {
            console.warn('Match update request failed:', uErr);
        }

        // For each player, upload games (1..3)
        for (const p of playerEntries) {
            if (!p.playerId) continue; // skip rows without playerId

            // If the player is marked absent, skip sending any data for them
            if (p.absent) continue;

            // Upload each game; if user left input blank we send 0 (original behavior)
            for (let gi = 0; gi < 3; gi++) {
                const val = p.gameScores[gi];
                const scoreVal = val === null ? 0 : val;

                const gamePayload = {
                    password,
                    Wood: scoreVal,
                    Score: scoreVal,
                    isVarsity: !!p.isVarsity
                };

                const gameIndex = gi + 1;
                const putUrl = `${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches/${matchId}/players/${p.playerId}/games/${gameIndex}`;

                console.log('[statInput] Uploading game', {
                    player: p.name,
                    playerId: p.playerId,
                    matchId,
                    gameIndex,
                    payload: gamePayload,
                    url: putUrl
                });

                const putResp = await fetch(putUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(gamePayload)
                });

                if (!putResp.ok) {
                    const t = await putResp.text();
                    console.warn('Game upload failed for', p.name, 'game', gameIndex, t);
                }
            }
        }

        // On success, reset form
        opponentInput.value = '';
        locationSelect.value = '';
        customLocationInput.value = '';
        customLocationInput.classList.add('hidden');
        if (commentInput) commentInput.value = '';
        document.querySelectorAll('.score-input').forEach(input => input.value = '');
        document.querySelectorAll('.player-total').forEach(total => total.textContent = '0');
        updateTeamScore();

        hideLoading();
        alert('Match submitted successfully');
    } catch (err) {
        console.error('Submit match error:', err);
        hideLoading();
        alert('Failed to submit match: ' + err.message);
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    container = document.getElementById('player-rows-container');
    teamScoreDisplay = document.getElementById('team-score-display');
    opponentInput = document.getElementById('opponent-input');
    opponentError = document.getElementById('opponent-error');
    locationSelect = document.getElementById('location-select');
    customLocationInput = document.getElementById('custom-location-input');
    locationError = document.getElementById('location-error');
    dateInput = document.getElementById('date-input');
    rowTemplate = document.getElementById('player-row-template');
    commentInput = document.getElementById('match-comment');
    
    // Set Default Date to Today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    
    // Load locations from API and populate dropdown
    loadAndPopulateLocations();
    
    // Handle location dropdown change
    locationSelect.addEventListener('change', () => {
        if (locationSelect.value === '__custom__') {
            customLocationInput.classList.remove('hidden');
            customLocationInput.focus();
        } else {
            customLocationInput.classList.add('hidden');
            customLocationInput.value = '';
        }
    });

    // Fetch roster from backend and render alphabetically; fallback to preset roster
    (async () => {
        try {
            if (!currentUserId || !currentTeamId) throw new Error('No user/team');

            const resp = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!resp.ok) throw new Error('Failed to fetch players');
            const d = await resp.json();
            const players = d.players || [];

            if (players.length === 0) throw new Error('No players returned');

            players.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
            players.forEach(p => addPlayerRow(p));
        } catch (e) {
            console.warn('Using preset roster:', e.message);
            PRESET_ROSTER.forEach(name => addPlayerRow(name));
        }
    })();
});
