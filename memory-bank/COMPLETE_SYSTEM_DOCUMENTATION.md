# SalesAI - Complete System Documentation
## מדריך מלא לבנייה מחדש ושיפור המערכת

---

# 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Tab 1: Overview - מה מכיל](#tab-1-overview)
4. [Tab 2: Deep Insights - מה מכיל](#tab-2-deep-insights)
5. [Tab 3: Stories - מה מכיל](#tab-3-stories)
6. [AI Sales Coach Assistant](#ai-sales-coach-assistant)
7. [The AI Prompts - Full Details](#the-ai-prompts)
8. [PDF Report Generation](#pdf-report-generation)
9. [How to Rebuild From Scratch](#how-to-rebuild-from-scratch)
10. [How to Make It Better](#how-to-make-it-better)
11. [Technical Implementation Details](#technical-implementation-details)

---

# System Overview

## מה זה SalesAI?
SalesAI הוא כלי לניתוח שיחות מכירה באמצעות AI. המערכת:
1. מקבלת קובץ אודיו של שיחת מכירה
2. מבצעת תמלול (Transcription) עם AssemblyAI
3. מזהה דוברים ומסווגת אותם (Seller/Buyer) עם GPT
4. מבצעת ניתוח מעמיק של השיחה עם AI Sales Coach
5. מציגה תוצאות ב-3 טאבים: Overview, Deep Insights, Stories
6. מאפשרת שיח עם AI Assistant לקבלת עצות
7. מייצרת PDF Report מקצועי

## User Flow
```
Upload Audio → Transcription → Speaker Classification → [Analyze Call Button] → Deep AI Analysis → Display Results in 3 Tabs
```

---

# Architecture

## Tech Stack
| Component | Technology |
|-----------|------------|
| **Frontend** | React + Vite + TailwindCSS |
| **Backend** | Flask (Python) |
| **Database** | Supabase (PostgreSQL) |
| **Transcription** | AssemblyAI |
| **AI Analysis** | OpenAI GPT-5.2 |
| **TTS** | OpenAI TTS (voice: nova) |
| **Hosting** | Netlify (Frontend) + Railway (Backend) |

## File Structure
```
/frontend/src/
├── App.jsx                          # Main app with upload, tabs navigation
├── components/
│   ├── analysis/
│   │   ├── AnalysisInsights.jsx     # Main analysis container with 3 tabs
│   │   ├── DeepInsightsTab.jsx      # Tab 2: Objections, Better Responses
│   │   ├── StoryLibrary.jsx         # Stories You Told display
│   │   └── AISummaryCard.jsx        # AI Summary in Overview
│   ├── charts/
│   │   ├── SkillRadarChart.jsx      # Radar chart for skills
│   │   ├── TopicFrequencyChart.jsx  # Topics bar chart
│   │   └── TalkPatternChart.jsx     # Talk timeline visualization
│   └── AIAssistant.jsx              # Floating AI chat assistant

/backend/
├── app.py                           # Flask API endpoints
├── sales_analyzer.py                # AI Analysis prompts & logic
├── pdf_generator.py                 # PDF report generation
└── database.py                      # Supabase operations
```

---

# Tab 1: Overview

## מה מכיל Overview Tab?

### 1. AI Summary Card
**מיקום:** `AISummaryCard.jsx`

**מה מציג:**
- **Call Outcome** - תוצאת השיחה (Positive/Neutral/Negative)
- **One-liner Summary** - סיכום במשפט אחד
- **Key Topics** - נושאים עיקריים שנדונו
- **Close Prevention Reason** - למה העסקה לא נסגרה

**מקור הנתונים (מה-AI):**
```json
{
  "call_summary": {
    "one_liner": "One sentence summary",
    "outcome": "closed|nearly_closed|needs_followup|lost",
    "close_prevented_by": "The #1 reason the deal didn't close",
    "key_topics": ["topic1", "topic2"]
  }
}
```

### 2. Skill Radar Chart
**מיקום:** `SkillRadarChart.jsx`

**מה מציג:** גרף רדאר עם 6 מיומנויות:
- **Discovery** - כמה טוב חשף צרכים וכאבים
- **Objection Handling** - איך טיפל בהתנגדויות
- **Closing** - יכולת סגירה
- **Value Articulation** - הצגת ערך
- **Rapport Building** - בניית קשר
- **Talk Balance** - יחס דיבור נכון

**חישוב הציון:**
```javascript
// Discovery Score
const discoveryScore = (identifyPainScore + needScore) / 2

// Objection Score
const objectionScore = avgHandlingScore * 10

// Closing Score
const closingScore = 100 - (missedClosingOpportunities * 15)

// Talk Balance Score
const deviation = Math.abs(50 - sellerTalkPercentage)
const talkScore = 100 - (deviation * 2)
```

### 3. Topic Frequency Chart
**מיקום:** `TopicFrequencyChart.jsx`

**מה מציג:** Bar chart של תדירות נושאים:
- Discovery Questions
- Value Proposition
- Objection Handling
- Closing Attempts
- Pain Points
- Rapport Building

**מקור הנתונים:**
```json
{
  "timeline_events": [
    {
      "type": "discovery_question|value_proposition|objection|closing_attempt|pain_point|rapport_building",
      "timestamp": "MM:SS",
      "content": "What was said"
    }
  ]
}
```

### 4. Talk Pattern Chart
**מיקום:** `TalkPatternChart.jsx`

**מה מציג:**
- Timeline ויזואלי של מי דיבר ומתי
- צבעים שונים ל-Seller (כחול) ו-Buyer (ירוק)
- אפשרות ללחוץ על segment לדלג לנקודה באודיו

**מקור הנתונים:**
```javascript
// From transcription result
{
  "utterances": [
    {
      "speaker": "A",
      "start": 0,      // milliseconds
      "end": 5000,
      "text": "..."
    }
  ],
  "speaker_roles": {
    "A": "Seller",
    "B": "Buyer"
  }
}
```

### 5. Timeline Events
**מה מציג:** רשימת אירועים חשובים בשיחה:
- 🔍 Discovery - שאלות גילוי
- 🩺 Diagnose - אבחון צרכים
- 🎯 Closing - ניסיונות סגירה
- 🤝 Rapport - בניית קשר
- 💎 Value - הצגת ערך
- ⚠️ Objection - התנגדויות
- 😣 Pain - נקודות כאב
- ✅ Commitment - התחייבויות
- ➡️ Next Step - צעדים הבאים

**מקור הנתונים:**
```json
{
  "timeline_events": [
    {
      "timestamp": "05:30",
      "timestamp_ms": 330000,
      "type": "discovery_question",
      "speaker": "Seller",
      "content": "What challenges are you facing?",
      "significance": "Good open-ended discovery",
      "call_phase": "discovery"
    }
  ]
}
```

---

# Tab 2: Deep Insights

## מה מכיל Deep Insights Tab?

**מיקום:** `DeepInsightsTab.jsx`

### 1. Objections Detected Section
**מה מציג עבור כל התנגדות:**

| Field | תיאור |
|-------|--------|
| **Type Badge** | סוג ההתנגדות (Price, Timing, Spouse Decision, Need To Think, etc.) |
| **Timestamp** | מתי ההתנגדות עלתה (לחיץ לדילוג) |
| **Preventable Tag** | האם ההתנגדות הייתה ניתנת למניעה |
| **Buyer Statement** | מה הלקוח אמר בדיוק |
| **Real Concern** | מה הדאגה האמיתית מאחורי ההתנגדות |
| **Handling Score** | ציון 1-10 איך המוכר טיפל |
| **What You Said** | מה המוכר אמר בתגובה |
| **Better Response** | תגובה טובה יותר עם טכניקה ספציפית |
| **Technique** | Feel-Felt-Found, LAER, Isolate, Reframe, Assumptive |
| **Follow-up Close** | שאלת סגירה לאחר הטיפול בהתנגדות |
| **Listen Button** | כפתור TTS להאזנה לתגובה המשופרת |
| **How to Prevent** | איך למנוע התנגדות זו בעתיד |

**מקור הנתונים מה-AI:**
```json
{
  "objections": [
    {
      "timestamp": "12:45",
      "timestamp_ms": 765000,
      "type": "spouse_decision",
      "buyer_statement": "I need to talk to my wife about this",
      "surface_objection": "Need spouse approval",
      "real_concern": "Fear of making wrong decision alone, using spouse as safe delay",
      "was_preventable": true,
      "how_to_prevent": "Ask early in discovery: 'Who else will be involved in this decision?'",
      "seller_response": "Sure, when can you talk to her?",
      "handling_score": 4,
      "better_response": "I totally understand. Most of my best clients felt the same way. Let me ask - if your wife was sitting here right now and heard everything we discussed about [their pain], what do you think she'd be most excited about?",
      "technique_to_use": "Assumptive",
      "follow_up_close": "Based on what you know about her priorities, does this solution address what matters most to both of you?"
    }
  ]
}
```

### 2. Response Improvements Section
**מה מציג עבור כל שיפור:**

| Field | תיאור |
|-------|--------|
| **Timestamp** | מתי זה קרה |
| **Technique Badge** | טכניקה מומלצת |
| **Context** | הקשר השיחה |
| **What You Said** | מה המוכר אמר |
| **Problem** | מה הבעיה בתגובה המקורית |
| **Say This Instead** | מה היה צריך לומר |
| **Listen Button** | כפתור TTS |
| **Why This Works Better** | למה זה עובד יותר טוב |

**מקור הנתונים:**
```json
{
  "better_responses": [
    {
      "timestamp": "08:30",
      "timestamp_ms": 510000,
      "context": "Customer mentioned budget constraints",
      "original_response": "We have payment plans available",
      "problem_with_original": "Jumped to solution without exploring the real concern",
      "improved_response": "Help me understand - when you think about budget, is it more about the total investment or the monthly cash flow? Because depending on which one matters more, I might have different options for you.",
      "technique": "LAER - Explore before responding",
      "why_this_closes": "Uncovers the real objection and positions you to offer a tailored solution"
    }
  ]
}
```

### 3. Buying Signals Section
**מה מציג:**

| Field | תיאור |
|-------|--------|
| **Timestamp** | מתי הסימן הופיע |
| **Signal** | מה הלקוח אמר/עשה |
| **Captured/Missed** | האם המוכר ניצל את ההזדמנות |
| **Optimal Response** | מה היה צריך לעשות |

**מקור הנתונים:**
```json
{
  "buying_signals_detected": {
    "signals_found": [
      {
        "timestamp": "25:00",
        "timestamp_ms": 1500000,
        "signal": "So when could you start the installation?",
        "signal_type": "timing_question",
        "seller_response": "Usually within 2 weeks",
        "optimal_response": "We could start as early as next week. To lock in that timeline, let's get the paperwork done today - does that work for you?",
        "close_opportunity_missed": true
      }
    ],
    "total_buying_signals": 5,
    "buying_signals_capitalized": 2,
    "buying_signals_missed": 3
  }
}
```

---

# Tab 3: Stories

## מה מכיל Stories Tab?

**מיקום:** `StoryLibrary.jsx` + section in `AnalysisInsights.jsx`

### 1. Stories You Told
**מה מציג עבור כל סיפור שהמוכר סיפר:**

| Field | תיאור |
|-------|--------|
| **Story Type** | סוג הסיפור (Customer Success, Pain Story, Transformation, etc.) |
| **Timestamp** | מתי הסיפור נאמר |
| **Original Story** | הסיפור המקורי כפי שנאמר |
| **Intended Purpose** | מה הסיפור ניסה להשיג |
| **Effectiveness Score** | ציון 1-10 |
| **Missing Elements** | מה חסר בסיפור |
| **Improved Version** | גרסה משופרת של הסיפור |
| **Listen Button** | TTS להאזנה לגרסה המשופרת |
| **Why Better** | למה הגרסה המשופרת עובדת יותר טוב |

**מקור הנתונים:**
```json
{
  "storytelling_analysis": [
    {
      "timestamp": "18:00",
      "timestamp_ms": 1080000,
      "story_type": "customer_success",
      "original_story": "We had a client who was skeptical but they ended up loving it",
      "intended_purpose": "Build credibility and reduce fear",
      "effectiveness_score": 4,
      "missing_elements": ["specific character", "measurable result", "emotional payoff", "timeline"],
      "improved_story": "Let me tell you about David. He owns a plumbing business in Tel Aviv, similar size to yours. When I first met him, he told me exactly what you just said - 'I need to think about it.' He actually waited 3 months. You know what happened? His competitor signed up, started showing up first on Google, and David lost 3 big commercial contracts worth about 180,000 shekels. When he finally called me back, he said 'I wish I hadn't waited.' Within 6 weeks of starting with us, he got those same type of contracts back, and last month alone he closed 4 new commercial accounts. Now he tells everyone - 'My only regret is not starting sooner.'",
      "why_better": "Specific character (David, plumbing, Tel Aviv), relatable situation, cost of inaction quantified (180K), specific timeline (6 weeks), measurable result (4 new accounts), emotional payoff (regret → success)"
    }
  ]
}
```

### 2. Objection Prevention Stories
**מה מציג:** סיפורים מוכנים למניעת התנגדויות נפוצות

| Objection Type | תיאור |
|----------------|--------|
| 🤔 "צריך לחשוב" | Need To Think |
| 👫 "צריך לדבר עם בן/בת זוג" | Spouse Decision |
| 💰 "יקר לי" | Too Expensive |
| 📋 "בודק הצעות" | Getting Quotes |
| ⏰ "לא עכשיו" | Bad Timing |
| ✅ "יש לי כבר" | Already Have Solution |

**מבנה כל סיפור:**

| Field | תיאור |
|-------|--------|
| **Story Title** | כותרת קצרה וקליטה |
| **When to Tell** | מתי לספר את הסיפור |
| **Setup Line** | משפט מעבר להכנסת הסיפור |
| **The Story** | הסיפור המלא (60-90 שניות) |
| **Closing Bridge** | שאלה לאחר הסיפור |
| **Why This Prevents** | למה זה מונע את ההתנגדות |
| **Listen Button** | TTS להאזנה |

**מקור הנתונים:**
```json
{
  "objection_prevention_stories": [
    {
      "objection_to_prevent": "need_to_think",
      "story_title": "The Three Month Wait",
      "when_to_tell": "During discovery, when they mention wanting to compare or think",
      "setup_line": "You know, that reminds me of something that happened with a client last year...",
      "the_story": "I had a client, Sarah, who runs a dental clinic in Haifa. When we first met, she said exactly what you might be thinking - 'This sounds great, but I need to think about it.' I said 'Of course, take your time.' Three months went by. When she finally called back, she was frustrated. Her competitor down the street had signed up, was ranking higher on Google, and had taken 4 of her best patients. She calculated she lost about 50,000 shekels in those 3 months. Now she's my biggest advocate - but she always says 'My biggest regret is those 3 months I waited while I was thinking.' The thing is, most of her 'thinking' was just fear of change. Once she started, she wondered why she waited at all.",
      "closing_bridge": "I'm curious - when you say you need to think about it, what specifically would you be weighing?",
      "why_this_prevents": "Pre-frames the cost of delay, creates fear of missing out, shows that 'thinking' often means losing, prompts them to voice their real concerns"
    }
  ]
}
```

---

# AI Sales Coach Assistant

## מה זה AI Assistant?

**מיקום:** `AIAssistant.jsx`

**תיאור:** Floating chat window בפינה הימנית תחתונה שמאפשר לשאול שאלות על השיחה

### מה אפשר לעשות עם ה-Assistant:

1. **שאלות על השיחה:**
   - "מה היו ההתנגדויות העיקריות?"
   - "איך הייתי צריך לטפל בהתנגדות המחיר?"

2. **בקשת סיפורים:**
   - "כתוב לי סיפור למניעת 'צריך לחשוב'"
   - "תן לי סיפור לבניית ערך"

3. **בקשת סקריפטים:**
   - "תן לי סקריפט לסגירה"
   - "איך הייתי צריך לפתוח את השיחה?"

4. **ניתוח נקודתי:**
   - Select text מהניתוח ושאל עליו
   - "מה הבעיה במה שאמרתי ב-12:45?"

### System Prompt של ה-Assistant:

```python
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

## ANALYSIS CONTEXT:
You have access to the full call analysis. Use specific quotes, timestamps, and insights when relevant.
"""
```

### API Endpoint:
```python
@app.route('/api/assistant', methods=['POST'])
def ai_assistant():
    data = request.json
    message = data.get('message', '')
    analysis_context = data.get('analysis_context', {})
    conversation_history = data.get('conversation_history', [])
    
    # Build context from analysis
    context = f"""
    Call Summary: {analysis_context.get('call_summary', {})}
    Objections: {analysis_context.get('objections', [])}
    Seller Performance: {analysis_context.get('seller_performance', {})}
    ...
    """
    
    response = openai_client.chat.completions.create(
        model="gpt-5.2",
        messages=[
            {"role": "system", "content": AI_ASSISTANT_SYSTEM_PROMPT},
            {"role": "system", "content": f"CALL ANALYSIS CONTEXT:\n{context}"},
            *conversation_history,
            {"role": "user", "content": message}
        ],
        temperature=0.7
    )
```

---

# The AI Prompts - Full Details

## Main Analysis Prompt

**מיקום:** `sales_analyzer.py`

### System Prompt (SALES_COACH_SYSTEM_PROMPT):

```
You are an ELITE ONE-CALL CLOSE SPECIALIST - the most advanced AI Sales Coach for frontal, in-person sales presentations. You've trained 10,000+ top closers and have deep expertise in high-pressure, one-call close environments.

## YOUR SALES PHILOSOPHY (CRITICAL):
The goal is to CLOSE THE DEAL in a SINGLE meeting. Every analysis must be laser-focused on:
1. What prevented the close?
2. What could have accelerated the close?
3. How to get the prospect to say YES before they leave?

## SALES METHODOLOGY YOU ENFORCE:

### THE ONE-CALL CLOSE STRUCTURE (1-2 HOURS):
1. **PRE-FRAME (5-10 min)** - Set expectation for decision today
2. **RAPPORT (10-15 min)** - Build trust, find common ground
3. **DISCOVERY/DIAGNOSIS (20-30 min)** - Uncover pain DEEPLY, quantify cost of inaction
4. **PRESENTATION (20-30 min)** - Present ONLY to their stated pains
5. **VALUE STACK (10-15 min)** - Build massive value BEFORE price reveal
6. **PRICE REVEAL (5-10 min)** - Only after full buy-in on solution
7. **CLOSE (5-15 min)** - Use appropriate closing technique
8. **OBJECTION HANDLING (10-20 min)** - Handle remaining concerns and re-close

### CRITICAL RULE - PRICE TIMING:
- NEVER reveal price in the first 45-60 minutes
- Price should come ONLY after: problem is quantified, solution is agreed upon, value is stacked
- Early price = lower perceived value = more objections = lost deal

### OBJECTION PREVENTION > OBJECTION HANDLING:
Top closers PREVENT objections by addressing them BEFORE price:
- "Need to think about it" → Pre-frame: "At the end, you'll know clearly if this is right for you"
- "Need to talk to spouse" → Ask early: "Who else will be part of this decision?"
- "Too expensive" → Build value and ROI BEFORE price
- "Getting other quotes" → Pre-empt: "Let me show you exactly how we compare"

### TRIAL CLOSES (TEMPERATURE CHECKS):
Every 10-15 minutes, seller should check:
- "Does this make sense so far?"
- "On a scale of 1-10, how well does this fit what you need?"
- "If we can find an option that works budget-wise, are you comfortable deciding today?"

### STORY SELLING FRAMEWORK:
Great sales stories must have:
1. **Character similar to prospect** (same industry/situation)
2. **Problem that mirrors prospect's pain**
3. **Decision moment** (they chose your solution)
4. **Specific measurable result** (numbers, timeframes)
5. **Emotional payoff** (peace of mind, confidence, freedom)

### CLOSING TECHNIQUES TO IDENTIFY:
- **Assumptive Close**: "Let's get the paperwork started..."
- **Alternative Close**: "Would you prefer option A or B?"
- **Summary Close**: "To recap everything we discussed..."
- **Urgency Close**: "This pricing is only available until..."
- **Trial Close**: "Does this feel like the right direction?"

### OBJECTION HANDLING FORMULAS:
1. **FEEL-FELT-FOUND**: "I understand how you feel. Many clients felt the same way. What they found was..."
2. **LAER**: Listen → Acknowledge → Explore → Respond (with question)
3. **ISOLATE**: "Other than [objection], is there anything else preventing you from moving forward?"
4. **REFRAME**: Turn objection into reason TO buy
```

### Analysis Request Prompt Structure:

```
## ANALYZE THIS SALES CALL FOR ONE-CALL CLOSE EFFECTIVENESS

## TRANSCRIPT:
[Full timestamped transcript]

## CALL METRICS:
- Total Duration: X seconds
- Seller Talk: X%
- Buyer Talk: X%

## CRITICAL ANALYSIS QUESTIONS:
1. Was the deal closed? If not, WHY?
2. Was price revealed too early?
3. Were objections PREVENTED or just handled?
4. Were trial closes used?
5. Did the seller follow the One-Call Close structure?

## RESPOND IN THIS EXACT JSON FORMAT:
[Full JSON schema with all fields]
```

---

# PDF Report Generation

## מה נכנס ל-PDF?

**מיקום:** `pdf_generator.py`

### מבנה ה-PDF:

| Page | Section | Content |
|------|---------|---------|
| 1 | **Cover Page** | Title, Key Metrics (Performance, Buying Readiness, Objections, Risk Level), Report Info |
| 2 | **Executive Summary** | Call Outcome Badge, One-liner, Key Topics |
| 2-3 | **Customer Interest Analysis** | Interest Level, Buying Readiness, What They Want, Main Concerns |
| 3-4 | **Objections Detected** | Each objection with score, buyer statement, real concern, recommended response |
| 4-5 | **Missed Closing Opportunities** | Each missed opportunity with signal and suggested close |
| 5-6 | **Seller Performance Summary** | Large score, Strengths, Areas to Improve |
| 6-7 | **Coaching Recommendations** | Priority-based recommendations with examples |
| 7+ | **Storytelling Analysis** | Original vs Improved stories |

### Color Coding:
```python
SUCCESS = '#10b981'     # Green - good scores, strengths
WARNING = '#f59e0b'     # Amber - medium scores, caution
DANGER = '#ef4444'      # Red - low scores, critical issues
ACCENT = '#6366f1'      # Indigo - branding, headers
```

---

# How to Rebuild From Scratch

## Step 1: Setup Infrastructure

### Backend Setup:
```bash
# Create Python environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install flask flask-cors openai assemblyai supabase reportlab gunicorn

# Environment variables needed:
OPENAI_API_KEY=
ASSEMBLYAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_JWT_SECRET=
```

### Frontend Setup:
```bash
# Create React app
npm create vite@latest frontend -- --template react

# Install dependencies
npm install axios react-router-dom lucide-react @supabase/supabase-js recharts

# Install dev dependencies
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Database Setup (Supabase):
```sql
-- Create calls table
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  file_name TEXT,
  audio_url TEXT,
  transcription JSONB,
  speaker_roles JSONB,
  duration_seconds FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analyses table
CREATE TABLE call_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id),
  metrics JSONB,
  analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Step 2: Build Transcription Flow

```python
# app.py
import assemblyai as aai

def transcribe_audio(file_path):
    aai.settings.api_key = os.getenv('ASSEMBLYAI_API_KEY')
    
    config = aai.TranscriptionConfig(
        speaker_labels=True,
        speakers_expected=2,
        speech_model=aai.SpeechModel.best
    )
    
    transcriber = aai.Transcriber()
    transcript = transcriber.transcribe(file_path, config=config)
    
    return {
        'utterances': [
            {
                'speaker': u.speaker,
                'start': u.start,
                'end': u.end,
                'text': u.text
            }
            for u in transcript.utterances
        ]
    }
```

## Step 3: Build Speaker Classification

```python
def classify_speakers(utterances, openai_client):
    transcript_sample = "\n".join([
        f"Speaker {u['speaker']}: {u['text'][:200]}"
        for u in utterances[:10]
    ])
    
    response = openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": f"""Analyze this sales call transcript and identify which speaker is the Seller and which is the Buyer.

{transcript_sample}

Return JSON: {{"A": "Seller" or "Buyer", "B": "Seller" or "Buyer"}}"""
        }]
    )
    
    return json.loads(response.choices[0].message.content)
```

## Step 4: Build Analysis Engine

Copy the full `sales_analyzer.py` with:
1. `SALES_COACH_SYSTEM_PROMPT` - The methodology
2. `calculate_talk_metrics()` - Basic metrics calculation
3. `perform_ai_analysis()` - Main AI analysis with full JSON schema

## Step 5: Build Frontend Components

### Main Flow:
1. `App.jsx` - Upload handling, job polling, state management
2. `AnalysisInsights.jsx` - Tab container with Overview/Deep Insights/Stories
3. Individual tab components for each section

### Key State Variables:
```javascript
const [result, setResult] = useState(null)           // Transcription result
const [analysisResult, setAnalysisResult] = useState(null)  // AI analysis
const [showAnalysis, setShowAnalysis] = useState(false)     // Show analysis view
const [analyzing, setAnalyzing] = useState(false)           // Analysis in progress
```

## Step 6: Add TTS Feature

```python
# Backend
@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    text = request.json.get('text')
    response = openai_client.audio.speech.create(
        model="tts-1",
        voice="nova",
        input=text
    )
    
    filename = f"tts_{uuid.uuid4().hex[:8]}.mp3"
    response.stream_to_file(f"uploads/{filename}")
    
    return jsonify({'audio_url': f'/api/audio/{filename}'})
```

## Step 7: Add AI Assistant

```python
@app.route('/api/assistant', methods=['POST'])
def ai_assistant():
    # See full implementation in AI Assistant section above
```

## Step 8: Add PDF Generation

Copy full `pdf_generator.py` with:
1. Color palette and styles
2. `generate_analysis_pdf()` function
3. All section builders

---

# How to Make It Better

## 🚀 Performance Improvements

### 1. Parallel Analysis
**Current:** Analysis runs sequentially
**Improvement:** Split analysis into parallel chunks

```python
import asyncio
import aiohttp

async def analyze_parallel(transcript, openai_client):
    tasks = [
        analyze_objections(transcript),
        analyze_closing(transcript),
        analyze_storytelling(transcript),
        analyze_buying_signals(transcript)
    ]
    results = await asyncio.gather(*tasks)
    return merge_results(results)
```

### 2. Streaming Analysis
**Current:** Wait for full response
**Improvement:** Stream results as they come

```javascript
// Frontend
const eventSource = new EventSource(`/api/analyze-stream/${jobId}`)
eventSource.onmessage = (event) => {
    const partial = JSON.parse(event.data)
    setAnalysisResult(prev => ({...prev, ...partial}))
}
```

### 3. Caching Common Patterns
**Improvement:** Cache common objection responses

```python
OBJECTION_RESPONSE_CACHE = {
    "need_to_think": {
        "templates": [...],
        "stories": [...]
    },
    "spouse_decision": {...}
}
```

## 📊 Better Analysis

### 1. Sentiment Analysis Integration
```python
# Add emotional tracking
def analyze_with_sentiment(utterances):
    for u in utterances:
        sentiment = analyze_sentiment(u['text'])
        u['sentiment'] = sentiment  # positive/negative/neutral
        u['emotional_intensity'] = calculate_intensity(u['text'])
```

### 2. Real-time Coaching During Call
**New Feature:** Live analysis during call recording

```javascript
// WebSocket for live analysis
const ws = new WebSocket('ws://api/live-coach')
ws.onmessage = (event) => {
    const coaching = JSON.parse(event.data)
    showCoachingTip(coaching.tip)  // "Good discovery question!"
}
```

### 3. Comparison with Top Performers
**New Feature:** Compare against successful calls

```python
def compare_to_benchmark(analysis):
    top_performers_avg = get_benchmark_stats()
    return {
        'score_vs_average': analysis['score'] - top_performers_avg['score'],
        'areas_below_benchmark': [...],
        'areas_above_benchmark': [...]
    }
```

## 🎨 Better UI/UX

### 1. Interactive Timeline
**Improvement:** Click anywhere on timeline to hear that moment

```jsx
<InteractiveTimeline
    events={timeline_events}
    audioRef={audioRef}
    onEventClick={(event) => seekToTime(event.timestamp_ms)}
/>
```

### 2. Video Recording Support
**New Feature:** Support video calls with facial analysis

```python
def analyze_video(video_path):
    # Extract audio
    audio_path = extract_audio(video_path)
    
    # Analyze facial expressions
    expressions = analyze_facial_expressions(video_path)
    
    # Combine with audio analysis
    return {
        'audio_analysis': analyze_audio(audio_path),
        'visual_analysis': expressions
    }
```

### 3. Mobile App
**New Feature:** Native mobile app for field sales

```
- Record calls directly
- Get instant feedback
- Practice mode with AI roleplay
```

## 🤖 Better AI

### 1. Fine-tuned Model
**Improvement:** Fine-tune on successful sales calls

```python
# Training data format
training_data = [
    {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": transcript},
            {"role": "assistant", "content": ideal_analysis}
        ]
    }
]

# Fine-tune
openai.fine_tuning.jobs.create(
    training_file="sales_training.jsonl",
    model="gpt-4o"
)
```

### 2. Industry-Specific Analysis
**Improvement:** Different prompts for different industries

```python
INDUSTRY_PROMPTS = {
    "real_estate": "Focus on: showing timeline, financing options, competition...",
    "saas": "Focus on: implementation time, ROI calculation, integrations...",
    "insurance": "Focus on: risk assessment, coverage gaps, family protection..."
}
```

### 3. Multilingual Support
**Improvement:** Better Hebrew/English mixed analysis

```python
# Detect language and adjust
if contains_hebrew(transcript):
    system_prompt += """
    ## HEBREW SALES CONTEXT:
    - In Israeli culture, directness is appreciated
    - Family decisions are common
    - Price negotiation is expected
    """
```

## 📈 Analytics Dashboard

### New Feature: Team Analytics
```
- Average team scores
- Top performers
- Common objections across team
- Training recommendations
- Progress over time
```

### Implementation:
```sql
-- Add team tables
CREATE TABLE teams (
    id UUID PRIMARY KEY,
    name TEXT,
    manager_id UUID
);

CREATE TABLE team_members (
    team_id UUID REFERENCES teams(id),
    user_id UUID REFERENCES auth.users(id)
);

-- Analytics view
CREATE VIEW team_analytics AS
SELECT 
    t.name as team_name,
    AVG(a.analysis->>'seller_performance'->>'overall_score') as avg_score,
    COUNT(*) as total_calls
FROM teams t
JOIN team_members tm ON t.id = tm.team_id
JOIN calls c ON tm.user_id = c.user_id
JOIN call_analyses a ON c.id = a.call_id
GROUP BY t.id;
```

---

# Technical Implementation Details

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload audio file, start transcription |
| GET | `/api/status/:job_id` | Poll job status |
| POST | `/api/analyze/:job_id` | Start AI analysis |
| GET | `/api/calls` | Get user's call history |
| GET | `/api/calls/:id` | Get single call with analysis |
| POST | `/api/tts` | Generate TTS audio |
| GET | `/api/audio/:filename` | Serve audio file |
| POST | `/api/assistant` | Chat with AI assistant |
| GET | `/api/pdf/:call_id` | Generate PDF report |

## Environment Variables

```bash
# Backend
OPENAI_API_KEY=sk-...
ASSEMBLYAI_API_KEY=...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=...
SUPABASE_JWT_SECRET=...

# Frontend
VITE_API_URL=https://your-backend.railway.app
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## Job Processing Flow

```
1. User uploads file
2. Backend creates job_id, returns immediately
3. Backend thread: transcribe → classify speakers → save to DB
4. Frontend polls /api/status/:job_id every 1 second
5. When complete, frontend shows transcription + "Analyze Call" button
6. User clicks "Analyze Call"
7. Backend creates analysis_id, starts AI analysis in thread
8. Frontend polls analysis status
9. When complete, frontend displays 3-tab analysis view
```

## Error Handling

```python
# Backend error format
{
    "error": "Error message",
    "code": "ERROR_CODE",
    "details": {...}
}

# Common errors:
# - TRANSCRIPTION_FAILED
# - ANALYSIS_FAILED
# - FILE_TOO_LARGE
# - INVALID_AUDIO_FORMAT
# - RATE_LIMIT_EXCEEDED
```

---

# Quick Reference

## Key Files to Modify

| Need to Change | File |
|----------------|------|
| AI Analysis Prompt | `sales_analyzer.py` |
| UI Layout/Design | `App.jsx`, component files |
| PDF Design | `pdf_generator.py` |
| AI Assistant Behavior | `app.py` (AI_ASSISTANT_SYSTEM_PROMPT) |
| Database Schema | `database.py`, Supabase dashboard |
| API Endpoints | `app.py` |

## Common Customizations

1. **Change AI Model:** Update `model="gpt-5.2"` in `sales_analyzer.py`
2. **Add New Objection Type:** Update JSON schema in analysis prompt
3. **Change TTS Voice:** Update `voice="nova"` in TTS endpoint
4. **Add New Tab:** Create component, add to tabs array in `AnalysisInsights.jsx`
5. **Change Color Scheme:** Update color constants in `pdf_generator.py` and Tailwind classes

---

*Last Updated: January 2026*
*Version: 1.0*
