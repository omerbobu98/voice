# English UI and Story Generation Prompts Update

**Date:** January 2026

## Overview

The story generation system has been updated with:
1. World-class English story generation prompts
2. English UI as default with Hebrew toggle
3. Bilingual support for all options and labels

---

## English UI with Language Toggle

### Default Language
- All story components now default to **English**
- Users can toggle to Hebrew using the **EN/עב** button

### Updated Components
- `StoryImprovementCard` - Full English UI with toggle
- `NewStoryCreator` - Full English UI with toggle

### TRANSLATIONS Dictionary
Location: `/frontend/src/components/analysis/PracticeOnTab.jsx`

```javascript
const TRANSLATIONS = {
  en: {
    yourStory: 'Your Story',
    originalVersion: 'The original version from your call',
    improvedVersion: 'The Improved Version',
    withAllElements: 'With all 6 storytelling elements',
    detectedMessage: 'Detected Message',
    setupLine: 'Setup Line',
    closingBridge: 'Closing Bridge',
    listenToStory: 'Listen to Story',
    listenToImproved: 'Listen to Improved',
    stop: 'Stop',
    missing: 'Missing',
    elements: 'elements',
    improvementSettings: 'Improvement Settings',
    messageToConvey: 'Message to Convey',
    emotionsToEvoke: 'Emotions to Evoke',
    targetObjection: 'Target Objection',
    product: 'Product',
    createImprovedVersion: 'Create Improved Version',
    creatingVersion: 'Creating improved version...',
    createNewVersion: 'Create New Version',
    saveToStoryBank: 'Save to Story Bank',
    saving: 'Saving...',
    savedSuccessfully: 'Saved!',
    // ... more translations
  },
  he: {
    // Hebrew translations
  }
}
```

### Bilingual Options Arrays

**EMOTION_OPTIONS:**
- Trust / אמון
- Urgency / דחיפות
- Value / ערך
- Fear of Loss / פחד מהפסד
- Peace of Mind / שקט נפשי
- Pride / גאווה
- Professionalism / מקצועיות
- Integrity / יושרה
- Success / הצלחה
- Social Proof / הוכחה חברתית

**OBJECTION_OPTIONS:**
- No specific objection / ללא התנגדות ספציפית
- Need to think about it / צריך לחשוב על זה
- Too expensive / יקר לי
- Need to talk to spouse / צריך לדבר עם בן/בת זוג
- Getting other quotes / בודק עוד הצעות
- Not the right time / לא עכשיו
- Need to check finances / צריך לבדוק פיננסים

**PRODUCT_OPTIONS:**
- General / כללי
- Cool Life Paint
- Synthetic Turf / דשא סינטטי
- Pavers / ריצוף
- Concrete / בטון
- Fencing / גדר

---

## World-Class Story Generation Prompts

### Location in Code
- File: `/app.py`
- `STORY_GENERATION_PROMPT`: Lines 1370-1453
- `STORY_IMPROVEMENT_PROMPT`: Lines 1455-1504

### The 6 Essential Elements Framework

#### 1. RELATABLE CHARACTER (The Hero)
- Full name + specific location (e.g., "David and Sarah from Scottsdale")
- Similar life situation to the prospect
- One unique, memorable detail that makes them REAL
- Use real Arizona locations: Phoenix, Scottsdale, Paradise Valley, Fountain Hills, Gilbert, Chandler, Mesa, Tempe, Cave Creek

#### 2. THE SAME HESITATION (Mirror Moment)
- The character had the EXACT SAME objection the prospect has now
- Quote their words directly: "David said the exact same thing—'I need to think about it'"
- Creates instant rapport: "This person GETS me"

#### 3. THE DECISION MOMENT (The Turning Point)
- What SPECIFIC event made them decide to move forward?
- NOT vague ("they decided it was worth it")
- SPECIFIC trigger: "When they saw their neighbor's water bill was $47 while theirs was $380..."

#### 4. THE COST OF WAITING (The Regret Factor)
- What did they LOSE or ALMOST LOSE by hesitating?
- Specific dollar amounts: "$3,000 more because prices went up"
- Lost time: "Another summer where the kids couldn't play outside"
- Missed opportunities

#### 5. THE TRANSFORMATION (The Results)
- MEASURABLE, SPECIFIC outcomes with numbers
- Money saved: "Cut their water bill from $380 to $47/month—that's $4,000/year"
- Home value: "Appraiser said it added $45,000 to their home value"
- Lifestyle change: "Kids now play outside 3 hours a day instead of screens"

#### 6. THE EMOTIONAL PAYOFF (The Quote)
- End with a POWERFUL direct quote from the customer
- "Sarah told me last month: 'I can't believe we almost didn't do this. It changed our whole lifestyle.'"
- Emotions to evoke: pride, peace of mind, joy, vindication, relief

### Target Emotions
- **trust** - Establish credibility through experience and results
- **urgency** - Prices going up, limited availability, summer approaching
- **value** - Investment that pays for itself, ROI calculation
- **fear_of_loss** - What they'll miss out on, competitor advantages
- **peace_of_mind** - No more worries, maintenance-free, guaranteed
- **pride** - Neighbors complimenting, best-looking yard on the street
- **social_proof** - Everyone in the neighborhood is doing it

### Product-Specific Benefits
- **Cool Life Paint**: Reduces surface temp 20-30°F, use patio year-round, lifetime warranty
- **Turf**: Save $200-400/month on water, zero maintenance, green 365 days
- **Pavers**: Adds 10-15% to home value, 25+ year durability
- **Pergola**: Extends living space, protection from Arizona sun

### Story Requirements
- Length: 150-200 words (60-90 seconds spoken)
- Tone: Conversational, like telling a friend about someone you know
- Style: Vivid, visual, emotional—make them SEE and FEEL the story
- Avoid: Jargon, unrealistic claims, filler words, being generic

---

## Text-to-Speech Support

The `useTextToSpeech` hook now supports both languages:

```javascript
const speak = (text, id, lang = 'en') => {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang === 'he' ? 'he-IL' : 'en-US'
  // ...
}
```

---

## Key Files Modified

1. **Backend**: `/app.py`
   - Lines 1370-1453: STORY_GENERATION_PROMPT
   - Lines 1455-1504: STORY_IMPROVEMENT_PROMPT
   - Lines 1685-1761: English labels for emotions, objections, products

2. **Frontend**: `/frontend/src/components/analysis/PracticeOnTab.jsx`
   - Lines 1129-1237: TRANSLATIONS dictionary
   - Lines 1239-1270: Bilingual options arrays
   - Lines 1375-1387: LanguageToggle component
   - Lines 1389-1790: StoryImprovementCard with language support
   - Lines 1792-2018: NewStoryCreator with language support

---

## Deployment

- **Frontend**: https://vloce.netlify.app
- **Backend**: https://web-production-3215.up.railway.app

Backend changes require Railway deployment to take effect.
