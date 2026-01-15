# Supabase Migration - January 14, 2026

## Summary
The original Supabase project was accidentally deleted. A new project was configured using an existing project "train data".

---

## Old Project (DELETED)
- **Project ID**: `nacwvxqimvbfqlyylszt`
- **URL**: https://nacwvxqimvbfqlyylszt.supabase.co
- **Status**: ❌ DELETED - No longer exists

---

## New Project (ACTIVE)
- **Project Name**: train data
- **Project ID**: `ueztvmtwxqszvlzmoezx`
- **URL**: https://ueztvmtwxqszvlzmoezx.supabase.co
- **Region**: US West
- **Status**: ✅ Active

### API Keys
```
SUPABASE_URL=https://ueztvmtwxqszvlzmoezx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlenR2bXR3eHFzenZsem1vZXp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjAyMjIsImV4cCI6MjA4MzkzNjIyMn0.OuSYC8iidMmdlLmEue0usCnpxVJWl6dsf1KTOVHzbqE
SUPABASE_SERVICE_KEY=[Get from Supabase Dashboard > Settings > API > service_role]
```

---

## Database Tables Created

### Core Tables
1. **calls** - Transcribed call recordings
   - id, user_id, file_name, audio_url, duration_seconds, word_count
   - speakers_count, transcription, utterances, speaker_roles
   - status, created_at, updated_at

2. **analyses** - AI analysis results
   - id, call_id, user_id, seller/buyer_talk_percentage
   - overall_score, meddic_score, bant_score, bant_qualified
   - deal_risk_level, deal_risk_score, metrics, analysis
   - objection_types, objection_count, coaching_areas
   - strengths, improvements, created_at

3. **live_sessions** - Real-time coaching sessions
   - id, user_id, customer_name, customer_phone
   - deal_type, estimated_value, status
   - started_at, ended_at, total_duration_seconds

4. **live_insights** - Real-time coaching tips
   - id, session_id, insight_type, content, priority
   - timestamp_seconds, created_at

5. **live_transcript_chunks** - Transcript segments
   - id, session_id, speaker, text, timestamp_seconds

6. **user_roles** - User permissions
   - id, user_id, role, created_at

7. **playbook_entries** - Sales playbook content
   - entry_type, category, product_type, stage
   - title, content, source_call_ids, effectiveness_rating

8. **knowledge_documents** - Uploaded sales materials
   - file_name, file_url, document_type, full_text

9. **user_corrections** - User feedback on AI
   - correction_type, call_id, original_value, corrected_value

### All tables have RLS enabled

---

## Storage Buckets

| Bucket Name | Public | Purpose |
|-------------|--------|---------|
| audio | ✅ Yes | Audio file uploads |
| audio-files | ✅ Yes | Legacy audio storage |

### Storage Policies Applied
- `Allow public read audio` - Anyone can read from audio buckets
- `Allow authenticated upload audio` - Authenticated users can upload
- `Allow authenticated update audio` - Authenticated users can update
- `Allow authenticated delete audio` - Authenticated users can delete
- `Service role full access` - Backend service role has full access

---

## Google OAuth Configuration

### Google Cloud Console
- **Client ID**: `[See Google Cloud Console]`
- **Client Secret**: `[See Google Cloud Console]`
- **Authorized Redirect URI**: `https://ueztvmtwxqszvlzmoezx.supabase.co/auth/v1/callback`

### Supabase Auth Settings
- **Site URL**: `https://vloce.netlify.app`
- **Redirect URLs**: `https://vloce.netlify.app/**`
- **Google Provider**: Enabled with above credentials

---

## Deployment Configuration

### Frontend (Netlify)
- **URL**: https://vloce.netlify.app
- **Site ID**: `f399b38c-5e9e-4763-b5aa-11cbb754044d`
- **Environment Variables**:
  ```
  VITE_SUPABASE_URL=https://ueztvmtwxqszvlzmoezx.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  VITE_API_URL=https://web-production-3215.up.railway.app
  ```

### Backend (Railway)
- **URL**: https://web-production-3215.up.railway.app
- **Required Environment Variables**:
  ```
  SUPABASE_URL=https://ueztvmtwxqszvlzmoezx.supabase.co
  SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  SUPABASE_SERVICE_KEY=[service_role key from Supabase]
  ASSEMBLYAI_API_KEY=262435766cfa4a90aec471cb4eb88690
  OPENAI_API_KEY=[your OpenAI key]
  ```

---

## Migration Steps Completed

1. ✅ Identified deleted Supabase project
2. ✅ Selected existing project "train data" (ueztvmtwxqszvlzmoezx)
3. ✅ Created all database tables via migrations
4. ✅ Enabled RLS on all tables
5. ✅ Created storage buckets (audio, audio-files)
6. ✅ Added storage policies for uploads
7. ✅ Configured Google OAuth in Supabase
8. ✅ Created Google OAuth credentials in Cloud Console
9. ✅ Updated Netlify environment variables
10. ✅ Updated frontend .env file
11. ⚠️ Railway environment variables need verification

---

## Troubleshooting

### 401 Unauthorized Errors
If you see 401 errors when uploading or accessing data:
1. Check Railway has the correct `SUPABASE_SERVICE_KEY`
2. Verify the key is from the NEW project (ueztvmtwxqszvlzmoezx)
3. Redeploy Railway after updating environment variables

### Google OAuth "Provider not enabled"
1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Add Client ID and Client Secret

### Storage Upload Errors
1. Verify storage bucket exists
2. Check storage policies are configured
3. Ensure service role key is correct

---

## Important Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ueztvmtwxqszvlzmoezx
- **Supabase API Settings**: https://supabase.com/dashboard/project/ueztvmtwxqszvlzmoezx/settings/api
- **Supabase Auth Providers**: https://supabase.com/dashboard/project/ueztvmtwxqszvlzmoezx/auth/providers
- **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
- **Netlify Dashboard**: https://app.netlify.com/projects/vloce
- **Railway Dashboard**: https://railway.app
