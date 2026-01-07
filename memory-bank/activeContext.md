# Active Context: SalesAI

## Current Work Focus

### Just Completed (January 6, 2026 - Session 4)
- ✅ **Admin Dashboard Redesign** - Sidebar layout with users list
- ✅ **User Display Info** - Emails/names shown instead of user IDs
- ✅ **user_profiles Table** - Store full names and display names
- ✅ **Search/Filter Users** - By email or name in admin panel
- ✅ **get_all_users_admin()** - SQL function for admin user list
- ✅ **get_user_display_info()** - SQL function for user email/name

### Next Session Priority
**Audio Playback on Timestamp Click:**
1. Save audio to Supabase Storage when uploading
2. Load audio in analysis view
3. Click on timestamp → play audio from that point
4. Audio player with controls

### Current State
The application is fully functional with:
1. **Transcription** - Working with AssemblyAI best model
2. **Speaker Classification** - GPT-5.2 powered
3. **Separate Analysis Flow** - "Analyze Call" button triggers deep analysis
4. **Audio Playback** - Listen to recordings with timestamp navigation
5. **Visual Timeline** - See call flow with clickable events
6. **Supabase Database** - Calls, analyses, and audio files saved persistently
7. **Call History** - View and replay past calls with full data
8. **Admin Dashboard** - View all users, their calls, team stats

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
