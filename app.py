import os
import json
import time
import uuid
import jwt
from flask import Flask, request, jsonify
from flask_cors import CORS
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
    get_user_calls, get_admin_dashboard_stats, update_user_role
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
CORS(app)

UPLOAD_FOLDER = 'uploads'
Path(UPLOAD_FOLDER).mkdir(exist_ok=True)

# Initialize API clients with error handling
ASSEMBLYAI_API_KEY = os.getenv('ASSEMBLYAI_API_KEY')
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

@app.route('/api/debug/db', methods=['GET'])
def debug_db():
    """Debug endpoint to test Supabase connection"""
    result = test_connection()
    return jsonify(result)

@app.route('/api/upload', methods=['POST'])
def upload_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    user_id = get_user_id_from_token()
    
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
    
    # Check if it's an in-memory job or a database call_id (UUID format)
    if job_id in jobs:
        # In-memory job from recent upload
        job = jobs[job_id]
        if job['status'] != 'completed' or not job['result']:
            return jsonify({'error': 'Transcription not ready'}), 400
        
        call_id = job.get('call_id') or job['result'].get('call_id')
        utterances = job['result']['utterances']
        speaker_roles = job['result']['speaker_roles']
    else:
        # Try to load from database (saved call)
        call_data = get_call_with_analysis(job_id)
        if not call_data or not call_data.get('call'):
            return jsonify({'error': 'Call not found'}), 404
        
        call = call_data['call']
        call_id = call['id']
        utterances = call.get('utterances', [])
        speaker_roles = call.get('speaker_roles', {})
        
        if not utterances:
            return jsonify({'error': 'No transcription data found'}), 400
    
    # Start analysis in background
    analysis_id = f"{job_id}_analysis"
    jobs[analysis_id] = {
        'status': 'analyzing',
        'progress': 0,
        'stage': 'Starting deep analysis...',
        'result': None,
        'error': None,
        'call_id': call_id
    }
    
    thread = threading.Thread(
        target=run_deep_analysis,
        args=(analysis_id, utterances, speaker_roles, call_id)
    )
    thread.start()
    
    return jsonify({'analysis_id': analysis_id})

def run_deep_analysis(analysis_id, utterances, speaker_roles, call_id=None):
    """Run comprehensive sales analysis"""
    try:
        jobs[analysis_id]['progress'] = 10
        jobs[analysis_id]['stage'] = 'Analyzing conversation patterns...'
        
        # Perform comprehensive analysis
        sales_analysis = analyze_sales_call(utterances, speaker_roles, openai_client)
        
        jobs[analysis_id]['progress'] = 90
        jobs[analysis_id]['stage'] = 'Saving results...'
        
        # Save to database
        if call_id:
            save_analysis(call_id, sales_analysis.get('metrics', {}), sales_analysis)
        
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
        
        transcript = transcriber.submit(filepath, config=config)
        
        while transcript.status not in [aai.TranscriptStatus.completed, aai.TranscriptStatus.error]:
            transcript = aai.Transcript.get_by_id(transcript.id)
            
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
        if transcript.sentiment_analysis:
            for sa in transcript.sentiment_analysis:
                key = (sa.start, sa.end)
                sentiment_map[key] = {'sentiment': sa.sentiment.value, 'confidence': sa.confidence}
        
        for utterance in transcript.utterances:
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

if __name__ == '__main__':
    app.run(debug=True, port=5001)
