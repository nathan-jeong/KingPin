document.addEventListener('DOMContentLoaded', () => {
    const signupForm = document.getElementById('signup-form');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    const messageBox = document.getElementById('message-box');
    const messageText = document.getElementById('message-text');

    // --- Helper function to update the message box style and text ---
    function updateMessage(text, type) {
        // Define color classes for the flat black & white theme
        const colors = {
            error: { bg: 'bg-red-800', text: 'text-white', border: 'border-red-600' },
            info: { bg: 'bg-gray-800', text: 'text-white', border: 'border-gray-600' },
            success: { bg: 'bg-green-800', text: 'text-white', border: 'border-green-600' }
        };
        const baseClasses = ['p-4', 'text-sm', 'font-semibold', 'border'];

        // Clear existing classes and apply new ones
        messageBox.className = baseClasses.join(' ');
        messageBox.classList.add(colors[type].bg, colors[type].text, colors[type].border);
        messageBox.classList.remove('hidden');
        messageText.textContent = text;
    }

    // --- Password Toggle Logic ---
    function setupPasswordToggle(inputId, buttonId) {
        const input = document.getElementById(inputId);
        const button = document.getElementById(buttonId);

        if (input && button) {
            button.addEventListener('click', (e) => {
                // FIX: This line stops the button click from triggering a form submission.
                e.preventDefault(); 
                
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
            updateMessage("Warning: The passwords do not match. Please ensure both fields are identical.", 'error');
            return;
        }

        // If validation passes: Simulate sign up
        updateMessage('Setting up your lane... registering your membership...', 'info');

        // Simulate a network request delay
        setTimeout(() => {
            updateMessage(`STRIKE! You're signed up with email: ${email}. Welcome to the league! (Mock Sign Up)`, 'success');

            // Clear the form fields
            signupForm.reset();

        }, 2000); 
    });
});
