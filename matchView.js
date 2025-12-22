// Mock Data for the Match
const matchData = [
    { id: 1, name: "Sarah 'The Strike' Miller", games: [185, 210, 192] },
    { id: 2, name: "Marcus Johnson", games: [142, 168, 155] },
    { id: 3, name: "Elena Rodriguez", games: [225, 198, 201] },
    { id: 4, name: "David Chen", games: [170, 155, 182] },
    { id: 5, name: "Coach Thompson", games: [201, 234, 189] }
];

function renderStats() {
    const tbody = document.getElementById('player-rows');
    if (!tbody) return;

    let teamTotal = 0;
    tbody.innerHTML = '';

    matchData.forEach(player => {
        const series = player.games.reduce((a, b) => a + b, 0);
        const avg = (series / player.games.length).toFixed(1);
        
        teamTotal += series;

        const row = document.createElement('tr');
        row.className = 'table-row transition-colors';
        
        row.innerHTML = `
            <td class="py-4 px-6 font-semibold text-white">${player.name}</td>
            <td class="py-4 px-4 text-center text-slate-300">${player.games[0]}</td>
            <td class="py-4 px-4 text-center text-slate-300">${player.games[1]}</td>
            <td class="py-4 px-4 text-center text-slate-300">${player.games[2]}</td>
            <td class="py-4 px-4 text-center text-slate-300">${series}</td>
            <td class="py-4 px-6 text-right text-slate-400 font-medium">${avg}</td>
        `;
        tbody.appendChild(row);
    });

    // Update Totals
    document.getElementById('match-total-display').innerText = teamTotal;
    document.getElementById('team-series-total').innerText = teamTotal;
    document.getElementById('team-avg').innerText = (teamTotal / (matchData.length * 3)).toFixed(1);
}

// Initialize table on load
window.onload = renderStats;
