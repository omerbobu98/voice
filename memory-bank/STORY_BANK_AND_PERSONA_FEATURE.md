# Story Bank & Persona Builder Feature (January 2026)

## STATUS: REVERTED - Waiting for new approach

The user requested a revert of the Story Bank feature that was added to the side menu. This document preserves the work done so it can be referenced for the new implementation.

---

## What Was Built (Then Reverted)

### 1. Database Tables Created in Supabase

#### `story_bank` table:
```sql
CREATE TABLE story_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  story_content TEXT NOT NULL,
  target_emotion TEXT,
  target_message TEXT,
  objection_type TEXT,
  product_type TEXT,
  story_structure JSONB,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `sales_persona` table:
```sql
CREATE TABLE sales_persona (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  seller_name TEXT,
  nickname TEXT,
  years_experience INTEGER,
  areas_served TEXT[],
  background_story TEXT,
  why_this_job TEXT,
  specialties TEXT[],
  certifications TEXT[],
  total_projects_completed INTEGER DEFAULT 0,
  notable_projects JSONB DEFAULT '[]'::jsonb,
  biggest_project TEXT,
  most_challenging_project TEXT,
  happy_customers_count INTEGER DEFAULT 0,
  referral_rate TEXT,
  repeat_customers_count INTEGER DEFAULT 0,
  customer_testimonials JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  objection_responses JSONB DEFAULT '{}'::jsonb,
  winning_stories JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Note**: These tables still exist in Supabase and can be reused.

### 2. Backend API Endpoints (in app.py - REVERTED)

#### Story Bank Endpoints:
- `POST /api/story-bank/generate` - Generate story using AI with persona data
- `GET /api/story-bank` - Get all user stories
- `POST /api/story-bank` - Save new story
- `PUT /api/story-bank/<story_id>` - Update story (favorite, tags)
- `DELETE /api/story-bank/<story_id>` - Delete story
- `POST /api/story-bank/<story_id>/use` - Increment usage count

#### Persona Endpoints:
- `GET /api/persona` - Get user's persona
- `POST /api/persona` - Create/update persona
- `POST /api/persona/project` - Add notable project
- `POST /api/persona/testimonial` - Add customer testimonial

### 3. AI Story Generation Prompt

The story generator used a detailed prompt with:
- 6 storytelling elements (relatable character, same hesitation, decision moment, cost of waiting, transformation, emotional payoff)
- Target emotion selection (trust, urgency, value, fear_of_loss, peace_of_mind, pride, social_proof)
- Objection type targeting (price, timing, spouse, think_about_it, competitor, general)
- Product type context (cool_life, turf, pavers, concrete, fence, general)
- Persona data integration for authentic stories

### 4. Frontend Components (DELETED)

#### StoryBank.jsx included:
- `PersonaBuilder` - Tabbed form for building seller profile
- `StoryGenerator` - Form for generating stories with emotion/message inputs
- `StoryCard` - Display card for individual stories
- `StoryBankPanel` - Side panel with 3 tabs (Stories, Generator, Persona)
- `InlineStoryGenerator` - Embeddable version for other components

---

## User's Original Request (Hebrew)

"אני רוצה שתוסיף אזור שיהיה גם בסטורייז וגם בפרקטיסט און של אפשרות בעצם לייצר סיפורים לפי רגשות ומסרים שאנחנו רוצים להעביר, זאת אומרת אני יכול להגיד לך מה המסרים שאני רוצה להעביר ואתה תבנה סיפור שנשמע ממש טוב שיגרום ללקוח להקשיב שיעביר את המסר הזה בצורה שתקדם אותו עכשיו אני רוצה שאת כל הסיפורים האלה תשמור ותייצר בנק סיפורים אוקיי תייצר בנק סיפורים ותעשה לזה גם side menu שנוכל לראות שם את כל הסיפורים תחשוב איך אתה מעצב את זה בצורה מעולה ואיך אתה מטמיע הכל ואיך אתה משתמש בפרומפ מדויק בשביל לעשות את זה בצורה הכי אפקטיבית"

### Follow-up Request (Persona Builder)

"אני רוצה גם שאתה תייצר איזשהו דרך לבנות דמות מי אני מה אני מה עשיתי פרויקטים שבעצם הסיפורים נוכל לבנות דמות לבן אדם ואני רוצה שזה יהיה בתוך האזור הזה של הסיפורים אבל תעצב את זה בצורה שתראה ממש טוב ואני רוצה שתחשוב יותר עומק על מה אני מדבר ואיך אפשר לעשות את זה (זה משהו שיצטרך להיבנות ככל שאנחנו מייצרים יותר סיפורים ורעיונות כאלו ואחרים- ואז נוכל להתשמש בזה בשביל לייצר פתרונות להתנגדויות שבאות או אפילו למנוע התנגדויות לפני שאומרים אותם)"

---

## Key Concepts for Next Implementation

### 1. Persona as Foundation
- Build seller's character profile over time
- Use real projects, testimonials, achievements
- Stories become more authentic when referencing actual experiences

### 2. Story Generation Flow
- Input: emotion + message + objection type + product
- AI uses persona data to create personalized stories
- Stories saved to bank for reuse

### 3. Integration Points
- Stories tab (in analysis)
- Practice On tab (for training)
- Side menu access to story bank

### 4. Value Proposition
- Prevent objections before they happen
- Handle objections with real stories
- Build trust through authentic experiences

---

## Files to Reference

- Database tables: `story_bank`, `sales_persona` (exist in Supabase)
- Backend: `app.py` (endpoints were removed but can be re-added)
- Frontend: Components need to be recreated based on new design

---

## Next Steps

User requested revert and will provide new instructions for how to implement this feature differently.
