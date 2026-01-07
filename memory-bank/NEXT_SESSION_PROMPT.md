# 🚀 Next Session: Audio Playback on Timestamp Click

## 🎯 Next Session Objective
**Make audio playable when clicking timestamps in objections/events**

When user clicks on a timestamp (objection, timeline event, transcript segment), the audio should:
1. Start playing from that exact timestamp
2. Allow user to hear the context of what happened

---

## 📋 TODO for Next Session

### High Priority - Audio on Click
1. [ ] **Save audio file to Supabase Storage** when user uploads
2. [ ] **Store audio_url in calls table** (already exists)
3. [ ] **Load audio in analysis view** - fetch from storage
4. [ ] **Click timestamp → play audio** from that point
5. [ ] **Audio player controls** - play/pause, seek bar

### Implementation Plan
```
1. When uploading audio:
   - Upload to Supabase Storage (audio bucket)
   - Save public URL in calls.audio_url

2. In call detail/analysis view:
   - Fetch audio_url from call data
   - Create <audio> element with src=audio_url
   - Add audioRef for controlling playback

3. On timestamp click:
   - Get timestamp_ms from the clicked item
   - audioRef.current.currentTime = timestamp_ms / 1000
   - audioRef.current.play()
```

---

## ✅ Completed (January 6, 2026 - Session 4)

### Admin Dashboard Redesign
- [x] Sidebar layout with users list
- [x] Search/filter users by name or email
- [x] Click user to see their stats and calls
- [x] Overview dashboard with team stats
- [x] User emails/names displayed (not just IDs)
- [x] `user_profiles` table created
- [x] `get_all_users_admin()` function
- [x] `get_user_display_info()` function

### Previous Sessions
- [x] `user_roles` table with RLS
- [x] Admin API endpoints
- [x] AdminDashboard, AdminCallsPage, AdminCallView pages
- [x] Audio storage in Supabase
- [x] Visual Timeline with click-to-seek
- [x] Call History view

### Supabase MCP Connected
- Project: `voice-new` (nacwvxqimvbfqlyylszt)
- MCP allows direct SQL execution and migrations

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
