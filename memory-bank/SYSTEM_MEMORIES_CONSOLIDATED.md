# System Memories Consolidated

**Last Updated:** January 2026

---

## SalesAI Project Infrastructure

### Deployment URLs
- **Frontend**: https://vloce.netlify.app (Netlify)
- **Backend**: https://web-production-3215.up.railway.app (Railway)
- **Database**: Supabase project `ueztvmtwxqszvlzmoezx`

### Supabase Credentials (NEW - Jan 2026)
- **Project ID**: ueztvmtwxqszvlzmoezx
- **URL**: https://ueztvmtwxqszvlzmoezx.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlenR2bXR3eHFzenZsem1vZXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjAyMjIsImV4cCI6MjA4MzkzNjIyMn0.OuSYC8iidMmdlLmEue0usCnpxVJWl6dsf1KTOVHzbqE
- **Service Key**: Get from Supabase Dashboard > Settings > API

### OLD PROJECT (DELETED)
- nacwvxqimvbfqlyylszt - DO NOT USE

### Railway Environment Variables
- ASSEMBLYAI_API_KEY: 262435766cfa4a90aec471cb4eb88690
- OPENAI_API_KEY: (set)
- SUPABASE_URL: https://ueztvmtwxqszvlzmoezx.supabase.co
- SUPABASE_ANON_KEY: (must be from new project)
- SUPABASE_SERVICE_KEY: (must be from new project)

### Google OAuth (NEW - Jan 2026)
- Client ID: (stored in Supabase Dashboard > Auth > Providers > Google)
- Client Secret: (stored in Supabase Dashboard > Auth > Providers > Google)
- Callback: https://ueztvmtwxqszvlzmoezx.supabase.co/auth/v1/callback

### Database Tables
- calls, analyses, live_sessions, live_insights, live_transcript_chunks
- user_roles, playbook_entries, knowledge_documents, user_corrections, practice_sessions

### Storage Buckets
- audio (public)
- audio-files (public)

---

## Google OAuth Setup

### Supabase Configuration
- Site URL: `https://vloce.netlify.app`
- Redirect URLs: `https://vloce.netlify.app/**`, `http://localhost:3000/**`
- Google Client ID: (stored in Supabase Dashboard > Auth > Providers > Google)

### Key Files
- `AuthContext.jsx`: signInWithGoogle() function
- `LoginPage.jsx` & `RegisterPage.jsx`: Google login buttons

### Database Changes
- `user_profiles`: Added auth_provider, avatar_url columns
- `analyses`: Added user_id for direct linkage
- Trigger: `on_auth_user_created` for automatic profile creation

### Important: Netlify Deploy
- Netlify is NOT connected to GitHub for auto-deploy
- Use Netlify MCP `deploy-site` tool to deploy
- Env vars in Netlify: VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

---

## Deepgram Integration for Real-Time Speaker Diarization

### Key Discovery
- **AssemblyAI Universal Streaming v3 does NOT support speaker diarization in real-time**
- **Deepgram supports real-time speaker diarization** via `diarize=true` parameter

### Configuration
- **Deepgram API Key**: Set `DEEPGRAM_API_KEY` in `.env`
- **Fallback**: Uses AssemblyAI if Deepgram key not available
- **WebSocket URL**: `wss://api.deepgram.com/v1/listen?model=nova-2&diarize=true&encoding=linear16&sample_rate=16000`

### Audio Settings
- Browser captures at 48kHz, resampled to 16kHz
- Gain: 8x amplification for better detection
- Chunks: 50ms (800 samples at 16kHz)
- Encoding: PCM16 little-endian (linear16)

### Speaker Mapping
- Speaker 0 → Seller (purple color)
- Speaker 1+ → Buyer (green color)

### Key Files
- `app.py`: `create_deepgram_websocket()` function handles Deepgram connection
- `AIAgentPage.jsx`: Auto-scroll, speaker colors, 8x gain
- `.env`: DEEPGRAM_API_KEY required

---

## Practice Features (January 2026)

### 1. Practice On Tab (in call analysis)
- Component: `PracticeOnTab.jsx` in `/frontend/src/components/analysis/`
- Shows in AnalysisInsights after call analysis
- Generates personalized training via GPT

### 2. Practice Center (standalone page)
- Route: `/practice`
- Component: `PracticePage.jsx` in `/frontend/src/pages/`
- Accessible via side menu "Practice" with Dumbbell icon

### Database
- Table: `practice_sessions`
- Columns: id, user_id, call_id, call_name, practice_data (JSONB), completed_exercises, completed_actions, total_exercises, completed_count, progress_percent

### Backend Endpoints (app.py lines 981-1235)
- `GET /api/practice-sessions` - List all sessions
- `GET /api/practice-sessions/<id>` - Get session
- `POST /api/practice-sessions` - Create session
- `PUT /api/practice-sessions/<id>` - Update progress
- `DELETE /api/practice-sessions/<id>` - Delete session
- `GET /api/practice-sessions/stats` - Aggregated stats
- `GET /api/calls-for-practice` - Calls with analysis for practice generation

### Practice Center Features
- **Stats Dashboard** - Total sessions, exercises, progress
- **Top Weaknesses** - Aggregated weak areas across all calls
- **Session Cards** - Visual progress, priority areas
- **Call Selection** - Generate practice from analyzed calls
- **Full Practice View** - Weaknesses, Exercises, Roleplay, Actions sections
- **Auto-save progress** - Saves completed exercises to database

---

## Call Rename Feature

### New Endpoints
- `POST /api/calls/<call_id>/rename` - Manual rename with `{name: "new name"}`
- `POST /api/calls/<call_id>/generate-name` - Auto-generate name from analysis

### Auto-Generate Logic
1. Extracts customer_name and project_type from `full_analysis.deal_context` or `full_analysis.key_info`
2. Falls back to GPT-4o-mini extraction from transcript if not found
3. Creates name in format: `"Customer Name - Project Type"`

### Frontend
- Edit3 icon button to open rename modal
- Sparkles icon button for auto-generate
- Rename modal with Hebrew text ("שנה שם שיחה")

### Files Changed
- `app.py`: Lines 707-825 (rename_call, generate_call_name endpoints)
- `database.py`: Lines 275-292 (update_call_name function)
- `frontend/src/App.jsx`: Rename state, functions, and UI

---

## Audio Upload/Transcription Fix Summary

### Problems Identified & Fixed

#### 1. CORS Error
- **Issue**: Frontend (Netlify) couldn't connect to backend (Railway) due to missing CORS headers
- **Fix**: Enhanced CORS configuration in app.py with @app.after_request and explicit OPTIONS handling
- **Files**: app.py lines 67-89

#### 2. Gunicorn Workers Issue
- **Issue**: Multiple workers meant job state wasn't shared between requests
- **Fix**: Changed to single worker with threads: --workers 1 --threads 4
- **Files**: Procfile

#### 3. Audio Upload Timeout
- **Issue**: Upload to Supabase Storage would hang indefinitely
- **Fix**: Added 30s timeout, skip files >50MB, run in separate thread
- **Files**: database.py upload_audio_file function

#### 4. AssemblyAI NoneType Error
- **Issue**: transcript.sentiment_analysis or transcript.utterances could be None
- **Fix**: Added null checks: "or []" fallbacks
- **Files**: app.py lines 417-422

### Testing Commands
```bash
# Test transcription directly
curl -X POST -F "audio=@test.wav" https://web-production-3215.up.railway.app/api/debug/test-transcription

# Check job status
curl https://web-production-3215.up.railway.app/api/status/{job_id}

# Check all jobs
curl https://web-production-3215.up.railway.app/api/debug/jobs
```

---

## Database Fix: User Associations

### Problem Solved
Calls and analyses were not being saved to database with user associations.

### Root Causes Fixed
1. `calls.user_id` had no FK constraint to `auth.users`
2. `save_analysis()` didn't accept or save `user_id`
3. Railway had old/invalid Supabase API keys

### Database Migrations Applied
- `add_calls_fk_constraint` - FK on calls.user_id
- `create_user_profiles_table` - New table with auto-trigger
- `user_profiles_policies_and_trigger` - RLS + trigger for auto-profile
- `fix_calls_analyses_rls` - Updated RLS policies

### Backend Code Changes
- `database.py`: `save_analysis()` now accepts `user_id` parameter
- `app.py`: `run_deep_analysis()` passes `user_id`, `analyze_call()` extracts from JWT

---

## Company Products

- Cool Life Paint (exterior heat-reflective coating, lifetime warranty)
- Turf (artificial grass)
- Pavers (patios, walkways, driveways)
- Concrete (driveways, patios)
- Vinyl Fence, Composite Fence, Aluminum Fence
- DG (decomposed granite)

## 3 Program Benefits
1. **Incentives** - Special discounts passed to customer
2. **NMOOP Financing** - Complete project first, customer pays 30-60 days AFTER completion
3. **Made in USA** - Only American-made highest quality products

## Storytelling 6 Elements
1. Relatable Character (name, location, similar situation)
2. Same Hesitation (had exact objection)
3. Decision Moment (what made them decide)
4. Cost of Waiting (what they lost)
5. Transformation (specific results with numbers)
6. Emotional Payoff (how they feel now)

## Key Stories
- Military Tank Story (for Cool Life Paint)
- David's 3-Month Wait Story (for "need to think")
- Maria's Spouse Story (for "need to talk to spouse")
- Johnson's Cheap Contractor Story (for "too expensive")

---

## Competitor Research Summary

### Top Real-Time Sales Coaching Platforms
1. **Balto** - Pure real-time coaching, live prompts, <1-2s latency
2. **Gong** - Revenue intelligence, AI trackers, talk ratio
3. **Cogito** - Emotion AI, audio behavior analysis
4. **Salesloft** - Live monitoring + rapid feedback
5. **Cirrus Insight** - CRM-integrated next-best questions

### Technology Stack (Industry Standard)
- **Transcription**: Streaming ASR (Deepgram/Google/AWS) + domain-adapted models
- **Live Coaching**: Rule engine + ML → intent classifiers → decision logic → UI cards
- **Diarization**: Neural x-vectors + clustering + role mapping
- **Objection Detection**: Supervised NLP + configurable keyword trackers
- **Sentiment**: Text transformers + Audio (pitch, energy, tempo)

### Our Gaps vs Balto
- ❌ Real-time playbooks (visual cards)
- ❌ Manager Assist (live intervention)
- ❌ Customer sentiment indicators
- ✅ Talk ratio alerts (we have this!)

### Priority Improvements
1. **CRITICAL**: AudioWorklet, noise suppression, better transcription
2. **HIGH**: Call Phase Progress Bar, Coaching Cards UI, Objection Library
3. **MEDIUM**: Save insights to Supabase, Analytics Dashboard
4. **LOW**: Sentiment analysis, Predictive coaching, Voice cloning

---

## Story Generation System Updates (Jan 2026)

### English UI with Language Toggle
- Default language changed to **English** for all story components
- **EN/עב toggle button** added to switch between English and Hebrew
- Components updated: `StoryImprovementCard`, `NewStoryCreator`
- Text-to-speech supports both `en-US` and `he-IL` voices

### World-Class Story Generation Prompts (app.py)
- **STORY_GENERATION_PROMPT** - Lines 1370-1453
- **STORY_IMPROVEMENT_PROMPT** - Lines 1455-1504
- Creates compelling sales stories with 6 essential elements
- Arizona-focused locations
- Product-specific benefits

### Key Files
- Backend prompts: `/app.py` lines 1370-1504, 1685-1761
- Frontend components: `/frontend/src/components/analysis/PracticeOnTab.jsx`
- Translations: TRANSLATIONS object with en/he keys
