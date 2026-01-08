"""
PDF Report Generator for Sales Call Analysis
Clean, Minimal, Professional Design - Inspired by Gong, Chorus, Salesforce
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from io import BytesIO
from datetime import datetime
import re


def clean_text(text):
    """Remove emojis and special characters that reportlab can't handle"""
    if not text:
        return ""
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"
        u"\U0001F300-\U0001F5FF"
        u"\U0001F680-\U0001F6FF"
        u"\U0001F1E0-\U0001F1FF"
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        u"\U0001f926-\U0001f937"
        u"\U00010000-\U0010ffff"
        u"\u2640-\u2642"
        u"\u2600-\u2B55"
        u"\u200d"
        u"\u23cf"
        u"\u23e9"
        u"\u231a"
        u"\ufe0f"
        u"\u3030"
        "]+", flags=re.UNICODE)
    return emoji_pattern.sub('', str(text))


# Minimal Professional Color Palette - Single Accent Color
PRIMARY = colors.HexColor('#1a1a2e')       # Dark navy - headers
ACCENT = colors.HexColor('#4f46e5')        # Indigo - single accent color
TEXT_PRIMARY = colors.HexColor('#111827')   # Almost black - main text
TEXT_SECONDARY = colors.HexColor('#6b7280') # Gray - secondary text
TEXT_MUTED = colors.HexColor('#9ca3af')     # Light gray - captions
BORDER = colors.HexColor('#e5e7eb')         # Light border
BG_LIGHT = colors.HexColor('#f9fafb')       # Very light gray background
SUCCESS = colors.HexColor('#059669')        # Green for positive
WARNING = colors.HexColor('#d97706')        # Orange for warning
DANGER = colors.HexColor('#dc2626')         # Red for negative/high risk


def create_styles():
    """Create clean, minimal paragraph styles"""
    styles = getSampleStyleSheet()
    
    # Main Title
    styles.add(ParagraphStyle(
        name='MainTitle',
        fontSize=28,
        textColor=PRIMARY,
        fontName='Helvetica-Bold',
        spaceAfter=6,
        leading=34
    ))
    
    # Subtitle
    styles.add(ParagraphStyle(
        name='Subtitle',
        fontSize=12,
        textColor=TEXT_SECONDARY,
        fontName='Helvetica',
        spaceAfter=20,
        leading=16
    ))
    
    # Section Header
    styles.add(ParagraphStyle(
        name='SectionHeader',
        fontSize=14,
        textColor=PRIMARY,
        fontName='Helvetica-Bold',
        spaceBefore=20,
        spaceAfter=10,
        leading=18
    ))
    
    # Subsection Header
    styles.add(ParagraphStyle(
        name='SubHeader',
        fontSize=11,
        textColor=TEXT_PRIMARY,
        fontName='Helvetica-Bold',
        spaceBefore=12,
        spaceAfter=6,
        leading=14
    ))
    
    # Body Text
    styles['BodyText'].fontSize = 10
    styles['BodyText'].textColor = TEXT_PRIMARY
    styles['BodyText'].leading = 14
    styles['BodyText'].spaceAfter = 6
    
    # Quote/Highlight
    styles.add(ParagraphStyle(
        name='Quote',
        fontSize=10,
        textColor=TEXT_SECONDARY,
        fontName='Helvetica-Oblique',
        leftIndent=12,
        spaceAfter=6,
        leading=14
    ))
    
    # Caption
    styles.add(ParagraphStyle(
        name='Caption',
        fontSize=8,
        textColor=TEXT_MUTED,
        fontName='Helvetica',
        spaceAfter=4,
        leading=10
    ))
    
    # Metric Value
    styles.add(ParagraphStyle(
        name='MetricValue',
        fontSize=24,
        textColor=PRIMARY,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        leading=28
    ))
    
    # Metric Label
    styles.add(ParagraphStyle(
        name='MetricLabel',
        fontSize=8,
        textColor=TEXT_MUTED,
        fontName='Helvetica',
        alignment=TA_CENTER,
        leading=10
    ))
    
    return styles


def add_header(canvas, doc):
    """Minimal header with thin accent line"""
    canvas.saveState()
    
    # Thin accent line at very top
    canvas.setStrokeColor(ACCENT)
    canvas.setLineWidth(2)
    canvas.line(0, A4[1] - 2, A4[0], A4[1] - 2)
    
    # Logo/Brand
    canvas.setFont('Helvetica-Bold', 9)
    canvas.setFillColor(TEXT_PRIMARY)
    canvas.drawString(50, A4[1] - 30, "SalesAI")
    
    # Page number
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawRightString(A4[0] - 50, A4[1] - 30, f"{doc.page}")
    
    canvas.restoreState()


def add_footer(canvas, doc):
    """Minimal footer"""
    canvas.saveState()
    
    # Footer line
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(50, 35, A4[0] - 50, 35)
    
    # Footer text
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(50, 22, datetime.now().strftime('%B %d, %Y'))
    canvas.drawRightString(A4[0] - 50, 22, "Confidential")
    
    canvas.restoreState()


def get_score_color(score, is_risk=False):
    """Get color based on score value"""
    if is_risk:
        if score >= 7 or str(score).upper() == 'HIGH':
            return DANGER
        elif score >= 4 or str(score).upper() == 'MEDIUM':
            return WARNING
        return SUCCESS
    else:
        if score >= 7:
            return SUCCESS
        elif score >= 4:
            return WARNING
        return DANGER


def create_metric_box(value, label, color=PRIMARY):
    """Create a clean metric display"""
    data = [
        [Paragraph(f"<font color='{color.hexval()}'>{value}</font>", 
                   ParagraphStyle('mv', fontSize=22, fontName='Helvetica-Bold', alignment=TA_CENTER))],
        [Paragraph(label, ParagraphStyle('ml', fontSize=8, textColor=TEXT_MUTED, alignment=TA_CENTER))]
    ]
    
    table = Table(data, colWidths=[100])
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (0, 0), 12),
        ('BOTTOMPADDING', (0, 1), (0, 1), 8),
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
    ]))
    return table


def generate_analysis_pdf(analysis_data: dict, transcription_data: dict = None) -> BytesIO:
    """Generate a clean, professional PDF report"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=50,
        bottomMargin=50
    )
    
    styles = create_styles()
    story = []
    
    analysis = analysis_data.get('analysis', {})
    
    # ==================== COVER PAGE ====================
    story.append(Spacer(1, 40))
    
    # Title
    story.append(Paragraph("Call Analysis Report", styles['MainTitle']))
    
    # Summary line
    if analysis.get('call_summary'):
        summary = analysis['call_summary']
        one_liner = clean_text(summary.get('one_liner', ''))
        if one_liner:
            story.append(Paragraph(one_liner, styles['Subtitle']))
    
    story.append(Spacer(1, 30))
    
    # Key Metrics Row
    overall_score = analysis.get('seller_performance', {}).get('overall_score', 0)
    meddic_score = analysis.get('meddic_score', {}).get('total_score', 0)
    risk_level = analysis.get('deal_risk_score', {}).get('risk_level', 'unknown')
    buying_ready = analysis.get('customer_interest', {}).get('buying_readiness', 0)
    
    metrics_data = [[
        create_metric_box(str(overall_score), "PERFORMANCE", get_score_color(overall_score)),
        create_metric_box(f"{meddic_score}%", "MEDDIC SCORE", ACCENT),
        create_metric_box(f"{buying_ready}%", "BUYING READINESS", get_score_color(buying_ready)),
        create_metric_box(risk_level.upper() if risk_level else "N/A", "RISK LEVEL", 
                         get_score_color(0, is_risk=True) if risk_level == 'low' else 
                         get_score_color(5, is_risk=True) if risk_level == 'medium' else 
                         get_score_color(8, is_risk=True))
    ]]
    
    metrics_table = Table(metrics_data, colWidths=[120, 120, 120, 120])
    metrics_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(metrics_table)
    
    story.append(Spacer(1, 30))
    
    # Report Info
    story.append(HRFlowable(width="100%", thickness=0.5, color=BORDER))
    story.append(Spacer(1, 10))
    
    info_data = [
        [Paragraph("<b>Generated</b>", ParagraphStyle('info', fontSize=8, textColor=TEXT_MUTED)),
         Paragraph("<b>Classification</b>", ParagraphStyle('info', fontSize=8, textColor=TEXT_MUTED))],
        [Paragraph(datetime.now().strftime('%B %d, %Y at %H:%M'), ParagraphStyle('info_val', fontSize=9, textColor=TEXT_PRIMARY)),
         Paragraph("Confidential", ParagraphStyle('info_val', fontSize=9, textColor=TEXT_PRIMARY))]
    ]
    info_table = Table(info_data, colWidths=[240, 240])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(info_table)
    
    story.append(PageBreak())
    
    # ==================== EXECUTIVE SUMMARY ====================
    story.append(Paragraph("Executive Summary", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
    story.append(Spacer(1, 10))
    
    if analysis.get('call_summary'):
        summary = analysis['call_summary']
        
        # Outcome
        outcome = summary.get('outcome', 'unknown')
        outcome_color = SUCCESS if outcome == 'positive' else WARNING if outcome == 'neutral' else DANGER
        story.append(Paragraph(f"<b>Call Outcome:</b> <font color='{outcome_color.hexval()}'>{outcome.upper()}</font>", 
                              styles['BodyText']))
        story.append(Spacer(1, 8))
        
        # One liner
        if summary.get('one_liner'):
            story.append(Paragraph(clean_text(summary['one_liner']), styles['BodyText']))
            story.append(Spacer(1, 8))
        
        # Key topics
        if summary.get('key_topics'):
            topics = [clean_text(t) for t in summary['key_topics'][:5]]
            story.append(Paragraph(f"<b>Key Topics:</b> {' | '.join(topics)}", styles['BodyText']))
    
    # ==================== CUSTOMER INTEREST ====================
    if analysis.get('customer_interest'):
        story.append(Spacer(1, 15))
        story.append(Paragraph("Customer Interest", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
        story.append(Spacer(1, 10))
        
        ci = analysis['customer_interest']
        
        # Interest metrics
        interest_data = [
            [Paragraph("Interest Level", ParagraphStyle('h', fontSize=9, textColor=TEXT_MUTED, alignment=TA_CENTER)),
             Paragraph("Buying Readiness", ParagraphStyle('h', fontSize=9, textColor=TEXT_MUTED, alignment=TA_CENTER))],
            [Paragraph(f"<b>{ci.get('overall_level', 'Unknown').upper()}</b>", 
                      ParagraphStyle('v', fontSize=16, textColor=ACCENT, alignment=TA_CENTER, fontName='Helvetica-Bold')),
             Paragraph(f"<b>{ci.get('buying_readiness', 0)}%</b>", 
                      ParagraphStyle('v', fontSize=16, textColor=ACCENT, alignment=TA_CENTER, fontName='Helvetica-Bold'))]
        ]
        interest_table = Table(interest_data, colWidths=[230, 230])
        interest_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        story.append(interest_table)
        story.append(Spacer(1, 10))
        
        if ci.get('what_they_want'):
            story.append(Paragraph("<b>What They Want:</b>", styles['SubHeader']))
            story.append(Paragraph(clean_text(ci['what_they_want']), styles['BodyText']))
        
        if ci.get('main_concerns'):
            story.append(Paragraph("<b>Main Concerns:</b>", styles['SubHeader']))
            for concern in ci['main_concerns']:
                story.append(Paragraph(f"• {clean_text(concern)}", styles['BodyText']))
    
    # ==================== OBJECTIONS ====================
    if analysis.get('objections') and len(analysis['objections']) > 0:
        story.append(PageBreak())
        story.append(Paragraph(f"Objections ({len(analysis['objections'])})", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
        story.append(Spacer(1, 10))
        
        for i, obj in enumerate(analysis['objections'], 1):
            # Objection header
            score = obj.get('handling_score', 0)
            score_color = get_score_color(score)
            
            story.append(Paragraph(
                f"<b>#{i} {obj.get('type', '').upper()}</b> | Score: <font color='{score_color.hexval()}'><b>{score}/10</b></font>",
                styles['SubHeader']
            ))
            
            # Customer statement
            story.append(Paragraph("<font color='#6b7280'>Customer:</font>", styles['Caption']))
            story.append(Paragraph(f'"{clean_text(obj.get("buyer_statement", ""))}"', styles['Quote']))
            
            # Real concern
            if obj.get('real_concern'):
                story.append(Paragraph("<font color='#6b7280'>Underlying Concern:</font>", styles['Caption']))
                story.append(Paragraph(clean_text(obj['real_concern']), styles['BodyText']))
            
            # Better response
            story.append(Paragraph(f"<font color='{SUCCESS.hexval()}'>Recommended Response:</font>", styles['Caption']))
            story.append(Paragraph(f'"{clean_text(obj.get("better_response", ""))}"', 
                                  ParagraphStyle('better', fontSize=10, textColor=SUCCESS, leftIndent=12, leading=14)))
            
            if obj.get('why_better'):
                story.append(Paragraph(f"<i>{clean_text(obj['why_better'])}</i>", styles['Caption']))
            
            story.append(Spacer(1, 12))
            if i < len(analysis['objections']):
                story.append(HRFlowable(width="40%", thickness=0.5, color=BORDER))
                story.append(Spacer(1, 8))
    
    # ==================== CLOSING OPPORTUNITIES ====================
    if analysis.get('closing_opportunities') and len(analysis['closing_opportunities']) > 0:
        story.append(Spacer(1, 15))
        story.append(Paragraph(f"Missed Closing Opportunities ({len(analysis['closing_opportunities'])})", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
        story.append(Spacer(1, 10))
        
        for i, opp in enumerate(analysis['closing_opportunities'], 1):
            story.append(Paragraph(
                f"<b>#{i}</b> {opp.get('close_type', '').replace('_', ' ').title()} @ {opp.get('timestamp', '--')}",
                styles['SubHeader']
            ))
            
            story.append(Paragraph("<font color='#6b7280'>Customer Signal:</font>", styles['Caption']))
            story.append(Paragraph(f'"{clean_text(opp.get("customer_signal", ""))}"', styles['Quote']))
            
            story.append(Paragraph(f"<font color='{SUCCESS.hexval()}'>Suggested Close:</font>", styles['Caption']))
            story.append(Paragraph(f'"{clean_text(opp.get("suggested_close", ""))}"', 
                                  ParagraphStyle('close', fontSize=10, textColor=SUCCESS, leftIndent=12, leading=14)))
            story.append(Spacer(1, 10))
    
    # ==================== STORYTELLING ====================
    if analysis.get('storytelling_analysis') and len(analysis['storytelling_analysis']) > 0:
        story.append(PageBreak())
        story.append(Paragraph(f"Storytelling Analysis ({len(analysis['storytelling_analysis'])})", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
        story.append(Spacer(1, 10))
        
        for i, s in enumerate(analysis['storytelling_analysis'], 1):
            story.append(Paragraph(
                f"<b>#{i}</b> {s.get('story_type', '').replace('_', ' ').title()} @ {s.get('timestamp', '--')}",
                styles['SubHeader']
            ))
            
            story.append(Paragraph("<font color='#6b7280'>Original:</font>", styles['Caption']))
            story.append(Paragraph(f'"{clean_text(s.get("original_story", ""))}"', styles['Quote']))
            
            story.append(Paragraph(f"<font color='{SUCCESS.hexval()}'>Improved Version:</font>", styles['Caption']))
            story.append(Paragraph(f'"{clean_text(s.get("improved_story", ""))}"', 
                                  ParagraphStyle('improved', fontSize=10, textColor=SUCCESS, leftIndent=12, leading=14)))
            
            if s.get('why_better'):
                story.append(Paragraph(f"<i>{clean_text(s['why_better'])}</i>", styles['Caption']))
            story.append(Spacer(1, 10))
    
    # ==================== COACHING SUGGESTIONS ====================
    if analysis.get('coaching_suggestions') and len(analysis['coaching_suggestions']) > 0:
        story.append(Spacer(1, 15))
        story.append(Paragraph("Coaching Recommendations", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
        story.append(Spacer(1, 10))
        
        for sug in analysis['coaching_suggestions']:
            priority = sug.get('priority', 'medium')
            priority_color = DANGER if priority == 'high' else WARNING if priority == 'medium' else TEXT_MUTED
            
            story.append(Paragraph(
                f"<font color='{priority_color.hexval()}'>[{priority.upper()}]</font> <b>{sug.get('area', '').replace('_', ' ').title()}</b>",
                styles['SubHeader']
            ))
            story.append(Paragraph(clean_text(sug.get('suggestion', '')), styles['BodyText']))
            
            if sug.get('example'):
                story.append(Paragraph(f"<i>Example: {clean_text(sug['example'])}</i>", styles['Caption']))
            story.append(Spacer(1, 8))
    
    # ==================== SELLER PERFORMANCE ====================
    if analysis.get('seller_performance'):
        sp = analysis['seller_performance']
        story.append(Spacer(1, 15))
        story.append(Paragraph("Seller Performance", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=1, color=ACCENT))
        story.append(Spacer(1, 10))
        
        # Score
        score = sp.get('overall_score', 0)
        story.append(Paragraph(f"<b>Overall Score: <font color='{get_score_color(score).hexval()}'>{score}/10</font></b>", 
                              styles['BodyText']))
        
        # Strengths
        if sp.get('strengths'):
            story.append(Paragraph("<b>Strengths:</b>", styles['SubHeader']))
            for strength in sp['strengths']:
                story.append(Paragraph(f"+ {clean_text(strength)}", styles['BodyText']))
        
        # Areas to improve
        if sp.get('areas_to_improve'):
            story.append(Paragraph("<b>Areas to Improve:</b>", styles['SubHeader']))
            for area in sp['areas_to_improve']:
                story.append(Paragraph(f"- {clean_text(area)}", styles['BodyText']))
    
    # Build PDF
    doc.build(story, onFirstPage=add_header, onLaterPages=add_header)
    buffer.seek(0)
    return buffer
