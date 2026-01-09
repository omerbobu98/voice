# Active Context: SalesAI

## Current Work Focus

### Just Completed (January 9, 2026 - Session 8)
- ✅ **PARALLEL ANALYSIS OPTIMIZATION** - 3-5x faster analysis
  - Split single 16K token API call into 6 parallel focused calls
  - Each call handles specific sections (summary, objections, signals, stories, scores, timeline)
  - Uses ThreadPoolExecutor with 6 workers
  - Robust error handling with fallback defaults
  - Result merging with validation
  - Progress reporting shows completion of each parallel call

### Previous Session (January 9, 2026 - Session 7)
- ✅ **AI Sales Coach Assistant** - Floating chat window with GPT-5.2
- ✅ **Tab Reorganization** - Clear separation: Overview, Deep Insights, Stories
- ✅ **Removed ALL Duplicate Content** - No more repeated sections across tabs
- ✅ **Fixed TTS for Stories** - "Listen to Improved Story" now works
- ✅ **Deleted Coaching Recommendations** - Removed per user request
- ✅ **New DeepInsightsTab Component** - Professional objections + better responses
- ✅ **Objection Prevention Stories** - AI generates stories to prevent objections
- ✅ **Timeline Events in Overview** - Moved from standalone to Overview tab
- ✅ **One-Call Close AI Prompt** - Enhanced sales_analyzer.py with methodology

### Previous Session (January 8, 2026 - Session 6)
- ✅ **Complete UI Redesign** - Clean, minimal, professional design
- ✅ **PDF Report Redesign** - Single accent color (Indigo), clear hierarchy
- ✅ **New Color Palette** - Slate-based with single Indigo accent (#4f46e5)
- ✅ **Mobile Responsive** - All components work on phone and desktop

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
10. **PDF Export** - Professional analysis report with clean design
11. **Clean UI** - Minimal design with single accent color
12. **AI Sales Coach Assistant** - Interactive GPT-5.2 chat for personalized coaching
13. **Organized Tabs** - Overview, Deep Insights, Stories with NO duplicates
14. **Objection Prevention Stories** - AI-generated stories to prevent common objections

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
