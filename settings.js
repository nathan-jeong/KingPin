// Account Settings Page JavaScript

// Get all DOM elements
const schoolInput = document.getElementById('school-input');
const editSchoolBtn = document.getElementById('edit-school-btn');
const schoolEditControls = document.getElementById('school-edit-controls');
const saveSchoolBtn = document.getElementById('save-school-btn');
const cancelSchoolBtn = document.getElementById('cancel-school-btn');

const emailInput = document.getElementById('email-input');

const passwordInput = document.getElementById('password-input');
const editPasswordBtn = document.getElementById('edit-password-btn');
const passwordEditControls = document.getElementById('password-edit-controls');
const savePasswordBtn = document.getElementById('save-password-btn');
const cancelPasswordBtn = document.getElementById('cancel-password-btn');
const togglePasswordBtn = document.getElementById('toggle-password-btn');

const saveAllBtn = document.getElementById('save-all-btn');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');

// Store original values
let originalSchool = schoolInput.value;
let originalPassword = passwordInput.value;

// School Edit Functions
editSchoolBtn.addEventListener('click', () => {
    originalSchool = schoolInput.value;
    schoolInput.readOnly = false;
    schoolInput.focus();
    schoolInput.classList.add('border-rose-500');
    editSchoolBtn.classList.add('hidden');
    schoolEditControls.classList.remove('hidden');
});

saveSchoolBtn.addEventListener('click', () => {
    schoolInput.readOnly = true;
    schoolInput.classList.remove('border-rose-500');
    editSchoolBtn.classList.remove('hidden');
    schoolEditControls.classList.add('hidden');
    showMessage('School updated successfully!', 'success');
});

cancelSchoolBtn.addEventListener('click', () => {
    schoolInput.value = originalSchool;
    schoolInput.readOnly = true;
    schoolInput.classList.remove('border-rose-500');
    editSchoolBtn.classList.remove('hidden');
    schoolEditControls.classList.add('hidden');
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
    
    passwordInput.readOnly = true;
    passwordInput.type = 'password';
    passwordInput.classList.remove('border-rose-500');
    editPasswordBtn.classList.remove('hidden');
    passwordEditControls.classList.add('hidden');
    showMessage('Password updated successfully!', 'success');
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

// Save All Changes
saveAllBtn.addEventListener('click', () => {
    // Collect all settings
    const settings = {
        school: schoolInput.value,
        email: emailInput.value,
        password: passwordInput.value
    };
    
    // Here you would typically send this data to a server
    console.log('Saving all settings:', settings);
    
    // Show success message
    showMessage('All settings saved successfully!', 'success');
    
    // In a real application, you might redirect or update the UI
    // For now, we'll just show a message
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
        // Redirect to login page
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
            
            if (password && password.trim() !== '') {
                // Here you would typically verify the password with the server
                // For now, we'll just redirect to the signup page
                showMessage('Account deleted successfully. Redirecting to signup...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'SignUp.html';
                }, 1500);
            } else if (password !== null) {
                // User entered empty password
                showMessage('Password is required to delete account.', 'error');
            }
            // If password is null, user clicked Cancel, so do nothing
        }
    });
}
