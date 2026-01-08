"""
PDF Report Generator for Sales Call Analysis
Creates professional, branded PDF reports with all analysis data
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.piecharts import Pie
from io import BytesIO
from datetime import datetime
import re


def clean_text(text):
    """Remove emojis and special characters that reportlab can't handle"""
    if not text:
        return ""
    # Remove emojis and other non-ASCII characters
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map symbols
        u"\U0001F1E0-\U0001F1FF"  # flags
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


# Premium Fintech Brand Colors - Clean, Professional, Billion-Dollar Look
BRAND_PRIMARY = colors.HexColor('#1E1E2E')      # Deep charcoal - premium dark
BRAND_SECONDARY = colors.HexColor('#EC4899')    # Pink - for storytelling section
BRAND_ACCENT = colors.HexColor('#6366F1')       # Indigo - modern fintech
BRAND_ACCENT_LIGHT = colors.HexColor('#818CF8') # Light indigo
BRAND_SUCCESS = colors.HexColor('#059669')      # Emerald - professional green
BRAND_WARNING = colors.HexColor('#D97706')      # Amber - refined orange
BRAND_DANGER = colors.HexColor('#DC2626')       # Red - clear alerts
BRAND_INFO = colors.HexColor('#0891B2')         # Cyan - data highlights
BRAND_TEXT = colors.HexColor('#111827')         # Near black - readable text
BRAND_TEXT_SECONDARY = colors.HexColor('#4B5563')  # Gray - secondary text
BRAND_TEXT_MUTED = colors.HexColor('#9CA3AF')   # Light gray - muted text
BRAND_LIGHT = colors.HexColor('#D1D5DB')        # Light gray for borders/low priority
BRAND_BORDER = colors.HexColor('#E5E7EB')       # Light border
BRAND_BG_LIGHT = colors.HexColor('#F9FAFB')     # Light background
BRAND_WHITE = colors.white


def create_styles():
    """Create premium fintech paragraph styles for the PDF"""
    styles = getSampleStyleSheet()
    
    # Main Report Title - Clean, bold, professional
    styles.add(ParagraphStyle(
        name='ReportTitle',
        parent=styles['Heading1'],
        fontSize=32,
        textColor=BRAND_TEXT,
        spaceAfter=8,
        alignment=TA_LEFT,
        fontName='Helvetica-Bold',
        leading=38
    ))
    
    # Report Subtitle
    styles.add(ParagraphStyle(
        name='ReportSubtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=BRAND_TEXT_SECONDARY,
        spaceAfter=30,
        alignment=TA_LEFT,
        fontName='Helvetica',
        leading=20
    ))
    
    # Section header style - Clean with accent underline effect
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading2'],
        fontSize=18,
        textColor=BRAND_TEXT,
        spaceBefore=25,
        spaceAfter=12,
        fontName='Helvetica-Bold',
        leading=22
    ))
    
    # Subsection header
    styles.add(ParagraphStyle(
        name='SubsectionHeader',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=BRAND_TEXT,
        spaceBefore=15,
        spaceAfter=8,
        fontName='Helvetica-Bold',
        leading=16
    ))
    
    # Body text - override existing BodyText style
    styles['BodyText'].fontSize = 10
    styles['BodyText'].textColor = BRAND_TEXT
    styles['BodyText'].spaceAfter = 8
    styles['BodyText'].alignment = TA_LEFT
    styles['BodyText'].leading = 15
    
    # Quote style (for customer/seller statements) - Elegant italic
    styles.add(ParagraphStyle(
        name='Quote',
        parent=styles['Normal'],
        fontSize=10,
        textColor=BRAND_TEXT_SECONDARY,
        leftIndent=15,
        rightIndent=15,
        spaceBefore=4,
        spaceAfter=8,
        fontName='Helvetica-Oblique',
        leading=15,
        borderColor=BRAND_BORDER,
        borderWidth=0,
        borderPadding=8,
    ))
    
    # Better response style - Success colored, professional
    styles.add(ParagraphStyle(
        name='BetterResponse',
        parent=styles['Normal'],
        fontSize=10,
        textColor=BRAND_SUCCESS,
        leftIndent=15,
        rightIndent=15,
        spaceBefore=4,
        spaceAfter=8,
        fontName='Helvetica',
        leading=15
    ))
    
    # Metric Value - Large numbers for KPIs
    styles.add(ParagraphStyle(
        name='MetricValue',
        parent=styles['Normal'],
        fontSize=36,
        textColor=BRAND_ACCENT,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold',
        leading=40
    ))
    
    # Metric Label - Small text below metrics
    styles.add(ParagraphStyle(
        name='MetricLabel',
        parent=styles['Normal'],
        fontSize=10,
        textColor=BRAND_TEXT_MUTED,
        alignment=TA_CENTER,
        fontName='Helvetica',
        spaceAfter=4
    ))
    
    # Small text / Caption
    styles.add(ParagraphStyle(
        name='SmallText',
        parent=styles['Normal'],
        fontSize=9,
        textColor=BRAND_TEXT_MUTED,
        spaceAfter=4,
        leading=12
    ))
    
    # Label style - Category headers
    styles.add(ParagraphStyle(
        name='Label',
        parent=styles['Normal'],
        fontSize=9,
        textColor=BRAND_ACCENT,
        spaceAfter=4,
        fontName='Helvetica-Bold',
        textTransform='uppercase'
    ))
    
    # Insight box text
    styles.add(ParagraphStyle(
        name='InsightText',
        parent=styles['Normal'],
        fontSize=11,
        textColor=BRAND_TEXT,
        spaceAfter=6,
        fontName='Helvetica',
        leading=16
    ))
    
    return styles


def add_header(canvas, doc):
    """Add minimal, premium header to each page"""
    canvas.saveState()
    
    # Thin accent line at top
    canvas.setStrokeColor(BRAND_ACCENT)
    canvas.setLineWidth(3)
    canvas.line(0, A4[1] - 3, A4[0], A4[1] - 3)
    
    # Clean header area
    canvas.setFont('Helvetica-Bold', 11)
    canvas.setFillColor(BRAND_TEXT)
    canvas.drawString(50, A4[1] - 35, "SalesAI")
    
    # Separator dot
    canvas.setFillColor(BRAND_TEXT_MUTED)
    canvas.drawString(105, A4[1] - 35, "·")
    
    # Report type
    canvas.setFont('Helvetica', 10)
    canvas.setFillColor(BRAND_TEXT_MUTED)
    canvas.drawString(115, A4[1] - 35, "Call Analysis Report")
    
    # Page number on right - minimal
    canvas.setFont('Helvetica', 10)
    canvas.setFillColor(BRAND_TEXT_MUTED)
    canvas.drawRightString(A4[0] - 50, A4[1] - 35, f"{doc.page}")
    
    # Subtle line below header
    canvas.setStrokeColor(BRAND_BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(50, A4[1] - 50, A4[0] - 50, A4[1] - 50)
    
    canvas.restoreState()


def add_footer(canvas, doc):
    """Add minimal, premium footer to each page"""
    canvas.saveState()
    
    # Subtle line above footer
    canvas.setStrokeColor(BRAND_BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(50, 40, A4[0] - 50, 40)
    
    # Footer text - minimal and professional
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(BRAND_TEXT_MUTED)
    canvas.drawString(50, 25, f"{datetime.now().strftime('%B %d, %Y')}")
    
    # Confidential badge
    canvas.setFont('Helvetica', 7)
    canvas.drawCentredString(A4[0] / 2, 25, "CONFIDENTIAL")
    
    # Company URL
    canvas.setFont('Helvetica', 8)
    canvas.drawRightString(A4[0] - 50, 25, "salesai.app")
    
    canvas.restoreState()


def create_metric_card(value, label, color=BRAND_ACCENT):
    """Create a clean, premium metric card"""
    data = [
        [Paragraph(f"<font size='32' color='{color.hexval()}'><b>{value}</b></font>", 
                   ParagraphStyle('metric_val', alignment=TA_CENTER))],
        [Paragraph(f"<font size='9' color='#6B7280'>{label}</font>", 
                   ParagraphStyle('metric_lbl', alignment=TA_CENTER, fontName='Helvetica'))]
    ]
    
    table = Table(data, colWidths=[110])
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, -1), BRAND_BG_LIGHT),
        ('TOPPADDING', (0, 0), (0, 0), 20),
        ('BOTTOMPADDING', (0, 1), (0, 1), 15),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    return table


def create_section_header(title, accent_color=BRAND_ACCENT):
    """Create a clean section header with accent line"""
    return [
        Paragraph(f"<font color='{accent_color.hexval()}'><b>{title}</b></font>", 
                  ParagraphStyle('sec_head', fontSize=16, fontName='Helvetica-Bold', 
                                spaceAfter=8, textColor=BRAND_TEXT)),
        HRFlowable(width="100%", thickness=2, color=accent_color, spaceBefore=0, spaceAfter=15)
    ]


def generate_analysis_pdf(analysis_data: dict, transcription_data: dict = None) -> BytesIO:
    """
    Generate a professional PDF report from analysis data
    
    Args:
        analysis_data: The analysis result from the AI
        transcription_data: Optional transcription data (utterances, speaker roles, etc.)
    
    Returns:
        BytesIO buffer containing the PDF
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=50,
        leftMargin=50,
        topMargin=60,
        bottomMargin=60
    )
    
    styles = create_styles()
    story = []
    
    # Get analysis object
    analysis = analysis_data.get('analysis', {})
    metrics = analysis_data.get('metrics', {})
    
    # ==================== COVER PAGE - Premium Fintech Style ====================
    story.append(Spacer(1, 60))
    
    # Accent line
    story.append(HRFlowable(width="30%", thickness=3, color=BRAND_ACCENT, spaceBefore=0, spaceAfter=20))
    
    # Main title - Clean, professional
    story.append(Paragraph("Call Analysis", styles['ReportTitle']))
    story.append(Paragraph("Report", ParagraphStyle('title2', fontSize=32, textColor=BRAND_TEXT_MUTED, 
                                                     fontName='Helvetica', spaceAfter=20, alignment=TA_LEFT)))
    
    # Call summary one-liner
    if analysis.get('call_summary'):
        summary = analysis['call_summary']
        one_liner = clean_text(summary.get('one_liner', 'Comprehensive sales call analysis'))
        story.append(Paragraph(one_liner, styles['ReportSubtitle']))
    
    story.append(Spacer(1, 40))
    
    # Key Metrics Section
    overall_score = analysis.get('seller_performance', {}).get('overall_score', 0)
    meddic_score = analysis.get('meddic_score', {}).get('total_score', 0)
    risk_level = analysis.get('deal_risk_score', {}).get('risk_level', 'unknown')
    buying_ready = analysis.get('customer_interest', {}).get('buying_readiness', 0)
    
    # Metrics row - 4 clean cards
    metrics_data = [
        [create_metric_card(overall_score, "Performance Score", BRAND_ACCENT),
         create_metric_card(f"{meddic_score}%", "MEDDIC Score", BRAND_INFO),
         create_metric_card(f"{buying_ready}%", "Buying Readiness", BRAND_SUCCESS),
         create_metric_card(risk_level.upper() if risk_level else "N/A", "Risk Level", 
                           BRAND_SUCCESS if risk_level == 'low' else BRAND_WARNING if risk_level == 'medium' else BRAND_DANGER)]
    ]
    
    metrics_table = Table(metrics_data, colWidths=[120, 120, 120, 120])
    metrics_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(metrics_table)
    
    story.append(Spacer(1, 50))
    
    # Report metadata - Clean footer on cover
    story.append(HRFlowable(width="100%", thickness=0.5, color=BRAND_BORDER, spaceBefore=20, spaceAfter=15))
    
    meta_data = [
        [Paragraph("<b>Generated</b>", ParagraphStyle('meta', fontSize=8, textColor=BRAND_TEXT_MUTED)),
         Paragraph("<b>Prepared by</b>", ParagraphStyle('meta', fontSize=8, textColor=BRAND_TEXT_MUTED)),
         Paragraph("<b>Classification</b>", ParagraphStyle('meta', fontSize=8, textColor=BRAND_TEXT_MUTED))],
        [Paragraph(datetime.now().strftime('%B %d, %Y'), ParagraphStyle('meta_val', fontSize=10, textColor=BRAND_TEXT)),
         Paragraph("SalesAI Platform", ParagraphStyle('meta_val', fontSize=10, textColor=BRAND_TEXT)),
         Paragraph("Confidential", ParagraphStyle('meta_val', fontSize=10, textColor=BRAND_TEXT))]
    ]
    meta_table = Table(meta_data, colWidths=[160, 160, 160])
    meta_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    
    story.append(PageBreak())
    
    # ==================== EXECUTIVE SUMMARY ====================
    story.extend(create_section_header("Executive Summary", BRAND_ACCENT))
    
    if analysis.get('call_summary'):
        summary = analysis['call_summary']
        
        # Outcome in a clean box
        outcome = summary.get('outcome', 'unknown')
        outcome_color = BRAND_SUCCESS if outcome == 'positive' else BRAND_WARNING if outcome == 'neutral' else BRAND_DANGER
        
        outcome_data = [[
            Paragraph(f"<font color='{outcome_color.hexval()}'><b>CALL OUTCOME: {outcome.upper()}</b></font>", 
                     ParagraphStyle('outcome', fontSize=11, alignment=TA_LEFT))
        ]]
        outcome_table = Table(outcome_data, colWidths=[480])
        outcome_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BRAND_BG_LIGHT),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ]))
        story.append(outcome_table)
        story.append(Spacer(1, 15))
        
        # Summary
        story.append(Paragraph(clean_text(summary.get('one_liner', '')), styles['BodyText']))
        story.append(Spacer(1, 12))
        
        # Key topics as tags
        if summary.get('key_topics'):
            topics = summary['key_topics'][:5]  # Max 5 topics
            topics_text = " &nbsp;&nbsp;|&nbsp;&nbsp; ".join([f"<b>{clean_text(t)}</b>" for t in topics])
            story.append(Paragraph(f"<font color='#6366F1' size='9'>KEY TOPICS</font>", styles['Label']))
            story.append(Paragraph(topics_text, ParagraphStyle('topics', fontSize=10, textColor=BRAND_TEXT_SECONDARY, spaceAfter=10)))
    
    # ==================== CUSTOMER INTEREST ====================
    if analysis.get('customer_interest'):
        story.append(Spacer(1, 25))
        story.extend(create_section_header("Customer Interest", BRAND_INFO))
        
        ci = analysis['customer_interest']
        
        # Two-column metrics
        interest_data = [
            [Paragraph("<font size='9' color='#6B7280'>INTEREST LEVEL</font>", ParagraphStyle('lbl', alignment=TA_CENTER)),
             Paragraph("<font size='9' color='#6B7280'>BUYING READINESS</font>", ParagraphStyle('lbl', alignment=TA_CENTER))],
            [Paragraph(f"<font size='20' color='#0891B2'><b>{ci.get('overall_level', 'Unknown').upper()}</b></font>", ParagraphStyle('val', alignment=TA_CENTER)),
             Paragraph(f"<font size='20' color='#059669'><b>{ci.get('buying_readiness', 0)}%</b></font>", ParagraphStyle('val', alignment=TA_CENTER))]
        ]
        interest_table = Table(interest_data, colWidths=[240, 240])
        interest_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), BRAND_BG_LIGHT),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(interest_table)
        story.append(Spacer(1, 18))
        
        # What they want - in a highlight box
        if ci.get('what_they_want'):
            story.append(Paragraph("<font color='#6366F1' size='9'>WHAT THEY REALLY WANT</font>", styles['Label']))
            story.append(Paragraph(clean_text(ci['what_they_want']), styles['InsightText']))
            story.append(Spacer(1, 12))
        
        # Main concerns as bullet list
        if ci.get('main_concerns'):
            story.append(Paragraph("<font color='#DC2626' size='9'>MAIN CONCERNS</font>", styles['Label']))
            for concern in ci['main_concerns']:
                story.append(Paragraph(f"<bullet>&bull;</bullet> {clean_text(concern)}", 
                            ParagraphStyle('concern', fontSize=10, textColor=BRAND_TEXT, leftIndent=15, spaceAfter=4)))
    
    # ==================== OBJECTIONS ====================
    if analysis.get('objections') and len(analysis['objections']) > 0:
        story.append(PageBreak())
        story.extend(create_section_header(f"Objections Detected ({len(analysis['objections'])})", BRAND_WARNING))
        
        for i, obj in enumerate(analysis['objections'], 1):
            # Objection header with score badge
            score = obj.get('handling_score', 0)
            score_color = BRAND_SUCCESS if score >= 7 else BRAND_WARNING if score >= 4 else BRAND_DANGER
            
            header_data = [[
                Paragraph(f"<b>#{i}</b> &nbsp; {obj.get('type', 'Unknown').upper()}", 
                         ParagraphStyle('obj_head', fontSize=12, textColor=BRAND_TEXT, fontName='Helvetica-Bold')),
                Paragraph(f"<font color='{score_color.hexval()}'><b>{score}/10</b></font>", 
                         ParagraphStyle('score', fontSize=14, alignment=TA_RIGHT, fontName='Helvetica-Bold'))
            ]]
            header_table = Table(header_data, colWidths=[380, 100])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ]))
            story.append(header_table)
            
            # Customer objection in red-tinted box
            story.append(Paragraph("<font color='#DC2626' size='8'>CUSTOMER OBJECTION</font>", styles['Label']))
            obj_box = [[Paragraph(f'"{clean_text(obj.get("buyer_statement", ""))}"', 
                       ParagraphStyle('obj_quote', fontSize=10, textColor=BRAND_TEXT, fontName='Helvetica-Oblique', leading=14))]]
            obj_table = Table(obj_box, colWidths=[480])
            obj_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEF2F2')),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]))
            story.append(obj_table)
            story.append(Spacer(1, 8))
            
            # Real concern
            if obj.get('real_concern'):
                story.append(Paragraph("<font color='#D97706' size='8'>UNDERLYING CONCERN</font>", styles['Label']))
                story.append(Paragraph(clean_text(obj['real_concern']), styles['BodyText']))
            
            # Better response in green-tinted box
            story.append(Spacer(1, 8))
            story.append(Paragraph("<font color='#059669' size='8'>RECOMMENDED RESPONSE</font>", styles['Label']))
            better_box = [[Paragraph(f'"{clean_text(obj.get("better_response", ""))}"', 
                          ParagraphStyle('better_quote', fontSize=10, textColor=BRAND_SUCCESS, fontName='Helvetica', leading=14))]]
            better_table = Table(better_box, colWidths=[480])
            better_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F0FDF4')),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ]))
            story.append(better_table)
            
            if obj.get('why_better'):
                story.append(Paragraph(f"<i>{clean_text(obj['why_better'])}</i>", styles['SmallText']))
            
            story.append(Spacer(1, 20))
            story.append(HRFlowable(width="30%", thickness=0.5, color=BRAND_BORDER, spaceBefore=0, spaceAfter=15))
    
    # ==================== CLOSING OPPORTUNITIES ====================
    if analysis.get('closing_opportunities') and len(analysis['closing_opportunities']) > 0:
        story.append(Paragraph(f"Missed Closing Opportunities ({len(analysis['closing_opportunities'])})", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=BRAND_SUCCESS, spaceBefore=5, spaceAfter=15))
        
        for i, opp in enumerate(analysis['closing_opportunities'], 1):
            story.append(Paragraph(f"<b>Opportunity #{i}</b> @ {opp.get('timestamp', '--')} - {opp.get('close_type', '').replace('_', ' ').upper()}", 
                                  styles['SubsectionHeader']))
            
            story.append(Paragraph(f"<b>Customer Signal:</b> \"{opp.get('customer_signal', '')}\"", styles['BodyText']))
            story.append(Paragraph("<font color='#10B981'><b>Suggested Close:</b></font>", styles['Label']))
            story.append(Paragraph(f'"{clean_text(opp.get("suggested_close", ""))}"', styles['BetterResponse']))
            story.append(Spacer(1, 10))
    
    # ==================== STORYTELLING ====================
    if analysis.get('storytelling_analysis') and len(analysis['storytelling_analysis']) > 0:
        story.append(PageBreak())
        story.append(Paragraph(f"Storytelling Analysis ({len(analysis['storytelling_analysis'])})", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=BRAND_SECONDARY, spaceBefore=5, spaceAfter=15))
        
        for i, s in enumerate(analysis['storytelling_analysis'], 1):
            story.append(Paragraph(f"<b>Story #{i}</b> - {s.get('story_type', '').replace('_', ' ').upper()} @ {s.get('timestamp', '--')}", 
                                  styles['SubsectionHeader']))
            
            # Score
            score = s.get('effectiveness_score', 0)
            score_color = BRAND_SUCCESS if score >= 7 else BRAND_WARNING if score >= 4 else BRAND_DANGER
            story.append(Paragraph(f"<b>Effectiveness Score:</b> <font color='{score_color.hexval()}'><b>{score}/10</b></font>", styles['BodyText']))
            
            # Intended message
            if s.get('intended_message'):
                story.append(Paragraph("<b>Intended Message:</b>", styles['Label']))
                story.append(Paragraph(clean_text(s['intended_message']), styles['BodyText']))
            
            # Original story
            story.append(Paragraph("<b>Original Story:</b>", styles['Label']))
            story.append(Paragraph(f'"{clean_text(s.get("original_story", ""))}"', styles['Quote']))
            
            # Issues
            if s.get('issues'):
                story.append(Paragraph("<b>What to Improve:</b>", styles['Label']))
                for issue in s['issues']:
                    story.append(Paragraph(f"- {clean_text(issue)}", styles['SmallText']))
            
            # Improved story
            story.append(Paragraph("<font color='#10B981'><b>Improved Story:</b></font>", styles['Label']))
            story.append(Paragraph(f'"{clean_text(s.get("improved_story", ""))}"', styles['BetterResponse']))
            
            if s.get('why_better'):
                story.append(Paragraph(f"<i>{clean_text(s['why_better'])}</i>", styles['SmallText']))
            
            story.append(Spacer(1, 15))
    
    # ==================== COACHING SUGGESTIONS ====================
    if analysis.get('coaching_suggestions') and len(analysis['coaching_suggestions']) > 0:
        story.append(PageBreak())
        story.append(Paragraph("Coaching Recommendations", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=BRAND_PRIMARY, spaceBefore=5, spaceAfter=15))
        
        for sug in analysis['coaching_suggestions']:
            priority = sug.get('priority', 'medium')
            priority_color = BRAND_DANGER if priority == 'high' else BRAND_WARNING if priority == 'medium' else BRAND_LIGHT
            
            story.append(Paragraph(
                f"<font color='{priority_color.hexval()}'><b>[{priority.upper()}]</b></font> {sug.get('area', '').replace('_', ' ').title()}", 
                styles['SubsectionHeader']
            ))
            
            story.append(Paragraph(clean_text(sug.get('suggested_change', '')), styles['BodyText']))
            
            if sug.get('example_script'):
                story.append(Paragraph("<b>Example Script:</b>", styles['Label']))
                story.append(Paragraph(f'"{clean_text(sug["example_script"])}"', styles['BetterResponse']))
            
            story.append(Spacer(1, 10))
    
    # ==================== NEXT STEPS ====================
    if analysis.get('next_steps_recommended'):
        story.append(Paragraph("Recommended Next Steps", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=BRAND_PRIMARY, spaceBefore=5, spaceAfter=15))
        
        for i, step in enumerate(analysis['next_steps_recommended'], 1):
            story.append(Paragraph(f"<b>{i}.</b> {clean_text(step)}", styles['BodyText']))
    
    # ==================== METRICS APPENDIX ====================
    if metrics:
        story.append(PageBreak())
        story.append(Paragraph("Detailed Metrics", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=BRAND_PRIMARY, spaceBefore=5, spaceAfter=15))
        
        # Talk ratio
        if metrics.get('talk_ratio'):
            tr = metrics['talk_ratio']
            story.append(Paragraph("<b>Talk-to-Listen Ratio:</b>", styles['SubsectionHeader']))
            
            ratio_data = [
                ['Seller', 'Buyer', 'Ideal Range'],
                [f"{tr.get('seller_percentage', 0)}%", f"{tr.get('buyer_percentage', 0)}%", tr.get('ideal_seller_range', '40-60%')]
            ]
            ratio_table = Table(ratio_data, colWidths=[130, 130, 130])
            ratio_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), BRAND_PRIMARY),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 1, BRAND_LIGHT),
            ]))
            story.append(ratio_table)
    
    # Build PDF
    doc.build(story, onFirstPage=lambda c, d: (add_header(c, d), add_footer(c, d)),
              onLaterPages=lambda c, d: (add_header(c, d), add_footer(c, d)))
    
    buffer.seek(0)
    return buffer
