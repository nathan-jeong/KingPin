// SVG Strings for Icons
const eyeOpenSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

const eyeClosedSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

function toggleVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    
    if (input.type === "password") {
        // Show Password
        input.type = "text";
        btn.innerHTML = eyeOpenSVG;
    } else {
        // Hide Password
        input.type = "password";
        btn.innerHTML = eyeClosedSVG;
    }
}

function handleReset(event) {
    event.preventDefault(); // Stop page reload

    const p1 = document.getElementById('new-password').value;
    const p2 = document.getElementById('confirm-password').value;
    const errorMsg = document.getElementById('error-message');

    // Basic Validation
    if(p1 !== p2) {
        errorMsg.style.display = 'block';
        return;
    } else {
        errorMsg.style.display = 'none';
    }

    // Simulate "Sending" delay, then show success
    const btn = document.querySelector('.btn-submit');
    const originalText = btn.innerText;
    btn.innerText = "Setting Pin...";
    btn.style.opacity = "0.7";

    setTimeout(() => {
        // Hide Form, Show Success
        document.getElementById('form-view').style.display = 'none';
        document.getElementById('success-view').style.display = 'flex';
    }, 800);
}