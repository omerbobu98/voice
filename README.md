# Sales Call Analyzer

Web application for analyzing sales calls with automatic transcription, speaker diarization, and role classification.

## Features
- Upload audio recordings of sales calls
- Automatic transcription with timestamps
- Speaker diarization (identify multiple speakers)
- Automatic classification of speakers as Seller or Buyer
- Clean, modern UI to view transcription results

## Setup

### Backend
1. Create virtual environment: `python3 -m venv venv`
2. Activate: `source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and add your API keys:
   - Get AssemblyAI API key from: https://www.assemblyai.com/
   - Get OpenAI API key from: https://platform.openai.com/
5. Run: `python app.py`

### Frontend
1. Navigate to frontend: `cd frontend`
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`

## API Keys Required
- **AssemblyAI**: For accurate transcription with speaker diarization
- **OpenAI**: For intelligent speaker role classification (seller vs buyer)
