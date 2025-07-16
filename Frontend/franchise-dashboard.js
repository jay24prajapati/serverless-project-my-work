let currentUser = {};
let scooterInventory = {
    'ebike': { available: 8, inUse: 4, maintenance: 1, rate: 15 },
    'gyroscooter': { available: 12, inUse: 3, maintenance: 0, rate: 20 },
    'segway': { available: 4, inUse: 1, maintenance: 0, rate: 25 }
};

document.addEventListener('DOMContentLoaded', function() {
    initializeFranchiseDashboard();
});

function initializeFranchiseDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    currentUser = {
        userId: urlParams.get('userId') || localStorage.getItem('dalscooter_userId'),
        email: urlParams.get('email') || localStorage.getItem('dalscooter_email'),
        userType: urlParams.get('userType') || localStorage.getItem('dalscooter_userType'),
        sessionId: urlParams.get('sessionId') || localStorage.getItem('dalscooter_sessionId')
    };
    
    if (!currentUser.userId || !currentUser.email || currentUser.userType !== 'franchise') {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('user-id').value = currentUser.userId;
    document.getElementById('user-email').value = currentUser.email;
    document.getElementById('user-type').value = currentUser.userType;
    document.getElementById('session-id').value = currentUser.sessionId;
    
    document.getElementById('welcome-user').textContent = `Welcome, ${currentUser.email}!`;
    
    updateDashboardStats();
    addFranchiseActivity('Franchise Login', 'Successfully logged in with 3-factor authentication', 'Just now', 'fas fa-user-check');
    
    debugLog('Franchise dashboard initialized for user:', currentUser.userId);
}

function updateDashboardStats() {
    let totalScooters = 0;
    let activeBookings = 0;
    
    Object.values(scooterInventory).forEach(scooter => {
        totalScooters += scooter.available + scooter.inUse + scooter.maintenance;
        activeBookings += scooter.inUse;
    });
    
    document.getElementById('total-scooters').textContent = totalScooters;
    document.getElementById('active-bookings').textContent = activeBookings;
    
    // Calculate today's revenue (mock calculation)
    const todaysRevenue = activeBookings * 60; // Assume average $60 per booking
    document.getElementById('todays-revenue').textContent = `$${todaysRevenue}`;
    
    debugLog('Dashboard stats updated', { totalScooters, activeBookings, todaysRevenue });
}

function manageScooterType(scooterType) {
    const scooter = scooterInventory[scooterType];
    if (!scooter) return;
    
    const actions = [
        `Add new ${scooterType}`,
        `Update pricing (Current: $${scooter.rate}/hour)`,
        `Mark scooters for maintenance`,
        `View detailed analytics`,
        `Update features and specifications`
    ];
    
    showNotification(`Managing ${scooterType.charAt(0).toUpperCase() + scooterType.slice(1)}:\n• ${actions.join('\n• ')}`, 'info');
    
    addFranchiseActivity(
        'Scooter Management', 
        `Accessed management options for ${scooterType}`, 
        'Just now', 
        'fas fa-cog'
    );
    
    debugLog('Managing scooter type:', scooterType);
}

function addNewScooter() {
    const scooterTypes = Object.keys(scooterInventory);
    const randomType = scooterTypes[Math.floor(Math.random() * scooterTypes.length)];
    
    scooterInventory[randomType].available++;
    
    updateDashboardStats();
    
    showNotification(`New ${randomType} added to inventory!\nTotal available: ${scooterInventory[randomType].available}`, 'success');
    
    addFranchiseActivity(
        'Inventory Update', 
        `Added new ${randomType} to inventory`, 
        'Just now', 
        'fas fa-plus'
    );
    
    debugLog('Added new scooter:', randomType);
}

function bulkUpdatePricing() {
    const updates = [];
    
    Object.keys(scooterInventory).forEach(type => {
        const currentRate = scooterInventory[type].rate;
        const newRate = currentRate + Math.floor(Math.random() * 5) - 2; // Random adjustment
        scooterInventory[type].rate = Math.max(10, newRate); // Minimum $10
        
        updates.push(`${type}: $${currentRate} → $${scooterInventory[type].rate}`);
    });
    
    showNotification(`Pricing Updated:\n• ${updates.join('\n• ')}`, 'success');
    
    addFranchiseActivity(
        'Pricing Update', 
        'Bulk pricing update completed across all scooter types', 
        'Just now', 
        'fas fa-tags'
    );
    
    debugLog('Bulk pricing update completed');
}

function generateDiscountCode() {
    const discountPercentage = Math.floor(Math.random() * 20) + 5; // 5-25% discount
    const codeLength = 8;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let discountCode = '';
    
    for (let i = 0; i < codeLength; i++) {
        discountCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    showNotification(`Discount Code Generated!\n\nCode: ${discountCode}\nDiscount: ${discountPercentage}% off\nValid for: 30 days\n\nShare this code with customers!`, 'success');
    
    addFranchiseActivity(
        'Discount Code Created', 
        `Generated ${discountPercentage}% discount code: ${discountCode}`, 
        'Just now', 
        'fas fa-percent'
    );
    
    debugLog('Generated discount code:', { code: discountCode, discount: discountPercentage });
}

function addFranchiseActivity(title, description, time, iconClass) {
    const activityList = document.getElementById('franchise-activity-list');
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item fade-in';
    
    activityItem.innerHTML = `
        <div class="activity-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="activity-content">
            <h4>${title}</h4>
            <p>${description}</p>
            <span class="activity-time">${time}</span>
        </div>
    `;
    
    activityList.insertBefore(activityItem, activityList.firstChild);
    
    const activities = activityList.querySelectorAll('.activity-item');
    if (activities.length > 10) {
        activityList.removeChild(activities[activities.length - 1]);
    }
}

function logout() {
    localStorage.removeItem('dalscooter_userId');
    localStorage.removeItem('dalscooter_email');
    localStorage.removeItem('dalscooter_userType');
    localStorage.removeItem('dalscooter_sessionId');
    
    addFranchiseActivity('Franchise Logout', 'Successfully logged out from franchise dashboard', 'Just now', 'fas fa-sign-out-alt');
    
    showNotification('Logged out successfully', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
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
        white-space: pre-line;
    `;
    
    notification.innerHTML = message.replace(/\n/g, '<br>');
    document.body.appendChild(notification);
    
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
    }, 5000);
}

function debugLog(message, data = null) {
    if (CONFIG.DEBUG) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [Franchise Dashboard] ${message}`, data || '');
    }
}

// Simulate real-time updates
setInterval(() => {
    const now = new Date();
    if (now.getMinutes() % 5 === 0 && now.getSeconds() < 5) {
        // Simulate new booking every 5 minutes
        const scooterTypes = Object.keys(scooterInventory);
        const randomType = scooterTypes[Math.floor(Math.random() * scooterTypes.length)];
        
        if (scooterInventory[randomType].available > 0) {
            scooterInventory[randomType].available--;
            scooterInventory[randomType].inUse++;
            
            updateDashboardStats();
            
            addFranchiseActivity(
                'New Booking Received', 
                `${randomType} booking confirmed - Downtown Halifax`, 
                'Just now', 
                'fas fa-calendar-check'
            );
        }
    }
}, 1000);

// Initialize dashboard on load
window.addEventListener('load', function() {
    debugLog('Franchise dashboard fully loaded');
    updateDashboardStats();
});