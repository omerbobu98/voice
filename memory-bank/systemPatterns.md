# System Patterns: SalesAI

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React Frontend │────▶│   Flask Backend  │────▶│   External APIs  │
│   (Port 3000)    │◀────│   (Port 5001)    │◀────│ AssemblyAI/OpenAI│
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Key Design Patterns

### 1. Async Job Processing
- User uploads file → immediate job_id returned
- Background thread processes audio
- Frontend polls `/api/status/:job_id` every 1 second
- Progress updates: 0% → 10% → 50% → 80% → 90% → 95% → 100%

```python
# Backend pattern
jobs[job_id] = {
    'status': 'processing',  # uploading, processing, completed, error
    'progress': 0,           # 0-100
    'stage': 'Stage name',   # Human-readable stage
    'result': None,          # Final result object
    'error': None            # Error message if failed
}
```

### 2. Two-Phase Processing
**Phase 1: Transcription**
- Upload audio → AssemblyAI transcription → Speaker classification
- Result: transcription + utterances + speaker_roles

**Phase 2: Analysis (On-demand)**
- User clicks "Analyze Call" → Deep AI analysis
- Result: metrics + objections + scores + suggestions

### 3. Speaker Classification Flow
```
Utterances → Calculate Statistics → Build Prompt → GPT Classification → Role Mapping
```

Statistics collected:
- Word count per speaker
- Question count
- Sentiment distribution (positive/negative/neutral)
- First appearance order
- Average utterance length

### 4. AI Sales Coach Analysis
```python
analyze_sales_call(utterances, speaker_roles, openai_client)
├── calculate_talk_metrics()  # Talk ratio, duration, word counts
├── build_analysis_transcript()  # Format for AI
└── perform_ai_analysis()  # Comprehensive GPT analysis
```

## Component Relationships

### Backend Files
```
app.py                 # Main Flask app, routes, job management
sales_analyzer.py      # AI Sales Coach logic, prompts, analysis
```

### Frontend Structure
```
frontend/
├── src/
│   ├── App.jsx       # Main component, all views
│   ├── main.jsx      # Entry point
│   └── index.css     # Global styles
├── index.html
└── vite.config.js
```

## State Management (Frontend)

```javascript
// Core states
const [file, setFile] = useState(null)
const [loading, setLoading] = useState(false)
const [result, setResult] = useState(null)
const [jobId, setJobId] = useState(null)

// Analysis states
const [analyzing, setAnalyzing] = useState(false)
const [analysisResult, setAnalysisResult] = useState(null)
const [showAnalysis, setShowAnalysis] = useState(false)
```

### View Logic
```
!file && !loading && !result → Upload View
loading → Loading View (with progress)
analyzing → Analysis Loading View
result && !showAnalysis → Transcription View (with "Analyze" button)
showAnalysis && analysisResult → Analysis Results View
```

## Critical Implementation Paths

### 1. Transcription Pipeline
```
Upload → AssemblyAI Config → Transcribe → Extract Utterances → Classify Speakers
```

AssemblyAI Config:
- `speaker_labels=True`
- `speech_model=SpeechModel.best`
- `sentiment_analysis=True`
- `entity_detection=True`
- `word_boost` for sales terms

### 2. Analysis Pipeline
```
Utterances + Roles → Build Transcript → SALES_COACH_SYSTEM_PROMPT → GPT-5.2 → Parse JSON
```

Analysis output structure:
```json
{
  "call_summary": { "one_liner", "outcome", "key_topics" },
  "objections": [{ "type", "buyer_statement", "seller_response", "better_response" }],
  "meddic_score": { "metrics", "economic_buyer", ... "total_score" },
  "bant_score": { "budget", "authority", "need", "timeline", "overall_qualified" },
  "seller_performance": { "overall_score", "strengths", "improvements" },
  "coaching_suggestions": [{ "priority", "area", "suggested_change", "example_script" }],
  "better_responses": [{ "original", "improved", "technique_used" }],
  "deal_risk_score": { "score", "risk_level", "risk_factors", "positive_signals" },
  "next_steps_recommended": []
}
```

## Error Handling Patterns

### Backend
- Try/except with traceback logging
- Job status set to 'error' with error message
- Fallback values for failed analysis

### Frontend
- Error state displayed in UI
- Console logging for debugging
- Graceful degradation (show what's available)

## UI Patterns

### Color Coding
- **Seller**: Blue (`blue-500`)
- **Buyer**: Emerald (`emerald-500`)
- **Objections**: Orange (`orange-500`)
- **Better Response**: Emerald (`emerald-500`)
- **Risk High**: Red, Medium: Yellow, Low: Green

### Card Pattern
```jsx
<div className="bg-gradient-to-b from-white/[0.08] to-white/[0.02] rounded-3xl p-6 border border-white/10">
  {/* Content */}
</div>
```
