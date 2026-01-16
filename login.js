/* login.js */

const API_BASE = 'https://kingpin-backend-production.up.railway.app';
const COOKIE_DAYS = 30;

// --- Cookie Utilities ---
function setCookie(name, value, days = COOKIE_DAYS) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
}

function eraseCookie(name) {
    document.cookie = `${name}=; Max-Age=0; path=/`;
}

// --- Auto-login Logic ---
function checkAndAutoLogin() {
    const rememberMe = getCookie('rememberMe') === 'true';
    const savedEmail = getCookie('email');
    const savedPassword = getCookie('password');

    if (rememberMe && savedEmail && savedPassword) {
        console.log('Auto-logging in with saved credentials...');
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const rememberCheckbox = document.getElementById('remember-me');
        
        if (emailInput) emailInput.value = savedEmail;
        if (passwordInput) passwordInput.value = savedPassword;
        if (rememberCheckbox) rememberCheckbox.checked = true;
        
        // Slight delay to ensure DOM is ready
        setTimeout(() => {
            const form = document.getElementById('login-form');
            if (form) form.dispatchEvent(new Event('submit'));
        }, 100);
    }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Run Auto Login Check
    checkAndAutoLogin();

    // Always default Remember Me to checked for coach login
    const rememberCheckbox = document.getElementById('remember-me');
    if (rememberCheckbox) rememberCheckbox.checked = true;

    // 2. Setup Password Toggle Button
    const passwordInput = document.getElementById('password');
    const toggleButton = document.getElementById('toggle-password');

    if (passwordInput && toggleButton) {
        toggleButton.addEventListener('click', function(e) {
            e.preventDefault(); // Prevent accidental form submit
            
            // Toggle type
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle Label
            const isVisible = type === 'text';
            this.textContent = isVisible ? 'Hide' : 'Show';
            this.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
        });
    }

    // Team-code lookup handler (if team-code UI exists)
    const teamCodeForm = document.getElementById('team-code-form');
    const teamCodeInput = document.getElementById('team-code');
    const teamLookupBtn = document.getElementById('team-code-lookup-btn');

    async function lookupTeamByCode(code) {
        if (!code) throw new Error('Empty team code');
        const endpoint = `${API_BASE}/teams/lookup?code=${encodeURIComponent(code)}`;
        const resp = await fetch(endpoint, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!resp.ok) {
            const txt = await resp.text().catch(() => resp.statusText || 'Lookup failed');
            throw new Error(`Lookup failed: ${txt}`);
        }
        return resp.json();
    }

    async function handleTeamLookup(code) {
        try {
            const result = await lookupTeamByCode(code);
            const teamId = result.teamId || result.id;
            const userId = result.userId || result.user_id;
            if (!teamId) throw new Error('No teamId returned');

            // Persist to cookies and localStorage
            setCookie('teamId', teamId);
            setCookie('teamUserId', userId || '');
            localStorage.setItem('teamId', teamId);
            if (userId) localStorage.setItem('userId', userId);

            console.log('Team lookup successful - teamId:', teamId, 'userId:', userId);

            // Redirect to team player view
            window.location.href = 'plyrViewTeamStats.html';
        } catch (err) {
            console.error('Team lookup error:', err);
            const messageBox = document.getElementById('team-code-message') || document.getElementById('message-box');
            const messageText = document.getElementById('team-code-text') || document.getElementById('message-text');
            if (messageBox && messageText) {
                messageBox.className = 'mt-6 p-4 rounded-lg text-sm border bg-red-900/50 border-red-500 text-red-200';
                messageBox.style.display = 'block';
                messageText.textContent = 'Team code lookup failed. Please check the code and try again.';
            } else {
                alert('Team code lookup failed: ' + err.message);
            }
        }
    }

    if (teamCodeForm && teamCodeInput) {
        teamCodeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const code = (teamCodeInput.value || '').trim().toUpperCase();
            handleTeamLookup(code);
        });
    }

    if (teamLookupBtn && teamCodeInput) {
        teamLookupBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const code = (teamCodeInput.value || '').trim().toUpperCase();
            handleTeamLookup(code);
        });
    }
});

// --- Main Login Handling ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        // Prevent the default form submission
        event.preventDefault();

        // Get form data
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        // Coach login: always remember
        const rememberMe = true;

        const messageBox = document.getElementById('message-box');
        const messageText = document.getElementById('message-text');
        
        // Grab the button to add loading effects
        const submitBtn = document.querySelector('.login-btn');
        const originalBtnText = submitBtn ? submitBtn.textContent : 'Sign In';

        // Helper function to update the message box style and text
        function updateMessage(text, type) {
            // Updated base classes for new CSS (using borders and spacing)
            const baseClasses = ['mt-6', 'p-4', 'rounded-lg', 'text-sm', 'border'];
            
            // Updated colors for Dark Mode (Translucent backgrounds + Borders)
            const colors = {
                error: { bg: 'bg-red-900/50', border: 'border-red-500', text: 'text-red-200' },
                info: { bg: 'bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-200' },
                success: { bg: 'bg-green-900/50', border: 'border-green-500', text: 'text-green-200' }
            };

            if (!messageBox || !messageText) {
                console.error('Message box or message text element not found in DOM');
                return;
            }

            // Reset to base classes, remove hidden
            messageBox.className = baseClasses.join(' ');
            
            // Add type-specific colors
            messageBox.classList.add(colors[type].bg, colors[type].border, colors[type].text);
            messageBox.classList.remove('hidden');
            messageBox.style.display = 'block';
            messageText.textContent = text;
            
            console.log('Message displayed:', type, text);
        }
        
        // UI Feedback: Disable button and change text
        if(submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Verifying...";
        }

        const postData = {
            email: email,
            password: password,
        };

        const endpoint = `${API_BASE}/auth/login`;
        
        console.log('Login: sending POST to', endpoint, postData);

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(postData)
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Server ${response.status}: ${text || response.statusText}`);
                    });
                }
                return response.json();
            })
            .then(response => {
                console.log('Login response:', response);
                
                // Persist credentials in cookies (always on for coach login)
                setCookie('email', email);
                setCookie('password', password);
                setCookie('rememberMe', 'true');
                setCookie('displayName', response.user.displayName || '');
                setCookie('school', response.user.displayName || '');
                
                // Also save to LocalStorage for redundancy
                localStorage.setItem('email', email);
                localStorage.setItem('password', password);
                localStorage.setItem('rememberMe', 'true');

                console.log('Credentials stored for', email, 'Remember me:', rememberMe);
                
                // Extract and store user ID and displayName from response
                // Checks for both 'userId' and 'id' patterns
                if (response.user) {
                    const uId = response.user.userId || response.user.id;
                    if (uId) {
                         localStorage.setItem('userId', uId);
                    } else {
                        console.warn('No userId or id field in login response');
                    }
                    
                    localStorage.setItem('displayName', response.user.displayName || '');
                    localStorage.setItem('school', response.user.displayName || ''); // Saving display name as school per original code logic
                    
                    console.log('User ID stored:', uId);
                }
                
                updateMessage('Strike! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = "teamSelector.html";
                }, 1000);
            })
            .catch(error => {
                console.error('Login fetch error:', error);
                updateMessage(`Login failed: ${error.message}`, 'error');
                
                // Re-enable button on error
                if(submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            });
    });
}

// --- Forgot Password Handler ---
const forgotPasswordLink = document.getElementById('forgot-password-link');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Try to get email from the form first
        const emailInput = document.getElementById('email');
        let email = emailInput ? emailInput.value.trim() : '';
        
        const messageBox = document.getElementById('message-box');
        const messageText = document.getElementById('message-text');

        function updateMessage(text, type) {
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

        // If no email in form, show message to user
        if (!email) {
            updateMessage('Please enter your email address in the form above to receive a password reset link.', 'info');
            if (emailInput) {
                emailInput.focus();
            }
            return;
        }

        try {
            // Visual feedback on the link itself
            const originalLinkText = forgotPasswordLink.textContent;
            forgotPasswordLink.textContent = "Sending...";
            updateMessage('Sending password reset link...', 'info');

            const response = await fetch(`${API_BASE}/requestPassword`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error(`Server ${response.status}`);
            }

            const data = await response.json();
            updateMessage('If an account with that email exists, a reset link has been sent.', 'success');
            forgotPasswordLink.textContent = "Link Sent";
            
        } catch (error) {
            console.error('Password reset request error:', error);
            updateMessage('Failed to send reset link. Please try again.', 'error');
            forgotPasswordLink.textContent = "Lost your Password?";
        }
    });
}
