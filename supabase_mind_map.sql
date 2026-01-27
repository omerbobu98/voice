-- =============================================
-- SALES MIND MAP - DATABASE SCHEMA
-- Created: January 27, 2026
-- =============================================

-- Mind Map Categories (pre-populated template - rings in the mind map)
CREATE TABLE IF NOT EXISTS mind_map_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,           -- "Opening", "Discovery", etc.
    name_he TEXT,                 -- Hebrew name
    ring_level INTEGER NOT NULL,  -- 0 = center, 1-4 = rings
    color TEXT NOT NULL,          -- Hex color code
    icon TEXT,                    -- Lucide icon name
    description TEXT,
    description_he TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mind Map Nodes (content within categories)
CREATE TABLE IF NOT EXISTS mind_map_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES mind_map_categories(id) ON DELETE CASCADE,
    parent_node_id UUID REFERENCES mind_map_nodes(id) ON DELETE SET NULL,
    
    node_type TEXT NOT NULL,      -- 'question', 'script', 'story', 'objection', 'tip', 'benefit'
    title TEXT NOT NULL,
    title_he TEXT,
    content TEXT NOT NULL,
    content_he TEXT,
    short_content TEXT,           -- Brief version for node display
    short_content_he TEXT,
    
    -- For objections
    objection_type TEXT,          -- 'need_to_think', 'too_expensive', 'spouse_decision', 'getting_quotes', 'bad_timing'
    handle_script TEXT,           -- How to handle this objection
    handle_script_he TEXT,
    prevent_script TEXT,          -- How to prevent this objection
    prevent_script_he TEXT,
    technique TEXT,               -- 'feel_felt_found', 'lair', 'isolate', 'reframe', 'assumptive'
    
    -- For stories
    story_type TEXT,              -- 'customer_success', 'prevention', 'transformation'
    story_for_objection TEXT,     -- Which objection this story prevents
    setup_line TEXT,
    setup_line_he TEXT,
    closing_bridge TEXT,
    closing_bridge_he TEXT,
    
    -- For products
    product_type TEXT,            -- 'cool_life', 'turf', 'pavers', 'concrete', 'fence', NULL for all
    
    -- Coaching content
    coaching_tips TEXT[],
    why_it_works TEXT,
    why_it_works_he TEXT,
    common_mistakes TEXT[],
    
    -- Metadata
    is_template BOOLEAN DEFAULT true,  -- System-provided or user-created
    order_index INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    success_probability FLOAT DEFAULT 0.5,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's Custom Scripts
CREATE TABLE IF NOT EXISTS user_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    content_he TEXT,
    
    category TEXT,                -- 'opening', 'discovery', 'solution', 'objection', 'closing'
    product_type TEXT,            -- Specific product or 'all'
    objection_type TEXT,          -- If related to objection
    
    source_node_id UUID REFERENCES mind_map_nodes(id) ON DELETE SET NULL,  -- If derived from template
    
    is_favorite BOOLEAN DEFAULT FALSE,
    use_count INTEGER DEFAULT 0,
    
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User's AI Chat History for Mind Map Nodes
CREATE TABLE IF NOT EXISTS mind_map_ai_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    node_id UUID REFERENCES mind_map_nodes(id) ON DELETE CASCADE,
    
    messages JSONB NOT NULL DEFAULT '[]',  -- [{role, content, timestamp}]
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_category ON mind_map_nodes(category_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_type ON mind_map_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_product ON mind_map_nodes(product_type);
CREATE INDEX IF NOT EXISTS idx_mind_map_nodes_objection ON mind_map_nodes(objection_type);
CREATE INDEX IF NOT EXISTS idx_user_scripts_user ON user_scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scripts_category ON user_scripts(category);
CREATE INDEX IF NOT EXISTS idx_mind_map_ai_chats_user ON mind_map_ai_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_mind_map_ai_chats_node ON mind_map_ai_chats(node_id);

-- Enable RLS
ALTER TABLE mind_map_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mind_map_ai_chats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Categories and template nodes are readable by all authenticated users
CREATE POLICY "Anyone can read categories" ON mind_map_categories
    FOR SELECT USING (true);

CREATE POLICY "Anyone can read template nodes" ON mind_map_nodes
    FOR SELECT USING (is_template = true);

-- User scripts are private to each user
CREATE POLICY "Users can manage own scripts" ON user_scripts
    FOR ALL USING (user_id = auth.uid());

-- AI chats are private to each user
CREATE POLICY "Users can manage own AI chats" ON mind_map_ai_chats
    FOR ALL USING (user_id = auth.uid());

-- =============================================
-- PRE-POPULATE CATEGORIES
-- =============================================

INSERT INTO mind_map_categories (name, name_he, ring_level, color, icon, description, description_he, order_index) VALUES
('Opening', 'פתיחה', 0, '#8b5cf6', 'HandWaving', 'Ice breaking and setting expectations', 'שבירת קרח והצבת ציפיות', 0),
('Discovery', 'גילוי צרכים', 1, '#3b82f6', 'Search', 'Uncover needs, pains, and motivations', 'חשיפת צרכים, כאבים ומוטיבציות', 1),
('Solution', 'פתרון/ערך', 2, '#10b981', 'Sparkles', 'Present value, benefits, and stories', 'הצגת ערך, יתרונות וסיפורים', 2),
('Objections', 'התנגדויות', 3, '#f59e0b', 'AlertTriangle', 'Handle and prevent objections', 'טיפול ומניעת התנגדויות', 3),
('Closing', 'סגירה', 4, '#eab308', 'Trophy', 'Trial closes and final close', 'סגירות ניסיון וסגירה סופית', 4)
ON CONFLICT DO NOTHING;

-- =============================================
-- PRE-POPULATE NODES - OPENING
-- =============================================

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, coaching_tips, why_it_works, order_index) 
SELECT 
    c.id,
    'script',
    'Opening Introduction',
    'פתיחה והצגה',
    'Hi! Thanks for taking the time to meet with me today. I''m here to show you how we can help solve [their problem]. Before I get started, tell me - what made you interested in learning about this?',
    'היי! תודה שלקחתם את הזמן להיפגש איתי היום. אני כאן כדי להראות לכם איך אנחנו יכולים לעזור לפתור את [הבעיה שלהם]. לפני שאני מתחיל, ספרו לי - מה גרם לכם להתעניין בזה?',
    'Opening: Build rapport and discover initial interest',
    ARRAY['Smile and maintain eye contact', 'Use their name within first 30 seconds', 'Ask an open-ended question to get them talking'],
    'This opening works because it thanks them (creates reciprocity), positions you as helpful not salesy, and immediately gets THEM talking about THEIR needs.',
    0
FROM mind_map_categories c WHERE c.name = 'Opening'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, order_index) 
SELECT 
    c.id,
    'question',
    'Decision Maker Pre-frame',
    'מיפוי מקבלי החלטות',
    'Before we dive in, I want to make sure I can answer all your questions today. Besides yourself, who else will be involved in making this decision?',
    'לפני שנצלול פנימה, אני רוצה לוודא שאוכל לענות על כל השאלות שלכם היום. מלבדכם, מי עוד יהיה מעורב בקבלת ההחלטה הזו?',
    'Ask about decision makers early to prevent spouse objection',
    1
FROM mind_map_categories c WHERE c.name = 'Opening'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, order_index) 
SELECT 
    c.id,
    'script',
    'Set Decision Expectation',
    'הצבת ציפייה להחלטה',
    'At the end of our meeting today, you''ll know clearly whether this is the right solution for you or not. If it''s not a fit, I''ll be the first to tell you. Does that sound fair?',
    'בסוף הפגישה שלנו היום, תדעו בבירור האם זה הפתרון הנכון עבורכם או לא. אם זה לא מתאים, אני אהיה הראשון להגיד לכם. נשמע הוגן?',
    'Pre-frame to prevent "need to think" objection',
    2
FROM mind_map_categories c WHERE c.name = 'Opening'
ON CONFLICT DO NOTHING;

-- =============================================
-- PRE-POPULATE NODES - DISCOVERY
-- =============================================

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, product_type, order_index) 
SELECT 
    c.id,
    'question',
    'Energy Bill Discovery',
    'גילוי חשבון חשמל',
    'Tell me about your electricity bills - how much are you spending during peak summer months?',
    'ספרו לי על חשבונות החשמל שלכם - כמה אתם מוציאים בחודשי השיא של הקיץ?',
    'Get specific numbers for ROI calculation',
    'cool_life',
    0
FROM mind_map_categories c WHERE c.name = 'Discovery'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, order_index) 
SELECT 
    c.id,
    'question',
    'Problem Discovery',
    'גילוי בעיה',
    'What challenges are you currently facing with [their situation]?',
    'אילו אתגרים אתם מתמודדים איתם כרגע עם [המצב שלהם]?',
    'Uncover the main pain point',
    1
FROM mind_map_categories c WHERE c.name = 'Discovery'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, coaching_tips, order_index) 
SELECT 
    c.id,
    'question',
    'Pain Amplification',
    'הגברת הכאב',
    'How does that affect your daily life? What happens if this continues for another year?',
    'איך זה משפיע על החיים היומיומיים שלכם? מה יקרה אם זה ימשיך עוד שנה?',
    'Make the pain tangible and urgent',
    ARRAY['Wait for full answer', 'Use silence to let them think', 'Nod to show active listening'],
    2
FROM mind_map_categories c WHERE c.name = 'Discovery'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, order_index) 
SELECT 
    c.id,
    'question',
    'Vision Question',
    'שאלת חזון',
    'If we could solve this problem completely, what would that mean for you and your family?',
    'אם היינו יכולים לפתור את הבעיה הזו לחלוטין, מה זה היה אומר עבורכם ועבור המשפחה?',
    'Paint the picture of success',
    3
FROM mind_map_categories c WHERE c.name = 'Discovery'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, order_index) 
SELECT 
    c.id,
    'question',
    'Budget/Timeline',
    'תקציב/לוח זמנים',
    'What''s your timeline for getting this taken care of? Have you set aside a budget for this project?',
    'מה לוח הזמנים שלכם לטפל בזה? האם הקצתם תקציב לפרויקט הזה?',
    'Qualify budget and urgency',
    4
FROM mind_map_categories c WHERE c.name = 'Discovery'
ON CONFLICT DO NOTHING;

-- =============================================
-- PRE-POPULATE NODES - SOLUTION/VALUE
-- =============================================

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, product_type, order_index) 
SELECT 
    c.id,
    'benefit',
    'Cool Life - Heat Reflection',
    'קול לייף - החזרת חום',
    'Cool Life Paint reflects up to 85% of solar heat, keeping your home up to 40°F cooler. This means your AC doesn''t have to work as hard, saving you 30-50% on energy bills.',
    'צבע קול לייף מחזיר עד 85% מחום השמש, ושומר על הבית שלכם קריר יותר עד 40 מעלות. זה אומר שהמזגן לא צריך לעבוד קשה, וחוסך לכם 30-50% בחשבונות החשמל.',
    'Heat reflection = energy savings',
    'cool_life',
    0
FROM mind_map_categories c WHERE c.name = 'Solution'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, product_type, order_index) 
SELECT 
    c.id,
    'benefit',
    'Cool Life - Lifetime Warranty',
    'קול לייף - אחריות לכל החיים',
    'Unlike regular paint that needs to be redone every 5-7 years, Cool Life comes with a LIFETIME warranty. You''ll never have to repaint your home again.',
    'בניגוד לצבע רגיל שצריך לחדש כל 5-7 שנים, קול לייף מגיע עם אחריות לכל החיים. לעולם לא תצטרכו לצבוע את הבית שוב.',
    'Lifetime warranty = never repaint',
    'cool_life',
    1
FROM mind_map_categories c WHERE c.name = 'Solution'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, product_type, order_index) 
SELECT 
    c.id,
    'benefit',
    'Turf - No Maintenance',
    'דשא - ללא תחזוקה',
    'No more watering, mowing, or fertilizing. Our synthetic turf stays green year-round with zero maintenance. You''ll save thousands on water bills alone.',
    'אין יותר השקיה, כיסוח או דישון. הדשא הסינטטי שלנו נשאר ירוק כל השנה ללא תחזוקה. תחסכו אלפים על חשבונות מים בלבד.',
    'Zero maintenance, always green',
    'turf',
    2
FROM mind_map_categories c WHERE c.name = 'Solution'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, order_index) 
SELECT 
    c.id,
    'script',
    '3 Program Benefits',
    '3 יתרונות התוכנית',
    'We have three things that set us apart: First, INCENTIVES - special discounts we can pass on to you. Second, NMOOP Financing - you don''t pay anything until the project is 100% complete. Third, Made in USA - we only use the highest quality American-made products.',
    'יש לנו שלושה דברים שמבדילים אותנו: ראשית, תמריצים - הנחות מיוחדות שאנחנו יכולים להעביר אליכם. שנית, מימון NMOOP - אתם לא משלמים כלום עד שהפרויקט מושלם ב-100%. שלישית, תוצרת ארה"ב - אנחנו משתמשים רק במוצרים האמריקאיים באיכות הגבוהה ביותר.',
    'Incentives, NMOOP Financing, Made in USA',
    3
FROM mind_map_categories c WHERE c.name = 'Solution'
ON CONFLICT DO NOTHING;

-- =============================================
-- PRE-POPULATE NODES - OBJECTIONS
-- =============================================

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, objection_type, handle_script, handle_script_he, prevent_script, prevent_script_he, technique, order_index) 
SELECT 
    c.id,
    'objection',
    'Need to Think About It',
    'צריך לחשוב על זה',
    'I need to think about it / I want to sleep on it',
    'אני צריך לחשוב על זה / אני רוצה לישון על זה',
    'need_to_think',
    'I totally understand. This is a big decision. Let me ask you - when you say you need to think about it, what specifically would you be weighing? Is it the product, the price, or the timing?',
    'אני מבין לחלוטין. זו החלטה גדולה. תן לי לשאול - כשאתה אומר שאתה צריך לחשוב על זה, על מה ספציפית אתה מתלבט? על המוצר, המחיר, או העיתוי?',
    'At the end of our meeting today, you''ll know clearly whether this is the right solution for you. If it''s not a fit, I''ll be the first to tell you. Does that sound fair?',
    'בסוף הפגישה שלנו היום, תדע בבירור האם זה הפתרון הנכון עבורך. אם זה לא מתאים, אני אהיה הראשון להגיד לך. נשמע הוגן?',
    'isolate',
    0
FROM mind_map_categories c WHERE c.name = 'Objections'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, objection_type, handle_script, handle_script_he, prevent_script, prevent_script_he, technique, order_index) 
SELECT 
    c.id,
    'objection',
    'Too Expensive',
    'יקר מדי',
    'That''s too expensive / It costs too much / I can''t afford it',
    'זה יקר מדי / זה עולה יותר מדי / אני לא יכול להרשות לעצמי',
    'too_expensive',
    'I hear you. When you say it''s expensive, help me understand - is it the total investment that concerns you, or is it more about the monthly cash flow? Because depending on which one, I might have different options for you.',
    'אני שומע אותך. כשאתה אומר שזה יקר, עזור לי להבין - האם ההשקעה הכוללת מדאיגה אותך, או שזה יותר על התזרים החודשי? כי תלוי במה, יכול להיות שיש לי אפשרויות שונות עבורך.',
    'Before we talk about price, let me make sure this is even the right solution for you. Once we know it fits your needs, we can figure out the best way to make it work for your budget.',
    'לפני שנדבר על מחיר, תן לי לוודא שזה בכלל הפתרון הנכון עבורך. ברגע שנדע שזה מתאים לצרכים שלך, נוכל למצוא את הדרך הטובה ביותר להתאים את זה לתקציב שלך.',
    'feel_felt_found',
    1
FROM mind_map_categories c WHERE c.name = 'Objections'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, objection_type, handle_script, handle_script_he, prevent_script, prevent_script_he, technique, order_index) 
SELECT 
    c.id,
    'objection',
    'Need to Talk to Spouse',
    'צריך לדבר עם בן/בת הזוג',
    'I need to talk to my wife/husband first',
    'אני צריך לדבר עם אשתי/בעלי קודם',
    'spouse_decision',
    'I totally understand - this is a family decision. Let me ask you: if your [spouse] was sitting here right now and heard everything we discussed about [their pain], what do you think they''d be most excited about?',
    'אני מבין לחלוטין - זו החלטה משפחתית. תן לי לשאול: אם [בן/בת הזוג] היה/ה יושב/ת כאן עכשיו ושומע/ת את כל מה שדיברנו עליו לגבי [הכאב שלהם], על מה לדעתך הם היו הכי מתלהבים?',
    'Before we dive in, I want to make sure I can answer all your questions today. Besides yourself, who else will be involved in making this decision?',
    'לפני שנצלול פנימה, אני רוצה לוודא שאוכל לענות על כל השאלות שלכם היום. מלבדכם, מי עוד יהיה מעורב בקבלת ההחלטה?',
    'assumptive',
    2
FROM mind_map_categories c WHERE c.name = 'Objections'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, objection_type, handle_script, handle_script_he, prevent_script, prevent_script_he, technique, order_index) 
SELECT 
    c.id,
    'objection',
    'Getting Other Quotes',
    'מקבל הצעות מחיר נוספות',
    'I want to get a few more quotes / I''m comparing prices',
    'אני רוצה לקבל עוד כמה הצעות מחיר / אני משווה מחירים',
    'getting_quotes',
    'That makes total sense - you want to make sure you''re getting the best value. Let me ask: what are the top 3 things you''re comparing? Is it price, quality, warranty, or something else?',
    'זה הגיוני לחלוטין - אתה רוצה לוודא שאתה מקבל את הערך הטוב ביותר. תן לי לשאול: מה 3 הדברים העיקריים שאתה משווה? זה המחיר, האיכות, האחריות, או משהו אחר?',
    'I know you might be thinking about comparing this to other options. Let me show you exactly how we stack up so you have all the information you need.',
    'אני יודע שאולי אתה חושב להשוות את זה לאפשרויות אחרות. תן לי להראות לך בדיוק איך אנחנו משתווים כדי שיהיה לך את כל המידע שאתה צריך.',
    'reframe',
    3
FROM mind_map_categories c WHERE c.name = 'Objections'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, objection_type, handle_script, handle_script_he, prevent_script, prevent_script_he, technique, order_index) 
SELECT 
    c.id,
    'objection',
    'Bad Timing',
    'לא עכשיו / עיתוי לא טוב',
    'Now is not a good time / Maybe next year / We have other priorities',
    'עכשיו זה לא זמן טוב / אולי בשנה הבאה / יש לנו עדיפויות אחרות',
    'bad_timing',
    'I understand timing is important. Help me understand - is it a budget thing, or is there something else going on that makes now not ideal?',
    'אני מבין שהעיתוי חשוב. עזור לי להבין - האם זה עניין של תקציב, או שיש משהו אחר שקורה שגורם לעכשיו להיות לא אידיאלי?',
    'I''m curious - what made you agree to meet with me today? What changed that made this a priority now?',
    'אני סקרן - מה גרם לך להסכים להיפגש איתי היום? מה השתנה שגרם לזה להפוך לעדיפות עכשיו?',
    'lair',
    4
FROM mind_map_categories c WHERE c.name = 'Objections'
ON CONFLICT DO NOTHING;

-- =============================================
-- PRE-POPULATE NODES - STORIES
-- =============================================

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, story_type, story_for_objection, setup_line, setup_line_he, closing_bridge, closing_bridge_he, product_type, order_index) 
SELECT 
    c.id,
    'story',
    'David''s 3-Month Wait Story',
    'סיפור ההמתנה של דויד',
    'Let me tell you about David. He owns a plumbing business, similar situation to yours. When I first met him, he said exactly what you just said - "I need to think about it." I said "of course, take your time." Three months went by. When he finally called back, he was frustrated. His competitor down the street had signed up, was showing up first in results, and David lost 3 big commercial contracts worth about $50,000. When he finally started with us, within 6 weeks he got those same type of contracts back. Now he tells everyone - "My only regret is those 3 months I waited."',
    'תן לי לספר לך על דויד. יש לו עסק לאינסטלציה, מצב דומה לשלך. כשפגשתי אותו לראשונה, הוא אמר בדיוק מה שאתה אמרת - "אני צריך לחשוב על זה." אמרתי "בטח, קח את הזמן." עברו שלושה חודשים. כשהוא סוף סוף התקשר בחזרה, הוא היה מתוסכל. המתחרה שלו ברחוב נרשם, הופיע ראשון בתוצאות, ודויד הפסיד 3 חוזים מסחריים גדולים בשווי של כ-50,000 דולר. כשהוא סוף סוף התחיל איתנו, תוך 6 שבועות הוא קיבל בחזרה את אותו סוג של חוזים. עכשיו הוא אומר לכולם - "החרטה היחידה שלי היא אותם 3 חודשים שחיכיתי."',
    'prevention',
    'need_to_think',
    'You know, that reminds me of something that happened with a client last year...',
    'אתה יודע, זה מזכיר לי משהו שקרה עם לקוח בשנה שעברה...',
    'I''m curious - when you say you need to think about it, what specifically would you be weighing?',
    'אני סקרן - כשאתה אומר שאתה צריך לחשוב על זה, על מה ספציפית אתה מתלבט?',
    NULL,
    0
FROM mind_map_categories c WHERE c.name = 'Solution'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, story_type, story_for_objection, setup_line, setup_line_he, closing_bridge, closing_bridge_he, product_type, order_index) 
SELECT 
    c.id,
    'story',
    'The Cheap Contractor Story',
    'סיפור הקבלן הזול',
    'I had a customer last year, the Johnsons. They got three quotes - ours was in the middle. They went with the cheapest guy to save $2,000. Six months later, Mrs. Johnson called me crying. The paint was already peeling, the contractor wouldn''t return calls, and they had to pay us to redo the entire job anyway. They ended up spending $4,000 MORE than if they had just gone with us from the start. She told me: "I learned the hard way that cheap is expensive."',
    'היה לי לקוח בשנה שעברה, משפחת ג''ונסון. הם קיבלו שלוש הצעות מחיר - שלנו הייתה באמצע. הם הלכו עם הבחור הכי זול כדי לחסוך 2,000 דולר. שישה חודשים אחר כך, גב'' ג''ונסון התקשרה אליי בבכי. הצבע כבר התקלף, הקבלן לא החזיר שיחות, והם היו צריכים לשלם לנו כדי לעשות את כל העבודה מחדש בכל מקרה. בסופו של דבר הם הוציאו 4,000 דולר יותר מאשר אם היו הולכים איתנו מההתחלה. היא אמרה לי: "למדתי בדרך הקשה שזול זה יקר."',
    'prevention',
    'too_expensive',
    'Can I share a quick story about price? It might help put things in perspective...',
    'אפשר לשתף סיפור קצר על מחיר? זה עשוי לעזור לשים דברים בפרספקטיבה...',
    'What matters most to you - saving money upfront, or making sure the job is done right the first time?',
    'מה הכי חשוב לך - לחסוך כסף מראש, או לוודא שהעבודה נעשית נכון בפעם הראשונה?',
    NULL,
    1
FROM mind_map_categories c WHERE c.name = 'Solution'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, story_type, setup_line, setup_line_he, closing_bridge, closing_bridge_he, product_type, order_index) 
SELECT 
    c.id,
    'story',
    'Military Tank Story',
    'סיפור טנק הצבא',
    'You know where this technology came from? The military. They needed to keep tanks and equipment cool in the desert without using extra fuel for AC. NASA helped develop this coating that reflects solar radiation. Now we''re bringing that same military-grade technology to your home. If it can keep a tank cool in the Iraqi desert, imagine what it''ll do for your house.',
    'אתה יודע מאיפה הטכנולוגיה הזו הגיעה? הצבא. הם היו צריכים לשמור על טנקים וציוד קרירים במדבר בלי להשתמש בדלק נוסף למזגן. נאס"א עזרה לפתח את הציפוי הזה שמחזיר קרינת שמש. עכשיו אנחנו מביאים את אותה טכנולוגיה ברמה צבאית לבית שלך. אם זה יכול לשמור על טנק קריר במדבר העיראקי, דמיין מה זה יעשה לבית שלך.',
    'customer_success',
    'Let me tell you something interesting about where this technology comes from...',
    'תן לי לספר לך משהו מעניין על מאיפה הטכנולוגיה הזו באה...',
    'Pretty cool, right? So your home gets the same protection as military equipment.',
    'די מגניב, נכון? אז הבית שלך מקבל את אותה הגנה כמו ציוד צבאי.',
    'cool_life',
    2
FROM mind_map_categories c WHERE c.name = 'Solution'
ON CONFLICT DO NOTHING;

-- =============================================
-- PRE-POPULATE NODES - CLOSING
-- =============================================

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, coaching_tips, order_index) 
SELECT 
    c.id,
    'script',
    'Trial Close - Understanding',
    'סגירת ניסיון - הבנה',
    'Does this make sense so far? Do you see how this could work for your situation?',
    'האם זה הגיוני עד כה? אתה רואה איך זה יכול לעבוד למצב שלך?',
    'Check understanding every 10-15 minutes',
    ARRAY['Use every 10-15 minutes', 'Listen carefully to response', 'Address concerns before continuing'],
    0
FROM mind_map_categories c WHERE c.name = 'Closing'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, order_index) 
SELECT 
    c.id,
    'script',
    'Trial Close - Scale',
    'סגירת ניסיון - סקאלה',
    'On a scale of 1 to 10, how well does this solution fit what you''re looking for?',
    'בסקאלה מ-1 עד 10, עד כמה הפתרון הזה מתאים למה שאתה מחפש?',
    'Get a number to know where you stand',
    1
FROM mind_map_categories c WHERE c.name = 'Closing'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, order_index) 
SELECT 
    c.id,
    'script',
    'Assumptive Close',
    'סגירה אסומפטיבית',
    'Great! Let''s get the paperwork started so we can lock in this pricing for you. Would you prefer to start the project next week or the week after?',
    'מעולה! בוא נתחיל עם הניירת כדי שנוכל לקבע את המחיר הזה עבורך. אתה מעדיף להתחיל את הפרויקט בשבוע הבא או בשבוע שאחריו?',
    'Assume the sale and move to logistics',
    2
FROM mind_map_categories c WHERE c.name = 'Closing'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, order_index) 
SELECT 
    c.id,
    'script',
    'Alternative Close',
    'סגירה חלופית',
    'Based on everything we discussed, would you prefer the standard package or the premium with the extended warranty?',
    'בהתבסס על כל מה שדיברנו, אתה מעדיף את החבילה הסטנדרטית או את הפרמיום עם האחריות המורחבת?',
    'Give two yeses to choose from',
    3
FROM mind_map_categories c WHERE c.name = 'Closing'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, order_index) 
SELECT 
    c.id,
    'script',
    'Isolation Close',
    'סגירת בידוד',
    'Other than [the objection they mentioned], is there anything else that would prevent you from moving forward today?',
    'מלבד [ההתנגדות שהזכירו], האם יש משהו אחר שימנע ממך להתקדם היום?',
    'Isolate the final concern',
    4
FROM mind_map_categories c WHERE c.name = 'Closing'
ON CONFLICT DO NOTHING;

INSERT INTO mind_map_nodes (category_id, node_type, title, title_he, content, content_he, short_content, order_index) 
SELECT 
    c.id,
    'script',
    'Summary Close',
    'סגירת סיכום',
    'Let me recap what we discussed: You''re dealing with [pain], which is costing you [cost]. Our solution will [benefit 1], [benefit 2], and [benefit 3]. With our financing, you can get started for just [payment]. Does that sound like a good fit?',
    'תן לי לסכם את מה שדיברנו: אתה מתמודד עם [כאב], שעולה לך [עלות]. הפתרון שלנו יגרום ל[יתרון 1], [יתרון 2], ו[יתרון 3]. עם המימון שלנו, אתה יכול להתחיל בסך הכל ב[תשלום]. נשמע מתאים?',
    'Recap value before asking for decision',
    5
FROM mind_map_categories c WHERE c.name = 'Closing'
ON CONFLICT DO NOTHING;
