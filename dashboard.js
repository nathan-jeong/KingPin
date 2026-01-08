/**
 * KINGPIN DASHBOARD LOGIC - CONSOLIDATED
 */

const API_BASE = 'https://kingpin-backend-production.up.railway.app';
let currentTeamId = localStorage.getItem('teamId');
let currentUserId = localStorage.getItem('userId');
let currentPassword = localStorage.getItem('password');
let cachedPlayers = [];
let cachedMatches = [];
let cachedPlayerStats = [];
let cachedMatchSummaries = [];
let topSortState = { column: 'average', ascending: false };
let matchSortState = { column: 'date', ascending: false };

// 1. Sidebar Toggle Logic
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('visible');
    }
};

// ------------------------------------------------------------------
// AWARDS LOGIC
// ------------------------------------------------------------------

async function fetchAndDisplayAwards() {
    if (!currentUserId || !currentTeamId) return;
    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const team = data.team || data;
        renderAwardsList(team.awardsList || []);
    } catch (error) {
        console.error('Error fetching awards:', error);
        displayEmptyAwards();
    }
}

function renderAwardsList(awards) {
    const awardsList = document.getElementById('current-awards-list');
    if (!awardsList) return;
    awardsList.innerHTML = '';
    if (awards.length === 0) {
        displayEmptyAwards();
        return;
    }
    awards.forEach((award) => {
        const awardItem = document.createElement('div');
        awardItem.className = 'award-item'; 
        awardItem.innerHTML = `
            <button class="delete-award-btn" aria-label="Delete award">&times;</button>
            <span style="display: flex; align-items: center; gap: 8px;">🏆 ${award}</span>
        `;
        awardsList.appendChild(awardItem);
        awardItem.querySelector('.delete-award-btn').addEventListener('click', () => deleteAward(award));
    });
}

function displayEmptyAwards() {
    const awardsList = document.getElementById('current-awards-list');
    if (awardsList) awardsList.innerHTML = '<div style="color: rgba(255, 255, 255, 0.5); font-style: italic; padding: 10px;">No awards created</div>';
}

async function addAwardToBackend(awardTitle, awardYear) {
    if (!currentTeamId || !currentPassword) return false;
    try {
        const newAward = `${awardTitle} (${awardYear})`;
        const response = await fetch(`${API_BASE}/teams/${currentTeamId}/awards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword, award: newAward })
        });
        if (!response.ok) throw new Error('Save failed');
        const data = await response.json();
        renderAwardsList(data.awardsList || data);
        return true;
    } catch (error) {
        return false;
    }
}

async function deleteAward(awardToDelete) {
    if (!currentTeamId || !currentPassword || !confirm(`Delete award: "${awardToDelete}"?`)) return;
    try {
        const response = await fetch(`${API_BASE}/teams/${currentTeamId}/awards`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword, award: awardToDelete })
        });
        const data = await response.json();
        renderAwardsList(data.awardsList || data);
    } catch (error) {
        console.error('Error deleting award:', error);
    }
}

function getCurrentAwards() {
    const awardsList = document.getElementById('current-awards-list');
    if (!awardsList) return [];
    const awardItems = awardsList.querySelectorAll('.award-item');
    const awards = [];
    awardItems.forEach(item => {
        const awardText = item.querySelector('span')?.textContent?.trim();
        if (awardText) {
            // Remove the trophy emoji (and any whitespace) and extract the award string
            awards.push(awardText.replace(/🏆\s*/g, '').trim());
        }
    });
    return awards;
}

// ------------------------------------------------------------------
// PLAYER & MATCH STATS LOGIC
// ------------------------------------------------------------------

async function loadTeamData() {
    if (!currentUserId || !currentTeamId) return;
    try {
        const [pResp, mResp] = await Promise.all([
            fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players`),
            fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/matches`)
        ]);
        
        const pData = await pResp.json();
        const mData = await mResp.json();

        cachedPlayers = pData.players || [];
        cachedMatches = mData.matches || [];
        cachedPlayerStats = calculatePlayerAverages(cachedPlayers, cachedMatches);
        cachedMatchSummaries = buildMatchSummaries(cachedMatches);

        renderTopScorers(cachedPlayerStats);
        renderMatchList();
    } catch (err) { console.error("Load Failed", err); }
}

function calculatePlayerAverages(players, matches) {
    const playerStats = {};
    players.forEach(p => {
        playerStats[p.playerId] = { playerId: p.playerId, displayName: p.displayName, graduationYear: p.graduationYear, totalScore: 0, seriesPlayed: 0, average: 0 };
    });
    matches.forEach(m => {
        if (m.perPlayerData) {
            Object.keys(m.perPlayerData).forEach(pid => {
                if (playerStats[pid] && m.perPlayerData[pid].games) {
                    let sTotal = 0; let hasG = false;
                    Object.values(m.perPlayerData[pid].games).forEach(g => { if (g?.Score) { sTotal += g.Score; hasG = true; }});
                    if (hasG) { playerStats[pid].totalScore += sTotal; playerStats[pid].seriesPlayed++; }
                }
            });
        }
    });
    return Object.values(playerStats).map(s => { if (s.seriesPlayed > 0) s.average = s.totalScore / s.seriesPlayed; return s; });
}

function buildMatchSummaries(matches) {
    return matches.map(m => {
        let wood = 0;
        if (m.perPlayerData) {
            Object.values(m.perPlayerData).forEach(p => {
                if (p?.games) Object.values(p.games).forEach(g => { wood += (g.Wood || g.Score || 0); });
            });
        }
        return { matchId: m.matchId || m.id, name: m.opposingTeamName || m.comment || 'Match', dateValue: m.date ? new Date(m.date).getTime() : 0, displayDate: m.date ? new Date(m.date).toLocaleDateString() : 'TBD', totalWood: wood };
    });
}

// ------------------------------------------------------------------
// RENDERING & UI
// ------------------------------------------------------------------

function renderTopScorers(stats) {
    const body = document.getElementById('top-scorers-body');
    if (!body) return;
    body.innerHTML = stats.length ? '' : '<div class="empty-row">No players found</div>';
    
    const sorted = [...stats].sort((a, b) => {
        let res = topSortState.column === 'name' ? a.displayName.localeCompare(b.displayName) : a[topSortState.column] - b[topSortState.column];
        return topSortState.ascending ? res : res * -1;
    });

    sorted.forEach(p => {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div class="table-cell name-cell"><a href="#" class="player-link" data-id="${p.playerId}">${p.displayName} (${p.graduationYear || '—'})</a></div>
            <div class="table-cell table-number">${p.totalScore.toLocaleString()}</div>
            <div class="table-cell table-number">${p.seriesPlayed > 0 ? p.average.toFixed(1) : '—'}</div>
            <div class="table-cell table-number table-cell-games">${p.seriesPlayed}</div>
            <div class="table-cell table-actions"><button class="icon-btn del-p" data-id="${p.playerId}" data-name="${p.displayName}">&times;</button></div>
        `;
        body.appendChild(row);
    });
}

function renderMatchList() {
    const list = document.getElementById('match-list');
    if (!list) return;
    list.innerHTML = cachedMatchSummaries.length ? '' : '<div class="empty-row">No matches found</div>';
    
    cachedMatchSummaries.forEach(m => {
        const row = document.createElement('div');
        row.className = 'match-row';
        row.innerHTML = `
            <div class="match-info"><a class="match-name" href="#" data-id="${m.matchId}">${m.name}</a></div>
            <div class="match-meta"><span class="match-pill">${m.displayDate}</span><span class="match-pill">Wood: ${m.totalWood}</span></div>
        `;
        list.appendChild(row);
    });
}

// ------------------------------------------------------------------
// INITIALIZATION & MODAL SYSTEM
// ------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    loadTeamData();
    fetchAndDisplayAwards();

    // Consolidated Modal Helper
    const setupModal = (trigger, modalId, closeClass) => {
        const modal = document.getElementById(modalId);
        const closeBtn = modal?.querySelector('.' + closeClass);
        if (!modal || !trigger) return;

        const open = () => { modal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; };
        const close = () => { modal.classList.add('hidden'); document.body.style.overflow = ''; };

        trigger.addEventListener('click', (e) => { e.preventDefault(); open(); });
        closeBtn?.addEventListener('click', close);
        window.addEventListener('click', (e) => { if (e.target === modal) close(); });
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    };

    // Setup Modals
    setupModal(document.getElementById('add-new-player-link'), 'new-player-modal', 'player-close-btn');
    setupModal(document.getElementById('add-award-popup-btn'), 'add-award-modal', 'award-close-btn');

    // Clear status message when award modal opens
    const addAwardBtn = document.getElementById('add-award-popup-btn');
    if (addAwardBtn) {
        addAwardBtn.addEventListener('click', () => {
            const status = document.getElementById('award-status');
            if (status) {
                status.textContent = '';
                status.style.color = '';
            }
        });
    }

    // Handle Player Form Submit
    document.getElementById('new-player-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('player-name').value;
        const grad = document.getElementById('graduation-year').value;
        const status = document.getElementById('registration-status');

        try {
            const res = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: currentPassword, displayName: name, graduationYear: parseInt(grad) })
            });
            if (res.ok) {
                status.textContent = "Player Added!";
                setTimeout(() => { document.getElementById('new-player-modal').classList.add('hidden'); loadTeamData(); }, 1000);
            }
        } catch (err) { status.textContent = "Error saving."; }
    });

    // Handle Award Form Submit
    document.getElementById('add-award-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('award-title').value;
        const year = document.getElementById('award-year').value;
        const status = document.getElementById('award-status');
        
        // Check for duplicates
        const newAward = `${title} (${year})`;
        const existingAwards = getCurrentAwards();
        if (existingAwards.includes(newAward)) {
            status.textContent = "This award already exists";
            status.style.color = "red";
            return;
        }
        
        const success = await addAwardToBackend(title, year);
        if (success) {
            status.textContent = "Saved!";
            status.style.color = "";
            setTimeout(() => { 
                document.getElementById('add-award-modal').classList.add('hidden');
                document.body.style.overflow = '';
                document.getElementById('add-award-form').reset();
                status.textContent = '';
            }, 1000);
        } else {
            status.textContent = "Error saving award";
            status.style.color = "red";
        }
    });
});
