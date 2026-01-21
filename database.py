"""
Database module for Supabase integration
"""

import os
import uuid
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_KEY = SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY

print(f"[database] SUPABASE_URL: {SUPABASE_URL}")
print(f"[database] Using SERVICE_KEY: {bool(SUPABASE_SERVICE_KEY)}")
print(f"[database] Using ANON_KEY: {bool(SUPABASE_ANON_KEY) and not bool(SUPABASE_SERVICE_KEY)}")

supabase: Client = None

def get_supabase() -> Client:
    """Get or create Supabase client"""
    global supabase
    if supabase is None:
        if not SUPABASE_URL:
            print("[database] ERROR: SUPABASE_URL is not set")
            return None
        if not SUPABASE_KEY:
            print("[database] ERROR: Neither SUPABASE_SERVICE_KEY nor SUPABASE_ANON_KEY is set")
            return None
        try:
            supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
            print("[database] Supabase client created successfully")
        except Exception as e:
            print(f"[database] ERROR creating Supabase client: {e}")
            return None
    return supabase


def test_connection() -> dict:
    """Test Supabase connection and return status"""
    result = {
        'supabase_url': SUPABASE_URL,
        'has_service_key': bool(SUPABASE_SERVICE_KEY),
        'has_anon_key': bool(SUPABASE_ANON_KEY),
        'client_created': False,
        'tables_accessible': False,
        'storage_accessible': False,
        'errors': []
    }
    
    client = get_supabase()
    if not client:
        result['errors'].append('Failed to create Supabase client')
        return result
    
    result['client_created'] = True
    
    # Test table access
    try:
        test = client.table('calls').select('id').limit(1).execute()
        result['tables_accessible'] = True
        result['calls_count'] = len(test.data) if test.data else 0
    except Exception as e:
        result['errors'].append(f'Table access error: {str(e)}')
    
    # Test storage access
    try:
        buckets = client.storage.list_buckets()
        result['storage_accessible'] = True
        result['buckets'] = [b.name for b in buckets] if buckets else []
    except Exception as e:
        result['errors'].append(f'Storage access error: {str(e)}')
    
    return result


def upload_audio_file(filepath: str, user_id: str = None, timeout_seconds: int = 120) -> str:
    """Upload audio file to Supabase Storage, returns public URL or None
    
    Note: This is now non-blocking with a timeout. If upload fails or times out,
    returns None and the call can still be saved without audio URL.
    """
    import threading
    
    client = get_supabase()
    if not client:
        print("[upload_audio] ERROR: No Supabase client")
        return None
    
    # Check file size - skip upload for very large files (>50MB)
    try:
        file_size = os.path.getsize(filepath)
        if file_size > 50 * 1024 * 1024:  # 50MB
            print(f"[upload_audio] SKIPPING: File too large ({file_size} bytes)")
            return None
    except:
        pass
    
    result_holder = {'url': None, 'done': False}
    
    def do_upload():
        try:
            # Generate unique filename with correct extension
            file_ext = os.path.splitext(filepath)[1].lower()
            storage_path = f"{user_id or 'anonymous'}/{uuid.uuid4()}{file_ext}"
            
            # Determine content type based on extension
            content_types = {
                '.mp3': 'audio/mpeg',
                '.m4a': 'audio/mp4',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.webm': 'audio/webm',
                '.flac': 'audio/flac',
                '.aac': 'audio/aac',
            }
            content_type = content_types.get(file_ext, 'audio/mpeg')
            
            print(f"[upload_audio] Uploading {filepath} as {content_type} to {storage_path}")
            
            with open(filepath, 'rb') as f:
                file_data = f.read()
            
            print(f"[upload_audio] File size: {len(file_data)} bytes")
            
            # Upload to 'audio' bucket
            upload_result = client.storage.from_('audio').upload(
                path=storage_path,
                file=file_data,
                file_options={"content-type": content_type}
            )
            
            print(f"[upload_audio] Upload result: {upload_result}")
            
            # Get public URL
            public_url = client.storage.from_('audio').get_public_url(storage_path)
            print(f"[upload_audio] SUCCESS: Uploaded to {storage_path}, URL: {public_url}")
            result_holder['url'] = public_url
            
        except Exception as e:
            print(f"[upload_audio] ERROR: {e}")
            import traceback
            traceback.print_exc()
        finally:
            result_holder['done'] = True
    
    # Run upload in thread with timeout
    upload_thread = threading.Thread(target=do_upload)
    upload_thread.start()
    upload_thread.join(timeout=timeout_seconds)
    
    if not result_holder['done']:
        print(f"[upload_audio] TIMEOUT: Upload took longer than {timeout_seconds}s, skipping")
        return None
    
    return result_holder['url']


def save_call(file_name: str, duration_seconds: int, word_count: int, 
              speakers_count: int, transcription: str, utterances: list, 
              speaker_roles: dict, user_id: str = None, audio_url: str = None) -> dict:
    """Save a transcribed call to the database"""
    client = get_supabase()
    if not client:
        print("[save_call] ERROR: No Supabase client available")
        return None
    
    # user_id is required due to FK constraint
    if not user_id:
        print("[save_call] ERROR: No user_id provided - cannot save call without user association")
        print("[save_call] This usually means the auth token was not properly extracted")
        return None
    
    data = {
        'file_name': file_name,
        'duration_seconds': duration_seconds,
        'word_count': word_count,
        'speakers_count': speakers_count,
        'transcription': transcription,
        'utterances': utterances,
        'speaker_roles': speaker_roles,
        'status': 'transcribed',
        'user_id': user_id
    }
    
    if audio_url:
        data['audio_url'] = audio_url
    
    try:
        print(f"[save_call] Attempting to save call for user_id: {user_id}")
        result = client.table('calls').insert(data).execute()
        if result.data:
            print(f"[save_call] SUCCESS: Saved call {result.data[0].get('id')} for user {user_id}")
            return result.data[0]
        else:
            print(f"[save_call] ERROR: Insert returned no data. Result: {result}")
            return None
    except Exception as e:
        print(f"[save_call] ERROR: Failed to insert call: {e}")
        import traceback
        traceback.print_exc()
        return None


def save_analysis(call_id: str, metrics: dict, analysis: dict, user_id: str = None) -> dict:
    """Save or update analysis results for a call.
    If an analysis already exists for this call, it will be updated instead of creating a duplicate.
    """
    client = get_supabase()
    if not client:
        print("[save_analysis] ERROR: No Supabase client available")
        return None
    
    print(f"[save_analysis] Saving analysis for call_id: {call_id}, user_id: {user_id}")
    
    # Extract key metrics for easy querying
    talk_ratio = metrics.get('talk_ratio', {})
    analysis_data = analysis.get('analysis', {})
    
    # Extract objection types
    objections = analysis_data.get('objections', [])
    objection_types = list(set([obj.get('type', 'unknown') for obj in objections]))
    
    # Extract coaching areas
    coaching = analysis_data.get('coaching_suggestions', [])
    coaching_areas = list(set([c.get('area', '') for c in coaching if c.get('area')]))
    
    # Extract strengths and improvements
    seller_perf = analysis_data.get('seller_performance', {})
    strengths = seller_perf.get('strengths', [])
    improvements = seller_perf.get('improvements', [])
    
    # Deal risk
    risk = analysis_data.get('deal_risk_score', {})
    
    data = {
        'call_id': call_id,
        'user_id': user_id,
        'seller_talk_percentage': talk_ratio.get('seller_percentage', 50),
        'buyer_talk_percentage': talk_ratio.get('buyer_percentage', 50),
        'total_duration_seconds': int(metrics.get('total_duration_seconds', 0)),
        'overall_score': seller_perf.get('overall_score', 0),
        'meddic_score': analysis_data.get('meddic_score', {}).get('total_score', 0),
        'bant_score': analysis_data.get('bant_score', {}).get('total_score', 0),
        'bant_qualified': analysis_data.get('bant_score', {}).get('overall_qualified', False),
        'deal_risk_level': risk.get('risk_level', 'medium'),
        'deal_risk_score': risk.get('score', 50),
        'metrics': metrics,
        'analysis': analysis_data,
        'objection_types': objection_types,
        'objection_count': len(objections),
        'coaching_areas': coaching_areas,
        'strengths': strengths[:5] if strengths else [],
        'improvements': improvements[:5] if improvements else []
    }
    
    try:
        # Check if analysis already exists for this call
        existing = client.table('analyses').select('id').eq('call_id', call_id).execute()
        
        if existing.data and len(existing.data) > 0:
            # Update existing analysis instead of creating duplicate
            existing_id = existing.data[0]['id']
            print(f"[save_analysis] Found existing analysis {existing_id}, updating instead of creating duplicate")
            result = client.table('analyses').update(data).eq('id', existing_id).execute()
            action = "Updated"
        else:
            # Insert new analysis
            result = client.table('analyses').insert(data).execute()
            action = "Created"
        
        if result.data:
            print(f"[save_analysis] SUCCESS: {action} analysis {result.data[0].get('id')} for call {call_id}")
            # Update call status
            client.table('calls').update({'status': 'analyzed'}).eq('id', call_id).execute()
            return result.data[0]
        else:
            print(f"[save_analysis] ERROR: Operation returned no data. Result: {result}")
            return None
    except Exception as e:
        print(f"[save_analysis] ERROR: Failed to save analysis: {e}")
        import traceback
        traceback.print_exc()
        return None


def update_call_name(call_id: str, new_name: str, user_id: str = None) -> dict:
    """Update the file_name of a call"""
    client = get_supabase()
    if not client:
        return None
    
    try:
        query = client.table('calls').update({'file_name': new_name}).eq('id', call_id)
        if user_id:
            query = query.eq('user_id', user_id)
        result = query.execute()
        if result.data:
            print(f"[update_call_name] SUCCESS: Updated call {call_id} name to '{new_name}'")
            return result.data[0]
        return None
    except Exception as e:
        print(f"[update_call_name] ERROR: {e}")
        return None


def get_all_calls(user_id: str = None, limit: int = 50) -> list:
    """Get all calls, optionally filtered by user"""
    client = get_supabase()
    if not client:
        return []
    
    query = client.table('calls').select('*').order('created_at', desc=True).limit(limit)
    
    if user_id:
        query = query.eq('user_id', user_id)
    
    result = query.execute()
    return result.data or []


def get_call_with_analysis(call_id: str, user_id: str = None) -> dict:
    """Get a single call with its latest analysis, optionally filtered by user.
    If multiple analyses exist for the call, returns the most recent one.
    """
    client = get_supabase()
    if not client:
        return None
    
    try:
        query = client.table('calls').select('*').eq('id', call_id)
        if user_id:
            query = query.eq('user_id', user_id)
        
        call = query.maybe_single().execute()
        if not call.data:
            return None
        
        try:
            # Get the latest analysis for this call (ordered by created_at desc, limit 1)
            analysis = client.table('analyses').select('*').eq('call_id', call_id).order('created_at', desc=True).limit(1).execute()
            analysis_data = analysis.data[0] if analysis.data and len(analysis.data) > 0 else None
        except Exception as e:
            print(f"[get_call_with_analysis] Error fetching analysis: {e}")
            analysis_data = None
        
        return {
            'call': call.data,
            'analysis': analysis_data
        }
    except Exception as e:
        print(f"[get_call_with_analysis] Error: {e}")
        return None


# ============ Admin Functions ============

def is_user_admin(user_id: str) -> bool:
    """Check if a user is an admin"""
    client = get_supabase()
    if not client or not user_id:
        print(f"[is_user_admin] No client or user_id: {user_id}")
        return False
    
    try:
        result = client.table('user_roles').select('role').eq('user_id', user_id).execute()
        print(f"[is_user_admin] Query result for {user_id}: {result.data}")
        if result.data and len(result.data) > 0:
            is_admin = result.data[0].get('role') == 'admin'
            print(f"[is_user_admin] Is admin: {is_admin}")
            return is_admin
        return False
    except Exception as e:
        print(f"[is_user_admin] Error: {e}")
        return False


def get_user_role(user_id: str) -> str:
    """Get a user's role (user, admin, manager)"""
    client = get_supabase()
    if not client or not user_id:
        print(f"[get_user_role] No client or user_id: {user_id}")
        return 'user'
    
    try:
        # Use maybe_single() to avoid exception when no record found
        result = client.table('user_roles').select('role').eq('user_id', user_id).execute()
        print(f"[get_user_role] Query result for {user_id}: {result.data}")
        if result.data and len(result.data) > 0:
            role = result.data[0].get('role', 'user')
            print(f"[get_user_role] Found role: {role}")
            return role
        print(f"[get_user_role] No role found, returning 'user'")
        return 'user'
    except Exception as e:
        print(f"[get_user_role] Error: {e}")
        return 'user'


def get_all_users_with_stats() -> list:
    """Get all users with their call stats (admin only) - returns ALL registered users"""
    client = get_supabase()
    if not client:
        return []
    
    try:
        # Get ALL users from auth.users via RPC function
        users_info = client.rpc('get_all_users_admin').execute()
        print(f"[get_all_users_with_stats] RPC returned {len(users_info.data) if users_info.data else 0} users")
        
        if users_info.data:
            users = []
            for user in users_info.data:
                user_id = user.get('user_id')
                # Get stats for this user (calls, scores, etc.)
                stats = get_user_stats(user_id)
                # Merge user info with stats
                users.append({
                    'user_id': user_id,
                    'email': user.get('email', ''),
                    'display_name': user.get('display_name', user.get('email', '').split('@')[0] if user.get('email') else ''),
                    'full_name': user.get('full_name', ''),
                    'created_at': user.get('created_at'),
                    'total_calls': stats.get('total_calls', 0),
                    'analyzed_calls': stats.get('analyzed_calls', 0),
                    'avg_score': stats.get('avg_score', 0),
                    'avg_meddic_score': stats.get('avg_meddic_score', 0),
                    'avg_bant_score': stats.get('avg_bant_score', 0),
                    'avg_talk_ratio': stats.get('avg_talk_ratio', 50),
                    'last_activity': stats.get('last_activity'),
                    'role': stats.get('role', 'user')
                })
            return users
        
        print("[get_all_users_with_stats] RPC returned no data, falling back to calls table")
        # Fallback: get unique user_ids from calls table
        calls_result = client.table('calls').select('user_id').execute()
        user_ids = list(set([c['user_id'] for c in (calls_result.data or []) if c.get('user_id')]))
        
        users = []
        for uid in user_ids:
            user_stats = get_user_stats(uid)
            users.append(user_stats)
        return users
        
    except Exception as e:
        print(f"[get_all_users_with_stats] Error: {e}")
        import traceback
        traceback.print_exc()
        return []


def get_user_stats(user_id: str) -> dict:
    """Get statistics for a specific user"""
    client = get_supabase()
    if not client:
        return {}
    
    try:
        # Get user display info (email, name)
        email = ''
        display_name = ''
        try:
            info = client.rpc('get_user_display_info', {'check_user_id': user_id}).execute()
            if info.data and len(info.data) > 0:
                email = info.data[0].get('email', '')
                display_name = info.data[0].get('display_name', '')
        except Exception as e:
            print(f"[get_user_stats] Error getting display info: {e}")
        
        # Get user's calls
        calls = client.table('calls').select('id, duration_seconds, created_at').eq('user_id', user_id).execute()
        calls_data = calls.data or []
        
        # Get analyses for user's calls
        call_ids = [c['id'] for c in calls_data]
        analyses_data = []
        if call_ids:
            analyses = client.table('analyses').select('overall_score, meddic_score, bant_score, seller_talk_percentage').in_('call_id', call_ids).execute()
            analyses_data = analyses.data or []
        
        # Calculate stats
        total_calls = len(calls_data)
        avg_score = sum(a.get('overall_score', 0) for a in analyses_data) / len(analyses_data) if analyses_data else 0
        avg_meddic = sum(a.get('meddic_score', 0) for a in analyses_data) / len(analyses_data) if analyses_data else 0
        avg_bant = sum(a.get('bant_score', 0) for a in analyses_data) / len(analyses_data) if analyses_data else 0
        avg_talk_ratio = sum(a.get('seller_talk_percentage', 50) for a in analyses_data) / len(analyses_data) if analyses_data else 50
        
        # Get last activity
        last_activity = max([c['created_at'] for c in calls_data]) if calls_data else None
        
        # Get role
        role = get_user_role(user_id)
        
        return {
            'user_id': user_id,
            'email': email,
            'display_name': display_name,
            'total_calls': total_calls,
            'analyzed_calls': len(analyses_data),
            'avg_score': round(avg_score),
            'avg_meddic_score': round(avg_meddic),
            'avg_bant_score': round(avg_bant),
            'avg_talk_ratio': round(avg_talk_ratio, 1),
            'last_activity': last_activity,
            'role': role
        }
    except Exception as e:
        print(f"[get_user_stats] Error: {e}")
        return {}


def get_user_calls(user_id: str, limit: int = 50) -> list:
    """Get all calls for a specific user (admin view)"""
    client = get_supabase()
    if not client:
        return []
    
    try:
        # Get calls with their analyses
        calls = client.table('calls').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(limit).execute()
        calls_data = calls.data or []
        
        # Get analyses for these calls
        call_ids = [c['id'] for c in calls_data]
        analyses_map = {}
        if call_ids:
            analyses = client.table('analyses').select('call_id, overall_score, meddic_score, bant_score').in_('call_id', call_ids).execute()
            analyses_map = {a['call_id']: a for a in (analyses.data or [])}
        
        # Combine data
        for call in calls_data:
            analysis = analyses_map.get(call['id'])
            call['overall_score'] = analysis.get('overall_score') if analysis else None
            call['meddic_score'] = analysis.get('meddic_score') if analysis else None
            call['bant_score'] = analysis.get('bant_score') if analysis else None
        
        return calls_data
    except Exception as e:
        print(f"[get_user_calls] Error: {e}")
        return []


def get_admin_dashboard_stats() -> dict:
    """Get aggregate stats for admin dashboard"""
    client = get_supabase()
    if not client:
        return {}
    
    try:
        # Get all calls
        calls = client.table('calls').select('id, user_id, duration_seconds, created_at').execute()
        calls_data = calls.data or []
        
        # Get all analyses
        analyses = client.table('analyses').select('*').execute()
        analyses_data = analyses.data or []
        
        # Calculate stats
        total_calls = len(calls_data)
        total_users = len(set([c['user_id'] for c in calls_data if c.get('user_id')]))
        
        # Today's activity
        from datetime import datetime, timedelta
        today = datetime.utcnow().date()
        today_calls = [c for c in calls_data if c.get('created_at') and c['created_at'][:10] == str(today)]
        active_today = len(set([c['user_id'] for c in today_calls if c.get('user_id')]))
        
        # This week
        week_ago = today - timedelta(days=7)
        week_calls = [c for c in calls_data if c.get('created_at') and c['created_at'][:10] >= str(week_ago)]
        
        # Averages
        avg_score = sum(a.get('overall_score', 0) for a in analyses_data) / len(analyses_data) if analyses_data else 0
        avg_meddic = sum(a.get('meddic_score', 0) for a in analyses_data) / len(analyses_data) if analyses_data else 0
        avg_bant = sum(a.get('bant_score', 0) for a in analyses_data) / len(analyses_data) if analyses_data else 0
        
        # Top performers (by avg score)
        user_scores = {}
        for a in analyses_data:
            call = next((c for c in calls_data if c['id'] == a.get('call_id')), None)
            if call and call.get('user_id'):
                uid = call['user_id']
                if uid not in user_scores:
                    user_scores[uid] = []
                user_scores[uid].append(a.get('overall_score', 0))
        
        top_performers = sorted(
            [(uid, sum(scores)/len(scores), len(scores)) for uid, scores in user_scores.items()],
            key=lambda x: x[1],
            reverse=True
        )[:5]
        
        # Objection counts across all
        objection_counts = {}
        for a in analyses_data:
            for obj_type in a.get('objection_types', []):
                objection_counts[obj_type] = objection_counts.get(obj_type, 0) + 1
        
        # Risk distribution
        risk_dist = {'low': 0, 'medium': 0, 'high': 0}
        for a in analyses_data:
            level = a.get('deal_risk_level', 'medium')
            risk_dist[level] = risk_dist.get(level, 0) + 1
        
        return {
            'total_users': total_users,
            'total_calls': total_calls,
            'calls_today': len(today_calls),
            'calls_this_week': len(week_calls),
            'active_users_today': active_today,
            'avg_team_score': round(avg_score),
            'avg_meddic_score': round(avg_meddic),
            'avg_bant_score': round(avg_bant),
            'top_performers': [{'user_id': p[0], 'avg_score': round(p[1]), 'calls': p[2]} for p in top_performers],
            'objection_counts': objection_counts,
            'risk_distribution': risk_dist
        }
    except Exception as e:
        print(f"[get_admin_dashboard_stats] Error: {e}")
        return {}


def update_user_role(user_id: str, new_role: str) -> bool:
    """Update a user's role (admin only)"""
    client = get_supabase()
    if not client:
        return False
    
    if new_role not in ['user', 'admin', 'manager']:
        return False
    
    try:
        # Upsert the role
        result = client.table('user_roles').upsert({
            'user_id': user_id,
            'role': new_role,
            'updated_at': 'now()'
        }).execute()
        return bool(result.data)
    except Exception as e:
        print(f"[update_user_role] Error: {e}")
        return False


def get_dashboard_stats(user_id: str = None) -> dict:
    """Get dashboard statistics"""
    client = get_supabase()
    if not client:
        return {}
    
    # Get basic stats
    calls_query = client.table('calls').select('id, duration_seconds, word_count, created_at')
    if user_id:
        calls_query = calls_query.eq('user_id', user_id)
    calls = calls_query.execute()
    
    calls_data = calls.data or []
    
    # Get analyses only for user's calls
    analyses_data = []
    if calls_data:
        call_ids = [c['id'] for c in calls_data]
        analyses_query = client.table('analyses').select('*').in_('call_id', call_ids)
        analyses = analyses_query.execute()
        analyses_data = analyses.data or []
    
    if not calls_data:
        return {
            'total_calls': 0,
            'avg_duration_seconds': 0,
            'avg_overall_score': 0,
            'avg_seller_talk_pct': 50,
            'avg_meddic_score': 0,
            'avg_bant_score': 0,
            'qualified_calls': 0,
            'objection_counts': {},
            'improvement_areas': [],
            'risk_distribution': {'low': 0, 'medium': 0, 'high': 0},
            'recent_calls': []
        }
    
    # Calculate averages
    total_calls = len(calls_data)
    avg_duration = sum(c.get('duration_seconds', 0) for c in calls_data) / total_calls if total_calls > 0 else 0
    
    if analyses_data:
        avg_score = sum(a.get('overall_score', 0) for a in analyses_data) / len(analyses_data)
        avg_seller_talk = sum(a.get('seller_talk_percentage', 50) for a in analyses_data) / len(analyses_data)
        avg_meddic = sum(a.get('meddic_score', 0) for a in analyses_data) / len(analyses_data)
        avg_bant = sum(a.get('bant_score', 0) for a in analyses_data) / len(analyses_data)
        qualified = sum(1 for a in analyses_data if a.get('bant_qualified'))
        
        # Objection counts
        objection_counts = {}
        for a in analyses_data:
            for obj_type in a.get('objection_types', []):
                objection_counts[obj_type] = objection_counts.get(obj_type, 0) + 1
        
        # Improvement areas
        improvement_counts = {}
        for a in analyses_data:
            for imp in a.get('improvements', []):
                improvement_counts[imp] = improvement_counts.get(imp, 0) + 1
        improvement_areas = sorted(improvement_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Risk distribution
        risk_dist = {'low': 0, 'medium': 0, 'high': 0}
        for a in analyses_data:
            level = a.get('deal_risk_level', 'medium')
            risk_dist[level] = risk_dist.get(level, 0) + 1
    else:
        avg_score = 0
        avg_seller_talk = 50
        avg_meddic = 0
        avg_bant = 0
        qualified = 0
        objection_counts = {}
        improvement_areas = []
        risk_dist = {'low': 0, 'medium': 0, 'high': 0}
    
    return {
        'total_calls': total_calls,
        'avg_duration_seconds': round(avg_duration),
        'avg_overall_score': round(avg_score),
        'avg_seller_talk_pct': round(avg_seller_talk, 1),
        'avg_meddic_score': round(avg_meddic),
        'avg_bant_score': round(avg_bant),
        'qualified_calls': qualified,
        'objection_counts': objection_counts,
        'improvement_areas': improvement_areas,
        'risk_distribution': risk_dist,
        'recent_calls': calls_data[:5]
    }


# ============ Live Session Functions ============

def create_live_session(user_id: str, customer_name: str = None, 
                        customer_phone: str = None, deal_type: str = None,
                        estimated_value: float = None, coaching_language: str = 'he',
                        coaching_intensity: str = 'balanced') -> dict:
    """Create a new live call session"""
    client = get_supabase()
    if not client:
        return None
    
    try:
        data = {
            'user_id': user_id,
            'status': 'active',
            'customer_name': customer_name,
            'customer_phone': customer_phone,
            'deal_type': deal_type,
            'estimated_value': estimated_value,
            'coaching_language': coaching_language,
            'coaching_intensity': coaching_intensity,
            'audio_coaching_enabled': True
        }
        
        result = client.table('live_sessions').insert(data).execute()
        if result.data:
            print(f"[create_live_session] Created session {result.data[0]['id']}")
            return result.data[0]
        return None
    except Exception as e:
        print(f"[create_live_session] Error: {e}")
        return None


def get_live_session(session_id: str, user_id: str = None) -> dict:
    """Get a live session by ID"""
    client = get_supabase()
    if not client:
        return None
    
    try:
        query = client.table('live_sessions').select('*').eq('id', session_id)
        if user_id:
            query = query.eq('user_id', user_id)
        
        result = query.single().execute()
        return result.data if result.data else None
    except Exception as e:
        print(f"[get_live_session] Error: {e}")
        return None


def update_live_session(session_id: str, updates: dict) -> dict:
    """Update a live session"""
    client = get_supabase()
    if not client:
        return None
    
    try:
        updates['updated_at'] = datetime.utcnow().isoformat()
        result = client.table('live_sessions').update(updates).eq('id', session_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"[update_live_session] Error: {e}")
        return None


def end_live_session(session_id: str, final_data: dict = None) -> dict:
    """End a live session and save final metrics"""
    client = get_supabase()
    if not client:
        return None
    
    try:
        updates = {
            'status': 'ended',
            'ended_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        if final_data:
            updates.update({
                'final_transcript': final_data.get('transcript'),
                'total_words': final_data.get('total_words', 0),
                'seller_talk_percentage': final_data.get('seller_talk_percentage', 50),
                'buyer_talk_percentage': final_data.get('buyer_talk_percentage', 50),
                'objections_count': final_data.get('objections_count', 0),
                'buying_signals_count': final_data.get('buying_signals_count', 0),
                'coaching_tips_delivered': final_data.get('coaching_tips_delivered', 0),
                'duration_seconds': final_data.get('duration_seconds', 0)
            })
        
        result = client.table('live_sessions').update(updates).eq('id', session_id).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"[end_live_session] Error: {e}")
        return None


def get_user_live_sessions(user_id: str, limit: int = 20) -> list:
    """Get all live sessions for a user"""
    client = get_supabase()
    if not client:
        return []
    
    try:
        result = client.table('live_sessions').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(limit).execute()
        return result.data or []
    except Exception as e:
        print(f"[get_user_live_sessions] Error: {e}")
        return []


def save_live_insight(session_id: str, insight_type: str, coaching_message: str,
                      timestamp_ms: int = 0, priority: str = 'medium',
                      trigger_text: str = None, suggested_response: str = None,
                      technique: str = None, delivery_method: str = 'audio') -> dict:
    """Save a coaching insight delivered during live session"""
    client = get_supabase()
    if not client:
        return None
    
    try:
        data = {
            'session_id': session_id,
            'timestamp_ms': timestamp_ms,
            'insight_type': insight_type,
            'priority': priority,
            'trigger_text': trigger_text,
            'coaching_message': coaching_message,
            'suggested_response': suggested_response,
            'technique': technique,
            'delivery_method': delivery_method,
            'was_delivered': True
        }
        
        result = client.table('live_insights').insert(data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"[save_live_insight] Error: {e}")
        return None


def get_session_insights(session_id: str) -> list:
    """Get all insights for a session"""
    client = get_supabase()
    if not client:
        return []
    
    try:
        result = client.table('live_insights').select('*').eq('session_id', session_id).order('timestamp_ms').execute()
        return result.data or []
    except Exception as e:
        print(f"[get_session_insights] Error: {e}")
        return []


def save_transcript_chunk(session_id: str, start_ms: int, end_ms: int,
                          speaker: str, text: str, confidence: float = None,
                          contains_objection: bool = False,
                          contains_buying_signal: bool = False,
                          sentiment: str = None) -> dict:
    """Save a transcript chunk from live session"""
    client = get_supabase()
    if not client:
        return None
    
    try:
        data = {
            'session_id': session_id,
            'start_ms': start_ms,
            'end_ms': end_ms,
            'speaker': speaker,
            'text': text,
            'confidence': confidence,
            'contains_objection': contains_objection,
            'contains_buying_signal': contains_buying_signal,
            'sentiment': sentiment
        }
        
        result = client.table('live_transcript_chunks').insert(data).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"[save_transcript_chunk] Error: {e}")
        return None


def get_session_transcript(session_id: str) -> list:
    """Get full transcript for a session"""
    client = get_supabase()
    if not client:
        return []
    
    try:
        result = client.table('live_transcript_chunks').select('*').eq('session_id', session_id).order('start_ms').execute()
        return result.data or []
    except Exception as e:
        print(f"[get_session_transcript] Error: {e}")
        return []


def get_active_session(user_id: str) -> dict:
    """Get the user's active live session if any"""
    client = get_supabase()
    if not client:
        return None
    
    try:
        result = client.table('live_sessions').select('*').eq('user_id', user_id).eq('status', 'active').order('created_at', desc=True).limit(1).execute()
        return result.data[0] if result.data else None
    except Exception as e:
        print(f"[get_active_session] Error: {e}")
        return None
