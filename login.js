// Function to handle form submission and simulated login
document.getElementById('login-form').addEventListener('submit', function(event) {
    // Prevent the default form submission
    event.preventDefault();

    // Get form data
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

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

        // Clear existing color classes
        // Note: Tailwind classes must be kept here for dynamic styling
        messageBox.className = baseClasses.join(' ');
        
        // Add new color classes
        messageBox.classList.add(colors[type].bg, colors[type].text);
        messageBox.classList.remove('hidden');
        messageText.textContent = text;
    }

    // Simple validation
    if (email === '' || password === '') {
        updateMessage('Oops! Looks like you missed entering your email or password.', 'error');
        return;
    }

    // Simulate a login attempt
    updateMessage('The ball is rolling... checking your credentials...', 'info');

    // Simulate a network request delay
    setTimeout(() => {
        // In a real application, you would check credentials here.
        // For this mock, we simulate success.
        updateMessage(`STRIKE! Access granted for: ${email}. Welcome to the lane! (Mock Login)`, 'success');

        // Clear the form fields
        document.getElementById('login-form').reset();

    }, 2000); // 2 second delay for simulation
});
