# 🛠️ VLOCE Platform Improvement Plan

> **Created**: January 20, 2026 | **Status**: In Progress

---

## Overview

This document outlines all improvements to be implemented, organized by priority and area.

---

## 🔴 Phase 1: Critical Fixes (Priority: High)

### 1.1 Auth Token Refresh Fix
**Problem**: File upload may fail if refresh token is expired  
**Solution**: Force re-login when refresh fails

**Files to modify**:
- `frontend/src/App.jsx`

**Implementation**:
```javascript
// In handleUpload, after refreshSession fails:
const { error } = await supabase.auth.refreshSession()
if (error) {
  // Force logout and show login modal
  await supabase.auth.signOut()
  setShowLoginModal(true)
  setUploadError('Session expired. Please login again.')
  return
}
```

---

## 🟡 Phase 2: Dashboard Enhancements (Priority: High)

### 2.1 Score Trend Visualization
**Goal**: Show performance trend over last 10-30 calls

**Backend Changes** (`app.py`, `database.py`):
```python
# New endpoint: GET /api/dashboard/trends
def get_score_trends(user_id, days=30):
    # Query analyses ordered by date
    # Return: [{ date, overall_score, call_id }]
```

**Frontend Changes** (`App.jsx` or new `DashboardTab.jsx`):
- Add line chart component (recharts or chart.js)
- Show score over time
- Highlight improvement/decline

### 2.2 Weakness Tracking Over Time
**Goal**: Track how weaknesses improve across calls

**Backend Changes**:
```python
# New endpoint: GET /api/dashboard/weakness-progress
def get_weakness_progress(user_id):
    # Aggregate coaching_areas across calls
    # Track frequency and score changes
    # Return: [{ area, occurrences, avg_score_change }]
```

**Frontend Changes**:
- Bar chart showing weakness frequency
- Progress indicators for each area

### 2.3 Team Comparison (Manager View)
**Goal**: Compare team members' performance

**Backend Changes**:
```python
# New endpoint: GET /api/dashboard/team (requires manager role)
def get_team_stats(manager_id):
    # Get all users under manager
    # Aggregate their stats
    # Return comparison data
```

**Database Changes**:
- Add `role` column to users or create `team_members` table
- Add manager relationship

---

## 🟡 Phase 3: Call History Improvements (Priority: High)

### 3.1 Search/Filter Functionality
**Goal**: Find calls by name, date, score, status

**Frontend Changes** (`App.jsx`):
```jsx
// Add search bar and filter dropdowns
<input placeholder="Search calls..." onChange={handleSearch} />
<select onChange={handleFilterByStatus}>
  <option value="all">All</option>
  <option value="analyzed">Analyzed</option>
  <option value="transcribed">Transcribed</option>
</select>
<select onChange={handleFilterByScore}>
  <option value="all">All Scores</option>
  <option value="high">High (80+)</option>
  <option value="medium">Medium (50-79)</option>
  <option value="low">Low (0-49)</option>
</select>
```

**Backend Changes**:
```python
# Modify GET /api/calls to accept query params
@app.route('/api/calls')
def list_calls():
    search = request.args.get('search', '')
    status = request.args.get('status', '')
    min_score = request.args.get('min_score', 0)
    max_score = request.args.get('max_score', 100)
    # Apply filters to query
```

### 3.2 Delete Call Option
**Goal**: Allow users to delete calls with confirmation

**Backend Changes** (`app.py`):
```python
@app.route('/api/calls/<call_id>', methods=['DELETE'])
def delete_call(call_id):
    user_id = get_user_id_from_token()
    # Delete from storage first
    # Delete analysis (CASCADE should handle)
    # Delete call record
    return jsonify({'success': True})
```

**Frontend Changes**:
- Add delete button with trash icon
- Confirmation modal
- Remove from local state after delete

### 3.3 Bulk Operations
**Goal**: Select multiple calls for bulk delete/export

**Frontend Changes**:
```jsx
// Add checkbox to each call row
// Add "Select All" header checkbox
// Add bulk action bar when items selected
<BulkActionBar 
  selectedCount={selectedCalls.length}
  onDelete={handleBulkDelete}
  onExport={handleBulkExport}
/>
```

---

## 🟢 Phase 4: Practice Session Persistence (Priority: Medium)

### 4.1 Session Persistence to Database
**Goal**: Save practice progress so users can resume

**Database Changes** (`supabase_setup.sql`):
```sql
-- Already exists: practice_sessions table
-- Add more fields if needed:
ALTER TABLE practice_sessions ADD COLUMN IF NOT EXISTS
    exercises_data JSONB DEFAULT '{}';
```

**Backend Changes**:
- Ensure `/api/practice-sessions` saves exercise state
- Add resume capability

### 4.2 Progress Tracking Across Sessions
**Goal**: Track cumulative progress over time

**Database Changes**:
```sql
CREATE TABLE IF NOT EXISTS practice_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    skill_name TEXT,
    total_exercises INTEGER DEFAULT 0,
    completed_exercises INTEGER DEFAULT 0,
    average_score NUMERIC DEFAULT 0,
    last_practiced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Backend Changes**:
```python
# New endpoint: GET /api/practice/progress
def get_practice_progress(user_id):
    # Return cumulative stats per skill
```

### 4.3 Gamification (XP, Streaks)
**Goal**: Motivate users with XP points and streaks

**Database** (already exists: `users_xp` table):
```sql
-- Verify structure:
-- id, user_id, total_xp, current_streak, longest_streak, last_practice_date
```

**Backend Changes**:
```python
# Update XP after each practice session
def award_xp(user_id, xp_amount, activity_type):
    # Add XP
    # Check/update streak
    # Return new totals
```

**Frontend Changes**:
- XP display in header/dashboard
- Streak indicator
- Level badges

---

## 🟢 Phase 5: Export Features (Priority: Medium)

### 5.1 PDF Report Generation
**Goal**: Export call analysis as professional PDF

**Backend Changes** (`pdf_generator.py` - already exists!):
```python
# Verify/enhance existing PDF generator
# Should include:
# - Call summary
# - Score breakdown
# - Key moments
# - Objections handled
# - Recommendations
```

**New Endpoint**:
```python
@app.route('/api/calls/<call_id>/export/pdf')
def export_call_pdf(call_id):
    # Generate PDF
    # Return file download
```

### 5.2 CSV Export for Calls
**Goal**: Export call list/data as CSV

**Backend Changes**:
```python
@app.route('/api/calls/export/csv')
def export_calls_csv():
    # Get all calls with basic metrics
    # Format as CSV
    # Return file download
```

**CSV Fields**:
- Call ID, Name, Date, Duration
- Overall Score, Risk Level
- Top Weakness, Top Strength
- Status

---

## Implementation Order

| Order | Task | Estimated Time |
|-------|------|----------------|
| 1 | Auth token refresh fix | 30 min |
| 2 | Call History - Delete call | 1 hour |
| 3 | Call History - Search/filter | 2 hours |
| 4 | Dashboard - Score trends | 2 hours |
| 5 | Dashboard - Weakness tracking | 2 hours |
| 6 | Practice - Session persistence | 2 hours |
| 7 | Export - PDF generation | 2 hours |
| 8 | Export - CSV export | 1 hour |
| 9 | Call History - Bulk operations | 2 hours |
| 10 | Practice - Gamification | 3 hours |
| 11 | Dashboard - Team comparison | 3 hours |

**Total Estimated Time**: ~20 hours

---

## Files to Modify

### Backend
- `app.py` - New endpoints, auth improvements
- `database.py` - New query functions
- `pdf_generator.py` - Enhance PDF output

### Frontend
- `frontend/src/App.jsx` - Main app improvements
- `frontend/src/components/Dashboard.jsx` (new) - Dashboard components
- `frontend/src/components/CallHistory.jsx` (new) - Dedicated call history
- `frontend/src/components/ExportButtons.jsx` (new) - Export UI

### Database
- `supabase_setup.sql` - New tables/columns

---

## Progress Tracking

- [ ] Phase 1: Auth Fix
- [ ] Phase 2: Dashboard
- [ ] Phase 3: Call History
- [ ] Phase 4: Practice Persistence
- [ ] Phase 5: Export Features

