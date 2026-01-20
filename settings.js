// Account Settings Page JavaScript
const API_BASE = 'https://kingpin-backend-production.up.railway.app';

// Get all DOM elements
const rememberMe = localStorage.getItem('rememberMe') === 'true';
const savedEmail = localStorage.getItem('email');
const savedPassword = localStorage.getItem('password');
const savedDisplayName = localStorage.getItem('displayName');
const userId = localStorage.getItem('userId');

function clearAllCookies() {
    const cookies = document.cookie ? document.cookie.split(';') : [];
    cookies.forEach(raw => {
        const eqPos = raw.indexOf('=');
        const name = (eqPos > -1 ? raw.substr(0, eqPos) : raw).trim();
        if (name) {
            document.cookie = `${name}=; Max-Age=0; path=/`;
        }
    });
}


function clearAllAuthStorage() {
    // Clear known auth-related cookies
    ['email', 'password', 'rememberMe', 'school', 'teamId', 'teamDisplayName', 'teamName', 'userId'].forEach(name => {
        document.cookie = `${name}=; Max-Age=0; path=/`;
    });
    // Clear any other cookies on this origin
    clearAllCookies();

    // Clear all localStorage (per requirement)
    localStorage.clear();
}

const displayNameInput = document.getElementById('display-name-input');
const editDisplayNameBtn = document.getElementById('edit-display-name-btn');
const displayNameEditControls = document.getElementById('display-name-edit-controls');
const saveDisplayNameBtn = document.getElementById('save-display-name-btn');
const cancelDisplayNameBtn = document.getElementById('cancel-display-name-btn');

const emailInput = document.getElementById('email-input');

// Display saved email (from localStorage) if available
if (emailInput) {
    if (savedEmail) {
        emailInput.value = savedEmail;
    }
    emailInput.disabled = true;
}

const schoolInput = document.getElementById('school-input');

// Fetch full user data to get username
if (schoolInput && userId) {
    fetch(`${API_BASE}/accounts/${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(async (response) => {
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Server ${response.status}`);
        }
        return response.json();
    })
    .then((userData) => {
        // Extract username from user data and display it
        if (userData.user.username) {
            schoolInput.value = userData.user.username;
        } else if (userId) {
            // Fallback to userId if username not found
            schoolInput.value = "Failed to load School";
        }
    })
    .catch((err) => {
        console.error('Failed to fetch user data:', err);
        // Fallback to userId on error
        if (userId) {
            schoolInput.value = "Failed to load School";
        }
    });
    
    schoolInput.disabled = true;
}

const passwordInput = document.getElementById('password-input');
const editPasswordBtn = document.getElementById('edit-password-btn');
const passwordEditControls = document.getElementById('password-edit-controls');
const savePasswordBtn = document.getElementById('save-password-btn');
const cancelPasswordBtn = document.getElementById('cancel-password-btn');
const togglePasswordBtn = document.getElementById('toggle-password-btn');

const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');

// Display saved display name and password (from localStorage) if available
if (displayNameInput) {
    if (savedDisplayName) {
        displayNameInput.value = savedDisplayName;
    }
    displayNameInput.readOnly = true;
}

if (passwordInput) {
    if (savedPassword) {
        passwordInput.value = savedPassword;
    }
    passwordInput.readOnly = true;
    passwordInput.type = 'password';
}

// Store original values
let originalDisplayName = displayNameInput.value;
let originalPassword = passwordInput.value;

// Display Name Edit Functions
editDisplayNameBtn.addEventListener('click', () => {
    originalDisplayName = displayNameInput.value;
    displayNameInput.readOnly = false;
    displayNameInput.focus();
    displayNameInput.classList.add('border-rose-500');
    editDisplayNameBtn.classList.add('hidden');
    displayNameEditControls.classList.remove('hidden');
});

saveDisplayNameBtn.addEventListener('click', () => {
    const newDisplayName = displayNameInput.value.trim();

    if (!newDisplayName) {
        showMessage('Display name cannot be empty.', 'error');
        return;
    }

    if (!userId) {
        showMessage('Cannot update display name: user not logged in.', 'error');
        return;
    }

    const password = prompt('Enter your password to update display name:');
    if (!password) {
        showMessage('Display name update cancelled (missing password).', 'error');
        return;
    }

    fetch(`${API_BASE}/accounts/${userId}/displayName`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, displayName: newDisplayName })
    })
    .then(async (response) => {
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Server ${response.status}`);
        }
        return response.json();
    })
    .then(() => {
        displayNameInput.readOnly = true;
        displayNameInput.classList.remove('border-rose-500');
        editDisplayNameBtn.classList.remove('hidden');
        displayNameEditControls.classList.add('hidden');
        localStorage.setItem('displayName', newDisplayName);
        localStorage.setItem('school', savedSchool);
        showMessage('Display name updated successfully!', 'success');
    })
    .catch((err) => {
        showMessage(`Display name update failed: ${err.message}`, 'error');
    });
});

cancelDisplayNameBtn.addEventListener('click', () => {
    displayNameInput.value = originalDisplayName;
    displayNameInput.readOnly = true;
    displayNameInput.classList.remove('border-rose-500');
    editDisplayNameBtn.classList.remove('hidden');
    displayNameEditControls.classList.add('hidden');
});

// Password Edit Functions
editPasswordBtn.addEventListener('click', () => {
    originalPassword = passwordInput.value;
    passwordInput.readOnly = false;
    passwordInput.type = 'text';
    passwordInput.focus();
    passwordInput.classList.add('border-rose-500');
    editPasswordBtn.classList.add('hidden');
    passwordEditControls.classList.remove('hidden');
});

savePasswordBtn.addEventListener('click', () => {
    if (passwordInput.value.length < 8) {
        showMessage('Password must be at least 8 characters long', 'error');
        return;
    }

    if (!userId) {
        showMessage('Cannot change password: user not logged in.', 'error');
        return;
    }

    const currentPassword = prompt('Enter your current password to confirm the change:');
    if (!currentPassword) {
        showMessage('Password change cancelled (missing current password).', 'error');
        return;
    }

    const newPassword = passwordInput.value;

    fetch(`${API_BASE}/accounts/${userId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
    })
    .then(async (response) => {
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Server ${response.status}`);
        }
        return response.json();
    })
    .then(() => {
        passwordInput.readOnly = true;
        passwordInput.type = 'password';
        passwordInput.classList.remove('border-rose-500');
        editPasswordBtn.classList.remove('hidden');
        passwordEditControls.classList.add('hidden');
        localStorage.setItem('password', newPassword);
        showMessage('Password updated successfully!', 'success');
    })
    .catch((err) => {
        showMessage(`Password change failed: ${err.message}`, 'error');
    });
});

cancelPasswordBtn.addEventListener('click', () => {
    passwordInput.value = originalPassword;
    passwordInput.readOnly = true;
    passwordInput.type = 'password';
    passwordInput.classList.remove('border-rose-500');
    editPasswordBtn.classList.remove('hidden');
    passwordEditControls.classList.add('hidden');
});

// Toggle Password Visibility
togglePasswordBtn.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        togglePasswordBtn.textContent = 'Hide';
    } else {
        passwordInput.type = 'password';
        togglePasswordBtn.textContent = 'Show';
    }
});


// Message Display Function
function showMessage(message, type) {
    messageText.textContent = message;
    messageBox.className = `mt-6 p-4 rounded-lg text-sm transition duration-300 ease-in-out ${type}`;
    messageBox.classList.remove('hidden');
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 4000);
}

// Logout Button Handler
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        clearAllAuthStorage();
        window.location.href = 'index.html';
    });
}

// Delete Account Button Handler
const deleteAccountBtn = document.getElementById('delete-account-btn');
if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', () => {
        // First confirmation: "Are you sure?"
        const confirmDelete = confirm('Are you sure you want to delete your account? This action cannot be undone.');
        
        if (confirmDelete) {
            // Second confirmation: Password prompt
            const password = prompt('Please enter your password to confirm account deletion:');
            
            if (!password || password.trim() === '') {
                if (password !== null) showMessage('Password is required to delete account.', 'error');
                return;
            }

            if (!userId) {
                showMessage('Cannot delete account: user not logged in.', 'error');
                return;
            }

            fetch(`${API_BASE}/accounts/${userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            })
            .then(async (response) => {
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(text || `Server ${response.status}`);
                }
                return response.json();
            })
            .then(() => {
                showMessage('Account deleted successfully. Redirecting to signup...', 'success');
                clearAllAuthStorage();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1200);
            })
            .catch((err) => {
                showMessage(`Delete failed: ${err.message}`, 'error');
            });
        }
    });
}

// Go Back Button Handler
const goBackBtn = document.getElementById('go-back-btn');
if (goBackBtn) {
    goBackBtn.addEventListener('click', () => {
        window.history.back();
    });
}
