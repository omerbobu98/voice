import os
import json
import time
import uuid
import jwt
import ssl
import base64
import certifi
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import websocket
import assemblyai as aai
from openai import OpenAI
from dotenv import load_dotenv
from pathlib import Path
import threading
from sales_analyzer import analyze_sales_call
from database import (
    save_call, save_analysis, get_all_calls, get_call_with_analysis, 
    get_dashboard_stats, test_connection, upload_audio_file,
    is_user_admin, get_user_role, get_all_users_with_stats, get_user_stats,
    get_user_calls, get_admin_dashboard_stats, update_user_role,
    # Live session functions
    create_live_session, get_live_session, update_live_session, end_live_session,
    get_user_live_sessions, save_live_insight, get_session_insights,
    save_transcript_chunk, get_session_transcript, get_active_session
)
from functools import wraps

load_dotenv()

# JWT secret for Supabase token verification
SUPABASE_JWT_SECRET = os.getenv('SUPABASE_JWT_SECRET')

def get_user_id_from_token():
    """Extract user_id from Authorization header JWT token"""
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    try:
        # Decode without verification for now (Supabase handles auth)
        # For production, verify with SUPABASE_JWT_SECRET
        decoded = jwt.decode(token, options={"verify_signature": False})
        return decoded.get('sub')  # 'sub' contains the user ID
    except Exception as e:
        print(f"JWT decode error: {e}")
        return None


def require_admin(f):
    """Decorator to require admin access for an endpoint"""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_user_id_from_token()
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        if not is_user_admin(user_id):
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated

app = Flask(__name__)

# Enhanced CORS configuration for production
CORS(app, 
     resources={r"/*": {"origins": "*"}},
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     expose_headers=["Content-Type", "Authorization"])

# Ensure CORS headers are always sent, even on errors
@app.after_request
def after_request(response):
    origin = request.headers.get('Origin', '*')
    response.headers.add('Access-Control-Allow-Origin', origin)
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Handle preflight OPTIONS requests explicitly
@app.route('/api/<path:path>', methods=['OPTIONS'])
def handle_options(path):
    response = app.make_default_options_response()
    return response

# Initialize Socket.IO for real-time transcription
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Store active WebSocket connections per client
streaming_connections = {}
streaming_connection_ready = {}

UPLOAD_FOLDER = 'uploads'
Path(UPLOAD_FOLDER).mkdir(exist_ok=True)

# Initialize API clients with error handling
ASSEMBLYAI_API_KEY = os.getenv('ASSEMBLYAI_API_KEY')
DEEPGRAM_API_KEY = os.getenv('DEEPGRAM_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

if ASSEMBLYAI_API_KEY:
    aai.settings.api_key = ASSEMBLYAI_API_KEY
else:
    print("[app] WARNING: ASSEMBLYAI_API_KEY not set")

openai_client = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
else:
    print("[app] WARNING: OPENAI_API_KEY not set")

jobs = {}

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.route('/api/debug/jobs', methods=['GET'])
def debug_jobs():
    """Debug endpoint to check current jobs"""
    job_summary = {}
    for job_id, job in jobs.items():
        job_summary[job_id] = {
            'status': job.get('status'),
            'progress': job.get('progress'),
            'stage': job.get('stage'),
            'error': job.get('error'),
            'has_result': job.get('result') is not None
        }
    return jsonify({'jobs_count': len(jobs), 'jobs': job_summary})

@app.route('/api/debug/api-keys', methods=['GET'])
def debug_api_keys():
    """Debug endpoint to check API key status"""
    # Test AssemblyAI connection
    assemblyai_test = None
    try:
        # Try to get account info
        import requests
        headers = {"authorization": ASSEMBLYAI_API_KEY}
        resp = requests.get("https://api.assemblyai.com/v2/transcript", headers=headers, timeout=10)
        assemblyai_test = {"status_code": resp.status_code, "working": resp.status_code in [200, 401]}
    except Exception as e:
        assemblyai_test = {"error": str(e)}
    
    return jsonify({
        'assemblyai_configured': bool(ASSEMBLYAI_API_KEY),
        'assemblyai_key_length': len(ASSEMBLYAI_API_KEY) if ASSEMBLYAI_API_KEY else 0,
        'assemblyai_key_prefix': ASSEMBLYAI_API_KEY[:8] + '...' if ASSEMBLYAI_API_KEY and len(ASSEMBLYAI_API_KEY) > 8 else 'NOT SET',
        'openai_configured': bool(OPENAI_API_KEY),
        'assemblyai_test': assemblyai_test
    })

@app.route('/api/debug/db', methods=['GET'])
def debug_db():
    """Debug endpoint to test Supabase connection"""
    result = test_connection()
    return jsonify(result)

@app.route('/api/debug/auth', methods=['GET'])
def debug_auth():
    """Debug endpoint to test auth token extraction"""
    auth_header = request.headers.get('Authorization', '')
    user_id = get_user_id_from_token()
    return jsonify({
        'has_auth_header': bool(auth_header),
        'auth_header_prefix': auth_header[:30] if auth_header else None,
        'user_id': user_id,
        'user_id_extracted': bool(user_id)
    })

@app.route('/api/debug/test-transcription', methods=['POST'])
def test_transcription():
    """Test AssemblyAI transcription with a small file"""
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    filepath = os.path.join(UPLOAD_FOLDER, f"test_{uuid.uuid4().hex[:8]}_{audio_file.filename}")
    audio_file.save(filepath)
    
    try:
        file_size = os.path.getsize(filepath)
        print(f"[test_transcription] File saved: {filepath}, Size: {file_size} bytes")
        
        config = aai.TranscriptionConfig(
            speaker_labels=True,
            punctuate=True,
            format_text=True
        )
        
        transcriber = aai.Transcriber()
        print(f"[test_transcription] Submitting to AssemblyAI...")
        
        # Use synchronous transcribe instead of submit
        transcript = transcriber.transcribe(filepath, config=config)
        
        print(f"[test_transcription] Result status: {transcript.status}")
        
        if os.path.exists(filepath):
            os.remove(filepath)
        
        if transcript.status == aai.TranscriptStatus.error:
            return jsonify({
                'success': False,
                'error': transcript.error,
                'status': str(transcript.status)
            })
        
        return jsonify({
            'success': True,
            'status': str(transcript.status),
            'text_preview': transcript.text[:500] if transcript.text else None,
            'duration': transcript.audio_duration,
            'utterances_count': len(transcript.utterances) if transcript.utterances else 0
        })
        
    except Exception as e:
        import traceback
        print(f"[test_transcription] ERROR: {e}")
        print(traceback.format_exc())
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/upload', methods=['POST'])
def upload_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    user_id = get_user_id_from_token()
    auth_header = request.headers.get('Authorization', 'MISSING')
    print(f"[upload_audio] User ID from token: {user_id}")
    print(f"[upload_audio] Auth header: {auth_header[:50] if auth_header else 'MISSING'}...")
    
    # Require authentication for upload
    if not user_id:
        print(f"[upload_audio] ERROR: No user_id extracted from token. Auth header: {auth_header[:100] if auth_header else 'MISSING'}")
        return jsonify({'error': 'Authentication required. Please log in again.'}), 401
    
    job_id = str(uuid.uuid4())
    filepath = os.path.join(UPLOAD_FOLDER, f"{job_id}_{audio_file.filename}")
    audio_file.save(filepath)
    
    jobs[job_id] = {
        'status': 'uploading',
        'progress': 0,
        'stage': 'Uploading file...',
        'result': None,
        'error': None,
        'filepath': filepath,
        'file_name': audio_file.filename,
        'user_id': user_id
    }
    
    thread = threading.Thread(target=process_audio_async, args=(job_id, filepath, user_id))
    thread.start()
    
    return jsonify({'job_id': job_id})

@app.route('/api/status/<job_id>', methods=['GET'])
def get_status(job_id):
    if job_id not in jobs:
        return jsonify({'error': 'Job not found'}), 404
    
    job = jobs[job_id]
    return jsonify({
        'status': job['status'],
        'progress': job['progress'],
        'stage': job['stage'],
        'result': job['result'],
        'error': job['error']
    })

@app.route('/api/analyze/<job_id>', methods=['POST'])
def analyze_call(job_id):
    """Run deep AI analysis on a completed transcription or saved call"""
    
    # Get user_id from token
    user_id = get_user_id_from_token()
    
    # Check if it's an in-memory job or a database call_id (UUID format)
    if job_id in jobs:
        # In-memory job from recent upload
        job = jobs[job_id]
        if job['status'] != 'completed' or not job['result']:
            return jsonify({'error': 'Transcription not ready'}), 400
        
        call_id = job.get('call_id') or job['result'].get('call_id')
        utterances = job['result']['utterances']
        speaker_roles = job['result']['speaker_roles']
        # Use user_id from job if not in token
        if not user_id:
            user_id = job.get('user_id')
    else:
        # Try to load from database (saved call)
        try:
            call_data = get_call_with_analysis(job_id)
            if not call_data or not call_data.get('call'):
                return jsonify({'error': 'Call not found'}), 404
            
            call = call_data['call']
            call_id = call['id']
            utterances = call.get('utterances', [])
            speaker_roles = call.get('speaker_roles', {})
            # Use user_id from call if not in token
            if not user_id:
                user_id = call.get('user_id')
            
            if not utterances:
                return jsonify({'error': 'No transcription data found'}), 400
        except Exception as db_err:
            print(f"[analyze_call] Database error: {db_err}")
            return jsonify({'error': f'Database error: {str(db_err)}'}), 500
    
    # Start analysis in background
    analysis_id = f"{job_id}_analysis"
    jobs[analysis_id] = {
        'status': 'analyzing',
        'progress': 0,
        'stage': 'Starting deep analysis...',
        'result': None,
        'error': None,
        'call_id': call_id,
        'user_id': user_id
    }
    
    thread = threading.Thread(
        target=run_deep_analysis,
        args=(analysis_id, utterances, speaker_roles, call_id, user_id)
    )
    thread.start()
    
    return jsonify({'analysis_id': analysis_id})

def run_deep_analysis(analysis_id, utterances, speaker_roles, call_id=None, user_id=None):
    """Run comprehensive sales analysis"""
    try:
        jobs[analysis_id]['progress'] = 10
        jobs[analysis_id]['stage'] = 'Analyzing conversation patterns...'
        
        # Perform comprehensive analysis
        sales_analysis = analyze_sales_call(utterances, speaker_roles, openai_client)
        
        jobs[analysis_id]['progress'] = 90
        jobs[analysis_id]['stage'] = 'Saving results...'
        
        # Save to database with user_id
        if call_id:
            save_analysis(call_id, sales_analysis.get('metrics', {}), sales_analysis, user_id)
        
        jobs[analysis_id]['progress'] = 100
        jobs[analysis_id]['stage'] = 'Analysis complete!'
        jobs[analysis_id]['status'] = 'completed'
        jobs[analysis_id]['result'] = sales_analysis
        
    except Exception as e:
        import traceback
        print(f"Error in analysis: {e}")
        print(traceback.format_exc())
        jobs[analysis_id]['status'] = 'error'
        jobs[analysis_id]['error'] = str(e)

def process_audio_async(job_id, filepath, user_id=None):
    try:
        print(f"[process_audio] Starting job {job_id} for file: {filepath}")
        print(f"[process_audio] User ID received: {user_id}")
        
        # Verify file exists
        if not os.path.exists(filepath):
            print(f"[process_audio] ERROR: File not found: {filepath}")
            jobs[job_id]['status'] = 'error'
            jobs[job_id]['error'] = f'File not found: {filepath}'
            return
        
        file_size = os.path.getsize(filepath)
        print(f"[process_audio] File size: {file_size} bytes")
        
        jobs[job_id]['status'] = 'processing'
        jobs[job_id]['progress'] = 10
        jobs[job_id]['stage'] = 'Uploading to AssemblyAI...'
        
        config = aai.TranscriptionConfig(
            speaker_labels=True,
            speakers_expected=None,
            speech_model=aai.SpeechModel.best,
            punctuate=True,
            format_text=True,
            language_code="en",
            word_boost=["sale", "price", "discount", "offer", "deal", "contract", "payment", "budget", "interested", "proposal", "solution", "problem", "need", "want", "cost", "value"],
            boost_param="high",
            sentiment_analysis=True,
            entity_detection=True
        )
        
        transcriber = aai.Transcriber()
        
        jobs[job_id]['progress'] = 20
        jobs[job_id]['stage'] = 'Queued for transcription...'
        
        print(f"[process_audio] Submitting to AssemblyAI...")
        transcript = transcriber.submit(filepath, config=config)
        print(f"[process_audio] Submitted. Transcript ID: {transcript.id}, Status: {transcript.status}")
        
        # Add timeout counter (max 10 minutes = 300 iterations * 2 seconds)
        max_iterations = 300
        iteration = 0
        
        while transcript.status not in [aai.TranscriptStatus.completed, aai.TranscriptStatus.error]:
            iteration += 1
            if iteration > max_iterations:
                print(f"[process_audio] ERROR: Timeout waiting for transcription")
                jobs[job_id]['status'] = 'error'
                jobs[job_id]['error'] = 'Transcription timeout - took longer than 10 minutes'
                return
            
            transcript = aai.Transcript.get_by_id(transcript.id)
            print(f"[process_audio] Poll {iteration}: Status = {transcript.status}")
            
            if transcript.status == aai.TranscriptStatus.queued:
                jobs[job_id]['progress'] = 25
                jobs[job_id]['stage'] = 'In queue...'
            elif transcript.status == aai.TranscriptStatus.processing:
                jobs[job_id]['progress'] = min(jobs[job_id]['progress'] + 5, 70)
                jobs[job_id]['stage'] = 'Transcribing audio...'
            
            time.sleep(2)
        
        if transcript.status == aai.TranscriptStatus.error:
            jobs[job_id]['status'] = 'error'
            jobs[job_id]['error'] = transcript.error
            return
        
        jobs[job_id]['progress'] = 75
        jobs[job_id]['stage'] = 'Identifying speakers...'
        
        utterances = []
        sentiment_map = {}
        sentiment_list = transcript.sentiment_analysis or []
        for sa in sentiment_list:
            key = (sa.start, sa.end)
            sentiment_map[key] = {'sentiment': sa.sentiment.value, 'confidence': sa.confidence}
        
        utterance_list = transcript.utterances or []
        for utterance in utterance_list:
            sentiment_info = None
            for (start, end), sent_data in sentiment_map.items():
                if start >= utterance.start and end <= utterance.end:
                    sentiment_info = sent_data
                    break
            
            utterances.append({
                'speaker': utterance.speaker,
                'text': utterance.text,
                'start': utterance.start,
                'end': utterance.end,
                'sentiment': sentiment_info['sentiment'] if sentiment_info else 'neutral',
                'confidence': utterance.confidence if hasattr(utterance, 'confidence') else None
            })
        
        jobs[job_id]['progress'] = 90
        jobs[job_id]['stage'] = 'Classifying seller vs buyer...'
        
        speaker_roles = classify_speakers(utterances)
        
        jobs[job_id]['progress'] = 93
        jobs[job_id]['stage'] = 'Uploading audio to storage...'
        
        # Upload audio file to Supabase Storage
        audio_url = upload_audio_file(filepath, user_id)
        if audio_url:
            print(f"[process_audio] Audio uploaded: {audio_url}")
        else:
            print(f"[process_audio] WARNING: Failed to upload audio to storage")
        
        jobs[job_id]['progress'] = 95
        jobs[job_id]['stage'] = 'Saving to database...'
        
        audio_duration = transcript.audio_duration if transcript.audio_duration else 0
        
        word_count = len(transcript.text.split()) if transcript.text else 0
        speakers_count = len(set([u['speaker'] for u in utterances]))
        
        # Save to database
        print(f"[process_audio] Saving call for user_id: {user_id}")
        saved_call = save_call(
            file_name=jobs[job_id].get('file_name', 'unknown'),
            duration_seconds=int(audio_duration),
            word_count=word_count,
            speakers_count=speakers_count,
            transcription=transcript.text,
            utterances=utterances,
            speaker_roles=speaker_roles,
            user_id=user_id,
            audio_url=audio_url
        )
        
        call_db_id = saved_call['id'] if saved_call else None
        
        result = {
            'transcription': transcript.text,
            'utterances': utterances,
            'speaker_roles': speaker_roles,
            'speakers_count': speakers_count,
            'audio_duration': audio_duration,
            'word_count': word_count,
            'analysis_ready': False,
            'call_id': call_db_id,
            'audio_url': audio_url
        }
        
        jobs[job_id]['progress'] = 100
        jobs[job_id]['stage'] = 'Complete!'
        jobs[job_id]['status'] = 'completed'
        jobs[job_id]['result'] = result
        jobs[job_id]['call_id'] = call_db_id
        
        print(f"[process_audio] SUCCESS! Job {job_id} completed. Call ID: {call_db_id}")
        
        if os.path.exists(filepath):
            os.remove(filepath)
        
    except Exception as e:
        import traceback
        print(f"Error processing audio: {e}")
        print(traceback.format_exc())
        jobs[job_id]['status'] = 'error'
        jobs[job_id]['error'] = str(e)
        if os.path.exists(filepath):
            os.remove(filepath)

def classify_speakers(utterances):
    if not utterances:
        return {}
    
    speakers = list(set([u['speaker'] for u in utterances]))
    
    if len(speakers) == 1:
        return {speakers[0]: "Seller"}
    
    speaker_stats = {s: {
        'word_count': 0, 
        'utterance_count': 0, 
        'questions': 0, 
        'first_appearance': float('inf'),
        'positive_sentiment': 0,
        'negative_sentiment': 0,
        'neutral_sentiment': 0,
        'avg_utterance_length': 0,
        'exclamations': 0
    } for s in speakers}
    
    for i, u in enumerate(utterances):
        s = u['speaker']
        text = u['text']
        speaker_stats[s]['word_count'] += len(text.split())
        speaker_stats[s]['utterance_count'] += 1
        speaker_stats[s]['questions'] += text.count('?')
        speaker_stats[s]['exclamations'] += text.count('!')
        
        sentiment = u.get('sentiment', 'neutral')
        if sentiment == 'POSITIVE':
            speaker_stats[s]['positive_sentiment'] += 1
        elif sentiment == 'NEGATIVE':
            speaker_stats[s]['negative_sentiment'] += 1
        else:
            speaker_stats[s]['neutral_sentiment'] += 1
        
        if speaker_stats[s]['first_appearance'] == float('inf'):
            speaker_stats[s]['first_appearance'] = i
    
    for s in speakers:
        if speaker_stats[s]['utterance_count'] > 0:
            speaker_stats[s]['avg_utterance_length'] = speaker_stats[s]['word_count'] / speaker_stats[s]['utterance_count']
    
    sample_size = min(40, len(utterances))
    middle_start = max(0, len(utterances) // 2 - 10)
    
    beginning = utterances[:15]
    middle = utterances[middle_start:middle_start + 15]
    end = utterances[-10:] if len(utterances) > 25 else []
    
    sampled = beginning + middle + end
    seen = set()
    unique_samples = []
    for u in sampled:
        key = (u['speaker'], u['text'][:50])
        if key not in seen:
            seen.add(key)
            unique_samples.append(u)
    
    transcript_text = "\n".join([
        f"[{u['speaker']}]: {u['text']}" 
        for u in unique_samples
    ])
    
    stats_text = "\n".join([
        f"Speaker {s}: {stats['utterance_count']} utterances, {stats['word_count']} words, {stats['questions']} questions, {stats['exclamations']} exclamations, avg {stats['avg_utterance_length']:.1f} words/utterance, first spoke at position {stats['first_appearance']}, sentiment: +{stats['positive_sentiment']}/-{stats['negative_sentiment']}/neutral {stats['neutral_sentiment']}" 
        for s, stats in speaker_stats.items()
    ])
    
    prompt = f"""You are an expert sales call analyst. Analyze this sales call transcript carefully and determine who is the SELLER and who is the BUYER.

## Speaker Statistics:
{stats_text}

## Transcript Samples (beginning, middle, end of call):
{transcript_text}

## Analysis Guidelines:

**SELLER characteristics:**
- Usually initiates the call or greets first
- Introduces themselves and their company
- Asks qualifying questions ("What are you looking for?", "What's your budget?")
- Presents products, services, features, or solutions
- Handles objections and provides reassurance
- Discusses pricing, offers, discounts
- Tries to close the deal or schedule next steps
- Generally speaks more and controls the conversation flow

**BUYER characteristics:**
- Responds to seller's questions
- Asks about product details, features, or concerns
- Expresses needs, problems, or pain points
- Discusses budget constraints or timing
- Shows interest or hesitation
- Makes decisions or asks for time to think
- Generally speaks less and follows the seller's lead

## Your Task:
Based on the conversation patterns, speaking style, and content, classify each speaker.

Speakers to classify: {', '.join(speakers)}

Return ONLY a valid JSON object mapping each speaker letter to their role.
Example format: {{"A": "Seller", "B": "Buyer"}}

JSON:"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-5.2",
            messages=[
                {"role": "system", "content": "You are an expert sales conversation analyst. You must return ONLY valid JSON with no additional text. Analyze the conversation patterns, not just keywords."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        
        response_text = response.choices[0].message.content.strip()
        if response_text.startswith('```'):
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        roles = json.loads(response_text)
        
        for speaker in speakers:
            if speaker not in roles:
                roles[speaker] = "Unknown"
        
        return roles
    
    except Exception as e:
        print(f"Error classifying speakers: {e}")
        if len(speakers) == 2:
            sorted_speakers = sorted(speakers, key=lambda s: speaker_stats[s]['first_appearance'])
            return {sorted_speakers[0]: "Seller", sorted_speakers[1]: "Buyer"}
        return {speaker: "Unknown" for speaker in speakers}

# ============ Database API Endpoints ============

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    """Get dashboard statistics for authenticated user"""
    user_id = get_user_id_from_token()
    stats = get_dashboard_stats(user_id=user_id)
    return jsonify(stats)

@app.route('/api/calls', methods=['GET'])
def list_calls():
    """Get all calls for authenticated user"""
    user_id = get_user_id_from_token()
    calls = get_all_calls(user_id=user_id, limit=100)
    return jsonify(calls)

@app.route('/api/calls/<call_id>', methods=['GET'])
def get_call(call_id):
    """Get a single call with its analysis"""
    user_id = get_user_id_from_token()
    data = get_call_with_analysis(call_id, user_id=user_id)
    if not data:
        return jsonify({'error': 'Call not found'}), 404
    return jsonify(data)

@app.route('/api/calls/<call_id>/rename', methods=['POST', 'PUT'])
def rename_call(call_id):
    """Rename a call"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    new_name = data.get('name') if data else None
    
    if not new_name or not new_name.strip():
        return jsonify({'error': 'Name is required'}), 400
    
    from database import update_call_name
    result = update_call_name(call_id, new_name.strip(), user_id=user_id)
    
    if result:
        return jsonify({'success': True, 'call': result})
    return jsonify({'error': 'Failed to rename call'}), 500

@app.route('/api/calls/<call_id>/generate-name', methods=['POST'])
def generate_call_name(call_id):
    """Auto-generate a smart name based on analysis (customer + project type)"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    # Get call with analysis
    call_data = get_call_with_analysis(call_id, user_id=user_id)
    if not call_data or not call_data.get('call'):
        return jsonify({'error': 'Call not found'}), 404
    
    analysis = call_data.get('analysis')
    call = call_data.get('call')
    
    # Extract customer name and project type from analysis
    customer_name = None
    project_type = None
    
    if analysis:
        full_analysis = analysis.get('full_analysis', {})
        
        # Try to get customer info from various places in analysis
        if isinstance(full_analysis, dict):
            # Check deal_context
            deal_context = full_analysis.get('deal_context', {})
            if isinstance(deal_context, dict):
                customer_name = deal_context.get('customer_name') or deal_context.get('prospect_name')
                project_type = deal_context.get('project_type') or deal_context.get('product_interest')
            
            # Check key_info
            key_info = full_analysis.get('key_info', {})
            if isinstance(key_info, dict):
                if not customer_name:
                    customer_name = key_info.get('customer_name') or key_info.get('prospect_name')
                if not project_type:
                    project_type = key_info.get('project_type') or key_info.get('product')
    
    # If not found in analysis, try to extract from transcript
    if not customer_name or not project_type:
        utterances = call.get('utterances', [])
        transcript_sample = ' '.join([u.get('text', '') for u in utterances[:20]])
        
        # Use GPT to extract customer name and project type
        try:
            extract_prompt = f"""Extract the customer's name and the project/product type from this sales call transcript.

Transcript sample:
{transcript_sample[:2000]}

Return ONLY a JSON object like this:
{{"customer_name": "John Smith", "project_type": "Roof Replacement"}}

If you can't find a name, use "Unknown Customer".
If you can't find a project type, use "Sales Call".
"""
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": extract_prompt}],
                temperature=0.3,
                max_tokens=100
            )
            
            import json
            result_text = response.choices[0].message.content.strip()
            # Clean up JSON if wrapped in markdown
            if '```' in result_text:
                result_text = result_text.split('```')[1]
                if result_text.startswith('json'):
                    result_text = result_text[4:]
            
            extracted = json.loads(result_text)
            if not customer_name:
                customer_name = extracted.get('customer_name', 'Unknown Customer')
            if not project_type:
                project_type = extracted.get('project_type', 'Sales Call')
        except Exception as e:
            print(f"[generate_call_name] Error extracting info: {e}")
            if not customer_name:
                customer_name = "Unknown Customer"
            if not project_type:
                project_type = "Sales Call"
    
    # Generate the smart name
    smart_name = f"{customer_name} - {project_type}"
    
    # Update the call name
    from database import update_call_name
    result = update_call_name(call_id, smart_name, user_id=user_id)
    
    if result:
        return jsonify({
            'success': True, 
            'name': smart_name,
            'customer_name': customer_name,
            'project_type': project_type,
            'call': result
        })
    return jsonify({'error': 'Failed to update call name'}), 500


# ============ Practice On Feature ============

PRACTICE_COACH_PROMPT = """You are an ELITE SALES TRAINING COACH. Based on the call analysis provided, create a PERSONALIZED PRACTICE PLAN to help the salesperson improve.

## YOUR GOAL:
Create specific, actionable practice exercises that address the weaknesses identified in this call.
Focus on the areas with the lowest scores and the most critical issues.

## ANALYSIS DATA:
{analysis_json}

## RESPOND IN THIS EXACT JSON FORMAT:

{{
    "practice_areas": [
        {{
            "skill_name": "שם המיומנות (בעברית)",
            "priority": "critical|high|medium|low",
            "current_score": 0-100,
            "target_score": 80-95,
            "weakness_summary": "תיאור קצר של החולשה",
            "specific_issues": ["בעיה ספציפית 1", "בעיה ספציפית 2"],
            "practice_exercises": [
                {{
                    "exercise_type": "script_practice|roleplay|listen_and_repeat|technique_drill",
                    "title": "כותרת התרגיל",
                    "description": "מה צריך לתרגל",
                    "example_scenario": "תרחיש לדוגמה מהשיחה",
                    "your_response": "מה המוכר אמר בפועל",
                    "ideal_response": "מה היה צריך לומר",
                    "technique": "שם הטכניקה (Feel-Felt-Found, LAER, etc.)",
                    "practice_script": "סקריפט מלא לתרגול - מה לומר בדיוק",
                    "tips": ["טיפ 1", "טיפ 2", "טיפ 3"]
                }}
            ]
        }}
    ],
    "daily_drills": [
        {{
            "drill_name": "תרגול בוקר - 5 דקות",
            "focus": "על מה מתמקד התרגול",
            "exercises": ["תרגיל 1", "תרגיל 2", "תרגיל 3"]
        }}
    ],
    "action_items": [
        {{
            "priority": 1,
            "action": "מה לעשות",
            "why": "למה זה חשוב",
            "deadline": "לפני השיחה הבאה"
        }}
    ],
    "roleplay_scenarios": [
        {{
            "scenario_name": "שם התרחיש",
            "customer_opening": "מה הלקוח אומר",
            "context": "הקשר התרחיש",
            "goal": "המטרה שלך",
            "techniques_to_use": ["טכניקה 1", "טכניקה 2"],
            "sample_dialogue": [
                {{"speaker": "לקוח", "text": "מה הלקוח אומר"}},
                {{"speaker": "אתה", "text": "מה אתה צריך לענות"}}
            ]
        }}
    ],
    "improvement_metrics": {{
        "weakest_area": "האזור הכי חלש",
        "quick_wins": ["שיפור מהיר 1", "שיפור מהיר 2"],
        "long_term_focus": ["מיקוד ארוך טווח 1", "מיקוד ארוך טווח 2"]
    }}
}}

## IMPORTANT RULES:
1. ALL text should be in HEBREW (except technique names like "Feel-Felt-Found")
2. Create at least 3 practice exercises based on REAL issues from the call
3. Each exercise should have a COMPLETE practice script ready to speak out loud
4. Focus on the objections that were handled poorly
5. Include roleplay scenarios for the most important situations
6. Be SPECIFIC - use examples from THIS call, not generic advice
7. If price was revealed too early, create a specific exercise for that
8. If storytelling was weak, create exercises to improve stories"""


@app.route('/api/generate-practice', methods=['POST'])
def generate_practice_recommendations():
    """Generate personalized practice recommendations based on call analysis"""
    
    data = request.get_json()
    analysis = data.get('analysis')
    
    if not analysis:
        return jsonify({'error': 'Analysis data required'}), 400
    
    if not openai_client:
        return jsonify({'error': 'OpenAI not configured'}), 500
    
    try:
        # Build compact analysis JSON for the prompt
        analysis_summary = {
            'call_summary': analysis.get('analysis', {}).get('call_summary', {}),
            'methodology_score': analysis.get('analysis', {}).get('methodology_score', {}),
            'objections': analysis.get('analysis', {}).get('objections', []),
            'better_responses': analysis.get('analysis', {}).get('better_responses', []),
            'storytelling_analysis': analysis.get('analysis', {}).get('storytelling_analysis', []),
            'price_timing_analysis': analysis.get('analysis', {}).get('price_timing_analysis', {}),
            'trial_closes_analysis': analysis.get('analysis', {}).get('trial_closes_analysis', {}),
            'buying_signals_detected': analysis.get('analysis', {}).get('buying_signals_detected', {}),
            'call_structure_analysis': analysis.get('analysis', {}).get('call_structure_analysis', {}),
            'seller_performance': analysis.get('analysis', {}).get('seller_performance', {}),
            'metrics': analysis.get('metrics', {})
        }
        
        prompt = PRACTICE_COACH_PROMPT.format(
            analysis_json=json.dumps(analysis_summary, ensure_ascii=False, indent=2)
        )
        
        response = openai_client.chat.completions.create(
            model="gpt-5.2",
            messages=[
                {"role": "system", "content": "You are an expert sales coach. Respond ONLY with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=4000
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Clean up JSON if wrapped in markdown
        if '```' in result_text:
            result_text = result_text.split('```')[1]
            if result_text.startswith('json'):
                result_text = result_text[4:]
            result_text = result_text.strip()
        
        practice_data = json.loads(result_text)
        
        return jsonify({
            'success': True,
            'practice_recommendations': practice_data
        })
        
    except json.JSONDecodeError as e:
        print(f"[generate_practice] JSON parse error: {e}")
        print(f"[generate_practice] Raw response: {result_text[:500] if 'result_text' in dir() else 'N/A'}")
        return jsonify({'error': 'Failed to parse practice recommendations'}), 500
    except Exception as e:
        import traceback
        print(f"[generate_practice] Error: {e}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


# ============ Practice Feedback API ============

@app.route('/api/practice-feedback', methods=['POST'])
def get_practice_feedback():
    """Get AI feedback on a practice attempt (text or transcribed audio)"""
    
    data = request.get_json()
    user_response = data.get('user_response', '')
    exercise_context = data.get('exercise_context', {})
    exercise_type = data.get('exercise_type', 'objection_handling')
    
    if not user_response:
        return jsonify({'error': 'User response is required'}), 400
    
    if not openai_client:
        return jsonify({'error': 'OpenAI not configured'}), 500
    
    try:
        # Build the feedback prompt based on exercise type
        feedback_prompt = f"""You are an expert sales coach for home improvement sales. 
Analyze this practice attempt and provide detailed, encouraging feedback in Hebrew.

## Exercise Context:
- Type: {exercise_type}
- Scenario: {exercise_context.get('scenario', 'General practice')}
- Customer said: "{exercise_context.get('customer_statement', 'N/A')}"
- Ideal response: "{exercise_context.get('ideal_response', 'N/A')}"
- Technique to use: {exercise_context.get('technique', 'N/A')}

## User's Response:
"{user_response}"

## Your Task:
Analyze the response and provide feedback in this EXACT JSON format:
{{
    "overall_score": <number 1-10>,
    "strengths": ["<strength 1>", "<strength 2>"],
    "improvements": ["<improvement 1>", "<improvement 2>"],
    "specific_feedback": "<detailed paragraph explaining what was good and what can be improved>",
    "technique_used_correctly": <true/false>,
    "emotional_connection": <number 1-10>,
    "objection_addressed": <true/false>,
    "suggested_revision": "<an improved version of their response>",
    "coaching_tip": "<one actionable tip for next time>",
    "encouragement": "<motivational message in Hebrew>"
}}

Be encouraging but honest. Focus on actionable improvements.
Respond ONLY with the JSON, no other text."""

        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert sales coach. Respond ONLY with valid JSON in Hebrew."},
                {"role": "user", "content": feedback_prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Clean up JSON if wrapped in markdown
        if '```' in result_text:
            parts = result_text.split('```')
            if len(parts) >= 2:
                result_text = parts[1]
                if result_text.startswith('json'):
                    result_text = result_text[4:]
                result_text = result_text.strip()
        
        feedback_data = json.loads(result_text)
        
        return jsonify({
            'success': True,
            'feedback': feedback_data
        })
        
    except json.JSONDecodeError as e:
        print(f"[practice_feedback] JSON parse error: {e}")
        return jsonify({'error': 'Failed to parse feedback'}), 500
    except Exception as e:
        print(f"[practice_feedback] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/transcribe-practice', methods=['POST'])
def transcribe_practice_audio():
    """Transcribe audio recording from practice session"""
    
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    
    if not aai_client:
        return jsonify({'error': 'AssemblyAI not configured'}), 500
    
    try:
        # Save temp file
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as temp_file:
            audio_file.save(temp_file.name)
            temp_path = temp_file.name
        
        # Transcribe with AssemblyAI
        config = aai.TranscriptionConfig(
            language_code="he",
            speech_model=aai.SpeechModel.best
        )
        
        transcript = aai_client.transcribe(temp_path, config=config)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        if transcript.status == aai.TranscriptStatus.error:
            return jsonify({'error': transcript.error}), 500
        
        return jsonify({
            'success': True,
            'text': transcript.text,
            'confidence': transcript.confidence
        })
        
    except Exception as e:
        print(f"[transcribe_practice] Error: {e}")
        return jsonify({'error': str(e)}), 500


# ============ Practice Sessions API ============

@app.route('/api/practice-sessions', methods=['GET'])
def get_practice_sessions():
    """Get all practice sessions for the current user"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        result = client.table('practice_sessions').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        return jsonify(result.data or [])
    except Exception as e:
        print(f"[get_practice_sessions] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/practice-sessions/<session_id>', methods=['GET'])
def get_practice_session(session_id):
    """Get a specific practice session"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        result = client.table('practice_sessions').select('*').eq('id', session_id).eq('user_id', user_id).maybe_single().execute()
        if not result.data:
            return jsonify({'error': 'Practice session not found'}), 404
        return jsonify(result.data)
    except Exception as e:
        print(f"[get_practice_session] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/practice-sessions', methods=['POST'])
def create_practice_session():
    """Create a new practice session from a call analysis"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    call_id = data.get('call_id')
    call_name = data.get('call_name', 'Unnamed Call')
    practice_data = data.get('practice_data')
    
    if not call_id or not practice_data:
        return jsonify({'error': 'call_id and practice_data are required'}), 400
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # Check if session already exists for this call
        existing = client.table('practice_sessions').select('id').eq('call_id', call_id).eq('user_id', user_id).maybe_single().execute()
        
        if existing.data:
            # Update existing session
            result = client.table('practice_sessions').update({
                'practice_data': practice_data,
                'call_name': call_name,
                'total_exercises': count_exercises(practice_data),
                'updated_at': 'now()'
            }).eq('id', existing.data['id']).execute()
            return jsonify({'success': True, 'session_id': existing.data['id'], 'updated': True})
        
        # Create new session
        total_exercises = count_exercises(practice_data)
        result = client.table('practice_sessions').insert({
            'user_id': user_id,
            'call_id': call_id,
            'call_name': call_name,
            'practice_data': practice_data,
            'total_exercises': total_exercises,
            'completed_count': 0,
            'progress_percent': 0
        }).execute()
        
        return jsonify({'success': True, 'session_id': result.data[0]['id'] if result.data else None})
    except Exception as e:
        print(f"[create_practice_session] Error: {e}")
        return jsonify({'error': str(e)}), 500


def count_exercises(practice_data):
    """Count total exercises in practice data"""
    count = 0
    for area in practice_data.get('practice_areas', []):
        count += len(area.get('practice_exercises', []))
    return count


@app.route('/api/practice-sessions/<session_id>', methods=['PUT'])
def update_practice_session(session_id):
    """Update practice session progress"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    completed_exercises = data.get('completed_exercises', [])
    completed_actions = data.get('completed_actions', [])
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # Get current session to calculate progress
        session = client.table('practice_sessions').select('total_exercises').eq('id', session_id).eq('user_id', user_id).maybe_single().execute()
        
        if not session.data:
            return jsonify({'error': 'Practice session not found'}), 404
        
        total = session.data.get('total_exercises', 1)
        completed_count = len(completed_exercises)
        progress = int((completed_count / total) * 100) if total > 0 else 0
        
        result = client.table('practice_sessions').update({
            'completed_exercises': completed_exercises,
            'completed_actions': completed_actions,
            'completed_count': completed_count,
            'progress_percent': progress,
            'updated_at': 'now()'
        }).eq('id', session_id).eq('user_id', user_id).execute()
        
        return jsonify({'success': True, 'progress_percent': progress})
    except Exception as e:
        print(f"[update_practice_session] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/practice-sessions/<session_id>', methods=['DELETE'])
def delete_practice_session(session_id):
    """Delete a practice session"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        client.table('practice_sessions').delete().eq('id', session_id).eq('user_id', user_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        print(f"[delete_practice_session] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/practice-sessions/stats', methods=['GET'])
def get_practice_stats():
    """Get aggregated practice statistics for the user"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        result = client.table('practice_sessions').select('*').eq('user_id', user_id).execute()
        sessions = result.data or []
        
        total_sessions = len(sessions)
        total_exercises = sum(s.get('total_exercises', 0) for s in sessions)
        completed_exercises = sum(s.get('completed_count', 0) for s in sessions)
        avg_progress = int(sum(s.get('progress_percent', 0) for s in sessions) / total_sessions) if total_sessions > 0 else 0
        
        # Aggregate weakest areas across all sessions
        weakness_counts = {}
        for session in sessions:
            practice_data = session.get('practice_data', {})
            for area in practice_data.get('practice_areas', []):
                skill = area.get('skill_name', 'Unknown')
                if skill not in weakness_counts:
                    weakness_counts[skill] = {'count': 0, 'total_score': 0}
                weakness_counts[skill]['count'] += 1
                weakness_counts[skill]['total_score'] += area.get('current_score', 50)
        
        top_weaknesses = sorted(
            [{'skill': k, 'count': v['count'], 'avg_score': int(v['total_score'] / v['count'])} 
             for k, v in weakness_counts.items()],
            key=lambda x: x['avg_score']
        )[:5]
        
        return jsonify({
            'total_sessions': total_sessions,
            'total_exercises': total_exercises,
            'completed_exercises': completed_exercises,
            'avg_progress': avg_progress,
            'top_weaknesses': top_weaknesses
        })
    except Exception as e:
        print(f"[get_practice_stats] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/calls-for-practice', methods=['GET'])
def get_calls_for_practice():
    """Get calls that have analysis but may not have practice sessions yet"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # Get calls with analyses
        calls = client.table('calls').select('id, file_name, created_at, duration_seconds').eq('user_id', user_id).order('created_at', desc=True).limit(50).execute()
        
        # Get existing practice sessions
        practice_sessions = client.table('practice_sessions').select('call_id, id, progress_percent').eq('user_id', user_id).execute()
        practice_map = {p['call_id']: p for p in (practice_sessions.data or [])}
        
        # Get analyses
        analyses = client.table('analyses').select('call_id, overall_score').execute()
        analysis_map = {a['call_id']: a for a in (analyses.data or [])}
        
        # Build response
        result = []
        for call in (calls.data or []):
            call_id = call['id']
            has_analysis = call_id in analysis_map
            practice_info = practice_map.get(call_id)
            
            if has_analysis:  # Only include calls with analysis
                result.append({
                    'id': call_id,
                    'file_name': call['file_name'],
                    'created_at': call['created_at'],
                    'duration_seconds': call['duration_seconds'],
                    'overall_score': analysis_map[call_id].get('overall_score'),
                    'has_practice': practice_info is not None,
                    'practice_session_id': practice_info['id'] if practice_info else None,
                    'practice_progress': practice_info['progress_percent'] if practice_info else 0
                })
        
        return jsonify(result)
    except Exception as e:
        print(f"[get_calls_for_practice] Error: {e}")
        return jsonify({'error': str(e)}), 500


# ============ Story Bank API ============

STORY_GENERATION_PROMPT = """You are a WORLD-CLASS SALES STORYTELLING MASTER specializing in the Outdoor Living industry (Cool Life exterior coating, synthetic turf, pavers, pergolas, fencing).

Your mission: Create COMPELLING, EMOTIONALLY POWERFUL sales stories that make customers say YES. These aren't just stories—they're precision-engineered persuasion tools that tap into the customer's deepest desires and fears.

## THE 6 ESSENTIAL ELEMENTS OF A WINNING SALES STORY:

### 1. RELATABLE CHARACTER (The Hero)
Create a character the prospect can SEE THEMSELVES in:
- Full name + specific location (e.g., "David and Sarah from Scottsdale" not "a customer")
- Similar life situation to the prospect (family with kids, retirees, business owner)
- One unique, memorable detail that makes them REAL ("He's a retired firefighter who finally had time for his dream backyard")
- Use real Arizona locations: Phoenix, Scottsdale, Paradise Valley, Fountain Hills, Gilbert, Chandler, Mesa, Tempe, Cave Creek

### 2. THE SAME HESITATION (Mirror Moment)
The character had the EXACT SAME objection the prospect has now:
- Quote their words directly: "David said the exact same thing—'I need to think about it'"
- This creates instant rapport: "This person GETS me"
- Common hesitations: price concerns, need to compare, spouse consultation, timing, trust issues

### 3. THE DECISION MOMENT (The Turning Point)
What SPECIFIC event made them decide to move forward?
- NOT vague ("they decided it was worth it")
- SPECIFIC trigger: "When they saw their neighbor's water bill was $47 while theirs was $380..."
- "When their daughter asked why they never use the backyard anymore..."
- "When the HOA sent another warning letter about the dead grass..."

### 4. THE COST OF WAITING (The Regret Factor)
What did they LOSE or ALMOST LOSE by hesitating?
- Specific dollar amounts: "$3,000 more because prices went up"
- Lost time: "Another summer where the kids couldn't play outside"
- Lost opportunities: "The contractor got booked for 3 months"
- Emotional cost: "Months of stress looking at their ugly yard"

### 5. THE TRANSFORMATION (The Results)
MEASURABLE, SPECIFIC outcomes with numbers:
- Money saved: "Cut their water bill from $380 to $47/month—that's $4,000/year"
- Home value: "Appraiser said it added $45,000 to their home value"
- Lifestyle change: "Kids now play outside 3 hours a day instead of screens"
- Before/after contrast: "Went from embarrassed to invite people over to hosting every weekend"

### 6. THE EMOTIONAL PAYOFF (The Quote)
End with a POWERFUL direct quote from the customer:
- "Sarah told me last month: 'I can't believe we almost didn't do this. It changed our whole lifestyle.'"
- "David said: 'My only regret is waiting so long.'"
- Emotions to evoke: pride, peace of mind, joy, vindication, relief

## TARGET EMOTIONS TO EVOKE:
- **trust** - Establish credibility through experience and results
- **urgency** - Prices going up, limited availability, summer approaching
- **value** - Investment that pays for itself, ROI calculation
- **fear_of_loss** - What they'll miss out on, competitor advantages
- **peace_of_mind** - No more worries, maintenance-free, guaranteed
- **pride** - Neighbors complimenting, best-looking yard on the street
- **social_proof** - Everyone in the neighborhood is doing it

## PRODUCT-SPECIFIC BENEFITS:
- **Cool Life Paint**: Reduces surface temp 20-30°F, use your patio year-round, lifetime warranty, never repaint again
- **Turf**: Save $200-400/month on water, zero maintenance, green 365 days, pet-friendly, no chemicals
- **Pavers**: Adds 10-15% to home value, 25+ year durability, transforms curb appeal instantly
- **Pergola**: Extends living space, protection from Arizona sun, outdoor entertainment hub

## STORY REQUIREMENTS:
- Length: 150-200 words (60-90 seconds spoken)
- Tone: Conversational, like telling a friend about someone you know
- Style: Vivid, visual, emotional—make them SEE and FEEL the story
- Avoid: Jargon, unrealistic claims, filler words, being generic

Return ONLY valid JSON in this exact format:
{
  "title": "Short catchy title (English)",
  "setup_line": "Natural transition line to introduce the story (English)",
  "story_content": "The full story with all 6 elements woven naturally together (English)",
  "closing_bridge": "Question or statement that leads to closing (English)",
  "structure": {
    "character": "Description of the character",
    "hesitation": "Their exact hesitation",
    "decision_moment": "What made them decide",
    "cost_of_waiting": "What they lost or almost lost",
    "transformation": "Specific measurable results",
    "emotional_payoff": "Their powerful quote"
  },
  "explanation": "Brief explanation of why this story works psychologically",
  "tags": ["emotion", "objection_type", "product"]
}"""

STORY_IMPROVEMENT_PROMPT = """You are a MASTER STORY DOCTOR for the OUTDOOR LIVING & HOME IMPROVEMENT industry in Arizona.

Your specialty: Transforming raw product pitches into COMPELLING CUSTOMER SUCCESS STORIES that close deals.

## THE ORIGINAL STORY TO IMPROVE:
{raw_story}

## INDUSTRY CONTEXT - This is for:
- **Cool Life Paint**: Military-grade heat-reflective exterior coating. Reduces surface temp 20-30°F. Lifetime warranty. Use patio year-round in Arizona heat.
- **Synthetic Turf**: Save $200-400/month on water. Zero maintenance. Green 365 days. Pet-friendly.
- **Pavers**: Adds 10-15% to home value. 25+ year durability. Transforms curb appeal.
- **Concrete**: Driveways, patios. Professional finish. No cracking.
- **Fencing**: Vinyl, composite, aluminum. Privacy, security, aesthetics.

## YOUR MISSION - Transform this into a CUSTOMER SUCCESS STORY with ALL 6 elements:

### 1. RELATABLE CHARACTER (CRITICAL)
- MUST have: Full name (first name at minimum) + specific Arizona location
- Make them relatable: "David and Sarah from Scottsdale" or "The Martinez family in Gilbert"
- Add ONE memorable detail: "retired firefighter," "busy mom of three," "real estate investor"
- Locations to use: Phoenix, Scottsdale, Paradise Valley, Fountain Hills, Gilbert, Chandler, Mesa, Tempe, Cave Creek, Peoria, Glendale, Surprise, Goodyear

### 2. THE SAME HESITATION (MIRROR THE OBJECTION)
- Quote them directly saying the SAME objection the current prospect has
- Examples: "He said EXACTLY what you said - 'I need to think about it'"
- "She told me the same thing - 'It's too expensive for us right now'"
- This creates instant connection: "This person was just like me!"

### 3. THE DECISION MOMENT (THE TURNING POINT)
- What SPECIFIC event triggered their decision?
- NOT vague: "they decided it was worth it" ❌
- SPECIFIC: "When they saw their neighbor's $47 water bill vs their $380..." ✅
- "When the HOA sent their third warning about dead grass..."
- "When their daughter asked why they never use the backyard..."

### 4. THE COST OF WAITING (CREATE URGENCY)
- What did they LOSE by hesitating? Use REAL numbers:
- "$2,800 more because prices went up"
- "Another summer their kids couldn't play outside"
- "3 months of $300 water bills = $900 wasted"
- "The contractor got booked out for 4 months"

### 5. THE TRANSFORMATION (MEASURABLE RESULTS)
- SPECIFIC numbers and outcomes:
- "Water bill went from $380 to $47/month - saves $4,000/year"
- "Home value increased $35,000 according to the appraiser"
- "Energy bill dropped $180/month - patio usable in July now"
- "Kids play outside 3 hours daily instead of screens"

### 6. THE EMOTIONAL PAYOFF (THE CLOSING QUOTE)
- End with a POWERFUL direct quote from the customer:
- "David told me last week: 'My only regret is waiting 6 months. That cost me $1,500.'"
- "Sarah said: 'I can't believe we almost didn't do this. Best decision we ever made.'"
- "Mr. Johnson's advice to everyone: 'Cheap is expensive. Just do it right once.'"

## STORY STRUCTURE (150-200 words, 60-90 seconds spoken):

Opening: Natural transition ("You know what's interesting?", "Let me tell you about...")
→ Introduce character (name, location, one detail)
→ Their hesitation (SAME as prospect's)
→ The trigger that changed their mind
→ What they almost lost / cost of waiting
→ The amazing results (with numbers)
→ Their quote (emotional payoff)
→ Bridge to close ("Does that make sense?", "Can you relate to that?")

## TONE:
- Conversational, like telling a friend about someone you know
- Vivid and visual - make them SEE and FEEL the story
- Authentic - this should sound like a REAL customer, not a commercial
- Confident but not pushy

Return ONLY valid JSON:
{
  "title": "Short catchy title (4-6 words)",
  "setup_line": "Natural transition to introduce the story (1 sentence)",
  "story_content": "The IMPROVED story with ALL 6 ELEMENTS (150-200 words)",
  "closing_bridge": "Question or statement that leads to closing (1 sentence)",
  "structure": {
    "character": "Name + location + memorable detail",
    "hesitation": "Their exact quote showing the same objection",
    "decision_moment": "The specific trigger",
    "cost_of_waiting": "What they lost (with numbers)",
    "transformation": "The measurable results (with numbers)",
    "emotional_payoff": "Their powerful closing quote"
  },
  "improvements_made": ["What you added/changed", "...", "..."],
  "explanation": "Why this version is more persuasive (1-2 sentences)",
  "tags": ["primary_emotion", "objection_type", "product"]
}"""


@app.route('/api/story-bank', methods=['GET'])
def get_user_stories():
    """Get all stories for the current user"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        result = client.table('story_bank').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        return jsonify({'stories': result.data or []})
    except Exception as e:
        print(f"[get_user_stories] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/story-bank', methods=['POST'])
def save_story():
    """Save a new story to the user's story bank"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    data = request.get_json()
    
    try:
        story_data = {
            'user_id': user_id,
            'title': data.get('title', 'סיפור ללא שם'),
            'content': data.get('content', data.get('story_content', '')),
            'target_emotions': data.get('target_emotions', []),
            'target_message': data.get('target_message'),
            'objection_type': data.get('objection_type'),
            'product': data.get('product', data.get('product_type')),
            'structure': data.get('structure', data.get('story_structure')),
            'setup_line': data.get('setup_line'),
            'closing_bridge': data.get('closing_bridge'),
            'explanation': data.get('explanation'),
            'original_story': data.get('original_story'),
            'tags': data.get('tags', []),
            'is_favorite': data.get('is_favorite', False),
            'used_count': 0,
            'success_count': 0,
            'fail_count': 0
        }
        
        result = client.table('story_bank').insert(story_data).execute()
        return jsonify({'story': result.data[0] if result.data else {}}), 201
    except Exception as e:
        print(f"[save_story] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/story-bank/<story_id>', methods=['PUT'])
def update_story(story_id):
    """Update an existing story"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    data = request.get_json()
    
    try:
        # Only allow updating certain fields
        update_data = {}
        allowed_fields = ['title', 'content', 'target_emotions', 'target_message', 
                         'objection_type', 'product', 'structure', 'tags', 
                         'is_favorite', 'setup_line', 'closing_bridge', 'explanation']
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        if update_data:
            result = client.table('story_bank').update(update_data).eq('id', story_id).eq('user_id', user_id).execute()
            return jsonify({'story': result.data[0] if result.data else {}})
        return jsonify({'story': {}})
    except Exception as e:
        print(f"[update_story] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/story-bank/<story_id>', methods=['DELETE'])
def delete_story(story_id):
    """Delete a story"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        client.table('story_bank').delete().eq('id', story_id).eq('user_id', user_id).execute()
        return jsonify({'success': True})
    except Exception as e:
        print(f"[delete_story] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/story-bank/<story_id>/use', methods=['POST'])
def increment_story_usage(story_id):
    """Track story usage and whether it worked"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        data = request.get_json() or {}
        worked = data.get('worked', None)  # True = worked, False = didn't work, None = just used
        
        # Get current counts
        story = client.table('story_bank').select('used_count, success_count, fail_count').eq('id', story_id).eq('user_id', user_id).execute()
        if not story.data:
            return jsonify({'error': 'Story not found'}), 404
        
        current = story.data[0]
        used_count = (current.get('used_count') or 0) + 1
        success_count = current.get('success_count') or 0
        fail_count = current.get('fail_count') or 0
        
        if worked is True:
            success_count += 1
        elif worked is False:
            fail_count += 1
        
        # Update counts
        result = client.table('story_bank').update({
            'used_count': used_count,
            'success_count': success_count,
            'fail_count': fail_count,
            'updated_at': 'now()'
        }).eq('id', story_id).eq('user_id', user_id).execute()
        
        return jsonify(result.data[0] if result.data else {})
    except Exception as e:
        print(f"[increment_story_usage] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/story-bank/generate', methods=['POST'])
def generate_story():
    """Generate or improve a story using AI based on emotion and message"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.get_json()
    mode = data.get('mode', 'create')  # 'create' or 'improve'
    raw_story = data.get('raw_story', '')
    target_message = data.get('target_message', '')
    target_emotions = data.get('target_emotions', ['trust'])
    objection_type = data.get('objection_type', '')
    product = data.get('product', '')
    
    if not target_message:
        return jsonify({'error': 'target_message is required'}), 400
    
    if mode == 'improve' and not raw_story:
        return jsonify({'error': 'raw_story is required for improve mode'}), 400
    
    # Map emotion IDs to Hebrew labels
    emotion_labels = {
        'trust': 'Trust & Credibility',
        'urgency': 'Urgency',
        'value': 'Value & ROI',
        'fomo': 'Fear of Missing Out',
        'fear_of_loss': 'Fear of Loss',
        'peace': 'Peace of Mind',
        'peace_of_mind': 'Peace of Mind',
        'pride': 'Pride',
        'social_proof': 'Social Proof',
        'professionalism': 'Professionalism',
        'integrity': 'Integrity',
        'success': 'Success'
    }
    
    objection_labels = {
        'think': 'Need to think about it',
        'need_to_think': 'Need to think about it',
        'price': 'Too expensive',
        'too_expensive': 'Too expensive',
        'spouse': 'Need to talk to spouse',
        'spouse_decision': 'Need to talk to spouse',
        'offers': 'Getting other quotes',
        'getting_quotes': 'Getting other quotes',
        'timing': 'Not the right time',
        'bad_timing': 'Not the right time',
        'trust': "Don't know you",
        'check_finances': 'Need to check finances'
    }
    
    product_labels = {
        'cool_life': 'Cool Life (Exterior Heat-Reflective Coating)',
        'turf': 'Synthetic Turf',
        'pavers': 'Pavers (Patios, Walkways, Driveways)',
        'pergola': 'Pergola',
        'concrete': 'Concrete',
        'fence': 'Fencing',
        'general': 'General'
    }
    
    try:
        emotions_text = ', '.join([emotion_labels.get(e, e) for e in target_emotions])
        objection_text = objection_labels.get(objection_type, objection_type) if objection_type else ''
        product_text = product_labels.get(product, product) if product else ''
        
        if mode == 'improve':
            # Use improvement prompt
            system_prompt = STORY_IMPROVEMENT_PROMPT.replace('{raw_story}', raw_story)
            user_prompt = f"""Transform this story into a POWERFUL closing tool that delivers the message and evokes the right emotions.

**MESSAGE TO CONVEY:** {target_message}
**EMOTIONS TO EVOKE:** {emotions_text}
"""
            if objection_text:
                user_prompt += f"**OBJECTION TO ADDRESS:** {objection_text}\n"
            if product_text:
                user_prompt += f"**PRODUCT:** {product_text}\n"
            
            user_prompt += "\nEnhance the story while keeping the original core idea. Add all 6 missing elements to make it compelling and persuasive."
        else:
            # Use creation prompt
            system_prompt = STORY_GENERATION_PROMPT
            user_prompt = f"""Create a NEW sales story in English that will close deals.

**MESSAGE TO CONVEY:** {target_message}
**EMOTIONS TO EVOKE:** {emotions_text}
"""
            if objection_text:
                user_prompt += f"**OBJECTION TO PREVENT/ADDRESS:** {objection_text}\n"
            if product_text:
                user_prompt += f"**RELEVANT PRODUCT:** {product_text}\n"
            
            user_prompt += """
Create a WINNING sales story using all 6 essential elements.
The story must be authentic, emotional, with specific numbers and a powerful customer quote.
Make it vivid, visual, and impossible to resist.
"""
        
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.8,
            max_tokens=2000
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Parse JSON from response
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        if json_match:
            story_data = json.loads(json_match.group())
            # Add metadata
            story_data['target_emotions'] = target_emotions
            story_data['target_message'] = target_message
            story_data['objection_type'] = objection_type
            story_data['product'] = product
            story_data['mode'] = mode
            return jsonify({'story': story_data})
        else:
            print(f"[generate_story] Failed to parse response: {response_text[:500]}")
            return jsonify({'error': 'Failed to parse AI response'}), 500
            
    except Exception as e:
        print(f"[generate_story] Error: {e}")
        return jsonify({'error': str(e)}), 500


# ============ Admin API Endpoints ============

@app.route('/api/admin/check', methods=['GET'])
def check_admin():
    """Check if current user is an admin"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'is_admin': False, 'role': None})
    role = get_user_role(user_id)
    return jsonify({
        'is_admin': role == 'admin',
        'role': role,
        'user_id': user_id
    })

@app.route('/api/admin/stats', methods=['GET'])
@require_admin
def admin_stats():
    """Get admin dashboard statistics"""
    stats = get_admin_dashboard_stats()
    return jsonify(stats)

@app.route('/api/admin/users', methods=['GET'])
@require_admin
def admin_list_users():
    """List all users with their stats"""
    users = get_all_users_with_stats()
    return jsonify(users)

@app.route('/api/admin/users/<target_user_id>', methods=['GET'])
@require_admin
def admin_get_user(target_user_id):
    """Get a specific user's details and stats"""
    stats = get_user_stats(target_user_id)
    if not stats:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(stats)

@app.route('/api/admin/users/<target_user_id>/calls', methods=['GET'])
@require_admin
def admin_get_user_calls(target_user_id):
    """Get all calls for a specific user"""
    calls = get_user_calls(target_user_id)
    return jsonify(calls)

@app.route('/api/admin/users/<target_user_id>/role', methods=['PUT'])
@require_admin
def admin_update_user_role(target_user_id):
    """Update a user's role"""
    data = request.get_json()
    new_role = data.get('role')
    if not new_role:
        return jsonify({'error': 'Role is required'}), 400
    
    success = update_user_role(target_user_id, new_role)
    if success:
        return jsonify({'success': True, 'role': new_role})
    return jsonify({'error': 'Failed to update role'}), 500

@app.route('/api/admin/calls', methods=['GET'])
@require_admin
def admin_list_all_calls():
    """List all calls across all users"""
    calls = get_all_calls(user_id=None, limit=200)
    return jsonify(calls)

@app.route('/api/admin/calls/<call_id>', methods=['GET'])
@require_admin
def admin_get_call(call_id):
    """Get any call with its analysis (admin only)"""
    data = get_call_with_analysis(call_id, user_id=None)
    if not data:
        return jsonify({'error': 'Call not found'}), 404
    return jsonify(data)


@app.route('/api/admin/trends', methods=['GET'])
@require_admin
def admin_trends():
    """Get trends data for charts (calls over time, scores over time)"""
    from datetime import datetime, timedelta
    from collections import defaultdict
    
    days = request.args.get('days', 30, type=int)
    
    client = get_supabase()
    if not client:
        return jsonify({'error': 'Database not available'}), 500
    
    try:
        # Get all calls with their analyses
        calls = client.table('calls').select('id, user_id, created_at, duration_seconds, file_name, status, audio_url').order('created_at', desc=True).execute()
        calls_data = calls.data or []
        
        analyses = client.table('analyses').select('call_id, overall_score, meddic_score, bant_score, deal_risk_level, objection_count, created_at').execute()
        analyses_data = analyses.data or []
        
        # Create analysis map
        analysis_map = {a['call_id']: a for a in analyses_data}
        
        # Group by date
        calls_by_date = defaultdict(list)
        scores_by_date = defaultdict(list)
        
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        for call in calls_data:
            if not call.get('created_at'):
                continue
            date_str = call['created_at'][:10]  # YYYY-MM-DD
            call_date = datetime.strptime(date_str, '%Y-%m-%d')
            
            if call_date >= cutoff_date:
                calls_by_date[date_str].append(call)
                
                # Get analysis score if exists
                analysis = analysis_map.get(call['id'])
                if analysis and analysis.get('overall_score'):
                    scores_by_date[date_str].append(analysis['overall_score'])
        
        # Build daily stats
        daily_stats = []
        current_date = cutoff_date
        while current_date <= datetime.utcnow():
            date_str = current_date.strftime('%Y-%m-%d')
            day_calls = calls_by_date.get(date_str, [])
            day_scores = scores_by_date.get(date_str, [])
            
            daily_stats.append({
                'date': date_str,
                'calls': len(day_calls),
                'avg_score': round(sum(day_scores) / len(day_scores)) if day_scores else 0,
                'analyzed': len(day_scores)
            })
            current_date += timedelta(days=1)
        
        # Get users with their call counts for user breakdown
        users_breakdown = defaultdict(lambda: {'calls': 0, 'analyzed': 0, 'total_score': 0, 'scores_count': 0})
        
        # Get user info
        try:
            users_info = client.rpc('get_all_users_admin').execute()
            user_map = {u['user_id']: u for u in (users_info.data or [])}
        except:
            user_map = {}
        
        for call in calls_data:
            uid = call.get('user_id')
            if uid:
                users_breakdown[uid]['calls'] += 1
                analysis = analysis_map.get(call['id'])
                if analysis:
                    users_breakdown[uid]['analyzed'] += 1
                    if analysis.get('overall_score'):
                        users_breakdown[uid]['total_score'] += analysis['overall_score']
                        users_breakdown[uid]['scores_count'] += 1
        
        users_list = []
        for uid, data in users_breakdown.items():
            user_info = user_map.get(uid, {})
            users_list.append({
                'user_id': uid,
                'email': user_info.get('email', ''),
                'display_name': user_info.get('display_name', user_info.get('email', uid[:8])),
                'calls': data['calls'],
                'analyzed': data['analyzed'],
                'avg_score': round(data['total_score'] / data['scores_count']) if data['scores_count'] > 0 else 0
            })
        
        users_list.sort(key=lambda x: x['calls'], reverse=True)
        
        # Recent calls with user info and analysis
        recent_calls = []
        for call in calls_data[:50]:
            uid = call.get('user_id')
            user_info = user_map.get(uid, {})
            analysis = analysis_map.get(call['id'])
            
            recent_calls.append({
                'id': call['id'],
                'file_name': call.get('file_name', 'Unknown'),
                'duration_seconds': call.get('duration_seconds', 0),
                'created_at': call.get('created_at'),
                'status': call.get('status', 'pending'),
                'audio_url': call.get('audio_url'),
                'user_id': uid,
                'user_email': user_info.get('email', ''),
                'user_name': user_info.get('display_name', ''),
                'overall_score': analysis.get('overall_score') if analysis else None,
                'deal_risk_level': analysis.get('deal_risk_level') if analysis else None
            })
        
        return jsonify({
            'daily_stats': daily_stats,
            'users_breakdown': users_list,
            'recent_calls': recent_calls,
            'totals': {
                'total_calls': len(calls_data),
                'total_analyzed': len(analyses_data),
                'total_users': len(users_breakdown)
            }
        })
        
    except Exception as e:
        print(f"[admin_trends] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """Generate speech audio from text using OpenAI TTS"""
    if not openai_client:
        return jsonify({'error': 'OpenAI API not configured'}), 500
    
    data = request.json
    text = data.get('text', '')
    voice = data.get('voice', 'nova')  # Options: alloy, echo, fable, onyx, nova, shimmer
    
    if not text:
        return jsonify({'error': 'Text is required'}), 400
    
    if len(text) > 4096:
        text = text[:4096]  # OpenAI TTS has a limit
    
    try:
        response = openai_client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text
        )
        
        # Generate unique filename
        audio_filename = f"tts_{uuid.uuid4().hex[:8]}.mp3"
        audio_path = os.path.join(UPLOAD_FOLDER, audio_filename)
        
        # Save audio file
        response.stream_to_file(audio_path)
        
        # Return the audio URL
        return jsonify({
            'audio_url': f'/api/audio/{audio_filename}',
            'text': text
        })
        
    except Exception as e:
        print(f"TTS error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    """Serve audio files"""
    from flask import send_from_directory
    return send_from_directory(UPLOAD_FOLDER, filename)


# ============ AI Sales Coach Assistant ============

AI_ASSISTANT_SYSTEM_PROMPT = """You are an ELITE AI Sales Coach Assistant - a world-class expert in frontal sales and the one-call close methodology. You've trained over 10,000 top closers and understand the psychology of persuasion deeply.

## YOUR PERSONALITY:
- Direct, confident, and actionable
- Creative with stories and examples
- Brutally honest but supportive
- Focused on CLOSING DEALS
- You speak in a mix of English and Hebrew when appropriate

## YOUR EXPERTISE:
1. **One-Call Close Methodology** - Structure, timing, and execution
2. **Objection Prevention & Handling** - Addressing concerns before they become blockers
3. **Story Selling** - Creating vivid, emotional stories that build value
4. **Price Timing** - Never reveal price before building full value (45-60+ min)
5. **Trial Closes** - Temperature checks throughout the conversation
6. **Buying Signals** - Recognizing and capitalizing on customer interest

## HOW TO RESPOND:
- If asked about a specific moment in the call, reference it directly
- When suggesting responses, give EXACT SCRIPTS ready to use
- When creating stories, make them VISUAL, EMOTIONAL, and SPECIFIC
- Always connect your advice to CLOSING THE DEAL
- Be creative and imaginative with stories - make them vivid and memorable
- Use the customer's specific context from the call

## STORY CREATION GUIDELINES:
When creating stories to prevent objections or build value:
1. Start with a character SIMILAR to the prospect (same industry/situation)
2. Show their INITIAL HESITATION (same objection the prospect might have)
3. Describe the COST OF INACTION vividly
4. Show the TRANSFORMATION after they decided
5. Include SPECIFIC RESULTS (numbers, timeframes)
6. End with EMOTIONAL PAYOFF (peace of mind, success, freedom)
7. Keep it under 90 seconds when spoken
8. Make it so VISUAL they can picture it

## RESPONSE FORMAT:
- Be conversational and helpful
- Use bullet points for actionable items
- Include exact scripts in quotes
- For stories, format them ready to tell
- Add relevant emojis sparingly for clarity"""

@app.route('/api/assistant', methods=['POST'])
def ai_assistant():
    """AI Sales Coach Assistant - answers questions about the call and provides coaching"""
    if not openai_client:
        return jsonify({'error': 'OpenAI API not configured'}), 500
    
    data = request.json
    user_message = data.get('message', '')
    conversation_history = data.get('history', [])
    call_context = data.get('call_context', {})
    selected_text = data.get('selected_text', '')
    
    if not user_message:
        return jsonify({'error': 'Message is required'}), 400
    
    # Build context from call data
    context_parts = []
    
    if call_context:
        # Add transcript summary
        if call_context.get('transcript'):
            context_parts.append(f"## CALL TRANSCRIPT:\n{call_context['transcript'][:8000]}")
        
        # Add analysis summary
        if call_context.get('analysis'):
            analysis = call_context['analysis']
            
            if analysis.get('call_summary'):
                summary = analysis['call_summary']
                context_parts.append(f"""## CALL SUMMARY:
- Outcome: {summary.get('outcome', 'unknown')}
- One-liner: {summary.get('one_liner', 'N/A')}
- Close prevented by: {summary.get('close_prevented_by', 'N/A')}""")
            
            if analysis.get('objections'):
                objections_text = "\n".join([
                    f"- [{obj.get('timestamp', 'N/A')}] {obj.get('type', 'objection')}: \"{obj.get('buyer_statement', '')}\" (Handling: {obj.get('handling_score', 'N/A')}/10)"
                    for obj in analysis['objections'][:5]
                ])
                context_parts.append(f"## OBJECTIONS DETECTED:\n{objections_text}")
            
            if analysis.get('customer_interest'):
                interest = analysis['customer_interest']
                context_parts.append(f"""## CUSTOMER INTEREST:
- Level: {interest.get('overall_level', 'unknown')}
- Buying Readiness: {interest.get('buying_readiness', 0)}%
- Main Concerns: {', '.join(interest.get('main_concerns', [])[:3])}""")
            
            if analysis.get('seller_performance'):
                perf = analysis['seller_performance']
                context_parts.append(f"""## SELLER PERFORMANCE:
- Overall Score: {perf.get('overall_score', 0)}/100
- Strengths: {', '.join(perf.get('strengths', [])[:3])}""")
    
    # Add selected text if provided
    if selected_text:
        context_parts.append(f"## USER SELECTED THIS TEXT FROM THE CALL:\n\"{selected_text}\"")
    
    # Combine context
    full_context = "\n\n".join(context_parts) if context_parts else "No call context provided."
    
    # Build messages for API
    messages = [
        {"role": "system", "content": AI_ASSISTANT_SYSTEM_PROMPT},
        {"role": "system", "content": f"## CURRENT CALL DATA:\n{full_context}"}
    ]
    
    # Add conversation history
    for msg in conversation_history[-10:]:  # Keep last 10 messages
        messages.append({"role": msg.get('role', 'user'), "content": msg.get('content', '')})
    
    # Add current message
    messages.append({"role": "user", "content": user_message})
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-5.2",
            messages=messages,
            temperature=0.7,
            max_completion_tokens=2000
        )
        
        assistant_response = response.choices[0].message.content.strip()
        
        return jsonify({
            'response': assistant_response,
            'success': True
        })
        
    except Exception as e:
        print(f"AI Assistant error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf_report():
    """Generate a professional PDF report from analysis data"""
    from flask import send_file
    from pdf_generator import generate_analysis_pdf
    
    data = request.json
    analysis_data = data.get('analysis_data', {})
    transcription_data = data.get('transcription_data', {})
    file_name = data.get('file_name', 'call_analysis')
    
    if not analysis_data:
        return jsonify({'error': 'Analysis data is required'}), 400
    
    try:
        pdf_buffer = generate_analysis_pdf(analysis_data, transcription_data)
        
        # Create safe filename
        safe_name = "".join(c for c in file_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        pdf_filename = f"{safe_name}_report.pdf"
        
        return send_file(
            pdf_buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=pdf_filename
        )
    except Exception as e:
        print(f"PDF generation error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============ Live Call Session Endpoints ============

LIVE_COACH_SYSTEM_PROMPT = """You are an ELITE REAL-TIME Sales Coach for HOME IMPROVEMENT SALES providing INSTANT, INTELLIGENT coaching during live sales calls.
You use ADVANCED ANALYSIS including sentiment detection, stage awareness, and pattern recognition to provide PRECISE, ACTIONABLE insights.

## PRODUCTS WE SELL:
- **Cool Life Paint** - Heat reflective exterior coating (lifetime warranty)
- **Turf** - Artificial grass
- **Pavers** - Stone/brick paving for patios, walkways, driveways
- **Concrete** - Driveways, patios, walkways
- **Vinyl/Composite/Aluminum Fence**
- **DG** (decomposed granite)

## THE 3 PROGRAM BENEFITS (TRACK THESE):

**BENEFIT #1 - INCENTIVES (הנחות):**
- Special discounts and incentives passed to customer
- Different from other contractors

**BENEFIT #2 - NO MONEY OUT OF POCKET (NMOOP) FINANCING:**
- Complete project FIRST, customer pays 30-60 days AFTER completion
- Zero risk for customer
- "You don't pay until project is completely finished"

**BENEFIT #3 - MADE IN USA - HIGHEST QUALITY:**
- Only American-made products
- Highest quality materials
- No cheap imports

## ADVANCED ANALYSIS LAYERS:

### 1. SENTIMENT ANALYSIS:
Detect customer emotional state:
- **Positive**: Excitement, agreement, asking next steps → CAPITALIZE
- **Neutral**: Listening, processing → CONTINUE BUILDING VALUE
- **Negative**: Hesitation, objections, frustration → ADDRESS IMMEDIATELY
- **Confusion**: "I don't understand", "What do you mean?" → SIMPLIFY & CLARIFY

### 2. STAGE DETECTION (based on duration + content):
- **0-20 min**: Rapport Building - Focus on connection, discovery questions
- **20-40 min**: Benefit Presentation - Ensure all 3 benefits mentioned
- **40-60 min**: Product/Company Presentation - Build value, demonstrate ROI
- **60-75 min**: Pre-Close - Trial closes, gauge readiness
- **75+ min**: Closing Window - Price reveal, handle objections, close
- **Post-Close**: Cool Down - Lock in decision, prevent cancellation

### 3. BENEFIT TRACKING:
Monitor which benefits were mentioned:
- If missing benefits → Alert to mention them
- If benefit resonated (customer asks questions) → Reinforce it
- If all 3 mentioned → Ready for next stage

### 4. PATTERN RECOGNITION:
- **Talk Ratio Trend**: Is rep dominating? Is customer engaged?
- **Question Quality**: Are discovery questions deep enough?
- **Objection Patterns**: Same objection repeated? Not fully handled?
- **Buying Signals**: Multiple signals? Time to close?

## STORYTELLING FRAMEWORK (6 ELEMENTS):
When handling objections, suggest stories with:
1. **Relatable Character** (name, location, similar situation)
2. **Same Hesitation** (had exact objection)
3. **Decision Moment** (what made them decide)
4. **Cost of Waiting** (what they lost)
5. **Transformation** (specific results with numbers)
6. **Emotional Payoff** (how they feel now)

### KEY STORIES TO SUGGEST:
- **Military Tank Story** (for Cool Life Paint)
- **David's 3-Month Wait Story** (for "need to think")
- **Maria's Spouse Story** (for "need to talk to spouse")
- **Johnson's Cheap Contractor Story** (for "too expensive")

## COACHING TRIGGERS (PRIORITIZED):

### OBJECTION_DETECTED (URGENT) 🔴
Customer expresses: price concern, need to think, spouse, timing, competitor
→ Identify objection type, suggest specific story, provide Feel-Felt-Found script

### BUYING_SIGNAL (URGENT) 🟢
Customer shows: excitement, asks pricing/timeline/next steps, positive body language cues
→ Alert to close NOW, provide assumptive close script

### STAGE_ALERT (HIGH) 🎯
Call stage mismatch detected (e.g., price reveal too early, missing benefits)
→ Alert and suggest correction

### DISCOVERY_PROMPT (HIGH) 🟡
Rep talking too much OR missed pain point opportunity OR shallow questions
→ Suggest specific deep discovery question

### VALUE_BUILDING_CUE (HIGH) 💎
Missing benefit mention OR weak value proposition
→ Remind to explain specific benefit with impact

### SENTIMENT_SHIFT (HIGH) 😟
Customer sentiment changed negative OR confusion detected
→ Alert and suggest clarification/reassurance

### CLOSING_OPPORTUNITY (HIGH) 🟣
All conditions met: 75+ min, benefits covered, customer engaged, positive sentiment
→ Provide trial close or assumptive close script

### TALK_BALANCE_ALERT (MEDIUM) ⚖️
Rep talking >60% during discovery OR <40% during presentation
→ Adjust talk ratio based on stage

## OUTPUT FORMAT (JSON ONLY):
{
  "insight_type": "objection_detected|buying_signal|stage_alert|discovery_prompt|value_building_cue|sentiment_shift|closing_opportunity|talk_balance_alert",
  "priority": "urgent|high|medium|low",
  "coaching_message": "Brief, precise explanation (Hebrew preferred)",
  "suggested_response": "Exact script to say NOW (specific to situation)",
  "technique": "Storytelling|Feel-Felt-Found|LAER|Assumptive Close|Trial Close|3 Benefits|Clarification",
  "audio_script": "SHORT version for earpiece TTS (15-20 words max, Hebrew)",
  "detected_sentiment": "positive|neutral|negative|confused",
  "detected_stage": "rapport|benefits|presentation|pre_close|closing|cool_down",
  "benefits_mentioned": ["incentives"|"nmoop"|"made_in_usa"]
}

Return ONLY valid JSON. If nothing actionable: {"insight_type": "none"}
"""


@app.route('/api/live/sessions', methods=['GET'])
def get_live_sessions():
    """Get all live sessions for the current user"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    sessions = get_user_live_sessions(user_id)
    return jsonify(sessions)


@app.route('/api/live/sessions', methods=['POST'])
def start_live_session():
    """Start a new live call session"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    # Check for existing active session
    active = get_active_session(user_id)
    if active:
        return jsonify({'error': 'Already have an active session', 'session': active}), 400
    
    data = request.json or {}
    session = create_live_session(
        user_id=user_id,
        customer_name=data.get('customer_name'),
        customer_phone=data.get('customer_phone'),
        deal_type=data.get('deal_type'),
        estimated_value=data.get('estimated_value'),
        coaching_language=data.get('coaching_language', 'he'),
        coaching_intensity=data.get('coaching_intensity', 'balanced')
    )
    
    if session:
        return jsonify(session)
    return jsonify({'error': 'Failed to create session'}), 500


@app.route('/api/live/sessions/<session_id>', methods=['GET'])
def get_session_detail(session_id):
    """Get details of a specific live session"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    session = get_live_session(session_id, user_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    # Include insights and transcript
    insights = get_session_insights(session_id)
    transcript = get_session_transcript(session_id)
    
    return jsonify({
        'session': session,
        'insights': insights,
        'transcript': transcript
    })


@app.route('/api/live/sessions/<session_id>/end', methods=['POST'])
def end_session(session_id):
    """End a live session"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    # Verify ownership
    session = get_live_session(session_id, user_id)
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    
    data = request.json or {}
    result = end_live_session(session_id, data)
    
    if result:
        return jsonify(result)
    return jsonify({'error': 'Failed to end session'}), 500


@app.route('/api/live/sessions/<session_id>/transcript', methods=['POST'])
def add_transcript_chunk(session_id):
    """Add a transcript chunk to the session"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.json
    if not data or not data.get('text'):
        return jsonify({'error': 'Text is required'}), 400
    
    chunk = save_transcript_chunk(
        session_id=session_id,
        start_ms=data.get('start_ms', 0),
        end_ms=data.get('end_ms', 0),
        speaker=data.get('speaker', 'unknown'),
        text=data.get('text'),
        confidence=data.get('confidence'),
        contains_objection=data.get('contains_objection', False),
        contains_buying_signal=data.get('contains_buying_signal', False),
        sentiment=data.get('sentiment')
    )
    
    if chunk:
        return jsonify(chunk)
    return jsonify({'error': 'Failed to save chunk'}), 500


@app.route('/api/live/sessions/<session_id>/analyze', methods=['POST'])
def analyze_live_chunk(session_id):
    """Analyze a transcript chunk and return real-time coaching"""
    if not openai_client:
        return jsonify({'error': 'OpenAI not configured'}), 500
    
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.json
    if not data:
        return jsonify({'error': 'Data required'}), 400
    
    transcript_chunk = data.get('transcript_chunk', '')
    full_context = data.get('full_context', '')
    call_duration_seconds = data.get('duration_seconds', 0)
    seller_talk_pct = data.get('seller_talk_percentage', 50)
    coaching_language = data.get('coaching_language', 'he')
    
    # Build context for AI
    context = f"""
## CURRENT TRANSCRIPT CHUNK (last 30 seconds):
{transcript_chunk}

## FULL CALL CONTEXT (summary):
{full_context[:2000] if full_context else 'Beginning of call'}

## CALL METRICS:
- Duration: {call_duration_seconds} seconds
- Seller Talk: {seller_talk_pct}%
- Language: {'Hebrew' if coaching_language == 'he' else 'English'}

## ANALYZE AND PROVIDE COACHING:
Look for:
1. Customer objections or hesitations
2. Buying signals (interest, questions about next steps, pricing)
3. If seller is talking too much (>60%)
4. Opportunities to close or build value

Respond in {'Hebrew' if coaching_language == 'he' else 'English'}.
"""
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",  # Fast model for real-time
            messages=[
                {"role": "system", "content": LIVE_COACH_SYSTEM_PROMPT},
                {"role": "user", "content": context}
            ],
            temperature=0.3,
            max_completion_tokens=500
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Parse JSON response
        try:
            # Handle markdown code blocks
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()
            
            insight = json.loads(result_text)
            
            # If no actionable insight, return empty
            if insight.get('insight_type') == 'none':
                return jsonify({'insight': None, 'has_insight': False})
            
            # Save insight to database
            saved = save_live_insight(
                session_id=session_id,
                insight_type=insight.get('insight_type', 'discovery_prompt'),
                coaching_message=insight.get('coaching_message', ''),
                timestamp_ms=data.get('timestamp_ms', 0),
                priority=insight.get('priority', 'medium'),
                trigger_text=transcript_chunk[:500],
                suggested_response=insight.get('suggested_response'),
                technique=insight.get('technique'),
                delivery_method='audio' if insight.get('priority') in ['urgent', 'high'] else 'visual'
            )
            
            return jsonify({
                'insight': insight,
                'has_insight': True,
                'saved_id': saved.get('id') if saved else None
            })
            
        except json.JSONDecodeError:
            print(f"[analyze_live_chunk] JSON parse error: {result_text}")
            return jsonify({'insight': None, 'has_insight': False, 'raw': result_text})
            
    except Exception as e:
        print(f"[analyze_live_chunk] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/live/sessions/<session_id>/tts', methods=['POST'])
def live_session_tts(session_id):
    """Generate TTS audio for live coaching insight"""
    if not openai_client:
        return jsonify({'error': 'OpenAI not configured'}), 500
    
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.json
    text = data.get('text', '')
    
    if not text:
        return jsonify({'error': 'Text required'}), 400
    
    # Keep it short for real-time
    if len(text) > 200:
        text = text[:200]
    
    try:
        response = openai_client.audio.speech.create(
            model="tts-1",  # Faster model
            voice="nova",
            input=text,
            speed=1.1  # Slightly faster for urgency
        )
        
        audio_filename = f"live_tts_{uuid.uuid4().hex[:8]}.mp3"
        audio_path = os.path.join(UPLOAD_FOLDER, audio_filename)
        response.stream_to_file(audio_path)
        
        return jsonify({
            'audio_url': f'/api/audio/{audio_filename}',
            'text': text
        })
        
    except Exception as e:
        print(f"[live_session_tts] Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/live/active', methods=['GET'])
def get_active_live_session():
    """Get the user's currently active session if any"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    session = get_active_session(user_id)
    return jsonify({'session': session, 'has_active': session is not None})


@app.route('/api/live/assemblyai-token', methods=['GET'])
def get_assemblyai_token():
    """Get temporary token for AssemblyAI Universal Streaming v3"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    if not ASSEMBLYAI_API_KEY:
        return jsonify({'error': 'AssemblyAI not configured'}), 500
    
    try:
        import requests
        
        # Generate temporary token using AssemblyAI v3 API
        response = requests.post(
            'https://api.assemblyai.com/v3/streaming/token',
            headers={
                'Authorization': ASSEMBLYAI_API_KEY,
                'Content-Type': 'application/json'
            },
            json={
                'expires_in_seconds': 3600  # 1 hour
            }
        )
        
        if response.status_code != 200:
            print(f"[get_assemblyai_token] Token error: {response.status_code} - {response.text}")
            # Fallback: return API key for direct use (backend proxy scenario)
            return jsonify({
                'api_key': ASSEMBLYAI_API_KEY,
                'use_api_key': True
            })
        
        token_data = response.json()
        token = token_data.get('token')
        
        print(f"[get_assemblyai_token] Got temporary token for user {user_id}")
        return jsonify({
            'token': token,
            'use_api_key': False
        })
        
    except Exception as e:
        print(f"[get_assemblyai_token] Error: {e}")
        # Fallback to API key
        return jsonify({
            'api_key': ASSEMBLYAI_API_KEY,
            'use_api_key': True
        })


@app.route('/api/live/test-assemblyai', methods=['GET'])
def test_assemblyai():
    """Test AssemblyAI API key configuration"""
    if not ASSEMBLYAI_API_KEY:
        return jsonify({'error': 'ASSEMBLYAI_API_KEY not set', 'configured': False})
    
    # New Universal Streaming API just needs the API key
    # No token generation needed - connect directly with api_key parameter
    return jsonify({
        'success': True,
        'configured': True,
        'api_key_set': True,
        'api_key_preview': ASSEMBLYAI_API_KEY[:10] + '...' if ASSEMBLYAI_API_KEY else None,
        'websocket_url': 'wss://streaming.assemblyai.com',
        'note': 'Use api_key query parameter with WebSocket connection'
    })


@app.route('/api/live/sessions/<session_id>/process-transcript', methods=['POST'])
def process_live_transcript(session_id):
    """Process a batch of transcript and analyze for coaching insights"""
    if not openai_client:
        return jsonify({'error': 'OpenAI not configured'}), 500
    
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.json
    if not data:
        return jsonify({'error': 'Data required'}), 400
    
    # Get the recent transcript text
    recent_text = data.get('recent_text', '')
    full_transcript = data.get('full_transcript', '')
    duration_seconds = data.get('duration_seconds', 0)
    seller_words = data.get('seller_words', 0)
    buyer_words = data.get('buyer_words', 0)
    total_words = seller_words + buyer_words
    seller_pct = round((seller_words / total_words * 100) if total_words > 0 else 50)
    coaching_language = data.get('coaching_language', 'he')
    
    # Build analysis context
    context = f"""
## האחרונים 60 שניות של השיחה:
{recent_text}

## סיכום השיחה עד כה:
{full_transcript[:3000] if len(full_transcript) > 3000 else full_transcript}

## מדדי השיחה:
- משך: {duration_seconds} שניות ({duration_seconds // 60} דקות)
- יחס דיבור מוכר: {seller_pct}%
- יחס דיבור לקוח: {100 - seller_pct}%
- סה"כ מילים: {total_words}

## נתח ותן אימון:
1. האם יש התנגדות שצריך לטפל בה?
2. האם יש סיגנל קנייה שצריך לקפוץ עליו?
3. האם המוכר מדבר יותר מדי (מעל 60%)?
4. האם יש הזדמנות לשאלת discovery?
5. האם הגיע הזמן לסגור?

תגיב בעברית.
"""
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": LIVE_COACH_SYSTEM_PROMPT},
                {"role": "user", "content": context}
            ],
            temperature=0.3,
            max_completion_tokens=800
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Parse JSON
        try:
            if '```json' in result_text:
                result_text = result_text.split('```json')[1].split('```')[0].strip()
            elif '```' in result_text:
                result_text = result_text.split('```')[1].split('```')[0].strip()
            
            insight = json.loads(result_text)
            
            if insight.get('insight_type') == 'none':
                return jsonify({'insight': None, 'has_insight': False})
            
            # Save to database
            saved = save_live_insight(
                session_id=session_id,
                insight_type=insight.get('insight_type', 'discovery_prompt'),
                coaching_message=insight.get('coaching_message', ''),
                timestamp_ms=duration_seconds * 1000,
                priority=insight.get('priority', 'medium'),
                trigger_text=recent_text[:500],
                suggested_response=insight.get('suggested_response'),
                technique=insight.get('technique'),
                delivery_method='audio' if insight.get('priority') in ['urgent', 'high'] else 'visual'
            )
            
            return jsonify({
                'insight': insight,
                'has_insight': True,
                'saved_id': saved.get('id') if saved else None
            })
            
        except json.JSONDecodeError:
            return jsonify({'insight': None, 'has_insight': False, 'raw': result_text})
            
    except Exception as e:
        print(f"[process_live_transcript] Error: {e}")
        return jsonify({'error': str(e)}), 500


# ============================================
# AI AGENT - AUDIO CHUNK TRANSCRIPTION
# ============================================

@app.route('/api/ai-agent/transcribe', methods=['POST'])
def ai_agent_transcribe():
    """Transcribe audio chunk using OpenAI Whisper (fast and reliable)"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    if not openai_client:
        return jsonify({'error': 'OpenAI not configured'}), 500
    
    audio_file = request.files['audio']
    
    try:
        import tempfile
        import os
        
        # Save audio to temp file (Whisper supports webm)
        with tempfile.NamedTemporaryFile(delete=False, suffix='.webm') as tmp:
            audio_file.save(tmp.name)
            tmp_path = tmp.name
        
        # Check file size - skip if too small
        file_size = os.path.getsize(tmp_path)
        if file_size < 1000:
            os.unlink(tmp_path)
            return jsonify({'success': True, 'segments': [], 'full_text': ''})
        
        # Transcribe with OpenAI Whisper
        with open(tmp_path, 'rb') as audio:
            transcript = openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio,
                language="en",
                response_format="verbose_json"
            )
        
        # Clean up temp file
        os.unlink(tmp_path)
        
        text = transcript.text if hasattr(transcript, 'text') else str(transcript)
        
        if not text or not text.strip():
            return jsonify({'success': True, 'segments': [], 'full_text': ''})
        
        # Simple speaker detection based on content analysis
        # We'll use the AI to determine speaker in a follow-up
        segments = [{
            'speaker': 'Seller',  # Default to seller, AI will analyze context
            'text': text.strip(),
            'start': 0,
            'end': 0,
            'confidence': 0.95
        }]
        
        return jsonify({
            'success': True,
            'segments': segments,
            'full_text': text.strip()
        })
        
    except Exception as e:
        print(f"[ai_agent_transcribe] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================
# AI AGENT - SMART REAL-TIME COACHING
# ============================================

AI_AGENT_SYSTEM_PROMPT = """You are an ELITE ONE-CALL CLOSE SPECIALIST whispering coaching in the salesperson's ear during a LIVE home improvement sales call.

## YOUR ROLE:
- Coach the seller in REAL-TIME to CLOSE THE DEAL in this single visit
- Identify critical moments that could make or break the sale
- Provide actionable coaching they can use IMMEDIATELY

## PRODUCTS WE SELL:
- **Cool Life Paint** - Heat reflective exterior coating (lifetime warranty, never paint again)
- **Turf** - Artificial grass (saves water, no maintenance)
- **Pavers** - Stone/brick paving for patios, walkways, driveways
- **Concrete** - Driveways, patios, walkways
- **Vinyl/Composite/Aluminum Fence** - Low maintenance fencing
- **DG** - Decomposed granite landscaping

## THE COMPANY'S PROVEN CALL STRUCTURE (2-3 HOURS):
1. **ICE BREAKING/TRUST** (20 min) - Find personal connection, stack "yes" answers
2. **BENEFIT/PROGRAM** (20 min) - Explain 3 KEY BENEFITS:
   - INCENTIVES: Special discounts we can offer
   - NMOOP: No Money Out of Pocket - pay 30-60 days AFTER project complete
   - MADE IN USA: Highest quality materials
3. **PRODUCT PRESENTATION** (20 min) - Show specific product, visual demos, ROI
4. **COMPANY PRESENTATION** (20 min) - TWO HATS positioning:
   - Contractor Hat: Handle A-Z, permits, inspections
   - Financial Advisor Hat: Show ROI, home value increase
5. **GET 3 YES** - Confirm: Benefit ✓, Product ✓, Company ✓
6. **PRICE REVEAL** - ⚠️ ONLY AFTER 75+ MINUTES! Before price ask: "Do you like the product? Company? Trust me?"
7. **CLOSING/OBJECTIONS** - Use isolation technique, create urgency
8. **COOL DOWN** (10-15 min) - "Why did you decide?" - prevents cancellations!

## CRITICAL COACHING TRIGGERS:

### 🚨 OBJECTION DETECTED (priority: high)
**"I need to think about it"** → Use 4-Yes technique:
- "Do you want to do the project?" → yes
- "Do you like the company?" → yes  
- "Do you trust me?" → yes
- "So it's just the price, right?" → Now isolate and handle price

**"Need to talk to spouse"** → "I understand. Do you think this is right for your home? Do you like the company? Let's call them together."

**"Too expensive"** → Tell the contractor story: "Let me tell you about someone who went cheaper..."

**"Getting other quotes"** → "Fair enough. If you find same quality, warranty, trust for less - go with it. But let me show you why that's hard to find..."

### 🎯 BUYING SIGNAL (priority: urgent)
Customer says: "sounds good", "I like it", "when can you start?", "how do we begin?"
→ CLOSE NOW! "Great! Let's get the paperwork started. I just need..."

### ⚠️ PRICE TOO EARLY (priority: urgent)
Price mentioned before 75 minutes OR before value built
→ "STOP! Redirect to benefits first. Say: 'Before we get to investment, let me show you why this is different...'"

### 📊 TALK RATIO PROBLEM (priority: medium)
Seller >65% talking → "Ask a question! Try: 'What's most important to you about this project?'"

### 💡 MISSED OPPORTUNITY (priority: high)
- Customer mentions problem but seller didn't dig deeper
- Customer shows interest but seller didn't trial close
- Seller didn't use YES LADDER
→ Suggest specific question or technique

### 🎭 STORYTELLING MOMENT (priority: medium)
Good time for a story → Provide a brief story framework:
"Tell them about [similar customer] who had the same concern..."

## PAIN DISCOVERY QUESTIONS BY PRODUCT:

**COOL LIFE PAINT:**
- "When did you last paint? See any peeling on the sunny side?"
- "Do you know it costs $10-12K to paint every 7-8 years? That's $35K over 25 years!"
- Use MILITARY TANK STORY for heat reflection

**TURF:**
- "What's your water bill in summer? What do you pay for gardening?"
- "Calculate: Water + Gardener = $100-400/mo = $110K+ over 20 years!"

**PAVERS/CONCRETE:**
- "Is your current patio cracked or stained? How does it make you feel when guests come?"

**FENCING:**
- "Is your fence rotting or leaning? Tired of painting it every few years?"

## RESPONSE FORMAT (JSON only):
{
  "insight_type": "objection_detected|buying_signal|price_too_early|talk_ratio_alert|missed_opportunity|storytelling_moment|discovery_question|none",
  "priority": "urgent|high|medium",
  "coaching_message": "Clear coaching tip (2-3 sentences)",
  "suggested_response": "Exact words to say RIGHT NOW",
  "technique": "Technique being used (4-Yes, Isolation, Yes Ladder, etc.)",
  "audio_script": "Short for earpiece (max 15 words)"
}

## RULES:
1. Only coach on CRITICAL moments - don't interrupt good flow
2. Be SPECIFIC to what was just said in the transcript
3. Provide READY-TO-USE scripts, not generic advice
4. Focus on what will CLOSE THE DEAL
5. If nothing critical happening, return: {"insight_type": "none"}"""


# ============================================
# INTELLIGENT EVENT-BASED TRIGGER SYSTEM
# Only coaches when truly relevant - like Balto
# ============================================

# Objection detection patterns (Hebrew + English)
OBJECTION_PATTERNS = {
    'need_to_think': {
        'patterns': ['צריך לחשוב', 'need to think', 'think about it', 'let me think', 'לחשוב על זה', 'אחשוב על זה'],
        'priority': 'urgent',
        'technique': '4-Yes Technique',
        'story': "David's 3-Month Wait Story",
        'response_he': 'אני מבין לגמרי. תן לי לשאול - האם אתה מסכים שיש בעיה שצריך לפתור?',
        'response_en': 'I totally understand. Let me ask - do you agree there\'s a problem that needs solving?'
    },
    'too_expensive': {
        'patterns': ['יקר', 'expensive', 'too much', 'can\'t afford', 'budget', 'כסף', 'תקציב', 'לא יכול להרשות'],
        'priority': 'urgent',
        'technique': 'Value Reframe + Story',
        'story': "Johnson's Cheap Contractor Story",
        'response_he': 'אני שומע אותך. תן לי לספר לך על משפחת ג\'ונסון שחשבו אותו דבר...',
        'response_en': 'I hear you. Let me tell you about the Johnson family who thought the same thing...'
    },
    'spouse_decision': {
        'patterns': ['בן זוג', 'wife', 'husband', 'spouse', 'partner', 'אשתי', 'בעלי', 'לדבר עם'],
        'priority': 'urgent',
        'technique': 'Include Now',
        'story': "Maria's Spouse Story",
        'response_he': 'אני לגמרי מבין. מריה אמרה אותו דבר. תן לי לשאול - מה לדעתך הכי חשוב לבן/בת הזוג שלך?',
        'response_en': 'I totally understand. Maria said the same thing. What do you think matters most to your spouse?'
    },
    'getting_quotes': {
        'patterns': ['הצעות', 'quotes', 'other companies', 'shopping around', 'comparing', 'חברות אחרות', 'משווה'],
        'priority': 'high',
        'technique': 'Differentiation',
        'story': None,
        'response_he': 'זה חכם להשוות. תן לי להראות לך למה לא תמצא את מה שאנחנו מציעים במקום אחר...',
        'response_en': 'Smart to compare. Let me show you why you won\'t find what we offer anywhere else...'
    },
    'bad_timing': {
        'patterns': ['לא עכשיו', 'not now', 'bad time', 'later', 'next year', 'אחר כך', 'בהמשך', 'לא הזמן'],
        'priority': 'high',
        'technique': 'Cost of Waiting',
        'story': None,
        'response_he': 'אני מבין. תן לי לשאול - מה ישתנה בעוד חודש? כי מחירי החומרים עלו 15% בשנה האחרונה...',
        'response_en': 'I understand. What will change in a month? Material costs went up 15% last year...'
    }
}

# Price-related keywords to detect early price reveal
PRICE_KEYWORDS = ['מחיר', 'price', 'cost', 'how much', 'כמה זה עולה', 'עלות', 'תשלום', 'payment']

# Product-specific pain discovery questions
PRODUCT_DISCOVERY = {
    'paint': {
        'keywords': ['צבע', 'paint', 'peeling', 'קילוף', 'חיצוני', 'exterior'],
        'questions': [
            'מתי בפעם האחרונה צבעתם? רואים קילופים בצד השמש?',
            'אתה יודע שעולה $10-12K לצבוע כל 7-8 שנים? זה $35K על 25 שנה!'
        ],
        'story': 'Military Tank Story - הצבא האמריקאי משתמש בזה על טנקים!'
    },
    'turf': {
        'keywords': ['דשא', 'turf', 'grass', 'גינה', 'lawn', 'water'],
        'questions': [
            'כמה חשבון המים שלך בקיץ? מה משלמים על גנן?',
            'חישוב: מים + גנן = $100-400 בחודש = $110K+ על 20 שנה!'
        ],
        'story': None
    },
    'pavers': {
        'keywords': ['אבן', 'pavers', 'patio', 'פטיו', 'מרצפות', 'בטון', 'concrete'],
        'questions': [
            'הפטיו הנוכחי סדוק או מוכתם? איך זה גורם לך להרגיש כשמגיעים אורחים?'
        ],
        'story': None
    },
    'fence': {
        'keywords': ['גדר', 'fence', 'fencing', 'רקוב', 'rotting'],
        'questions': [
            'הגדר נרקבת או נוטה? נמאס לך לצבוע אותה כל כמה שנים?'
        ],
        'story': None
    }
}

# Phase-based coaching tips
PHASE_COACHING = {
    'ice': {  # 0-20 min
        'tips': [
            'מצא חיבור אישי - תחביבים, משפחה, עבודה',
            'שאל על הבית - מתי קנו? למה בחרו באזור?',
            'הקשב יותר מתדבר - זה שלב הכרות'
        ],
        'warning_if_missing': 'עדיין לא יצרת חיבור אישי - שאל על המשפחה/עבודה'
    },
    'benefits': {  # 20-40 min
        'required': ['incentives', 'nmoop', 'made_in_usa'],
        'tips': [
            '3 היתרונות: 1) הנחות מיוחדות 2) NMOOP - משלמים רק אחרי 3) Made in USA',
            'הסבר NMOOP: "אתה לא משלם שקל עד שהפרויקט גמור לשביעות רצונך"'
        ]
    },
    'product': {  # 40-60 min
        'tips': [
            'זה הזמן לשאלות כאב לפי המוצר',
            'השתמש בסיפור הטנק אם מדברים על Cool Life Paint',
            'בנה ערך לפני שמזכירים מחיר!'
        ]
    },
    'company': {  # 60-75 min
        'tips': [
            'TWO HATS - אתה גם נציג החברה וגם היועץ של הלקוח',
            'YES LADDER - בנה רצף של כן: אוהב את המוצר? את החברה? סומך עליי?'
        ]
    },
    'price': {  # 75-90 min
        'tips': [
            'לפני מחיר וודא: שאלת 3 שאלות הכן?',
            'Trial close: "אם המחיר מתאים, נוכל להתחיל השבוע?"'
        ]
    }
}

def detect_triggers(transcript_chunk, full_transcript, duration_seconds, seller_percentage):
    """
    Intelligent trigger detection - returns trigger info if relevant, None if nothing to coach on.
    Now includes proactive coaching: discovery questions, story reminders, phase guidance.
    """
    chunk_lower = transcript_chunk.lower()
    full_lower = full_transcript.lower() if full_transcript else ''
    minutes = duration_seconds // 60
    
    # 1. OBJECTION DETECTION (highest priority)
    for obj_type, obj_data in OBJECTION_PATTERNS.items():
        for pattern in obj_data['patterns']:
            if pattern.lower() in chunk_lower:
                buyer_indicator = '[buyer]' in chunk_lower or '[לקוח]' in chunk_lower
                if buyer_indicator or '[seller]' not in chunk_lower:
                    return {
                        'trigger_type': 'objection',
                        'objection_type': obj_type,
                        'priority': obj_data['priority'],
                        'technique': obj_data['technique'],
                        'story': obj_data['story'],
                        'suggested_response': obj_data['response_he'],
                        'pattern_matched': pattern
                    }
    
    # 2. PRICE TOO EARLY
    if minutes < 60:
        for price_word in PRICE_KEYWORDS:
            if price_word.lower() in chunk_lower and '[seller]' in chunk_lower:
                return {
                    'trigger_type': 'price_too_early',
                    'priority': 'urgent',
                    'minutes_remaining': 60 - minutes,
                    'suggested_response': f'עצור! אל תגיד מחיר. חסרות עוד {60 - minutes} דקות של בניית ערך.'
                }
    
    # 3. PRODUCT MENTION - Suggest discovery questions
    for product, data in PRODUCT_DISCOVERY.items():
        for keyword in data['keywords']:
            if keyword.lower() in chunk_lower:
                # Product mentioned - suggest relevant discovery question
                import random
                question = random.choice(data['questions'])
                return {
                    'trigger_type': 'discovery_opportunity',
                    'priority': 'high',
                    'product': product,
                    'technique': 'Pain Discovery',
                    'story': data.get('story'),
                    'suggested_response': question
                }
    
    # 4. TALK RATIO ALERT
    if seller_percentage > 70 and minutes > 5:
        return {
            'trigger_type': 'talk_ratio',
            'priority': 'medium',
            'seller_percentage': seller_percentage,
            'suggested_response': 'שאל שאלה! נסה: "מה הכי חשוב לך בפרויקט הזה?"'
        }
    
    # 5. PHASE-BASED COACHING (every ~3 minutes check if something is missing)
    if minutes > 0 and minutes % 3 == 0:
        # Check phase-specific guidance
        if minutes < 20:  # Ice phase
            if 'משפחה' not in full_lower and 'family' not in full_lower and 'עבודה' not in full_lower:
                return {
                    'trigger_type': 'phase_reminder',
                    'priority': 'medium',
                    'phase': 'ice',
                    'technique': 'Rapport Building',
                    'suggested_response': 'עדיין לא יצרת חיבור - שאל: "ספר לי קצת על המשפחה/העבודה"'
                }
        elif 20 <= minutes < 40:  # Benefits phase
            benefits_mentioned = []
            if 'הנחה' in full_lower or 'incentive' in full_lower:
                benefits_mentioned.append('incentives')
            if 'nmoop' in full_lower or 'לא משלם' in full_lower or 'אחרי' in full_lower:
                benefits_mentioned.append('nmoop')
            if 'אמריק' in full_lower or 'usa' in full_lower or 'made in' in full_lower:
                benefits_mentioned.append('made_in_usa')
            
            if len(benefits_mentioned) < 2:
                missing = [b for b in ['incentives', 'nmoop', 'made_in_usa'] if b not in benefits_mentioned]
                return {
                    'trigger_type': 'missing_benefit',
                    'priority': 'high',
                    'phase': 'benefits',
                    'missing': missing[0] if missing else 'benefit',
                    'technique': '3 Benefits',
                    'suggested_response': 'חסר יתרון! הזכר: ' + ('הנחות מיוחדות' if 'incentives' in missing else 'NMOOP - משלמים רק אחרי סיום' if 'nmoop' in missing else 'Made in USA - איכות אמריקאית')
                }
    
    # 6. No trigger - stay silent
    return None


@app.route('/api/ai-agent/analyze', methods=['POST', 'OPTIONS'])
def ai_agent_analyze():
    """
    INTELLIGENT Real-time AI coaching - EVENT-BASED, NOT TIME-BASED.
    Only returns insights when there's a genuine trigger (objection, critical moment).
    """
    # Handle preflight OPTIONS request
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    if not openai_client:
        return jsonify({'error': 'OpenAI not configured'}), 500
    
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    data = request.json
    if not data:
        return jsonify({'error': 'Data required'}), 400
    
    transcript = data.get('transcript', '')
    new_chunk = data.get('new_chunk', '')  # Only the latest chunk for trigger detection
    duration_seconds = data.get('duration_seconds', 0)
    seller_words = data.get('seller_words', 0)
    buyer_words = data.get('buyer_words', 0)
    seller_percentage = data.get('seller_percentage', 50)
    force_analysis = data.get('force_analysis', False)  # Manual trigger from user
    
    if not transcript or len(transcript.strip()) < 30:
        return jsonify({'insight': None, 'has_insight': False})
    
    # Get the chunk to analyze (new chunk or last 500 chars)
    chunk_to_analyze = new_chunk if new_chunk else transcript[-500:]
    
    # STEP 1: Fast local trigger detection (no AI call needed for clear patterns)
    trigger = detect_triggers(chunk_to_analyze, transcript, duration_seconds, seller_percentage)
    
    if trigger:
        # We have a clear trigger - build appropriate response
        minutes = duration_seconds // 60
        
        if trigger['trigger_type'] == 'objection':
            # Objection detected - provide immediate coaching
            obj_type = trigger['objection_type'].replace('_', ' ').title()
            return jsonify({
                'insight': {
                    'insight_type': 'objection_detected',
                    'priority': trigger['priority'],
                    'coaching_message': f'🔴 התנגדות: {obj_type}',
                    'suggested_response': trigger['suggested_response'],
                    'technique': trigger['technique'],
                    'story': trigger['story'],
                    'audio_script': f"התנגדות! השתמש ב{trigger['technique']}"
                },
                'has_insight': True,
                'trigger_type': 'objection'
            })
        
        elif trigger['trigger_type'] == 'price_too_early':
            return jsonify({
                'insight': {
                    'insight_type': 'price_too_early',
                    'priority': 'urgent',
                    'coaching_message': f'⚠️ מחיר מוקדם מדי! חסרות {trigger["minutes_remaining"]} דקות',
                    'suggested_response': trigger['suggested_response'],
                    'technique': 'Redirect to Value',
                    'audio_script': 'עצור! אל תזכיר מחיר עכשיו'
                },
                'has_insight': True,
                'trigger_type': 'price_too_early'
            })
        
        elif trigger['trigger_type'] == 'discovery_opportunity':
            return jsonify({
                'insight': {
                    'insight_type': 'discovery_question',
                    'priority': trigger['priority'],
                    'coaching_message': f'💡 הזדמנות לשאלת כאב - {trigger["product"]}',
                    'suggested_response': trigger['suggested_response'],
                    'technique': trigger['technique'],
                    'story': trigger.get('story'),
                    'audio_script': 'שאל שאלת כאב עכשיו'
                },
                'has_insight': True,
                'trigger_type': 'discovery'
            })
        
        elif trigger['trigger_type'] == 'talk_ratio':
            return jsonify({
                'insight': {
                    'insight_type': 'talk_ratio_alert',
                    'priority': 'medium',
                    'coaching_message': f'⚖️ יחס דיבור: {trigger["seller_percentage"]}% - יותר מדי!',
                    'suggested_response': trigger['suggested_response'],
                    'technique': 'Ask Question',
                    'audio_script': 'שאל שאלה! אתה מדבר יותר מדי'
                },
                'has_insight': True,
                'trigger_type': 'talk_ratio'
            })
        
        elif trigger['trigger_type'] == 'phase_reminder':
            return jsonify({
                'insight': {
                    'insight_type': 'phase_coaching',
                    'priority': trigger['priority'],
                    'coaching_message': f'📍 שלב {trigger["phase"].upper()} - תזכורת',
                    'suggested_response': trigger['suggested_response'],
                    'technique': trigger['technique'],
                    'audio_script': 'תזכורת לשלב הנוכחי'
                },
                'has_insight': True,
                'trigger_type': 'phase'
            })
        
        elif trigger['trigger_type'] == 'missing_benefit':
            return jsonify({
                'insight': {
                    'insight_type': 'missing_benefit',
                    'priority': trigger['priority'],
                    'coaching_message': f'⭐ חסר יתרון: {trigger["missing"]}',
                    'suggested_response': trigger['suggested_response'],
                    'technique': trigger['technique'],
                    'audio_script': 'הזכר את היתרון החסר'
                },
                'has_insight': True,
                'trigger_type': 'benefit'
            })
    
    # STEP 2: If forced analysis OR significant new content, use AI for deeper analysis
    if force_analysis or (len(new_chunk) > 200):
        minutes = duration_seconds // 60
        call_phase = get_call_phase(minutes)
        
        # Only call AI if we have substantial new content
        context = f"""## ANALYZE ONLY IF THERE'S SOMETHING CRITICAL:

Last exchange:
{chunk_to_analyze}

Call phase: {call_phase} ({minutes} min)
Talk ratio: Seller {seller_percentage}%

RULES:
1. ONLY respond if there's a CLEAR objection, buying signal, or critical mistake
2. If conversation is flowing normally - return {"insight_type": "none"}
3. Don't coach on every little thing - only CRITICAL moments
4. We already handle basic objections locally - only add value for complex situations

Return JSON: {{"insight_type": "objection_detected|buying_signal|stage_mistake|none", "priority": "urgent|high|medium", "coaching_message": "...", "suggested_response": "..."}}"""
        
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o-mini",  # Fast model for speed
                messages=[
                    {"role": "system", "content": "You are a sales coach. Only respond when there's a CRITICAL moment. Most of the time return {\"insight_type\": \"none\"}. Be very selective."},
                    {"role": "user", "content": context}
                ],
                temperature=0.2,
                max_completion_tokens=300
            )
            
            result_text = response.choices[0].message.content.strip()
            
            try:
                if '```json' in result_text:
                    result_text = result_text.split('```json')[1].split('```')[0].strip()
                elif '```' in result_text:
                    result_text = result_text.split('```')[1].split('```')[0].strip()
                
                insight = json.loads(result_text)
                
                if insight.get('insight_type') == 'none':
                    return jsonify({'insight': None, 'has_insight': False})
                
                return jsonify({
                    'insight': insight,
                    'has_insight': True,
                    'trigger_type': 'ai_analysis'
                })
                
            except json.JSONDecodeError:
                return jsonify({'insight': None, 'has_insight': False})
                
        except Exception as e:
            print(f"[ai_agent_analyze] AI error: {e}")
            return jsonify({'insight': None, 'has_insight': False})
    
    # No trigger, no forced analysis - stay silent
    return jsonify({'insight': None, 'has_insight': False})


def get_call_phase(minutes):
    """Get current call phase based on duration"""
    if minutes < 20:
        return 'ICE BREAKING'
    elif minutes < 40:
        return 'BENEFITS'
    elif minutes < 60:
        return 'PRODUCT'
    elif minutes < 75:
        return 'COMPANY'
    elif minutes < 90:
        return 'PRICE'
    else:
        return 'CLOSE'


@app.route('/api/ai-agent/analyze-chunk', methods=['POST', 'OPTIONS'])
def ai_agent_analyze_chunk():
    """
    NEW: Analyze a single new chunk for triggers.
    Called immediately when new transcript arrives - fast local detection.
    """
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    data = request.json
    if not data:
        return jsonify({'trigger': None, 'has_trigger': False})
    
    chunk = data.get('chunk', '')
    duration_seconds = data.get('duration_seconds', 0)
    seller_percentage = data.get('seller_percentage', 50)
    
    # Fast local trigger detection only
    trigger = detect_triggers(chunk, '', duration_seconds, seller_percentage)
    
    if trigger:
        return jsonify({
            'trigger': trigger,
            'has_trigger': True
        })
    
    return jsonify({'trigger': None, 'has_trigger': False})


# Keep old endpoint for backwards compatibility
@app.route('/api/ai-agent/analyze-legacy', methods=['POST', 'OPTIONS'])
def ai_agent_analyze_legacy():
    """Legacy endpoint - interval-based analysis (deprecated)"""
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'ok'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        return response
    
    # Redirect to new endpoint
    return ai_agent_analyze()


# ============================================
# Socket.IO Event Handlers for Real-Time Transcription
# ============================================

def get_assemblyai_streaming_token():
    """Get a temporary token from AssemblyAI for WebSocket streaming"""
    import requests
    
    try:
        response = requests.get(
            'https://streaming.assemblyai.com/v3/token',
            headers={'Authorization': f'Bearer {ASSEMBLYAI_API_KEY}'},
            params={'expires_in_seconds': 600},  # Token valid for 10 minutes (max allowed)
            timeout=10
        )
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get('token')
            print(f"[AssemblyAI] Got streaming token: {token[:20]}...")
            return token
        else:
            print(f"[AssemblyAI] Token error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"[AssemblyAI] Token request failed: {e}")
        return None


def create_assemblyai_websocket(client_sid, sample_rate=16000):
    """Create a WebSocket connection to AssemblyAI Real-Time Streaming v3"""
    
    streaming_connection_ready[client_sid] = False
    
    # Step 1: Get temporary streaming token
    token = get_assemblyai_streaming_token()
    if not token:
        socketio.emit('error', {'message': 'Failed to get AssemblyAI streaming token'}, to=client_sid)
        return None
    
    def on_message(ws, message):
        """Handle messages from AssemblyAI v3"""
        try:
            data = json.loads(message)
            msg_type = data.get('type', data.get('message_type', 'unknown'))
            
            # AssemblyAI v3 uses "Turn" for transcription results
            if msg_type == 'Turn':
                transcript = data.get('transcript', '')
                is_final = data.get('turn_is_formatted', False) or data.get('end_of_turn', False)
                speaker = data.get('speaker', 'A')
                speaker_role = 'Seller' if speaker in ['A', 0, '0'] else 'Buyer'
                confidence = data.get('confidence', 1.0)
                
                if transcript:
                    print(f"[AssemblyAI → {client_sid}] Turn ({'final' if is_final else 'partial'}): {transcript[:50]}")
                    
                    if is_final:
                        socketio.emit('transcription', {
                            'type': 'final',
                            'text': transcript,
                            'speaker': speaker,
                            'speaker_role': speaker_role,
                            'confidence': confidence,
                            'words': data.get('words', [])
                        }, to=client_sid)
                    else:
                        socketio.emit('transcription', {
                            'type': 'partial',
                            'text': transcript,
                            'speaker': speaker,
                            'confidence': confidence
                        }, to=client_sid)
            
            elif msg_type == 'Begin':
                streaming_connection_ready[client_sid] = True
                print(f"[AssemblyAI → {client_sid}] Session started")
                socketio.emit('transcription', {
                    'type': 'session_begins',
                    'session_id': data.get('id'),
                    'message': 'AssemblyAI session started'
                }, to=client_sid)
            
            elif msg_type == 'Termination':
                print(f"[AssemblyAI → {client_sid}] Session terminated")
                socketio.emit('transcription', {
                    'type': 'session_terminated',
                    'message': 'Session ended'
                }, to=client_sid)
                
            elif msg_type == 'Error':
                print(f"[AssemblyAI → {client_sid}] Error: {data}")
                socketio.emit('error', {
                    'message': data.get('error', 'Unknown error'),
                    'code': data.get('code')
                }, to=client_sid)
            
            # Legacy v2 format support
            elif msg_type in ['partial_transcript', 'PartialTranscript']:
                socketio.emit('transcription', {
                    'type': 'partial',
                    'text': data.get('text', ''),
                    'speaker': data.get('speaker', None),
                    'confidence': data.get('confidence', 1.0)
                }, to=client_sid)
                
            elif msg_type in ['final_transcript', 'FinalTranscript']:
                speaker = data.get('speaker', 'A')
                speaker_role = 'Seller' if speaker in ['A', 0, '0'] else 'Buyer'
                socketio.emit('transcription', {
                    'type': 'final',
                    'text': data.get('text', ''),
                    'speaker': speaker,
                    'speaker_role': speaker_role,
                    'confidence': data.get('confidence', 1.0),
                    'words': data.get('words', [])
                }, to=client_sid)
            
        except Exception as e:
            print(f"[AssemblyAI] Parse error: {e}")
            socketio.emit('error', {'message': f'Parse error: {str(e)}'}, to=client_sid)
    
    def on_error(ws, error):
        print(f"[AssemblyAI] WebSocket Error: {error}")
        socketio.emit('error', {'message': str(error)}, to=client_sid)
    
    def on_close(ws, close_status_code, close_msg):
        print(f"[AssemblyAI] Connection closed: {close_status_code} - {close_msg}")
        streaming_connection_ready[client_sid] = False
        socketio.emit('assemblyai_closed', {
            'code': close_status_code,
            'reason': close_msg
        }, to=client_sid)
    
    def on_open(ws):
        print(f"[AssemblyAI] WebSocket connected for client {client_sid}")
        socketio.emit('assemblyai_connected', {
            'message': 'Connected to AssemblyAI',
            'speaker_labels': True
        }, to=client_sid)
    
    # Step 2: Connect to WebSocket with token in URL (NOT in header)
    # Include encoding parameter for PCM16 little-endian
    ws_url = f"wss://streaming.assemblyai.com/v3/ws?sample_rate={sample_rate}&encoding=pcm_s16le&token={token}"
    
    print(f"[AssemblyAI] Connecting to streaming.assemblyai.com/v3/ws")
    print(f"[AssemblyAI] Token: {token[:20]}...")
    
    ws = websocket.WebSocketApp(
        ws_url,
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )
    
    def run_ws():
        try:
            ws.run_forever(
                sslopt={
                    "cert_reqs": ssl.CERT_REQUIRED,
                    "ca_certs": certifi.where()
                }
            )
        except Exception as e:
            print(f"[AssemblyAI] run_forever error: {e}")
    
    thread = threading.Thread(target=run_ws, daemon=True)
    thread.start()
    
    time.sleep(0.5)
    
    return ws


def create_deepgram_websocket(client_sid, sample_rate=16000):
    """Create a WebSocket connection to Deepgram with real-time speaker diarization"""
    
    streaming_connection_ready[client_sid] = False
    
    if not DEEPGRAM_API_KEY:
        socketio.emit('error', {'message': 'Deepgram API key not configured'}, to=client_sid)
        return None
    
    def on_message(ws, message):
        """Handle messages from Deepgram"""
        try:
            data = json.loads(message)
            
            # Check for results
            if 'channel' in data and 'alternatives' in data['channel']:
                alternatives = data['channel']['alternatives']
                if alternatives and len(alternatives) > 0:
                    alt = alternatives[0]
                    transcript = alt.get('transcript', '')
                    
                    if transcript.strip():
                        is_final = data.get('is_final', False)
                        speech_final = data.get('speech_final', False)
                        
                        # Get words with speaker info
                        words = alt.get('words', [])
                        
                        # Determine speaker from words (Deepgram provides speaker per word)
                        speaker_id = 0
                        if words:
                            # Get most common speaker in this segment
                            speakers = [w.get('speaker', 0) for w in words if 'speaker' in w]
                            if speakers:
                                speaker_id = max(set(speakers), key=speakers.count)
                        
                        # Map speaker ID to role (0 = Seller, 1+ = Buyer)
                        speaker_role = 'Seller' if speaker_id == 0 else 'Buyer'
                        
                        confidence = alt.get('confidence', 0.9)
                        
                        if is_final or speech_final:
                            print(f"[Deepgram → {client_sid}] Final (Speaker {speaker_id}): {transcript[:50]}")
                            socketio.emit('transcription', {
                                'type': 'final',
                                'text': transcript,
                                'speaker': speaker_id,
                                'speaker_role': speaker_role,
                                'confidence': confidence,
                                'words': words
                            }, to=client_sid)
                        else:
                            socketio.emit('transcription', {
                                'type': 'partial',
                                'text': transcript,
                                'speaker': speaker_id,
                                'speaker_role': speaker_role,
                                'confidence': confidence
                            }, to=client_sid)
            
            # Handle metadata/ready message
            elif data.get('type') == 'Metadata' or 'metadata' in data:
                streaming_connection_ready[client_sid] = True
                print(f"[Deepgram → {client_sid}] Session started")
                socketio.emit('transcription', {
                    'type': 'session_begins',
                    'message': 'Deepgram session started with speaker diarization'
                }, to=client_sid)
                
        except Exception as e:
            print(f"[Deepgram] Parse error: {e}")
    
    def on_error(ws, error):
        print(f"[Deepgram] WebSocket Error: {error}")
        socketio.emit('error', {
            'message': f'Deepgram error: {str(error)}'
        }, to=client_sid)
    
    def on_close(ws, close_status_code, close_msg):
        print(f"[Deepgram] Connection closed: {close_status_code} - {close_msg}")
        streaming_connection_ready[client_sid] = False
        socketio.emit('streaming_closed', {
            'code': close_status_code,
            'reason': close_msg
        }, to=client_sid)
    
    def on_open(ws):
        print(f"[Deepgram] WebSocket connected for client {client_sid}")
        streaming_connection_ready[client_sid] = True
        socketio.emit('assemblyai_connected', {
            'message': 'Connected to Deepgram with speaker diarization',
            'speaker_labels': True
        }, to=client_sid)
    
    # Deepgram WebSocket URL with diarization enabled
    # Optimized for high-quality multi-speaker transcription
    ws_url = (
        f"wss://api.deepgram.com/v1/listen"
        f"?model=nova-2"
        f"&language=en"
        f"&diarize=true"
        f"&encoding=linear16"
        f"&sample_rate={sample_rate}"
        f"&channels=1"
        f"&interim_results=true"
        f"&smart_format=true"
        f"&punctuate=true"
        f"&numerals=true"
        f"&utterance_end_ms=1500"
        f"&endpointing=500"
        f"&vad_events=true"
    )
    
    print(f"[Deepgram] Connecting with diarization enabled")
    
    ws = websocket.WebSocketApp(
        ws_url,
        header={"Authorization": f"Token {DEEPGRAM_API_KEY}"},
        on_open=on_open,
        on_message=on_message,
        on_error=on_error,
        on_close=on_close
    )
    
    def run_ws():
        try:
            ws.run_forever(
                sslopt={
                    "cert_reqs": ssl.CERT_REQUIRED,
                    "ca_certs": certifi.where()
                }
            )
        except Exception as e:
            print(f"[Deepgram] run_forever error: {e}")
    
    thread = threading.Thread(target=run_ws, daemon=True)
    thread.start()
    
    time.sleep(0.5)
    
    return ws


@socketio.on('connect')
def handle_socket_connect():
    print(f"[Socket.IO] Client connected: {request.sid}")
    emit('connected', {'status': 'ok'})


@socketio.on('disconnect')
def handle_socket_disconnect():
    client_sid = request.sid
    print(f"[Socket.IO] Client disconnected: {client_sid}")
    
    if client_sid in streaming_connections:
        try:
            ws = streaming_connections[client_sid]
            if ws and ws.sock and ws.sock.connected:
                ws.close()
        except Exception as e:
            print(f"[Cleanup] Error closing connection: {e}")
        finally:
            del streaming_connections[client_sid]
    
    if client_sid in streaming_connection_ready:
        del streaming_connection_ready[client_sid]


@socketio.on('start_transcription')
def handle_start_transcription(data):
    """Start a new transcription session - uses Deepgram for speaker diarization"""
    client_sid = request.sid
    
    sample_rate = data.get('sample_rate', 16000) if data else 16000
    
    print(f"[Socket.IO] Client {client_sid} starting transcription (sample_rate={sample_rate})")
    
    # Prefer Deepgram for speaker diarization, fallback to AssemblyAI
    if DEEPGRAM_API_KEY:
        print(f"[Socket.IO] Using Deepgram with speaker diarization")
        
        if client_sid in streaming_connections:
            try:
                streaming_connections[client_sid].close()
            except:
                pass
            del streaming_connections[client_sid]
        
        ws = create_deepgram_websocket(client_sid, sample_rate)
        streaming_connections[client_sid] = ws
        
    elif ASSEMBLYAI_API_KEY:
        print(f"[Socket.IO] Using AssemblyAI (no speaker diarization)")
        
        if client_sid in streaming_connections:
            try:
                streaming_connections[client_sid].close()
            except:
                pass
            del streaming_connections[client_sid]
        
        ws = create_assemblyai_websocket(client_sid, sample_rate)
        streaming_connections[client_sid] = ws
    else:
        emit('error', {'message': 'No transcription API key configured'})
        return
    
    emit('transcription_started', {
        'status': 'connecting',
        'speaker_labels': True
    })


audio_chunk_count = {}

@socketio.on('audio_data')
def handle_audio_data(data):
    """Forward audio data to transcription service as binary PCM"""
    client_sid = request.sid
    
    if client_sid not in streaming_connections:
        return
    
    ws = streaming_connections[client_sid]
    
    # Track chunks for debugging
    if client_sid not in audio_chunk_count:
        audio_chunk_count[client_sid] = 0
    audio_chunk_count[client_sid] += 1
    
    try:
        if ws.sock and ws.sock.connected:
            if isinstance(data, dict) and 'audio' in data:
                audio_base64 = data['audio']
            elif isinstance(data, str):
                audio_base64 = data
            else:
                return
            
            audio_bytes = base64.b64decode(audio_base64)
            
            # Log every 100 chunks (reduced verbosity)
            if audio_chunk_count[client_sid] % 100 == 1:
                print(f"[Audio] Streaming chunk #{audio_chunk_count[client_sid]}")
            
            ws.send(audio_bytes, opcode=websocket.ABNF.OPCODE_BINARY)
            
    except Exception as e:
        print(f"[Audio] Send error: {e}")
        emit('error', {'message': f'Audio send error: {str(e)}'})


@socketio.on('stop_transcription')
def handle_stop_transcription():
    """Stop transcription and close connection"""
    client_sid = request.sid
    
    print(f"[Socket.IO] Client {client_sid} stopping transcription")
    
    if client_sid in streaming_connections:
        try:
            ws = streaming_connections[client_sid]
            if ws and ws.sock and ws.sock.connected:
                ws.close()
        except Exception as e:
            print(f"[Stop] Error: {e}")
        finally:
            del streaming_connections[client_sid]
    
    if client_sid in streaming_connection_ready:
        del streaming_connection_ready[client_sid]
    
    emit('transcription_stopped', {'status': 'stopped'})


if __name__ == '__main__':
    print(f"[Server] Starting on port 5001 with Socket.IO support")
    print(f"[Server] Deepgram configured: {bool(DEEPGRAM_API_KEY)} (speaker diarization)")
    print(f"[Server] AssemblyAI configured: {bool(ASSEMBLYAI_API_KEY)} (fallback)")
    print(f"[Server] OpenAI configured: {bool(OPENAI_API_KEY)}")
    socketio.run(app, debug=True, port=5001, host='0.0.0.0')
