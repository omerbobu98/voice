# 🚀 Sales Flow Rebuild - New Conversation Prompt

**Copy and paste this prompt at the start of a new conversation to provide full context:**

---

## PROMPT FOR NEW CONVERSATION

```
I need you to help me build a completely new Sales Flow feature for my sales training platform.

## PROJECT CONTEXT
- **Platform**: SalesAI - A sales training and coaching platform
- **Frontend**: React + Vite, TailwindCSS, deployed on Netlify (https://vloce.netlify.app)
- **Backend**: Flask/Python, deployed on Railway
- **Database**: Supabase PostgreSQL
- **Existing Features**: Call analysis, AI coaching, Story Bank, Practice sessions

## WHAT WE'RE BUILDING
A revolutionary **Interactive Conversation Tree** system that replaces the old linear sales flow design.

### Core Features Required:
1. **Visual Flowchart with React Flow (@xyflow/react)**
   - Real node-based diagram showing conversation paths
   - Zoom, pan, minimap controls
   - Custom nodes: Seller actions, Customer responses, Decision points, Outcomes
   - Animated edges showing flow direction

2. **Branching Conversation Tree**
   - Each seller action has 2-4 possible customer responses
   - Tree expands to show "If customer says X → path A, If customer says Y → path B"
   - 4-5 levels deep with 30-50 nodes
   - Realistic scenarios with objections, interest signals, questions

3. **AI Chat at Every Node**
   - Click any node → AI chat panel opens
   - Ask: "What should I say here?", "How do I handle this objection?"
   - AI generates scripts, tips, stories on demand
   - Context-aware coaching based on current position

4. **Practice Mode**
   - Step-by-step guided walkthrough
   - "Customer says: X" → User types/speaks response
   - AI evaluates and shows which path they'd take
   - Score and feedback at each decision

5. **Simulation Mode (Voice + Text)**
   - AI plays customer with realistic persona
   - User speaks (Whisper transcription) or types
   - AI responds dynamically (TTS audio)
   - Real-time path visualization
   - Full debrief at end

6. **Progress & Gamification**
   - Mastery levels per node (Novice → Master)
   - Heat map showing strong/weak areas
   - Achievements and badges
   - Practice history

## COMPLETE SPECIFICATION
Read the full specification file at:
`/memory-bank/SALES_FLOW_REBUILD_COMPLETE_SPEC.md`

This file contains:
- Complete database schema (8 new tables)
- All backend API endpoints
- Frontend component architecture
- React Flow implementation details
- AI prompt templates
- UI mockups for each mode
- Implementation checklist

## KEY DECISIONS ALREADY MADE
1. ✅ Rebuild from scratch (delete old implementation)
2. ✅ Use React Flow for visualization
3. ✅ All features: Explore, Practice, Simulation modes
4. ✅ Both voice AND text for simulation
5. ✅ Tree depth: as deep as needed (4-5+ levels)
6. ✅ AI integration at every level

## FILES TO REFERENCE
- Spec: `/memory-bank/SALES_FLOW_REBUILD_COMPLETE_SPEC.md`
- Current (to delete): `/frontend/src/pages/SalesFlowPage.jsx`
- Backend: `/app.py`
- Database: Supabase project `ueztvmtwxqszvlzmoezx`

## FIRST STEPS
1. Read the complete spec file
2. Install @xyflow/react: `npm install @xyflow/react`
3. Create new database schema in Supabase
4. Start with Phase 1: Basic React Flow canvas with custom nodes

Please start implementing the Sales Flow rebuild following the specification. Begin with Phase 1: Foundation.
```

---

## QUICK CONTEXT (If you need shorter version)

```
Build an Interactive Conversation Tree for sales training using React Flow.

Key features:
- Visual node-based flowchart with branching paths
- AI chat at every node for coaching
- Practice mode: step-by-step with AI feedback
- Simulation mode: AI plays customer (voice + text)
- Progress tracking with mastery levels

Full spec: /memory-bank/SALES_FLOW_REBUILD_COMPLETE_SPEC.md

Tech: React + @xyflow/react, Flask backend, Supabase, OpenAI
```

---

## IMPORTANT FILES TO READ FIRST

1. **`/memory-bank/SALES_FLOW_REBUILD_COMPLETE_SPEC.md`**
   - Complete technical specification
   - Database schema
   - API endpoints
   - Component architecture
   - Implementation checklist

2. **`/memory-bank/PLATFORM_ARCHITECTURE_COMPLETE.md`**
   - Overall platform architecture
   - Existing features
   - Tech stack details

3. **`/app.py`**
   - Backend endpoints
   - Where to add new sales flow APIs

4. **`/frontend/src/App.jsx`**
   - Main app structure
   - Navigation integration

---

## DATABASE TABLES TO CREATE

```sql
-- Run these in Supabase SQL Editor:
conversation_trees      -- Master tree records
tree_nodes              -- Individual nodes in conversation
node_edges              -- Connections between nodes
node_content            -- Rich content (scripts, tips, stories)
tree_practice_sessions  -- User practice history
node_mastery            -- Mastery tracking per node
node_ai_chats           -- AI conversation history
tree_achievements       -- Gamification badges
```

Full SQL in the spec file.

---

## NPM PACKAGES TO INSTALL

```bash
cd frontend
npm install @xyflow/react
```

---

## IMPLEMENTATION ORDER

1. **Phase 1**: React Flow canvas + custom nodes
2. **Phase 2**: Database schema + backend endpoints
3. **Phase 3**: Explore mode (free navigation)
4. **Phase 4**: AI chat panel integration
5. **Phase 5**: Practice mode
6. **Phase 6**: Simulation mode (voice + text)
7. **Phase 7**: Progress tracking + gamification
8. **Phase 8**: Polish and testing

---

*Use this document to start any new conversation about the Sales Flow rebuild.*
