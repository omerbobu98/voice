"""
Sales Call Analyzer - AI Sales Coach Agent
Comprehensive analysis of sales conversations with actionable insights
"""

import json
from openai import OpenAI

SALES_COACH_SYSTEM_PROMPT = """You are an elite AI Sales Coach with 20+ years of experience training top-performing sales teams at Fortune 500 companies. You have deep expertise in:

- MEDDIC, BANT, SPIN, and Challenger Sale methodologies
- Objection handling and negotiation tactics
- Conversation dynamics and emotional intelligence
- Sales psychology and buyer behavior

Your role is to analyze sales call transcripts and provide actionable, specific feedback that will help sales reps close more deals.

IMPORTANT GUIDELINES:
1. Be specific - reference exact quotes from the transcript
2. Be actionable - every suggestion should be implementable immediately
3. Be constructive - balance criticism with recognition of what was done well
4. Be quantitative - provide scores and metrics where possible
5. Focus on high-impact improvements that will directly affect close rates"""


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
    """Perform comprehensive AI analysis of the sales call."""
    
    analysis_prompt = f"""Analyze this sales call transcript and provide a comprehensive evaluation.

## TRANSCRIPT:
{transcript}

## CURRENT METRICS:
- Seller talk time: {metrics['talk_ratio']['seller_percentage']}%
- Buyer talk time: {metrics['talk_ratio']['buyer_percentage']}%
- Total duration: {metrics['total_duration_seconds']:.0f} seconds

## REQUIRED ANALYSIS (respond in valid JSON format):

{{
    "call_summary": {{
        "one_liner": "Brief one-sentence summary of what happened in the call",
        "outcome": "positive|neutral|negative - based on buyer engagement and next steps",
        "key_topics": ["list", "of", "main", "topics", "discussed"]
    }},
    
    "objections": [
        {{
            "timestamp": "MM:SS",
            "timestamp_ms": 0,
            "type": "price|timing|competition|authority|need|trust",
            "buyer_statement": "Exact quote from buyer",
            "seller_response": "How seller responded",
            "handling_score": 1-10,
            "better_response": "Suggested better way to handle this objection",
            "why_better": "Brief explanation of why this response would be more effective"
        }}
    ],
    
    "key_moments": [
        {{
            "timestamp": "MM:SS",
            "timestamp_ms": 0,
            "type": "positive|negative|missed_opportunity",
            "description": "What happened",
            "impact": "How this affected the call"
        }}
    ],
    
    "timeline_events": [
        {{
            "timestamp": "MM:SS",
            "timestamp_ms": 0,
            "type": "discovery_question|diagnose|closing_attempt|rapport_building|value_proposition|objection|pain_point|commitment|next_step",
            "speaker": "Seller|Buyer",
            "content": "The actual statement or question",
            "significance": "Brief note on why this moment matters"
        }}
    ],
    
    "meddic_score": {{
        "metrics": {{
            "score": 0-100,
            "evidence": "What was discussed about measurable outcomes",
            "missing": "What should have been asked"
        }},
        "economic_buyer": {{
            "score": 0-100,
            "evidence": "Evidence of decision-maker involvement",
            "missing": "What's needed"
        }},
        "decision_criteria": {{
            "score": 0-100,
            "evidence": "What evaluation criteria were discussed",
            "missing": "What should have been clarified"
        }},
        "decision_process": {{
            "score": 0-100,
            "evidence": "Understanding of buying process",
            "missing": "What's unclear"
        }},
        "identify_pain": {{
            "score": 0-100,
            "evidence": "Pain points discovered",
            "missing": "Deeper pains to uncover"
        }},
        "champion": {{
            "score": 0-100,
            "evidence": "Internal advocate identification",
            "missing": "Steps to develop champion"
        }},
        "total_score": 0-100
    }},
    
    "bant_score": {{
        "budget": {{
            "score": 0-100,
            "evidence": "Budget discussion",
            "qualified": true/false
        }},
        "authority": {{
            "score": 0-100,
            "evidence": "Decision authority",
            "qualified": true/false
        }},
        "need": {{
            "score": 0-100,
            "evidence": "Need establishment",
            "qualified": true/false
        }},
        "timeline": {{
            "score": 0-100,
            "evidence": "Timeline discussion",
            "qualified": true/false
        }},
        "total_score": 0-100,
        "overall_qualified": true/false
    }},
    
    "seller_performance": {{
        "overall_score": 0-100,
        "strengths": ["What seller did well"],
        "improvements": ["Specific areas to improve"],
        "talk_ratio_feedback": "Assessment of talk vs listen balance",
        "question_quality": "How effective were the discovery questions",
        "objection_handling": "Overall objection handling assessment",
        "next_steps_clarity": "Were clear next steps established"
    }},
    
    "coaching_suggestions": [
        {{
            "priority": "high|medium|low",
            "area": "discovery|objection_handling|closing|rapport|presentation",
            "current_behavior": "What the seller is doing now",
            "suggested_change": "Specific actionable improvement",
            "example_script": "Exact words they could use"
        }}
    ],
    
    "better_responses": [
        {{
            "timestamp": "MM:SS",
            "original_seller_statement": "What the seller actually said",
            "buyer_context": "What the buyer said/asked before this",
            "improved_response": "A better way to respond",
            "technique_used": "Name of sales technique (e.g., 'Feel-Felt-Found', 'Isolation', 'Reframe')",
            "expected_impact": "How this would improve the conversation"
        }}
    ],
    
    "next_steps_recommended": [
        "Action item 1 for follow-up",
        "Action item 2 for follow-up"
    ],
    
    "deal_risk_score": {{
        "score": 0-100,
        "risk_level": "low|medium|high",
        "risk_factors": ["List of concerning signals"],
        "positive_signals": ["List of encouraging signals"]
    }}
}}

IMPORTANT: 
- Provide SPECIFIC quotes from the transcript
- Be actionable and constructive
- Focus on high-impact improvements
- Return ONLY valid JSON, no markdown or explanation"""

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
            "call_summary": {"one_liner": "Analysis failed", "outcome": "unknown", "key_topics": []},
            "objections": [],
            "key_moments": [],
            "timeline_events": [],
            "meddic_score": {"total_score": 0},
            "bant_score": {"total_score": 0, "overall_qualified": False},
            "seller_performance": {"overall_score": 0, "strengths": [], "improvements": []},
            "coaching_suggestions": [],
            "better_responses": [],
            "next_steps_recommended": [],
            "deal_risk_score": {"score": 50, "risk_level": "medium", "risk_factors": [], "positive_signals": []}
        }
