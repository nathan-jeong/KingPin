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
            <span class="award-text">🏆 ${award}</span>
            <button class="delete-award-btn" aria-label="Delete award">&times;</button>
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

async function deletePlayer(playerId, playerName) {
    if (!currentUserId || !currentTeamId || !currentPassword || !confirm(`Delete player: ${playerName}?`)) return;
    try {
        const response = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players/${playerId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: currentPassword })
        });
        if (response.ok) {
            loadTeamData();
        } else {
            alert('Error deleting player');
        }
    } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player');
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
// CSV EXPORT HELPERS
// ------------------------------------------------------------------

function buildTeamCsv(players, matches) {
    // Sort matches by date ascending
    const sortedMatches = (matches || []).slice().sort((a,b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return da - db;
    });

    // Build header: Name, Grad, then per-match columns, then totals
    const header = ['Player Name', 'Grad Year'];
    sortedMatches.forEach((m, idx) => {
        const label = m.opposingTeamName || m.comment || `Match ${idx+1}`;
        const date = m.date ? new Date(m.date).toLocaleDateString() : '';
        const prefix = `${label} ${date}`.trim();
        header.push(`${prefix} - G1 Score`, `${prefix} - G1 Wood`, `${prefix} - G2 Score`, `${prefix} - G2 Wood`, `${prefix} - G3 Score`, `${prefix} - G3 Wood`, `${prefix} - Series`);
    });
    header.push('Total Pins', 'Series Played', 'Average');

    const rows = [header];

    // Map matches by id for quick lookup
    const matchMap = {};
    sortedMatches.forEach(m => { matchMap[m.matchId || m.id] = m; });

    players.forEach(p => {
        const row = [];
        row.push(p.displayName || '');
        row.push(p.graduationYear || '');

        let totalPins = 0;
        let seriesPlayed = 0;

        sortedMatches.forEach(m => {
            let per = (m.perPlayerData && (m.perPlayerData[p.playerId] || m.perPlayerData[p.playerId])) || null;
            // Some backends use playerId keys, others may use numeric ids - attempt both
            if (!per && m.perPlayerData) {
                // brute force search by matching player name if available
                Object.values(m.perPlayerData).forEach(v => {
                    if (!per && v && v.displayName === p.displayName) per = v;
                });
            }

            let seriesSum = 0;
            let hasGame = false;
            for (let gi = 1; gi <= 3; gi++) {
                const g = per && per.games && per.games[String(gi)] ? per.games[String(gi)] : null;
                const score = g && typeof g.Score === 'number' ? g.Score : '';
                const wood = g && typeof g.Wood === 'number' ? g.Wood : '';
                if (score !== '') { hasGame = true; seriesSum += score; }
                row.push(score, wood);
            }
            if (hasGame) {
                row.push(seriesSum);
                totalPins += seriesSum;
                seriesPlayed += 1;
            } else {
                row.push('');
            }
        });

        row.push(totalPins || '');
        row.push(seriesPlayed || '');
        row.push(seriesPlayed > 0 ? (totalPins / seriesPlayed).toFixed(1) : '');

        rows.push(row);
    });

    // Build CSV string
    const csvLines = rows.map(r => r.map(cell => {
        if (cell === null || cell === undefined) return '';
        const s = String(cell);
        // Escape double quotes
        if (s.indexOf(',') >= 0 || s.indexOf('"') >= 0 || s.indexOf('\n') >= 0) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }).join(','));

    return csvLines.join('\n');
}

function downloadCsv(filename, csvContent) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
        
        // Attach player link click handler
        const playerLink = row.querySelector('.player-link');
        if (playerLink) {
            playerLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.setItem('selectedPlayerId', p.playerId);
                window.location.href = 'plyrScores.html';
            });
        }
        
        // Attach delete event listener
        const deleteBtn = row.querySelector('.del-p');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => deletePlayer(p.playerId, p.displayName));
        }
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
        
        // Attach match link click handler
        const matchLink = row.querySelector('.match-name');
        if (matchLink) {
            matchLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.setItem('selectedMatchId', m.matchId);
                window.location.href = 'matchView.html';
            });
        }
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
        const form = document.getElementById('new-player-form');

        try {
            const res = await fetch(`${API_BASE}/users/${currentUserId}/teams/${currentTeamId}/players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: currentPassword, displayName: name, graduationYear: parseInt(grad) })
            });
            if (res.ok) {
                status.textContent = "Saved!";
                status.style.color = "";
                loadTeamData();
                form.reset();
                setTimeout(() => { status.textContent = ''; }, 1500);
            } else {
                status.textContent = "Error saving.";
                status.style.color = "red";
            }
        } catch (err) {
            status.textContent = "Error saving.";
            status.style.color = "red";
        }
    });

    // Handle Award Form Submit
    document.getElementById('add-award-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('award-title').value;
        const year = document.getElementById('award-year').value;
        const status = document.getElementById('award-status');
        const form = document.getElementById('add-award-form');
        
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
            form.reset();
            setTimeout(() => { status.textContent = ''; }, 1500);
        } else {
            status.textContent = "Error saving award";
            status.style.color = "red";
        }
    });

    // Excel (.xls HTML) Export button (styled to match sample workbook)
    const exportBtn = document.getElementById('export-spreadsheet-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[dashboard] Exporting XLS (HTML)', { players: cachedPlayers.length, matches: cachedMatches.length });
            const html = buildExcelHtml(cachedPlayers, cachedMatches, document.title || `Team ${currentTeamId || ''}`);
            const fname = `Team_${currentTeamId || 'team'}_${new Date().toISOString().slice(0,10)}.xls`;
            downloadXls(fname, html);
        });
    }
});

// Build Excel-compatible HTML that mimics the sample workbook layout/colors/merges
function buildExcelHtml(players, matches, title) {
    const sortedMatches = (matches || []).slice().sort((a,b) => {
        const da = a.date ? new Date(a.date).getTime() : 0;
        const db = b.date ? new Date(b.date).getTime() : 0;
        return da - db;
    });

    // color palette based on sample styles.xml
    const palette = ['#0000FF','#6AA84F','#FFE599','#EFEFEF','#FFFFFF','#FF0000'];

    // header rows
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)}</title>`;
    html += `<style>body{font-family:Arial,Helvetica,sans-serif;font-size:10pt}table{border-collapse:collapse;}td,th{border:1px solid #999;padding:4px;vertical-align:middle;} .title{font-size:14pt;font-weight:bold;} .hdr{background:#F3F3F3;font-weight:bold;text-align:center;} .matchhdr{color:#ffffff;font-weight:bold;text-align:center;} .subhdr{background:#EFEFEF;text-align:center;font-weight:bold;} .namecol{min-width:200px;} .num{mso-number-format:\@;text-align:center;}</style></head><body>`;

    html += `<table>`;

    // Top metadata rows (team title + exported date)
    html += `<tr><td colspan="${2 + sortedMatches.length*7}" class="title">${escapeHtml(title)}</td></tr>`;
    html += `<tr><td colspan="${2 + sortedMatches.length*7}" style="background:#FFFFFF;">Exported: ${new Date().toLocaleString()}</td></tr>`;

    // Match merged header row: two leading cells for name/grad, then merged per-match
    html += `<tr><th class="hdr">Player Name</th><th class="hdr">Grad Year</th>`;
    sortedMatches.forEach((m, idx) => {
        const color = palette[idx % palette.length];
        const label = (m.opposingTeamName || m.comment || `Match ${idx+1}`) + (m.date ? ` ${new Date(m.date).toLocaleDateString()}` : '');
        html += `<th class="matchhdr" colspan="7" style="background:${color};">${escapeHtml(label)}</th>`;
    });
    html += `<th class="hdr">Total Pins</th><th class="hdr">Series Played</th><th class="hdr">Average</th></tr>`;

    // Subheader row: G1 Score, G1 Wood, etc.
    html += `<tr><th class="hdr subhdr"></th><th class="hdr subhdr"></th>`;
    sortedMatches.forEach(() => {
        html += `<th class="hdr subhdr">G1 Score</th><th class="hdr subhdr">G1 Wood</th><th class="hdr subhdr">G2 Score</th><th class="hdr subhdr">G2 Wood</th><th class="hdr subhdr">G3 Score</th><th class="hdr subhdr">G3 Wood</th><th class="hdr subhdr">Series</th>`;
    });
    html += `<th class="hdr subhdr">Total</th><th class="hdr subhdr">Played</th><th class="hdr subhdr">Avg</th></tr>`;

    // Player rows
    players.forEach(p => {
        html += `<tr>`;
        html += `<td class="namecol">${escapeHtml(p.displayName || '')}</td>`;
        html += `<td style="text-align:center">${p.graduationYear || ''}</td>`;

        let totalPins = 0; let series = 0;
        sortedMatches.forEach(m => {
            let per = (m.perPlayerData && (m.perPlayerData[p.playerId] || m.perPlayerData[p.playerId])) || null;
            if (!per && m.perPlayerData) {
                Object.values(m.perPlayerData).forEach(v => { if (!per && v && v.displayName === p.displayName) per = v; });
            }

            let seriesSum = 0; let hasGame = false;
            for (let gi=1; gi<=3; gi++) {
                const g = per && per.games && per.games[String(gi)] ? per.games[String(gi)] : null;
                const score = g && typeof g.Score === 'number' ? g.Score : '';
                const wood = g && typeof g.Wood === 'number' ? g.Wood : '';
                if (score !== '') { seriesSum += score; hasGame = true; }
                html += `<td class="num">${score}</td><td class="num">${wood}</td>`;
            }
            if (hasGame) { html += `<td class="num">${seriesSum}</td>`; totalPins += seriesSum; series += 1; } else { html += `<td class="num"></td>`; }
        });

        html += `<td class="num">${totalPins || ''}</td>`;
        html += `<td class="num">${series || ''}</td>`;
        html += `<td class="num">${series>0 ? (totalPins/series).toFixed(1) : ''}</td>`;
        html += `</tr>`;
    });

    html += `</table></body></html>`;
    return html;
}

function downloadXls(filename, htmlContent) {
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
