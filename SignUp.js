// Function to handle form submission and simulated sign up
document.getElementById('signup-form').addEventListener('submit', function(event) {
    // Prevent the default form submission
    event.preventDefault();

    // Get form data
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const school = document.getElementById('school').value.trim();

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

        // Clear existing color classes (important for dynamic Tailwind)
        // Note: Tailwind classes must be kept here for dynamic styling
        messageBox.className = baseClasses.join(' ');
        
        // Add new color classes
        messageBox.classList.add(colors[type].bg, colors[type].text);
        messageBox.classList.remove('hidden');
        messageText.textContent = text;
    }

    // --- Validation Checks ---
    if (email === '' || password === '' || confirmPassword === '' || school === '') {
        updateMessage('Oops! Please fill in all the required fields to sign up.', 'error');
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
        // In a real application, you would send data to a server here.
        // For this mock, we simulate success.
        updateMessage(`STRIKE! You're signed up with email: ${email}. Welcome to the league! (Mock Sign Up)`, 'success');

        // Optionally clear the form fields upon success
        document.getElementById('signup-form').reset();

        // Navigate back to login page after successful signup
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);

    }, 2000); // 2 second delay for simulation
});