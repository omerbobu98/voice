# Technical Context: SalesAI

## Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Port**: 5001 (avoiding macOS AirPlay conflict on 5000)
- **APIs**:
  - AssemblyAI - Transcription, speaker diarization, sentiment analysis
  - OpenAI GPT-5.2 - Speaker classification and deep analysis

### Frontend
- **Framework**: React (Vite)
- **Port**: 3000
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Key Dependencies

#### Backend (requirements.txt)
```
flask
flask-cors
assemblyai
openai>=1.40.0
python-dotenv
gunicorn
```

#### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "axios": "^1.6.0",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "tailwindcss": "^3.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

## Environment Variables
```
ASSEMBLYAI_API_KEY=your_assemblyai_key
OPENAI_API_KEY=your_openai_key
```

## Development Setup

### Backend
```bash
cd /Users/omerbuzaglo/Documents/audio-new
source venv/bin/activate
python app.py
```

### Frontend
```bash
cd /Users/omerbuzaglo/Documents/audio-new/frontend
npm run dev
```

## API Endpoints

### POST /api/upload
- Upload audio file for transcription
- Returns: `{ job_id: string }`

### GET /api/status/:job_id
- Poll for job status
- Returns: `{ status, progress, stage, result, error }`

### POST /api/analyze/:job_id
- Start deep AI analysis on completed transcription
- Returns: `{ analysis_id: string }`

### GET /api/health
- Health check endpoint

## Technical Constraints

### OpenAI GPT-5.2
- Uses `max_completion_tokens` instead of `max_tokens`
- Requires JSON response parsing (may be wrapped in markdown)

### AssemblyAI
- Uses `SpeechModel.best` for highest accuracy
- Word boost for sales terminology
- Sentiment analysis enabled
- Entity detection enabled

### File Handling
- Uploads stored temporarily in `uploads/` folder
- Files deleted after processing

## Key Technical Decisions
1. **Async processing** - Threading for non-blocking transcription
2. **Polling mechanism** - Frontend polls every 1 second for updates
3. **Separate analysis** - Analysis runs separately from transcription
4. **JSON response cleaning** - Strip markdown wrappers from AI responses
