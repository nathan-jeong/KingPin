const playerName = "Jane 'The Hammer' Doe";
const matches = [
    // Added totalWood to mock data
    { name: "League Night - Week 1", games: [185, 201, 192], total: 578, avg: 192.7, totalWood: 15 },
    { name: "League Night - Week 2", games: [210, 175, 220], total: 605, avg: 201.7, totalWood: 12 },
    { name: "Tournament Qualifier", games: [230, 245, 205], total: 680, avg: 226.7, totalWood: 5 },
    { name: "League Night - Week 3", games: [160, 180, 190], total: 530, avg: 176.7, totalWood: 25 },
    { name: "Friendly Match 1", games: [200, 200, 200], total: 600, avg: 200.0, totalWood: 10 },
    { name: "League Night - Week 4", games: [205, 195, 215], total: 615, avg: 205.0, totalWood: 18 },
    { name: "Practice Session A", games: [150, 160, 170], total: 480, avg: 160.0, totalWood: 30 },
    { name: "League Night - Week 5", games: [190, 220, 185], total: 595, avg: 198.3, totalWood: 14 },
    { name: "Team Playoffs - QF", games: [225, 230, 210], total: 665, avg: 221.7, totalWood: 6 },
    { name: "Team Playoffs - SF", games: [180, 190, 190], total: 560, avg: 186.7, totalWood: 22 },
    { name: "League Night - Week 6", games: [200, 200, 200], total: 600, avg: 200.0, totalWood: 9 },
];

document.addEventListener('DOMContentLoaded', () => {
    const playerNameEl = document.getElementById('player-name');
    const matchListEl = document.getElementById('match-list');
    
    // Elements for Overall Stats
    const overallAvgValueEl = document.getElementById('overall-avg-value');
    const g1AvgValueEl = document.getElementById('g1-avg-value');
    const g2AvgValueEl = document.getElementById('g2-avg-value');
    const g3AvgValueEl = document.getElementById('g3-avg-value');
    const totalWoodValueEl = document.getElementById('total-wood-value');

    // Get player name from URL parameter if available
    const urlParams = new URLSearchParams(window.location.search);
    const playerParam = urlParams.get('player');
    const displayPlayerName = playerParam || playerName;

    if (playerNameEl) {
        playerNameEl.textContent = displayPlayerName;
    }

    // 1. Calculate Overall Season Averages and Totals
    let totalG1 = 0;
    let totalG2 = 0;
    let totalG3 = 0;
    let totalSeriesPoints = 0;
    let totalWood = 0;
    const numMatches = matches.length;

    matches.forEach(match => {
        totalG1 += match.games[0];
        totalG2 += match.games[1];
        totalG3 += match.games[2];
        totalSeriesPoints += match.total;
        totalWood += match.totalWood;
    });

    const overallG1Avg = totalG1 / numMatches;
    const overallG2Avg = totalG2 / numMatches;
    const overallG3Avg = totalG3 / numMatches;
    const overallAverage = totalSeriesPoints / (numMatches * 3);

    // 2. Display Overall Stats
    if (overallAvgValueEl) {
        overallAvgValueEl.textContent = overallAverage.toFixed(1);
    }
    if (g1AvgValueEl) {
        g1AvgValueEl.textContent = overallG1Avg.toFixed(1);
    }
    if (g2AvgValueEl) {
        g2AvgValueEl.textContent = overallG2Avg.toFixed(1);
    }
    if (g3AvgValueEl) {
        g3AvgValueEl.textContent = overallG3Avg.toFixed(1);
    }
    if (totalWoodValueEl) {
        totalWoodValueEl.textContent = totalWood;
    }

    // 3. Render Match List
    if (matchListEl) {
        matches.forEach((match, index) => {
            const isEven = index % 2 === 0;
            const bgColor = isEven ? 'bg-white dark:bg-gray-800' : 'bg-gray-100 dark:bg-gray-700';
            const seriesTotal = match.games.reduce((sum, score) => sum + score, 0);

            // Create the row element
            const row = document.createElement('div');
            row.className = `${bgColor} p-4 sm:p-3 rounded-lg shadow-sm sm:shadow-none cursor-pointer`;

            // Mobile View (Flex container)
            const mobileView = `
                <div class="sm:hidden space-y-2">
                    <div class="font-semibold text-lg text-indigo-600 dark:text-indigo-400">${match.name}</div>
                    <div class="grid grid-cols-2 gap-y-1 text-sm">
                        <div><span class="font-medium text-gray-500 dark:text-gray-400">Game Scores:</span> ${match.games.join(', ')}</div>
                        <div><span class="font-medium text-gray-500 dark:text-gray-400">Series Total:</span> ${seriesTotal}</div>
                        <div><span class="font-medium text-gray-500 dark:text-gray-400">Avg:</span> ${match.avg.toFixed(1)}</div>
                    </div>
                </div>
            `;

            // Desktop View (Grid container)
            const desktopView = `
                <div class="hidden sm:grid grid-cols-9 gap-2 items-center text-sm">
                    <div class="col-span-3 font-medium truncate">${match.name}</div>
                    <div class="col-span-1 text-center">${match.games[0]}</div>
                    <div class="col-span-1 text-center">${match.games[1]}</div>
                    <div class="col-span-1 text-center">${match.games[2]}</div>
                    <div class="col-span-2 text-center">${seriesTotal}</div>
                    <div class="col-span-1 text-center">${match.avg.toFixed(1)}</div>
                </div>
            `;

            row.innerHTML = mobileView + desktopView;
            matchListEl.appendChild(row);
        });
    }
    
    // Add navigation button event listeners
    const accountSettingsBtn = document.getElementById('account-settings-btn');
    if (accountSettingsBtn) {
        accountSettingsBtn.addEventListener('click', () => {
            window.location.href = 'settings.html';
        });
    }
    
    const backToTeamSelectorBtn = document.getElementById('back-to-team-selector-btn');
    if (backToTeamSelectorBtn) {
        backToTeamSelectorBtn.addEventListener('click', () => {
            window.location.href = 'teamSelector.html';
        });
    }
});

// Function to simulate a modal/message box instead of alert()
function showMessage(message) {
    const modalId = 'stat-message-modal';
    let modal = document.getElementById(modalId);
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 transition-opacity duration-300 opacity-0';
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-sm w-full transform transition-transform duration-300 scale-95">
                <h3 class="text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Notice</h3>
                <p class="mb-6" id="modal-content"></p>
                <button onclick="document.getElementById('${modalId}').style.opacity = '0'; setTimeout(() => document.getElementById('${modalId}').classList.add('hidden'), 300);"
                        class="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition duration-150">
                    Close
                </button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    document.getElementById('modal-content').textContent = message;
    modal.classList.remove('hidden');
    // Force reflow to enable transition
    setTimeout(() => modal.style.opacity = '1', 10);
    setTimeout(() => modal.querySelector('div').style.transform = 'scale(1)', 10);
}
