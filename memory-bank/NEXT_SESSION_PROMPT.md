# 🚀 SalesAI - Next Session Instructions

## ⚠️ FIRST: Read Memory Bank
Before doing ANYTHING, read these files to understand the project:
1. `memory-bank/progress.md` - What's been built
2. `memory-bank/activeContext.md` - Recent changes and current state
3. `memory-bank/productContext.md` - Product goals

---

## 📋 Session 7 Summary (January 9, 2026)

### What Was Built
- ✅ **AI Sales Coach Assistant** - Floating chat window with GPT-5.2 integration
  - Floating button in bottom-right corner (shows when analysis is available)
  - Professional chat UI with message history
  - Suggested questions for quick start
  - Copy responses, minimize/maximize, clear chat
  - Backend `/api/assistant` endpoint with sales coach system prompt
  - Receives full call context (transcript, analysis, objections)
  
- ✅ **Tab Reorganization** - Clear separation with NO duplicates
  - **Overview Tab**: AI Summary, Skill Radar, Topic Frequency, Talk Pattern, Timeline Events
  - **Deep Insights Tab**: Objections + Better Responses, Response Improvements, Buying Signals
  - **Stories Tab**: Stories you told + Objection Prevention Stories
  
- ✅ **New Components Created**
  - `AIAssistant.jsx` - Floating chat component
  - `DeepInsightsTab.jsx` - Professional objections display
  - `PreventionStoryCard` - Card for objection prevention stories
  
- ✅ **AI Prompt Enhancements** (`sales_analyzer.py`)
  - One-Call Close methodology focus
  - Price timing analysis (never reveal before 45-60 min)
  - Objection prevention stories generation
  - Trial closes analysis
  - Buying signals detection
  
- ✅ **Removed/Changed**
  - Deleted Coaching Recommendations section (per user request)
  - Removed ~600 lines of duplicate content from App.jsx
  - Fixed TTS for "Listen to Improved Story" button

### New Backend Endpoint
```python
POST /api/assistant
Body: {
  "message": "user question",
  "history": [...previous messages...],
  "call_context": { transcript, analysis },
  "selected_text": "optional selected text"
}
Response: { "response": "AI coach response", "success": true }
```

### Previous Sessions
- **Session 6**: UI/PDF Redesign, Clean minimal professional design
- **Session 5**: TTS Integration, PDF Export, Debug Endpoints

### Known Issue
- **Jobs stored in memory** - Railway redeploy clears jobs dict
- **Potential fix**: Store jobs in Redis or Supabase for persistence

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

---

## 🎯 WAITING FOR USER INSTRUCTIONS

**The user will tell you what to work on next.**

Possible tasks:
- Fix jobs persistence (Redis/Supabase instead of in-memory)
- Further UI improvements
- New features
- Bug fixes
- Deployment issues

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
