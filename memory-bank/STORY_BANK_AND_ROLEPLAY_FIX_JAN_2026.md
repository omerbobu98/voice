# Story Bank Save Fix & Roleplay AI Enhancement - January 2026

## Summary
Fixed the "Save to Story Bank" 500 error and enhanced the roleplay AI to be more challenging and realistic.

---

## 1. Story Bank Save Fix

### Problem
- Clicking "Save to Story Bank" returned 500 error
- Stories weren't appearing in Story Bank page

### Root Cause
- **Frontend** was sending `content` but **database** requires `story_content` as the primary field
- Multiple fields had both singular and plural versions in database schema

### Database Schema (`story_bank` table)
```
Required fields:
- id (uuid, NOT NULL)
- title (text, NOT NULL)
- story_content (text, NOT NULL)  ← PRIMARY content field

Optional fields:
- user_id, content, target_emotion, target_emotions (jsonb)
- target_message, objection_type, product, product_type
- structure (jsonb), story_structure (jsonb)
- setup_line, closing_bridge, explanation
- tags (array), is_favorite (boolean), usage_count (integer)
- created_at, updated_at
```

### Files Fixed

#### Backend: `app.py` (lines 1729-1777)
```python
@app.route('/api/story-bank', methods=['POST'])
def save_story():
    # Now correctly maps:
    story_content = data.get('content') or data.get('story_content') or ''
    story_data = {
        'story_content': story_content,  # Required field
        'content': story_content,  # Compatibility
        'target_emotions': data.get('target_emotions', []),
        'target_emotion': data.get('target_emotions', ['trust'])[0] if data.get('target_emotions') else 'trust',
        # ... handles both singular/plural versions
    }
```

#### Frontend: `PracticeOnTab.jsx` - StoryImprovementCard
```javascript
const saveToBank = async () => {
  const storyContent = improvedStory.story_content || improvedStory.content || ''
  await axios.post(`${API_URL}/api/story-bank`, {
    content: storyContent,
    story_content: storyContent,  // Send BOTH
    target_emotions: selectedEmotions.length > 0 ? selectedEmotions : ['trust'],
    // ...
  })
}
```

#### Frontend: `StoryBankPage.jsx`
- Fixed filter to check `story.content || story.story_content`
- Fixed display to show correct content field
- Fixed copy to clipboard

---

## 2. Enhanced Roleplay AI

### Location: `app.py` lines 1388-1444

### New Behavior

#### Early Turns (1-3): BE RESISTANT
- Stick to objection firmly
- Give short, dismissive responses if generic pitches
- Challenge claims: "That's what everyone says..."
- Bring up hidden concerns

#### Middle Turns (4-5): SHOW CRACKS IF GOOD
- If specific stories with names/numbers → show interest
- If real urgency → acknowledge
- If still generic → become MORE skeptical

#### Final Turns (6+): MOVE TOWARD DECISION
- If earned → start agreeing
- If weak → "I still need to think about it"

### What Convinces the Customer
1. **Specific Stories**: "Let me tell you about David from Scottsdale..."
2. **Social Proof**: "Most customers in your neighborhood..."
3. **Cost of Waiting**: "Every month you wait costs you $X..."
4. **Urgency**: "Prices going up" / "Booking into September"
5. **Empathy + Challenge**: Understanding concern, then reframing
6. **Takeaway**: Making them feel they might miss out

### What Makes Customer MORE Resistant
- Generic pitches without specifics
- Pushy closing without building value
- Ignoring objections
- Making claims without proof
- Talking too much without asking questions

### Response Format
```json
{
  "customer_response": "Realistic response (1-3 sentences)",
  "customer_emotion": "interested|skeptical|resistant|convinced|warming_up",
  "should_end": false,
  "resistance_level": 1-10,
  "inline_feedback": "Quick coaching tip for the rep"
}
```

---

## 3. Improved Story Generation Prompts

### Location: `app.py` - STORY_GENERATION_PROMPT and STORY_IMPROVEMENT_PROMPT

### Critical Format Change
Stories now use **first-person narrative** format:
- "Let me tell you about [Name] from [Location]..."
- "I had a customer named [Name] about [timeframe] ago..."
- "You know what's interesting? This reminds me of [Name]..."

### Make It Vivid
1. **Specific Details**: Names, Arizona locations, exact numbers, timeframes
2. **Sensory Language**: "scorching 118°F patio", "kids begging to go inside"
3. **Include Dialogue**: Actual quotes make it believable
4. **Show the Journey**: Frustration → Hesitation → Decision → Action → Joy

---

## 4. Key Code Locations

| Feature | File | Lines |
|---------|------|-------|
| Save Story API | `app.py` | 1729-1777 |
| Get Stories API | `app.py` | 1710-1726 |
| Roleplay Respond | `app.py` | 1370-1458 |
| Roleplay Feedback | `app.py` | 1469-1530 |
| Story Generation | `app.py` | 1533-1616 |
| Story Improvement | `app.py` | 1618-1707 |
| Generate Story API | `app.py` | 1900-2000 |
| StoryImprovementCard | `PracticeOnTab.jsx` | 1410-1810 |
| NewStoryCreator | `PracticeOnTab.jsx` | 1826-2050 |
| StoryBankPage | `StoryBankPage.jsx` | Full file |
| StoryEnhancer | `StoryEnhancer.jsx` | Full file |

---

## 5. Deployment Info

- **Frontend**: https://vloce.netlify.app
- **Backend**: https://web-production-3215.up.railway.app (auto-deploys from git)
- **Database**: Supabase project `ueztvmtwxqszvlzmoezx`

---

## 6. Testing Checklist

- [ ] Save story from StoryEnhancer → Should succeed
- [ ] Save story from StoryImprovementCard → Should succeed
- [ ] Save story from NewStoryCreator → Should succeed
- [ ] Stories appear in Story Bank page
- [ ] Filter by emotion works
- [ ] Filter by objection works
- [ ] Copy to clipboard works
- [ ] Roleplay AI gives realistic objections
- [ ] Roleplay AI shows cracks when good techniques used
- [ ] Stories generated have narrative format with names/locations
