# AI Agent Live Coach - Complete Fix Guide
## Created: January 11, 2026
## ✅ FIXED: January 11, 2026 (v3 - Deepgram Speaker Diarization)

---

# 🎯 OBJECTIVE
Fix the AI Agent Live Coach to work with **Deepgram** real-time transcription with speaker diarization, providing professional coaching tips during live sales calls.

**Important**: AssemblyAI Universal Streaming v3 does NOT support speaker diarization in real-time. Only Deepgram supports this feature.

---

# ✅ SOLUTION IMPLEMENTED (v3 - Deepgram)

## Architecture (Final - Deepgram with Speaker Diarization)

```
Frontend (React)                    app.py (port 5001)               Deepgram
     |                                    |                              |
     |-- getUserMedia() @ 48kHz -------->|                              |
     |-- Resample to 16kHz ------------->|                              |
     |                                    |                              |
     |-- Socket.IO connect ------------->|-- WebSocket connect -------->|
     |   (http://localhost:5001)          |   wss://api.deepgram.com    |
     |                                    |   /v1/listen?diarize=true   |
     |                                    |                              |
     |-- emit('audio_data', base64) ---->|-- Send binary PCM ---------->|
     |                                    |                              |
     |<-- on('transcription') -----------|<-- Receive JSON --------------|
     |   {type, text, speaker_role}       |   {transcript, speaker, ...} |
     |                                    |                              |
     |-- HTTP POST /api/ai-agent/analyze →|  (AI Coaching - same server)
     |-- HTTP POST /api/tts ------------->|  (TTS - same server)
```

## Key Changes Made

### 1. `app.py` - Unified Server (Flask + Socket.IO)
- **Integrated Socket.IO** directly into Flask app
- **Single port**: 5001 for everything
- **Deepgram WebSocket**: `wss://api.deepgram.com/v1/listen?diarize=true&model=nova-2`
- **Auth**: `Authorization: Token DEEPGRAM_API_KEY` header
- **Speaker mapping**: Speaker 0 → Seller, Speaker 1+ → Buyer
- **Fallback**: AssemblyAI if Deepgram key not configured

### 2. `AIAgentPage.jsx` - Frontend
- **Socket.IO**: Connects to `http://localhost:5001`
- **Audio**: PCM16 @ 16kHz, base64 encoded (resampled from 48kHz)
- **Gain**: 8x amplification for better detection
- **Events**: `start_transcription`, `audio_data`, `stop_transcription`
- **Auto-scroll**: Transcript scrolls automatically
- **Speaker colors**: Seller (purple), Buyer (green)

### 3. `requirements.txt` - Dependencies
- Added: `flask-socketio`, `websocket-client`, `certifi`

### 4. `websocket_server.py` - NO LONGER NEEDED
- All functionality merged into `app.py`

---

# 🚀 HOW TO RUN (SIMPLE!)

### Terminal 1 - Backend (Flask + Socket.IO)
```bash
cd /Users/omerbuzaglo/Documents/audio-new
source venv/bin/activate
pip install flask-socketio websocket-client certifi
python app.py
# Running on http://0.0.0.0:5001 with Socket.IO support
```

### Terminal 2 - Frontend
```bash
cd /Users/omerbuzaglo/Documents/audio-new/frontend
npm run dev
# Running on http://localhost:3000
```

### Test
1. Open http://localhost:3000
2. Navigate to AI Agent Live Coach
3. Click "בדוק" (Test) for microphone
4. Click "התחל שיחה" (Start Session)
5. Speak into microphone
6. Watch real-time transcription with speaker labels
7. AI coaching tips appear every 20 seconds

---

# 🎯 FEATURES

| Feature | Status | How It Works |
|---------|--------|--------------|
| Real-time Transcription | ✅ | Socket.IO → Deepgram WebSocket |
| Speaker Diarization | ✅ | Deepgram `diarize=true` |
| Speaker Labels | ✅ | Speaker 0 → Seller, 1+ → Buyer |
| AI Coaching | ✅ | GPT-4o analyzes transcript every 20 sec |
| TTS | ✅ | OpenAI TTS for coaching tips |
| Microphone | ✅ | 48kHz → 16kHz resampled, 8x gain |
| Auto-scroll | ✅ | Transcript scrolls to latest |

---

# 🚫 WHAT NOT TO USE

1. **AssemblyAI Batch API** (`/v2/transcript`) - For complete files only
2. **Web Speech API** - Unstable, no speaker diarization
3. **OpenAI Whisper** - Batch processing, not real-time
4. **Separate websocket_server.py** - Now integrated into app.py

---

# 📁 FILES

| File | Purpose |
|------|---------|
| `app.py` | Flask + Socket.IO + AssemblyAI WebSocket (ALL IN ONE) |
| `frontend/src/pages/AIAgentPage.jsx` | Live Coach UI with Socket.IO client |
| `requirements.txt` | Python dependencies |
