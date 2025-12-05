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

            const email = emailEl ? emailEl.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';
            const school = schoolEl ? schoolEl.value.trim() : '';

            // Validation
            if (email === '' || password === '' || confirmPassword === '' || school === '') {
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

            // Simulate a sign up attempt
            updateMessage('Setting up your lane... registering your membership...', 'info');

            // Simulate a network request delay
            setTimeout(() => {
                // Simulate success
                updateMessage(`STRIKE! You're signed up with email: ${email}. Welcome to the league! (Mock Sign Up)`, 'success');

                // Clear the form fields upon success
                signupForm.reset();

                // Navigate back to login page after successful signup
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, REDIRECT_DELAY_MS);

            }, 2000); // 2 second delay for simulation
        });
    }
});
