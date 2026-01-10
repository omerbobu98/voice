"""
PDF Report Generator for Sales Call Analysis
Premium Professional Design - Enterprise Grade Reports
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable, KeepTogether, ListFlowable, ListItem
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Rect, String, Circle, Line
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import HorizontalBarChart
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


# Premium Color Palette
PRIMARY = colors.HexColor('#0f172a')        # Dark slate - headers
PRIMARY_LIGHT = colors.HexColor('#1e293b')  # Lighter slate
ACCENT = colors.HexColor('#6366f1')         # Indigo - primary accent
ACCENT_LIGHT = colors.HexColor('#818cf8')   # Light indigo
ACCENT_BG = colors.HexColor('#eef2ff')      # Very light indigo bg
TEXT_PRIMARY = colors.HexColor('#0f172a')   # Almost black - main text
TEXT_SECONDARY = colors.HexColor('#475569') # Slate gray - secondary text
TEXT_MUTED = colors.HexColor('#94a3b8')     # Light gray - captions
BORDER = colors.HexColor('#e2e8f0')         # Light border
BORDER_DARK = colors.HexColor('#cbd5e1')    # Darker border
BG_LIGHT = colors.HexColor('#f8fafc')       # Very light gray background
BG_CARD = colors.HexColor('#ffffff')        # White card background
SUCCESS = colors.HexColor('#10b981')        # Emerald for positive
SUCCESS_BG = colors.HexColor('#ecfdf5')     # Light green bg
WARNING = colors.HexColor('#f59e0b')        # Amber for warning
WARNING_BG = colors.HexColor('#fffbeb')     # Light amber bg
DANGER = colors.HexColor('#ef4444')         # Red for negative/high risk
DANGER_BG = colors.HexColor('#fef2f2')      # Light red bg
INFO = colors.HexColor('#3b82f6')           # Blue for info
INFO_BG = colors.HexColor('#eff6ff')        # Light blue bg


def create_styles():
    """Create premium paragraph styles"""
    styles = getSampleStyleSheet()
    
    # Main Title - Large and bold
    styles.add(ParagraphStyle(
        name='MainTitle',
        fontSize=32,
        textColor=PRIMARY,
        fontName='Helvetica-Bold',
        spaceAfter=8,
        leading=38
    ))
    
    # Report Title
    styles.add(ParagraphStyle(
        name='ReportTitle',
        fontSize=24,
        textColor=PRIMARY,
        fontName='Helvetica-Bold',
        spaceAfter=6,
        leading=30
    ))
    
    # Subtitle
    styles.add(ParagraphStyle(
        name='Subtitle',
        fontSize=13,
        textColor=TEXT_SECONDARY,
        fontName='Helvetica',
        spaceAfter=20,
        leading=18
    ))
    
    # Section Header - With accent color
    styles.add(ParagraphStyle(
        name='SectionHeader',
        fontSize=16,
        textColor=PRIMARY,
        fontName='Helvetica-Bold',
        spaceBefore=24,
        spaceAfter=12,
        leading=20
    ))
    
    # Subsection Header
    styles.add(ParagraphStyle(
        name='SubHeader',
        fontSize=12,
        textColor=TEXT_PRIMARY,
        fontName='Helvetica-Bold',
        spaceBefore=14,
        spaceAfter=8,
        leading=16
    ))
    
    # Body Text - Readable
    styles['BodyText'].fontSize = 10
    styles['BodyText'].textColor = TEXT_PRIMARY
    styles['BodyText'].leading = 15
    styles['BodyText'].spaceAfter = 8
    styles['BodyText'].alignment = TA_JUSTIFY
    
    # Quote/Highlight - For customer statements
    styles.add(ParagraphStyle(
        name='Quote',
        fontSize=10,
        textColor=TEXT_SECONDARY,
        fontName='Helvetica-Oblique',
        leftIndent=16,
        rightIndent=16,
        spaceAfter=8,
        leading=15,
        borderPadding=8
    ))
    
    # Better Response Style
    styles.add(ParagraphStyle(
        name='BetterResponse',
        fontSize=10,
        textColor=SUCCESS,
        fontName='Helvetica',
        leftIndent=16,
        spaceAfter=8,
        leading=15
    ))
    
    # Caption
    styles.add(ParagraphStyle(
        name='Caption',
        fontSize=9,
        textColor=TEXT_MUTED,
        fontName='Helvetica',
        spaceAfter=4,
        leading=12
    ))
    
    # Label style
    styles.add(ParagraphStyle(
        name='Label',
        fontSize=9,
        textColor=TEXT_SECONDARY,
        fontName='Helvetica-Bold',
        spaceBefore=8,
        spaceAfter=4,
        leading=12
    ))
    
    # Metric Value - Large numbers
    styles.add(ParagraphStyle(
        name='MetricValue',
        fontSize=28,
        textColor=PRIMARY,
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        leading=32
    ))
    
    # Metric Label
    styles.add(ParagraphStyle(
        name='MetricLabel',
        fontSize=9,
        textColor=TEXT_MUTED,
        fontName='Helvetica',
        alignment=TA_CENTER,
        leading=12
    ))
    
    # Insight Box
    styles.add(ParagraphStyle(
        name='InsightText',
        fontSize=10,
        textColor=TEXT_PRIMARY,
        fontName='Helvetica',
        leading=14,
        spaceAfter=6
    ))
    
    return styles


def add_header(canvas, doc):
    """Professional header with branding"""
    canvas.saveState()
    
    # Gradient-like accent bar at top
    canvas.setFillColor(ACCENT)
    canvas.rect(0, A4[1] - 4, A4[0], 4, fill=1, stroke=0)
    
    # Logo/Brand with styling
    canvas.setFont('Helvetica-Bold', 10)
    canvas.setFillColor(PRIMARY)
    canvas.drawString(50, A4[1] - 28, "SalesAI")
    
    # Subtitle
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(95, A4[1] - 28, "| Call Analysis Report")
    
    # Page number in circle-like format
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(TEXT_SECONDARY)
    canvas.drawRightString(A4[0] - 50, A4[1] - 28, f"Page {doc.page}")
    
    canvas.restoreState()


def add_footer(canvas, doc):
    """Professional footer with more info"""
    canvas.saveState()
    
    # Footer line
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(50, 40, A4[0] - 50, 40)
    
    # Footer text - left
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(50, 26, f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}")
    
    # Footer text - center
    canvas.drawCentredString(A4[0] / 2, 26, "Powered by SalesAI")
    
    # Footer text - right
    canvas.setFillColor(DANGER)
    canvas.drawRightString(A4[0] - 50, 26, "CONFIDENTIAL")
    
    canvas.restoreState()


def add_cover_header(canvas, doc):
    """Special header for cover page"""
    canvas.saveState()
    
    # Large gradient accent bar
    canvas.setFillColor(ACCENT)
    canvas.rect(0, A4[1] - 6, A4[0], 6, fill=1, stroke=0)
    
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


def get_score_bg(score, is_risk=False):
    """Get background color based on score value"""
    if is_risk:
        if score >= 7 or str(score).upper() == 'HIGH':
            return DANGER_BG
        elif score >= 4 or str(score).upper() == 'MEDIUM':
            return WARNING_BG
        return SUCCESS_BG
    else:
        if score >= 7:
            return SUCCESS_BG
        elif score >= 4:
            return WARNING_BG
        return DANGER_BG


def create_score_gauge(score, max_score=10, width=60, height=60):
    """Create a circular gauge for scores"""
    d = Drawing(width, height)
    
    # Background circle
    d.add(Circle(width/2, height/2, 25, fillColor=BG_LIGHT, strokeColor=BORDER, strokeWidth=2))
    
    # Score text
    color = get_score_color(score)
    d.add(String(width/2, height/2 - 5, str(score), fontSize=16, fontName='Helvetica-Bold',
                 fillColor=color, textAnchor='middle'))
    d.add(String(width/2, height/2 - 18, f'/{max_score}', fontSize=8, fontName='Helvetica',
                 fillColor=TEXT_MUTED, textAnchor='middle'))
    
    return d


def create_metric_card(value, label, color=ACCENT, bg_color=ACCENT_BG):
    """Create a professional metric card"""
    data = [
        [Paragraph(f"<font color='{color.hexval()}'><b>{value}</b></font>", 
                   ParagraphStyle('mv', fontSize=26, fontName='Helvetica-Bold', alignment=TA_CENTER, leading=30))],
        [Paragraph(label.upper(), ParagraphStyle('ml', fontSize=8, textColor=TEXT_MUTED, 
                                                  alignment=TA_CENTER, fontName='Helvetica-Bold', leading=10))]
    ]
    
    table = Table(data, colWidths=[115])
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (0, 0), 15),
        ('BOTTOMPADDING', (0, 1), (0, 1), 12),
        ('BACKGROUND', (0, 0), (-1, -1), bg_color),
        ('ROUNDEDCORNERS', [8, 8, 8, 8]),
    ]))
    return table


def create_insight_box(title, content, icon_color=ACCENT):
    """Create an insight box with title and content"""
    title_para = Paragraph(f"<font color='{icon_color.hexval()}'><b>{title}</b></font>",
                          ParagraphStyle('title', fontSize=10, fontName='Helvetica-Bold', spaceAfter=4))
    content_para = Paragraph(clean_text(content),
                            ParagraphStyle('content', fontSize=9, textColor=TEXT_SECONDARY, leading=13))
    
    data = [[title_para], [content_para]]
    table = Table(data, colWidths=[230])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('ROUNDEDCORNERS', [6, 6, 6, 6]),
    ]))
    return table


def create_horizontal_bar(value, max_value=100, width=200, height=12, color=ACCENT):
    """Create a horizontal progress bar"""
    d = Drawing(width, height)
    
    # Background bar
    d.add(Rect(0, 2, width, height - 4, fillColor=BG_LIGHT, strokeColor=None, rx=4, ry=4))
    
    # Value bar
    bar_width = (value / max_value) * width if max_value > 0 else 0
    if bar_width > 0:
        d.add(Rect(0, 2, bar_width, height - 4, fillColor=color, strokeColor=None, rx=4, ry=4))
    
    return d


def generate_analysis_pdf(analysis_data: dict, transcription_data: dict = None) -> BytesIO:
    """Generate a premium professional PDF report"""
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
    metrics = analysis_data.get('metrics', {})
    
    # ==================== COVER PAGE ====================
    story.append(Spacer(1, 60))
    
    # Brand Header
    story.append(Paragraph("SALESAI", ParagraphStyle('brand', fontSize=12, textColor=ACCENT, 
                                                      fontName='Helvetica-Bold', spaceAfter=8, letterSpacing=2)))
    
    # Main Title
    story.append(Paragraph("Sales Call", styles['MainTitle']))
    story.append(Paragraph("Analysis Report", styles['MainTitle']))
    
    story.append(Spacer(1, 16))
    
    # Summary line with styling
    if analysis.get('call_summary'):
        summary = analysis['call_summary']
        one_liner = clean_text(summary.get('one_liner', ''))
        if one_liner:
            story.append(Paragraph(one_liner, styles['Subtitle']))
    
    story.append(Spacer(1, 40))
    
    # Key Metrics Row - Premium Cards
    overall_score = analysis.get('seller_performance', {}).get('overall_score', 0)
    meddic_score = analysis.get('meddic_score', {}).get('total_score', 0)
    risk_level = analysis.get('deal_risk_score', {}).get('risk_level', 'unknown')
    buying_ready = analysis.get('customer_interest', {}).get('buying_readiness', 0)
    num_objections = len(analysis.get('objections', []))
    
    # Determine risk color
    risk_color = SUCCESS if risk_level == 'low' else WARNING if risk_level == 'medium' else DANGER
    risk_bg = SUCCESS_BG if risk_level == 'low' else WARNING_BG if risk_level == 'medium' else DANGER_BG
    
    metrics_data = [[
        create_metric_card(str(overall_score), "Performance Score", get_score_color(overall_score), get_score_bg(overall_score)),
        create_metric_card(f"{buying_ready}%", "Buying Readiness", ACCENT, ACCENT_BG),
        create_metric_card(str(num_objections), "Objections", WARNING if num_objections > 0 else SUCCESS, 
                          WARNING_BG if num_objections > 0 else SUCCESS_BG),
        create_metric_card(risk_level.upper() if risk_level else "N/A", "Risk Level", risk_color, risk_bg)
    ]]
    
    metrics_table = Table(metrics_data, colWidths=[122, 122, 122, 122])
    metrics_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(metrics_table)
    
    story.append(Spacer(1, 50))
    
    # Report Info Card
    info_card_data = [
        [
            Paragraph("<b>Report Generated</b>", ParagraphStyle('h', fontSize=9, textColor=TEXT_MUTED)),
            Paragraph("<b>Analysis Type</b>", ParagraphStyle('h', fontSize=9, textColor=TEXT_MUTED)),
            Paragraph("<b>Classification</b>", ParagraphStyle('h', fontSize=9, textColor=TEXT_MUTED)),
        ],
        [
            Paragraph(datetime.now().strftime('%B %d, %Y'), ParagraphStyle('v', fontSize=10, textColor=TEXT_PRIMARY)),
            Paragraph("AI Sales Coach", ParagraphStyle('v', fontSize=10, textColor=TEXT_PRIMARY)),
            Paragraph("<font color='#ef4444'><b>CONFIDENTIAL</b></font>", ParagraphStyle('v', fontSize=10)),
        ]
    ]
    info_table = Table(info_card_data, colWidths=[160, 160, 160])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
        ('LINEABOVE', (0, 0), (-1, 0), 1, BORDER),
        ('LINEBELOW', (0, -1), (-1, -1), 1, BORDER),
    ]))
    story.append(info_table)
    
    story.append(PageBreak())
    
    # ==================== EXECUTIVE SUMMARY ====================
    story.append(Paragraph("Executive Summary", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=2, color=ACCENT))
    story.append(Spacer(1, 16))
    
    if analysis.get('call_summary'):
        summary = analysis['call_summary']
        
        # Outcome Badge
        outcome = summary.get('outcome', 'unknown')
        outcome_color = SUCCESS if outcome == 'positive' else WARNING if outcome == 'neutral' else DANGER
        outcome_bg = SUCCESS_BG if outcome == 'positive' else WARNING_BG if outcome == 'neutral' else DANGER_BG
        
        outcome_data = [[
            Paragraph(f"<font color='{outcome_color.hexval()}'><b>CALL OUTCOME: {outcome.upper()}</b></font>",
                     ParagraphStyle('outcome', fontSize=11, alignment=TA_CENTER, fontName='Helvetica-Bold'))
        ]]
        outcome_table = Table(outcome_data, colWidths=[480])
        outcome_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), outcome_bg),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        story.append(outcome_table)
        story.append(Spacer(1, 16))
        
        # Summary Text
        if summary.get('one_liner'):
            story.append(Paragraph(clean_text(summary['one_liner']), styles['BodyText']))
            story.append(Spacer(1, 12))
        
        # Key Topics as tags
        if summary.get('key_topics'):
            topics = [clean_text(t) for t in summary['key_topics'][:6]]
            topics_text = " &nbsp;|&nbsp; ".join([f"<b>{t}</b>" for t in topics])
            story.append(Paragraph(f"<font color='{ACCENT.hexval()}'>KEY TOPICS:</font> {topics_text}", 
                                  ParagraphStyle('topics', fontSize=9, textColor=TEXT_SECONDARY, leading=14)))
    
    # ==================== CUSTOMER INTEREST ====================
    if analysis.get('customer_interest'):
        story.append(Spacer(1, 20))
        story.append(Paragraph("Customer Interest Analysis", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=ACCENT))
        story.append(Spacer(1, 16))
        
        ci = analysis['customer_interest']
        
        # Interest metrics - Premium Cards
        interest_level = ci.get('overall_level', 'Unknown').upper()
        interest_color = SUCCESS if interest_level in ['HIGH', 'VERY HIGH'] else WARNING if interest_level == 'MEDIUM' else DANGER
        
        interest_data = [
            [
                Paragraph("INTEREST LEVEL", ParagraphStyle('h', fontSize=8, textColor=TEXT_MUTED, alignment=TA_CENTER, fontName='Helvetica-Bold')),
                Paragraph("BUYING READINESS", ParagraphStyle('h', fontSize=8, textColor=TEXT_MUTED, alignment=TA_CENTER, fontName='Helvetica-Bold')),
                Paragraph("ENGAGEMENT", ParagraphStyle('h', fontSize=8, textColor=TEXT_MUTED, alignment=TA_CENTER, fontName='Helvetica-Bold')),
            ],
            [
                Paragraph(f"<font color='{interest_color.hexval()}'><b>{interest_level}</b></font>", 
                         ParagraphStyle('v', fontSize=18, alignment=TA_CENTER, fontName='Helvetica-Bold')),
                Paragraph(f"<font color='{ACCENT.hexval()}'><b>{ci.get('buying_readiness', 0)}%</b></font>", 
                         ParagraphStyle('v', fontSize=18, alignment=TA_CENTER, fontName='Helvetica-Bold')),
                Paragraph(f"<font color='{INFO.hexval()}'><b>{ci.get('engagement_level', 'N/A').upper()}</b></font>", 
                         ParagraphStyle('v', fontSize=18, alignment=TA_CENTER, fontName='Helvetica-Bold')),
            ]
        ]
        interest_table = Table(interest_data, colWidths=[160, 160, 160])
        interest_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
            ('TOPPADDING', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
            ('TOPPADDING', (0, 1), (-1, 1), 8),
            ('BOTTOMPADDING', (0, 1), (-1, 1), 12),
            ('BOX', (0, 0), (-1, -1), 1, BORDER),
        ]))
        story.append(interest_table)
        story.append(Spacer(1, 16))
        
        # Two column layout for wants and concerns
        col_data = []
        
        wants_content = ""
        if ci.get('what_they_want'):
            wants_content = clean_text(ci['what_they_want'])
        
        concerns_content = ""
        if ci.get('main_concerns'):
            concerns_content = "<br/>".join([f"• {clean_text(c)}" for c in ci['main_concerns'][:4]])
        
        if wants_content or concerns_content:
            col_data = [[
                Table([
                    [Paragraph("<font color='#10b981'><b>WHAT THEY WANT</b></font>", 
                              ParagraphStyle('h', fontSize=9, textColor=SUCCESS, fontName='Helvetica-Bold'))],
                    [Paragraph(wants_content or "Not specified", 
                              ParagraphStyle('c', fontSize=9, textColor=TEXT_SECONDARY, leading=13))]
                ], colWidths=[230]),
                Table([
                    [Paragraph("<font color='#ef4444'><b>MAIN CONCERNS</b></font>", 
                              ParagraphStyle('h', fontSize=9, textColor=DANGER, fontName='Helvetica-Bold'))],
                    [Paragraph(concerns_content or "None identified", 
                              ParagraphStyle('c', fontSize=9, textColor=TEXT_SECONDARY, leading=13))]
                ], colWidths=[230])
            ]]
            
            cols_table = Table(col_data, colWidths=[240, 240])
            cols_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(cols_table)
    
    # ==================== OBJECTIONS ====================
    if analysis.get('objections') and len(analysis['objections']) > 0:
        story.append(PageBreak())
        story.append(Paragraph(f"Objections Detected", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=DANGER))
        story.append(Spacer(1, 8))
        
        # Summary bar
        avg_score = sum(o.get('handling_score', 0) for o in analysis['objections']) / len(analysis['objections'])
        summary_data = [[
            Paragraph(f"<b>{len(analysis['objections'])}</b> objections found", 
                     ParagraphStyle('s', fontSize=10, textColor=TEXT_PRIMARY)),
            Paragraph(f"Average handling score: <font color='{get_score_color(avg_score).hexval()}'><b>{avg_score:.1f}/10</b></font>", 
                     ParagraphStyle('s', fontSize=10, textColor=TEXT_PRIMARY, alignment=TA_RIGHT))
        ]]
        summary_table = Table(summary_data, colWidths=[240, 240])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), DANGER_BG),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 16))
        
        for i, obj in enumerate(analysis['objections'], 1):
            # Objection Card
            score = obj.get('handling_score', 0)
            score_color = get_score_color(score)
            obj_type = obj.get('type', 'unknown').replace('_', ' ').title()
            
            # Header row with type and score
            header_data = [[
                Paragraph(f"<font color='{DANGER.hexval()}'><b>OBJECTION #{i}</b></font> &nbsp; | &nbsp; <b>{obj_type}</b>",
                         ParagraphStyle('h', fontSize=10, fontName='Helvetica-Bold')),
                Paragraph(f"<font color='{score_color.hexval()}'><b>{score}/10</b></font>",
                         ParagraphStyle('s', fontSize=14, fontName='Helvetica-Bold', alignment=TA_RIGHT))
            ]]
            header_table = Table(header_data, colWidths=[380, 100])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ]))
            story.append(header_table)
            
            # Customer statement box
            story.append(Spacer(1, 8))
            story.append(Paragraph("<font color='#64748b'><b>CUSTOMER SAID:</b></font>", styles['Label']))
            cust_data = [[Paragraph(f'"{clean_text(obj.get("buyer_statement", ""))}"', 
                                   ParagraphStyle('q', fontSize=10, textColor=TEXT_SECONDARY, 
                                                 fontName='Helvetica-Oblique', leading=14))]]
            cust_table = Table(cust_data, colWidths=[480])
            cust_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('LINEBEFORE', (0, 0), (0, -1), 3, WARNING),
            ]))
            story.append(cust_table)
            
            # Real concern
            if obj.get('real_concern'):
                story.append(Spacer(1, 6))
                story.append(Paragraph(f"<font color='#64748b'><b>REAL CONCERN:</b></font> {clean_text(obj['real_concern'])}", 
                                      ParagraphStyle('rc', fontSize=9, textColor=TEXT_SECONDARY, leading=13)))
            
            # Better response - highlighted
            story.append(Spacer(1, 10))
            story.append(Paragraph("<font color='#10b981'><b>RECOMMENDED RESPONSE:</b></font>", styles['Label']))
            better_data = [[Paragraph(f'"{clean_text(obj.get("better_response", ""))}"', 
                                     ParagraphStyle('b', fontSize=10, textColor=SUCCESS, leading=14))]]
            better_table = Table(better_data, colWidths=[480])
            better_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), SUCCESS_BG),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('LINEBEFORE', (0, 0), (0, -1), 3, SUCCESS),
            ]))
            story.append(better_table)
            
            # Technique and follow-up
            if obj.get('technique_to_use') or obj.get('follow_up_close'):
                story.append(Spacer(1, 6))
                tech_text = ""
                if obj.get('technique_to_use'):
                    tech_text += f"<b>Technique:</b> {obj['technique_to_use']}"
                if obj.get('follow_up_close'):
                    if tech_text:
                        tech_text += " &nbsp;|&nbsp; "
                    tech_text += f"<b>Follow-up:</b> {clean_text(obj['follow_up_close'])}"
                story.append(Paragraph(tech_text, ParagraphStyle('tech', fontSize=9, textColor=TEXT_MUTED, leading=12)))
            
            story.append(Spacer(1, 20))
    
    # ==================== CLOSING OPPORTUNITIES ====================
    if analysis.get('closing_opportunities') and len(analysis['closing_opportunities']) > 0:
        story.append(Spacer(1, 20))
        story.append(Paragraph(f"Missed Closing Opportunities", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=WARNING))
        story.append(Spacer(1, 8))
        
        # Summary
        opp_summary = [[Paragraph(f"<b>{len(analysis['closing_opportunities'])}</b> opportunities to close were missed", 
                                 ParagraphStyle('s', fontSize=10, textColor=TEXT_PRIMARY))]]
        opp_table = Table(opp_summary, colWidths=[480])
        opp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), WARNING_BG),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ]))
        story.append(opp_table)
        story.append(Spacer(1, 12))
        
        for i, opp in enumerate(analysis['closing_opportunities'], 1):
            # Card header
            close_type = opp.get('close_type', '').replace('_', ' ').title()
            header = [[
                Paragraph(f"<font color='{WARNING.hexval()}'><b>#{i}</b></font> &nbsp; {close_type}",
                         ParagraphStyle('h', fontSize=10, fontName='Helvetica-Bold')),
                Paragraph(f"<font color='{TEXT_MUTED.hexval()}'>{opp.get('timestamp', '--')}</font>",
                         ParagraphStyle('t', fontSize=9, alignment=TA_RIGHT))
            ]]
            h_table = Table(header, colWidths=[380, 100])
            h_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), BG_LIGHT),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ]))
            story.append(h_table)
            
            story.append(Spacer(1, 6))
            story.append(Paragraph(f"<b>Customer Signal:</b> \"{clean_text(opp.get('customer_signal', ''))}\"", 
                                  ParagraphStyle('sig', fontSize=9, textColor=TEXT_SECONDARY, leading=13)))
            story.append(Spacer(1, 4))
            story.append(Paragraph(f"<font color='{SUCCESS.hexval()}'><b>Should have said:</b></font> \"{clean_text(opp.get('suggested_close', ''))}\"", 
                                  ParagraphStyle('sug', fontSize=9, textColor=SUCCESS, leading=13)))
            story.append(Spacer(1, 12))
    
    # ==================== SELLER PERFORMANCE ====================
    if analysis.get('seller_performance'):
        sp = analysis['seller_performance']
        story.append(PageBreak())
        story.append(Paragraph("Seller Performance Summary", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=ACCENT))
        story.append(Spacer(1, 16))
        
        # Score Display
        score = sp.get('overall_score', 0)
        score_color = get_score_color(score)
        score_bg = get_score_bg(score)
        
        score_data = [[
            Paragraph(f"<font color='{score_color.hexval()}'><b>{score}</b></font>",
                     ParagraphStyle('s', fontSize=48, fontName='Helvetica-Bold', alignment=TA_CENTER)),
        ], [
            Paragraph("OVERALL PERFORMANCE SCORE",
                     ParagraphStyle('l', fontSize=10, textColor=TEXT_MUTED, alignment=TA_CENTER, fontName='Helvetica-Bold'))
        ]]
        score_table = Table(score_data, colWidths=[200])
        score_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BACKGROUND', (0, 0), (-1, -1), score_bg),
            ('TOPPADDING', (0, 0), (0, 0), 20),
            ('BOTTOMPADDING', (0, 1), (0, 1), 16),
        ]))
        
        # Center the score card
        centered = Table([[score_table]], colWidths=[480])
        centered.setStyle(TableStyle([('ALIGN', (0, 0), (-1, -1), 'CENTER')]))
        story.append(centered)
        story.append(Spacer(1, 24))
        
        # Two columns: Strengths and Areas to Improve
        strengths_items = sp.get('strengths', [])
        improve_items = sp.get('areas_to_improve', [])
        
        if strengths_items or improve_items:
            strengths_content = "<br/>".join([f"<font color='#10b981'>+</font> {clean_text(s)}" for s in strengths_items[:5]]) if strengths_items else "None identified"
            improve_content = "<br/>".join([f"<font color='#ef4444'>-</font> {clean_text(a)}" for a in improve_items[:5]]) if improve_items else "None identified"
            
            perf_data = [[
                Table([
                    [Paragraph("<font color='#10b981'><b>STRENGTHS</b></font>", 
                              ParagraphStyle('h', fontSize=10, fontName='Helvetica-Bold'))],
                    [Paragraph(strengths_content, ParagraphStyle('c', fontSize=9, textColor=TEXT_SECONDARY, leading=14))]
                ], colWidths=[230]),
                Table([
                    [Paragraph("<font color='#ef4444'><b>AREAS TO IMPROVE</b></font>", 
                              ParagraphStyle('h', fontSize=10, fontName='Helvetica-Bold'))],
                    [Paragraph(improve_content, ParagraphStyle('c', fontSize=9, textColor=TEXT_SECONDARY, leading=14))]
                ], colWidths=[230])
            ]]
            
            perf_table = Table(perf_data, colWidths=[240, 240])
            perf_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('BACKGROUND', (0, 0), (0, -1), SUCCESS_BG),
                ('BACKGROUND', (1, 0), (1, -1), DANGER_BG),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ]))
            story.append(perf_table)
    
    # ==================== COACHING RECOMMENDATIONS ====================
    if analysis.get('coaching_suggestions') and len(analysis['coaching_suggestions']) > 0:
        story.append(Spacer(1, 24))
        story.append(Paragraph("Coaching Recommendations", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=INFO))
        story.append(Spacer(1, 16))
        
        for i, sug in enumerate(analysis['coaching_suggestions'], 1):
            priority = sug.get('priority', 'medium')
            priority_color = DANGER if priority == 'high' else WARNING if priority == 'medium' else SUCCESS
            priority_bg = DANGER_BG if priority == 'high' else WARNING_BG if priority == 'medium' else SUCCESS_BG
            
            # Priority badge and area
            area = sug.get('area', '').replace('_', ' ').title()
            badge_data = [[
                Paragraph(f"<font color='{priority_color.hexval()}'><b>{priority.upper()}</b></font>",
                         ParagraphStyle('p', fontSize=8, fontName='Helvetica-Bold', alignment=TA_CENTER))
            ]]
            badge = Table(badge_data, colWidths=[60])
            badge.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), priority_bg),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ]))
            
            header_data = [[badge, Paragraph(f"<b>{area}</b>", ParagraphStyle('a', fontSize=11, fontName='Helvetica-Bold'))]]
            header_table = Table(header_data, colWidths=[70, 410])
            header_table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('LEFTPADDING', (1, 0), (1, 0), 10),
            ]))
            story.append(header_table)
            
            story.append(Spacer(1, 6))
            story.append(Paragraph(clean_text(sug.get('suggestion', '')), 
                                  ParagraphStyle('sug', fontSize=10, textColor=TEXT_SECONDARY, leading=14, leftIndent=12)))
            
            if sug.get('example'):
                story.append(Spacer(1, 4))
                story.append(Paragraph(f"<i><font color='{TEXT_MUTED.hexval()}'>Example: {clean_text(sug['example'])}</font></i>", 
                                      ParagraphStyle('ex', fontSize=9, leftIndent=12, leading=12)))
            
            story.append(Spacer(1, 14))
    
    # ==================== STORYTELLING (if exists) ====================
    if analysis.get('storytelling_analysis') and len(analysis['storytelling_analysis']) > 0:
        story.append(PageBreak())
        story.append(Paragraph("Storytelling Analysis", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=ACCENT_LIGHT))
        story.append(Spacer(1, 16))
        
        for i, s in enumerate(analysis['storytelling_analysis'], 1):
            story_type = s.get('story_type', '').replace('_', ' ').title()
            
            # Header
            sh_data = [[
                Paragraph(f"<font color='{ACCENT.hexval()}'><b>STORY #{i}</b></font> &nbsp; | &nbsp; {story_type}",
                         ParagraphStyle('h', fontSize=10, fontName='Helvetica-Bold')),
                Paragraph(f"{s.get('timestamp', '--')}", ParagraphStyle('t', fontSize=9, textColor=TEXT_MUTED, alignment=TA_RIGHT))
            ]]
            sh_table = Table(sh_data, colWidths=[380, 100])
            sh_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), ACCENT_BG),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ]))
            story.append(sh_table)
            
            # Original
            story.append(Spacer(1, 8))
            story.append(Paragraph("<font color='#64748b'><b>ORIGINAL STORY:</b></font>", styles['Label']))
            story.append(Paragraph(f'"{clean_text(s.get("original_story", ""))}"', 
                                  ParagraphStyle('o', fontSize=9, textColor=TEXT_SECONDARY, fontName='Helvetica-Oblique', 
                                               leading=13, leftIndent=12)))
            
            # Improved
            story.append(Spacer(1, 10))
            story.append(Paragraph("<font color='#10b981'><b>IMPROVED VERSION:</b></font>", styles['Label']))
            imp_data = [[Paragraph(f'"{clean_text(s.get("improved_story", ""))}"', 
                                  ParagraphStyle('i', fontSize=9, textColor=SUCCESS, leading=13))]]
            imp_table = Table(imp_data, colWidths=[480])
            imp_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), SUCCESS_BG),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ]))
            story.append(imp_table)
            
            if s.get('why_better'):
                story.append(Spacer(1, 6))
                story.append(Paragraph(f"<i><font color='{TEXT_MUTED.hexval()}'>Why better: {clean_text(s['why_better'])}</font></i>", 
                                      ParagraphStyle('w', fontSize=8, leading=11)))
            
            story.append(Spacer(1, 18))
    
    # Build PDF with header and footer
    def on_page(canvas, doc):
        add_header(canvas, doc)
        add_footer(canvas, doc)
    
    doc.build(story, onFirstPage=on_page, onLaterPages=on_page)
    buffer.seek(0)
    return buffer
