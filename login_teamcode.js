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
            // TODO: Replace with actual API endpoint when available
            // For now, simulate a response
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Example success (replace with actual API call)
            updateTeamMessage(`Team code ${teamCode} verified! Redirecting...`, 'success');
            
            // Store team code if needed
            localStorage.setItem('teamCode', teamCode);
            
            // Optional: redirect or perform action
            // setTimeout(() => {
            //     window.location.href = 'dashboard.html';
            // }, 1500);
            
        } catch (error) {
            console.error('Team code verification error:', error);
            updateTeamMessage('Invalid team code. Please try again.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        }
    });
}
