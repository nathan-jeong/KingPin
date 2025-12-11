const API_BASE = 'https://kingpin-backend-production.up.railway.app';

// Auto-login on page load if "remember me" was previously enabled
function checkAndAutoLogin() {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const savedEmail = localStorage.getItem('email');
    const savedPassword = localStorage.getItem('password');
    const school = localStorage.getItem('school');

    if (rememberMe && savedEmail && savedPassword) {
        console.log('Auto-logging in with saved credentials...');
        // Pre-fill the form
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        
        if (emailInput) emailInput.value = savedEmail;
        if (passwordInput) passwordInput.value = savedPassword;
        
        // Auto-submit the login form
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
                
                // Always store credentials on successful login
                localStorage.setItem('email', email);
                localStorage.setItem('password', password);
                localStorage.setItem('rememberMe', rememberMe);
                localStorage.setItem('school', response.user.displayName);

                console.log('Credentials stored:', email, 'Remember me:', rememberMe);
                
                // Extract and store user ID from response
                if (response.user && response.user.userId) {
                    localStorage.setItem('userId', response.user.userId);
                    console.log('User ID stored:', response.user.userId + ", displayName:" + response.user.displayName);
                } else if (response.user && response.user.id) {
                    localStorage.setItem('userId', response.user.id);
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
