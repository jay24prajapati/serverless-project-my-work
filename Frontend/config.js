const CONFIG = {
    API_BASE_URL: 'https://500xl4gx7l.execute-api.us-east-1.amazonaws.com/dev',
    
    ENDPOINTS: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        VERIFY: '/auth/verify',
        RESEND_VERIFICATION: '/auth/resend-verification',
        SECURITY_QUESTION: '/auth/security-question',
        BOOKING: '/booking/create'
    },
    
    SNS_TOPICS: {
        REGISTRATION: 'arn:aws:sns:region:account:DALScooter-Registration-Notifications-env',
        LOGIN: 'arn:aws:sns:region:account:DALScooter-Login-Notifications-env',
        BOOKING: 'arn:aws:sns:region:account:DALScooter-Booking-Notifications-env',
        EMAIL: 'arn:aws:sns:region:account:DALScooter-Email-Notifications-env',
        SYSTEM_ALERTS: 'arn:aws:sns:region:account:DALScooter-System-Alerts-env'
    },
    
    DASHBOARD: {
        SCOOTER_TYPES: {
            'ebike': {
                name: 'eBike',
                description: 'Electric bicycle with pedal assist',
                price: 15,
                icon: 'fas fa-bicycle'
            },
            'gyroscooter': {
                name: 'Gyroscooter', 
                description: 'Self-balancing electric scooter',
                price: 20,
                icon: 'fas fa-skating'
            },
            'segway': {
                name: 'Segway',
                description: 'Premium personal transporter', 
                price: 25,
                icon: 'fas fa-wheelchair'
            }
        },
        PICKUP_LOCATIONS: [
            'Downtown Halifax',
            'Dalhousie University',
            'Halifax Waterfront',
            'Spring Garden Road',
            'Halifax Shopping Centre'
        ],
        MAX_BOOKING_DAYS: 7,
        MIN_BOOKING_MINUTES: 30
    },
    
    TIMEOUT: 30000,
    DEBUG: false,
    
    FEATURES: {
        EMAIL_VERIFICATION: true,
        MULTI_FACTOR_AUTH: true,
        CAESAR_CIPHER: true,
        NOTIFICATIONS: true,
        COMPREHENSIVE_TESTING: true,
        DASHBOARD: true,
        BOOKING_SYSTEM: true,
        REAL_TIME_NOTIFICATIONS: true
    }
};

function getApiUrl(endpoint) {
    return CONFIG.API_BASE_URL + endpoint;
}

function debugLog(message, data = null) {
    if (CONFIG.DEBUG) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [DALScooter] ${message}`, data || '');
    }
}

function updateApiUrl(newUrl) {
    CONFIG.API_BASE_URL = newUrl.replace(/\/$/, '');
    debugLog('API URL updated to:', CONFIG.API_BASE_URL);
}

function getScooterConfig(scooterType) {
    return CONFIG.DASHBOARD.SCOOTER_TYPES[scooterType] || null;
}

function validateBookingTime(startTime) {
    const now = new Date();
    const bookingTime = new Date(startTime);
    const minTime = new Date(now.getTime() + CONFIG.DASHBOARD.MIN_BOOKING_MINUTES * 60000);
    const maxTime = new Date(now.getTime() + CONFIG.DASHBOARD.MAX_BOOKING_DAYS * 24 * 60 * 60 * 1000);
    
    if (bookingTime < minTime) {
        return { valid: false, error: `Booking must be at least ${CONFIG.DASHBOARD.MIN_BOOKING_MINUTES} minutes in the future` };
    }
    
    if (bookingTime > maxTime) {
        return { valid: false, error: `Booking cannot be more than ${CONFIG.DASHBOARD.MAX_BOOKING_DAYS} days in the future` };
    }
    
    return { valid: true };
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

function validateSystemConfiguration() {
    debugLog('Validating system configuration...');
    
    const issues = [];
    
    if (CONFIG.API_BASE_URL.includes('your-api-id')) {
        issues.push('API URL not configured');
    }
    
    const requiredEndpoints = ['REGISTER', 'LOGIN', 'VERIFY', 'RESEND_VERIFICATION'];
    requiredEndpoints.forEach(endpoint => {
        if (!CONFIG.ENDPOINTS[endpoint]) {
            issues.push(`Missing endpoint: ${endpoint}`);
        }
    });
    
    const requiredFeatures = ['EMAIL_VERIFICATION', 'MULTI_FACTOR_AUTH'];
    requiredFeatures.forEach(feature => {
        if (!CONFIG.FEATURES[feature]) {
            issues.push(`Feature disabled: ${feature}`);
        }
    });
    
    if (CONFIG.FEATURES.DASHBOARD) {
        if (!CONFIG.DASHBOARD.SCOOTER_TYPES || Object.keys(CONFIG.DASHBOARD.SCOOTER_TYPES).length === 0) {
            issues.push('Dashboard enabled but no scooter types configured');
        }
        
        if (!CONFIG.DASHBOARD.PICKUP_LOCATIONS || CONFIG.DASHBOARD.PICKUP_LOCATIONS.length === 0) {
            issues.push('Dashboard enabled but no pickup locations configured');
        }
    }
    
    if (issues.length > 0) {
        console.warn('Configuration Issues:', issues);
        return false;
    }
    
    debugLog('System configuration valid');
    return true;
}

function updateSnsTopicArns(topicArns) {
    debugLog('Updating SNS Topic ARNs...', topicArns);
    
    Object.keys(topicArns).forEach(topicType => {
        if (CONFIG.SNS_TOPICS[topicType.toUpperCase()]) {
            CONFIG.SNS_TOPICS[topicType.toUpperCase()] = topicArns[topicType];
        }
    });
    
    debugLog('Updated SNS Topics:', CONFIG.SNS_TOPICS);
}

document.addEventListener('DOMContentLoaded', function() {
    debugLog('DALScooter System Initialized');
    debugLog('Current API URL:', CONFIG.API_BASE_URL);
    debugLog('Available Endpoints:', Object.keys(CONFIG.ENDPOINTS));
    debugLog('Enabled Features:', Object.keys(CONFIG.FEATURES).filter(f => CONFIG.FEATURES[f]));
    debugLog('Dashboard Config:', CONFIG.DASHBOARD);
    
    const isValid = validateSystemConfiguration();
    
    if (!isValid) {
        console.warn('System configuration needs attention');
    }
    
    if (CONFIG.SNS_TOPICS.REGISTRATION.includes('account')) {
        console.warn('SNS Topic ARNs are using placeholder values. Update CONFIG.SNS_TOPICS with actual ARNs.');
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}