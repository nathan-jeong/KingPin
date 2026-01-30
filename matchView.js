/**
 * KINGPIN MATCH VIEW LOGIC
 * Fetches and displays detailed match statistics from backend
 */

const API_BASE = 'https://kingpin-backend-production.up.railway.app';
let currentUserId = localStorage.getItem('userId');
let currentTeamId = localStorage.getItem('teamId');
let currentMatchId = localStorage.getItem('selectedMatchId');
let allMatches = [];
let currentMatchIndex = 0;
let userDisplayName = '';
let currentMatchDetails = null;
let currentPlayers = [];
let isEditMode = false;
let isSubmitting = false;

// --- Loading Overlay Functions ---
function showLoading(title = 'Loading Match...', subtitle = 'Please wait while we fetch your data') {
    const overlay = document.getElementById('loading-overlay');
    const titleEl = document.getElementById('loading-title');
    const subtitleEl = document.getElementById('loading-subtitle');
    if (titleEl) {
        titleEl.textContent = title;
    }
    if (subtitleEl) {
        subtitleEl.textContent = subtitle;
    }

    if (!titleEl || !subtitleEl) {
        const textEls = overlay?.querySelectorAll('p');
        if (textEls && textEls.length > 0) textEls[0].textContent = title;
        if (textEls && textEls.length > 1) textEls[1].textContent = subtitle;
    }
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function setSubmittingState(submitting) {
    isSubmitting = submitting;
    const editBtn = document.getElementById('edit-match-btn');
    const submitBtn = document.getElementById('submit-match-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const deleteBtn = document.getElementById('delete-match-btn');
    const prevBtn = document.getElementById('prev-match-btn');
    const nextBtn = document.getElementById('next-match-btn');

    [editBtn, submitBtn, cancelBtn, deleteBtn, prevBtn, nextBtn].forEach(btn => {
        if (!btn) return;
        btn.disabled = submitting;
        btn.style.opacity = submitting ? '0.5' : '';
        btn.style.cursor = submitting ? 'not-allowed' : '';
    });
}

// ------------------------------------------------------------------
// FETCH DATA FROM BACKEND
// ------------------------------------------------------------------

async function fetchMatches() {
    if (!currentUserId || !currentTeamId) {
        console.error('Missing userId or teamId');
        return [];
    }

    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.matches || [];
    } catch (error) {
        console.error('Error fetching matches:', error);
        return [];
    }
}

async function fetchMatchDetails(matchId) {
    if (!currentUserId || !currentTeamId || !matchId) {
        console.error('Missing required IDs');
        return null;
    }

    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches/${matchId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.match || data;
    } catch (error) {
        console.error('Error fetching match details:', error);
        return null;
    }
}

async function fetchPlayers() {
    if (!currentUserId || !currentTeamId) return [];
    
    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.players || [];
    } catch (error) {
        console.error('Error fetching players:', error);
        return [];
    }
}

async function fetchUserInfo() {
    if (!currentUserId) return null;
    
    try {
        const response = await fetch(`${API_BASE}/accounts/${currentUserId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        return data.user || data;
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
}

function updateLeagueTitle() {
    const leagueTitle = document.getElementById('league-title');
    if (leagueTitle && userDisplayName) {
        leagueTitle.textContent = `${userDisplayName}'s League`;
    }
}

function parseLocation(comment) {
    if (!comment) return '—';
    const match = comment.match(/Location:\s*([^\n]+)/);
    return match ? match[1].trim() : '—';
}

function extractDisplayComment(comment) {
    if (!comment) return '';
    return comment
        .replace(/Location:\s*[^\n]+\n?/gi, '')
        .replace(/TeamScore:\s*\d+\n?/gi, '')
        .trim();
}

function getMatchLocation(match) {
    return match?.location || parseLocation(match?.comment) || '—';
}

// ------------------------------------------------------------------
// RENDER MATCH DATA
// ------------------------------------------------------------------

async function renderMatchView() {
    if (!currentMatchId) {
        document.getElementById('opponent-name').textContent = 'No Match Selected';
        return;
    }

    showLoading();

    try {
        // Fetch all matches and sort by date
        allMatches = await fetchMatches();
        allMatches.sort((a, b) => (a.date || 0) - (b.date || 0)); // Sort ascending by date

        // Find current match index
        currentMatchIndex = allMatches.findIndex(m => m.matchId === currentMatchId);
        if (currentMatchIndex === -1) {
            console.error('Match not found');
            return;
        }

        const match = allMatches[currentMatchIndex];
        const matchDetails = await fetchMatchDetails(currentMatchId);
        const players = await fetchPlayers();
        currentMatchDetails = matchDetails || match || null;
        currentPlayers = players || [];

        // Update UI with match info
        updateMatchHeader(match, matchDetails);
        await renderPlayerStats(matchDetails, players);
        updateNavigationButtons();
        setEditMode(false);
    } finally {
        hideLoading();
    }
}

function updateMatchHeader(match, matchDetails) {
    const fullMatch = matchDetails || match;
    
    // Update opponent name
    const opponentName = fullMatch.opposingTeamName || 'Unknown Opponent';
    document.getElementById('opponent-name').textContent = `vs. ${opponentName}`;

    // Update date
    const matchDate = fullMatch.date ? new Date(fullMatch.date) : new Date();
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = matchDate.toLocaleDateString('en-US', dateOptions);
    
    // Update location
    const location = parseLocation(fullMatch.comment);
    document.getElementById('match-location-display').textContent = location;
    
    // Display Win/Loss Badge
    const resultBadge = document.getElementById('match-result-badge');
    const resultBadgeContent = document.getElementById('result-badge-content');
    if (resultBadge && resultBadgeContent) {
        if (fullMatch.teamWonMatch === true) {
            resultBadge.classList.remove('hidden');
            resultBadgeContent.textContent = 'WIN';
            resultBadgeContent.className = 'px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-green-600/20 text-green-400 border border-green-600/50';
        } else if (fullMatch.teamWonMatch === false) {
            resultBadge.classList.remove('hidden');
            resultBadgeContent.textContent = 'LOSS';
            resultBadgeContent.className = 'px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-red-600/20 text-red-400 border border-red-600/50';
        } else {
            resultBadge.classList.add('hidden');
        }
    }
    
    // Display Comments (excluding Location line)
    const commentsSection = document.getElementById('match-comments-section');
    const commentsContent = document.getElementById('match-comments-content');
    const commentsEditor = document.getElementById('match-comments-editor');
    const displayComment = extractDisplayComment(fullMatch.comment);

    if (commentsSection && commentsContent) {
        if (displayComment) {
            commentsSection.classList.remove('hidden');
            commentsContent.textContent = displayComment;
        } else {
            commentsContent.textContent = '';
            commentsSection.classList.add('hidden');
        }
    }

    if (commentsEditor) {
        commentsEditor.value = displayComment || '';
    }
}

async function renderPlayerStats(matchDetails, players) {
    const tbody = document.getElementById('player-rows');
    if (!tbody) return;

    tbody.innerHTML = '';
    let teamTotal = 0;
    let totalGames = 0;
    
    // Track game totals for averages
    let game1Total = 0, game1Count = 0;
    let game2Total = 0, game2Count = 0;
    let game3Total = 0, game3Count = 0;

    // Create player lookup
    const playerLookup = {};
    players.forEach(player => {
        playerLookup[player.playerId] = player;
    });

    if (!matchDetails || !matchDetails.perPlayerData) {
        tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-500">No player data available for this match</td></tr>';
        return;
    }

    // Process each player in the match
    Object.keys(matchDetails.perPlayerData).forEach(playerId => {
        const playerData = matchDetails.perPlayerData[playerId];
        const player = playerLookup[playerId];
        
        if (!player) return; // Skip if player not found

        const games = playerData.games || {};
        const game1 = games['1'] && typeof games['1'].Score === 'number' ? games['1'].Score : 0;
        const game2 = games['2'] && typeof games['2'].Score === 'number' ? games['2'].Score : 0;
        const game3 = games['3'] && typeof games['3'].Score === 'number' ? games['3'].Score : 0;
        const isVarsity = !!(games['1']?.isVarsity || games['2']?.isVarsity || games['3']?.isVarsity);
        
        // Accumulate game totals for averages
        if (game1 > 0) { game1Total += game1; game1Count++; }
        if (game2 > 0) { game2Total += game2; game2Count++; }
        if (game3 > 0) { game3Total += game3; game3Count++; }
        
        const series = game1 + game2 + game3;
        const gamesCount = (game1 > 0 ? 1 : 0) + (game2 > 0 ? 1 : 0) + (game3 > 0 ? 1 : 0);
        const avg = gamesCount > 0 ? (series / gamesCount).toFixed(1) : '0.0';
        
        teamTotal += series;
        totalGames += gamesCount;

        const row = document.createElement('tr');
        row.className = 'table-row transition-colors';
        row.setAttribute('data-player-id', playerId);
        
        row.innerHTML = `
            <td class="py-4 px-6 font-semibold text-white">
                <a href="#" class="player-link hover:text-blue-400 transition-colors" data-player-id="${playerId}">
                    ${player.displayName}
                </a>
                <div class="edit-flags hidden mt-2">
                    <label class="edit-flag-label">
                        <input type="checkbox" class="absence-toggle" ${gamesCount === 0 ? 'checked' : ''} />
                        Absent
                    </label>
                    <label class="edit-flag-label">
                        <input type="checkbox" class="varsity-toggle" ${isVarsity ? 'checked' : ''} />
                        Varsity
                    </label>
                </div>
            </td>
            <td class="py-4 px-4 text-center text-slate-300">
                <span class="score-display">${game1 || '-'}</span>
                <input type="number" min="0" step="1" class="score-input hidden" data-game-index="1" value="${game1 || ''}" />
            </td>
            <td class="py-4 px-4 text-center text-slate-300">
                <span class="score-display">${game2 || '-'}</span>
                <input type="number" min="0" step="1" class="score-input hidden" data-game-index="2" value="${game2 || ''}" />
            </td>
            <td class="py-4 px-4 text-center text-slate-300">
                <span class="score-display">${game3 || '-'}</span>
                <input type="number" min="0" step="1" class="score-input hidden" data-game-index="3" value="${game3 || ''}" />
            </td>
            <td class="py-4 px-4 text-center text-slate-300"><span class="series-display">${series}</span></td>
            <td class="py-4 px-6 text-right text-slate-400 font-medium"><span class="avg-display">${avg}</span></td>
        `;
        tbody.appendChild(row);
    });

    // Update game averages
    const game1Avg = game1Count > 0 ? (game1Total / game1Count).toFixed(1) : '0.0';
    const game2Avg = game2Count > 0 ? (game2Total / game2Count).toFixed(1) : '0.0';
    const game3Avg = game3Count > 0 ? (game3Total / game3Count).toFixed(1) : '0.0';
    
    document.getElementById('game1-avg').textContent = game1Avg;
    document.getElementById('game2-avg').textContent = game2Avg;
    document.getElementById('game3-avg').textContent = game3Avg;

    // Update totals
    document.getElementById('match-total-display').textContent = teamTotal;
    document.getElementById('team-series-total').textContent = teamTotal;
    
    const teamAvg = totalGames > 0 ? (teamTotal / totalGames).toFixed(1) : '0.0';
    document.getElementById('team-avg').textContent = teamAvg;

    // Attach click handlers to player links
    document.querySelectorAll('.player-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const playerId = e.target.dataset.playerId;
            if (playerId) {
                localStorage.setItem('selectedPlayerId', playerId);
                window.location.href = 'plyrScores.html';
            }
        });
    });

    attachEditRowHandlers();
}

function attachEditRowHandlers() {
    const rows = document.querySelectorAll('#player-rows tr');
    rows.forEach(row => {
        const inputs = row.querySelectorAll('.score-input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                recalculateTotalsFromInputs();
            });
        });

        const absence = row.querySelector('.absence-toggle');
        if (absence) {
            absence.addEventListener('change', () => {
                const isAbsent = !!absence.checked;
                inputs.forEach(inp => {
                    inp.disabled = isAbsent;
                    if (isAbsent && inp.value === '') {
                        inp.value = '0';
                    }
                });
                recalculateTotalsFromInputs();
            });
        }

        const varsity = row.querySelector('.varsity-toggle');
        if (varsity) {
            varsity.addEventListener('change', () => {
                row.classList.toggle('opacity-90', varsity.checked);
            });
        }
    });
}

function setEditMode(enabled) {
    isEditMode = enabled;

    const editBtn = document.getElementById('edit-match-btn');
    const submitBtn = document.getElementById('submit-match-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');
    const editStatus = document.getElementById('edit-status');

    if (editBtn) editBtn.classList.toggle('hidden', enabled);
    if (submitBtn) submitBtn.classList.toggle('hidden', !enabled);
    if (cancelBtn) cancelBtn.classList.toggle('hidden', !enabled);
    if (editStatus) editStatus.textContent = enabled ? 'Edit mode is on. Update scores, comments, and flags.' : 'Edit mode is off.';

    document.querySelectorAll('.score-display').forEach(el => el.classList.toggle('hidden', enabled));
    document.querySelectorAll('.score-input').forEach(el => el.classList.toggle('hidden', !enabled));
    document.querySelectorAll('.edit-flags').forEach(el => el.classList.toggle('hidden', !enabled));

    document.querySelectorAll('.player-link').forEach(link => {
        link.style.pointerEvents = enabled ? 'none' : '';
        link.style.opacity = enabled ? '0.6' : '';
    });

    const commentsSection = document.getElementById('match-comments-section');
    const commentsContent = document.getElementById('match-comments-content');
    const commentsEditor = document.getElementById('match-comments-editor');

    if (enabled && commentsSection) {
        commentsSection.classList.remove('hidden');
    }
    if (commentsContent) commentsContent.classList.toggle('hidden', enabled);
    if (commentsEditor) commentsEditor.classList.toggle('hidden', !enabled);

    if (enabled) {
        document.querySelectorAll('#player-rows tr').forEach(row => {
            const absence = row.querySelector('.absence-toggle');
            const inputs = row.querySelectorAll('.score-input');
            if (absence && absence.checked) {
                inputs.forEach(inp => {
                    inp.disabled = true;
                    if (inp.value === '') inp.value = '0';
                });
            } else {
                inputs.forEach(inp => { inp.disabled = false; });
            }
        });
        recalculateTotalsFromInputs();
    }
}

function recalculateTotalsFromInputs() {
    const rows = document.querySelectorAll('#player-rows tr');

    let teamTotal = 0;
    let totalGames = 0;
    let game1Total = 0, game1Count = 0;
    let game2Total = 0, game2Count = 0;
    let game3Total = 0, game3Count = 0;

    rows.forEach(row => {
        const inputs = row.querySelectorAll('.score-input');
        const values = Array.from(inputs).map(inp => {
            const val = Number(inp.value);
            return Number.isFinite(val) ? val : 0;
        });

        const series = values.reduce((sum, v) => sum + v, 0);
        const gamesCount = values.filter(v => v > 0).length;
        const avg = gamesCount > 0 ? (series / gamesCount).toFixed(1) : '0.0';

        const seriesEl = row.querySelector('.series-display');
        if (seriesEl) seriesEl.textContent = series;
        const avgEl = row.querySelector('.avg-display');
        if (avgEl) avgEl.textContent = avg;

        const displayEls = row.querySelectorAll('.score-display');
        displayEls.forEach((el, idx) => {
            el.textContent = values[idx] > 0 ? values[idx] : '-';
        });

        if (values[0] > 0) { game1Total += values[0]; game1Count++; }
        if (values[1] > 0) { game2Total += values[1]; game2Count++; }
        if (values[2] > 0) { game3Total += values[2]; game3Count++; }

        teamTotal += series;
        totalGames += gamesCount;
    });

    const game1Avg = game1Count > 0 ? (game1Total / game1Count).toFixed(1) : '0.0';
    const game2Avg = game2Count > 0 ? (game2Total / game2Count).toFixed(1) : '0.0';
    const game3Avg = game3Count > 0 ? (game3Total / game3Count).toFixed(1) : '0.0';

    document.getElementById('game1-avg').textContent = game1Avg;
    document.getElementById('game2-avg').textContent = game2Avg;
    document.getElementById('game3-avg').textContent = game3Avg;

    document.getElementById('match-total-display').textContent = teamTotal;
    document.getElementById('team-series-total').textContent = teamTotal;

    const teamAvg = totalGames > 0 ? (teamTotal / totalGames).toFixed(1) : '0.0';
    document.getElementById('team-avg').textContent = teamAvg;
}

async function submitMatchEdits() {
    if (!currentMatchId || !currentUserId || !currentTeamId) {
        alert('Missing match context. Please reload and try again.');
        return;
    }

    const password = localStorage.getItem('password') || '';
    recalculateTotalsFromInputs();
    const teamTotal = Number(document.getElementById('match-total-display').textContent) || 0;

    const location = getMatchLocation(currentMatchDetails);
    const commentText = document.getElementById('match-comments-editor')?.value.trim() || '';
    const updatedComment = `Location: ${location}` + (commentText ? `\n${commentText}` : '') + `\nTeamScore:${teamTotal}`;

    const confirmed = confirm('Submit changes for this match?');
    if (!confirmed) return;

    try {
        setSubmittingState(true);
        showLoading('Submitting Changes...', 'Please wait while we save your updates');
        await new Promise(requestAnimationFrame);
        const updateMatchPayload = { password, comment: updatedComment, location };
        const matchResp = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches/${currentMatchId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateMatchPayload)
        });

        if (!matchResp.ok) {
            const txt = await matchResp.text();
            throw new Error(`Match update failed: ${matchResp.status} ${txt}`);
        }

        const rows = document.querySelectorAll('#player-rows tr');
        for (const row of rows) {
            const playerId = row.getAttribute('data-player-id');
            if (!playerId) continue;

            const absence = row.querySelector('.absence-toggle');
            const isAbsent = !!absence?.checked;
            const isVarsity = isAbsent ? false : !!row.querySelector('.varsity-toggle')?.checked;

            const inputs = row.querySelectorAll('.score-input');
            for (let i = 0; i < inputs.length; i++) {
                const raw = Number(inputs[i].value);
                const scoreVal = isAbsent ? 0 : (Number.isFinite(raw) ? raw : 0);
                const gameIndex = i + 1;

                const payload = {
                    password,
                    Wood: scoreVal,
                    Score: scoreVal,
                    isVarsity: isVarsity
                };

                const putUrl = `${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches/${currentMatchId}/players/${playerId}/games/${gameIndex}`;
                const resp = await fetch(putUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!resp.ok) {
                    const t = await resp.text();
                    console.warn('Game update failed for player', playerId, 'game', gameIndex, t);
                }
            }
        }

        alert('Match updated successfully.');
        await renderMatchView();
    } catch (err) {
        console.error('Error submitting match edits:', err);
        alert('Failed to submit changes: ' + err.message);
    } finally {
        setSubmittingState(false);
        hideLoading();
    }
}

// ------------------------------------------------------------------
// NAVIGATION
// ------------------------------------------------------------------

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prev-match-btn');
    const nextBtn = document.getElementById('next-match-btn');

    // Left arrow (prev) goes to older matches (lower index)
    if (prevBtn) {
        prevBtn.disabled = currentMatchIndex === 0;
        prevBtn.style.opacity = currentMatchIndex === 0 ? '0.3' : '1';
        prevBtn.style.cursor = currentMatchIndex === 0 ? 'not-allowed' : 'pointer';
    }

    // Right arrow (next) goes to newer matches (higher index)
    if (nextBtn) {
        nextBtn.disabled = currentMatchIndex === allMatches.length - 1;
        nextBtn.style.opacity = currentMatchIndex === allMatches.length - 1 ? '0.3' : '1';
        nextBtn.style.cursor = currentMatchIndex === allMatches.length - 1 ? 'not-allowed' : 'pointer';
    }
}

// Left arrow: go back in time (to older matches, lower index)
function navigateToOlderMatch() {
    if (isSubmitting) return;
    if (currentMatchIndex > 0) {
        currentMatchIndex--;
        currentMatchId = allMatches[currentMatchIndex].matchId;
        localStorage.setItem('selectedMatchId', currentMatchId);
        renderMatchView();
    }
}

// Right arrow: go forward in time (to newer matches, higher index)
function navigateToNewerMatch() {
    if (isSubmitting) return;
    if (currentMatchIndex < allMatches.length - 1) {
        currentMatchIndex++;
        currentMatchId = allMatches[currentMatchIndex].matchId;
        localStorage.setItem('selectedMatchId', currentMatchId);
        renderMatchView();
    }
}

// ------------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    if (!currentUserId || !currentTeamId) {
        alert('Please log in first');
        window.location.href = 'KingPinLogin.html';
        return;
    }

    // Fetch user info and update league title
    const userInfo = await fetchUserInfo();
    if (userInfo) {
        userDisplayName = userInfo.displayName || userInfo.username || 'User';
        updateLeagueTitle();
    }

    // Render the match view
    renderMatchView();

    // Prevent leaving while submitting edits
    window.addEventListener('beforeunload', (e) => {
        if (!isSubmitting) return;
        e.preventDefault();
        e.returnValue = '';
    });

    // Attach navigation button handlers
    const prevBtn = document.getElementById('prev-match-btn');
    const nextBtn = document.getElementById('next-match-btn');

    // Left arrow goes to older matches (backward in time)
    if (prevBtn) {
        prevBtn.addEventListener('click', navigateToOlderMatch);
    }

    // Right arrow goes to newer matches (forward in time)
    if (nextBtn) {
        nextBtn.addEventListener('click', navigateToNewerMatch);
    }

    // Add keyboard arrow key support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigateToOlderMatch();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigateToNewerMatch();
        }
    });

    // Edit mode buttons
    const editBtn = document.getElementById('edit-match-btn');
    const submitBtn = document.getElementById('submit-match-btn');
    const cancelBtn = document.getElementById('cancel-edit-btn');

    if (editBtn) {
        editBtn.addEventListener('click', () => setEditMode(true));
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => renderMatchView());
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', submitMatchEdits);
    }

    // Delete match button
    const deleteBtn = document.getElementById('delete-match-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', async () => {
            if (isSubmitting) return;
            if (!currentMatchId) {
                alert('No match selected to delete.');
                return;
            }

            const confirmed = confirm('Delete this match? This action cannot be undone.');
            if (!confirmed) return;

            const password = localStorage.getItem('password') || '';
            try {
                const resp = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches/${currentMatchId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                if (!resp.ok) {
                    const txt = await resp.text();
                    throw new Error(`Delete failed: ${resp.status} ${txt}`);
                }

                alert('Match deleted successfully.');
                // Clear selection and redirect to dashboard
                localStorage.removeItem('selectedMatchId');
                window.location.href = 'dashboard.html';
            } catch (err) {
                console.error('Error deleting match:', err);
                alert('Failed to delete match: ' + err.message);
            }
        });
    }
});
