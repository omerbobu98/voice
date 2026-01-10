# 🚀 SalesAI - Next Session Instructions

## ⚠️ קודם כל: קרא את כל ה-Memory Bank
לפני שעושים משהו, קרא את הקבצים האלה כדי להבין את הפרויקט:
1. `memory-bank/progress.md` - מה נבנה
2. `memory-bank/activeContext.md` - שינויים אחרונים ומצב נוכחי
3. `memory-bank/productContext.md` - מטרות המוצר
4. `memory-bank/COMPLETE_SYSTEM_DOCUMENTATION.md` - **תיעוד מלא של המערכת** (1,099 שורות)

**אחרי שקראת - שאל את המשתמש מה הוא רוצה לעשות.**

---

## 📋 Session 9 Summary (January 10, 2026)

### What Was Fixed
- ✅ **OpenAI Quota Issue (429 Error)** - User added credits to OpenAI
- ✅ **JSON Parsing Error** - AI responses were malformed, added robust brace-matching extraction
- ✅ **Model: GPT-5.2** - User wants to keep gpt-5.2 for quality (DO NOT change model!)

### Key Changes Made
```python
# sales_analyzer.py - Improved JSON parsing (lines 519-549)
# Now handles:
# - Markdown code blocks (```json)
# - Extra content before/after JSON
# - Proper brace matching to extract valid JSON
```

### Analysis Time
- **Normal: 1-3 minutes** with gpt-5.2 and comprehensive prompt
- The prompt is ~25KB with 20+ analysis sections
- This is expected behavior, NOT a bug

### Previous Sessions
- **Session 8**: Interactive Topic Coverage, Skill Breakdown modals, Premium PDF
- **Session 7**: AI Sales Coach Assistant, Tab Reorganization, Objection Prevention Stories
- **Session 6**: UI/PDF Redesign, Clean minimal professional design

### Known Issues
- **Jobs stored in memory** - Railway redeploy clears jobs dict
- **Analysis takes 1-3 minutes** - Normal for gpt-5.2 with full prompt

---

## 🔧 Deployment Info

### URLs
- **Frontend**: https://vloce.netlify.app
- **Backend**: https://web-production-3215.up.railway.app
- **Supabase**: nacwvxqimvbfqlyylszt.supabase.co

### Debug Endpoints
```bash
# Check health
curl https://web-production-3215.up.railway.app/api/health

# Check API keys status
curl https://web-production-3215.up.railway.app/api/debug/api-keys

# Check current jobs
curl https://web-production-3215.up.railway.app/api/debug/jobs
```

---

## ✅ Completed Features

### Core
- [x] Audio upload + AssemblyAI transcription
- [x] Speaker diarization and role classification
- [x] Comprehensive AI analysis (MEDDIC, BANT, objections)
- [x] Audio playback with timestamp navigation
- [x] Visual timeline with clickable events
- [x] Call history with re-analysis
- [x] Admin dashboard

### Session 5 Additions
- [x] Customer interest analysis
- [x] Closing opportunities detection
- [x] Storytelling analysis with improved versions
- [x] TTS playback for AI suggestions
- [x] PDF report download
- [x] Premium metrics dashboard in analysis view

### Session 6 Additions (UI/PDF Redesign)
- [x] Complete UI redesign - clean minimal professional
- [x] PDF report redesign - single accent color, clear hierarchy
- [x] New color palette - Slate + Indigo accent
- [x] Audio separation fix - Better Response plays TTS only
- [x] Mobile responsive design

### Session 7 Additions (AI Assistant + Tab Reorganization)
- [x] AI Sales Coach Assistant - floating chat with GPT-5.2
- [x] Tab reorganization - Overview, Deep Insights, Stories (NO duplicates)
- [x] Objection Prevention Stories - AI generates stories to prevent objections
- [x] Timeline Events moved to Overview tab
- [x] DeepInsightsTab component - clean objections display
- [x] One-Call Close methodology in AI prompt
- [x] Removed Coaching Recommendations section

### Session 8 Additions (Interactive Overview + PDF Redesign)
- [x] Interactive Topic Coverage - click bars/pills to see details in modal
- [x] TopicDetailModal - shows objections, closing, value props, buying signals
- [x] Interactive Skill Breakdown - click legend items for analysis
- [x] SkillDetailModal - shows score, analysis, moments, pro tips
- [x] Premium PDF redesign - enterprise grade with cards and color coding
- [x] TTS fix - improved playback with onCanPlayThrough
- [x] Complete System Documentation - COMPLETE_SYSTEM_DOCUMENTATION.md (1,099 lines)

---

## 🎯 ממתין להוראות המשתמש

**המשתמש יגיד לך מה לעשות.**

משימות אפשריות:
- Fix jobs persistence (Redis/Supabase instead of in-memory)
- שיפורי UI נוספים
- פיצ'רים חדשים
- תיקוני באגים
- בעיות deployment

### ⚠️ חשוב!
- **אל תשנה את המודל מ-gpt-5.2** - המשתמש רוצה לשמור על איכות
- **ניתוח לוקח 1-3 דקות** - זה נורמלי, לא באג

---

## 📊 Current Database Schema

```sql
-- Users managed by Supabase Auth (auth.users)

-- calls table
CREATE TABLE calls (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  file_name TEXT,
  duration_seconds INTEGER,
  word_count INTEGER,
  speakers_count INTEGER,
  transcription TEXT,
  utterances JSONB,
  speaker_roles JSONB,
  audio_url TEXT,  -- URL to Supabase Storage
  status TEXT,
  created_at TIMESTAMPTZ
);

-- analyses table  
CREATE TABLE analyses (
  id UUID PRIMARY KEY,
  call_id UUID REFERENCES calls(id),
  overall_score INTEGER,
  meddic_score INTEGER,
  bant_score INTEGER,
  metrics JSONB,
  analysis JSONB,  -- timeline_events, objections, etc.
  created_at TIMESTAMPTZ
);

-- Storage bucket: audio (public)
-- Path: {user_id}/{timestamp}_{filename}
```

---

## 🔐 Admin Implementation Plan

### Option 1: User Roles Table (Recommended)
```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = $1 AND role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

### RLS Policies for Admin
```sql
-- Admins can view all calls
CREATE POLICY "Admins can view all calls" ON calls
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Admins can view all analyses
CREATE POLICY "Admins can view all analyses" ON analyses
  FOR SELECT TO authenticated
  USING (
    call_id IN (SELECT id FROM calls WHERE user_id = auth.uid())
    OR is_admin(auth.uid())
  );
```

---

## 🗂️ Required API Endpoints

```python
# Admin-only endpoints
GET /api/admin/users          # List all users with stats
GET /api/admin/users/:id      # User details + their calls
GET /api/admin/users/:id/calls # User's call list
GET /api/admin/calls/:id      # View any call (admin only)
GET /api/admin/stats          # Aggregate team stats
```

### Backend Middleware
```python
def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_user_id_from_token()
        if not is_user_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated
```

---

## 🎨 Admin Dashboard UI

### Pages
1. `/admin` - Overview stats (users, calls, avg scores)
2. `/admin/users` - All users list with search
3. `/admin/users/:id` - Single user's calls & stats
4. `/admin/calls/:id` - View any call with full details

### UI Layout
```
┌─────────────────────────────────────────────────┐
│ Admin Dashboard                                  │
├─────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ Users   │ │ Calls   │ │ Avg     │ │ Active  │ │
│ │   24    │ │   156   │ │ Score   │ │ Today   │ │
│ │         │ │         │ │   72    │ │   8     │ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
├─────────────────────────────────────────────────┤
│ Users                              [Search...]   │
│ ┌───────────────────────────────────────────┐   │
│ │ user@email.com │ 12 calls │ Score: 75 │ > │   │
│ │ user2@mail.com │  8 calls │ Score: 68 │ > │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Database (via Supabase MCP)
- [ ] Create `user_roles` table
- [ ] Create `is_admin()` function
- [ ] Update RLS policies for admin access
- [ ] Add current user as admin

### Backend (`app.py`, `database.py`)
- [ ] Add `is_user_admin()` function
- [ ] Add `@require_admin` decorator
- [ ] Create admin endpoints

### Frontend
- [ ] Create `/admin` routes
- [ ] Create `AdminDashboard` page
- [ ] Create `UsersList` component
- [ ] Create `UserDetail` component
- [ ] Protect admin routes

---

## 🚀 Quick Start

```bash
# Backend
cd /Users/omerbuzaglo/Documents/audio-new
source venv/bin/activate
python app.py  # http://127.0.0.1:5001

# Frontend
cd frontend
npm run dev  # http://localhost:3000
```

### First Steps Next Session
1. Use Supabase MCP to create `user_roles` table
2. Add yourself as admin
3. Create backend admin check function
4. Create first admin endpoint
5. Build admin UI

---

## 📝 Important Context
- **Project**: voice-new (nacwvxqimvbfqlyylszt)
- **User**: omerbuzaglc1998@gmail.com
- **Supabase MCP**: Connected and working
- **All calls have `user_id`** for filtering
- **Audio in `audio` bucket** with user paths
