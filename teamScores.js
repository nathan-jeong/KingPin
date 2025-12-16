// Mock data for the bowling team members
const teamMembers = [
    { name: "Alex 'The Ace' Johnson", g1Avg: 185, g2Avg: 195, g3Avg: 202, bestGame: 278 },
    { name: "Ben 'Big Roller' Smith", g1Avg: 160, g2Avg: 175, g3Avg: 168, bestGame: 245 },
    { name: "Chloe 'Curveball' Davis", g1Avg: 192, g2Avg: 188, g3Avg: 190, bestGame: 289 },
    { name: "David 'Decoy' Rodriguez", g1Avg: 170, g2Avg: 165, g3Avg: 155, bestGame: 221 },
    { name: "Eva 'Enigma' Lee", g1Avg: 205, g2Avg: 215, g3Avg: 210, bestGame: 300 },
];

/**
 * Renders the team member data into the HTML table.
 */
function renderTeamStats() {
    const tableBody = document.getElementById('team-stats-body');
    
    // Clear existing content
    tableBody.innerHTML = ''; 

    teamMembers.forEach(member => {
        // Calculate Total Wood (Avg)
        const totalWoodAvg = member.g1Avg + member.g2Avg + member.g3Avg;

        const row = document.createElement('tr');
        // Apply Tailwind class for hover effect and cursor
        row.className = 'hover:bg-gray-200 cursor-pointer'; 
        
        // Make row clickable to navigate to player scores page
        row.addEventListener('click', () => {
            // Navigate to player scores page with player name as parameter
            window.location.href = `plyrScores.html?player=${encodeURIComponent(member.name)}`;
        });

        row.innerHTML = `
            <td class="px-3 py-4 whitespace-nowrap md:px-6">
                <div class="text-sm font-medium text-gray-900">${member.name}</div>
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-700 md:px-6">
                ${member.g1Avg}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-700 md:px-6">
                ${member.g2Avg}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-700 md:px-6">
                ${member.g3Avg}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-700 md:px-6">
                ${totalWoodAvg}
            </td>
            <td class="px-3 py-4 whitespace-nowrap text-center text-sm text-gray-700 md:px-6">
                ${member.bestGame}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Run the render function when the page loads
window.onload = () => {
    renderTeamStats();
    
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
};
