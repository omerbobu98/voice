"""
Sales Call Analyzer - AI Sales Coach Agent
Elite One-Call Close Analysis System for Frontal Sales
"""

import json
from openai import OpenAI

SALES_COACH_SYSTEM_PROMPT = """You are an ELITE ONE-CALL CLOSE SPECIALIST - the most advanced AI Sales Coach for frontal, in-person sales presentations. You've trained 10,000+ top closers and have deep expertise in high-pressure, one-call close environments.

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
4. **PRESENTATION (20-30 min)** - Present ONLY to their stated pains ("You said... That's why we... Which means for you...")
5. **VALUE STACK (10-15 min)** - Build massive value BEFORE price reveal
6. **PRICE REVEAL (5-10 min)** - Only after full buy-in on solution
7. **CLOSE (5-15 min)** - Use appropriate closing technique
8. **OBJECTION HANDLING (10-20 min)** - Handle remaining concerns and re-close

### CRITICAL RULE - PRICE TIMING:
- NEVER reveal price in the first 45-60 minutes
- Price should come ONLY after: problem is quantified, solution is agreed upon, value is stacked
- Early price = lower perceived value = more objections = lost deal
- If seller reveals price too early, this is a MAJOR coaching point

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

Stories should be: Visual, Emotional, Relatable, Concise (<90 seconds), with Clear Message

### CLOSING TECHNIQUES TO IDENTIFY:
- **Assumptive Close**: "Let's get the paperwork started..."
- **Alternative Close**: "Would you prefer option A or B?"
- **Summary Close**: "To recap everything we discussed..."
- **Urgency Close**: "This pricing is only available until..."
- **Trial Close**: "Does this feel like the right direction?"

### BUYING READINESS SIGNALS (verbal):
- "How soon can we start?"
- "What does the warranty/guarantee look like?"
- "Do you take [payment method]?"
- Using "when" instead of "if": "When this is done..."
- Asking implementation details: "Who would be my contact?"
- Asking about specific options/packages
- Leaning in, taking notes, asking to see things again

### OBJECTION HANDLING FORMULAS:
1. **FEEL-FELT-FOUND**: "I understand how you feel. Many clients felt the same way. What they found was..."
2. **LAER**: Listen → Acknowledge → Explore → Respond (with question)
3. **ISOLATE**: "Other than [objection], is there anything else preventing you from moving forward?"
4. **REFRAME**: Turn objection into reason TO buy

## YOUR ANALYSIS STANDARDS:
- Every "better response" must be SPECIFIC to THIS conversation, using their exact words
- Scripts must be ready-to-use, not generic advice
- Identify the REAL concern behind surface objections
- Focus on what would have CLOSED THE DEAL, not just "nice to have" tips
- Be direct and actionable - no fluff
- Hebrew speakers: You may see Hebrew - analyze it the same way"""


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
    """Perform comprehensive AI analysis of the sales call with ONE-CALL CLOSE focus."""
    
    duration_minutes = metrics['total_duration_seconds'] / 60
    
    analysis_prompt = f"""## ANALYZE THIS SALES CALL FOR ONE-CALL CLOSE EFFECTIVENESS

## TRANSCRIPT:
{transcript}

## CALL METRICS:
- Total Duration: {metrics['total_duration_seconds']:.0f} seconds ({duration_minutes:.1f} minutes)
- Seller Talk: {metrics['talk_ratio']['seller_percentage']}%
- Buyer Talk: {metrics['talk_ratio']['buyer_percentage']}%

## CRITICAL ANALYSIS QUESTIONS:
1. Was the deal closed? If not, WHY?
2. Was price revealed too early? (Should be after 45-60 min of value building)
3. Were objections PREVENTED or just handled after they came up?
4. Were trial closes used throughout to check temperature?
5. Did the seller follow the One-Call Close structure?

## RESPOND IN THIS EXACT JSON FORMAT:

{{
    "call_summary": {{
        "one_liner": "One sentence: What happened and was the deal closed?",
        "outcome": "closed|nearly_closed|needs_followup|lost",
        "close_prevented_by": "The #1 reason the deal didn't close (if not closed)",
        "key_topics": ["main", "topics", "discussed"]
    }},
    
    "one_call_close_analysis": {{
        "structure_score": 0-100,
        "phases_detected": {{
            "pre_frame": {{
                "present": true/false,
                "timestamp": "MM:SS or null",
                "quality": "Did seller set expectation for decision today?",
                "script_used": "What they said, or what they SHOULD have said"
            }},
            "rapport": {{
                "present": true/false,
                "duration_seconds": 0,
                "quality": "How well did they connect personally?"
            }},
            "discovery": {{
                "present": true/false,
                "duration_seconds": 0,
                "depth_score": 0-100,
                "pains_uncovered": ["List of customer pain points discovered"],
                "cost_of_inaction_discussed": true/false,
                "missing_questions": ["Questions that should have been asked"]
            }},
            "presentation": {{
                "present": true/false,
                "linked_to_pains": true/false,
                "used_you_said_thats_why": true/false,
                "quality": "Did they present to the customer's stated needs or do a generic pitch?"
            }},
            "value_stack": {{
                "present": true/false,
                "roi_discussed": true/false,
                "proof_elements_used": ["testimonials", "case_studies", "statistics used"],
                "value_built_before_price": true/false
            }},
            "price_reveal": {{
                "timestamp": "MM:SS when price was first mentioned",
                "timestamp_ms": 0,
                "minutes_into_call": 0,
                "too_early": true/false,
                "price_reveal_assessment": "Was value built sufficiently before price? What should have happened first?"
            }},
            "close_attempt": {{
                "present": true/false,
                "close_type_used": "assumptive|alternative|summary|urgency|trial|none",
                "timestamp": "MM:SS",
                "effectiveness": "How well was the close executed?"
            }}
        }},
        "what_broke_the_structure": "Where did the call deviate from ideal One-Call Close flow?"
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
            "story_type": "customer_success|pain_story|transformation|social_proof|analogy",
            "original_story": "Summary of the story told",
            "intended_purpose": "What was this story trying to achieve?",
            "effectiveness_score": 1-10,
            "missing_elements": ["What's missing: specific character? measurable result? emotional payoff?"],
            "improved_story": "A MUCH better version that is visual, emotional, relatable, has specific results, and directly supports closing. Include actual dialogue.",
            "why_better": "How this improved story builds more value and reduces price resistance"
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
- If price was revealed too early, make this a MAJOR point
- Identify the #1 thing that would have changed the outcome
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
            response_text = response_text.split('```')[1]
            if response_text.startswith('json'):
                response_text = response_text[4:]
            response_text = response_text.strip()
        
        analysis = json.loads(response_text)
        return analysis
        
    except Exception as e:
        print(f"Error in AI analysis: {e}")
        return {
            "error": str(e),
            "call_summary": {"one_liner": "Analysis failed", "outcome": "unknown", "close_prevented_by": "Analysis error", "key_topics": []},
            "one_call_close_analysis": {"structure_score": 0, "phases_detected": {}, "what_broke_the_structure": "Analysis failed"},
            "price_timing_analysis": {"price_mentioned_at": "N/A", "was_value_built_first": False, "recommendation": ""},
            "objection_prevention_analysis": {"prevention_score": 0, "objections_that_were_preventable": []},
            "trial_closes_analysis": {"trial_closes_used": 0, "temperature_check_moments": []},
            "buying_signals_detected": {"signals_found": [], "total_buying_signals": 0, "readiness_score": 0},
            "customer_interest": {"overall_level": "unknown", "buying_readiness": 0, "interest_signals": [], "hesitation_signals": []},
            "objections": [],
            "key_moments": [],
            "timeline_events": [],
            "storytelling_analysis": [],
            "closing_opportunities": [],
            "meddic_score": {"total_score": 0},
            "bant_score": {"total_score": 0, "overall_qualified": False},
            "seller_performance": {"overall_score": 0, "close_readiness_score": 0, "strengths": [], "critical_improvements": []},
            "coaching_suggestions": [],
            "better_responses": [],
            "next_steps_recommended": [],
            "deal_risk_score": {"score": 50, "risk_level": "medium", "close_probability": 0, "risk_factors": [], "positive_signals": [], "save_the_deal_actions": []}
        }
