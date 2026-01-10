# פרומפט לשיחה הבאה - עבודה על Live Call Feature

## הקשר
ביום 10 בינואר 2026 עבדנו על שיפור ה-AI Coach והניתוח של שיחות מוקלטות. 
**עכשיו אנחנו רוצים לעבוד על Live Call Feature** - המערכת שמאפשרת ניתוח בזמן אמת במהלך שיחת מכירה.

---

## מצב נוכחי של Live Call

### מה כבר בנוי:
1. **Live Call Page** (`/live` route) - עמוד עם ממשק למעקב בזמן אמת
2. **AssemblyAI Universal Streaming** - אינטגרציה לתמלול בזמן אמת
3. **AI Coaching Engine** - GPT-4o-mini למשוב מיידי במהלך שיחות
4. **Database Tables**:
   - `live_sessions` - מטא-דאטה של סשנים
   - `live_insights` - תובנות אימון שנוצרו
   - `live_transcript_chunks` - קטעי תמלול

### קבצים רלוונטיים:
- `frontend/src/pages/LiveCallPage.jsx` - ממשק Live Call
- `app.py` שורות 852-925 - `LIVE_COACH_SYSTEM_PROMPT`
- `app.py` שורות 1188-1257 - AssemblyAI token endpoints
- `app.py` שורות 1260+ - `/api/live/sessions/<id>/process-transcript`

### בעיות ידועות שצריך לטפל בהן:
1. **Real-time transcription** - WebSocket connection מראה "מנותק" בממשק
2. **Audio processing** - PCM encoding ו-base64 conversion ל-WebSocket
3. **AI coaching delivery** - TTS audio playback לאוזנייה

### AssemblyAI Integration:
- **API ישן (לא עובד)**: `wss://api.assemblyai.com/v2/realtime/ws`
- **API חדש**: `wss://streaming.assemblyai.com?token=<token>` (Universal Streaming)
- Token endpoint משתמש ב-AssemblyAI SDK v3: `from assemblyai.streaming.v3 import StreamingClient`
- Test endpoint: `/api/live/test-assemblyai` (ללא auth לצורך debug)

---

## מה צריך לעשות בשיחה הבאה

### מטרות:
1. **לתקן את ה-WebSocket connection** - לוודא שהתמלול בזמן אמת עובד
2. **לבדוק את עיבוד האודיו** - PCM encoding נכון
3. **לבדוק AI coaching** - תובנות כל 20 שניות
4. **לבדוק TTS playback** - השמעת טיפים לאוזנייה
5. **End-to-end test** - מסלול מלא של live coaching

### שאלות לבירור מהמשתמש:
- איך בדיוק רוצים שה-live coaching יעבוד? (כל כמה זמן תובנות?)
- מה התובנות שצריך לתת בזמן אמת? (רק התנגדויות? גם הצעות?)
- איך להציג את התובנות? (התראות? פאנל צד?)
- האם צריך TTS או רק טקסט?

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
