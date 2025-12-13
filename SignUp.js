// Combined Signup.js: password toggle + improved messages + submit handler with redirect
const REDIRECT_DELAY_MS = 1000;

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');

    // --- Helper function to update the message box style and text ---
    function updateMessage(text, type) {
        // Base classes (dark background text color) + border for emphasis
        const baseClasses = ['p-4', 'rounded-lg', 'text-sm', 'font-semibold', 'border'];
        
        // Type-specific colors (Tailwind classes)
        const colors = {
            error: { bg: 'bg-red-900', text: 'text-red-300', border: 'border-red-700' },
            info: { bg: 'bg-blue-900', text: 'text-blue-300', border: 'border-blue-700' },
            success: { bg: 'bg-green-900', text: 'text-green-300', border: 'border-green-700' }
        };

        // Reset class list to base and then add colors (important when using Tailwind)
        if (messageBox) {
            messageBox.className = baseClasses.join(' ');
            messageBox.classList.add(colors[type].bg, colors[type].text, colors[type].border);
            messageBox.classList.remove('hidden');
        }
        if (messageText) messageText.textContent = text;
    }

    // --- Password Toggle Logic (defensive + accessible) ---
    function setupPasswordToggle(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);

        if (!input || !button) return;

        // Defensive: ensure the button cannot submit the form even if HTML is missing type="button"
        button.setAttribute('type', 'button');
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-expanded', 'false');

        button.addEventListener('click', (e) => {
            // Prevent accidental submission / default behavior
            e.preventDefault();

            // Toggle password visibility
            const newType = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', newType);

            const isVisible = newType === 'text';
            button.textContent = isVisible ? 'Hide' : 'Show';
            button.setAttribute('aria-pressed', String(isVisible));
            button.setAttribute('aria-expanded', String(isVisible));
            button.setAttribute('aria-label', isVisible ? 'Hide password' : 'Show password');
        });
    }

    setupPasswordToggle('password', 'toggle-password');
    setupPasswordToggle('confirm-password', 'toggle-confirm-password');

    // --- Form Submission Logic (validation + simulated network + redirect) ---
    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            // Prevent the default form submission
            event.preventDefault();

            // Read values
            const emailEl = document.getElementById('email');
            const schoolEl = document.getElementById('school');
            const displayNameEl = document.getElementById('display-name');

            const email = emailEl ? emailEl.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
            const school = schoolEl ? schoolEl.value.trim() : '';
            const displayName = displayNameEl ? displayNameEl.value.trim() : '';

            // Validation
            if (email === '' || password === '' || confirmPassword === '' || school === '' || displayName === '') {
                updateMessage('Oops! Please fill in all the required fields to sign up.', 'error');
                return;
            }

            if (password.length < 8) {
                updateMessage('The password must be at least 8 characters long.', 'error');
                return;
            }

            if (password !== confirmPassword) {
                updateMessage("The passwords don't match. Please confirm your password carefully.", 'error');
                return;
            }

            
            const newPost = {
                "email": email,
                "password": password,
                "username": school,
                "displayName": displayName,
            };

            // Use full URL (include protocol). Without protocol fetch will treat this as a relative path.
            const endpoint = 'https://kingpin-backend-production.up.railway.app/accounts';

            console.log('Signup: sending POST to', endpoint, newPost);

            fetch(endpoint, {
                method: 'POST', // Specify the method
                headers: {
                    'Content-Type': 'application/json', // Indicate the body format
            },
            body: JSON.stringify(newPost), // Convert the JavaScript object to a JSON string
            })
            .then(response => {
                // If server responded with non-2xx status, try to include body text in error
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error(`Server ${response.status}: ${text || response.statusText}`);
                    });
                }
                // Parse JSON body and pass it along
                return response.json();
            })
            .then(data => {
                console.log('Signup response:', data);
                updateMessage('Account created successfully!', 'success');
                document.getElementById('signup-form').reset();
                window.location.href = "KingPinLogin.html";
            })
            .catch(error => {
                console.error('Signup fetch error:', error);
                updateMessage(`Signup failed: ${error.message}`, 'error');
            });
        });
    }
});
