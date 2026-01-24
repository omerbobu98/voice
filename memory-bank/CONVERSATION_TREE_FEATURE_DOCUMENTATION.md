# Conversation Tree Feature - Complete Documentation

## Overview

The Conversation Tree is an interactive sales training tool that provides a visual, branching flowchart of sales conversations. It enables salespeople to explore different conversation paths, practice responses, and receive AI coaching at every step.

**Production URLs:**
- Frontend: https://vloce.netlify.app/sales-flow
- Backend: https://web-production-3215.up.railway.app

---

## Architecture

### Frontend Components

#### 1. `SalesFlowPageNew.jsx`
**Location:** `/frontend/src/pages/SalesFlowPageNew.jsx`

**Purpose:** Main page component that orchestrates the entire Sales Flow feature.

**Key Features:**
- Tree selection sidebar
- Mode switching (Explore, Practice, Simulate)
- Tree generation modal
- Integration with React Flow canvas

**State Management:**
- `trees` - List of user's conversation trees
- `selectedTree` - Currently active tree
- `selectedNode` - Currently selected node for detail view
- `mode` - Current mode (explore/practice/simulate)

---

#### 2. `ConversationFlowCanvas.jsx`
**Location:** `/frontend/src/components/sales-flow/ConversationFlowCanvas.jsx`

**Purpose:** React Flow canvas that renders the interactive node-based flowchart.

**Key Features:**
- Visual nodes with color-coding by type (seller/customer/objection/outcome)
- Animated edges with labels
- Zoom, pan, and minimap controls
- Node selection handling

**Node Types:**
| Type | Color | Description |
|------|-------|-------------|
| Seller | Purple | Sales rep actions/scripts |
| Customer | Green | Customer responses |
| Objection | Orange | Price/timing objections |
| Outcome | Blue | End states (sale, follow-up, lost) |

---

#### 3. `NodeDetailPanel.jsx`
**Location:** `/frontend/src/components/sales-flow/panels/NodeDetailPanel.jsx`

**Purpose:** Slide-out panel showing detailed information about the selected node.

**Sections Displayed:**
1. **Header** - Speaker type, stage, close button
2. **Content** - Full script/response text
3. **Coaching Tips** - Actionable advice list
4. **Why This Works** - Psychology explanation
5. **Common Mistakes** - What to avoid
6. **Practice Exercise** - Hands-on practice tip
7. **Customer Mindset** (customer nodes) - What they're thinking
8. **Signals to Notice** (customer nodes) - Body language cues

**Action Buttons:**
- **Ask AI About This** - Opens AI coaching chat
- **Play Audio** - TTS playback of the content

---

#### 4. `treeLayout.js`
**Location:** `/frontend/src/components/sales-flow/utils/treeLayout.js`

**Purpose:** Converts hierarchical tree data into React Flow nodes and edges.

**Key Functions:**
- `convertToReactFlowNodes()` - Transforms tree structure to nodes array
- `convertToReactFlowEdges()` - Creates edge connections between nodes
- Position calculation for visual layout

---

#### 5. `sampleData.js`
**Location:** `/frontend/src/components/sales-flow/utils/sampleData.js`

**Purpose:** Provides demo/sample conversation tree for users without saved trees.

**Sample Tree Structure:**
- Root: Opening Introduction
- Level 1: 4 customer responses (Interested, Skeptical, Price Question, Busy)
- Level 2: Seller follow-up actions
- Level 3: Customer reactions
- Level 4: Outcomes

---

### Backend Endpoints

#### Tree Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversation-trees` | GET | List user's trees |
| `/api/conversation-trees/<id>` | GET | Get tree with nodes/edges |
| `/api/conversation-trees` | POST | Create new tree |
| `/api/conversation-trees/<id>` | PUT | Update tree |
| `/api/conversation-trees/<id>` | DELETE | Delete tree |

#### Tree Generation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversation-trees/generate` | POST | AI-generate complete tree |

**Generation Parameters:**
```json
{
  "name": "Tree Name",
  "product_type": "cool_life_paint",
  "industry": "home_improvement",
  "language": "en",
  "depth": 4
}
```

#### AI Coaching

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/node-chat` | POST | AI coaching for specific node |

**Request:**
```json
{
  "node_id": "uuid",
  "message": "How can I improve this?",
  "node_data": { /* optional for sample nodes */ }
}
```

**AI Coach Features:**
- Context-aware responses based on node content
- LAIR method for objection handling
- Script variations and examples
- Psychology explanations
- Practice feedback tips

---

### Database Schema

#### `conversation_trees`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner |
| name | TEXT | Tree name |
| description | TEXT | Description |
| product_type | TEXT | Product being sold |
| industry | TEXT | Industry context |
| language | TEXT | en/he |
| root_node_id | UUID | First node reference |
| total_nodes | INT | Node count |
| max_depth | INT | Tree depth |

#### `tree_nodes`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tree_id | UUID | Parent tree |
| parent_node_id | UUID | Parent node |
| speaker | TEXT | seller/customer |
| node_type | TEXT | root/action/response/outcome |
| title | TEXT | Node title |
| content | TEXT | Full script/response |
| short_content | TEXT | Brief summary |
| stage | TEXT | Conversation stage |
| coaching_tips | ARRAY | Tips list |
| why_it_works | TEXT | Psychology explanation |
| common_mistakes | ARRAY | Mistakes to avoid |
| practice_tip | TEXT | Practice exercise |
| customer_mindset | TEXT | Customer thinking |
| signals_to_notice | ARRAY | Body language cues |
| success_probability | FLOAT | 0.0-1.0 |
| branch_label | TEXT | Edge label |

#### `node_edges`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tree_id | UUID | Parent tree |
| from_node_id | UUID | Source node |
| to_node_id | UUID | Target node |
| label | TEXT | Edge label |
| edge_type | TEXT | success/objection/default |
| probability | FLOAT | Branch probability |

#### `tree_node_ai_chats`
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User |
| node_id | UUID | Node being discussed |
| messages | JSONB | Chat history |

---

## Feature Workflow

### 1. Explore Mode
1. User selects a tree from sidebar
2. React Flow canvas renders the tree
3. User clicks on nodes to see details
4. Node panel shows coaching content
5. User can ask AI questions about any node

### 2. AI Chat Flow
1. User clicks "Ask AI About This"
2. Chat panel opens with context
3. User types question
4. Backend receives: node_id + message + node_data
5. AI generates coaching response using GPT-4.1
6. Response includes: scripts, psychology, practice tips
7. Chat history saved for real DB nodes

### 3. Tree Generation Flow
1. User clicks "Generate New"
2. Modal opens with options (product, industry, depth)
3. Backend calls GPT-4o-mini with training prompt
4. AI returns structured JSON tree
5. Backend inserts tree + nodes + edges in database
6. Frontend displays new tree

---

## Current Status

### ✅ Working Features
- Sample flow loads correctly
- Node selection and detail panel
- Rich training content display (tips, psychology, mistakes, exercises)
- AI coaching chat with comprehensive responses
- Audio playback (TTS)
- Tree list from database
- Mode switching UI

### ⚠️ Known Issues
- Tree generation may timeout on slower connections
- Uses gpt-4o-mini for faster generation

### 🔧 Recent Fixes
- Fixed `get_supabase_client` → `get_supabase` function name mismatch
- Added comprehensive error handling for tree generation
- Added node_data parameter for sample node AI chat
- Simplified tree generation prompt for reliability

---

## Configuration

### Environment Variables (Railway)
```
OPENAI_API_KEY=<key>
SUPABASE_URL=https://ueztvmtwxqszvlzmoezx.supabase.co
SUPABASE_ANON_KEY=<key>
SUPABASE_SERVICE_KEY=<key>
```

### Gunicorn Settings
```
--timeout 300 --workers 1 --threads 4
```

---

## Files Reference

### Frontend
- `/frontend/src/pages/SalesFlowPageNew.jsx` - Main page
- `/frontend/src/components/sales-flow/ConversationFlowCanvas.jsx` - React Flow canvas
- `/frontend/src/components/sales-flow/panels/NodeDetailPanel.jsx` - Node details
- `/frontend/src/components/sales-flow/utils/treeLayout.js` - Layout utilities
- `/frontend/src/components/sales-flow/utils/sampleData.js` - Demo data

### Backend
- `/app.py` - Lines 5611-6200 - All conversation tree endpoints

### Database
- `/supabase_sales_flow.sql` - Schema definitions

---

## AI Prompts

### Tree Generation Prompt
Creates a complete sales training conversation tree with:
- 15-25 nodes across specified depth
- Seller nodes with: coaching_tips, why_it_works, common_mistakes, practice_tip
- Customer nodes with: customer_mindset, signals_to_notice, success_probability

### AI Coaching Prompt
Provides personalized coaching including:
- Exact phrases and script variations
- LAIR method for objections (Listen, Acknowledge, Isolate, Respond)
- Psychology explanations
- Tone and energy feedback
- Practice recommendations

---

*Last Updated: January 24, 2026*
