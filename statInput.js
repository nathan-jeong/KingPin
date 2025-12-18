// --- State ---
const API_BASE = 'https://kingpin-backend-production.up.railway.app';
const container = document.getElementById('player-rows-container');
const teamScoreDisplay = document.getElementById('team-score-display');
const locationInput = document.getElementById('location-input');
const locationError = document.getElementById('location-error');
const dateInput = document.getElementById('date-input');
const rowTemplate = document.getElementById('player-row-template');
const commentInput = document.getElementById('match-comment');

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
    const comment = commentInput ? commentInput.value.trim() : '';
    const score = +teamScoreDisplay.textContent || 0;
    
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

        playerEntries.push({ playerId, name, isVarsity, gameScores });
    });

    if (!currentUserId || !currentTeamId) {
        alert('Missing user or team context. Please login and select a team.');
        return;
    }

    if (!confirm(`Submit match at ${location} on ${date}?\nTeam Score: ${score}`)) {
        return;
    }

    // Build match create payload
    const password = localStorage.getItem('password') || '';

    const matchPayload = {
        password,
        opposingTeamName: location,
        date: date ? new Date(date).getTime() : Date.now(),
        comment: comment ? comment + `\nTeamScore:${score}` : `TeamScore:${score}`
    };

    // POST match then PUT per-player games
    (async () => {
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

                for (let gi = 0; gi < 3; gi++) {
                    const val = p.gameScores[gi];
                    // If value is null, still send 0 to ensure record exists (or skip based on preference)
                    const scoreVal = val === null ? 0 : val;

                    const gamePayload = {
                        password,
                        Wood: scoreVal,
                        Score: scoreVal,
                        isVarsity: !!p.isVarsity
                    };

                    const gameIndex = gi + 1;
                    const putUrl = `${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches/${matchId}/players/${p.playerId}/games/${gameIndex}`;

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
            locationInput.value = '';
            if (commentInput) commentInput.value = '';
            document.querySelectorAll('.score-input').forEach(input => input.value = '');
            document.querySelectorAll('.player-total').forEach(total => total.textContent = '0');
            updateTeamScore();

            alert('Match submitted successfully');
        } catch (err) {
            console.error('Submit match error:', err);
            alert('Failed to submit match: ' + err.message);
        }
    })();
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set Default Date to Today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;

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
