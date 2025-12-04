const REDIRECT_DELAY_MS = 1000; // Time in milliseconds before redirecting after success message

document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');

    // --- Helper function to update the message box style and text ---
    function updateMessage(text, type) {
        // NOTE: These colors are using Tailwind classes.
        const baseClasses = ['p-4', 'rounded-lg', 'text-sm', 'font-semibold'];
        
        // Type-specific colors (using utility classes that contrast with the dark theme)
        const colors = {
            error: { bg: 'bg-red-900', text: 'text-red-300' },
            info: { bg: 'bg-blue-900', text: 'text-blue-300' },
            success: { bg: 'bg-green-900', text: 'text-green-300' }
        };

        // Clear existing classes and apply new ones
        messageBox.className = baseClasses.join(' ');
        messageBox.classList.add(colors[type].bg, colors[type].text);
        messageBox.classList.remove('hidden');
        messageText.textContent = text;
    }

    // --- Password Toggle Logic (REQUIRED FOR SHOW/HIDE BUTTONS) ---
    function setupPasswordToggle(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);

        if (input && button) {
            button.addEventListener('click', (e) => {
                e.preventDefault(); // Stop button from submitting the form
                
                // Toggle the type attribute
                const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
                input.setAttribute('type', type);
                
                // Toggle the button text
                button.textContent = type === 'password' ? 'Show' : 'Hide';
            });
        }
    }

    // Apply the toggle logic to both password fields
    setupPasswordToggle('password', 'toggle-password');
    setupPasswordToggle('confirm-password', 'toggle-confirm-password');


    // --- Form Submission Logic ---
    signupForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value.trim();
        const school = document.getElementById('school').value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        // 1. Check for empty fields
        if (email === '' || password === '' || confirmPassword === '' || school === '') {
            updateMessage('Oops! Please fill in all the required fields to sign up.', 'error');
            return;
        }

        // 2. Check for minimum length (8 characters)
        if (password.length < 8) {
             updateMessage('The password must be at least 8 characters long.', 'error');
             return;
        }

        // 3. Check if passwords match
        if (password !== confirmPassword) {
            updateMessage("The passwords don't match. Please confirm your password carefully.", 'error');
            return;
        }

        // If validation passes: Simulate sign up
        updateMessage('Setting up your lane... registering your membership...', 'info');

        // Simulate a network request delay (2000ms)
        setTimeout(() => {
            updateMessage(`STRIKE! You're signed up with email: ${email}. Welcome to the league! (Mock Sign Up)`, 'success');

            // Clear the form fields
            signupForm.reset();

            // Navigate back to login page after successful signup
            setTimeout(() => {
                window.location.href = 'index.html';
            }, REDIRECT_DELAY_MS); // Redirects after 1000ms (1 second)

        }, 2000); 
    });
});
