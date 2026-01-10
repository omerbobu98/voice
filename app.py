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
        try:
            call_data = get_call_with_analysis(job_id)
            if not call_data or not call_data.get('call'):
                return jsonify({'error': 'Call not found'}), 404
            
            call = call_data['call']
            call_id = call['id']
            utterances = call.get('utterances', [])
            speaker_roles = call.get('speaker_roles', {})
            
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

LIVE_COACH_SYSTEM_PROMPT = """You are an ELITE REAL-TIME Sales Coach providing INSTANT coaching during a live sales call.
You are trained in ONE-CALL CLOSE methodology and help reps close deals on the spot.

## SALES METHODOLOGY (FOLLOW THIS):

### CALL STRUCTURE:
1. **Rapport & Context** (2-5 min) - Build trust, ask about their home/situation
2. **Discovery Mode** (7-12 min) - Ask, don't tell. Listen more than talk.
3. **Presentation** (15-20 min) - Show value, use stories, plant seeds
4. **Close** (5-10 min) - Assumptive close, handle objections

### SCORING WEIGHTS:
- Knowledge (30-40%): Product, incentives, customer needs
- Sales Tactics (25-35%): Questioning, objection handling, emotional triggers
- Time Efficiency (15-25%): Discovery, presentation, follow-up balance
- Control (10-20%): Leading conversation, steering urgency

### KEY DISCOVERY QUESTIONS TO SUGGEST:
**Context/Rapport:**
- "How long have you been living in the house?"
- "What do you love most about it?"

**Motivation (emotional driver):**
- "What made you start thinking about this project?"
- "If you could wave a magic wand and fix one thing, what would it be?"

**Prior Attempts (reveals objections):**
- "Have you talked to any contractors or gotten bids?"
- "What stopped you from moving forward with them?"

**Financial Readiness:**
- "Have you applied for financing before?"
- "Do you know anyone who's taken advantage of [state program]?"

### PAIN DISCOVERY BY PRODUCT:
- **Roof**: Age, leaks, water damage worry, life expectancy
- **Windows**: Drafts, temperature change, condensation, noise
- **HVAC**: Age, uneven temperatures, rising bills, repair costs
- **Exterior**: Peeling, cracking, fading, color change desire

## YOUR ROLE:
Analyze transcript in real-time. When you detect something, provide IMMEDIATE coaching.
The rep has an earpiece - keep audio scripts SHORT (15-25 words max).

## WHEN TO COACH:

### OBJECTION_DETECTED (URGENT) 🔴
Customer says: price concern, need to think, spouse, timing, competitor
→ Give immediate response script with Feel-Felt-Found or LAER technique

### BUYING_SIGNAL (URGENT) 🟢
Customer asks: pricing, timeline, next steps, shows excitement
→ Alert to close NOW, give assumptive close script

### DISCOVERY_PROMPT (HIGH) 🟡
Rep talked too much OR missed pain point opportunity
→ Suggest specific discovery question from the list above

### CLOSING_OPPORTUNITY (HIGH) 🟣
Enough value built, customer engaged
→ Provide trial close or assumptive close script

## OUTPUT FORMAT (JSON ONLY):
{
  "insight_type": "objection_detected|buying_signal|discovery_prompt|closing_opportunity|talk_balance_alert|value_building_cue",
  "priority": "urgent|high|medium|low",
  "coaching_message": "Brief explanation (Hebrew preferred)",
  "suggested_response": "Exact script to say NOW",
  "technique": "Feel-Felt-Found|LAER|Assumptive Close|Trial Close|Pain Discovery",
  "audio_script": "SHORT version for earpiece TTS (15-25 words, Hebrew)"
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
    """Get a temporary token for AssemblyAI Universal Streaming"""
    user_id = get_user_id_from_token()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    
    if not ASSEMBLYAI_API_KEY:
        return jsonify({'error': 'AssemblyAI not configured'}), 500
    
    try:
        # Use AssemblyAI SDK for Universal Streaming token
        from assemblyai.streaming.v3 import StreamingClient, StreamingClientOptions
        
        client = StreamingClient(
            StreamingClientOptions(
                api_key=ASSEMBLYAI_API_KEY,
                api_host="streaming.assemblyai.com",
            )
        )
        
        token = client.create_temporary_token(
            expires_in_seconds=3600,
            max_session_duration_seconds=7200,
        )
        
        print(f"[get_assemblyai_token] Token created successfully")
        return jsonify({
            'token': token,
            'api_host': 'streaming.assemblyai.com'
        })
        
    except Exception as e:
        print(f"[get_assemblyai_token] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/live/test-assemblyai', methods=['GET'])
def test_assemblyai():
    """Test AssemblyAI Universal Streaming connection"""
    if not ASSEMBLYAI_API_KEY:
        return jsonify({'error': 'ASSEMBLYAI_API_KEY not set', 'configured': False})
    
    try:
        from assemblyai.streaming.v3 import StreamingClient, StreamingClientOptions
        
        client = StreamingClient(
            StreamingClientOptions(
                api_key=ASSEMBLYAI_API_KEY,
                api_host="streaming.assemblyai.com",
            )
        )
        
        token = client.create_temporary_token(
            expires_in_seconds=60,
            max_session_duration_seconds=60,
        )
        
        return jsonify({
            'success': True,
            'has_token': bool(token),
            'token_preview': token[:20] + '...' if token else None,
            'api_host': 'streaming.assemblyai.com'
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)})


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
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": LIVE_COACH_SYSTEM_PROMPT},
                {"role": "user", "content": context}
            ],
            temperature=0.3,
            max_completion_tokens=600
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


if __name__ == '__main__':
    app.run(debug=True, port=5001)
