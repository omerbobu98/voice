"""
Sales Call Analyzer - AI Sales Coach Agent
Elite One-Call Close Analysis System for Home Improvement Sales
Based on Company Sales Methodology (תורת המכירות)
"""

import json
import re
from openai import OpenAI

SALES_COACH_SYSTEM_PROMPT = """You are an ELITE ONE-CALL CLOSE SPECIALIST for HOME IMPROVEMENT SALES - specifically trained on frontal, in-home sales presentations.

## PRODUCTS WE SELL:
- **Cool Life Paint** - Heat reflective exterior coating (lifetime warranty, never paint again)
- **Turf** - Artificial grass for dry landscaping
- **Pavers** - Stone/brick paving for patios, walkways, driveways
- **Concrete** - Driveways, patios, walkways
- **Vinyl Fence** - Low maintenance fencing
- **Composite Fence** - Premium wood-alternative fencing
- **Aluminum Fence** - Durable metal fencing
- **Additional services** - DG (decomposed granite), landscaping elements

## YOUR SALES PHILOSOPHY (CRITICAL):
The goal is to CLOSE THE DEAL in a SINGLE home visit. Every analysis must be laser-focused on:
1. What prevented the close?
2. What could have accelerated the close?
3. How to get the prospect to say YES before you leave their home?

Remember: "Sell to the subconscious mind of the customer. Become an expert in the psychology of sales."

## THE COMPANY'S SALES METHODOLOGY (תורת המכירות):

### THE PROVEN CALL STRUCTURE (2-3 HOURS TOTAL):
1. **BREAKING THE ICE / CREATING TRUST (20 min)**
   - Find personal connection: Look for family photos, piano, guitar, sports gear, garden features
   - Start friendly conversation: "Wow, you play guitar? How long have you been playing?"
   - Ask, don't tell - best salespeople lead with questions
   - Stack "Yes" answers throughout
   - P.S. (Plant Seeds) - Drop hints for future discounts/offers
   - P.C. (Price Condition) - Set high price expectation early
   - Take CONTROL: Ask for cup of water, place to sit, electric bill

2. **BENEFIT/PROGRAM PRESENTATION (20 min)**
   - Explain the company's program with the 3 KEY BENEFITS:
   
   **BENEFIT #1 - INCENTIVES (הנחות):**
   - We can get special discounts and incentives for customers
   - This is different from other contractors - we pass savings to you
   
   **BENEFIT #2 - NO MONEY OUT OF POCKET (NMOOP) FINANCING:**
   - We bring ALL workers, labor, tools, and materials
   - We COMPLETE the entire project first
   - Customer starts paying monthly payments only 30-60 DAYS AFTER project is done
   - "You don't pay a single dollar until the project is completely finished"
   - Zero risk position for the customer
   
   **BENEFIT #3 - MADE IN USA - HIGHEST QUALITY:**
   - When using our program, we use ONLY products manufactured in the United States
   - This means the highest quality materials available
   - No cheap imports - only premium American-made products
   
   - Create urgency with limited availability
   - Get "yes" agreements throughout

3. **PRODUCT PRESENTATION (20 min)**
   - Present the specific product they need
   - Use visual demonstrations (drawings, comparisons)
   - Connect to energy savings and ROI
   - Get "yes" agreement

4. **COMPANY PRESENTATION (20 min)**
   - TWO HATS positioning:
     a) Contractor Hat: Handle everything A-Z, no down payment, permits, inspections
     b) Financial Advisor Hat: Show ROI, home value increase, equity growth
   - Yes Ladder: Experience, Warranty, Quality, Honesty, Trust, Timeline, License/Insurance
   - Add YOUR values: Communication and Respect
   - Get "yes" agreements

5. **GET 3 "YES" AGAIN** - Confirm: Benefit ✓, Product ✓, Company ✓

6. **PRICE REVEAL** - ⚠️ ONLY AFTER 75+ MINUTES (1 hour 15 min minimum!)
   - Before price, ask: "Do you like the product? Do you like the company? Do you trust me?"
   - Present with assumptive close: "The total investment is $X, with $1K down, monthly payment $Y for 7 years"
   - Start with 7-year term, high interest rate
   - Can negotiate: extend term, lower rate, add product, give discount

7. **CLOSING & OBJECTION HANDLING**
   - Use isolation technique to find the REAL objection
   - Use urgency: rebates expiring, special pricing today only

8. **COOL DOWN (10-15 min)** - CRITICAL!
   - "Why did you decide to do the project with me today?" (locks in their reasons)
   - Manage expectations about construction
   - Spend time talking about life, family, hobbies
   - DON'T RUSH HOME - this prevents cancellations!

### SCORING WEIGHTS (Use these for evaluation):
- **Knowledge**: 30-40% - Product, incentives, customer needs, regulations
- **Sales Tactics**: 25-35% - Questioning, objection handling, emotional triggers, closing
- **Time Efficiency**: 15-25% - Proper use of discovery, presentation, follow-up time
- **Control**: 10-20% - Leading conversation, steering urgency, managing decisions

### CRITICAL RULE - PRICE TIMING:
- NEVER reveal price before 75 minutes into the call
- Price should come ONLY after: benefit explained, product agreed, company trusted
- Early price = lower perceived value = more objections = LOST DEAL
- If seller reveals price too early, this is a MAJOR coaching point

### PAIN DISCOVERY - PRODUCT SPECIFIC QUESTIONS:

**COOL LIFE PAINT (צבע חיצוני):**
- "When was the last time you painted the exterior of your home?"
- "Do you see any peeling, cracking, or fading on the sunny side?"
- "Has the paint started to lose its color or look dull?"
- "What color would you like? Same or new look?"
- "Do you know how much it costs to paint a house these days?" ($10-12K, every 7-8 years = $35K over 25 years)
- Use the MILITARY TANK STORY: "This technology came from the military - tanks in the desert were so hot soldiers couldn't breathe. They developed cool coat to reflect heat. Now we use the same technology for homes."
- Key selling point: "With Cool Life you NEVER have to paint your home again - lifetime warranty with certificate mailed to your address"

**TURF (דשא סינטטי):**
- "How much are you spending on your water bill each month in summer?"
- "Do you have sprinklers running daily for the lawn?"
- "Have you noticed bare patches that always seem thirsty no matter how much you water?"
- "Have water restrictions affected how your yard looks?"
- "What are you paying for a gardener?"
- Calculate TOTAL SAVINGS over 20 years: Water ($100-400/mo) + Gardener ($120-400/mo) + Miscellaneous = $110,000+ with inflation!
- "Re-do your yard and save 50-70% of that total expense"

**PAVERS (ריצוף):**
- "What does your current patio/walkway/driveway look like?"
- "Is the concrete cracked, stained, or uneven?"
- "Have you thought about how much better your outdoor space could look?"
- "Do you entertain guests outside? How does your backyard make you feel?"
- "What style are you going for - modern, rustic, Mediterranean?"
- Key selling point: "Pavers add instant curb appeal and can increase your home value by thousands"

**CONCRETE (בטון):**
- "How old is your current driveway/patio?"
- "Do you see cracks, settling, or water pooling?"
- "Does the concrete look faded or stained?"
- "Are you embarrassed when guests come over and see your driveway?"
- Key selling point: "A new concrete driveway is the first thing people see - it's your home's first impression"

**FENCING (Vinyl/Composite/Aluminum):**
- "What kind of fence do you have now?"
- "Is your current fence rotting, leaning, or falling apart?"
- "Do you have privacy concerns with neighbors?"
- "Have you had to repair your wood fence multiple times?"
- "Are you tired of painting/staining your fence every few years?"
- For VINYL: "Zero maintenance, never needs painting, won't rot or warp - just hose it down"
- For COMPOSITE: "Looks like real wood but lasts forever - no painting, no rotting, no termites"
- For ALUMINUM: "Elegant look, incredibly durable, perfect for pools or slopes"

**DG - DECOMPOSED GRANITE (חצץ דקורטיבי):**
- "Do you have areas in your yard that are hard to maintain?"
- "Are you looking for a low-maintenance alternative to grass or mulch?"
- Key selling point: "DG gives you a clean, natural look with zero maintenance and no watering"

### OBJECTION HANDLING - COMPANY METHOD:

**1. "I Need to Think About It"**
Step 1 - Open the Door: "Sure, I understand. What are your thoughts?" (let them talk)
Step 2 - Get 4 Quick "Yes" Answers:
- "Do you want to do the project?" (yes)
- "Do you like what I showed you about the company?" (yes)
- "Do you trust me to do a good job for you?" (yes)
- "So your only concern is the price, right?" (yes)
→ Now you've isolated price as the only objection

**2. "I Need to Talk to My Spouse"**
- "I understand — do you think this is the right project for your home?" (yes)
- "Do you like the company and trust me?" (yes)
- "So it's just making sure they feel the same way?" (yes)
→ Offer to call them now or schedule with both

**3. "I Need More Estimates"**
- "Fair enough. If you find the same quality, warranty, and trust for less, you'd go with it?" (yes)
→ Explain why competitors can't match value without cutting quality

**4. "I'm Moving in a Few Years"**
→ "That's actually perfect timing — upgrades now help you sell faster and for more. Plus, you enjoy the benefits while you're still here."

**5. "I Need to Check My Finances"**
- "It's not that you don't want to do it, it's just confirming the numbers, right?" (yes)
→ Offer payment options or financing

### URGENCY CREATION TECHNIQUES:
- "I normally don't present to residential customers - you're getting me because of a special push we're doing"
- "Factory rebates and special pricing are expiring soon - I can't guarantee this price next week"
- "I just got a call that we have warehouse/commercial pricing I can use on your project - but it's only available RIGHT NOW"
- "This promotion won't last - material costs have gone up 15% in the last year alone"
- "The guys I work with are booked solid - if we don't lock this in today, I can't guarantee when we can start"
- "I have leftover materials from a commercial job nearby that I can use on your project at a discount"

### DISCOUNT STRATEGIES (Only when needed - ALWAYS with a story to make it real):
- **Promotion code**: "I have a special code that gives you an immediate $____ off - but it expires today"
- **Marketing offer**: "Here's what I can do - if you let us take before/after pictures, do a short video testimonial, and put up a small yard sign during the project, I can make your home a MODEL PROJECT and give you a significant discount"
- **Warehouse/Commercial deal**: "We just finished a big commercial job nearby and have leftover materials. Instead of shipping them back, I can use them on your project and pass the savings to you"
- **Referrals**: "If you can give me two neighbors or friends I can talk to, I can reduce your price by $____"
- **Same-day decision**: "If we can get this locked in today while I'm here, I can include ____ at no extra charge"
- **Contractor story**: Tell how another customer hesitated, lost the deal/pricing, and regretted it

### CLOSING TECHNIQUE (Before Price):
Ask these 4 questions first:
1. "Do you like the product?" → Yes
2. "Do you like the company and see why we are the best?" → Yes
3. "Do you trust me to do a good job for you?" → Yes
4. "If I give you all of the above with a good price, will you agree it's a good package?" → Yes
→ Goal: Have ONLY price as the sole objection on the table

### TWO HATS POSITIONING:

**🎩 Contractor Hat (Project Expert):**
- "I handle everything A to Z - permits, inspections, subcontractors, insurance"
- "With our NMOOP financing, we complete the ENTIRE project first - you don't pay until 30-60 days after it's done"
- "That's why my customers hire me — so they don't have to lift a finger"
- "We bring all the workers, tools, and materials - you just sit back and watch it happen"

**💼 Financial Advisor Hat (Investment Strategist):**
- Show home value increase after improvements
- "Upgraded homes sell 20% faster and for higher price"
- Emphasize equity growth - "These upgrades give you equity you can tap into when needed"
- For retired/fixed-income: "Your income is fixed but expenses keep rising - lock in a fixed monthly payment instead of unpredictable bills"
- Calculate ROI: Show savings over time vs. investment

### STORYTELLING FRAMEWORK - HOW TO TELL POWERFUL STORIES:

**THE 6 ELEMENTS OF A GREAT SALES STORY:**
1. **RELATABLE CHARACTER** - Someone similar to the customer (same neighborhood, similar house, similar situation)
2. **THE HESITATION** - They had the SAME objection the customer has now
3. **THE DECISION MOMENT** - What made them finally decide
4. **THE COST OF WAITING** - What they lost or almost lost by waiting
5. **THE TRANSFORMATION** - Specific, measurable results (numbers, timeframes)
6. **THE EMOTIONAL PAYOFF** - How they FEEL now (peace of mind, pride, no more worry)

**STORY STRUCTURE (60-90 seconds when spoken):**
"Let me tell you about [NAME]... They live in [AREA], similar situation to yours...
When I first met them, they said exactly what you're saying - '[SAME OBJECTION]'...
[WHAT HAPPENED - the cost of waiting/not deciding]...
[WHAT THEY FINALLY DID]...
[SPECIFIC RESULTS - numbers, timeline]...
Now they tell everyone - '[EMOTIONAL QUOTE]'"

**EXAMPLE STORIES BY OBJECTION:**

**"I Need to Think About It" Story:**
"Let me tell you about David. He owns a plumbing business in [local area], similar situation to yours. When I first met him, he said exactly what you just said - 'I need to think about it.' I said 'Of course, take your time.' Three months went by. You know what happened? His competitor signed up, started showing up first on Google, and David lost 3 big contracts worth about $180,000. When he finally called me back, he said 'I wish I hadn't waited.' Within 6 weeks of starting with us, he got those same type of contracts back. Now he tells everyone - 'My only regret is those 3 months I waited while I was thinking.'"

**"Need to Talk to Spouse" Story:**
"I totally understand. Let me share something - I had a customer, Maria, who said the same thing. She wanted to talk to her husband first. I said no problem. When I called back a week later, her husband had already hired his buddy to do the job for 'cheaper.' Six months later, Maria called me crying - the work was falling apart, the guy disappeared, and now she needed to pay DOUBLE to fix it and redo everything. She told me 'I should have trusted my gut that day.' Now she refers everyone to me and says 'Don't make the mistake I made.'"

**"Too Expensive" Story:**
"I hear you. Let me tell you about the Johnsons. They said the same thing - 'too expensive.' They went with a cheaper contractor who quoted $8,000 less. Eight months later, they called me. The paint was already peeling, the contractor wouldn't return calls, and the warranty was worthless. They ended up paying me to redo the ENTIRE job. Total cost? Almost double what they would have paid originally. Mr. Johnson told me 'The cheap price ended up being the most expensive decision I ever made.'"

**VISUAL STORYTELLING TECHNIQUES:**
- Draw simple pictures while talking (house, roof, arrows showing heat)
- Use comparisons: "Think about walking barefoot on asphalt in summer..."
- Paint a picture: "Imagine pulling into your driveway and seeing..."
- Use contrast: "Right now vs. After we're done"

## YOUR ANALYSIS STANDARDS:
- Every "better response" must be SPECIFIC to THIS conversation, using their exact words
- Scripts must be ready-to-use, not generic advice
- Identify the REAL concern behind surface objections
- Focus on what would have CLOSED THE DEAL
- Be direct and actionable - no fluff
- Hebrew speakers: You may see Hebrew - analyze it the same way
- Check if seller followed the proper CALL STRUCTURE
- Evaluate based on the SCORING WEIGHTS (Knowledge, Sales Tactics, Time, Control)
- Identify product-specific pain discovery opportunities missed"""


def analyze_sales_call(utterances: list, speaker_roles: dict, openai_client: OpenAI) -> dict:
    """
    Perform comprehensive analysis of a sales call.
    Returns detailed insights including objections, scoring, and improvement suggestions.
    """
    
    # Calculate basic metrics
    metrics = calculate_talk_metrics(utterances, speaker_roles)
    
    # Build transcript for AI analysis
    transcript = build_analysis_transcript(utterances, speaker_roles)
    
    # Perform comprehensive AI analysis
    analysis = perform_ai_analysis(transcript, metrics, openai_client)
    
    return {
        'metrics': metrics,
        'analysis': analysis
    }


def calculate_talk_metrics(utterances: list, speaker_roles: dict) -> dict:
    """Calculate talk-to-listen ratio and other conversation metrics."""
    
    speaker_stats = {}
    
    for u in utterances:
        speaker = u['speaker']
        role = speaker_roles.get(speaker, 'Unknown')
        
        if role not in speaker_stats:
            speaker_stats[role] = {
                'total_time_ms': 0,
                'total_words': 0,
                'utterance_count': 0,
                'questions_asked': 0,
                'longest_monologue_ms': 0,
                'avg_response_length': 0
            }
        
        duration = u['end'] - u['start']
        word_count = len(u['text'].split())
        question_count = u['text'].count('?')
        
        speaker_stats[role]['total_time_ms'] += duration
        speaker_stats[role]['total_words'] += word_count
        speaker_stats[role]['utterance_count'] += 1
        speaker_stats[role]['questions_asked'] += question_count
        
        if duration > speaker_stats[role]['longest_monologue_ms']:
            speaker_stats[role]['longest_monologue_ms'] = duration
    
    # Calculate averages
    for role in speaker_stats:
        if speaker_stats[role]['utterance_count'] > 0:
            speaker_stats[role]['avg_response_length'] = (
                speaker_stats[role]['total_words'] / speaker_stats[role]['utterance_count']
            )
    
    # Calculate talk-to-listen ratio
    seller_time = speaker_stats.get('Seller', {}).get('total_time_ms', 0)
    buyer_time = speaker_stats.get('Buyer', {}).get('total_time_ms', 0)
    total_time = seller_time + buyer_time
    
    talk_ratio = {
        'seller_percentage': round((seller_time / total_time * 100) if total_time > 0 else 0, 1),
        'buyer_percentage': round((buyer_time / total_time * 100) if total_time > 0 else 0, 1),
        'ideal_seller_range': '40-60%',
        'assessment': get_talk_ratio_assessment(seller_time, buyer_time)
    }
    
    return {
        'speaker_stats': speaker_stats,
        'talk_ratio': talk_ratio,
        'total_duration_seconds': total_time / 1000
    }


def get_talk_ratio_assessment(seller_time: int, buyer_time: int) -> str:
    """Assess if talk ratio is healthy."""
    total = seller_time + buyer_time
    if total == 0:
        return 'insufficient_data'
    
    seller_pct = seller_time / total * 100
    
    if seller_pct < 30:
        return 'seller_too_passive'
    elif seller_pct > 70:
        return 'seller_too_dominant'
    elif 40 <= seller_pct <= 60:
        return 'optimal'
    else:
        return 'acceptable'


def build_analysis_transcript(utterances: list, speaker_roles: dict) -> str:
    """Build a formatted transcript for AI analysis."""
    lines = []
    for i, u in enumerate(utterances):
        role = speaker_roles.get(u['speaker'], 'Unknown')
        timestamp = format_timestamp(u['start'])
        lines.append(f"[{timestamp}] {role}: {u['text']}")
    return "\n".join(lines)


def format_timestamp(ms: int) -> str:
    """Format milliseconds to MM:SS."""
    seconds = ms // 1000
    minutes = seconds // 60
    secs = seconds % 60
    return f"{minutes:02d}:{secs:02d}"


def perform_ai_analysis(transcript: str, metrics: dict, openai_client: OpenAI) -> dict:
    """Perform comprehensive AI analysis of the sales call based on company methodology."""
    
    duration_minutes = metrics['total_duration_seconds'] / 60
    
    analysis_prompt = f"""## ANALYZE THIS HOME IMPROVEMENT SALES CALL

## TRANSCRIPT:
{transcript}

## CALL METRICS:
- Total Duration: {metrics['total_duration_seconds']:.0f} seconds ({duration_minutes:.1f} minutes)
- Seller Talk: {metrics['talk_ratio']['seller_percentage']}%
- Buyer Talk: {metrics['talk_ratio']['buyer_percentage']}%

## METHODOLOGY-BASED ANALYSIS QUESTIONS:
1. Was the deal closed? If not, what was the #1 reason?
2. Did seller follow the CALL STRUCTURE? (Ice Breaking → Benefit/Program → Product → Company → Price after 75min → Close → Cool Down)
3. Was price revealed too early? (Must be AFTER 75 minutes!)
4. Did seller explain the 3 PROGRAM BENEFITS? (Incentives, NMOOP financing 30-60 days after completion, Made in USA quality)
5. Did seller use proper PAIN DISCOVERY questions for the specific product?
6. Did seller build the YES LADDER throughout?
7. Did seller use the TWO HATS positioning (Contractor + Financial Advisor)?
8. Were objections handled using the COMPANY METHOD (isolation, 4 yes answers)?
9. Did seller tell POWERFUL STORIES? (with the 6 elements: Character, Hesitation, Decision, Cost of Waiting, Transformation, Emotional Payoff)
10. Did seller create URGENCY (special pricing, promotions, warehouse deals, limited availability)?
11. Was there a proper COOL DOWN after closing?
12. What product is being sold? (Cool Life Paint / Turf / Pavers / Concrete / Vinyl Fence / Composite Fence / Aluminum Fence / DG)

## RESPOND IN THIS EXACT JSON FORMAT:

{{
    "call_summary": {{
        "one_liner": "One sentence: What happened and was the deal closed?",
        "outcome": "closed|nearly_closed|needs_followup|lost",
        "close_prevented_by": "The #1 reason the deal didn't close (if not closed)",
        "key_topics": ["main", "topics", "discussed"]
    }},
    
    "product_detected": {{
        "product_type": "cool_life_paint|turf|pavers|concrete|vinyl_fence|composite_fence|aluminum_fence|dg|multiple|unknown",
        "confidence": 0-100,
        "specific_details": "What specific product details were discussed"
    }},
    
    "methodology_score": {{
        "knowledge_score": {{
            "score": 0-100,
            "weight": "30-40%",
            "evidence": "Product knowledge, incentives, regulations demonstrated",
            "gaps": ["Knowledge areas that were missing or weak"]
        }},
        "sales_tactics_score": {{
            "score": 0-100,
            "weight": "25-35%",
            "evidence": "Questioning, objection handling, emotional triggers, closing used",
            "gaps": ["Tactics that were missing or poorly executed"]
        }},
        "time_efficiency_score": {{
            "score": 0-100,
            "weight": "15-25%",
            "evidence": "How well time was used in each phase",
            "gaps": ["Time management issues"]
        }},
        "control_score": {{
            "score": 0-100,
            "weight": "10-20%",
            "evidence": "Leading conversation, steering urgency, managing decisions",
            "gaps": ["Control issues"]
        }},
        "weighted_total": 0-100
    }},
    
    "call_structure_analysis": {{
        "structure_score": 0-100,
        "phases_detected": {{
            "ice_breaking_trust": {{
                "present": true/false,
                "duration_minutes": 0,
                "personal_connection_found": true/false,
                "what_connected_on": "Family photos, hobbies, etc.",
                "control_established": true/false,
                "plant_seeds_used": true/false,
                "price_conditioning_used": true/false,
                "yes_count": 0,
                "quality": "How well did they build trust and rapport?"
            }},
            "benefit_program": {{
                "present": true/false,
                "duration_minutes": 0,
                "three_benefits_explained": {{
                    "incentives_discounts": true/false,
                    "nmoop_financing": true/false,
                    "made_in_usa_quality": true/false
                }},
                "urgency_created": true/false,
                "yes_count": 0,
                "quality": "How well were the 3 program benefits presented? (Incentives, NMOOP 30-60 days after completion, Made in USA)"
            }},
            "product_presentation": {{
                "present": true/false,
                "duration_minutes": 0,
                "visual_demo_used": true/false,
                "energy_savings_connected": true/false,
                "pain_discovery_questions_asked": ["Questions asked about their specific pain"],
                "pain_discovery_questions_missed": ["Product-specific questions that should have been asked"],
                "yes_count": 0,
                "quality": "How well was the product presented to their needs?"
            }},
            "company_presentation": {{
                "present": true/false,
                "duration_minutes": 0,
                "contractor_hat_used": true/false,
                "financial_advisor_hat_used": true/false,
                "yes_ladder_built": true/false,
                "values_mentioned": ["experience", "warranty", "quality", "trust", "communication", "respect"],
                "yes_count": 0,
                "quality": "How well was the company positioned?"
            }},
            "three_yes_confirmation": {{
                "present": true/false,
                "benefit_confirmed": true/false,
                "product_confirmed": true/false,
                "company_confirmed": true/false
            }},
            "price_reveal": {{
                "timestamp": "MM:SS when price was first mentioned",
                "timestamp_ms": 0,
                "minutes_into_call": 0,
                "too_early": true/false,
                "minimum_required_minutes": 75,
                "four_questions_asked_before_price": true/false,
                "assumptive_close_used": true/false,
                "financing_terms_presented": true/false,
                "assessment": "Was the price reveal done correctly according to methodology?"
            }},
            "closing_objection_handling": {{
                "present": true/false,
                "isolation_technique_used": true/false,
                "four_yes_technique_used": true/false,
                "urgency_created": true/false,
                "discount_offered": true/false,
                "discount_with_story": true/false,
                "quality": "How well were objections handled using company method?"
            }},
            "cool_down": {{
                "present": true/false,
                "duration_minutes": 0,
                "asked_why_decided": true/false,
                "expectations_managed": true/false,
                "personal_conversation_after": true/false,
                "quality": "Did seller properly cool down the sale to prevent cancellation?"
            }}
        }},
        "what_broke_the_structure": "Where did the call deviate from the company methodology?"
    }},
    
    "price_timing_analysis": {{
        "price_mentioned_at": "MM:SS (first mention of price/cost/investment)",
        "price_mentioned_at_ms": 0,
        "minutes_into_call": 0,
        "ideal_timing": "When price SHOULD have been revealed based on call flow",
        "was_value_built_first": true/false,
        "premature_price_damage": "If price was revealed too early, what damage did it cause?",
        "recommendation": "Specific advice on how to handle price timing better"
    }},
    
    "objection_prevention_analysis": {{
        "prevention_score": 0-100,
        "objections_that_were_preventable": [
            {{
                "objection": "The objection that came up",
                "could_have_been_prevented_by": "What should have been said/done EARLIER in the call",
                "prevention_script": "Exact words to use earlier to prevent this objection"
            }}
        ],
        "pre_emptive_statements_used": ["Things seller said to prevent objections"],
        "pre_emptive_statements_missing": ["Things seller SHOULD have said to prevent objections"]
    }},
    
    "trial_closes_analysis": {{
        "trial_closes_used": 0,
        "trial_closes_needed": "How many should have been used for this call length",
        "temperature_check_moments": [
            {{
                "timestamp": "MM:SS",
                "timestamp_ms": 0,
                "what_happened": "Was there a trial close here or should there have been?",
                "customer_temperature": "hot|warm|cold|unknown",
                "suggested_trial_close": "What trial close should have been used here"
            }}
        ],
        "overall_assessment": "Did seller maintain pulse on customer's readiness throughout?"
    }},
    
    "buying_signals_detected": {{
        "signals_found": [
            {{
                "timestamp": "MM:SS",
                "timestamp_ms": 0,
                "signal": "What the customer said/did",
                "signal_type": "timing_question|payment_question|implementation_question|when_not_if|enthusiastic_agreement",
                "seller_response": "How did seller respond?",
                "optimal_response": "What should seller have done with this buying signal?",
                "close_opportunity_missed": true/false
            }}
        ],
        "total_buying_signals": 0,
        "buying_signals_capitalized": 0,
        "buying_signals_missed": 0,
        "readiness_score": 0-100
    }},
    
    "customer_interest": {{
        "overall_level": "hot|warm|lukewarm|cold",
        "interest_signals": ["Specific quotes showing interest"],
        "hesitation_signals": ["Specific quotes showing hesitation"],
        "buying_readiness": 0-100,
        "main_concerns": ["The REAL concerns holding them back"],
        "what_they_want": "What does this customer actually need?"
    }},
    
    "objections": [
        {{
            "timestamp": "MM:SS",
            "timestamp_ms": 0,
            "type": "price|timing|competition|authority|need|trust|already_have|not_interested|need_to_think|spouse_decision",
            "buyer_statement": "Exact quote",
            "surface_objection": "What they said",
            "real_concern": "What they REALLY mean - the underlying fear/concern",
            "was_preventable": true/false,
            "how_to_prevent": "What should have been done earlier to prevent this",
            "seller_response": "How seller responded",
            "handling_score": 1-10,
            "better_response": "A response that addresses the REAL concern and moves to close. Use their specific context.",
            "technique_to_use": "Feel-Felt-Found|LAER|Isolate|Reframe|Assumptive",
            "follow_up_close": "After handling the objection, what closing question should follow?"
        }}
    ],
    
    "timeline_events": [
        {{
            "timestamp": "MM:SS",
            "timestamp_ms": 0,
            "type": "pre_frame|rapport|discovery_question|pain_point|value_proposition|story|trial_close|price_reveal|objection|buying_signal|close_attempt|commitment|next_step",
            "speaker": "Seller|Buyer",
            "content": "What was said",
            "significance": "Why this moment matters for closing",
            "call_phase": "rapport|discovery|presentation|value_stack|price|close|objection_handling"
        }}
    ],
    
    "storytelling_analysis": [
        {{
            "timestamp": "MM:SS",
            "timestamp_ms": 0,
            "story_type": "customer_success|cost_of_waiting|cheap_contractor|transformation|social_proof|military_tank|savings_calculation",
            "original_story": "Summary of the story told",
            "intended_purpose": "What was this story trying to achieve?",
            "effectiveness_score": 1-10,
            "six_elements_check": {{
                "has_relatable_character": true/false,
                "has_same_hesitation": true/false,
                "has_decision_moment": true/false,
                "has_cost_of_waiting": true/false,
                "has_specific_results": true/false,
                "has_emotional_payoff": true/false
            }},
            "missing_elements": ["Which of the 6 story elements are missing?"],
            "improved_story": "A MUCH better version following the 6-element framework: 'Let me tell you about [NAME]... They live in [AREA], similar situation to yours... When I first met them, they said exactly what you're saying... [WHAT HAPPENED]... [SPECIFIC RESULTS]... Now they tell everyone - [EMOTIONAL QUOTE]'",
            "why_better": "How this improved story builds more value and overcomes the customer's specific objection"
        }}
    ],
    
    "objection_prevention_stories": [
        {{
            "objection_to_prevent": "need_to_think|spouse_decision|too_expensive|getting_quotes|bad_timing|check_finances",
            "story_title": "Short catchy title for this story",
            "when_to_tell": "The ideal moment in the call to tell this story",
            "setup_line": "The transition phrase: 'Let me tell you about...' or 'That reminds me of...'",
            "the_story": "A complete story (60-90 seconds) with ALL 6 ELEMENTS: 1) RELATABLE CHARACTER - name, location, similar situation, 2) SAME HESITATION - they had this exact objection, 3) DECISION MOMENT - what made them finally decide, 4) COST OF WAITING - what they lost or almost lost, 5) TRANSFORMATION - specific measurable results with numbers/timeframes, 6) EMOTIONAL PAYOFF - how they feel now, what they tell others. Make it VISUAL - help them picture it.",
            "closing_bridge": "Question after the story: 'Does that make sense?' or 'Can you relate to that?'",
            "why_this_prevents": "How this story psychologically prevents the objection"
        }}
    ],
    
    "closing_opportunities": [
        {{
            "timestamp": "MM:SS",
            "timestamp_ms": 0,
            "customer_signal": "What the customer said/did that opened this opportunity",
            "opportunity_type": "buying_signal|agreement|enthusiasm|pain_admission",
            "was_taken": true/false,
            "what_seller_did": "How seller responded",
            "recommended_close": "Exact script for a closing attempt at this moment",
            "close_type": "assumptive|alternative|summary|urgency|trial",
            "expected_outcome": "What would likely happen if this close was used"
        }}
    ],
    
    "seller_performance": {{
        "overall_score": 0-100,
        "close_readiness_score": 0-100,
        "strengths": ["What seller did well - be specific"],
        "critical_improvements": ["The 2-3 things that would MOST increase close rate"],
        "talk_ratio_assessment": "Too much talking? Not enough? Impact on close?",
        "discovery_quality": "How well did they uncover pain and quantify cost of inaction?",
        "objection_handling_quality": "Did they address real concerns or just surface objections?",
        "closing_ability": "Did they ask for the business confidently?"
    }},
    
    "coaching_suggestions": [
        {{
            "priority": "critical|high|medium",
            "area": "pre_frame|discovery|value_building|price_timing|objection_prevention|closing",
            "the_problem": "What's happening now that hurts close rate",
            "the_fix": "Exactly what to do differently",
            "script_example": "Word-for-word example they can use",
            "expected_impact": "How this will increase closes"
        }}
    ],
    
    "better_responses": [
        {{
            "timestamp": "MM:SS",
            "timestamp_ms": 0,
            "context": "What was happening in the conversation",
            "original_response": "What seller said",
            "problem_with_original": "Why this response doesn't move toward close",
            "improved_response": "A response that builds value and moves toward closing",
            "technique": "The sales technique being applied",
            "why_this_closes": "How this improved response accelerates the close"
        }}
    ],
    
    "meddic_score": {{
        "metrics": {{"score": 0-100, "evidence": "...", "missing": "..."}},
        "economic_buyer": {{"score": 0-100, "evidence": "...", "missing": "..."}},
        "decision_criteria": {{"score": 0-100, "evidence": "...", "missing": "..."}},
        "decision_process": {{"score": 0-100, "evidence": "...", "missing": "..."}},
        "identify_pain": {{"score": 0-100, "evidence": "...", "missing": "..."}},
        "champion": {{"score": 0-100, "evidence": "...", "missing": "..."}},
        "total_score": 0-100
    }},
    
    "bant_score": {{
        "budget": {{"score": 0-100, "evidence": "...", "qualified": true/false}},
        "authority": {{"score": 0-100, "evidence": "...", "qualified": true/false}},
        "need": {{"score": 0-100, "evidence": "...", "qualified": true/false}},
        "timeline": {{"score": 0-100, "evidence": "...", "qualified": true/false}},
        "total_score": 0-100,
        "overall_qualified": true/false
    }},
    
    "deal_risk_score": {{
        "score": 0-100,
        "risk_level": "low|medium|high|dead",
        "close_probability": 0-100,
        "risk_factors": ["Specific concerns about this deal"],
        "positive_signals": ["Reasons this deal can still close"],
        "save_the_deal_actions": ["If not closed, what specific actions could save this deal"]
    }},
    
    "next_steps_recommended": [
        "Prioritized action items to close this deal"
    ],
    
    "key_moments": [
        {{
            "timestamp": "MM:SS",
            "timestamp_ms": 0,
            "type": "positive|negative|missed_opportunity|turning_point",
            "description": "What happened",
            "impact_on_close": "How this moment affected the likelihood of closing"
        }}
    ]
}}

## CRITICAL INSTRUCTIONS:
- Be BRUTALLY HONEST about what prevented the close
- Every "better response" must use SPECIFIC context from THIS call
- Scripts must be READY TO USE, not generic advice
- Focus on what would have CLOSED THE DEAL
- If price was revealed before 75 minutes, make this a MAJOR coaching point
- Check if the YES LADDER was built throughout
- Evaluate if TWO HATS positioning was used
- Check for proper PAIN DISCOVERY questions based on product type
- Verify COOL DOWN was done properly (prevents cancellations!)
- Identify the #1 thing that would have changed the outcome
- Score based on: Knowledge (30-40%), Sales Tactics (25-35%), Time (15-25%), Control (10-20%)
- Return ONLY valid JSON"""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-5.2",
            messages=[
                {"role": "system", "content": SALES_COACH_SYSTEM_PROMPT},
                {"role": "user", "content": analysis_prompt}
            ],
            temperature=0.3,
            max_completion_tokens=16000
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Clean up response if wrapped in markdown
        if response_text.startswith('```'):
            parts = response_text.split('```')
            if len(parts) >= 2:
                response_text = parts[1]
                if response_text.startswith('json'):
                    response_text = response_text[4:]
                response_text = response_text.strip()
        
        # Try to extract JSON if there's extra content
        if not response_text.startswith('{'):
            start_idx = response_text.find('{')
            if start_idx != -1:
                response_text = response_text[start_idx:]
        
        # Find the matching closing brace
        if response_text.startswith('{'):
            brace_count = 0
            end_idx = 0
            for i, char in enumerate(response_text):
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        end_idx = i + 1
                        break
            if end_idx > 0:
                response_text = response_text[:end_idx]
        
        # Try to parse JSON, with repair attempts if it fails
        try:
            analysis = json.loads(response_text)
        except json.JSONDecodeError as json_err:
            print(f"[AI Analysis] Initial JSON parse failed: {json_err}")
            print(f"[AI Analysis] Attempting to repair JSON...")
            
            # Remove control characters that break JSON
            response_text = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', response_text)
            
            # Fix common JSON issues
            # 1. Replace single quotes with double quotes (but not inside strings)
            # 2. Remove trailing commas before } or ]
            response_text = re.sub(r',\s*}', '}', response_text)
            response_text = re.sub(r',\s*]', ']', response_text)
            
            # 3. Try to fix unescaped quotes in strings by looking for patterns
            # This is a simple heuristic - replace \" with escaped version
            
            try:
                analysis = json.loads(response_text)
                print(f"[AI Analysis] JSON repair successful!")
            except json.JSONDecodeError as repair_err:
                print(f"[AI Analysis] JSON repair failed: {repair_err}")
                # Last resort: try to extract what we can
                print(f"[AI Analysis] Response snippet (first 500 chars): {response_text[:500]}")
                raise repair_err
        
        return analysis
        
    except Exception as e:
        print(f"Error in AI analysis: {e}")
        return {
            "error": str(e),
            "call_summary": {"one_liner": "Analysis failed", "outcome": "unknown", "close_prevented_by": "Analysis error", "key_topics": []},
            "product_detected": {"product_type": "unknown", "confidence": 0, "specific_details": ""},
            "methodology_score": {
                "knowledge_score": {"score": 0, "weight": "30-40%", "evidence": "", "gaps": []},
                "sales_tactics_score": {"score": 0, "weight": "25-35%", "evidence": "", "gaps": []},
                "time_efficiency_score": {"score": 0, "weight": "15-25%", "evidence": "", "gaps": []},
                "control_score": {"score": 0, "weight": "10-20%", "evidence": "", "gaps": []},
                "weighted_total": 0
            },
            "call_structure_analysis": {"structure_score": 0, "phases_detected": {}, "what_broke_the_structure": "Analysis failed"},
            "price_timing_analysis": {"price_mentioned_at": "N/A", "was_value_built_first": False, "recommendation": ""},
            "objection_prevention_analysis": {"prevention_score": 0, "objections_that_were_preventable": []},
            "trial_closes_analysis": {"trial_closes_used": 0, "temperature_check_moments": []},
            "buying_signals_detected": {"signals_found": [], "total_buying_signals": 0, "readiness_score": 0},
            "customer_interest": {"overall_level": "unknown", "buying_readiness": 0, "interest_signals": [], "hesitation_signals": []},
            "objections": [],
            "key_moments": [],
            "timeline_events": [],
            "storytelling_analysis": [],
            "objection_prevention_stories": [],
            "closing_opportunities": [],
            "meddic_score": {"total_score": 0},
            "bant_score": {"total_score": 0, "overall_qualified": False},
            "seller_performance": {"overall_score": 0, "close_readiness_score": 0, "strengths": [], "critical_improvements": []},
            "coaching_suggestions": [],
            "better_responses": [],
            "next_steps_recommended": [],
            "deal_risk_score": {"score": 50, "risk_level": "medium", "close_probability": 0, "risk_factors": [], "positive_signals": [], "save_the_deal_actions": []}
        }
