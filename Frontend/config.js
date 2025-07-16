const CONFIG = {
    API_BASE_URL: 'https://56vkl0dwf4.execute-api.us-east-1.amazonaws.com/dev',
    
    ENDPOINTS: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        VERIFY: '/auth/verify',
        RESEND_VERIFICATION: '/auth/resend-verification',
        SECURITY_QUESTION: '/auth/security-question',
        BOOKING: '/booking/create'
    },
    
    SNS_TOPICS: {
        REGISTRATION: 'arn:aws:sns:us-east-1:601148044385:DALScooter-Registration-Notifications-dev',
        LOGIN: 'arn:aws:sns:us-east-1:601148044385:DALScooter-Login-Notifications-dev',
        BOOKING: 'arn:aws:sns:us-east-1:601148044385:DALScooter-Booking-Notifications-dev',
        EMAIL: 'arn:aws:sns:us-east-1:601148044385:DALScooter-Email-Notifications-dev',
        SYSTEM_ALERTS: 'arn:aws:sns:us-east-1:601148044385:DALScooter-System-Alerts-dev'
    },
    
    SQS_QUEUES: {
        REGISTRATION_NOTIFICATIONS: 'arn:aws:sqs:us-east-1:601148044385:DALScooter-Registration-Notifications-Queue-dev',
        LOGIN_NOTIFICATIONS: 'arn:aws:sqs:us-east-1:601148044385:DALScooter-Login-Notifications-Queue-dev',
        BOOKING_NOTIFICATIONS: 'arn:aws:sqs:us-east-1:601148044385:DALScooter-Booking-Notifications-Queue-dev'
    },
    
    NOTIFICATION_SETTINGS: {
        SENDER_EMAIL: 'noreply@dalscooter.com',
        REGISTRATION_ENABLED: true,
        LOGIN_ENABLED: true,
        BOOKING_ENABLED: true,
        EMAIL_TEMPLATES: {
            REGISTRATION: {
                SUBJECT: 'Welcome to DALScooter - Registration Successful!',
                TEMPLATE_TYPE: 'welcome'
            },
            LOGIN: {
                SUBJECT: 'DALScooter - Successful Login Alert',
                TEMPLATE_TYPE: 'security'
            },
            BOOKING_CONFIRMATION: {
                SUBJECT: 'DALScooter - Booking Confirmed',
                TEMPLATE_TYPE: 'booking'
            },
            BOOKING_FAILURE: {
                SUBJECT: 'DALScooter - Booking Failed',
                TEMPLATE_TYPE: 'booking_error'
            }
        }
    },
    
    DASHBOARD: {
        SCOOTER_TYPES: {
            'ebike': {
                name: 'eBike',
                description: 'Electric bicycle with pedal assist',
                price: 15,
                icon: 'fas fa-bicycle',
                features: ['Long Battery', 'Eco-Friendly']
            },
            'gyroscooter': {
                name: 'Gyroscooter', 
                description: 'Self-balancing electric scooter',
                price: 20,
                icon: 'fas fa-skating',
                features: ['Self-Balancing', 'Fast Speed']
            },
            'segway': {
                name: 'Segway',
                description: 'Premium personal transporter', 
                price: 25,
                icon: 'fas fa-wheelchair',
                features: ['Premium', 'Extra Safe']
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
        EMAIL_NOTIFICATIONS: true,
        LOGIN_NOTIFICATIONS: true,
        REGISTRATION_NOTIFICATIONS: true,
        COMPREHENSIVE_TESTING: true,
        DASHBOARD: true,
        BOOKING_SYSTEM: true,
        REAL_TIME_NOTIFICATIONS: true,
        NOTIFICATION_LOGGING: true,
        DEAD_LETTER_QUEUE: true,
        FEEDBACK_SYSTEM: true,
        SEPARATE_DASHBOARDS: true
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

function getNotificationSettings(notificationType) {
    return CONFIG.NOTIFICATION_SETTINGS.EMAIL_TEMPLATES[notificationType.toUpperCase()] || null;
}

function isNotificationEnabled(notificationType) {
    const featureKey = `${notificationType.toUpperCase()}_NOTIFICATIONS`;
    return CONFIG.FEATURES[featureKey] === true;
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
    
    const requiredFeatures = ['EMAIL_VERIFICATION', 'MULTI_FACTOR_AUTH', 'NOTIFICATIONS'];
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
    
    if (CONFIG.FEATURES.NOTIFICATIONS) {
        if (!CONFIG.NOTIFICATION_SETTINGS.SENDER_EMAIL) {
            issues.push('Notifications enabled but sender email not configured');
        }
        
        if (CONFIG.NOTIFICATION_SETTINGS.SENDER_EMAIL === 'noreply@dalscooter.com') {
            debugLog('Using default sender email - update for production use');
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

function updateSqsQueueArns(queueArns) {
    debugLog('Updating SQS Queue ARNs...', queueArns);
    
    Object.keys(queueArns).forEach(queueType => {
        if (CONFIG.SQS_QUEUES[queueType.toUpperCase()]) {
            CONFIG.SQS_QUEUES[queueType.toUpperCase()] = queueArns[queueType];
        }
    });
    
    debugLog('Updated SQS Queues:', CONFIG.SQS_QUEUES);
}

function logNotificationEvent(eventType, userId, email, status, details = {}) {
    if (CONFIG.FEATURES.NOTIFICATION_LOGGING) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            eventType: eventType,
            userId: userId,
            email: email,
            status: status,
            details: details,
            browser: navigator.userAgent,
            url: window.location.href
        };
        
        debugLog(`Notification Event [${eventType}]:`, logEntry);
        
        // Store in localStorage for debugging (in real implementation, send to server)
        const logs = JSON.parse(localStorage.getItem('dalscooter_notification_logs') || '[]');
        logs.push(logEntry);
        
        // Keep only last 100 logs
        if (logs.length > 100) {
            logs.splice(0, logs.length - 100);
        }
        
        localStorage.setItem('dalscooter_notification_logs', JSON.stringify(logs));
    }
}

function getDashboardUrl(userType) {
    return userType === 'franchise' ? 'franchise-dashboard.html' : 'dashboard.html';
}

function redirectToCorrectDashboard(userData) {
    const dashboardFile = getDashboardUrl(userData.userType);
    const dashboardUrl = `${dashboardFile}?userId=${encodeURIComponent(userData.userId)}&email=${encodeURIComponent(userData.email)}&userType=${encodeURIComponent(userData.userType)}&sessionId=${encodeURIComponent(userData.sessionId)}`;
    window.location.href = dashboardUrl;
}

document.addEventListener('DOMContentLoaded', function() {
    debugLog('DALScooter System Initialized');
    debugLog('Current API URL:', CONFIG.API_BASE_URL);
    debugLog('Available Endpoints:', Object.keys(CONFIG.ENDPOINTS));
    debugLog('Enabled Features:', Object.keys(CONFIG.FEATURES).filter(f => CONFIG.FEATURES[f]));
    debugLog('Dashboard Config:', CONFIG.DASHBOARD);
    debugLog('Notification Settings:', CONFIG.NOTIFICATION_SETTINGS);
    
    const isValid = validateSystemConfiguration();
    
    if (!isValid) {
        console.warn('System configuration needs attention');
    }
    
    if (CONFIG.FEATURES.NOTIFICATIONS) {
        debugLog('Email notification system enabled');
        debugLog('Supported notification types:', Object.keys(CONFIG.NOTIFICATION_SETTINGS.EMAIL_TEMPLATES));
    }
    
    if (CONFIG.FEATURES.SEPARATE_DASHBOARDS) {
        debugLog('Separate dashboard routing enabled for customers and franchise operators');
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}