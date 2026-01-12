# Deepgram Speaker Diarization Integration

## Date: January 11, 2026

## Summary
Integrated Deepgram real-time streaming API with speaker diarization to replace AssemblyAI for the AI Agent Live Coach feature. This enables automatic identification of different speakers (Seller vs Buyer) during live sales calls.

---

## Why Deepgram Instead of AssemblyAI?

| Feature | AssemblyAI | Deepgram |
|---------|------------|----------|
| Real-time Diarization | ❌ Not supported | ✅ Supported |
| Speaker Identification | Only for pre-recorded | Real-time |
| Pricing | ~$0.006/min | ~$0.008/min |

**Key Insight**: AssemblyAI Universal Streaming v3 does NOT support speaker diarization in real-time - only for pre-recorded audio.

---

## Configuration

### Environment Variables (.env)
```
DEEPGRAM_API_KEY=your_deepgram_api_key
ASSEMBLYAI_API_KEY=your_assemblyai_api_key  # Fallback
```

### Deepgram API Key Format
- Looks like: `e740832f802794dc79a8b05dae938f6676bf78ea`
- Get from: https://console.deepgram.com
- Free tier: $200 credit

---

## Backend Implementation (app.py)

### Key Function: `create_deepgram_websocket()`

```python
def create_deepgram_websocket(client_sid, sample_rate=16000):
    """Create a WebSocket connection to Deepgram with real-time speaker diarization"""
    
    # WebSocket URL with diarization
    ws_url = (
        f"wss://api.deepgram.com/v1/listen"
        f"?model=nova-2"
        f"&language=en"
        f"&diarize=true"
        f"&encoding=linear16"
        f"&sample_rate={sample_rate}"
        f"&channels=1"
        f"&interim_results=true"
        f"&vad_events=true"
    )
    
    # Authentication via header
    ws = websocket.WebSocketApp(
        ws_url,
        header={"Authorization": f"Token {DEEPGRAM_API_KEY}"},
        ...
    )
```

### Deepgram Response Format
```json
{
  "type": "Results",
  "channel_index": [0, 1],
  "duration": 1.04,
  "start": 1.21,
  "is_final": true,
  "speech_final": true,
  "channel": {
    "alternatives": [{
      "transcript": "Hello how are you",
      "confidence": 0.98,
      "words": [
        {"word": "Hello", "speaker": 0, "start": 1.21, "end": 1.45},
        {"word": "how", "speaker": 0, "start": 1.46, "end": 1.55},
        ...
      ]
    }]
  }
}
```

### Speaker Mapping
```python
# Speaker ID to Role
speaker_role = 'Seller' if speaker_id == 0 else 'Buyer'
```

---

## Frontend Implementation (AIAgentPage.jsx)

### Audio Settings
```javascript
// Gain amplification for better detection
gainNode.gain.value = 8.0  // 8x amplification

// Resampling from browser (48kHz) to Deepgram (16kHz)
const sourceSampleRate = audioContextRef.current.sampleRate  // 48000
const targetSampleRate = 16000
const ratio = sourceSampleRate / targetSampleRate  // 3

// Audio chunks: 50ms at 16kHz = 800 samples
const TARGET_SAMPLES = 800
```

### Auto-Scroll
```javascript
// Ref for scroll anchor
const transcriptEndRef = useRef(null)

// Auto-scroll effect
useEffect(() => {
  if (transcriptEndRef.current) {
    transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }
}, [transcript, liveText])
```

### Speaker Colors
- **Seller**: Purple (`border-violet-500`, `text-violet-400`)
- **Buyer**: Green (`border-emerald-500`, `text-emerald-400`)

---

## Fallback Logic

```python
# In handle_start_transcription():
if DEEPGRAM_API_KEY:
    # Use Deepgram with speaker diarization
    ws = create_deepgram_websocket(client_sid, sample_rate)
elif ASSEMBLYAI_API_KEY:
    # Fallback to AssemblyAI (no diarization)
    ws = create_assemblyai_websocket(client_sid, sample_rate)
else:
    emit('error', {'message': 'No transcription API key configured'})
```

---

## Troubleshooting

### Empty Transcripts from Deepgram
1. **Check API key validity** - Get from console.deepgram.com
2. **Increase gain** - Current: 8x amplification
3. **Check encoding** - Must be `linear16` (PCM16 little-endian)
4. **Verify sample rate** - Must match what's sent in URL (16000)

### Common Issues
- **KeyError on disconnect**: Fixed by using `streaming_connections` dict
- **Audio too quiet**: Fixed with 8x gain amplification
- **No speaker info**: Need `diarize=true` in Deepgram URL

---

## Files Modified

1. **app.py**
   - Added `DEEPGRAM_API_KEY` loading
   - Added `create_deepgram_websocket()` function
   - Updated `handle_start_transcription()` to prefer Deepgram
   - Renamed `assemblyai_connections` to `streaming_connections`

2. **frontend/src/pages/AIAgentPage.jsx**
   - Added `currentSpeaker` state for live speaker indicator
   - Added `transcriptEndRef` for auto-scroll
   - Increased gain to 8x
   - Added speaker color coding in UI

3. **.env.example**
   - Added `DEEPGRAM_API_KEY=your_deepgram_api_key`

---

## Testing Checklist

- [x] Deepgram WebSocket connects successfully
- [x] Audio streams to Deepgram
- [x] Transcription appears in UI
- [x] Speaker identification works (Speaker 0, Speaker 1)
- [x] Speaker colors display correctly
- [x] Auto-scroll works for long conversations
- [x] AI Coaching triggers every 20 seconds
- [x] TTS plays coaching tips

---

## Next Steps / Future Improvements

1. **Multi-language support** - Change `language=en` parameter
2. **Better speaker mapping** - Train on seller's voice for more accurate identification
3. **Stereo audio** - If hardware supports, use separate channels for seller/buyer
4. **Voice fingerprinting** - Collect voice samples at start for better speaker ID
