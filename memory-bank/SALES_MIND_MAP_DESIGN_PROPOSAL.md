# 🧠 Sales Mind Map - Complete Design Proposal

> **Created**: January 27, 2026  
> **Status**: AWAITING APPROVAL  
> **Purpose**: Replace tree-based sales flow with interactive radial mind map

---

## 📋 Executive Summary

### What We're Building
A **radial/circular mind map** that visualizes the ENTIRE sales process from center outward, allowing salespeople to:
- See the complete sales process at a glance
- Click any node to get AI-generated coaching/scripts
- Build and save their own custom scripts
- Practice specific conversation paths
- Access all questions, objections, solutions, and stories in one place

### Why Mind Map > Tree
| Tree (Current) | Mind Map (New) |
|----------------|----------------|
| Linear top-to-bottom flow | Radial expansion from center |
| Hard to see big picture | Everything visible from center |
| Feels like a flowchart | Feels like a brain/thinking tool |
| Scrolling to find nodes | Zoom/pan to explore |
| One path at a time | All paths visible simultaneously |

---

## 🎨 Visual Design

### Layout: Radial/Circular Mind Map

```
                           ┌─────────────────┐
                          /  CLOSING (Ring 4) \
                         /  ┌───────────────┐  \
                        /  /  OBJECTIONS     \  \
                       /  /  (Ring 3)         \  \
                      /  /  ┌─────────────┐    \  \
                     /  /  /  SOLUTION     \    \  \
                    /  /  /  (Ring 2)       \    \  \
                   /  /  /  ┌───────────┐    \    \  \
                  /  /  /  /  DISCOVERY  \    \    \  \
                 /  /  /  /  (Ring 1)     \    \    \  \
                │  │  │  │  ┌─────────┐    │    │    │  │
                │  │  │  │  │         │    │    │    │  │
                │  │  │  │  │ OPENING │    │    │    │  │
                │  │  │  │  │ (Center)│    │    │    │  │
                │  │  │  │  │         │    │    │    │  │
                │  │  │  │  └─────────┘    │    │    │  │
                 \  \  \  \               /    /    /  /
                  \  \  \  └─────────────┘    /    /  /
                   \  \  \                   /    /  /
                    \  \  └─────────────────┘    /  /
                     \  \                       /  /
                      \  └─────────────────────┘  /
                       \                         /
                        └───────────────────────┘
```

### Ring Structure (Center → Outward)

| Ring | Phase | Description | Node Color |
|------|-------|-------------|------------|
| **Center** | Opening/Ice Breaking | Start of conversation | 🟣 Purple |
| **Ring 1** | Discovery | Questions to uncover needs | 🔵 Blue |
| **Ring 2** | Solution/Value | Present benefits, tell stories | 🟢 Green |
| **Ring 3** | Objections | Handle concerns | 🟠 Orange |
| **Ring 4** | Closing | Trial closes, final close | 🟡 Gold |

### Node Types in Mind Map

```
┌──────────────────────────────────────────────────────────────────┐
│                        NODE TYPES                                │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🟣 STAGE NODE (Large Circle)                                   │
│  ┌─────────────┐                                                │
│  │   Opening   │  ← Main category (clickable to expand)         │
│  │    ━━━━     │                                                │
│  │  4 items    │                                                │
│  └─────────────┘                                                │
│                                                                  │
│  🔵 CATEGORY NODE (Medium Circle)                               │
│  ┌──────────┐                                                   │
│  │Questions │  ← Sub-category with content                      │
│  │   12     │                                                   │
│  └──────────┘                                                   │
│                                                                  │
│  🟢 CONTENT NODE (Small Card)                                   │
│  ┌─────────────────────────────────────┐                        │
│  │ "What challenges are you facing?"   │  ← Actual script/tip   │
│  │ 📝 Discovery Question               │                        │
│  │ ✨ Click for AI coaching            │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
│  🟠 OBJECTION NODE (Warning Style)                              │
│  ┌─────────────────────────────────────┐                        │
│  │ ⚠️ "I need to think about it"       │                        │
│  │ 🛡️ Handle | 🚫 Prevent | 📖 Story   │  ← Action buttons      │
│  └─────────────────────────────────────┘                        │
│                                                                  │
│  📖 STORY NODE (Card with Preview)                              │
│  ┌─────────────────────────────────────┐                        │
│  │ 📖 "David's 3-Month Wait Story"     │                        │
│  │ For: Need to Think | Energy Savings │                        │
│  │ 🔊 Listen | 📋 Copy | ✨ Improve    │                        │
│  └─────────────────────────────────────┘                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📊 Complete Sales Process Structure

### The Mind Map Categories (from your methodology)

```
SALES MIND MAP
│
├── 🟣 OPENING (Center)
│   ├── Ice Breakers
│   │   ├── "Thanks for meeting with me today..."
│   │   ├── "Beautiful home! How long have you lived here?"
│   │   └── [Custom ice breakers]
│   ├── Pre-frame Questions
│   │   ├── "Who else will be involved in this decision?"
│   │   ├── "What made you interested in learning about...?"
│   │   └── [Custom questions]
│   └── Setting Expectations
│       ├── "At the end of our meeting, you'll know if this is right for you"
│       └── [Custom pre-frames]
│
├── 🔵 DISCOVERY (Ring 1)
│   ├── Situational Questions
│   │   ├── "How long have you lived in this home?"
│   │   ├── "What's your current monthly electric bill?"
│   │   └── [Product-specific questions]
│   ├── Problem Questions
│   │   ├── "What challenges are you facing with...?"
│   │   ├── "What's the biggest frustration with...?"
│   │   └── [Pain point questions]
│   ├── Implication Questions
│   │   ├── "How does that affect your daily life?"
│   │   ├── "What happens if this continues?"
│   │   └── [Amplify pain questions]
│   ├── Need-Payoff Questions
│   │   ├── "If we could solve this, what would that mean for you?"
│   │   ├── "What would you do with the extra money?"
│   │   └── [Vision questions]
│   └── Budget/Timeline Questions
│       ├── "What's your timeline for this project?"
│       ├── "Have you set aside a budget for this?"
│       └── [Qualification questions]
│
├── 🟢 SOLUTION/VALUE (Ring 2)
│   ├── Benefits by Product
│   │   ├── Cool Life Paint
│   │   │   ├── Heat reflection (up to 40°F cooler)
│   │   │   ├── Energy savings (30-50% on AC)
│   │   │   ├── Lifetime warranty
│   │   │   └── Military-grade technology
│   │   ├── Turf
│   │   │   ├── No watering, no mowing
│   │   │   ├── Always green year-round
│   │   │   └── 15-year warranty
│   │   ├── Pavers
│   │   ├── Concrete
│   │   └── Fencing
│   ├── Stories 📖
│   │   ├── Customer Success Stories
│   │   │   ├── "The Johnson Family Story" (energy savings)
│   │   │   ├── "Maria's Skeptic Story" (trust building)
│   │   │   └── [User's custom stories]
│   │   ├── Objection Prevention Stories
│   │   │   ├── "David's 3-Month Wait" (for "need to think")
│   │   │   ├── "The Cheap Contractor Story" (for "too expensive")
│   │   │   └── [More prevention stories]
│   │   └── Military Tank Story (Cool Life Paint proof)
│   ├── Social Proof
│   │   ├── Thermal imaging demos
│   │   ├── Neighbor testimonials
│   │   └── Before/after photos
│   └── Program Benefits (3 Benefits)
│       ├── Incentives - Special discounts
│       ├── NMOOP Financing - Pay after completion
│       └── Made in USA - Quality guarantee
│
├── 🟠 OBJECTIONS (Ring 3)
│   ├── "צריך לחשוב" / Need to Think
│   │   ├── 🛡️ Handle Response (LAIR method)
│   │   ├── 🚫 Prevention Script
│   │   ├── 📖 Prevention Story
│   │   └── ✨ Generate AI Response
│   ├── "יקר לי" / Too Expensive
│   │   ├── 🛡️ Handle Response (Feel-Felt-Found)
│   │   ├── 🚫 Prevention Script
│   │   ├── 📖 Prevention Story
│   │   └── ✨ Generate AI Response
│   ├── "צריך לדבר עם בן/בת זוג" / Spouse Decision
│   │   ├── 🛡️ Handle Response
│   │   ├── 🚫 Prevention Script (ask early!)
│   │   ├── 📖 Prevention Story
│   │   └── ✨ Generate AI Response
│   ├── "בודק הצעות" / Getting Quotes
│   │   ├── 🛡️ Handle Response
│   │   ├── 🚫 Prevention Script
│   │   └── 📖 Prevention Story
│   ├── "לא עכשיו" / Bad Timing
│   │   ├── 🛡️ Handle Response
│   │   ├── 🚫 Prevention Script
│   │   └── 📖 Prevention Story
│   └── [Custom Objections]
│
└── 🟡 CLOSING (Ring 4)
    ├── Trial Closes
    │   ├── "Does this make sense so far?"
    │   ├── "On a scale of 1-10, how does this fit your needs?"
    │   └── "If we can make this work budget-wise, are you ready to move forward today?"
    ├── Closing Techniques
    │   ├── Assumptive Close - "Let's get the paperwork started..."
    │   ├── Alternative Close - "Would you prefer option A or B?"
    │   ├── Summary Close - "To recap everything we discussed..."
    │   ├── Urgency Close - "This pricing is available until..."
    │   └── [Custom closes]
    └── Follow-up Closes (after objection handling)
        ├── "Other than that, is there anything else preventing you from moving forward?"
        └── "Based on what we discussed, does this feel like the right direction?"
```

---

## 🖥️ UI/UX Design

### Main Interface Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌──────┐  Sales Mind Map                         [EN/עב] [+ New] [💾 Save] │
│  │ Menu │                                                                   │
│  └──────┘                                                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                                                                       │  │
│  │                    🔍 Zoom    🔄 Reset    📍 Fit View                 │  │
│  │                                                                       │  │
│  │                                                                       │  │
│  │                         ┌─────────────┐                               │  │
│  │                        ╱ 🟡 CLOSING    ╲                              │  │
│  │                       ╱   ┌─────────┐   ╲                             │  │
│  │                      ╱   │🟠OBJECT │    ╲                            │  │
│  │                     ╱    │  IONS   │     ╲                           │  │
│  │                    ╱     └─────────┘      ╲                          │  │
│  │              ╔════════════════════════════════╗                      │  │
│  │              ║     🟢 SOLUTION / VALUE        ║                      │  │
│  │              ║  ┌────────────────────────┐    ║                      │  │
│  │              ║  │   🔵 DISCOVERY         │    ║                      │  │
│  │              ║  │  ┌────────────────┐    │    ║                      │  │
│  │              ║  │  │   🟣 OPENING   │    │    ║                      │  │
│  │              ║  │  │    (Center)    │    │    ║                      │  │
│  │              ║  │  └────────────────┘    │    ║                      │  │
│  │              ║  └────────────────────────┘    ║                      │  │
│  │              ╚════════════════════════════════╝                      │  │
│  │                                                                       │  │
│  │                                                                       │  │
│  │  ┌─────────────────┐                                                 │  │
│  │  │ 🗺️ MiniMap      │                                                 │  │
│  │  │ ┌─────────────┐ │                                                 │  │
│  │  │ │   ●  ●  ●   │ │                                                 │  │
│  │  │ └─────────────┘ │                                                 │  │
│  │  └─────────────────┘                                                 │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Click Node → Detail Panel (Slide from Right)

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                                             ┌─────────────────────────┤
│                                                             │  📋 Node Detail Panel   │
│                                                             │  ─────────────────────  │
│                                                             │                         │
│                                                             │  🟠 OBJECTION           │
│         [Mind Map Canvas]                                   │  "I need to think"      │
│                                                             │                         │
│                                                             │  ━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │                         │
│                                                             │  🛡️ HANDLE              │
│                                                             │  "I understand. Most    │
│                                                             │  people want to think   │
│                                                             │  carefully. What        │
│                                                             │  specifically would you │
│                                                             │  be weighing?"          │
│                                                             │                         │
│                                                             │  [🔊 Listen] [📋 Copy]  │
│                                                             │                         │
│                                                             │  ━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │                         │
│                                                             │  🚫 PREVENT (Pre-frame) │
│                                                             │  "At the end of our     │
│                                                             │  meeting, you'll know   │
│                                                             │  clearly if this is     │
│                                                             │  right for you..."      │
│                                                             │                         │
│                                                             │  ━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │                         │
│                                                             │  📖 STORY               │
│                                                             │  "David's 3-Month Wait" │
│                                                             │  [▶️ Play Full Story]   │
│                                                             │                         │
│                                                             │  ━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │                         │
│                                                             │  ✨ ASK AI              │
│                                                             │  ┌─────────────────────┐│
│                                                             │  │ Type your question  ││
│                                                             │  │ about this objection││
│                                                             │  └─────────────────────┘│
│                                                             │  [Generate Response]    │
│                                                             │                         │
│                                                             │  ━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │                         │
│                                                             │  ✏️ ADD TO MY SCRIPT    │
│                                                             │  [Save to My Scripts]   │
│                                                             │                         │
└─────────────────────────────────────────────────────────────┴─────────────────────────┘
```

### AI Response Modal

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ✨ AI Response Generator                                           [✕]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Context: Handling "Need to Think" Objection                                │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Your Question:                                                        │  │
│  │ "Give me 3 different ways to handle this objection for Cool Life      │  │
│  │  Paint customer who is worried about the investment"                  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  🤖 AI Response:                                                      │  │
│  │                                                                       │  │
│  │  **Option 1 - Feel-Felt-Found:**                                      │  │
│  │  "I totally understand. Most of my customers felt the same way.       │  │
│  │  What they found was..."                                              │  │
│  │                                                                       │  │
│  │  **Option 2 - Isolate:**                                              │  │
│  │  "Other than wanting to think about it, is there anything else        │  │
│  │  holding you back?"                                                   │  │
│  │                                                                       │  │
│  │  **Option 3 - Reframe:**                                              │  │
│  │  "What specifically would you be thinking about? The product,         │  │
│  │  the price, or the timing?"                                           │  │
│  │                                                                       │  │
│  │  [🔊 Listen to All]                                                   │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                 │
│  │ 📋 Copy All    │  │ 💾 Save Script │  │ 🔄 Regenerate  │                 │
│  └────────────────┘  └────────────────┘  └────────────────┘                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ My Scripts Feature

### User can save customized scripts from AI or manual input

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📂 My Scripts                                        [+ New Script]        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🔍 Search scripts...                    [Filter: All ▼] [Sort: Recent ▼]  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 📄 My Opening Script                                    ⭐ Favorite    │  │
│  │ Category: Opening | Product: All                                      │  │
│  │ "Hi, thanks for taking the time to meet today. Before we start..."    │  │
│  │ [▶️ Play] [✏️ Edit] [🗑️ Delete]                  Used: 15 times      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 📄 Price Objection Handler                                            │  │
│  │ Category: Objection | Product: Cool Life                              │  │
│  │ "I hear you. Let me ask - when you think about cost, is it about..."  │  │
│  │ [▶️ Play] [✏️ Edit] [🗑️ Delete]                  Used: 8 times       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ 📄 Energy Savings Discovery Questions                                 │  │
│  │ Category: Discovery | Product: Cool Life                              │  │
│  │ "1. How much is your summer electric bill? 2. How long has it..."     │  │
│  │ [▶️ Play] [✏️ Edit] [🗑️ Delete]                  Used: 12 times      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗃️ Database Schema

### New Tables

```sql
-- Mind Map Categories (pre-populated template)
CREATE TABLE mind_map_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,           -- "Opening", "Discovery", etc.
    name_he TEXT,                 -- Hebrew name
    ring_level INTEGER NOT NULL,  -- 0 = center, 1-4 = rings
    color TEXT NOT NULL,          -- Hex color code
    icon TEXT,                    -- Lucide icon name
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mind Map Nodes (content within categories)
CREATE TABLE mind_map_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES mind_map_categories(id),
    parent_node_id UUID REFERENCES mind_map_nodes(id),
    
    node_type TEXT NOT NULL,      -- 'question', 'script', 'story', 'objection', 'tip'
    title TEXT NOT NULL,
    title_he TEXT,
    content TEXT NOT NULL,
    content_he TEXT,
    
    -- For objections
    objection_type TEXT,          -- 'need_to_think', 'too_expensive', etc.
    handle_script TEXT,
    prevent_script TEXT,
    related_story_id UUID,
    
    -- For products
    product_type TEXT,            -- 'cool_life', 'turf', etc. or NULL for all
    
    -- Metadata
    is_template BOOLEAN DEFAULT true,  -- System-provided or user-created
    order_index INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's Custom Scripts
CREATE TABLE user_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    
    category TEXT,                -- 'opening', 'discovery', 'objection', 'closing'
    product_type TEXT,            -- Specific product or 'all'
    objection_type TEXT,          -- If related to objection
    
    source_node_id UUID REFERENCES mind_map_nodes(id),  -- If derived from template
    
    is_favorite BOOLEAN DEFAULT FALSE,
    use_count INTEGER DEFAULT 0,
    
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's AI Chat History for Mind Map Nodes
CREATE TABLE mind_map_ai_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id UUID REFERENCES mind_map_nodes(id),
    
    messages JSONB NOT NULL DEFAULT '[]',  -- [{role, content, timestamp}]
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_mind_map_nodes_category ON mind_map_nodes(category_id);
CREATE INDEX idx_mind_map_nodes_type ON mind_map_nodes(node_type);
CREATE INDEX idx_user_scripts_user ON user_scripts(user_id);
CREATE INDEX idx_user_scripts_category ON user_scripts(category);
```

### Pre-populated Categories

```sql
INSERT INTO mind_map_categories (name, name_he, ring_level, color, icon, order_index) VALUES
('Opening', 'פתיחה', 0, '#8b5cf6', 'HandWaving', 0),
('Discovery', 'גילוי צרכים', 1, '#3b82f6', 'Search', 1),
('Solution', 'פתרון/ערך', 2, '#10b981', 'Sparkles', 2),
('Objections', 'התנגדויות', 3, '#f59e0b', 'AlertTriangle', 3),
('Closing', 'סגירה', 4, '#eab308', 'Trophy', 4);
```

---

## 🔧 Technical Implementation

### React Flow Radial Layout Algorithm

```javascript
// utils/radialLayout.js

export const calculateRadialLayout = (categories, centerX = 500, centerY = 500) => {
  const nodes = [];
  const edges = [];
  
  // Ring configuration
  const ringRadii = {
    0: 0,      // Center
    1: 150,    // Discovery
    2: 280,    // Solution
    3: 410,    // Objections
    4: 540,    // Closing
  };
  
  // Process each category
  categories.forEach((category) => {
    const ring = category.ring_level;
    const radius = ringRadii[ring];
    
    if (ring === 0) {
      // Center node
      nodes.push({
        id: `category-${category.id}`,
        type: 'categoryNode',
        position: { x: centerX, y: centerY },
        data: { ...category, isCenter: true }
      });
    } else {
      // Calculate angle based on category index within ring
      const categoriesInRing = categories.filter(c => c.ring_level === ring);
      const angleStep = (2 * Math.PI) / categoriesInRing.length;
      const categoryIndex = categoriesInRing.findIndex(c => c.id === category.id);
      const angle = angleStep * categoryIndex - Math.PI / 2; // Start from top
      
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      nodes.push({
        id: `category-${category.id}`,
        type: 'categoryNode',
        position: { x, y },
        data: category
      });
      
      // Create edge to center or previous ring
      edges.push({
        id: `edge-${category.id}`,
        source: ring === 1 ? 'category-opening' : `ring-${ring - 1}`,
        target: `category-${category.id}`,
        type: 'smoothstep',
        animated: false,
        style: { stroke: category.color }
      });
    }
  });
  
  return { nodes, edges };
};
```

### Component Structure

```
frontend/src/
├── pages/
│   └── SalesMindMapPage.jsx          # Main page (replaces SalesFlowPage)
│
├── components/
│   └── mind-map/
│       ├── MindMapCanvas.jsx         # React Flow canvas with radial layout
│       ├── nodes/
│       │   ├── CategoryNode.jsx      # Large ring category node
│       │   ├── ContentNode.jsx       # Small content node
│       │   ├── ObjectionNode.jsx     # Objection with actions
│       │   └── StoryNode.jsx         # Story with play button
│       ├── panels/
│       │   ├── NodeDetailPanel.jsx   # Slide-out detail view
│       │   ├── AIResponsePanel.jsx   # AI chat interface
│       │   └── MyScriptsPanel.jsx    # User's saved scripts
│       ├── controls/
│       │   ├── ZoomControls.jsx      # Zoom/pan/fit
│       │   ├── FilterControls.jsx    # Filter by product/type
│       │   └── LanguageToggle.jsx    # EN/HE switch
│       └── utils/
│           ├── radialLayout.js       # Radial positioning algorithm
│           ├── defaultNodes.js       # Pre-populated content
│           └── colors.js             # Color scheme
```

---

## 🚀 Backend Endpoints

```python
# Mind Map Endpoints

# GET /api/mind-map
# Returns full mind map structure (categories + nodes)

# GET /api/mind-map/category/<category_id>
# Get nodes for specific category

# POST /api/mind-map/ai-generate
# Generate AI response for node context
# Body: { node_id, question, product_type }

# GET /api/user-scripts
# List user's saved scripts

# POST /api/user-scripts
# Save new script

# PUT /api/user-scripts/<id>
# Update script

# DELETE /api/user-scripts/<id>
# Delete script

# POST /api/user-scripts/<id>/use
# Increment usage counter
```

---

## 🎯 Key Features Summary

| Feature | Description |
|---------|-------------|
| **Radial Layout** | Visual mind map from center outward |
| **Click to Expand** | Click category → expand to see content nodes |
| **AI Generation** | Click any node → ask AI for better response |
| **My Scripts** | Save customized scripts with categories |
| **TTS Playback** | Listen to any script with OpenAI TTS |
| **Filter by Product** | Show only relevant content for Cool Life/Turf/etc. |
| **Bilingual** | Full Hebrew/English support |
| **Objection Arsenal** | Handle + Prevent + Story for every objection |
| **Progress Tracking** | Track which scripts user has practiced |

---

## ✅ Implementation Phases

### Phase 1: Foundation (3-4 hours)
- [ ] Create database schema
- [ ] Pre-populate categories and default nodes
- [ ] Set up new page route

### Phase 2: Radial Canvas (4-5 hours)
- [ ] Implement radial layout algorithm
- [ ] Create custom node components
- [ ] Add zoom/pan/minimap controls

### Phase 3: Detail Panel (3-4 hours)
- [ ] Node detail panel (slide-out)
- [ ] TTS playback integration
- [ ] Copy to clipboard functionality

### Phase 4: AI Integration (3-4 hours)
- [ ] AI response generation endpoint
- [ ] AI chat panel for nodes
- [ ] Save AI response to scripts

### Phase 5: My Scripts (2-3 hours)
- [ ] Scripts CRUD endpoints
- [ ] My Scripts panel UI
- [ ] Filter and search functionality

### Phase 6: Polish (2-3 hours)
- [ ] Hebrew translations
- [ ] Mobile responsiveness
- [ ] Animations and transitions

**Total Estimated: 17-23 hours**

---

## 🎨 Color Scheme

| Element | Color | Hex |
|---------|-------|-----|
| Opening (Center) | Purple | `#8b5cf6` |
| Discovery (Ring 1) | Blue | `#3b82f6` |
| Solution (Ring 2) | Green | `#10b981` |
| Objections (Ring 3) | Orange | `#f59e0b` |
| Closing (Ring 4) | Gold | `#eab308` |
| Background | Dark Gray | `#111827` |
| Card Background | Gray | `#1f2937` |
| Text Primary | White | `#ffffff` |
| Text Secondary | Gray | `#9ca3af` |

---

## 📝 Awaiting Your Approval

**Before I start implementing, please confirm:**

1. ✅ Does the radial mind map layout make sense?
2. ✅ Is the category structure (Opening → Discovery → Solution → Objections → Closing) correct?
3. ✅ Do you want the "My Scripts" feature to save customized content?
4. ✅ Should I keep the existing conversation tree or replace it completely?
5. ✅ Any other features or content you want to add?

---

*Once you approve, I'll begin implementation starting with the database schema and radial layout.*
