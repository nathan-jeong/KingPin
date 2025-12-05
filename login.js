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
        .then(data => {
            console.log('Login response:', data);
            updateMessage('Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = "binaryarduino.html";
            }, 1000);
        })
        .catch(error => {
            console.error('Login fetch error:', error);
            updateMessage(`Login failed: ${error.message}`, 'error');
        });
    
});
