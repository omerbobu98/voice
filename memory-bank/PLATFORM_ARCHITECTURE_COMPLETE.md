# 🏗️ VLOCE Platform - Complete Architecture Documentation

> **Version**: 1.0 | **Last Updated**: January 2026 | **Purpose**: Scaling & Development Reference

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Call Analysis System](#call-analysis-system)
5. [Analysis Tabs](#analysis-tabs)
   - [Overview Tab](#1-overview-tab)
   - [Transcript Tab](#2-transcript-tab)
   - [Deep Insights Tab](#3-deep-insights-tab)
   - [Stories Tab](#4-stories-tab)
   - [Practice On Tab](#5-practice-on-tab)
6. [Call History](#call-history)
7. [Story Bank](#story-bank)
8. [Dashboard](#dashboard)
9. [AI Agent Live Coach](#ai-agent-live-coach)
10. [API Endpoints Reference](#api-endpoints-reference)
11. [Known Issues & Improvements](#known-issues--improvements)

---

## System Overview

**VLOCE** is an AI-powered sales coaching platform designed for home improvement sales teams. It analyzes sales calls, provides coaching insights, and helps salespeople practice their skills.

### Core Features
- 🎙️ **Audio Upload & Transcription** - Upload recorded calls for AI analysis
- 📊 **Deep AI Analysis** - Comprehensive analysis of sales performance
- 🎯 **Practice & Training** - Interactive roleplay and skill practice
- 📚 **Story Bank** - Personal library of sales stories
- 🤖 **AI Live Coach** - Real-time coaching during calls

### Architecture Pattern
```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  React + Vite + TailwindCSS (Netlify: vloce.netlify.app)        │
└─────────────────────────┬───────────────────────────────────────┘
                          │ HTTPS/REST API
┌─────────────────────────▼───────────────────────────────────────┐
│                         BACKEND                                  │
│  Flask + Python (Railway: web-production-3215.up.railway.app)   │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   Supabase    │ │  AssemblyAI   │ │    OpenAI     │
│   Database    │ │ Transcription │ │   Analysis    │
│   + Storage   │ │               │ │   + TTS       │
└───────────────┘ └───────────────┘ └───────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **Vite** | Build tool |
| **TailwindCSS** | Styling |
| **Lucide React** | Icons |
| **Axios** | HTTP Client |
| **Supabase JS** | Auth & Real-time |
| **React Router** | Navigation |

### Backend
| Technology | Purpose |
|------------|---------|
| **Flask** | Web Framework |
| **Flask-SocketIO** | WebSocket Support |
| **Flask-CORS** | Cross-Origin Support |
| **AssemblyAI SDK** | Audio Transcription |
| **OpenAI SDK** | GPT Analysis & TTS |
| **Supabase Python** | Database Client |
| **PyJWT** | Token Verification |

### External Services
| Service | Purpose | API Key Env Var |
|---------|---------|-----------------|
| **AssemblyAI** | Audio transcription with speaker diarization | `ASSEMBLYAI_API_KEY` |
| **OpenAI** | GPT-4/GPT-4o for analysis, TTS-HD for audio | `OPENAI_API_KEY` |
| **Deepgram** | Real-time transcription (AI Agent) | `DEEPGRAM_API_KEY` |
| **Supabase** | Database, Auth, Storage | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` |

---

## Database Schema

### Primary Tables

#### `calls` Table
```sql
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    file_name TEXT NOT NULL,
    audio_url TEXT,                    -- Supabase Storage URL
    duration_seconds INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    speakers_count INTEGER DEFAULT 2,
    transcription TEXT,                -- Full text transcript
    utterances JSONB DEFAULT '[]',     -- Speaker-segmented transcript
    speaker_roles JSONB DEFAULT '{}',  -- Speaker A → "Seller", B → "Buyer"
    status TEXT DEFAULT 'transcribed', -- transcribed | analyzed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `analyses` Table
```sql
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    user_id UUID,
    seller_talk_percentage NUMERIC DEFAULT 50,
    buyer_talk_percentage NUMERIC DEFAULT 50,
    total_duration_seconds INTEGER DEFAULT 0,
    overall_score INTEGER DEFAULT 0,
    meddic_score INTEGER DEFAULT 0,
    bant_score INTEGER DEFAULT 0,
    bant_qualified BOOLEAN DEFAULT FALSE,
    deal_risk_level TEXT DEFAULT 'medium',
    deal_risk_score INTEGER DEFAULT 50,
    metrics JSONB DEFAULT '{}',        -- Talk ratio, duration, etc.
    analysis JSONB DEFAULT '{}',       -- Full AI analysis results
    objection_types TEXT[] DEFAULT '{}',
    objection_count INTEGER DEFAULT 0,
    coaching_areas TEXT[] DEFAULT '{}',
    strengths TEXT[] DEFAULT '{}',
    improvements TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `story_bank` Table
```sql
CREATE TABLE story_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT DEFAULT 'Untitled Story',
    story_content TEXT NOT NULL,       -- Required field!
    content TEXT,                      -- Legacy compatibility
    original_story TEXT,
    target_emotions TEXT[] DEFAULT '{}',
    target_message TEXT,
    objection_type TEXT,
    product TEXT,
    structure JSONB DEFAULT '{}',      -- Story structure analysis
    setup_line TEXT,
    closing_bridge TEXT,
    explanation TEXT,
    tags TEXT[] DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT FALSE,
    used_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Cache Tables
```sql
-- Improvement guides cache
CREATE TABLE cached_guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID,
    skill_name TEXT,
    language TEXT DEFAULT 'en',
    guide_content JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(call_id, skill_name, language)
);

-- Grammar analysis cache
CREATE TABLE cached_grammar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID,
    language TEXT DEFAULT 'en',
    grammar_analysis JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(call_id, language)
);
```

---

## Call Analysis System

### Flow Diagram
```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│   Upload   │───▶│ Transcribe │───▶│   Analyze  │───▶│   Display  │
│   Audio    │    │ AssemblyAI │    │   OpenAI   │    │   Results  │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
     │                  │                 │                 │
     ▼                  ▼                 ▼                 ▼
  /api/upload    process_audio_async  /api/analyze    AnalysisInsights
  Job created    Speaker diarization  GPT-4 analysis  5 tabs display
```

### Step 1: File Upload

**Frontend**: `App.jsx` → `handleUpload()`
```javascript
const handleUpload = async () => {
  const formData = new FormData()
  formData.append('audio', file)
  
  // Refresh session before upload
  await supabase.auth.refreshSession()
  const headers = await getAuthHeaders()
  
  const response = await axios.post(`${API_URL}/api/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data', ...headers }
  })
  
  const jobId = response.data.job_id
  // Poll for status...
}
```

**Backend**: `app.py` → `/api/upload`
```python
@app.route('/api/upload', methods=['POST'])
def upload_audio():
    user_id = get_user_id_from_token()  # JWT from header
    job_id = str(uuid.uuid4())
    filepath = os.path.join(UPLOAD_FOLDER, f"{job_id}_{audio_file.filename}")
    
    jobs[job_id] = {
        'status': 'uploading',
        'progress': 0,
        'stage': 'Uploading file...',
        'user_id': user_id
    }
    
    # Start async processing
    thread = threading.Thread(target=process_audio_async, args=(job_id, filepath, user_id))
    thread.start()
    
    return jsonify({'job_id': job_id})
```

### Step 2: Transcription (AssemblyAI)

**Backend**: `app.py` → `process_audio_async()`
```python
def process_audio_async(job_id, filepath, user_id):
    config = aai.TranscriptionConfig(
        speaker_labels=True,           # Speaker diarization
        speech_model=aai.SpeechModel.best,
        punctuate=True,
        format_text=True,
        language_code="en",
        word_boost=["sale", "price", "discount", ...],  # Sales vocabulary
        sentiment_analysis=True,
        entity_detection=True
    )
    
    transcriber = aai.Transcriber()
    transcript = transcriber.submit(filepath, config=config)
    
    # Poll until complete...
    # Extract utterances with speaker labels
    # Classify speakers (Seller vs Buyer)
    # Upload audio to Supabase Storage
    # Save to database
```

**Speaker Classification**: `classify_speakers()`
- Analyzes talk patterns
- First speaker → Seller (usually starts the call)
- Can be manually corrected

### Step 3: AI Analysis (OpenAI)

**Backend**: `app.py` → `/api/analyze/<job_id>`
```python
@app.route('/api/analyze/<job_id>', methods=['POST'])
def analyze_call(job_id):
    # Load utterances and speaker roles
    # Start analysis in background thread
    thread = threading.Thread(
        target=run_deep_analysis,
        args=(analysis_id, utterances, speaker_roles, call_id, user_id)
    )
```

**Analysis Engine**: `sales_analyzer.py` → `analyze_sales_call()`
```python
def analyze_sales_call(utterances, speaker_roles, openai_client):
    metrics = calculate_talk_metrics(utterances, speaker_roles)
    transcript = build_analysis_transcript(utterances, speaker_roles)
    analysis = perform_ai_analysis(transcript, metrics, openai_client)
    
    return {'metrics': metrics, 'analysis': analysis}
```

**AI Model Used**: `gpt-4o` or `gpt-5.2` (latest available)

**Analysis Output Structure**:
```json
{
  "metrics": {
    "talk_ratio": { "seller_percentage": 65, "buyer_percentage": 35 },
    "total_duration_seconds": 3600
  },
  "analysis": {
    "seller_performance": { "overall_score": 75, "strengths": [], "improvements": [] },
    "objections": [{ "type": "price", "handling_score": 6, "better_response": "..." }],
    "better_responses": [],
    "buying_signals_detected": { "signals_found": [] },
    "deal_risk_score": { "risk_level": "medium", "score": 50 },
    "call_summary": { "one_liner": "...", "key_decisions": [] },
    "storytelling_analysis": [],
    "methodology_score": { "sales_tactics_score": {}, "knowledge_score": {} },
    "coaching_suggestions": [],
    "practice_recommendations": {}
  }
}
```

---

## Analysis Tabs

### Component Hierarchy
```
App.jsx
└── AnalysisInsights.jsx (Main container)
    ├── [Overview Tab]
    │   ├── AISummaryCard.jsx
    │   ├── SkillRadarChart.jsx
    │   ├── TopicFrequencyChart.jsx
    │   └── TalkPatternChart.jsx
    ├── [Transcript Tab]
    │   └── Built into AnalysisInsights.jsx
    ├── [Deep Insights Tab]
    │   └── DeepInsightsTab.jsx
    ├── [Stories Tab]
    │   └── StoryLibrary.jsx
    └── [Practice On Tab]
        └── PracticeOnTab.jsx → PracticeOnTabMain.jsx
            ├── SkillPracticeCard.jsx
            ├── RoleplayCard.jsx
            ├── InteractiveRoleplay.jsx
            ├── ExerciseCard.jsx
            └── StoryEnhancer.jsx
```

---

### 1. Overview Tab

**Purpose**: High-level summary of call performance

**Components**:

#### `AISummaryCard.jsx`
| Data Source | Field |
|-------------|-------|
| `analysisResult.analysis.call_summary` | `one_liner`, `key_decisions` |
| `analysisResult.analysis.customer_interest` | Interest level |
| `analysisResult.analysis.deal_risk_score` | Risk level & score |
| `analysisResult.analysis.next_steps_recommended` | Action items |
| `analysisResult.analysis.key_moments` | Important timestamps |

**Features**:
- ✅ TTS button to listen to summary (OpenAI TTS-HD)
- ✅ Copy to clipboard
- ✅ Expandable sections

**Audio Integration**: 
- Uses `TTSButton` prop passed from `AnalysisInsights`
- Calls `/api/tts` endpoint with `hd: true`

#### `SkillRadarChart.jsx`
- Displays methodology scores (Sales Tactics, Knowledge, Control, etc.)
- Data from `analysisResult.analysis.methodology_score`

#### `TopicFrequencyChart.jsx`
- Shows topics discussed frequency
- Data from `analysisResult.analysis.topics_discussed`

#### `TalkPatternChart.jsx`
- Talk ratio visualization (Seller vs Buyer)
- Data from `analysisResult.metrics.talk_ratio`

---

### 2. Transcript Tab

**Purpose**: Full conversation transcript with playback

**Location**: Built into `AnalysisInsights.jsx` (not a separate component)

**Data Flow**:
```
result.utterances → Map through → Display with speaker roles
result.speaker_roles → Color coding (Seller = purple, Buyer = green)
```

**Features**:
- ✅ Click timestamp to seek audio (`onSeek` prop)
- ✅ Speaker color coding
- ✅ Sentiment indicators (if available)
- ✅ Search/filter (if implemented)

**Audio Integration**:
- `onSeek(timestamp_ms)` → Seeks main audio player
- Main audio player is in `App.jsx` with the call's `audio_url`

---

### 3. Deep Insights Tab

**Component**: `DeepInsightsTab.jsx`

**Purpose**: Detailed analysis of objections, better responses, and buying signals

**Props**:
```javascript
{ analysisResult, onSeek, TTSButton }
```

**Data Sources**:
| Feature | Data Path |
|---------|-----------|
| Objections | `analysisResult.analysis.objections` |
| Better Responses | `analysisResult.analysis.better_responses` |
| Buying Signals | `analysisResult.analysis.buying_signals_detected.signals_found` |

**Objection Structure**:
```json
{
  "type": "price",
  "surface_objection": "That's too expensive",
  "real_concern": "Not seeing the value",
  "buyer_statement": "...",
  "seller_response": "...",
  "handling_score": 6,
  "better_response": "Let me tell you about David...",
  "technique_to_use": "Feel-Felt-Found",
  "timestamp": "15:30",
  "timestamp_ms": 930000,
  "was_preventable": true,
  "how_to_prevent": "Build more value before price reveal"
}
```

**Features**:
- ✅ Expandable objection cards
- ✅ Click timestamp to seek audio
- ✅ TTS for better responses
- ✅ Copy to clipboard
- ✅ Handling score visualization
- ✅ Objection type badges (color-coded)

**Audio Integration**:
- `TTSButton` for playing better responses
- `onSeek(timestamp_ms)` for jumping to objection moment

---

### 4. Stories Tab

**Component**: `StoryLibrary.jsx`

**Purpose**: Analyze stories told during the call and suggest improvements

**Props**:
```javascript
{ stories, onSeek, TTSButton, lang }
```

**Data Source**: `analysisResult.analysis.storytelling_analysis`

**Story Structure**:
```json
{
  "story_type": "customer_success",
  "content": "Let me tell you about David...",
  "timestamp": "25:00",
  "timestamp_ms": 1500000,
  "score": 7,
  "elements_present": ["relatable_character", "specific_results"],
  "missing_elements": ["emotional_payoff", "cost_of_waiting"],
  "improvement_suggestion": "Add what happened when he waited..."
}
```

**6 Story Elements (Framework)**:
1. **Relatable Character** - Someone similar to customer
2. **Same Hesitation** - They had the same objection
3. **Decision Moment** - What made them decide
4. **Cost of Waiting** - What they lost by waiting
5. **Specific Results** - Numbers, timeframes
6. **Emotional Payoff** - How they feel now

**Features**:
- ✅ Story score visualization
- ✅ Missing elements highlighting
- ✅ TTS playback for stories
- ✅ Filter by story type
- ✅ Copy to clipboard

**Audio Integration**:
- `TTSButton` for playing original stories
- `onSeek` for jumping to story timestamp

---

### 5. Practice On Tab

**Component**: `PracticeOnTab.jsx` → `PracticeOnTabMain.jsx`

**Purpose**: Personalized practice exercises based on call weaknesses

**Props**:
```javascript
{ analysisResult, result, TTSButton }
```

**Sub-tabs**:
| Tab | Component | Purpose |
|-----|-----------|---------|
| Overview | Built-in | Summary of practice areas |
| Areas to Improve | `SkillPracticeCard.jsx` | Detailed skill practice |
| Roleplay | `InteractiveRoleplay.jsx` | AI-powered practice |
| Stories | `StoryEnhancer.jsx` | Improve storytelling |
| Grammar | Built-in | Grammar correction |

#### Practice Data Generation

**API Endpoint**: `POST /api/generate-practice`

**Input**: Full analysis result

**Output**:
```json
{
  "practice_areas": [
    {
      "skill_name": "Objection Handling",
      "priority": "critical",
      "current_score": 45,
      "target_score": 80,
      "weakness_summary": "...",
      "specific_issues": [],
      "guide_key": "objection_handling",
      "practice_exercises": [
        {
          "exercise_type": "script_practice",
          "title": "Handle 'Too Expensive'",
          "ideal_response": "...",
          "technique": "Feel-Felt-Found"
        }
      ]
    }
  ],
  "roleplay_scenarios": [...],
  "daily_drills": [...],
  "action_items": [...]
}
```

#### SkillPracticeCard.jsx

**Purpose**: Deep-dive into specific skills with AI-generated improvement guides

**API Endpoint**: `POST /api/generate-improvement-guide`
```json
{
  "skill_name": "Objection Handling",
  "current_score": 45,
  "specific_issues": ["Early price reveal", "Weak closing"],
  "call_id": "uuid",
  "language": "en"
}
```

**Response**:
```json
{
  "guide": {
    "title": "Objection Handling Mastery",
    "overview": "...",
    "key_principles": ["...", "..."],
    "techniques": [
      {
        "name": "Feel-Felt-Found",
        "description": "...",
        "example": "...",
        "when_to_use": "..."
      }
    ],
    "practice_scripts": [
      { "scenario": "...", "script": "...", "tip": "..." }
    ],
    "common_mistakes": ["..."],
    "quick_wins": ["..."]
  }
}
```

**Caching**: Guides are cached in `cached_guides` table

**Features**:
- ✅ TTS for practice scripts
- ✅ Audio player with progress bar
- ✅ Stop button
- ✅ Loading timeout (8 sec) with fallback

#### InteractiveRoleplay.jsx

**Purpose**: AI-powered roleplay practice with real customer simulation

**API Endpoints**:
| Endpoint | Purpose |
|----------|---------|
| `POST /api/roleplay/respond` | Get AI customer response |
| `POST /api/roleplay/feedback` | Get session feedback |
| `POST /api/transcribe-quick` | Transcribe voice input |

**Flow**:
```
User speaks → Whisper transcription → Send to GPT
                                         ↓
                            AI Customer responds
                                         ↓
                            Continue until max_turns
                                         ↓
                            Get final feedback
```

**AI Customer Behavior**:
- Early turns (1-3): Resistant, stick to objection
- Middle turns (4-5): Show cracks if salesperson is good
- Final turns (6+): Move toward decision

**Features**:
- ✅ Voice input (Whisper transcription)
- ✅ Text input option
- ✅ Real-time feedback
- ✅ Session scoring (0-100)
- ✅ Technique tracking
- ✅ Grammar correction during practice

#### Grammar Analysis

**API Endpoints**:
| Endpoint | Purpose | Model |
|----------|---------|-------|
| `POST /api/grammar/correct` | Single text correction | GPT-4o-mini |
| `POST /api/grammar/analyze-conversation` | Full transcript analysis | GPT-4o |

**Grammar Analysis Output**:
```json
{
  "summary": {
    "total_errors": 5,
    "common_issues": ["Subject-verb agreement", "Article usage"],
    "overall_feedback": "Good effort with room for improvement"
  },
  "sentences": [
    {
      "original": "He don't want to buy",
      "corrected": "He doesn't want to buy",
      "has_errors": true,
      "corrections": [
        {
          "error_type": "grammar",
          "original": "don't",
          "corrected": "doesn't",
          "explanation": "Third person singular requires 'doesn't'"
        }
      ]
    }
  ]
}
```

**Features**:
- ✅ Auto-runs when Grammar tab selected
- ✅ TTS for corrected sentences
- ✅ Error type badges
- ✅ Cached in `cached_grammar` table

---

## Call History

**Location**: `App.jsx` - Calls Tab

**API Endpoint**: `GET /api/calls`

**Features**:
| Feature | Implementation |
|---------|----------------|
| List all calls | Fetch from Supabase, ordered by date |
| View call details | Click → Load call + analysis |
| Rename call | `POST /api/calls/<id>/rename` |
| Auto-generate name | `POST /api/calls/<id>/generate-name` |
| Delete call | Not implemented (should add) |
| Search/Filter | Not implemented (should add) |

**Call List Item Data**:
```javascript
{
  id: "uuid",
  file_name: "Customer Name - Project Type",
  duration_seconds: 3600,
  created_at: "2026-01-20T00:00:00Z",
  status: "analyzed",
  audio_url: "https://..."
}
```

**View Call Flow**:
```
viewCall(callId) → GET /api/calls/{callId}
                        ↓
              Returns { call, analysis }
                        ↓
              setResult(mappedResult)
              setAnalysisResult(analysis)
              setShowAnalysis(true)
```

---

## Story Bank

**Page**: `StoryBankPage.jsx`

**API Endpoints**:
| Endpoint | Purpose |
|----------|---------|
| `GET /api/story-bank` | List user's stories |
| `POST /api/story-bank` | Create new story |
| `PUT /api/story-bank/<id>` | Update story |
| `DELETE /api/story-bank/<id>` | Delete story |
| `POST /api/story-bank/generate` | AI-generate story |
| `POST /api/story-bank/improve` | Improve existing story |

**Views**:
1. **Library** - Browse saved stories
2. **Builder** - AI story generation
3. **Manual** - Write story manually

### Story Builder (AI Generation)

**Input**:
```json
{
  "raw_story": "Optional: rough story to improve",
  "target_message": "What you want to communicate",
  "target_emotions": ["trust", "urgency"],
  "objection_to_prevent": "price",
  "product": "cool_life"
}
```

**Output**:
```json
{
  "title": "The Johnson Family Story",
  "story_content": "Full story text...",
  "setup_line": "Let me tell you about the Johnsons...",
  "closing_bridge": "Does that make sense for your situation?",
  "structure": {
    "relatable_character": "...",
    "same_hesitation": "...",
    "decision_moment": "...",
    "cost_of_waiting": "...",
    "specific_results": "...",
    "emotional_payoff": "..."
  },
  "explanation": "Why this story works..."
}
```

**Features**:
- ✅ AI story generation
- ✅ Voice recording for story input
- ✅ TTS playback
- ✅ Filter by objection/product
- ✅ Track usage (success/fail)
- ✅ Favorite stories

**Database Requirement**: `story_content` column is NOT NULL - always send it!

---

## Dashboard

**Location**: `App.jsx` - Dashboard Tab

**API Endpoint**: `GET /api/dashboard`

**Data Returned**:
```json
{
  "total_calls": 14,
  "total_analyzed": 11,
  "avg_score": 72,
  "recent_calls": [...],
  "score_trend": [...],
  "top_weaknesses": ["Objection Handling", "Closing"],
  "top_strengths": ["Rapport Building", "Product Knowledge"]
}
```

**Backend Implementation**: `database.py` → `get_dashboard_stats()`

**Features Currently**:
- ✅ Basic stats (total calls, avg score)
- ✅ Recent calls list

**Features Needed**:
- ❌ Score trend chart
- ❌ Weakness tracking over time
- ❌ Comparison with team average
- ❌ Goals & progress tracking

---

## AI Agent Live Coach

**Page**: `AIAgentPage.jsx`

**Purpose**: Real-time coaching during live calls

**Technology Stack**:
| Component | Technology |
|-----------|------------|
| Audio Capture | Browser MediaRecorder API |
| Resampling | AudioWorklet (48kHz → 16kHz) |
| Transcription | Deepgram Nova-2 (real-time diarization) |
| Fallback | AssemblyAI if Deepgram unavailable |
| WebSocket | Flask-SocketIO |

**WebSocket URL** (Deepgram):
```
wss://api.deepgram.com/v1/listen?model=nova-2&diarize=true&encoding=linear16&sample_rate=16000
```

**Audio Settings**:
- Browser: 48kHz capture
- Resampled: 16kHz
- Gain: 8x amplification
- Chunks: 50ms (800 samples)
- Encoding: PCM16 little-endian

**Speaker Mapping**:
- Speaker 0 → Seller (purple)
- Speaker 1+ → Buyer (green)

**Features**:
- ✅ Real-time transcription
- ✅ Speaker diarization
- ✅ Talk ratio tracking
- ❌ Real-time coaching cards (TODO)
- ❌ Objection alerts (TODO)
- ❌ Phase tracking (TODO)

---

## API Endpoints Reference

### Call Management
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/upload` | Upload audio file |
| GET | `/api/status/<job_id>` | Check processing status |
| POST | `/api/analyze/<job_id>` | Start AI analysis |
| GET | `/api/calls` | List user's calls |
| GET | `/api/calls/<id>` | Get call with analysis |
| POST | `/api/calls/<id>/rename` | Rename call |
| POST | `/api/calls/<id>/generate-name` | Auto-generate name |

### Practice & Training
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/generate-practice` | Generate practice plan |
| POST | `/api/generate-improvement-guide` | Get skill guide |
| POST | `/api/practice-feedback` | Get feedback on practice |
| POST | `/api/transcribe-practice` | Transcribe practice audio |
| POST | `/api/roleplay/respond` | AI customer response |
| POST | `/api/roleplay/feedback` | Session feedback |

### Grammar
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/grammar/correct` | Correct single text |
| POST | `/api/grammar/analyze-conversation` | Analyze full transcript |

### Story Bank
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/story-bank` | List stories |
| POST | `/api/story-bank` | Create story |
| PUT | `/api/story-bank/<id>` | Update story |
| DELETE | `/api/story-bank/<id>` | Delete story |
| POST | `/api/story-bank/generate` | AI generate story |
| POST | `/api/story-bank/improve` | Improve story |

### Audio & TTS
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/tts` | Text-to-speech (OpenAI TTS-HD) |
| GET | `/api/audio/<filename>` | Serve audio files |
| POST | `/api/transcribe-quick` | Quick Whisper transcription |

### Dashboard & Admin
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/dashboard` | User dashboard stats |
| GET | `/api/health` | Health check |
| GET | `/api/debug/api-keys` | Check API key status |
| GET | `/api/admin/dashboard` | Admin stats (requires admin) |

---

## Known Issues & Improvements

### 🔴 Critical Issues

1. **File Upload Auth** - Session refresh added, but may still fail on long-expired tokens
   - **Fix**: Force re-login if refresh fails

2. **Analysis Duplication** - Fixed with upsert logic
   - **Verify**: Check that updates work correctly

### 🟡 Important Improvements

1. **Dashboard Enhancement**
   - Add score trend visualization
   - Add weakness tracking over time
   - Add team comparison (for managers)

2. **Call History**
   - Add search/filter functionality
   - Add delete call option
   - Add bulk operations

3. **AI Agent Live Coach**
   - Add coaching cards UI
   - Add objection detection alerts
   - Add call phase progress bar
   - Save session insights to database

4. **Practice Tab**
   - Add practice session persistence
   - Add progress tracking across sessions
   - Add leaderboard/gamification

### 🟢 Nice to Have

1. **Export Features**
   - PDF report generation
   - CSV export for calls

2. **Notifications**
   - Practice reminders
   - Weekly progress reports

3. **Integrations**
   - CRM integration
   - Calendar integration

---

## File Structure Reference

```
/Users/omerbuzaglo/Documents/audio-new/
├── app.py                    # Main Flask backend (4600+ lines)
├── database.py               # Supabase operations
├── sales_analyzer.py         # AI analysis logic
├── supabase_setup.sql        # Database schema
├── requirements.txt          # Python dependencies
├── Procfile                  # Railway deployment
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main app component
│   │   ├── components/
│   │   │   ├── analysis/    # Analysis tab components
│   │   │   │   ├── AnalysisInsights.jsx
│   │   │   │   ├── AISummaryCard.jsx
│   │   │   │   ├── DeepInsightsTab.jsx
│   │   │   │   ├── StoryLibrary.jsx
│   │   │   │   ├── PracticeOnTab.jsx
│   │   │   │   └── practice/
│   │   │   │       ├── PracticeOnTabMain.jsx
│   │   │   │       ├── SkillPracticeCard.jsx
│   │   │   │       ├── InteractiveRoleplay.jsx
│   │   │   │       └── ...
│   │   │   └── charts/      # Chart components
│   │   ├── pages/
│   │   │   ├── StoryBankPage.jsx
│   │   │   ├── AIAgentPage.jsx
│   │   │   └── ...
│   │   └── lib/
│   │       ├── config.js    # API URL, etc.
│   │       ├── supabase.js  # Supabase client
│   │       ├── translations.js
│   │       └── audioUtils.js
│   └── netlify.toml         # Netlify config
└── memory-bank/             # Documentation
```

---

## Environment Variables

### Backend (.env)
```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG...
SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_JWT_SECRET=your-jwt-secret
ASSEMBLYAI_API_KEY=your-assemblyai-key
OPENAI_API_KEY=sk-...
DEEPGRAM_API_KEY=your-deepgram-key
```

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_API_URL=https://web-production-3215.up.railway.app
```

---

*Document generated for VLOCE platform scaling and development reference.*
