// ============================================================
// NavDrishti Smartwatch App - Main Logic
// ============================================================
// Simulates a Wear OS watch interface for children.
// Loads routes from the backend, shows one step at a time.
// Design: NO reading required, large icons, voice-first.
// ============================================================

const API_BASE = window.location.origin;
const watchScreen = document.getElementById('watchScreen');
const childIdDisplay = document.getElementById('childIdDisplay');
const statusDisplay = document.getElementById('statusDisplay');

// ---- State ----
let childId = null;
let childProfile = null; // { name, avatar, age, parent_name, parent_phone, address }
let routes = [];
let currentRoute = null;
let currentStep = 0;
let currentPosition = null; // { latitude, longitude }

const DESTINATION_ICONS = [
    { icon: '🏫', label: 'School', colorClass: 'school' },
    { icon: '🏠', label: 'Home',   colorClass: 'home' },
    { icon: '🚌', label: 'Bus Stop', colorClass: 'bus' },
    { icon: '🌳', label: 'Park',   colorClass: 'park' },
];

// ---- Initialize ----
function init() {
    const params = new URLSearchParams(window.location.search);
    childId = params.get('child') || '1';
    childIdDisplay.textContent = `Child #${childId}`;

    loadProfile();
    loadRoutes();
    startLocationTracking();
}

// ---- Load Child Profile ----
async function loadProfile() {
    try {
        const res = await fetch(`${API_BASE}/api/public/child/${childId}`);
        if (res.ok) {
            const data = await res.json();
            childProfile = data.child;
            // Update display with child name
            if (childProfile && childProfile.name) {
                childIdDisplay.textContent = `${childProfile.avatar || '👦'} ${childProfile.name}`;
            }
        }
    } catch (err) {
        console.log('Could not load profile (demo mode)');
    }
}

// ---- Load Routes from Backend ----
async function loadRoutes() {
    statusDisplay.textContent = 'Loading routes...';
    try {
        const res = await fetch(`${API_BASE}/api/public/routes/${childId}`);
        const data = await res.json();
        routes = data.routes || [];

        if (routes.length === 0) {
            showNoRoutes();
            statusDisplay.textContent = 'No routes assigned';
        } else {
            showHomeScreen();
            statusDisplay.textContent = `${routes.length} route(s) loaded`;
        }
    } catch (err) {
        routes = getDemoRoutes();
        showHomeScreen();
        statusDisplay.textContent = 'Demo mode';
    }
}

// ---- Demo Routes ----
function getDemoRoutes() {
    return [
        {
            id: 'demo-1', route_name: 'School',
            waypoints: [
                { step_number: 1, instruction_text: 'Walk to the gate', image_url: null, voice_url: null, latitude: 28.614, longitude: 77.209 },
                { step_number: 2, instruction_text: 'Turn left at the big tree', image_url: null, voice_url: null, latitude: 28.615, longitude: 77.210 },
                { step_number: 3, instruction_text: 'Cross the road carefully', image_url: null, voice_url: null, latitude: 28.616, longitude: 77.211 },
                { step_number: 4, instruction_text: 'You reached school!', image_url: null, voice_url: null, latitude: 28.617, longitude: 77.212 },
            ]
        },
        {
            id: 'demo-2', route_name: 'Home',
            waypoints: [
                { step_number: 1, instruction_text: 'Walk out of school gate', image_url: null, voice_url: null, latitude: 28.617, longitude: 77.212 },
                { step_number: 2, instruction_text: 'Turn right at the shop', image_url: null, voice_url: null, latitude: 28.616, longitude: 77.211 },
                { step_number: 3, instruction_text: 'You are home!', image_url: null, voice_url: null, latitude: 28.614, longitude: 77.209 },
            ]
        },
    ];
}

// ============================================================
// SCREEN: Home
// ============================================================
function showHomeScreen() {
    let buttonsHtml = '';
    routes.forEach((route, i) => {
        const dest = DESTINATION_ICONS[i % DESTINATION_ICONS.length];
        buttonsHtml += `
      <button class="dest-btn ${dest.colorClass}" onclick="startNavigation(${i})">
        <span class="dest-icon">${dest.icon}</span>
        ${route.route_name || dest.label}
      </button>
    `;
    });

    // Always show SOS
    buttonsHtml += `
      <button class="dest-btn" style="background: linear-gradient(135deg, #ef4444, #b91c1c);" onclick="showSOS()">
        <span class="dest-icon">🆘</span>
        HELP
      </button>
    `;

    const firstName = childProfile?.name ? childProfile.name.split(' ')[0] : 'There';

    watchScreen.innerHTML = `
    <div class="home-screen">
      <div class="home-title">Hi ${firstName}! 👋<br><span style="font-size:14px;opacity:0.7">Where to?</span></div>
      <div class="destination-grid">
        ${buttonsHtml}
      </div>
      <button class="profile-btn" onclick="showProfile()" title="My Profile">
        👤
      </button>
    </div>
  `;
}

// ============================================================
// SCREEN: Profile
// ============================================================
function showProfile() {
    const p = childProfile;
    const name      = p?.name         || 'Child';
    const avatar    = p?.avatar        || '👦';
    const age       = p?.age           ? `${p.age} years old` : '';
    const parentName= p?.parent_name   || '—';
    const phone     = p?.parent_phone  || '—';
    const address   = p?.address       || '—';
    const notes     = p?.medical_notes || '';

    const phoneLink = p?.parent_phone
        ? `<a href="tel:${p.parent_phone}" style="color:#60a5fa;">${p.parent_phone}</a>`
        : '—';

    watchScreen.innerHTML = `
    <div class="profile-screen">
      <div class="profile-avatar">${avatar}</div>
      <div class="profile-name">${name}</div>
      ${age ? `<div class="profile-age">${age}</div>` : ''}

      <div class="profile-card">
        <div class="profile-row">
          <span class="profile-label">👨‍👩‍👧 Parent</span>
          <span class="profile-value">${parentName}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">📞 Phone</span>
          <span class="profile-value">${phoneLink}</span>
        </div>
        <div class="profile-row">
          <span class="profile-label">🏠 Home</span>
          <span class="profile-value">${address}</span>
        </div>
        ${notes ? `
        <div class="profile-row">
          <span class="profile-label">🏥 Notes</span>
          <span class="profile-value">${notes}</span>
        </div>` : ''}
      </div>

      ${p?.parent_phone ? `
      <a href="tel:${p.parent_phone}" class="call-btn">📞 Call Parent</a>
      ` : ''}

      <button class="sos-cancel-btn" onclick="showHomeScreen()" style="margin-top:10px;">← Back</button>
    </div>
  `;
}

// ============================================================
// SCREEN: Navigation
// ============================================================
function startNavigation(routeIndex) {
    currentRoute = routes[routeIndex];
    currentStep = 0;
    showNavigationStep();
    sendNotification('navigation_start', `Started navigating to ${currentRoute.route_name}`);
}

function showNavigationStep() {
    if (!currentRoute || !currentRoute.waypoints) return;

    const waypoints = currentRoute.waypoints;
    const wp = waypoints[currentStep];
    if (!wp) { showComplete(); return; }

    let imageHtml = wp.image_url
        ? `<img src="${wp.image_url}" alt="Step ${currentStep + 1}">`
        : getInstructionEmoji(wp.instruction_text);

    let dotsHtml = '';
    waypoints.forEach((_, i) => {
        let cls = 'progress-dot';
        if (i < currentStep) cls += ' completed';
        if (i === currentStep) cls += ' current';
        dotsHtml += `<div class="${cls}"></div>`;
    });

    watchScreen.innerHTML = `
    <div class="nav-screen">
      <div class="nav-step-indicator">STEP ${currentStep + 1} of ${waypoints.length}</div>
      <div class="nav-image">${imageHtml}</div>
      <div class="nav-instruction">${wp.instruction_text || 'Keep going!'}</div>
      <button class="nav-voice-btn" onclick="playVoice()" id="voiceBtn" title="Play voice">🔊</button>
      <div class="progress-dots">${dotsHtml}</div>
      <button class="cancel-btn" onclick="cancelNavigation()" title="Cancel">✕</button>
    </div>
  `;

    if (wp.voice_url) {
        setTimeout(() => playVoice(), 500);
    } else if (wp.instruction_text) {
        setTimeout(() => speakText(wp.instruction_text), 500);
    }
}

// ============================================================
// Voice Playback
// ============================================================
let currentAudio = null;

function playVoice() {
    const wp = currentRoute?.waypoints[currentStep];
    if (!wp) return;
    const btn = document.getElementById('voiceBtn');
    if (wp.voice_url) {
        if (currentAudio) { currentAudio.pause(); currentAudio = null; }
        currentAudio = new Audio(wp.voice_url);
        currentAudio.play().catch(() => {});
        btn.classList.add('playing');
        currentAudio.onended = () => btn.classList.remove('playing');
    } else if (wp.instruction_text) {
        speakText(wp.instruction_text);
        btn.classList.add('playing');
        setTimeout(() => btn.classList.remove('playing'), 2000);
    }
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 0.85; utt.pitch = 1.1; utt.volume = 1;
        window.speechSynthesis.speak(utt);
    }
}

// ============================================================
// GPS & Step Completion
// ============================================================
function simulateStepComplete() {
    if (!currentRoute) { alert('No active navigation. Tap a destination first!'); return; }
    currentStep++;
    if (currentStep >= currentRoute.waypoints.length) showComplete();
    else showNavigationStep();
}

function startGPSTracking() {
    if (!navigator.geolocation) return;
    navigator.geolocation.watchPosition(
        (pos) => {
            currentPosition = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            if (!currentRoute) return;
            const wp = currentRoute.waypoints[currentStep];
            if (!wp) return;
            const dist = haversineDistance(pos.coords.latitude, pos.coords.longitude, wp.latitude, wp.longitude);
            if (dist < 30) {
                currentStep++;
                if (currentStep >= currentRoute.waypoints.length) showComplete();
                else showNavigationStep();
            }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
}

function startLocationTracking() {
    startGPSTracking();
    // Send location to server every 10 seconds
    setInterval(async () => {
        if (!currentPosition) return;
        try {
            await fetch(`${API_BASE}/api/public/location`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    child_id: childId,
                    latitude:  currentPosition.latitude,
                    longitude: currentPosition.longitude
                })
            });
        } catch (err) { console.error('Failed to send location:', err); }
    }, 10000);
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// SCREEN: Complete
// ============================================================
function showComplete() {
    const routeName = currentRoute ? currentRoute.route_name : 'destination';
    currentRoute = null; currentStep = 0;
    watchScreen.innerHTML = `
    <div class="complete-screen">
      <div class="complete-icon">🎉</div>
      <div class="complete-text">You made it!</div>
      <div class="complete-sub">Great job! 🌟</div>
    </div>
  `;
    sendNotification('navigation_complete', `Safely arrived at ${routeName}`);
    speakText('Great job! You made it!');
    setTimeout(() => showHomeScreen(), 4000);
}

// ============================================================
// SCREEN: Cancel / SOS / No Routes
// ============================================================
function cancelNavigation() {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    window.speechSynthesis?.cancel();
    currentRoute = null; currentStep = 0;
    showHomeScreen();
}

function showSOS() {
    watchScreen.innerHTML = `
    <div class="sos-screen">
      <div class="sos-icon">🚨</div>
      <div class="sos-text">HELP SENT!</div>
      <p style="font-size:12px;color:rgba(255,255,255,0.7);margin-bottom:15px;">Guardian notified</p>
      ${childProfile?.parent_phone ? `<a href="tel:${childProfile.parent_phone}" class="call-btn">📞 Call Parent</a>` : ''}
      <button class="sos-cancel-btn" onclick="showHomeScreen()" style="margin-top:10px;">Go Back</button>
    </div>
  `;
    sendNotification('sos', '🚨 SOS! Child needs help immediately!', true);
    speakText('Help has been sent. Stay where you are.');
}

function showNoRoutes() {
    watchScreen.innerHTML = `
    <div class="no-routes-screen">
      <div class="empty-icon">📭</div>
      <p>No routes yet!<br>Ask your guardian to create one.</p>
      <button class="profile-btn" onclick="showProfile()" title="Profile" style="position:static;margin-top:15px;">👤 Profile</button>
    </div>
  `;
}

// ============================================================
// Helpers
// ============================================================
function getInstructionEmoji(text) {
    if (!text) return '📍';
    const t = text.toLowerCase();
    if (t.includes('left'))   return '⬅️';
    if (t.includes('right'))  return '➡️';
    if (t.includes('straight') || t.includes('ahead')) return '⬆️';
    if (t.includes('cross') || t.includes('road'))     return '🚦';
    if (t.includes('school')) return '🏫';
    if (t.includes('home'))   return '🏠';
    if (t.includes('bus') || t.includes('stop')) return '🚌';
    if (t.includes('gate'))   return '🚪';
    if (t.includes('tree'))   return '🌳';
    if (t.includes('shop') || t.includes('store')) return '🏪';
    if (t.includes('park'))   return '🌳';
    if (t.includes('reach') || t.includes('arrived')) return '🎉';
    return '📍';
}

async function sendNotification(type, message, includeLocation = false) {
    try {
        const payload = { child_id: childId, type, message };
        if (includeLocation && currentPosition) {
            payload.latitude  = currentPosition.latitude;
            payload.longitude = currentPosition.longitude;
        }
        await fetch(`${API_BASE}/api/public/notifications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) { console.error('Notification failed:', err); }
}

// ---- Start ----
init();
