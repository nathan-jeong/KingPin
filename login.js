const API_BASE = 'https://kingpin-backend-production.up.railway.app';
const COOKIE_DAYS = 30;

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

// Auto-login on page load if "remember me" was previously enabled
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
        
        setTimeout(() => {
            const form = document.getElementById('login-form');
            if (form) form.dispatchEvent(new Event('submit'));
        }, 100);
    }
}

// Initialize Logic on Page Load
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Run Auto Login Check
    checkAndAutoLogin();

    // 2. Setup Password Toggle Button (NEW CODE)
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
});

// Function to handle form submission and simulated login
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        // Prevent the default form submission
        event.preventDefault();

        // Get form data
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('remember-me').checked;

        const messageBox = document.getElementById('message-box');
        const messageText = document.getElementById('message-text');

        // Helper function to update the message box style and text
        function updateMessage(text, type) {
            // Base classes (dark background text color)
            const baseClasses = ['p-4', 'rounded-lg', 'text-sm', 'font-semibold'];
            
            // Type-specific colors
            const colors = {
                error: { bg: 'bg-red-900', text: 'text-red-300' },
                info: { bg: 'bg-blue-900', text: 'text-blue-300' },
                success: { bg: 'bg-green-900', text: 'text-green-300' }
            };

            if (!messageBox || !messageText) {
                console.error('Message box or message text element not found in DOM');
                return;
            }

            // Reset to base classes, remove hidden
            messageBox.className = baseClasses.join(' ');
            
            // Add type-specific colors
            messageBox.classList.add(colors[type].bg, colors[type].text);
            messageBox.classList.remove('hidden');
            messageBox.style.display = 'block'; // Force display as fallback
            messageText.textContent = text;
            
            console.log('Message displayed:', type, text);
        }
        
        const postData = {
            email: email,
            password: password,
        };

        const endpoint = 'https://kingpin-backend-production.up.railway.app/auth/login';
        
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
                
                // Persist credentials in cookies when remember-me is checked
                if (rememberMe) {
                    setCookie('email', email);
                    setCookie('password', password);
                    setCookie('rememberMe', 'true');
                    setCookie('displayName', response.user.displayName || '');
                    setCookie('school', response.user.displayName || '');
                    localStorage.setItem('email', email);
                    localStorage.setItem('password', password);
                    localStorage.setItem('rememberMe', 'true');
                } else {
                    ['email', 'password', 'rememberMe', 'displayName', 'school'].forEach(eraseCookie);
                    localStorage.removeItem('email');
                    localStorage.removeItem('password');
                    localStorage.removeItem('rememberMe');
                }

                console.log('Credentials stored (cookies) for', email, 'Remember me:', rememberMe);
                
                // Extract and store user ID and displayName from response
                if (response.user && response.user.userId) {
                    localStorage.setItem('userId', response.user.userId);
                    localStorage.setItem('displayName', response.user.displayName || '');
                    localStorage.setItem('school', response.user.displayName || '');
                    console.log('User ID stored:', response.user.userId + ", displayName:" + response.user.displayName);
                } else if (response.user && response.user.id) {
                    localStorage.setItem('userId', response.user.id);
                    localStorage.setItem('displayName', response.user.displayName || '');
                    localStorage.setItem('school', response.user.displayName || '');
                    console.log('User ID stored:', response.user.id + ", displayName:" + response.user.displayName);
                } else {
                    console.warn('No userId or id field in login response');
                }
                
                updateMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = "teamSelector.html";
                }, 1000);
            })
            .catch(error => {
                console.error('Login fetch error:', error);
                updateMessage(`Login failed: ${error.message}`, 'error');
            });
    });
}
