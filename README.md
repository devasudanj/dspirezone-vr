# Dspire VR Zone – App & Backend

Production-ready Android React Native app + FastAPI backend for the **Dspire VR Zone** VR gaming center.

---

## Project Structure

```
Dspire VR App/
├── backend/                  # FastAPI Python backend
│   ├── main.py               # App entry point
│   ├── database.py           # SQLAlchemy engine + session
│   ├── models.py             # ORM models (Game, Headset, Installation, Session)
│   ├── schemas.py            # Pydantic v2 request/response schemas
│   ├── storage.py            # Azure Blob Storage helper
│   ├── seed.py               # Sample data loader
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── alembic/
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   └── routers/
│       ├── games.py          # GET /games, GET /games/{id}/installations
│       ├── headsets.py       # GET /headsets
│       ├── sessions.py       # POST /sessions, GET /sessions/{id}
│       └── admin.py          # POST /admin/games, media upload
│
└── mobile/                   # Expo React Native (Android-first)
    ├── App.tsx
    ├── app.json
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── api/
        │   ├── client.ts     # Axios instance
        │   ├── games.ts
        │   └── sessions.ts
        ├── components/
        │   ├── GameCard.tsx
        │   ├── InstallationRow.tsx
        │   └── DurationButton.tsx
        ├── navigation/
        │   ├── AppNavigator.tsx
        │   └── types.ts
        ├── screens/
        │   ├── GameLibraryScreen.tsx
        │   ├── GameDetailScreen.tsx
        │   ├── HeadsetSelectionScreen.tsx
        │   ├── TimeSelectionScreen.tsx
        │   └── SessionSummaryScreen.tsx
        ├── store/
        │   └── sessionStore.ts   # Zustand
        ├── theme/
        │   ├── colors.ts
        │   └── typography.ts
        ├── types/
        │   └── index.ts
        └── utils/
            ├── print.ts          # expo-print + expo-sharing
            └── sessionSlip.ts    # HTML slip generator
```

---

## Backend Setup

### Prerequisites
- Python 3.11+
- Azure subscription (Blob Storage)

### Installation
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Configuration
```bash
cp .env.example .env
# Edit .env with your Azure connection string and database path
```

### Database migrations
```bash
alembic upgrade head
```

### Seed sample data
```bash
python seed.py
```

### Run
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

API docs available at: `http://localhost:8000/docs`

---

## Mobile App Setup

### Prerequisites
- Node.js 20+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio + emulator **or** physical Android tablet

### Installation
```bash
cd mobile
npm install
```

### Configuration
```bash
cp .env.example .env
# Set EXPO_PUBLIC_API_BASE_URL to your Azure backend URL
```

### Run on Android
```bash
npx expo start --android
```

### Build for production
```bash
# Requires EAS CLI and an Expo account
eas build --platform android --profile production
```

---

## User Flow

```
GameLibrary ──tap game──► GameDetail ──"Start Session"──►
HeadsetSelection ──tap headset──► TimeSelection ──"Confirm"──►
POST /sessions ──► SessionSummary ──► Print / Share PDF
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/games/` | List active games (optional `?category=Action`) |
| GET | `/games/{id}` | Full game detail |
| GET | `/games/{id}/installations` | Headset installations (`?active_only=true`) |
| GET | `/headsets/` | All headsets |
| POST | `/sessions/` | Create session |
| GET | `/sessions/{id}` | Get session by ID |
| POST | `/admin/games` | Create game record |
| POST | `/admin/games/{id}/upload-thumbnail` | Upload thumbnail → Azure |
| POST | `/admin/games/{id}/upload-video` | Upload preview video → Azure |
| POST | `/admin/headsets` | Register headset |

---

## Design Decisions & Assumptions

1. **SQLite on Azure**: The backend uses SQLite at `/home/data/dspirezone.db`. For high-concurrency workloads, migrate to PostgreSQL by changing `DATABASE_URL` in `.env` – no model changes required.

2. **No player auth**: Players use the app anonymously. Admin endpoints (`/admin/*`) should be protected by an API key or the existing admin portal's auth mechanism (not included here – integrate as needed).

3. **Session durations are fixed**: 10 / 30 / 45 / 60 minutes. Validated both client-side (TypeScript) and server-side (Pydantic + SQLAlchemy layer).

4. **"Expiring Soon" threshold**: 7 days. Adjust `is_expiring_soon` property in `models.py` if needed.

5. **Landscape-first tablet layout**: `app.json` sets `"orientation": "landscape"`. The 3-column game grid and side-by-side headset cards are optimised for 10-inch tablets.

6. **Print**: Uses Android's native print dialog via `expo-print`. Players can print to a Bluetooth/network printer or save as PDF. Sharing opens the system share sheet (WhatsApp, email, etc.).

7. **Image placeholders**: `thumbnail_url` defaults shown as `via.placeholder.com` in seed data. Replace with real Azure Blob URLs after uploading assets via the `/admin/games/{id}/upload-thumbnail` endpoint.
