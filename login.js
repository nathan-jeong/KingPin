const API_BASE = 'https://kingpin-backend-production.up.railway.app';

// Auto-login on page load if "remember me" was previously enabled
function checkAndAutoLogin() {
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    const savedEmail = localStorage.getItem('email');
    const savedPassword = localStorage.getItem('password');
    
    if (rememberMe && savedEmail && savedPassword) {
        console.log('Auto-logging in with saved credentials...');
        // Pre-fill the form
        document.getElementById('email').value = savedEmail;
        document.getElementById('password').value = savedPassword;
        // Auto-submit the login form
        setTimeout(() => {
            document.getElementById('login-form').dispatchEvent(new Event('submit'));
        }, 100);
    }
}

// Call auto-login check when page loads
document.addEventListener('DOMContentLoaded', checkAndAutoLogin);

// Function to handle form submission and simulated login
document.getElementById('login-form').addEventListener('submit', function(event) {
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
            console.log('Credentials stored:', email, 'Remember me:', rememberMe);
            
            // Extract and store user ID from response
            if (response.user && response.user.userId) {
                localStorage.setItem('userId', response.user.userId);
                console.log('User ID stored:', response.user.userId);
            } else if (response.user && response.user.id) {
                localStorage.setItem('userId', response.user.id);
                console.log('User ID stored:', response.user.id);
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
