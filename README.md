# 🧭 NavDrishti - One Step at a Time Navigation

**NavDrishti** helps children with dyslexia and cognitive challenges navigate simple daily routes independently using a smartwatch-style interface and guardian mobile app.

![NavDrishti](https://img.shields.io/badge/version-1.0.0-blue) ![Node.js](https://img.shields.io/badge/Node.js-18+-green) ![React](https://img.shields.io/badge/React-18-blue)

## 🏗️ Architecture

| Component | Technology | Port |
|---|---|---|
| **Backend API** | Node.js + Express + SQLite | `3001` |
| **Guardian App** | Vite + React + Leaflet | `5173` |
| **Watch Simulator** | Vanilla HTML/CSS/JS | `3001/watch` |

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- npm (comes with Node.js)

### Install & Run

```bash
# 1. Install all dependencies
npm install
cd guardian-app && npm install && cd ..

# 2. Start everything (backend + guardian app)
npm run dev
```

### Open in Browser

| App | URL |
|---|---|
| **Guardian App** | http://localhost:5173 |
| **Watch Simulator** | http://localhost:3001/watch |
| **Watch (with child ID)** | http://localhost:3001/watch?child=1 |
| **API Health Check** | http://localhost:3001/api/health |

## 📱 Usage Guide

### Guardian App Flow

1. **Sign Up** → Create a guardian account
2. **Add Children** → Go to Children page, click "Add Child"
3. **Create Route** → Go to Routes → Create Route
   - Click on map to add waypoints
   - Type instructions for each step (e.g., "Turn left at the big tree")
   - Record voice for each waypoint (🎤 button)
   - Upload landmark photos (📷 button)
   - Assign route to a child
4. **Live Tracking** → Monitor child's location in real-time

### Watch App Flow

1. Open `http://localhost:3001/watch?child=<CHILD_ID>`
2. Child taps a destination icon (School, Home, Bus Stop)
3. **One instruction shown at a time** with:
   - Large visual icon/image
   - Voice instruction (auto-plays)
   - Progress dots showing steps
4. Click "📍 Simulate Arrival" to advance steps
5. 🎉 Celebration screen on completion!
6. Red ✕ button to cancel anytime
7. 🆘 SOS button to alert guardian

## 📁 Project Structure

```
navdrishti/
├── package.json              # Root package.json
├── README.md
├── server/                   # Backend
│   ├── server.js             # Express entry point
│   ├── db.js                 # SQLite database + schema
│   ├── middleware/
│   │   └── auth.js           # JWT authentication
│   ├── routes/
│   │   ├── auth.js           # Signup / Login
│   │   ├── children.js       # Child CRUD
│   │   ├── routes.js         # Route + Waypoint CRUD
│   │   ├── location.js       # GPS tracking + geofence
│   │   └── upload.js         # Image/voice file uploads
│   └── uploads/              # Uploaded files storage
├── guardian-app/             # React Frontend
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # Router + Auth context + Layout
│       ├── api.js            # Axios API helper
│       ├── index.css         # Design system
│       └── pages/
│           ├── Login.jsx
│           ├── Signup.jsx
│           ├── Dashboard.jsx
│           ├── RouteEditor.jsx   # Map + waypoint editor
│           ├── RoutesPage.jsx
│           ├── LiveTracking.jsx
│           └── ChildrenPage.jsx
└── watch-app/                # Smartwatch Simulator
    ├── index.html
    ├── styles.css
    └── app.js
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile |
| GET | `/api/children` | List children |
| POST | `/api/children` | Add child |
| PUT | `/api/children/:id` | Update child |
| DELETE | `/api/children/:id` | Delete child |
| GET | `/api/routes` | List routes |
| GET | `/api/routes/:id` | Get route + waypoints |
| POST | `/api/routes` | Create route |
| PUT | `/api/routes/:id` | Update route |
| DELETE | `/api/routes/:id` | Delete route |
| POST | `/api/location/log` | Log child location |
| GET | `/api/location/latest/:childId` | Latest location |
| GET | `/api/location/geofence/:childId/:routeId` | Geofence check |
| POST | `/api/upload/image` | Upload image |
| POST | `/api/upload/voice` | Upload voice |
| GET | `/api/public/routes/:childId` | Routes for watch (no auth) |

## 🎨 Design Principles

- **Reduce cognitive load** — show only one instruction at a time
- **Visual cues over text** — large icons, bright colors, minimal reading
- **Voice-first guidance** — recorded voice + TTS fallback
- **Large touch targets** — all buttons sized for easy tapping
- **No reading required** — watch app uses icons and voice only

## ✨ Features

| Feature | Status |
|---|---|
| Guardian Auth (JWT) | ✅ |
| Route Creator (Map) | ✅ |
| Voice Recording | ✅ |
| Image Upload | ✅ |
| Route Management | ✅ |
| Live Tracking | ✅ |
| Watch Home Screen | ✅ |
| Step-by-Step Nav | ✅ |
| Voice Playback | ✅ |
| TTS Fallback | ✅ |
| GPS Proximity | ✅ |
| Emergency SOS | ✅ |
| Geofence Alerts | ✅ |
| Offline Demo Mode | ✅ |

## 📄 License

MIT
