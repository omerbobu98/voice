"""
PDF Report Generator for Sales Call Analysis
PREMIUM PROFESSIONAL DESIGN - Modern, Clean, Executive Quality
Inspired by: Gong, Chorus, Salesforce, McKinsey Reports
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Rect, Circle, Line
from reportlab.graphics.charts.piecharts import Pie
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


# ============== PREMIUM COLOR PALETTE ==============
# Modern, sophisticated colors inspired by top SaaS analytics tools

# Primary Colors
NAVY = colors.HexColor('#0f172a')           # Deep navy - main headers
SLATE_900 = colors.HexColor('#1e293b')      # Dark slate
SLATE_800 = colors.HexColor('#334155')      # Medium slate
SLATE_600 = colors.HexColor('#475569')      # Text secondary
SLATE_400 = colors.HexColor('#94a3b8')      # Muted text
SLATE_200 = colors.HexColor('#e2e8f0')      # Borders
SLATE_100 = colors.HexColor('#f1f5f9')      # Light backgrounds
SLATE_50 = colors.HexColor('#f8fafc')       # Very light backgrounds

# Accent Colors
INDIGO = colors.HexColor('#6366f1')         # Primary accent
INDIGO_DARK = colors.HexColor('#4f46e5')    # Darker indigo
INDIGO_LIGHT = colors.HexColor('#a5b4fc')   # Light indigo

# Status Colors
EMERALD = colors.HexColor('#10b981')        # Success/Good
EMERALD_DARK = colors.HexColor('#059669')   # Darker green
AMBER = colors.HexColor('#f59e0b')          # Warning/Medium
AMBER_DARK = colors.HexColor('#d97706')     # Darker amber
ROSE = colors.HexColor('#f43f5e')           # Danger/Poor
ROSE_DARK = colors.HexColor('#e11d48')      # Darker rose

WHITE = colors.HexColor('#ffffff')


def create_styles():
    """Create premium, modern paragraph styles"""
    styles = getSampleStyleSheet()
    
    # Hero Title - Cover page
    styles.add(ParagraphStyle(
        name='HeroTitle',
        fontSize=36,
        textColor=NAVY,
        fontName='Helvetica-Bold',
        spaceAfter=8,
        leading=42,
        alignment=TA_LEFT
    ))
    
    # Hero Subtitle
    styles.add(ParagraphStyle(
        name='HeroSubtitle',
        fontSize=14,
        textColor=SLATE_600,
        fontName='Helvetica',
        spaceAfter=24,
        leading=20
    ))
    
    # Section Title - Large
    styles.add(ParagraphStyle(
        name='SectionTitle',
        fontSize=18,
        textColor=NAVY,
        fontName='Helvetica-Bold',
        spaceBefore=24,
        spaceAfter=12,
        leading=24
    ))
    
    # Section Header
    styles.add(ParagraphStyle(
        name='SectionHeader',
        fontSize=13,
        textColor=SLATE_800,
        fontName='Helvetica-Bold',
        spaceBefore=16,
        spaceAfter=8,
        leading=18
    ))
    
    # Card Title
    styles.add(ParagraphStyle(
        name='CardTitle',
        fontSize=11,
        textColor=NAVY,
        fontName='Helvetica-Bold',
        spaceBefore=8,
        spaceAfter=4,
        leading=14
    ))
    
    # Body Text - Updated default
    styles['BodyText'].fontSize = 10
    styles['BodyText'].textColor = SLATE_800
    styles['BodyText'].leading = 15
    styles['BodyText'].spaceAfter = 6
    styles['BodyText'].alignment = TA_JUSTIFY
    
    # Body Text Secondary
    styles.add(ParagraphStyle(
        name='BodySecondary',
        fontSize=9,
        textColor=SLATE_600,
        fontName='Helvetica',
        leading=13,
        spaceAfter=4
    ))
    
    # Quote Style - For customer statements
    styles.add(ParagraphStyle(
        name='Quote',
        fontSize=10,
        textColor=SLATE_600,
        fontName='Helvetica-Oblique',
        leftIndent=16,
        rightIndent=16,
        spaceBefore=4,
        spaceAfter=8,
        leading=14,
        borderPadding=8,
    ))
    
    # Recommendation/Script - Green highlighted
    styles.add(ParagraphStyle(
        name='Recommendation',
        fontSize=10,
        textColor=EMERALD_DARK,
        fontName='Helvetica',
        leftIndent=16,
        spaceBefore=4,
        spaceAfter=8,
        leading=14
    ))
    
    # Caption/Label
    styles.add(ParagraphStyle(
        name='Caption',
        fontSize=8,
        textColor=SLATE_400,
        fontName='Helvetica',
        spaceAfter=2,
        leading=10,
        textTransform='uppercase'
    ))
    
    # Metric Value Large
    styles.add(ParagraphStyle(
        name='MetricLarge',
        fontSize=32,
        textColor=NAVY,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        leading=36
    ))
    
    # Metric Value Medium
    styles.add(ParagraphStyle(
        name='MetricMedium',
        fontSize=20,
        textColor=INDIGO,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        leading=24
    ))
    
    # Metric Label
    styles.add(ParagraphStyle(
        name='MetricLabel',
        fontSize=8,
        textColor=SLATE_400,
        fontName='Helvetica',
        alignment=TA_CENTER,
        leading=10,
        spaceAfter=4
    ))
    
    # Tag/Badge
    styles.add(ParagraphStyle(
        name='Tag',
        fontSize=8,
        textColor=WHITE,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        leading=10
    ))
    
    return styles


def add_page_header(canvas, doc):
    """Premium page header with subtle branding"""
    canvas.saveState()
    
    # Top accent bar
    canvas.setFillColor(INDIGO)
    canvas.rect(0, A4[1] - 4, A4[0], 4, fill=True, stroke=False)
    
    # Brand name
    canvas.setFont('Helvetica-Bold', 10)
    canvas.setFillColor(SLATE_800)
    canvas.drawString(50, A4[1] - 28, "SalesAI")
    
    # Subtle separator dot
    canvas.setFillColor(SLATE_400)
    canvas.drawString(100, A4[1] - 28, "|")
    
    # Report type
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(SLATE_600)
    canvas.drawString(110, A4[1] - 28, "Call Analysis Report")
    
    # Page number with style
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(SLATE_400)
    page_text = f"Page {doc.page}"
    canvas.drawRightString(A4[0] - 50, A4[1] - 28, page_text)
    
    canvas.restoreState()


def add_page_footer(canvas, doc):
    """Minimal, professional footer"""
    canvas.saveState()
    
    # Subtle line
    canvas.setStrokeColor(SLATE_200)
    canvas.setLineWidth(0.5)
    canvas.line(50, 40, A4[0] - 50, 40)
    
    # Date
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(SLATE_400)
    canvas.drawString(50, 26, datetime.now().strftime('%B %d, %Y'))
    
    # Confidential badge
    canvas.drawRightString(A4[0] - 50, 26, "CONFIDENTIAL")
    
    canvas.restoreState()


def get_score_color(score, max_score=100):
    """Get color based on score percentage"""
    if max_score == 10:
        pct = score * 10
    else:
        pct = score
    
    if pct >= 70:
        return EMERALD
    elif pct >= 40:
        return AMBER
    return ROSE


def get_risk_color(risk_level):
    """Get color for risk level"""
    risk_str = str(risk_level).lower()
    if risk_str in ['low', 'green']:
        return EMERALD
    elif risk_str in ['medium', 'yellow']:
        return AMBER
    return ROSE


def create_score_badge(score, max_score=100, width=50, height=50):
    """Create a circular score badge"""
    drawing = Drawing(width, height)
    
    # Determine color
    color = get_score_color(score, max_score)
    
    # Background circle
    drawing.add(Circle(width/2, height/2, width/2 - 2, fillColor=color, strokeColor=None))
    
    return drawing


def create_metric_card(value, label, sublabel=None, color=INDIGO, width=115):
    """Create a modern metric card"""
    styles = create_styles()
    
    rows = [
        [Paragraph(f"<font color='{color.hexval()}'>{value}</font>", 
                   ParagraphStyle('mv', fontSize=24, fontName='Helvetica-Bold', alignment=TA_CENTER, leading=28))],
        [Paragraph(label.upper(), 
                   ParagraphStyle('ml', fontSize=7, textColor=SLATE_400, fontName='Helvetica-Bold', alignment=TA_CENTER, leading=9))]
    ]
    
    if sublabel:
        rows.append([Paragraph(sublabel, 
                              ParagraphStyle('ms', fontSize=7, textColor=SLATE_600, alignment=TA_CENTER, leading=9))])
    
    table = Table(rows, colWidths=[width])
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, -1), SLATE_50),
        ('TOPPADDING', (0, 0), (0, 0), 14),
        ('BOTTOMPADDING', (0, -1), (0, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    return table


def create_section_divider(title, accent_color=INDIGO):
    """Create a styled section divider"""
    styles = create_styles()
    
    elements = []
    elements.append(Spacer(1, 16))
    
    # Title with accent bar
    title_table_data = [[
        Paragraph(title.upper(), ParagraphStyle('st', fontSize=12, textColor=NAVY, fontName='Helvetica-Bold', leading=16))
    ]]
    title_table = Table(title_table_data, colWidths=[A4[0] - 100])
    title_table.setStyle(TableStyle([
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LINEBELOW', (0, 0), (-1, -1), 2, accent_color),
    ]))
    elements.append(title_table)
    elements.append(Spacer(1, 12))
    
    return elements


def create_objection_card(obj, index, styles):
    """Create a styled objection card"""
    elements = []
    
    # Header row with type and score
    obj_type = clean_text(obj.get('type', 'objection')).upper()
    score = obj.get('handling_score', 0)
    score_color = get_score_color(score, 10)
    
    header_data = [[
        Paragraph(f"<b>#{index}</b>  {obj_type}", 
                  ParagraphStyle('oh', fontSize=11, textColor=NAVY, fontName='Helvetica-Bold')),
        Paragraph(f"<font color='{score_color.hexval()}'><b>{score}/10</b></font>", 
                  ParagraphStyle('os', fontSize=11, fontName='Helvetica-Bold', alignment=TA_RIGHT))
    ]]
    header_table = Table(header_data, colWidths=[360, 100])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, -1), SLATE_100),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (0, 0), 12),
        ('RIGHTPADDING', (-1, -1), (-1, -1), 12),
    ]))
    elements.append(header_table)
    
    # Customer statement
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("CUSTOMER SAID", styles['Caption']))
    elements.append(Paragraph(f'"{clean_text(obj.get("buyer_statement", ""))}"', styles['Quote']))
    
    # Real concern (if exists)
    if obj.get('real_concern'):
        elements.append(Paragraph("UNDERLYING CONCERN", styles['Caption']))
        elements.append(Paragraph(clean_text(obj['real_concern']), styles['BodySecondary']))
        elements.append(Spacer(1, 4))
    
    # Better response
    elements.append(Paragraph("RECOMMENDED RESPONSE", styles['Caption']))
    elements.append(Paragraph(f'"{clean_text(obj.get("better_response", ""))}"', styles['Recommendation']))
    
    # Technique
    if obj.get('technique_to_use'):
        elements.append(Paragraph(f"Technique: {clean_text(obj['technique_to_use'])}", styles['BodySecondary']))
    
    elements.append(Spacer(1, 12))
    
    return elements


def generate_analysis_pdf(analysis_data: dict, transcription_data: dict = None) -> BytesIO:
    """Generate a premium, professional PDF report"""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=55,
        bottomMargin=55
    )
    
    styles = create_styles()
    story = []
    
    analysis = analysis_data.get('analysis', {})
    
    # ==================== COVER PAGE ====================
    story.append(Spacer(1, 60))
    
    # Main Title
    story.append(Paragraph("Sales Call", styles['HeroTitle']))
    story.append(Paragraph("Analysis Report", styles['HeroTitle']))
    
    # Summary line
    if analysis.get('call_summary'):
        summary = analysis['call_summary']
        one_liner = clean_text(summary.get('one_liner', ''))
        if one_liner:
            story.append(Spacer(1, 8))
            story.append(Paragraph(one_liner, styles['HeroSubtitle']))
    
    story.append(Spacer(1, 40))
    
    # Key Metrics Dashboard
    overall_score = analysis.get('seller_performance', {}).get('overall_score', 0)
    meddic_score = analysis.get('meddic_score', {}).get('total_score', 0)
    bant_score = analysis.get('bant_score', {}).get('total_score', 0)
    risk_level = analysis.get('deal_risk_score', {}).get('risk_level', 'unknown')
    buying_ready = analysis.get('customer_interest', {}).get('buying_readiness', 0)
    close_prob = analysis.get('deal_risk_score', {}).get('close_probability', 0)
    
    # Metrics row 1
    metrics_row1 = [[
        create_metric_card(str(overall_score), "Performance", "Overall Score", get_score_color(overall_score)),
        create_metric_card(f"{meddic_score}%", "MEDDIC", "Qualification", INDIGO),
        create_metric_card(f"{bant_score}%", "BANT", "Score", INDIGO),
        create_metric_card(f"{buying_ready}%", "Buying", "Readiness", get_score_color(buying_ready)),
    ]]
    
    metrics_table1 = Table(metrics_row1, colWidths=[120, 120, 120, 120])
    metrics_table1.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(metrics_table1)
    
    story.append(Spacer(1, 16))
    
    # Metrics row 2 - Risk & Probability
    risk_color = get_risk_color(risk_level)
    risk_display = risk_level.upper() if risk_level else "N/A"
    
    metrics_row2 = [[
        create_metric_card(risk_display, "Risk Level", None, risk_color, width=230),
        create_metric_card(f"{close_prob}%", "Close Probability", None, get_score_color(close_prob), width=230),
    ]]
    
    metrics_table2 = Table(metrics_row2, colWidths=[245, 245])
    metrics_table2.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(metrics_table2)
    
    story.append(Spacer(1, 40))
    
    # Report metadata
    story.append(HRFlowable(width="100%", thickness=1, color=SLATE_200))
    story.append(Spacer(1, 12))
    
    meta_data = [[
        Paragraph("GENERATED", styles['Caption']),
        Paragraph("CLASSIFICATION", styles['Caption']),
        Paragraph("VERSION", styles['Caption']),
    ], [
        Paragraph(datetime.now().strftime('%B %d, %Y  %H:%M'), styles['BodySecondary']),
        Paragraph("Confidential", styles['BodySecondary']),
        Paragraph("v2.0", styles['BodySecondary']),
    ]]
    meta_table = Table(meta_data, colWidths=[200, 160, 120])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
    ]))
    story.append(meta_table)
    
    story.append(PageBreak())
    
    # ==================== EXECUTIVE SUMMARY ====================
    story.extend(create_section_divider("Executive Summary"))
    
    if analysis.get('call_summary'):
        summary = analysis['call_summary']
        
        # Outcome badge
        outcome = summary.get('outcome', 'unknown')
        outcome_color = EMERALD if outcome in ['closed', 'positive'] else AMBER if outcome in ['nearly_closed', 'needs_followup'] else ROSE
        
        story.append(Paragraph(f"<b>Outcome:</b> <font color='{outcome_color.hexval()}'>{outcome.upper().replace('_', ' ')}</font>", styles['BodyText']))
        story.append(Spacer(1, 6))
        
        # Summary
        if summary.get('one_liner'):
            story.append(Paragraph(clean_text(summary['one_liner']), styles['BodyText']))
            story.append(Spacer(1, 8))
        
        # Close prevention reason
        if summary.get('close_prevented_by') and outcome not in ['closed']:
            story.append(Paragraph(f"<b>Close Prevented By:</b> {clean_text(summary['close_prevented_by'])}", styles['BodyText']))
            story.append(Spacer(1, 8))
        
        # Key topics
        if summary.get('key_topics'):
            topics = [clean_text(t) for t in summary['key_topics'][:6]]
            topics_text = " • ".join(topics)
            story.append(Paragraph(f"<b>Key Topics:</b> {topics_text}", styles['BodyText']))
    
    # ==================== CUSTOMER ANALYSIS ====================
    if analysis.get('customer_interest'):
        story.extend(create_section_divider("Customer Analysis"))
        
        ci = analysis['customer_interest']
        
        # Interest metrics in cards
        interest_level = ci.get('overall_level', 'unknown').upper()
        interest_color = EMERALD if interest_level == 'HOT' else AMBER if interest_level == 'WARM' else ROSE
        
        interest_cards = [[
            create_metric_card(interest_level, "Interest Level", None, interest_color, width=150),
            create_metric_card(f"{ci.get('buying_readiness', 0)}%", "Ready to Buy", None, get_score_color(ci.get('buying_readiness', 0)), width=150),
        ]]
        interest_table = Table(interest_cards, colWidths=[200, 200])
        interest_table.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'LEFT')]))
        story.append(interest_table)
        story.append(Spacer(1, 12))
        
        # What they want
        if ci.get('what_they_want'):
            story.append(Paragraph("WHAT THEY WANT", styles['Caption']))
            story.append(Paragraph(clean_text(ci['what_they_want']), styles['BodyText']))
            story.append(Spacer(1, 8))
        
        # Main concerns
        if ci.get('main_concerns'):
            story.append(Paragraph("MAIN CONCERNS", styles['Caption']))
            for concern in ci['main_concerns'][:4]:
                story.append(Paragraph(f"• {clean_text(concern)}", styles['BodySecondary']))
    
    # ==================== OBJECTIONS ====================
    if analysis.get('objections') and len(analysis['objections']) > 0:
        story.append(PageBreak())
        story.extend(create_section_divider(f"Objections Detected ({len(analysis['objections'])})"))
        
        for i, obj in enumerate(analysis['objections'][:6], 1):
            card_elements = create_objection_card(obj, i, styles)
            story.extend(card_elements)
            
            if i < len(analysis['objections']) and i < 6:
                story.append(HRFlowable(width="60%", thickness=0.5, color=SLATE_200))
                story.append(Spacer(1, 8))
    
    # ==================== CLOSING OPPORTUNITIES ====================
    if analysis.get('closing_opportunities') and len(analysis['closing_opportunities']) > 0:
        story.extend(create_section_divider(f"Missed Opportunities ({len(analysis['closing_opportunities'])})"))
        
        for i, opp in enumerate(analysis['closing_opportunities'][:4], 1):
            was_taken = opp.get('was_taken', False)
            status_color = EMERALD if was_taken else AMBER
            
            # Header
            story.append(Paragraph(
                f"<b>#{i}</b> {opp.get('close_type', '').replace('_', ' ').title()}  <font color='{SLATE_400.hexval()}'>@ {opp.get('timestamp', '--')}</font>",
                styles['CardTitle']
            ))
            
            # Signal
            story.append(Paragraph("CUSTOMER SIGNAL", styles['Caption']))
            story.append(Paragraph(f'"{clean_text(opp.get("customer_signal", ""))}"', styles['Quote']))
            
            # Recommended close
            story.append(Paragraph("RECOMMENDED CLOSE", styles['Caption']))
            rec_close = opp.get('recommended_close', opp.get('suggested_close', ''))
            story.append(Paragraph(f'"{clean_text(rec_close)}"', styles['Recommendation']))
            
            story.append(Spacer(1, 12))
    
    # ==================== STORYTELLING ====================
    if analysis.get('storytelling_analysis') and len(analysis['storytelling_analysis']) > 0:
        story.append(PageBreak())
        story.extend(create_section_divider(f"Storytelling Analysis ({len(analysis['storytelling_analysis'])})"))
        
        for i, s in enumerate(analysis['storytelling_analysis'][:3], 1):
            effectiveness = s.get('effectiveness_score', 0)
            eff_color = get_score_color(effectiveness, 10)
            
            # Header
            story.append(Paragraph(
                f"<b>#{i}</b> {s.get('story_type', '').replace('_', ' ').title()}  "
                f"<font color='{eff_color.hexval()}'><b>{effectiveness}/10</b></font>",
                styles['CardTitle']
            ))
            
            # Original
            story.append(Paragraph("ORIGINAL STORY", styles['Caption']))
            story.append(Paragraph(f'"{clean_text(s.get("original_story", ""))[:300]}..."' if len(str(s.get("original_story", ""))) > 300 else f'"{clean_text(s.get("original_story", ""))}"', styles['Quote']))
            
            # Improved
            story.append(Paragraph("IMPROVED VERSION", styles['Caption']))
            improved = clean_text(s.get("improved_story", ""))
            if len(improved) > 400:
                improved = improved[:400] + "..."
            story.append(Paragraph(f'"{improved}"', styles['Recommendation']))
            
            story.append(Spacer(1, 12))
    
    # ==================== METHODOLOGY SCORES ====================
    story.extend(create_section_divider("Methodology Scores"))
    
    # MEDDIC breakdown
    meddic = analysis.get('meddic_score', {})
    if meddic:
        story.append(Paragraph("<b>MEDDIC Analysis</b>", styles['CardTitle']))
        story.append(Spacer(1, 6))
        
        meddic_items = ['metrics', 'economic_buyer', 'decision_criteria', 'decision_process', 'identify_pain', 'champion']
        meddic_labels = ['Metrics', 'Economic Buyer', 'Decision Criteria', 'Decision Process', 'Identify Pain', 'Champion']
        
        for item, label in zip(meddic_items, meddic_labels):
            item_data = meddic.get(item, {})
            score = item_data.get('score', 0) if isinstance(item_data, dict) else 0
            score_color = get_score_color(score)
            story.append(Paragraph(
                f"<font color='{score_color.hexval()}'><b>{score}%</b></font>  {label}",
                styles['BodySecondary']
            ))
        
        story.append(Spacer(1, 12))
    
    # BANT breakdown
    bant = analysis.get('bant_score', {})
    if bant:
        story.append(Paragraph("<b>BANT Qualification</b>", styles['CardTitle']))
        story.append(Spacer(1, 6))
        
        bant_items = ['budget', 'authority', 'need', 'timeline']
        bant_labels = ['Budget', 'Authority', 'Need', 'Timeline']
        
        for item, label in zip(bant_items, bant_labels):
            item_data = bant.get(item, {})
            score = item_data.get('score', 0) if isinstance(item_data, dict) else 0
            qualified = item_data.get('qualified', False) if isinstance(item_data, dict) else False
            score_color = get_score_color(score)
            qual_text = "Qualified" if qualified else "Not Qualified"
            story.append(Paragraph(
                f"<font color='{score_color.hexval()}'><b>{score}%</b></font>  {label} ({qual_text})",
                styles['BodySecondary']
            ))
    
    # ==================== SELLER PERFORMANCE ====================
    if analysis.get('seller_performance'):
        story.append(PageBreak())
        story.extend(create_section_divider("Seller Performance"))
        
        sp = analysis['seller_performance']
        
        # Overall score
        overall = sp.get('overall_score', 0)
        overall_color = get_score_color(overall)
        
        story.append(Paragraph(
            f"<b>Overall Performance Score:</b> <font color='{overall_color.hexval()}' size='16'><b>{overall}/100</b></font>",
            styles['BodyText']
        ))
        story.append(Spacer(1, 12))
        
        # Strengths
        if sp.get('strengths'):
            story.append(Paragraph("STRENGTHS", styles['Caption']))
            for strength in sp['strengths'][:4]:
                story.append(Paragraph(f"<font color='{EMERALD.hexval()}'>+</font> {clean_text(strength)}", styles['BodySecondary']))
            story.append(Spacer(1, 8))
        
        # Areas to improve
        improvements = sp.get('critical_improvements', sp.get('areas_to_improve', []))
        if improvements:
            story.append(Paragraph("AREAS TO IMPROVE", styles['Caption']))
            for area in improvements[:4]:
                story.append(Paragraph(f"<font color='{ROSE.hexval()}'>-</font> {clean_text(area)}", styles['BodySecondary']))
    
    # ==================== COACHING RECOMMENDATIONS ====================
    if analysis.get('coaching_suggestions') and len(analysis['coaching_suggestions']) > 0:
        story.extend(create_section_divider("Coaching Recommendations"))
        
        for sug in analysis['coaching_suggestions'][:5]:
            priority = sug.get('priority', 'medium')
            priority_color = ROSE if priority == 'critical' else AMBER if priority == 'high' else SLATE_600
            
            # Area and priority
            area = sug.get('area', '').replace('_', ' ').title()
            story.append(Paragraph(
                f"<font color='{priority_color.hexval()}'>[{priority.upper()}]</font> <b>{area}</b>",
                styles['CardTitle']
            ))
            
            # Problem
            if sug.get('the_problem'):
                story.append(Paragraph(f"Problem: {clean_text(sug['the_problem'])}", styles['BodySecondary']))
            
            # Fix
            if sug.get('the_fix'):
                story.append(Paragraph(f"Solution: {clean_text(sug['the_fix'])}", styles['BodySecondary']))
            
            # Script example
            if sug.get('script_example'):
                story.append(Paragraph("EXAMPLE SCRIPT", styles['Caption']))
                story.append(Paragraph(f'"{clean_text(sug["script_example"])}"', styles['Recommendation']))
            
            story.append(Spacer(1, 10))
    
    # ==================== NEXT STEPS ====================
    if analysis.get('next_steps_recommended') and len(analysis['next_steps_recommended']) > 0:
        story.extend(create_section_divider("Recommended Next Steps"))
        
        for i, step in enumerate(analysis['next_steps_recommended'][:5], 1):
            story.append(Paragraph(f"<b>{i}.</b> {clean_text(step)}", styles['BodyText']))
    
    # Build PDF
    doc.build(story, onFirstPage=add_page_header, onLaterPages=add_page_header)
    buffer.seek(0)
    return buffer
