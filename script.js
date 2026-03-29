const API_URL = 'https://women-safety-alert-system-in9g.onrender.com/api';

// --- DOM Elements ---
const sosBtn = document.getElementById('sosBtn');
const stopAlarmBtn = document.getElementById('stopAlarmBtn');
const alarmAudio = document.getElementById('alarmAudio');
const loader = document.getElementById('loader');
const statusMessage = document.getElementById('statusMessage');
const locationDetails = document.getElementById('locationDetails');
const latEl = document.getElementById('lat');
const lngEl = document.getElementById('lng');
const mapsLink = document.getElementById('mapsLink');

const contactForm = document.getElementById('contactForm');
const contactName = document.getElementById('contactName');
const contactEmail = document.getElementById('contactEmail');
const contactsList = document.getElementById('contactsList');

const themeToggle = document.getElementById('themeToggle');
const alertCountEl = document.getElementById('alertCount');
const lastAlertTimeEl = document.getElementById('lastAlertTime');
const toastContainer = document.getElementById('toastContainer');

// --- State Variables ---
let contacts = [];

// --- Initialization ---
function init() {
    fetchContacts();
    fetchDashboardStats();

    // Setup Theme
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// --- Theme Toggle ---
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'info');
});

// --- Database Communication (Fetch) ---
async function fetchContacts() {
    try {
        const res = await fetch(`${API_URL}/contacts`);
        if (!res.ok) throw new Error('Failed to load contacts');
        contacts = await res.json();
        renderContacts();
    } catch (err) {
        contactsList.innerHTML = `<p style="color: var(--btn-danger); text-align: center; font-size: 0.9rem;">Backend server not running! Please run 'node server.js'</p>`;
        console.error(err);
    }
}

async function fetchDashboardStats() {
    try {
        const res = await fetch(`${API_URL}/alerts`);
        if (!res.ok) throw new Error('Failed to load alerts');
        const data = await res.json();
        
        alertCountEl.textContent = data.count || 0;
        if (data.lastAlert) {
            const date = new Date(data.lastAlert.timestamp);
            lastAlertTimeEl.textContent = `Last alert: ${date.toLocaleString()}`;
        } else {
            lastAlertTimeEl.textContent = 'No alerts sent yet.';
        }
    } catch (err) {
        lastAlertTimeEl.textContent = 'Server disconnected.';
    }
}

async function logAlertToDatabase(lat, lng, mapUrl, sentCount) {
    try {
        await fetch(`${API_URL}/alerts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude: lat, longitude: lng, map_url: mapUrl, sent_count: sentCount })
        });
        fetchDashboardStats();
    } catch (err) {
        console.error("Failed to log alert to DB", err);
    }
}

// --- Contact Management ---
function renderContacts() {
    contactsList.innerHTML = '';
    
    if (contacts.length === 0) {
        contactsList.innerHTML = '<p style="color: var(--text-muted); text-align: center; font-size: 0.9rem;">Your safety network is empty. Add a trusted contact.</p>';
        return;
    }

    contacts.forEach((contact) => {
        const div = document.createElement('div');
        div.className = 'contact-card';
        div.innerHTML = `
            <div class="contact-info">
                <strong>${contact.name}</strong>
                <span>${contact.email}</span>
            </div>
            <button class="delete-btn" onclick="deleteContact(${contact.id})" title="Remove Contact">
                <i class="fas fa-trash"></i>
            </button>
        `;
        contactsList.appendChild(div);
    });
}

async function addContact(e) {
    e.preventDefault();
    const name = contactName.value.trim();
    const email = contactEmail.value.trim();

    if (name && email) {
        try {
            const res = await fetch(`${API_URL}/contacts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
            });
            if (!res.ok) throw new Error('Server error');
            
            contactName.value = '';
            contactEmail.value = '';
            showToast('Contact secured in your network!', 'success');
            fetchContacts();
        } catch (err) {
            showToast('Failed to connect to database.', 'error');
        }
    }
}

window.deleteContact = async function(id) {
    if (confirm('Are you sure you want to remove this person from your safety network?')) {
        try {
            const res = await fetch(`${API_URL}/contacts/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Server error');
            showToast('Contact removed.', 'info');
            fetchContacts();
        } catch (err) {
            showToast('Failed to remove contact.', 'error');
        }
    }
};

contactForm.addEventListener('submit', addContact);

// --- Audio Handling ---
function playAlarm() {
    alarmAudio.play().catch(error => {
        console.warn("Audio play blocked by browser. Using fallback beep.");
        fallbackBeep();
    });
    stopAlarmBtn.classList.remove('hidden');
}

function stopAlarm() {
    alarmAudio.pause();
    alarmAudio.currentTime = 0;
    stopAlarmBtn.classList.add('hidden');
    showToast('Alarm stopped.', 'info');
}

stopAlarmBtn.addEventListener('click', stopAlarm);

let audioCtx;
function fallbackBeep() {
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); 
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.5); 
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    
    setTimeout(() => {
        oscillator.stop();
        if(!stopAlarmBtn.classList.contains('hidden')){
            fallbackBeep(); 
        }
    }, 1000);
}

// --- Geolocation & Alert Logic ---
sosBtn.addEventListener('click', triggerEmergency);

function triggerEmergency() {
    if (contacts.length === 0) {
        showToast('WARNING: Safety network is empty!', 'error');
        if (!confirm('You have no emergency contacts saved. Generate local alert anyway?')) {
            return;
        }
    }

    playAlarm();

    statusMessage.textContent = '';
    statusMessage.className = 'status-msg';
    locationDetails.classList.add('hidden');
    loader.classList.remove('hidden');
    
    if (!navigator.geolocation) {
        handleError('Geolocation not supported');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            processLocation(lat, lng);
        },
        error => {
            let errorMsg = 'Unknown location error';
            switch (error.code) {
                case error.PERMISSION_DENIED: errorMsg = "Location access denied by user"; break;
                case error.POSITION_UNAVAILABLE: errorMsg = "Location information is unavailable"; break;
                case error.TIMEOUT: errorMsg = "The request to get user location timed out"; break;
            }
            handleError(errorMsg);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
}

function processLocation(lat, lng) {
    loader.classList.add('hidden');
    const mapUrl = `https://maps.google.com/?q=${lat},${lng}`;
    
    latEl.textContent = lat.toFixed(6);
    lngEl.textContent = lng.toFixed(6);
    mapsLink.href = mapUrl;
    locationDetails.classList.remove('hidden');

    const message = `🚨 WOMEN'S SAFETY EMERGENCY ALERT!\n\nI am in danger and require immediate assistance. Please check my live location below and send help.\n\nMy Location: \n${mapUrl}`;

    sendAlert(message, mapUrl, lat, lng);
}

function handleError(msg) {
    loader.classList.add('hidden');
    statusMessage.textContent = '❌ ' + msg;
    statusMessage.className = 'status-msg status-error';
    showToast(msg, 'error');
}

// --- Send Alert Functionality ---
function sendAlert(messageText, mapUrl, lat, lng) {
    let sentCount = 0;
    let errorCount = 0;
    
    if (contacts.length > 0) {
        showToast(`Contacting your sisterhood network (${contacts.length} people)...`, 'info');

        contacts.forEach(contact => {
            emailjs.send("service_t9l4ptm", "template_yc9vwmi", {
                message: messageText,
                to_email: contact.email
            }).then(() => {
                sentCount++;
                checkFinish();
            }).catch(error => {
                console.error("Failed to send email to", contact.email, error);
                errorCount++;
                checkFinish();
            });
        });

        function checkFinish() {
            if (sentCount + errorCount === contacts.length) {
                finishAlertFlow(sentCount, lat, lng, mapUrl);
            }
        }
    } else {
        finishAlertFlow(0, lat, lng, mapUrl);
    }
}

function finishAlertFlow(sentCount, lat, lng, mapUrl) {
    let successMsg = `✅ SOS Triggered.`;
    if (sentCount > 0) {
        successMsg += ` Successfully alerted ${sentCount} members of your network.`;
    } else {
        successMsg += ` (Local only, emails failed or none configured).`;
    }

    statusMessage.textContent = successMsg;
    statusMessage.className = 'status-msg status-success';
    showToast('SOS Transmission Complete', 'success');

    // Save alert to database
    logAlertToDatabase(lat, lng, mapUrl, sentCount);
}

// --- Toast Notifications ---
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const icon = document.createElement('i');
    switch (type) {
        case 'success': icon.className = 'fas fa-shield-check'; icon.style.color = '#2ecc71'; break;
        case 'error': icon.className = 'fas fa-triangle-exclamation'; icon.style.color = '#ff6b81'; break;
        case 'info': icon.className = 'fas fa-info-circle'; icon.style.color = '#9b59b6'; break;
        default: icon.className = 'fas fa-bell';
    }
    
    const textNode = document.createElement('span');
    textNode.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(textNode);
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            if (toastContainer.contains(toast)) toastContainer.removeChild(toast);
        }, 300);
    }, 4000);
}

init();
