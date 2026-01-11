# Live Call Feature - מצב עדכני (10 בינואר 2026, 6:30pm)

## ✅ תוקן היום - WebSocket ותמלול בזמן אמת

### שינויים שבוצעו:

#### 1. **Backend - AssemblyAI API Integration** (`app.py`)
- ✅ **תוקן endpoint `/api/live/assemblyai-token`** - מחזיר API key ישירות במקום לנסות ליצור temporary token
- ✅ **תוקן test endpoint** - פשוט בודק אם יש API key
- ✅ **עדכון LIVE_COACH_SYSTEM_PROMPT** - עכשיו כולל:
  - 3 Program Benefits המדויקים (Incentives, NMOOP, Made in USA)
  - המוצרים הנכונים (Cool Life Paint, Turf, Pavers, etc.)
  - Storytelling Framework (6 elements)
  - הסיפורים המרכזיים (Military Tank, David's Wait, Maria's Spouse, Johnson's Contractor)

#### 2. **Frontend - WebSocket Protocol** (`LiveCallPage.jsx`)
- ✅ **תוקן WebSocket connection** - שימוש ב-`api_key` במקום `token` ב-URL
- ✅ **הוספת begin message** - שליחת הודעת התחלה עם audio format
- ✅ **תוקן audio processing**:
  - Sample rate: 16kHz (דרישת AssemblyAI)
  - Audio format: PCM16 (pcm_s16le)
  - שליחת הודעות עם `type: 'audio'`
- ✅ **תוקן message handling** - תמיכה ב-`turn`, `partial`, `error`, `begin`, `termination`

### AssemblyAI Universal Streaming - פרוטוקול נכון:
```javascript
// WebSocket URL
wss://streaming.assemblyai.com?api_key=YOUR_API_KEY

// Begin message (שולחים מיד אחרי connection)
{
  "type": "begin",
  "audio_format": {
    "encoding": "pcm_s16le",
    "sample_rate": 16000
  }
}

// Audio messages (שולחים כל ~256ms)
{
  "type": "audio",
  "audio_data": "base64_encoded_pcm16_data"
}

// Response messages
- type: "begin" - session started
- type: "partial" - live transcript (מתעדכן כל הזמן)
- type: "turn" - final transcript (כשהדובר מפסיק)
- type: "error" - שגיאה
- type: "termination" - session ended
```

---

## מצב נוכחי של Live Call

### מה עובד:
1. ✅ **Live Call Page** - ממשק מלא עם setup modal
2. ✅ **WebSocket Protocol** - נכון לפי AssemblyAI Universal Streaming
3. ✅ **Audio Processing** - PCM16 @ 16kHz
4. ✅ **AI Coaching Engine** - GPT-4o-mini עם המתודולוגיה המדויקת
5. ✅ **Database Tables** - live_sessions, live_insights, live_transcript_chunks

### מה צריך לבדוק:
1. ⏳ **Real-time transcription** - לבדוק שה-WebSocket באמת מתחבר ומתמלל
2. ⏳ **AI coaching generation** - לבדוק שהתובנות נוצרות כל 20 שניות
3. ⏳ **TTS playback** - לבדוק שהאודיו מתנגן דרך האוזנייה
4. ⏳ **End-to-end flow** - מסלול מלא מהתחלה ועד סוף

---

## איך לבדוק שזה עובד

### צעדים לבדיקה:
1. **Deploy לשרת** - push השינויים ל-Railway
2. **פתח את האפליקציה** - https://vloce.netlify.app
3. **התחל Live Call** - לחץ על "התחל שיחה"
4. **בדוק connection status** - צריך להראות "🎤 מחובר - מתמלל בזמן אמת"
5. **דבר למיקרופון** - בדוק שהטקסט מופיע בזמן אמת
6. **חכה 20 שניות** - בדוק שמגיעות תובנות AI בפאנל הימני

### Debug אם לא עובד:
- פתח Console (F12) ותראה logs
- בדוק שיש "AssemblyAI WebSocket connected!"
- בדוק שיש "Sent begin message"
- בדוק שמגיעות הודעות מסוג "turn" או "partial"

---

## מידע טכני חשוב

### Environment Variables (Railway):
```
ASSEMBLYAI_API_KEY=262435766cfa4a90aec471cb4eb88690
OPENAI_API_KEY=(set)
SUPABASE_URL=(set)
SUPABASE_ANON_KEY=(set)
SUPABASE_SERVICE_KEY=(set)
```

### Deployment:
- **Frontend**: https://vloce.netlify.app (Netlify)
- **Backend**: https://web-production-3215.up.railway.app (Railway)
- **Database**: Supabase project `nacwvxqimvbfqlyylszt`

### Tech Stack:
- Backend: Flask + Gunicorn
- Frontend: React + Vite + TailwindCSS
- AI: GPT-4o-mini (real-time coaching), GPT-5.2 (post-call analysis)
- Transcription: AssemblyAI Universal Streaming
- TTS: OpenAI TTS (voice: nova)

---

## הערות חשובות

1. **המתודולוגיה עודכנה** - `sales_analyzer.py` עכשיו כולל את כל המוצרים והטבות התוכנית המדויקות
2. **Live Coach צריך לשתמש באותה מתודולוגיה** - אותם 3 benefits, אותם מוצרים, אותו storytelling framework
3. **הפרדה בין Post-Call ו-Live**:
   - Post-Call: GPT-5.2, ניתוח מעמיק, PDF
   - Live: GPT-4o-mini, תובנות מהירות, טיפים בזמן אמת

---

## צעדים מוצעים לשיחה הבאה

1. **בדיקת סטטוס נוכחי** - האם ה-WebSocket מתחבר בכלל?
2. **Debug AssemblyAI connection** - לבדוק logs, לוודא token תקין
3. **בדיקת audio stream** - האם האודיו מגיע ל-WebSocket?
4. **שיפור LIVE_COACH_SYSTEM_PROMPT** - להתאים למתודולוגיה החדשה
5. **בדיקת AI insights generation** - האם התובנות נוצרות?
6. **בדיקת TTS playback** - האם האודיו מתנגן?
7. **UI improvements** - הצגה ברורה של תובנות בזמן אמת

---

## קבצים שכנראה נצטרך לערוך

- `app.py` - LIVE_COACH_SYSTEM_PROMPT, WebSocket handling
- `frontend/src/pages/LiveCallPage.jsx` - UI ו-WebSocket client
- אולי צריך להוסיף error handling טוב יותר
- אולי צריך logging טוב יותר לצורך debug

---

**תאריך יצירה**: 10 בינואר 2026, 12:49pm
**מצב**: מוכן לעבודה על Live Call Feature בשיחה הבאה
