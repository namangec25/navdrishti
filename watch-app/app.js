// ============================================================
// NavDrishti Smartwatch App - Main Logic
// ============================================================
// Simulates a Wear OS watch interface for children.
// Loads routes from the backend, shows one step at a time.
// Uses GPS proximity (or manual simulation) to advance steps.
//
// Design Principles:
//   - NO reading required
//   - Large icons & bright colors
//   - Voice-first guidance
//   - One instruction at a time
// ============================================================

const API_BASE = window.location.origin;
const watchScreen = document.getElementById('watchScreen');
const childIdDisplay = document.getElementById('childIdDisplay');
const statusDisplay = document.getElementById('statusDisplay');

// ---- State ----
let childId = null;
let routes = [];
let currentRoute = null;
let currentStep = 0;

// Default destination icons for routes without images
const DESTINATION_ICONS = [
    { icon: '🏫', label: 'School', colorClass: 'school' },
    { icon: '🏠', label: 'Home', colorClass: 'home' },
    { icon: '🚌', label: 'Bus Stop', colorClass: 'bus' },
    { icon: '🌳', label: 'Park', colorClass: 'park' },
];

// ---- Initialize ----
function init() {
    // Get child ID from URL params
    const params = new URLSearchParams(window.location.search);
    childId = params.get('child') || '1';
    childIdDisplay.textContent = childId;

    loadRoutes();
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
        console.error('Failed to load routes:', err);
        // Show demo mode with sample data
        routes = getDemoRoutes();
        showHomeScreen();
        statusDisplay.textContent = 'Demo mode (no server)';
    }
}

// ---- Demo Routes (fallback when no server) ----
function getDemoRoutes() {
    return [
        {
            id: 'demo-1',
            route_name: 'School',
            waypoints: [
                { step_number: 1, instruction_text: 'Walk to the gate', image_url: null, voice_url: null, latitude: 28.614, longitude: 77.209 },
                { step_number: 2, instruction_text: 'Turn left at the big tree', image_url: null, voice_url: null, latitude: 28.615, longitude: 77.210 },
                { step_number: 3, instruction_text: 'Cross the road carefully', image_url: null, voice_url: null, latitude: 28.616, longitude: 77.211 },
                { step_number: 4, instruction_text: 'You reached school!', image_url: null, voice_url: null, latitude: 28.617, longitude: 77.212 },
            ]
        },
        {
            id: 'demo-2',
            route_name: 'Home',
            waypoints: [
                { step_number: 1, instruction_text: 'Walk out of school gate', image_url: null, voice_url: null, latitude: 28.617, longitude: 77.212 },
                { step_number: 2, instruction_text: 'Turn right at the shop', image_url: null, voice_url: null, latitude: 28.616, longitude: 77.211 },
                { step_number: 3, instruction_text: 'You are home!', image_url: null, voice_url: null, latitude: 28.614, longitude: 77.209 },
            ]
        },
        {
            id: 'demo-3',
            route_name: 'Bus Stop',
            waypoints: [
                { step_number: 1, instruction_text: 'Walk straight on the path', image_url: null, voice_url: null, latitude: 28.614, longitude: 77.209 },
                { step_number: 2, instruction_text: 'The bus stop is on your right', image_url: null, voice_url: null, latitude: 28.615, longitude: 77.208 },
            ]
        }
    ];
}

// ============================================================
// SCREEN: Home (Destination Selection)
// ============================================================
function showHomeScreen() {
    let buttonsHtml = '';
    routes.forEach((route, i) => {
        const dest = DESTINATION_ICONS[i % DESTINATION_ICONS.length];
        const iconToShow = dest.icon;
        const label = route.route_name || dest.label;
        buttonsHtml += `
      <button class="dest-btn ${dest.colorClass}" onclick="startNavigation(${i})">
        <span class="dest-icon">${iconToShow}</span>
        ${label}
      </button>
    `;
    });

    // Add SOS button if fewer than 4 routes
    if (routes.length < 4) {
        buttonsHtml += `
      <button class="dest-btn" style="background: linear-gradient(135deg, #ef4444, #b91c1c);" onclick="showSOS()">
        <span class="dest-icon">🆘</span>
        HELP
      </button>
    `;
    }

    watchScreen.innerHTML = `
    <div class="home-screen">
      <div class="home-title">Where to?</div>
      <div class="destination-grid">
        ${buttonsHtml}
      </div>
    </div>
  `;
}

// ============================================================
// SCREEN: Navigation (Step-by-Step)
// ============================================================
function startNavigation(routeIndex) {
    currentRoute = routes[routeIndex];
    currentStep = 0;
    showNavigationStep();
}

function showNavigationStep() {
    if (!currentRoute || !currentRoute.waypoints) return;

    const waypoints = currentRoute.waypoints;
    const wp = waypoints[currentStep];

    if (!wp) {
        showComplete();
        return;
    }

    // Determine the image to show
    let imageHtml;
    if (wp.image_url) {
        imageHtml = `<img src="${wp.image_url}" alt="Step ${currentStep + 1}">`;
    } else {
        // Use a context-appropriate emoji based on instruction text
        const emoji = getInstructionEmoji(wp.instruction_text);
        imageHtml = emoji;
    }

    // Progress dots
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

      <button class="nav-voice-btn" onclick="playVoice()" id="voiceBtn" title="Play voice">
        🔊
      </button>

      <div class="progress-dots">${dotsHtml}</div>

      <button class="cancel-btn" onclick="cancelNavigation()" title="Cancel">✕</button>
    </div>
  `;

    // Auto-play voice instruction if available
    if (wp.voice_url) {
        setTimeout(() => playVoice(), 500);
    } else if (wp.instruction_text) {
        // Use browser TTS as fallback
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
        // Play recorded voice
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        currentAudio = new Audio(wp.voice_url);
        currentAudio.play().catch(() => { });

        btn.classList.add('playing');
        currentAudio.onended = () => btn.classList.remove('playing');
    } else if (wp.instruction_text) {
        // TTS fallback
        speakText(wp.instruction_text);
        btn.classList.add('playing');
        setTimeout(() => btn.classList.remove('playing'), 2000);
    }
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85; // Slightly slower for children
        utterance.pitch = 1.1; // Slightly higher pitch, friendlier tone
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
    }
}

// ============================================================
// Step Completion (GPS Proximity or Manual)
// ============================================================
function simulateStepComplete() {
    if (!currentRoute) {
        alert('No active navigation. Tap a destination on the watch first!');
        return;
    }

    currentStep++;
    if (currentStep >= currentRoute.waypoints.length) {
        showComplete();
    } else {
        showNavigationStep();
    }
}

// Real GPS checking (for actual device use)
function startGPSTracking() {
    if (!navigator.geolocation) return;

    navigator.geolocation.watchPosition(
        (pos) => {
            if (!currentRoute) return;
            const wp = currentRoute.waypoints[currentStep];
            if (!wp) return;

            const distance = haversineDistance(
                pos.coords.latitude, pos.coords.longitude,
                wp.latitude, wp.longitude
            );

            // If within 30 meters of waypoint, advance to next step
            if (distance < 30) {
                currentStep++;
                if (currentStep >= currentRoute.waypoints.length) {
                    showComplete();
                } else {
                    showNavigationStep();
                }
            }
        },
        () => { },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============================================================
// SCREEN: Complete
// ============================================================
function showComplete() {
    currentRoute = null;
    currentStep = 0;

    watchScreen.innerHTML = `
    <div class="complete-screen">
      <div class="complete-icon">🎉</div>
      <div class="complete-text">You made it!</div>
      <div class="complete-sub">Great job! 🌟</div>
    </div>
  `;

    // Speak congratulations
    speakText('Great job! You made it!');

    // Return to home after 4 seconds
    setTimeout(() => showHomeScreen(), 4000);
}

// ============================================================
// SCREEN: Cancel Navigation
// ============================================================
function cancelNavigation() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
    }
    window.speechSynthesis?.cancel();
    currentRoute = null;
    currentStep = 0;
    showHomeScreen();
}

// ============================================================
// SCREEN: SOS Emergency
// ============================================================
function showSOS() {
    watchScreen.innerHTML = `
    <div class="sos-screen">
      <div class="sos-icon">🚨</div>
      <div class="sos-text">HELP SENT!</div>
      <p style="font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 15px;">
        Guardian notified
      </p>
      <button class="sos-cancel-btn" onclick="showHomeScreen()">Go Back</button>
    </div>
  `;

    speakText('Help has been sent. Stay where you are.');
}

// ============================================================
// SCREEN: No Routes
// ============================================================
function showNoRoutes() {
    watchScreen.innerHTML = `
    <div class="no-routes-screen">
      <div class="empty-icon">📭</div>
      <p>No routes yet!<br>Ask your guardian to create one.</p>
    </div>
  `;
}

// ============================================================
// Helper: Get emoji based on instruction text
// ============================================================
function getInstructionEmoji(text) {
    if (!text) return '📍';
    const t = text.toLowerCase();
    if (t.includes('left')) return '⬅️';
    if (t.includes('right')) return '➡️';
    if (t.includes('straight') || t.includes('ahead')) return '⬆️';
    if (t.includes('cross') || t.includes('road')) return '🚦';
    if (t.includes('tree')) return '🌳';
    if (t.includes('school')) return '🏫';
    if (t.includes('home')) return '🏠';
    if (t.includes('bus') || t.includes('stop')) return '🚌';
    if (t.includes('gate')) return '🚪';
    if (t.includes('shop') || t.includes('store')) return '🏪';
    if (t.includes('park')) return '🌳';
    if (t.includes('reach') || t.includes('arrived')) return '🎉';
    return '📍';
}

// ---- Start! ----
init();
