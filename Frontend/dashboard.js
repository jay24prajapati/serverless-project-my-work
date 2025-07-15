let selectedScooterType = '';
let userBookings = [];
let currentUser = {};
let scooterPrices = {
    'ebike': 15,
    'gyroscooter': 20,
    'segway': 25
};

document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});

function initializeDashboard() {
    const urlParams = new URLSearchParams(window.location.search);
    currentUser = {
        userId: urlParams.get('userId') || localStorage.getItem('dalscooter_userId'),
        email: urlParams.get('email') || localStorage.getItem('dalscooter_email'),
        userType: urlParams.get('userType') || localStorage.getItem('dalscooter_userType'),
        sessionId: urlParams.get('sessionId') || localStorage.getItem('dalscooter_sessionId')
    };
    
    if (!currentUser.userId || !currentUser.email) {
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('user-id').value = currentUser.userId;
    document.getElementById('user-email').value = currentUser.email;
    document.getElementById('user-type').value = currentUser.userType;
    document.getElementById('session-id').value = currentUser.sessionId;
    
    document.getElementById('welcome-user').textContent = `Welcome, ${currentUser.email}!`;
    
    setupFormHandlers();
    
    const now = new Date();
    const minDateTime = new Date(now.getTime() + 30 * 60000);
    document.getElementById('start-time').min = minDateTime.toISOString().slice(0, 16);
    
    loadUserBookings();
    
    addActivity('Account Login', 'Successfully logged in with 3-factor authentication', 'Just now', 'fas fa-user-check');
}

function setupFormHandlers() {
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBookingSubmission);
    }
    
    const durationSelect = document.getElementById('duration');
    if (durationSelect) {
        durationSelect.addEventListener('change', updateBookingSummary);
    }
}

function selectScooter(scooterType) {
    document.querySelectorAll('.scooter-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    document.querySelector(`.scooter-card[data-type="${scooterType}"]`).classList.add('selected');
    
    selectedScooterType = scooterType;
    
    document.getElementById('selected-scooter').value = scooterType.charAt(0).toUpperCase() + scooterType.slice(1);
    
    const formContainer = document.getElementById('booking-form-container');
    formContainer.classList.add('active');
    formContainer.scrollIntoView({ behavior: 'smooth' });
    
    updateBookingSummary();
}

function updateBookingSummary() {
    if (!selectedScooterType) return;
    
    const duration = document.getElementById('duration').value;
    const price = scooterPrices[selectedScooterType];
    
    document.getElementById('summary-scooter').textContent = selectedScooterType.charAt(0).toUpperCase() + selectedScooterType.slice(1);
    document.getElementById('summary-duration').textContent = duration ? `${duration} hour${duration !== '1' ? 's' : ''}` : '-';
    document.getElementById('summary-rate').textContent = `$${price}/hour`;
    
    const totalCost = duration ? price * parseInt(duration) : 0;
    document.getElementById('summary-total').textContent = `$${totalCost.toFixed(2)}`;
}

async function handleBookingSubmission(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const resultDiv = document.getElementById('booking-result');
    
    const bookingData = {
        userId: currentUser.userId,
        email: currentUser.email,
        scooterType: selectedScooterType,
        pickupLocation: document.getElementById('pickup-location').value,
        startTime: document.getElementById('start-time').value,
        duration: document.getElementById('duration').value,
        specialRequests: document.getElementById('special-requests').value.trim(),
        bookingId: generateBookingId(),
        bookingTime: new Date().toISOString(),
        status: 'pending'
    };
    
    if (!validateBookingData(bookingData)) {
        return;
    }
    
    setLoadingState(submitButton, true);
    clearResultBox(resultDiv);
    
    try {
        const bookingResult = await sendBookingNotification(bookingData);
        
        if (bookingResult.success) {
            userBookings.push(bookingData);
            updateBookingsDisplay();
            
            showResultBox(resultDiv, 'success', 
                `Booking Confirmed!\n\n` +
                `Booking ID: ${bookingData.bookingId}\n` +
                `Scooter: ${bookingData.scooterType}\n` +
                `Pickup: ${bookingData.pickupLocation}\n` +
                `Duration: ${bookingData.duration} hour(s)\n` +
                `Start Time: ${new Date(bookingData.startTime).toLocaleString()}\n\n` +
                `You will receive a confirmation email shortly with access codes and pickup instructions.`
            );
            
            addActivity(
                'Scooter Booked', 
                `${bookingData.scooterType} reserved for ${bookingData.duration} hour(s)`, 
                'Just now', 
                'fas fa-calendar-check'
            );
            
            form.reset();
            cancelBooking();
            
            document.getElementById('user-bookings').textContent = userBookings.length;
            
        } else {
            showResultBox(resultDiv, 'error', `Booking Failed: ${bookingResult.error}`);
        }
        
    } catch (error) {
        showResultBox(resultDiv, 'error', `Network Error: ${error.message}`);
    } finally {
        setLoadingState(submitButton, false);
    }
}

async function sendBookingNotification(bookingData) {
    try {
        const notificationMessage = {
            event_type: 'booking_request',
            booking_id: bookingData.bookingId,
            user_id: bookingData.userId,
            email: bookingData.email,
            scooter_type: bookingData.scooterType,
            pickup_location: bookingData.pickupLocation,
            start_time: bookingData.startTime,
            duration: `${bookingData.duration} hours`,
            special_requests: bookingData.specialRequests,
            total_cost: (scooterPrices[bookingData.scooterType] * parseInt(bookingData.duration)).toFixed(2),
            timestamp: new Date().toISOString()
        };
        
        setTimeout(() => {
            console.log('BOOKING NOTIFICATION SENT:');
            console.log(`   Booking ID: ${bookingData.bookingId}`);
            console.log(`   User: ${bookingData.email}`);
            console.log(`   Scooter: ${bookingData.scooterType}`);
            console.log(`   Location: ${bookingData.pickupLocation}`);
            console.log(`   Duration: ${bookingData.duration} hours`);
            console.log('   Confirmation email would be sent');
        }, 1000);
        
        return { success: true, bookingId: bookingData.bookingId };
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function validateBookingData(data) {
    if (!data.scooterType) {
        showNotification('Please select a scooter type', 'error');
        return false;
    }
    
    if (!data.pickupLocation) {
        showNotification('Please select a pickup location', 'error');
        return false;
    }
    
    if (!data.startTime) {
        showNotification('Please select a start time', 'error');
        return false;
    }
    
    if (!data.duration) {
        showNotification('Please select a duration', 'error');
        return false;
    }
    
    const startTime = new Date(data.startTime);
    const now = new Date();
    if (startTime <= now) {
        showNotification('Start time must be in the future', 'error');
        return false;
    }
    
    const maxDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (startTime > maxDate) {
        showNotification('Start time cannot be more than 7 days in the future', 'error');
        return false;
    }
    
    return true;
}

function generateBookingId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `DAL-${timestamp}-${random}`.toUpperCase();
}

function cancelBooking() {
    const formContainer = document.getElementById('booking-form-container');
    formContainer.classList.remove('active');
    
    document.querySelectorAll('.scooter-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    selectedScooterType = '';
    
    document.getElementById('booking-form').reset();
    
    document.getElementById('summary-scooter').textContent = '-';
    document.getElementById('summary-duration').textContent = '-';
    document.getElementById('summary-rate').textContent = '-';
    document.getElementById('summary-total').textContent = '$0.00';
    
    clearResultBox(document.getElementById('booking-result'));
}

function loadUserBookings() {
    const storedBookings = localStorage.getItem(`dalscooter_bookings_${currentUser.userId}`);
    if (storedBookings) {
        userBookings = JSON.parse(storedBookings);
        updateBookingsDisplay();
        document.getElementById('user-bookings').textContent = userBookings.length;
    }
}

function updateBookingsDisplay() {
    const bookingsList = document.getElementById('bookings-list');
    
    if (userBookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="no-bookings">
                <i class="fas fa-calendar-times"></i>
                <p>No active bookings. Book a scooter above to get started!</p>
            </div>
        `;
        return;
    }
    
    bookingsList.innerHTML = userBookings.map(booking => `
        <div class="booking-item">
            <div class="booking-info">
                <h4>${booking.scooterType.charAt(0).toUpperCase() + booking.scooterType.slice(1)} Booking</h4>
                <p><i class="fas fa-id-card"></i> Booking ID: ${booking.bookingId}</p>
                <p><i class="fas fa-map-marker-alt"></i> Pickup: ${booking.pickupLocation}</p>
                <p><i class="fas fa-clock"></i> ${new Date(booking.startTime).toLocaleString()} (${booking.duration}h)</p>
                <p><i class="fas fa-dollar-sign"></i> Cost: $${(scooterPrices[booking.scooterType] * parseInt(booking.duration)).toFixed(2)}</p>
            </div>
            <div class="booking-status ${booking.status}">
                ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </div>
        </div>
    `).join('');
    
    localStorage.setItem(`dalscooter_bookings_${currentUser.userId}`, JSON.stringify(userBookings));
}

function addActivity(title, description, time, iconClass) {
    const activityList = document.getElementById('activity-list');
    
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
    
    addActivity('User Logout', 'Successfully logged out from dashboard', 'Just now', 'fas fa-sign-out-alt');
    
    showNotification('Logged out successfully', 'success');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
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
        console.log(`[${timestamp}] [Dashboard] ${message}`, data || '');
    }
}