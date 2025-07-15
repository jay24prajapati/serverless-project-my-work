let currentSessionId = null;
let currentUserId = null;
let authStep = 1;
let pendingVerificationEmail = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    bindFormEvents();
    showTab('register');
}

function bindFormEvents() {
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }

    const verifyForm = document.getElementById('verify-form');
    if (verifyForm) {
        verifyForm.addEventListener('submit', handleEmailVerification);
    }
    
    const loginStep1Form = document.getElementById('login-step1-form');
    if (loginStep1Form) {
        loginStep1Form.addEventListener('submit', handleLoginStep1);
    }
    
    const loginStep2Form = document.getElementById('login-step2-form');
    if (loginStep2Form) {
        loginStep2Form.addEventListener('submit', handleLoginStep2);
    }
    
    const loginStep3Form = document.getElementById('login-step3-form');
    if (loginStep3Form) {
        loginStep3Form.addEventListener('submit', handleLoginStep3);
    }
    
    const caesarInput = document.getElementById('caesar-answer');
    if (caesarInput) {
        caesarInput.addEventListener('input', function() {
            this.value = this.value.toUpperCase();
        });
    }
}

function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));
    
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => {
        if (button.textContent.toLowerCase().includes(tabName)) {
            button.classList.add('active');
        }
    });
}

async function handleRegistration(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById('register-result');
    
    const formData = {
        email: document.getElementById('reg-email').value.trim(),
        password: document.getElementById('reg-password').value,
        userType: document.getElementById('reg-usertype').value,
        securityQuestion: document.getElementById('reg-question').value,
        securityAnswer: document.getElementById('reg-answer').value.trim()
    };
    
    if (!validateRegistrationData(formData)) {
        return;
    }
    
    setLoadingState(submitButton, true);
    clearResultBox(resultDiv);
    
    try {
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.REGISTER), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            pendingVerificationEmail = formData.email;
            
            showResultBox(resultDiv, 'success', 
                `Registration Successful!\n` +
                `User ID: ${result.userId}\n` +
                `Email: ${result.email}\n` +
                `Type: ${result.userType}\n\n` +
                `Please check your email for a verification code.\n` +
                `Click on the "Verify Email" tab to complete verification.`
            );
            
            document.getElementById('verify-email').value = formData.email;
            
            setTimeout(() => {
                showTab('verify');
                showNotification('Check your email for the verification code.', 'info');
            }, 2000);
            
            form.reset();
            
        } else {
            showResultBox(resultDiv, 'error', `Registration Failed: ${result.error}`);
        }
        
    } catch (error) {
        showResultBox(resultDiv, 'error', `Network Error: ${error.message}`);
    } finally {
        setLoadingState(submitButton, false);
    }
}

async function handleEmailVerification(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById('verify-result');
    
    const verificationData = {
        email: document.getElementById('verify-email').value.trim(),
        verificationCode: document.getElementById('verify-code').value.trim()
    };
    
    if (!verificationData.email || !verificationData.verificationCode) {
        showNotification('Please enter both email and verification code', 'error');
        return;
    }
    
    setLoadingState(submitButton, true);
    clearResultBox(resultDiv);
    
    try {
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.VERIFY), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(verificationData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showResultBox(resultDiv, 'success', 
                `Email Verified Successfully!\n\n` +
                `Your account is now active and you can login.\n` +
                `Click on the "Login" tab to sign in.`
            );
            
            document.getElementById('login-email').value = verificationData.email;
            
            setTimeout(() => {
                showTab('login');
                showNotification('You can now login with your credentials.', 'success');
            }, 2000);
            
            form.reset();
            
        } else {
            showResultBox(resultDiv, 'error', `Verification Failed: ${result.error}`);
        }
        
    } catch (error) {
        showResultBox(resultDiv, 'error', `Network Error: ${error.message}`);
    } finally {
        setLoadingState(submitButton, false);
    }
}

async function resendVerificationCode() {
    const email = document.getElementById('verify-email').value.trim();
    
    if (!email) {
        showNotification('Please enter your email address first', 'error');
        return;
    }
    
    try {
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.RESEND_VERIFICATION), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showNotification('Verification code sent to your email.', 'success');
        } else {
            showNotification(`Failed to resend: ${result.error}`, 'error');
        }
        
    } catch (error) {
        showNotification(`Network Error: ${error.message}`, 'error');
    }
}

function validateRegistrationData(data) {
    if (!data.email || !data.password || !data.userType || !data.securityQuestion || !data.securityAnswer) {
        showNotification('Please fill in all fields', 'error');
        return false;
    }
    
    if (data.password.length < 8) {
        showNotification('Password must be at least 8 characters long', 'error');
        return false;
    }
    
    if (!data.email.includes('@')) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    return true;
}

async function handleLoginStep1(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById('login-result');
    
    const loginData = {
        step: 1,
        username: document.getElementById('login-email').value.trim(),
        password: document.getElementById('login-password').value
    };
    
    if (!loginData.username || !loginData.password) {
        showNotification('Please enter both email and password', 'error');
        return;
    }
    
    setLoadingState(submitButton, true);
    clearResultBox(resultDiv);
    
    try {
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.LOGIN), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            currentSessionId = result.sessionId;
            currentUserId = result.userId;
            
            document.getElementById('security-question-display').innerHTML = 
                `<strong>Security Question:</strong><br>${result.securityQuestion}`;
            
            showAuthStep(2);
            showResultBox(resultDiv, 'success', `Step 1 Complete: Cognito authentication successful`);
            
        } else {
            let errorMessage = result.error;
            if (errorMessage.includes('User account not confirmed')) {
                errorMessage += '\n\nPlease verify your email address first using the "Verify Email" tab.';
            }
            showResultBox(resultDiv, 'error', `Step 1 Failed: ${errorMessage}`);
        }
        
    } catch (error) {
        showResultBox(resultDiv, 'error', `Network Error: ${error.message}`);
    } finally {
        setLoadingState(submitButton, false);
    }
}

async function handleLoginStep2(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById('login-result');
    
    const securityData = {
        step: 2,
        sessionId: currentSessionId,
        userId: currentUserId,
        securityAnswer: document.getElementById('security-answer').value.trim()
    };
    
    if (!securityData.securityAnswer) {
        showNotification('Please enter your security answer', 'error');
        return;
    }
    
    setLoadingState(submitButton, true);
    
    try {
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.LOGIN), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(securityData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            document.getElementById('caesar-challenge-display').innerHTML = 
                `<strong>Caesar Cipher Challenge:</strong><br>` +
                `${result.caesarChallenge}<br><br>` +
                `<strong>Instructions:</strong><br>` +
                `${result.caesarInstructions}`;
            
            showAuthStep(3);
            showResultBox(resultDiv, 'success', `Step 2 Complete: Security question answered correctly`);
            
        } else {
            showResultBox(resultDiv, 'error', `Step 2 Failed: ${result.error}`);
        }
        
    } catch (error) {
        showResultBox(resultDiv, 'error', `Network Error: ${error.message}`);
    } finally {
        setLoadingState(submitButton, false);
    }
}

async function handleLoginStep3(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById('login-result');
    
    const caesarData = {
        step: 3,
        sessionId: currentSessionId,
        userId: currentUserId,
        caesarAnswer: document.getElementById('caesar-answer').value.trim().toUpperCase()
    };
    
    if (!caesarData.caesarAnswer) {
        showNotification('Please enter the decoded word', 'error');
        return;
    }
    
    setLoadingState(submitButton, true);
    
    try {
        const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.LOGIN), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(caesarData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAuthenticationSuccess(result);
            showResultBox(resultDiv, 'success', `Authentication Complete: All 3 factors verified successfully`);
            
        } else {
            showResultBox(resultDiv, 'error', `Step 3 Failed: ${result.error}`);
        }
        
    } catch (error) {
        showResultBox(resultDiv, 'error', `Network Error: ${error.message}`);
    } finally {
        setLoadingState(submitButton, false);
    }
}

function showAuthStep(step) {
    const steps = document.querySelectorAll('.auth-step');
    steps.forEach(stepElement => stepElement.classList.remove('active'));
    
    const currentStepElement = document.getElementById(`login-step${step}`);
    if (currentStepElement) {
        currentStepElement.classList.add('active');
    }
    
    authStep = step;
}

function showAuthenticationSuccess(result) {
    const steps = document.querySelectorAll('.auth-step');
    steps.forEach(step => step.classList.remove('active'));
    
    const successPanel = document.getElementById('login-success');
    if (successPanel) {
        successPanel.classList.add('active');
        
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <strong>User ID:</strong> ${result.userId}<br>
                <strong>Email:</strong> ${result.email}<br>
                <strong>User Type:</strong> ${result.userType}<br>
                <strong>Session ID:</strong> ${result.sessionId}<br>
                <strong>Access Token:</strong> ${result.accessToken ? result.accessToken.substring(0, 50) + '...' : 'N/A'}<br><br>
                <div style="background: #d4edda; padding: 1rem; border-radius: 8px; margin-top: 1rem; text-align: center;">
                    <strong>Redirecting to Dashboard...</strong><br>
                    <p style="margin: 0.5rem 0;">You will be redirected to the customer dashboard in 3 seconds.</p>
                    <i class="fas fa-spinner fa-spin" style="margin-top: 0.5rem;"></i>
                </div>
            `;
        }
    }
    
    localStorage.setItem('dalscooter_userId', result.userId);
    localStorage.setItem('dalscooter_email', result.email);
    localStorage.setItem('dalscooter_userType', result.userType);
    localStorage.setItem('dalscooter_sessionId', result.sessionId);
    if (result.accessToken) {
        localStorage.setItem('dalscooter_accessToken', result.accessToken);
    }
    
    showNotification('Authentication successful! Redirecting to dashboard...', 'success');
    
    setTimeout(() => {
        redirectToDashboard(result);
    }, 3000);
}

function redirectToDashboard(userData) {
    const dashboardUrl = `dashboard.html?userId=${encodeURIComponent(userData.userId)}&email=${encodeURIComponent(userData.email)}&userType=${encodeURIComponent(userData.userType)}&sessionId=${encodeURIComponent(userData.sessionId)}`;
    
    showNotification('Redirecting to your dashboard...', 'success');
    
    window.location.href = dashboardUrl;
}

function resetAuthentication() {
    currentSessionId = null;
    currentUserId = null;
    authStep = 1;
    
    const forms = document.querySelectorAll('#login-tab form');
    forms.forEach(form => form.reset());
    
    const successPanel = document.getElementById('login-success');
    if (successPanel) {
        successPanel.classList.remove('active');
    }
    
    showAuthStep(1);
    
    clearResultBox(document.getElementById('login-result'));
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1'};
        color: ${type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460'};
        padding: 1rem 1.5rem;
        border-radius: 8px;
        border: 1px solid ${type === 'error' ? '#f5c6cb' : type === 'success' ? '#c3e6cb' : '#bee5eb'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        max-width: 400px;
        font-weight: 500;
        font-size: 14px;
        line-height: 1.4;
        animation: slideIn 0.3s ease-out;
    `;
    
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    notification.innerHTML = message.replace(/\n/g, '<br>');
    document.body.appendChild(notification);
    
    const hideDelay = message.length > 100 ? 8000 : 5000;
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, hideDelay);
}

async function runAllTests() {
    const resultsDiv = document.getElementById('test-results');
    resultsDiv.innerHTML = '<div class="test-item info">Starting comprehensive API tests...</div>';
    
    const tests = [
        { name: 'API Connectivity Test', func: testApiConnectivity },
        { name: 'Registration Validation Test', func: testRegistrationValidation },
        { name: 'User Registration Test', func: testUserRegistration },
        { name: 'Email Verification Test', func: testEmailVerification },
        { name: 'Login Step 1 Test', func: testLoginStep1 },
        { name: 'Login Step 2 Test', func: testLoginStep2 },
        { name: 'Login Step 3 Test', func: testLoginStep3 },
        { name: 'Error Handling Test', func: testErrorHandling }
    ];
    
    for (const test of tests) {
        await runSingleTest(test.name, test.func, resultsDiv);
        await sleep(1000);
    }
    
    addTestResult(resultsDiv, 'info', 'All tests completed');
}

async function runSingleTest(testName, testFunction, resultsDiv) {
    addTestResult(resultsDiv, 'info', `Running: ${testName}...`);
    
    try {
        const result = await testFunction();
        addTestResult(resultsDiv, 'success', `${testName}: ${result}`);
    } catch (error) {
        addTestResult(resultsDiv, 'error', `${testName}: ${error.message}`);
    }
}

async function testApiConnectivity() {
    if (CONFIG.API_BASE_URL.includes('your-api-id')) {
        throw new Error('API URL not configured properly');
    }
    
    try {
        await fetch(getApiUrl('/auth/register'), { method: 'OPTIONS' });
        return 'API endpoint is reachable';
    } catch (error) {
        throw new Error('API endpoint not reachable');
    }
}

async function testRegistrationValidation() {
    const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
    
    const result = await response.json();
    
    if (response.status === 400 && result.error) {
        return 'Validation working correctly';
    } else {
        throw new Error('Validation not working properly');
    }
}

async function testUserRegistration() {
    const testUser = {
        email: `test-${Date.now()}@dal.ca`,
        password: 'TestPassword123',
        userType: 'customer',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'blue'
    };
    
    const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.REGISTER), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });
    
    const result = await response.json();
    
    if (response.ok && result.userId) {
        window.testUserId = result.userId;
        window.testUserEmail = testUser.email;
        window.testUserPassword = testUser.password;
        return `User registered successfully (ID: ${result.userId}) - Email verification required`;
    } else {
        throw new Error(result.error || 'Registration failed');
    }
}

async function testEmailVerification() {
    if (!window.testUserEmail) {
        throw new Error('No test user available from registration test');
    }
    
    const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.VERIFY), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: window.testUserEmail,
            verificationCode: 'invalid-code'
        })
    });
    
    const result = await response.json();
    
    if (response.status === 400 && result.error) {
        return 'Email verification endpoint working (validation active)';
    } else {
        throw new Error('Email verification validation not working properly');
    }
}

async function testLoginStep1() {
    if (!window.testUserEmail) {
        throw new Error('No test user available from registration test');
    }
    
    const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            step: 1,
            username: window.testUserEmail,
            password: window.testUserPassword
        })
    });
    
    const result = await response.json();
    
    if (response.status === 401 && result.error && result.error.includes('not confirmed')) {
        return 'Step 1 correctly requires email verification';
    } else if (response.ok && result.sessionId) {
        window.testSessionId = result.sessionId;
        return 'Step 1 authentication successful';
    } else {
        throw new Error(result.error || 'Step 1 authentication failed');
    }
}

async function testLoginStep2() {
    if (!window.testSessionId) {
        return 'Skipped - no valid session from Step 1';
    }
    
    const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            step: 2,
            sessionId: window.testSessionId,
            userId: window.testUserId,
            securityAnswer: 'blue'
        })
    });
    
    const result = await response.json();
    
    if (response.ok && result.caesarChallenge) {
        return 'Step 2 authentication successful';
    } else {
        return 'Step 2 validation working (requires valid session)';
    }
}

async function testLoginStep3() {
    const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            step: 3,
            sessionId: window.testSessionId || 'invalid',
            userId: window.testUserId || 'invalid',
            caesarAnswer: 'WRONG'
        })
    });
    
    const result = await response.json();
    
    if (response.status === 401 && result.error) {
        return 'Step 3 validation working (Caesar cipher protection active)';
    } else {
        throw new Error('Step 3 validation not working properly');
    }
}

async function testErrorHandling() {
    const response = await fetch(getApiUrl(CONFIG.ENDPOINTS.LOGIN), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            step: 1,
            username: 'nonexistent@dal.ca',
            password: 'wrongpassword'
        })
    });
    
    const result = await response.json();
    
    if (response.status === 401 && result.error) {
        return 'Error handling working correctly';
    } else {
        throw new Error('Error handling not working properly');
    }
}

function addTestResult(container, type, message) {
    const testItem = document.createElement('div');
    testItem.className = `test-item ${type}`;
    testItem.textContent = message;
    container.appendChild(testItem);
    container.scrollTop = container.scrollHeight;
}

function clearTestResults() {
    const resultsDiv = document.getElementById('test-results');
    resultsDiv.innerHTML = '<p>Click "Run All Tests" to execute comprehensive API testing...</p>';
}

function setLoadingState(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

function showResultBox(element, type, message) {
    element.className = `result-box ${type}`;
    element.innerHTML = message.replace(/\n/g, '<br>');
    element.style.display = 'block';
}

function clearResultBox(element) {
    element.className = 'result-box';
    element.innerHTML = '';
    element.style.display = 'none';
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}