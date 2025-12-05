// Account Settings Page JavaScript

// Get all DOM elements
const primaryColorBtn = document.getElementById('primary-color-btn');
const primaryColorPicker = document.getElementById('primary-color-picker');
const primaryColorInput = document.getElementById('primary-color-input');
const primaryColorValue = document.getElementById('primary-color-value');
const primaryColorPreview = document.getElementById('primary-color-preview');
const closePrimaryPicker = document.getElementById('close-primary-picker');
const applyPrimaryColor = document.getElementById('apply-primary-color');

const secondaryColorBtn = document.getElementById('secondary-color-btn');
const secondaryColorPicker = document.getElementById('secondary-color-picker');
const secondaryColorInput = document.getElementById('secondary-color-input');
const secondaryColorValue = document.getElementById('secondary-color-value');
const secondaryColorPreview = document.getElementById('secondary-color-preview');
const closeSecondaryPicker = document.getElementById('close-secondary-picker');
const applySecondaryColor = document.getElementById('apply-secondary-color');

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

// Primary Color Picker Functions
primaryColorBtn.addEventListener('click', () => {
    primaryColorPicker.classList.remove('hidden');
});

closePrimaryPicker.addEventListener('click', () => {
    primaryColorPicker.classList.add('hidden');
});

primaryColorInput.addEventListener('input', (e) => {
    primaryColorPreview.style.backgroundColor = e.target.value;
});

applyPrimaryColor.addEventListener('click', () => {
    const selectedColor = primaryColorInput.value;
    primaryColorValue.value = selectedColor;
    primaryColorPreview.style.backgroundColor = selectedColor;
    primaryColorPicker.classList.add('hidden');
    showMessage('Primary color updated!', 'success');
});

// Secondary Color Picker Functions
secondaryColorBtn.addEventListener('click', () => {
    secondaryColorPicker.classList.remove('hidden');
});

closeSecondaryPicker.addEventListener('click', () => {
    secondaryColorPicker.classList.add('hidden');
});

secondaryColorInput.addEventListener('input', (e) => {
    secondaryColorPreview.style.backgroundColor = e.target.value;
});

applySecondaryColor.addEventListener('click', () => {
    const selectedColor = secondaryColorInput.value;
    secondaryColorValue.value = selectedColor;
    secondaryColorPreview.style.backgroundColor = selectedColor;
    secondaryColorPicker.classList.add('hidden');
    showMessage('Secondary color updated!', 'success');
});

// Close modals when clicking outside
primaryColorPicker.addEventListener('click', (e) => {
    if (e.target === primaryColorPicker) {
        primaryColorPicker.classList.add('hidden');
    }
});

secondaryColorPicker.addEventListener('click', (e) => {
    if (e.target === secondaryColorPicker) {
        secondaryColorPicker.classList.add('hidden');
    }
});

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
        primaryColor: primaryColorValue.value,
        secondaryColor: secondaryColorValue.value,
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

// Manual hex input for primary color
primaryColorValue.addEventListener('input', (e) => {
    let value = e.target.value;
    // Ensure it starts with #
    if (!value.startsWith('#')) {
        value = '#' + value;
        e.target.value = value;
    }
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        primaryColorPreview.style.backgroundColor = value;
        primaryColorInput.value = value;
    }
});

// Manual hex input for secondary color
secondaryColorValue.addEventListener('input', (e) => {
    let value = e.target.value;
    // Ensure it starts with #
    if (!value.startsWith('#')) {
        value = '#' + value;
        e.target.value = value;
    }
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        secondaryColorPreview.style.backgroundColor = value;
        secondaryColorInput.value = value;
    }
});

// Initialize color previews on page load
window.addEventListener('DOMContentLoaded', () => {
    primaryColorPreview.style.backgroundColor = primaryColorValue.value;
    secondaryColorPreview.style.backgroundColor = secondaryColorValue.value;
});
