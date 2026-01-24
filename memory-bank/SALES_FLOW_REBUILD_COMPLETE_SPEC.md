# 🎯 Sales Flow Complete Rebuild Specification

## Document Purpose
This document contains the COMPLETE specification for rebuilding the Sales Flow feature from scratch. Use this as the single source of truth for implementing the new interactive conversation tree system with AI integration.

---

## 📋 Executive Summary

### What We're Building
A **revolutionary interactive conversation tree system** for sales training that replaces the current linear stage-based design with a visual, branching flowchart where users can:
- See ALL possible conversation paths visually
- Navigate through scenarios interactively
- Get AI coaching at every decision point
- Practice with AI-powered simulations (voice + text)
- Track mastery and progress

### Why We're Rebuilding
The current design has critical problems:
| Current Problem | New Solution |
|-----------------|--------------|
| Linear list of stages | Visual branching tree with React Flow |
| Static content display | Interactive nodes with AI chat |
| No "what if" scenarios | Multiple branches per decision point |
| Can't ask AI questions | AI chat panel at every node |
| No learning progression | Mastery tracking & gamification |
| Just clicking shows text | Full voice/text simulation with AI |

### User Requirements (Confirmed)
1. ✅ **Rebuild from scratch** - Replace old implementation completely
2. ✅ **Visual tree with React Flow** - Real node-based flowchart
3. ✅ **AI chat at each node** - Ask questions, get coaching
4. ✅ **Practice walkthrough** - Step-by-step guided learning
5. ✅ **Full simulation** - AI plays customer role
6. ✅ **As deep as needed** - 4-5+ levels, 20-50+ nodes
7. ✅ **Both voice AND text** - For simulation mode
8. ✅ **100x better** - Complete professional redesign

---

## 🏗️ Technical Architecture

### Technology Stack
```
Frontend:
├── React + Vite (existing)
├── @xyflow/react (React Flow v12) - NEW
├── TailwindCSS (existing)
├── Lucide Icons (existing)
└── OpenAI TTS/Whisper for voice

Backend:
├── Flask/Python (existing)
├── OpenAI GPT-4o for AI features
└── Supabase PostgreSQL

Key Libraries to Install:
npm install @xyflow/react
```

### Database Schema (Complete Redesign)

```sql
-- =============================================
-- SALES FLOW REBUILD - NEW DATABASE SCHEMA
-- =============================================

-- Drop old tables (will be replaced)
-- DROP TABLE IF EXISTS sales_flows, flow_nodes, node_content, flow_simulations, flow_progress CASCADE;

-- 1. CONVERSATION TREES - Master records for each sales flow
CREATE TABLE conversation_trees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    product_type TEXT NOT NULL,
    industry TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    root_node_id UUID, -- Will be set after first node created
    is_template BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false,
    total_nodes INTEGER DEFAULT 0,
    max_depth INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TREE NODES - Each point in the conversation
CREATE TABLE tree_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id UUID REFERENCES conversation_trees(id) ON DELETE CASCADE,
    parent_node_id UUID REFERENCES tree_nodes(id) ON DELETE SET NULL,
    
    -- Node identity
    speaker TEXT NOT NULL CHECK (speaker IN ('seller', 'customer', 'system')),
    node_type TEXT NOT NULL CHECK (node_type IN ('action', 'response', 'decision', 'outcome', 'root')),
    
    -- Content
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- What is said/done
    short_content TEXT, -- Brief version for node display
    
    -- Stage/Category
    stage TEXT CHECK (stage IN (
        'opening', 'qualification', 'discovery', 'pain_amplification',
        'solution', 'storytelling', 'objection', 'closing', 'next_steps', 'exit'
    )),
    
    -- Visual properties
    position_x FLOAT DEFAULT 0,
    position_y FLOAT DEFAULT 0,
    color TEXT DEFAULT '#8b5cf6',
    icon TEXT DEFAULT 'message-circle',
    
    -- Metadata
    coaching_tips TEXT[], -- Array of tips for this node
    success_probability FLOAT DEFAULT 0.5, -- 0-1 likelihood of success
    difficulty_level TEXT DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    
    -- Branching info
    branch_label TEXT, -- "Customer objects to price", "Customer shows interest"
    branch_condition TEXT, -- What triggers this branch
    
    -- AI
    ai_generated BOOLEAN DEFAULT true,
    
    -- Depth tracking
    depth_level INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. NODE EDGES - Connections between nodes
CREATE TABLE node_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tree_id UUID REFERENCES conversation_trees(id) ON DELETE CASCADE,
    from_node_id UUID REFERENCES tree_nodes(id) ON DELETE CASCADE,
    to_node_id UUID REFERENCES tree_nodes(id) ON DELETE CASCADE,
    
    -- Edge properties
    label TEXT, -- Display label on the edge
    edge_type TEXT DEFAULT 'default' CHECK (edge_type IN ('default', 'success', 'objection', 'question', 'exit')),
    probability FLOAT DEFAULT 0.33, -- How likely this path
    
    -- Visual
    color TEXT,
    animated BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(from_node_id, to_node_id)
);

-- 4. NODE CONTENT - Rich content for each node (scripts, questions, tips, stories)
CREATE TABLE node_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID REFERENCES tree_nodes(id) ON DELETE CASCADE,
    
    content_type TEXT NOT NULL CHECK (content_type IN ('script', 'question', 'tip', 'story', 'objection_response')),
    title TEXT,
    content TEXT NOT NULL,
    
    -- For questions
    question_category TEXT CHECK (question_category IN ('situational', 'problem', 'implication', 'need_payoff', 'budget', 'authority', 'timeline', 'closing')),
    
    -- For objection responses
    objection_text TEXT,
    response_text TEXT,
    
    -- Audio
    audio_url TEXT,
    
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRACTICE SESSIONS - User's practice history
CREATE TABLE tree_practice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tree_id UUID REFERENCES conversation_trees(id) ON DELETE CASCADE,
    
    -- Session info
    mode TEXT NOT NULL CHECK (mode IN ('explore', 'practice', 'simulation')),
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    
    -- Path tracking
    current_node_id UUID REFERENCES tree_nodes(id),
    path_taken UUID[] DEFAULT '{}', -- Array of node IDs visited
    decisions_made JSONB DEFAULT '[]', -- [{node_id, choice, timestamp, score}]
    
    -- Performance
    total_score FLOAT DEFAULT 0,
    nodes_visited INTEGER DEFAULT 0,
    correct_decisions INTEGER DEFAULT 0,
    
    -- Simulation specific
    simulation_transcript JSONB DEFAULT '[]', -- [{speaker, text, timestamp, node_id}]
    ai_feedback JSONB DEFAULT '{}',
    
    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER
);

-- 6. NODE MASTERY - Track user's mastery of each node
CREATE TABLE node_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id UUID REFERENCES tree_nodes(id) ON DELETE CASCADE,
    
    times_practiced INTEGER DEFAULT 0,
    times_correct INTEGER DEFAULT 0,
    best_score FLOAT DEFAULT 0,
    average_score FLOAT DEFAULT 0,
    
    mastery_level TEXT DEFAULT 'novice' CHECK (mastery_level IN ('novice', 'learning', 'proficient', 'expert', 'master')),
    
    last_practiced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, node_id)
);

-- 7. NODE AI CHATS - History of AI conversations about each node
CREATE TABLE node_ai_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id UUID REFERENCES tree_nodes(id) ON DELETE CASCADE,
    
    messages JSONB NOT NULL DEFAULT '[]', -- [{role, content, timestamp}]
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. USER ACHIEVEMENTS - Gamification
CREATE TABLE tree_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    achievement_type TEXT NOT NULL,
    achievement_name TEXT NOT NULL,
    description TEXT,
    
    tree_id UUID REFERENCES conversation_trees(id),
    
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_type, tree_id)
);

-- Indexes for performance
CREATE INDEX idx_tree_nodes_tree_id ON tree_nodes(tree_id);
CREATE INDEX idx_tree_nodes_parent ON tree_nodes(parent_node_id);
CREATE INDEX idx_node_edges_from ON node_edges(from_node_id);
CREATE INDEX idx_node_edges_to ON node_edges(to_node_id);
CREATE INDEX idx_node_content_node ON node_content(node_id);
CREATE INDEX idx_practice_sessions_user ON tree_practice_sessions(user_id);
CREATE INDEX idx_node_mastery_user ON node_mastery(user_id);

-- Enable RLS
ALTER TABLE conversation_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_ai_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE tree_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can access their own data + public/template trees)
CREATE POLICY "Users can view own trees and public/templates" ON conversation_trees
    FOR SELECT USING (user_id = auth.uid() OR is_public = true OR is_template = true);

CREATE POLICY "Users can manage own trees" ON conversation_trees
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view nodes of accessible trees" ON tree_nodes
    FOR SELECT USING (
        tree_id IN (SELECT id FROM conversation_trees WHERE user_id = auth.uid() OR is_public = true OR is_template = true)
    );

CREATE POLICY "Users can manage nodes of own trees" ON tree_nodes
    FOR ALL USING (
        tree_id IN (SELECT id FROM conversation_trees WHERE user_id = auth.uid())
    );

-- Similar policies for other tables...
```

---

## 🎨 Frontend Architecture

### Component Structure
```
frontend/src/
├── pages/
│   └── SalesFlowPage.jsx  -- COMPLETE REWRITE
│
├── components/
│   └── sales-flow/        -- NEW FOLDER
│       ├── ConversationTreeCanvas.jsx  -- Main React Flow canvas
│       ├── nodes/
│       │   ├── SellerActionNode.jsx    -- Purple: what seller says
│       │   ├── CustomerResponseNode.jsx -- Green/Red: customer reactions
│       │   ├── DecisionNode.jsx        -- Blue: branch points
│       │   ├── OutcomeNode.jsx         -- Gold: results
│       │   └── RootNode.jsx            -- Start node
│       ├── edges/
│       │   └── CustomEdge.jsx          -- Animated connection lines
│       ├── panels/
│       │   ├── AIChatPanel.jsx         -- Docked AI assistant
│       │   ├── NodeDetailPanel.jsx     -- Node details on click
│       │   ├── ProgressPanel.jsx       -- Mastery heat map
│       │   └── SimulationPanel.jsx     -- Voice/text controls
│       ├── modes/
│       │   ├── ExploreMode.jsx         -- Free navigation
│       │   ├── PracticeMode.jsx        -- Guided walkthrough
│       │   └── SimulationMode.jsx      -- Full AI roleplay
│       ├── controls/
│       │   ├── TreeControls.jsx        -- Zoom, pan, fit
│       │   ├── ModeSelector.jsx        -- Switch between modes
│       │   └── GenerateTreeModal.jsx   -- Create new tree
│       └── utils/
│           ├── treeLayout.js           -- Auto-layout algorithm
│           └── nodeStyles.js           -- Node styling helpers
```

### React Flow Setup
```jsx
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodeTypes = {
  sellerAction: SellerActionNode,
  customerResponse: CustomerResponseNode,
  decision: DecisionNode,
  outcome: OutcomeNode,
  root: RootNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

function ConversationTreeCanvas({ treeId }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [mode, setMode] = useState('explore'); // explore | practice | simulation
  
  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(event, node) => setSelectedNode(node)}
        fitView
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
      
      {/* Docked AI Chat Panel */}
      <AIChatPanel selectedNode={selectedNode} treeId={treeId} />
      
      {/* Mode-specific UI */}
      {mode === 'practice' && <PracticeMode />}
      {mode === 'simulation' && <SimulationMode />}
    </div>
  );
}
```

### Custom Node Component Example
```jsx
function SellerActionNode({ data, selected }) {
  return (
    <div className={`
      px-4 py-3 rounded-lg border-2 shadow-lg
      bg-purple-900/80 border-purple-500
      ${selected ? 'ring-2 ring-purple-400' : ''}
      min-w-[200px] max-w-[280px]
    `}>
      <div className="flex items-center gap-2 mb-2">
        <MessageCircle className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-semibold text-purple-300 uppercase">
          {data.stage}
        </span>
      </div>
      <p className="text-sm text-white font-medium">{data.title}</p>
      <p className="text-xs text-gray-300 mt-1 line-clamp-2">
        {data.shortContent}
      </p>
      
      {/* Branch handles */}
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
```

---

## 🤖 Backend API Endpoints

### New Endpoints (Replace Old)

```python
# =============================================
# CONVERSATION TREE ENDPOINTS
# =============================================

# GET /api/conversation-trees
# List all trees for user (+ templates)

# GET /api/conversation-trees/<tree_id>
# Get full tree with all nodes and edges

# POST /api/conversation-trees/generate
# AI generates complete branching tree
# Body: { product_type, industry, language, depth }

# PUT /api/conversation-trees/<tree_id>
# Update tree metadata

# DELETE /api/conversation-trees/<tree_id>
# Delete tree and all related data

# =============================================
# NODE ENDPOINTS
# =============================================

# GET /api/tree-nodes/<node_id>
# Get single node with content

# POST /api/tree-nodes
# Create new node
# Body: { tree_id, parent_node_id, speaker, node_type, title, content, ... }

# PUT /api/tree-nodes/<node_id>
# Update node

# DELETE /api/tree-nodes/<node_id>
# Delete node and children

# POST /api/tree-nodes/<node_id>/generate-branches
# AI generates child branches for this node
# Body: { num_branches, branch_types }

# =============================================
# AI CHAT ENDPOINTS
# =============================================

# POST /api/node-chat
# Chat with AI about a specific node
# Body: { node_id, message, context }
# Returns: AI response with coaching/scripts/tips

# POST /api/node-chat/<node_id>/generate-content
# AI generates content for node
# Body: { content_type } // script, question, tip, story, objection

# =============================================
# PRACTICE & SIMULATION ENDPOINTS
# =============================================

# POST /api/practice-sessions
# Start new practice session
# Body: { tree_id, mode }

# PUT /api/practice-sessions/<session_id>
# Update session (record decision, move to next node)
# Body: { current_node_id, decision, user_response }

# POST /api/practice-sessions/<session_id>/evaluate
# AI evaluates user's response
# Body: { node_id, user_response, expected_path }
# Returns: { score, feedback, recommended_path, coaching }

# POST /api/simulation/respond
# AI generates customer response in simulation
# Body: { session_id, node_id, user_message, persona }
# Returns: { ai_response, next_node_id, emotion, audio_url }

# POST /api/simulation/transcribe
# Transcribe user's voice input
# Body: { audio_data }
# Returns: { text }

# =============================================
# PROGRESS & MASTERY ENDPOINTS
# =============================================

# GET /api/tree-mastery/<tree_id>
# Get user's mastery of all nodes in tree

# GET /api/user-stats
# Get overall user statistics

# POST /api/achievements/check
# Check and award achievements
```

### AI Tree Generation (Core Logic)

```python
@app.route('/api/conversation-trees/generate', methods=['POST'])
def generate_conversation_tree():
    """Generate a complete branching conversation tree using AI"""
    user_id = get_user_id_from_token()
    data = request.get_json()
    
    product_type = data.get('product_type')
    industry = data.get('industry')
    language = data.get('language', 'en')
    depth = data.get('depth', 4)  # How many levels deep
    
    prompt = f"""Create a complete sales conversation decision tree for selling {product_type} in the {industry} industry.

The tree should have {depth} levels of depth with realistic branching at each decision point.

Return a JSON structure:
{{
  "name": "Sales Conversation Tree for {product_type}",
  "description": "Interactive conversation flow",
  "nodes": [
    {{
      "id": "root",
      "speaker": "seller",
      "node_type": "root",
      "title": "Opening",
      "content": "Full opening script...",
      "short_content": "Brief version for display",
      "stage": "opening",
      "coaching_tips": ["Tip 1", "Tip 2"],
      "children": [
        {{
          "id": "engaged_1",
          "speaker": "customer",
          "node_type": "response",
          "title": "Customer Engaged",
          "content": "Tell me more about that...",
          "branch_label": "Shows Interest",
          "success_probability": 0.7,
          "children": [...]
        }},
        {{
          "id": "skeptical_1", 
          "speaker": "customer",
          "node_type": "response",
          "title": "Customer Skeptical",
          "content": "I'm not sure I need this...",
          "branch_label": "Raises Doubt",
          "success_probability": 0.4,
          "children": [...]
        }},
        {{
          "id": "objection_1",
          "speaker": "customer", 
          "node_type": "response",
          "title": "Price Objection",
          "content": "That sounds expensive...",
          "branch_label": "Objects to Price",
          "success_probability": 0.3,
          "children": [...]
        }}
      ]
    }}
  ]
}}

Rules:
1. Each seller action should have 2-4 possible customer responses
2. Customer responses should be realistic and varied
3. Include common objections (price, timing, need to think, competitor)
4. End branches with outcomes (sale, follow-up, lost)
5. Include coaching tips at key decision points
6. Make content specific to {product_type} in {industry}
7. {"Generate in Hebrew" if language == "he" else "Generate in English"}

Generate a tree with approximately 30-50 nodes total."""

    # Call OpenAI and parse response
    # Insert into database
    # Return tree_id
```

---

## 🎮 Interaction Modes

### Mode 1: EXPLORE MODE
**Purpose**: Learn the entire conversation map freely

**Features**:
- Full tree visible with zoom/pan
- Click any node to see details
- Expand/collapse branches
- AI chat available for any node
- No scoring or tracking

**UI**:
```
┌─────────────────────────────────────────────────────────┐
│ [Explore] [Practice] [Simulate]     🔍 Zoom  📍 Fit    │
├─────────────────────────────────────────────────────────┤
│                                          ┌────────────┐ │
│     ┌───────┐                            │ AI COACH   │ │
│     │ Root  │                            │            │ │
│     └───┬───┘                            │ "What      │ │
│    ┌────┼────┐                           │  should I  │ │
│    ▼    ▼    ▼                           │  say here?"│ │
│  ┌───┐┌───┐┌───┐                         │            │ │
│  │ A ││ B ││ C │  ← Click to expand      │ [Ask AI]   │ │
│  └───┘└───┘└───┘                         └────────────┘ │
│                                                         │
│ [MiniMap]                                              │
└─────────────────────────────────────────────────────────┘
```

### Mode 2: PRACTICE MODE
**Purpose**: Guided step-by-step learning with feedback

**Features**:
- Start at root node
- Present scenario: "Customer says: ..."
- User types/selects their response
- AI evaluates and shows which path they'd take
- Score and feedback at each step
- Can retry or continue

**UI**:
```
┌─────────────────────────────────────────────────────────┐
│ PRACTICE MODE - Step 3 of 8           Score: 85%       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Customer says:                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ "That price seems a bit high compared to what   │   │
│  │  I was expecting. Can you do any better?"       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  What would you say?                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [Type your response or choose from options]     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Suggested responses:                                   │
│  ○ Acknowledge and ask about budget                    │
│  ○ Explain value proposition                           │
│  ○ Offer alternative package                           │
│                                                         │
│  [Submit Response]                    [🎤 Voice Input] │
│                                                         │
│  ─────────────────────────────────────────────────     │
│  Path so far: Opening → Discovery → Qualification →    │
└─────────────────────────────────────────────────────────┘
```

### Mode 3: SIMULATION MODE
**Purpose**: Full AI-powered roleplay with voice/text

**Features**:
- AI plays customer with realistic persona
- User speaks or types naturally
- AI evaluates intent and responds dynamically
- Real-time path visualization
- Full transcript saved
- Comprehensive debrief at end

**UI**:
```
┌─────────────────────────────────────────────────────────┐
│ SIMULATION - Selling Vinyl Fence to John (Skeptical)   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎭 John (Customer)                              │   │
│  │ "Look, I've gotten a few quotes already and     │   │
│  │  yours is the highest. Why should I go with you?"│  │
│  └─────────────────────────────────────────────────┘   │
│                     │                                   │
│                     ▼                                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎤 [Recording...] or 💬 Type your response     │   │
│  │                                                 │   │
│  │ "I appreciate you being upfront about that..."  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Send] [🔊 Play AI Audio]                             │
│                                                         │
│  ─────────────────────────────────────────────────     │
│  Current Position in Tree:                             │
│  [Root] → [Discovery] → [Objection] → [YOU ARE HERE]   │
│                                                         │
│  Session: 5:32 elapsed    Nodes visited: 4             │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Progress & Gamification

### Mastery Levels
```
NOVICE     → 0-2 successful practices
LEARNING   → 3-5 successful practices  
PROFICIENT → 6-10 successful practices
EXPERT     → 11-20 successful practices
MASTER     → 21+ successful practices with 90%+ score
```

### Visual Heat Map
```
Node colors based on mastery:
🔴 Red    = Never practiced / Failed
🟠 Orange = Novice
🟡 Yellow = Learning
🟢 Green  = Proficient
💚 Bright = Expert
⭐ Gold   = Master
```

### Achievements
- 🎯 First Tree Completed
- 🌳 Tree Explorer (visited all nodes)
- 💪 Objection Handler (mastered all objection nodes)
- 🎭 Simulation Star (5 successful simulations)
- 🔥 On Fire (7-day practice streak)
- 👑 Master Seller (all nodes at Expert+)

---

## 🔄 AI Prompt Templates

### Node Chat Prompt
```
You are a sales coach helping a salesperson at this point in a {product_type} sales conversation.

Current node: {node.title}
Stage: {node.stage}
Context: {node.content}
Previous path: {path_taken}

User's question: {user_message}

Provide helpful coaching that is:
1. Specific to this exact moment in the conversation
2. Actionable with example phrases they can use
3. Aware of what led to this point
4. Preparing them for possible next steps

If they ask for a script, give them 2-3 variations.
If they ask about handling something, use the LAIR method (Listen, Acknowledge, Isolate, Respond).
```

### Simulation Customer Prompt
```
You are playing the role of a customer in a sales roleplay simulation.

Your persona: {persona}
- Name: {name}
- Personality: {personality} (skeptical/friendly/busy/analytical)
- Pain points: {pain_points}
- Budget concerns: {budget_level}
- Decision timeline: {timeline}

Current conversation stage: {stage}
Previous exchanges: {transcript}

The salesperson just said: "{user_message}"

Respond as this customer would NATURALLY respond. Be realistic:
- If they're doing well, show interest but don't make it too easy
- If they're making mistakes, express realistic concerns
- Stay in character
- Keep responses conversational (1-3 sentences)

Also return:
- emotion: (interested/skeptical/frustrated/engaged/ready_to_buy/walking_away)
- next_logical_path: (which branch this response leads toward)
```

---

## 📁 File Changes Summary

### Files to DELETE (old implementation)
```
frontend/src/pages/SalesFlowPage.jsx  -- Will be completely rewritten
```

### Files to CREATE
```
frontend/src/pages/SalesFlowPage.jsx  -- NEW complete rewrite
frontend/src/components/sales-flow/ConversationTreeCanvas.jsx
frontend/src/components/sales-flow/nodes/SellerActionNode.jsx
frontend/src/components/sales-flow/nodes/CustomerResponseNode.jsx
frontend/src/components/sales-flow/nodes/DecisionNode.jsx
frontend/src/components/sales-flow/nodes/OutcomeNode.jsx
frontend/src/components/sales-flow/nodes/RootNode.jsx
frontend/src/components/sales-flow/edges/CustomEdge.jsx
frontend/src/components/sales-flow/panels/AIChatPanel.jsx
frontend/src/components/sales-flow/panels/NodeDetailPanel.jsx
frontend/src/components/sales-flow/panels/ProgressPanel.jsx
frontend/src/components/sales-flow/panels/SimulationPanel.jsx
frontend/src/components/sales-flow/modes/ExploreMode.jsx
frontend/src/components/sales-flow/modes/PracticeMode.jsx
frontend/src/components/sales-flow/modes/SimulationMode.jsx
frontend/src/components/sales-flow/controls/TreeControls.jsx
frontend/src/components/sales-flow/controls/ModeSelector.jsx
frontend/src/components/sales-flow/controls/GenerateTreeModal.jsx
frontend/src/components/sales-flow/utils/treeLayout.js
frontend/src/components/sales-flow/utils/nodeStyles.js
```

### Backend Files to MODIFY
```
app.py -- Add new endpoints, remove old sales-flow endpoints
```

### Database
```
Run new schema SQL in Supabase
Old tables will be replaced
```

---

## ✅ Implementation Checklist

### Phase 1: Foundation
- [ ] Install @xyflow/react
- [ ] Create new database schema in Supabase
- [ ] Create basic ConversationTreeCanvas component
- [ ] Implement custom node components
- [ ] Add zoom/pan/minimap controls

### Phase 2: Data Layer
- [ ] Create backend endpoints for trees
- [ ] Implement tree generation with AI
- [ ] Create node CRUD endpoints
- [ ] Connect frontend to backend

### Phase 3: Explore Mode
- [ ] Full tree visualization
- [ ] Node click to expand details
- [ ] Node detail panel
- [ ] Basic AI chat integration

### Phase 4: AI Chat Panel
- [ ] Docked chat panel UI
- [ ] Context-aware prompts
- [ ] Generate scripts/tips/stories on demand
- [ ] Chat history per node

### Phase 5: Practice Mode
- [ ] Step-by-step navigation
- [ ] User response input (text)
- [ ] AI evaluation of responses
- [ ] Scoring and feedback
- [ ] Path visualization

### Phase 6: Simulation Mode
- [ ] AI customer persona
- [ ] Text conversation flow
- [ ] Voice input (Whisper)
- [ ] Voice output (TTS)
- [ ] Real-time path tracking
- [ ] Session transcript
- [ ] Debrief summary

### Phase 7: Progress & Gamification
- [ ] Mastery tracking per node
- [ ] Heat map visualization
- [ ] Achievements system
- [ ] Progress statistics

### Phase 8: Polish
- [ ] Animations and transitions
- [ ] Mobile responsiveness
- [ ] Error handling
- [ ] Performance optimization
- [ ] Testing

---

## 🚀 Ready to Build

This document contains everything needed to implement the new Sales Flow system. The architecture is designed to be:

1. **Scalable** - Can handle complex trees with 100+ nodes
2. **Interactive** - React Flow provides smooth, modern UX
3. **AI-Powered** - AI at every level from generation to coaching
4. **Learning-Focused** - Gamification and progress tracking
5. **Professional** - Production-ready architecture

**Start with Phase 1 and work through sequentially.**

---

*Document created: January 2026*
*Last updated: January 23, 2026*
*Version: 1.0*
