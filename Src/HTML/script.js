import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, 
         sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.1.3/firebase-analytics.js";

// Security configurations
const MAX_ATTEMPTS = 6;
const LOCKOUT_TIME = 120000; // 2 minutes in milliseconds
let attemptCount = parseInt(localStorage.getItem('pinAttempts') || '0');
let lockoutEndTime = parseInt(localStorage.getItem('lockoutEnd') || '0');
let countdownInterval;
const countdownTimer = document.getElementById('countdownTimer');

// Lock screen functionality
const CORRECT_PIN = '2019'; // Updated PIN
const wrapper = document.querySelector('.wrapper');
const lockScreen = document.getElementById('lockScreen');
const pinInputs = document.querySelectorAll('.pin-input');
const pinError = document.getElementById('pinError');

// Always require PIN verification on page load
sessionStorage.removeItem('pinVerified'); // Force PIN check every time

// Prevent access to main content until PIN is verified
if (!sessionStorage.getItem('pinVerified')) {
    wrapper.style.display = 'none';
    lockScreen.style.display = 'flex';
    // Clear any existing PIN inputs
    pinInputs.forEach(input => input.value = '');
    // Focus on first PIN input
    pinInputs[0].focus();
} else {
    wrapper.style.display = 'block';
    lockScreen.style.display = 'none';
}

// Handle PIN input
pinInputs.forEach((input, index) => {
    input.addEventListener('keyup', (e) => {
        if (e.key >= 0 && e.key <= 9) {
            if (index < pinInputs.length - 1) {
                pinInputs[index + 1].focus();
            }
            validatePin();
        } else if (e.key === 'Backspace') {
            if (index > 0) {
                pinInputs[index - 1].focus();
            }
        }
    });

    input.addEventListener('focus', () => {
        input.select();
    });
});

function startCountdown(duration) {
    const timerDisplay = document.getElementById('countdownTimer');
    const minutesSpan = document.getElementById('minutes');
    const secondsSpan = document.getElementById('seconds');
    
    let timer = duration;
    timerDisplay.classList.add('active');
    
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
        const minutes = parseInt(timer / 60, 10);
        const seconds = parseInt(timer % 60, 10);

        minutesSpan.textContent = minutes < 10 ? "0" + minutes : minutes;
        secondsSpan.textContent = seconds < 10 ? "0" + seconds : seconds;

        if (--timer < 0) {
            clearInterval(countdownInterval);
            timerDisplay.classList.remove('active');
            resetAttempts();
            pinInputs.forEach(input => input.disabled = false);
            pinError.textContent = 'You can try again now';
            setTimeout(() => {
                pinError.textContent = '';
            }, 3000);
        }
    }, 1000);
}

function checkLockout() {
    const now = Date.now();
    if (lockoutEndTime > now) {
        const remainingSeconds = Math.ceil((lockoutEndTime - now) / 1000);
        pinError.textContent = 'Account locked';
        pinInputs.forEach(input => {
            input.disabled = true;
            input.value = '';
        });
        startCountdown(remainingSeconds);
        return true;
    }
    
    if (lockoutEndTime && lockoutEndTime < now) {
        clearInterval(countdownInterval);
        countdownTimer.classList.remove('active');
        resetAttempts();
        pinInputs.forEach(input => input.disabled = false);
    }
    return false;
}

function resetAttempts() {
    attemptCount = 0;
    lockoutEndTime = 0;
    localStorage.setItem('pinAttempts', '0');
    localStorage.setItem('lockoutEnd', '0');
    pinError.textContent = '';
    clearInterval(countdownInterval);
    countdownTimer.classList.remove('active');
}

function validatePin() {
    if (checkLockout()) return;

    const enteredPin = Array.from(pinInputs).map(input => input.value).join('');
    
    if (enteredPin.length === 4) {
        attemptCount++;
        localStorage.setItem('pinAttempts', attemptCount.toString());

        if (enteredPin === CORRECT_PIN) {
            sessionStorage.setItem('pinVerified', 'true');
            lockScreen.style.display = 'none';
            wrapper.style.display = 'block';
            resetAttempts();
        } else {
            const remainingAttempts = MAX_ATTEMPTS - attemptCount;
            pinError.textContent = `Incorrect PIN. ${remainingAttempts} attempts remaining`;
            pinInputs.forEach(input => {
                input.value = '';
                input.classList.add('error');
            });
            pinInputs[0].focus();

            if (attemptCount >= MAX_ATTEMPTS) {
                lockoutEndTime = Date.now() + LOCKOUT_TIME;
                localStorage.setItem('lockoutEnd', lockoutEndTime.toString());
                checkLockout();
            }
            
            setTimeout(() => {
                pinInputs.forEach(input => input.classList.remove('error'));
                if (!checkLockout() && remainingAttempts > 0) {
                    pinError.textContent = `${remainingAttempts} attempts remaining`;
                }
            }, 1000);
        }
    }
}

// Prevent right-click
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Prevent keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) {
        e.preventDefault();
    }
});

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBNMwf-hrP2PLvJ6qubXV2ILLjAbcwSbyw",
  authDomain: "auth-4ac21.firebaseapp.com",
  projectId: "auth-4ac21",
  storageBucket: "auth-4ac21.firebasestorage.app",
  messagingSenderId: "415327194439",
  appId: "1:415327194439:web:692452c3e77d4da76c1062",
  measurementId: "G-50YMS5DTY9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const loginButton = document.getElementById('loginButton');
const loginLoader = document.getElementById('loginLoader');

// Modal Elements
const modal = document.getElementById('resetPasswordModal');
const closeBtn = document.getElementsByClassName('close')[0];
const resetEmailInput = document.getElementById('resetEmail');
const resetEmailError = document.getElementById('resetEmailError');
const sendResetLink = document.getElementById('sendResetLink');
const resetLoader = document.getElementById('resetLoader');

function showLoader(button, loader) {
    button.disabled = true;
    loader.style.display = 'block';
}

function hideLoader(button, loader) {
    button.disabled = false;
    loader.style.display = 'none';
}

// Add input field focus effects
document.querySelectorAll('.field input').forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
    });

    input.addEventListener('blur', () => {
        input.parentElement.classList.remove('focused');
        validateField(input);
    });
});

function validateField(input) {
    const field = input.parentElement;
    field.classList.remove('success', 'error');

    if (input.value) {
        if (input.validity.valid) {
            field.classList.add('success');
        } else {
            field.classList.add('error');
        }
    }
}

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    showLoader(loginButton, loginLoader);

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User:', userCredential.user);
        window.location.href = "./Index.html"; // Update redirect path
    } catch (error) {
        document.getElementById('loginEmailError').textContent = '';
        document.getElementById('loginPasswordError').textContent = '';
        
        switch(error.code) {
            case 'auth/invalid-email':
                document.getElementById('loginEmailError').textContent = 'Invalid email address';
                break;
            case 'auth/user-not-found':
                document.getElementById('loginEmailError').textContent = 'User not found';
                break;
            case 'auth/wrong-password':
                document.getElementById('loginPasswordError').textContent = 'Incorrect password';
                break;
            default:
                alert('Login failed: ' + error.message);
        }
    } finally {
        hideLoader(loginButton, loginLoader);
    }
});

document.getElementById('googleSignIn').addEventListener('click', async () => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Google Sign In successful:', result.user);
        window.location.href = "./Index.html"; // Update redirect path
    } catch (error) {
        console.error('Google Sign In Error:', error);
        if (error.code !== 'auth/popup-closed-by-user') {
            alert('Google sign in failed: ' + error.message);
        }
    }
});

// Forgot Password Link
document.getElementById('forgotPassword').addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = "block";
    resetEmailInput.value = document.getElementById('loginEmail').value;
});

// Close Modal
closeBtn.onclick = () => {
    modal.style.display = "none";
    resetEmailError.textContent = '';
    resetEmailInput.value = '';
};

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = "none";
        resetEmailError.textContent = '';
        resetEmailInput.value = '';
    }
};

// Send Password Reset Email
sendResetLink.addEventListener('click', async () => {
    const email = resetEmailInput.value;
    resetEmailError.textContent = '';
    
    if (!email) {
        resetEmailError.textContent = 'Please enter your email address';
        return;
    }

    showLoader(sendResetLink, resetLoader);

    try {
        await sendPasswordResetEmail(auth, email);
        
        // Show success message
        resetEmailError.textContent = '';
        const successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = 'Password reset link sent! Please check your email.';
        resetEmailError.parentNode.appendChild(successMsg);

        // Close modal after 3 seconds
        setTimeout(() => {
            modal.style.display = "none";
            resetEmailInput.value = '';
            successMsg.remove();
        }, 3000);

    } catch (error) {
        switch(error.code) {
            case 'auth/invalid-email':
                resetEmailError.textContent = 'Invalid email address';
                break;
            case 'auth/user-not-found':
                resetEmailError.textContent = 'No account found with this email';
                break;
            default:
                resetEmailError.textContent = 'Error sending reset link. Please try again.';
        }
    } finally {
        hideLoader(sendResetLink, resetLoader);
    }
});

// Add cleanup on page load
window.addEventListener('load', () => {
    checkLockout();
    // Clear verification on tab/window close
    window.addEventListener('beforeunload', () => {
        sessionStorage.removeItem('pinVerified');
        clearInterval(countdownInterval);
    });
});

// Additional security measures
// Prevent paste
pinInputs.forEach(input => {
    input.addEventListener('paste', e => e.preventDefault());
});

// Prevent drag and drop
document.addEventListener('dragstart', e => e.preventDefault());
document.addEventListener('drop', e => e.preventDefault());

// Disable developer tools shortcuts
document.addEventListener('keydown', (e) => {
    if (
        (e.ctrlKey && (e.shiftKey || e.keyCode === 73)) || // Ctrl+Shift+I or Ctrl+I
        (e.ctrlKey && e.keyCode === 85) || // Ctrl+U
        e.keyCode === 123 // F12
    ) {
        e.preventDefault();
    }
});
