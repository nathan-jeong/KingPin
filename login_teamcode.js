// --- Team Code Entry Handler ---
const teamCodeForm = document.getElementById('team-code-form');
if (teamCodeForm) {
    const teamCodeInput = document.getElementById('team-code');
    
    // Force uppercase and alphanumeric only
    if (teamCodeInput) {
        teamCodeInput.addEventListener('input', function(e) {
            // Remove non-alphanumeric characters and convert to uppercase
            this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        });
    }
    
    teamCodeForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const teamCode = teamCodeInput.value.trim().toUpperCase();
        const messageBox = document.getElementById('team-code-message');
        const messageText = document.getElementById('team-code-text');
        const submitBtn = teamCodeForm.querySelector('.login-btn');
        const originalBtnText = submitBtn ? submitBtn.textContent : 'Submit Code';
        
        function updateTeamMessage(text, type) {
            const baseClasses = ['mt-6', 'p-4', 'rounded-lg', 'text-sm', 'border'];
            const colors = {
                error: { bg: 'bg-red-900/50', border: 'border-red-500', text: 'text-red-200' },
                info: { bg: 'bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-200' },
                success: { bg: 'bg-green-900/50', border: 'border-green-500', text: 'text-green-200' }
            };
            
            if (!messageBox || !messageText) return;
            
            messageBox.className = baseClasses.join(' ');
            messageBox.classList.add(colors[type].bg, colors[type].border, colors[type].text);
            messageBox.classList.remove('hidden');
            messageBox.style.display = 'block';
            messageText.textContent = text;
        }
        
        // Validate team code length
        if (teamCode.length !== 4) {
            updateTeamMessage('Team code must be exactly 4 characters.', 'error');
            return;
        }
        
        // Visual feedback
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Verifying...';
        }
        
        updateTeamMessage('Verifying team code...', 'info');
        
        try {
            // Call actual API to lookup team by code
            const endpoint = `${API_BASE}/teams/lookup?code=${encodeURIComponent(teamCode)}`;
            const response = await fetch(endpoint, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Invalid team code');
                throw new Error(errorText);
            }
            
            const data = await response.json();
            const teamId = data.teamId;
            const userId = data.userId;
            
            if (!teamId) {
                throw new Error('No team ID returned from server');
            }
            
            // Store team info to localStorage
            localStorage.setItem('teamId', teamId);
            localStorage.setItem('userId', userId);
            localStorage.setItem('teamCode', teamCode);
            
            console.log('Team verified - teamId:', teamId, 'userId:', userId);
            updateTeamMessage('Strike! Team verified. Redirecting...', 'success');
            
            // Redirect after short delay
            setTimeout(() => {
                window.location.href = 'plyrViewTeamStats.html';
            }, 1500);
            
        } catch (error) {
            console.error('Team code verification error:', error);
            updateTeamMessage('Invalid team code. Please try again.', 'error');
            
            // Re-enable button on error
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
}
