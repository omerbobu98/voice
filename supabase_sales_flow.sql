-- Sales Flow Database Schema
-- This creates the tables needed for the Sales Flowchart feature

-- Main sales flows table
CREATE TABLE IF NOT EXISTS sales_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL DEFAULT 'My Sales Flow',
    description TEXT,
    product_type TEXT,  -- e.g., "Vinyl Fence", "Solar Panels", etc.
    industry TEXT,      -- e.g., "Home Improvement", "B2B SaaS", etc.
    is_template BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flow stages/nodes
CREATE TABLE IF NOT EXISTS flow_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID REFERENCES sales_flows(id) ON DELETE CASCADE,
    stage_type TEXT NOT NULL, -- opening, qualification, discovery, pain_amplification, solution, storytelling, objections, closing, next_steps
    title TEXT NOT NULL,
    description TEXT,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    order_index INTEGER DEFAULT 0,
    color TEXT DEFAULT '#8b5cf6', -- violet default
    icon TEXT DEFAULT 'target',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Node content (questions, scripts, stories, objections)
CREATE TABLE IF NOT EXISTS node_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    node_id UUID REFERENCES flow_nodes(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL, -- question, script, story, objection, tip, transition
    title TEXT,
    content TEXT NOT NULL,
    response TEXT,          -- For objections: the handling script
    category TEXT,          -- For questions: situational, problem, implication, need_payoff
    priority INTEGER DEFAULT 0, -- For ordering
    tags TEXT[],            -- For filtering/searching
    audio_url TEXT,         -- Pre-generated audio URL if available
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simulated conversations for practice
CREATE TABLE IF NOT EXISTS flow_simulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flow_id UUID REFERENCES sales_flows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    prospect_name TEXT DEFAULT 'Prospect',
    prospect_persona TEXT,  -- JSONB describing the prospect personality
    scenario TEXT,          -- The situation/context
    conversation JSONB,     -- Array of {role, text, stage, timestamp}
    audio_urls JSONB,       -- Pre-generated audio for each message
    status TEXT DEFAULT 'draft', -- draft, completed
    score INTEGER,
    feedback JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress tracking on flows
CREATE TABLE IF NOT EXISTS flow_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    flow_id UUID REFERENCES sales_flows(id) ON DELETE CASCADE,
    completed_nodes UUID[],
    practice_count INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    last_practiced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, flow_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_flows_user_id ON sales_flows(user_id);
CREATE INDEX IF NOT EXISTS idx_flow_nodes_flow_id ON flow_nodes(flow_id);
CREATE INDEX IF NOT EXISTS idx_node_content_node_id ON node_content(node_id);
CREATE INDEX IF NOT EXISTS idx_flow_simulations_flow_id ON flow_simulations(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_simulations_user_id ON flow_simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_flow_progress_user_id ON flow_progress(user_id);

-- Enable RLS
ALTER TABLE sales_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_flows
CREATE POLICY "Users can view their own flows" ON sales_flows
    FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE OR is_template = TRUE);

CREATE POLICY "Users can insert their own flows" ON sales_flows
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flows" ON sales_flows
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flows" ON sales_flows
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for flow_nodes (via flow ownership)
CREATE POLICY "Users can manage nodes of their flows" ON flow_nodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM sales_flows 
            WHERE sales_flows.id = flow_nodes.flow_id 
            AND (sales_flows.user_id = auth.uid() OR sales_flows.is_public = TRUE OR sales_flows.is_template = TRUE)
        )
    );

-- RLS Policies for node_content (via node/flow ownership)
CREATE POLICY "Users can manage content of their nodes" ON node_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM flow_nodes 
            JOIN sales_flows ON sales_flows.id = flow_nodes.flow_id
            WHERE flow_nodes.id = node_content.node_id 
            AND (sales_flows.user_id = auth.uid() OR sales_flows.is_public = TRUE OR sales_flows.is_template = TRUE)
        )
    );

-- RLS Policies for flow_simulations
CREATE POLICY "Users can manage their simulations" ON flow_simulations
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for flow_progress
CREATE POLICY "Users can manage their progress" ON flow_progress
    FOR ALL USING (auth.uid() = user_id);
