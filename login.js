// Enhanced Login JavaScript for Classroom Financial Management System

// DOM elements
const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('loginBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');

// Initialize login page
document.addEventListener('DOMContentLoaded', function() {
    setupLoginForm();
    setupInputEffects();
    checkExistingSession();
    
    // Auto-focus username input
    usernameInput.focus();
});

// Setup login form
function setupLoginForm() {
    loginForm.addEventListener('submit', handleLogin);
    
    // Add input event listeners for real-time validation
    usernameInput.addEventListener('input', clearError);
    passwordInput.addEventListener('input', clearError);
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Enter key to submit
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleLogin(e);
        }
        
        // Tab navigation
        if (e.key === 'Tab') {
            handleTabNavigation(e);
        }
    });
}

// Setup input effects
function setupInputEffects() {
    const inputs = [usernameInput, passwordInput];
    
    inputs.forEach(input => {
        // Add focus effects
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
        
        // Add typing animation
        input.addEventListener('input', function() {
            if (this.value.length > 0) {
                this.style.borderColor = '#48bb78';
            } else {
                this.style.borderColor = '#e2e8f0';
            }
        });
    });
}

// Check for existing session
function checkExistingSession() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        showSuccessMessage('กำลังเข้าสู่ระบบ...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// Handle login
function handleLogin(e) {
    e.preventDefault();
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    // Clear previous messages
    clearMessages();
    
    // Validate input
    if (!username || !password) {
        showErrorMessage('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    // Simulate network delay for better UX
    setTimeout(() => {
        const loginResult = authenticateUser(username, password);
        
        if (loginResult.success) {
            handleSuccessfulLogin(loginResult.user);
        } else {
            handleFailedLogin(loginResult.error);
        }
        
        setLoadingState(false);
    }, 800);
}

// Authenticate user
function authenticateUser(username, password) {
    // Admin authentication
    if (username === 'admin' && password === 'admin') {
        return {
            success: true,
            user: {
                username: 'admin',
                display: 'ผู้ดูแลระบบ',
                role: 'admin'
            }
        };
    }
    
    // Student authentication (numbers 1-41)
    const studentNumber = parseInt(username);
    if (!isNaN(studentNumber) && studentNumber >= 1 && studentNumber <= 41) {
        if (username === password) {
            return {
                success: true,
                user: {
                    username: username,
                    display: `นักเรียนหมายเลข ${studentNumber}`,
                    role: 'student',
                    studentNumber: studentNumber
                }
            };
        }
    }
    
    return {
        success: false,
        error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
    };
}

// Handle successful login
function handleSuccessfulLogin(user) {
    // Store user data
    localStorage.setItem('user', JSON.stringify(user));
    
    // Show success message
    showSuccessMessage('เข้าสู่ระบบสำเร็จ! กำลังเปลี่ยนหน้า...');
    
    // Add success animation
    loginBtn.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
    loginBtn.innerHTML = '<i class="fas fa-check"></i> สำเร็จ';
    
    // Redirect after delay
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Handle failed login
function handleFailedLogin(error) {
    showErrorMessage(error);
    
    // Add error animation
    loginBtn.style.background = 'linear-gradient(135deg, #f56565, #e53e3e)';
    loginBtn.innerHTML = '<i class="fas fa-times"></i> ล้มเหลว';
    
    // Reset button after delay
    setTimeout(() => {
        loginBtn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> เข้าสู่ระบบ';
    }, 2000);
    
    // Shake animation
    loginCard.classList.add('shake');
    setTimeout(() => {
        loginCard.classList.remove('shake');
    }, 500);
}

// Set loading state
function setLoadingState(isLoading) {
    if (isLoading) {
        loginBtn.disabled = true;
        loadingSpinner.style.display = 'inline-block';
        loginBtn.innerHTML = '<span class="loading"></span> กำลังเข้าสู่ระบบ...';
    } else {
        loginBtn.disabled = false;
        loadingSpinner.style.display = 'none';
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> เข้าสู่ระบบ';
    }
}

// Show error message
function showErrorMessage(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.classList.add('fade-in');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideErrorMessage();
    }, 5000);
}

// Show success message
function showSuccessMessage(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    successMessage.classList.add('fade-in');
}

// Hide error message
function hideErrorMessage() {
    errorMessage.classList.remove('fade-in');
    errorMessage.classList.add('fade-out');
    setTimeout(() => {
        errorMessage.style.display = 'none';
        errorMessage.classList.remove('fade-out');
    }, 300);
}

// Hide success message
function hideSuccessMessage() {
    successMessage.classList.remove('fade-in');
    successMessage.classList.add('fade-out');
    setTimeout(() => {
        successMessage.style.display = 'none';
        successMessage.classList.remove('fade-out');
    }, 300);
}

// Clear all messages
function clearMessages() {
    hideErrorMessage();
    hideSuccessMessage();
}

// Clear error on input
function clearError() {
    if (errorMessage.style.display === 'block') {
        hideErrorMessage();
    }
}

// Handle tab navigation
function handleTabNavigation(e) {
    const inputs = [usernameInput, passwordInput];
    const currentIndex = inputs.indexOf(document.activeElement);
    
    if (e.shiftKey && currentIndex === 0) {
        // Shift+Tab on first input - focus last input
        e.preventDefault();
        inputs[inputs.length - 1].focus();
    } else if (!e.shiftKey && currentIndex === inputs.length - 1) {
        // Tab on last input - focus first input
        e.preventDefault();
        inputs[0].focus();
    }
}

// Add shake animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .shake {
        animation: shake 0.5s ease-in-out;
    }
    
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fade-out {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-10px); }
    }
    
    .fade-in {
        animation: fade-in 0.3s ease-out;
    }
    
    .fade-out {
        animation: fade-out 0.3s ease-in;
    }
`;
document.head.appendChild(style);

// Get login card element
const loginCard = document.querySelector('.login-card');

// Add input validation
function validateInput(input, type) {
    const value = input.value.trim();
    
    switch(type) {
        case 'username':
            if (value === 'admin') return true;
            const studentNum = parseInt(value);
            return !isNaN(studentNum) && studentNum >= 1 && studentNum <= 41;
        case 'password':
            return value.length > 0;
        default:
            return true;
    }
}

// Add real-time validation
usernameInput.addEventListener('blur', function() {
    if (this.value.trim() && !validateInput(this, 'username')) {
        this.style.borderColor = '#f56565';
        showErrorMessage('ชื่อผู้ใช้ไม่ถูกต้อง (ใช้หมายเลข 1-41 หรือ admin)');
    }
});

passwordInput.addEventListener('blur', function() {
    if (this.value.trim() && !validateInput(this, 'password')) {
        this.style.borderColor = '#f56565';
        showErrorMessage('กรุณากรอกรหัสผ่าน');
    }
});

// Add demo mode for testing
function enableDemoMode() {
    // Auto-fill demo credentials
    usernameInput.value = 'admin';
    passwordInput.value = 'admin';
    
    // Add demo indicator
    const demoIndicator = document.createElement('div');
    demoIndicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(102, 126, 234, 0.9);
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        z-index: 1000;
    `;
    demoIndicator.textContent = 'Demo Mode';
    document.body.appendChild(demoIndicator);
}

// Enable demo mode in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Uncomment the line below to enable demo mode
    // enableDemoMode();
}

// Add accessibility features
function setupAccessibility() {
    // Add ARIA labels
    usernameInput.setAttribute('aria-label', 'ชื่อผู้ใช้');
    passwordInput.setAttribute('aria-label', 'รหัสผ่าน');
    loginBtn.setAttribute('aria-label', 'ปุ่มเข้าสู่ระบบ');
    
    // Add keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            clearMessages();
        }
    });
}

// Initialize accessibility
setupAccessibility();

// Add performance monitoring
const startTime = performance.now();
window.addEventListener('load', function() {
    const loadTime = performance.now() - startTime;
    console.log(`Login page loaded in ${loadTime.toFixed(2)}ms`);
});

// Add error tracking
window.addEventListener('error', function(e) {
    console.error('Login page error:', e.error);
});

// Add unhandled promise rejection tracking
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
}); 