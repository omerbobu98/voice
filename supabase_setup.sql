-- ============================================
-- SalesAI Supabase Setup Script
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Create the 'calls' table
CREATE TABLE IF NOT EXISTS calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    file_name TEXT NOT NULL,
    audio_url TEXT,
    duration_seconds INTEGER DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    speakers_count INTEGER DEFAULT 2,
    transcription TEXT,
    utterances JSONB DEFAULT '[]'::jsonb,
    speaker_roles JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'transcribed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the 'analyses' table
CREATE TABLE IF NOT EXISTS analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
    seller_talk_percentage NUMERIC DEFAULT 50,
    buyer_talk_percentage NUMERIC DEFAULT 50,
    total_duration_seconds INTEGER DEFAULT 0,
    overall_score INTEGER DEFAULT 0,
    meddic_score INTEGER DEFAULT 0,
    bant_score INTEGER DEFAULT 0,
    bant_qualified BOOLEAN DEFAULT FALSE,
    deal_risk_level TEXT DEFAULT 'medium',
    deal_risk_score INTEGER DEFAULT 50,
    metrics JSONB DEFAULT '{}'::jsonb,
    analysis JSONB DEFAULT '{}'::jsonb,
    objection_types TEXT[] DEFAULT '{}',
    objection_count INTEGER DEFAULT 0,
    coaching_areas TEXT[] DEFAULT '{}',
    strengths TEXT[] DEFAULT '{}',
    improvements TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calls_user_id ON calls(user_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_call_id ON analyses(call_id);

-- 4. Enable Row Level Security
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies (if any) to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own calls" ON calls;
DROP POLICY IF EXISTS "Users can view their own calls" ON calls;
DROP POLICY IF EXISTS "Users can update their own calls" ON calls;
DROP POLICY IF EXISTS "Service role can do anything on calls" ON calls;
DROP POLICY IF EXISTS "Users can view analyses for their calls" ON analyses;
DROP POLICY IF EXISTS "Service role can do anything on analyses" ON analyses;

-- 6. Create RLS policies for 'calls' table
-- Allow service role (backend) to do anything
CREATE POLICY "Service role can do anything on calls" ON calls
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Allow authenticated users to view their own calls
CREATE POLICY "Users can view their own calls" ON calls
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own calls
CREATE POLICY "Users can insert their own calls" ON calls
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own calls
CREATE POLICY "Users can update their own calls" ON calls
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 7. Create RLS policies for 'analyses' table
-- Allow service role (backend) to do anything
CREATE POLICY "Service role can do anything on analyses" ON analyses
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Allow users to view analyses for their calls
CREATE POLICY "Users can view analyses for their calls" ON analyses
    FOR SELECT
    USING (
        call_id IN (SELECT id FROM calls WHERE user_id = auth.uid())
    );

-- 8. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 9. Create trigger for calls table
DROP TRIGGER IF EXISTS update_calls_updated_at ON calls;
CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE SETUP (Run in Supabase Dashboard)
-- ============================================
-- 
-- Go to Storage in Supabase Dashboard and:
-- 1. Create a new bucket called 'audio'
-- 2. Make it PUBLIC (so audio files can be played)
-- 3. Add these policies:
--
-- Policy 1: Allow authenticated users to upload
--   - Name: "Users can upload audio"
--   - Allowed operation: INSERT
--   - Target roles: authenticated
--   - Policy: (bucket_id = 'audio')
--
-- Policy 2: Allow public read access
--   - Name: "Public read access"
--   - Allowed operation: SELECT
--   - Target roles: public
--   - Policy: (bucket_id = 'audio')
--
-- Or run this SQL for storage policies:
-- ============================================

-- Note: Storage policies are managed differently in Supabase.
-- You need to go to Storage > Policies and create them there,
-- OR use the storage.objects table directly:

-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('audio', 'audio', true)
-- ON CONFLICT (id) DO NOTHING;

