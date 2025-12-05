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
    
    const postData = {
        email: email,
        password: password,
    };

    fetch('http://kingpin-backend-production.up.railway.app/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    })
        .then(response => {
            if (response.ok) {
                updateMessage('Login successful! Redirecting...', 'success');
            }
            else
                return;
    })
    .catch(error => {
        updateMessage('Error during POST request:', error);
    });

    window.location.href = "teamSelector.html";
});
