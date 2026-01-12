# Active Context (עודכן 11 בינואר 2026)

## 🎯 עבודה אחרונה - Live Call Feature

### מה הושלם:
1. ✅ **שדרוג ל-GPT-4o** - מודל חכם יותר לניתוח בזמן אמת
2. ✅ **LIVE_COACH_SYSTEM_PROMPT מתקדם** - 4 שכבות ניתוח + 8 coaching triggers
3. ✅ **LiveCallPageMobile.jsx** - ממשק mobile-first עם bottom sheet
4. ✅ **3 מצבי אודיו** - OFF / SMART / ON
5. ✅ **תיקון WebSocket** - temporary token + URL נכון

### בעיה שהייתה:
- WebSocket היה "מנותק" כי השתמשנו ב-URL לא נכון
- תוקן ב-11/1/2026

### מה צריך לבדוק:
- האם WebSocket מתחבר עכשיו?
- האם התמלול עובד?
- האם התובנות מופיעות?

---

# Active Context: SalesAI

## Current Work Focus

### Just Completed (January 10, 2026 - Session 9)
- ✅ **Fixed AI Analysis** - Diagnosed OpenAI quota issue (429 error)
- ✅ **Improved JSON Parsing** - Robust extraction handles malformed AI responses
- ✅ **Model: GPT-5.2** - Using gpt-5.2 for all AI analysis (user preference for quality)
- ✅ **Analysis takes 1-3 minutes** - Normal for comprehensive prompt with gpt-5.2

### Session 8 (January 10, 2026)
- ✅ **Interactive Topic Coverage** - Click bars/pills to see details in modal
- ✅ **TopicDetailModal Component** - Shows objections, closing attempts, value props, buying signals, pain points, price reveals
- ✅ **Interactive Skill Breakdown** - Click legend items for detailed analysis
- ✅ **SkillDetailModal Component** - Shows score, analysis, related moments, 4 pro tips per skill
- ✅ **Premium PDF Redesign** - Enterprise grade report with cards, color coding, professional layout
- ✅ **TTS Fix** - Improved audio playback with onCanPlayThrough and error handling
- ✅ **Complete System Documentation** - Created COMPLETE_SYSTEM_DOCUMENTATION.md (1,099 lines)
- ✅ **Navigate to Deep Insights** - Link from topic modal to full objection view

### Session 7 (January 9, 2026)
- ✅ **AI Sales Coach Assistant** - Floating chat window with GPT-5.2
- ✅ **Tab Reorganization** - Clear separation: Overview, Deep Insights, Stories
- ✅ **Objection Prevention Stories** - AI generates stories to prevent objections
- ✅ **One-Call Close AI Prompt** - Enhanced sales_analyzer.py with methodology

### Earlier Sessions
- ✅ **Complete UI Redesign** - Clean, minimal, professional design
- ✅ **PDF Report** - ReportLab with clean design
- ✅ **TTS Integration** - OpenAI TTS for AI responses
- ✅ **Admin Dashboard** - View all users, calls, team stats

### Known Issue (to address)
- **Jobs in Memory** - Railway redeploy clears in-memory jobs dict
- **Potential Fix** - Store jobs in Redis or Supabase for persistence

### Current State
The application is fully functional with:
1. **Transcription** - Working with AssemblyAI best model
2. **Speaker Classification** - GPT-5.2 powered
3. **Separate Analysis Flow** - "Analyze Call" button triggers deep analysis
4. **Audio Playback** - Listen to recordings with timestamp navigation
5. **Visual Timeline** - See call flow with clickable events (now in Overview tab)
6. **Supabase Database** - Calls, analyses, and audio files saved persistently
7. **Call History** - View and replay past calls with full data
8. **Admin Dashboard** - View all users, their calls, team stats
9. **TTS Playback** - Listen to AI suggestions with mini audio player
10. **Premium PDF Export** - Enterprise grade report with cards and color coding
11. **Clean UI** - Minimal design with single accent color
12. **AI Sales Coach Assistant** - Interactive GPT-5.2 chat for personalized coaching
13. **Organized Tabs** - Overview, Deep Insights, Stories with NO duplicates
14. **Objection Prevention Stories** - AI-generated stories to prevent common objections
15. **Interactive Topic Coverage** - Click to see objections, closing attempts, buying signals in modal
16. **Interactive Skill Breakdown** - Click for detailed analysis with pro tips

## Recent Changes (Session 4)

### Database (via Supabase MCP)
- Created `user_profiles` table with RLS policies
- Created `get_all_users_admin()` function - returns all users with emails
- Created `get_user_display_info()` function - returns user email/name

### Backend (`database.py`)
- Updated `get_all_users_with_stats()` to include email/display_name
- Updated `get_user_stats()` to fetch user display info

### Frontend (`AdminDashboard.jsx`)
- Complete redesign with sidebar layout
- Users list in sidebar with search
- Overview/user detail in main content area
- Shows email/display_name instead of user IDs
- Collapsible sidebar

## Next Priority: Audio on Timestamp Click
See NEXT_SESSION_PROMPT.md for detailed plan

## Active Decisions

### Architecture
- **Decision**: Audio files stored in Supabase Storage, URL saved in calls table
- **Rationale**: Persistent storage, public URLs for playback

### UI/UX
- **Decision**: Admin Dashboard with sidebar layout
- **Rationale**: User requested sidebar with users list for easier navigation
- **Decision**: Show emails/names instead of user IDs
- **Rationale**: User asked how to identify users without names

### Data Flow
- **Decision**: Re-analysis of saved calls supported
- **Rationale**: Users can analyze old calls that weren't analyzed before

## Important Patterns & Preferences

### User Preferences (Learned)
- Wants beautiful, modern UI (dark theme)
- Strong emphasis on objection detection and better responses
- Timeline visualization of call events
- Audio playback with timestamp navigation
- Hebrew-speaking user, but app UI in English

### Code Patterns
- Flask backend with threading for async processing
- Supabase MCP for direct database management
- Polling mechanism for real-time updates
- TailwindCSS with gradient cards
- Lucide icons throughout

## Learnings & Insights

### Technical
- GPT-5.2 requires `max_completion_tokens` not `max_tokens`
- Supabase Storage needs explicit bucket creation and policies
- Audio seeking uses milliseconds (timestamp_ms) for precision
- MCP allows direct SQL execution and migration application

### Product
- Timeline view helps understand call flow
- Click-to-seek is powerful for reviewing specific moments
- Audio playback essential for call review
- Sales managers want full visibility into team calls (→ Admin Dashboard)
