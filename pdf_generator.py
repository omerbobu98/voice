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


# Brand Colors
BRAND_PRIMARY = colors.HexColor('#8B5CF6')  # Violet
BRAND_SECONDARY = colors.HexColor('#D946EF')  # Fuchsia
BRAND_SUCCESS = colors.HexColor('#10B981')  # Emerald
BRAND_WARNING = colors.HexColor('#F59E0B')  # Amber
BRAND_DANGER = colors.HexColor('#EF4444')  # Red
BRAND_INFO = colors.HexColor('#06B6D4')  # Cyan
BRAND_DARK = colors.HexColor('#1F2937')
BRAND_LIGHT = colors.HexColor('#F3F4F6')


def create_styles():
    """Create custom paragraph styles for the PDF"""
    styles = getSampleStyleSheet()
    
    # Title style
    styles.add(ParagraphStyle(
        name='ReportTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=BRAND_PRIMARY,
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    # Section header style
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=BRAND_PRIMARY,
        spaceBefore=20,
        spaceAfter=10,
        fontName='Helvetica-Bold',
        borderColor=BRAND_PRIMARY,
        borderWidth=0,
        borderPadding=5,
    ))
    
    # Subsection header
    styles.add(ParagraphStyle(
        name='SubsectionHeader',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=BRAND_DARK,
        spaceBefore=15,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    ))
    
    # Body text
    styles.add(ParagraphStyle(
        name='BodyText',
        parent=styles['Normal'],
        fontSize=10,
        textColor=BRAND_DARK,
        spaceAfter=6,
        alignment=TA_JUSTIFY,
        leading=14
    ))
    
    # Quote style (for customer/seller statements)
    styles.add(ParagraphStyle(
        name='Quote',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#4B5563'),
        leftIndent=20,
        rightIndent=20,
        spaceAfter=8,
        fontName='Helvetica-Oblique',
        leading=14
    ))
    
    # Better response style
    styles.add(ParagraphStyle(
        name='BetterResponse',
        parent=styles['Normal'],
        fontSize=10,
        textColor=BRAND_SUCCESS,
        leftIndent=20,
        rightIndent=20,
        spaceAfter=8,
        fontName='Helvetica-Bold',
        leading=14
    ))
    
    # Score style
    styles.add(ParagraphStyle(
        name='ScoreText',
        parent=styles['Normal'],
        fontSize=24,
        textColor=BRAND_PRIMARY,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))
    
    # Small text
    styles.add(ParagraphStyle(
        name='SmallText',
        parent=styles['Normal'],
        fontSize=8,
        textColor=colors.HexColor('#6B7280'),
        spaceAfter=4
    ))
    
    # Label style
    styles.add(ParagraphStyle(
        name='Label',
        parent=styles['Normal'],
        fontSize=9,
        textColor=colors.HexColor('#6B7280'),
        spaceAfter=2,
        fontName='Helvetica-Bold'
    ))
    
    return styles


def add_header(canvas, doc):
    """Add header to each page"""
    canvas.saveState()
    
    # Header line
    canvas.setStrokeColor(BRAND_PRIMARY)
    canvas.setLineWidth(2)
    canvas.line(50, A4[1] - 40, A4[0] - 50, A4[1] - 40)
    
    # Company name
    canvas.setFont('Helvetica-Bold', 10)
    canvas.setFillColor(BRAND_PRIMARY)
    canvas.drawString(50, A4[1] - 30, "SalesAI")
    
    # Page number
    canvas.setFont('Helvetica', 9)
    canvas.setFillColor(BRAND_DARK)
    canvas.drawRightString(A4[0] - 50, A4[1] - 30, f"Page {doc.page}")
    
    canvas.restoreState()


def add_footer(canvas, doc):
    """Add footer to each page"""
    canvas.saveState()
    
    # Footer line
    canvas.setStrokeColor(BRAND_LIGHT)
    canvas.setLineWidth(1)
    canvas.line(50, 40, A4[0] - 50, 40)
    
    # Footer text
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.HexColor('#9CA3AF'))
    canvas.drawString(50, 25, f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    canvas.drawRightString(A4[0] - 50, 25, "Confidential - Sales Call Analysis Report")
    
    canvas.restoreState()


def create_score_box(score, label, color=BRAND_PRIMARY):
    """Create a score display box"""
    data = [[Paragraph(f"<font size='24' color='{color.hexval()}'><b>{score}</b></font>", 
                       ParagraphStyle('score', alignment=TA_CENTER))],
            [Paragraph(f"<font size='9' color='#6B7280'>{label}</font>", 
                       ParagraphStyle('label', alignment=TA_CENTER))]]
    
    table = Table(data, colWidths=[80])
    table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOX', (0, 0), (-1, -1), 1, BRAND_LIGHT),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FAFAFA')),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    return table


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
    
    # ==================== COVER PAGE ====================
    story.append(Spacer(1, 100))
    story.append(Paragraph("Sales Call Analysis Report", styles['ReportTitle']))
    story.append(Spacer(1, 20))
    
    # Call summary one-liner
    if analysis.get('call_summary'):
        summary = analysis['call_summary']
        story.append(Paragraph(f"<i>{clean_text(summary.get('one_liner', 'Call Analysis'))}</i>", 
                              ParagraphStyle('subtitle', fontSize=14, textColor=BRAND_DARK, alignment=TA_CENTER)))
    
    story.append(Spacer(1, 40))
    
    # Quick stats table
    overall_score = analysis.get('seller_performance', {}).get('overall_score', 0)
    meddic_score = analysis.get('meddic_score', {}).get('total_score', 0)
    risk_level = analysis.get('deal_risk_score', {}).get('risk_level', 'unknown')
    
    # Score boxes
    score_data = [
        [create_score_box(overall_score, "Overall Score"),
         create_score_box(f"{meddic_score}%", "MEDDIC Score"),
         create_score_box(risk_level.upper(), "Risk Level", 
                         BRAND_SUCCESS if risk_level == 'low' else BRAND_WARNING if risk_level == 'medium' else BRAND_DANGER)]
    ]
    
    score_table = Table(score_data, colWidths=[150, 150, 150])
    score_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(score_table)
    
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="80%", thickness=1, color=BRAND_LIGHT, spaceBefore=10, spaceAfter=10))
    
    # Date
    story.append(Paragraph(f"<font size='10' color='#6B7280'>Report Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}</font>", 
                          ParagraphStyle('date', alignment=TA_CENTER)))
    
    story.append(PageBreak())
    
    # ==================== EXECUTIVE SUMMARY ====================
    story.append(Paragraph("Executive Summary", styles['SectionHeader']))
    story.append(HRFlowable(width="100%", thickness=2, color=BRAND_PRIMARY, spaceBefore=5, spaceAfter=15))
    
    if analysis.get('call_summary'):
        summary = analysis['call_summary']
        
        # Outcome badge
        outcome = summary.get('outcome', 'unknown')
        outcome_color = BRAND_SUCCESS if outcome == 'positive' else BRAND_WARNING if outcome == 'neutral' else BRAND_DANGER
        story.append(Paragraph(f"<b>Call Outcome:</b> <font color='{outcome_color.hexval()}'>{outcome.upper()}</font>", styles['BodyText']))
        story.append(Spacer(1, 10))
        
        # Summary
        story.append(Paragraph(clean_text(summary.get('one_liner', '')), styles['BodyText']))
        story.append(Spacer(1, 10))
        
        # Key topics
        if summary.get('key_topics'):
            topics_text = " - ".join([clean_text(t) for t in summary['key_topics']])
            story.append(Paragraph(f"<b>Key Topics:</b> {topics_text}", styles['BodyText']))
    
    # ==================== CUSTOMER INTEREST ====================
    if analysis.get('customer_interest'):
        story.append(Spacer(1, 20))
        story.append(Paragraph("Customer Interest Analysis", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=BRAND_INFO, spaceBefore=5, spaceAfter=15))
        
        ci = analysis['customer_interest']
        
        # Interest level and buying readiness
        interest_data = [
            ['Interest Level', 'Buying Readiness'],
            [ci.get('overall_level', 'Unknown').upper(), f"{ci.get('buying_readiness', 0)}%"]
        ]
        interest_table = Table(interest_data, colWidths=[200, 200])
        interest_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), BRAND_INFO),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTSIZE', (0, 1), (-1, 1), 14),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, BRAND_LIGHT),
        ]))
        story.append(interest_table)
        story.append(Spacer(1, 15))
        
        # What they want
        if ci.get('what_they_want'):
            story.append(Paragraph("<b>What They Really Want:</b>", styles['Label']))
            story.append(Paragraph(clean_text(ci['what_they_want']), styles['BodyText']))
        
        # Main concerns
        if ci.get('main_concerns'):
            story.append(Paragraph("<b>Main Concerns:</b>", styles['Label']))
            for concern in ci['main_concerns']:
                story.append(Paragraph(f"- {clean_text(concern)}", styles['BodyText']))
    
    # ==================== OBJECTIONS ====================
    if analysis.get('objections') and len(analysis['objections']) > 0:
        story.append(PageBreak())
        story.append(Paragraph(f"Objections Detected ({len(analysis['objections'])})", styles['SectionHeader']))
        story.append(HRFlowable(width="100%", thickness=2, color=BRAND_WARNING, spaceBefore=5, spaceAfter=15))
        
        for i, obj in enumerate(analysis['objections'], 1):
            story.append(Paragraph(f"<b>Objection #{i}</b> - {obj.get('type', 'Unknown').upper()} @ {obj.get('timestamp', '--')}", 
                                  styles['SubsectionHeader']))
            
            # Customer objection
            story.append(Paragraph("<font color='#EF4444'><b>Customer Objection:</b></font>", styles['Label']))
            story.append(Paragraph(f'"{clean_text(obj.get("buyer_statement", ""))}"', styles['Quote']))
            
            # Real concern
            if obj.get('real_concern'):
                story.append(Paragraph("<font color='#F59E0B'><b>Real Concern:</b></font>", styles['Label']))
                story.append(Paragraph(clean_text(obj['real_concern']), styles['BodyText']))
            
            # Seller's response
            story.append(Paragraph("<font color='#3B82F6'><b>Seller Response:</b></font>", styles['Label']))
            story.append(Paragraph(f'"{clean_text(obj.get("seller_response", ""))}"', styles['Quote']))
            
            # Handling score
            score = obj.get('handling_score', 0)
            score_color = BRAND_SUCCESS if score >= 7 else BRAND_WARNING if score >= 4 else BRAND_DANGER
            story.append(Paragraph(f"<b>Handling Score:</b> <font color='{score_color.hexval()}'><b>{score}/10</b></font>", styles['BodyText']))
            
            # Better response
            story.append(Paragraph("<font color='#10B981'><b>Better Response:</b></font>", styles['Label']))
            story.append(Paragraph(f'"{clean_text(obj.get("better_response", ""))}"', styles['BetterResponse']))
            
            if obj.get('why_better'):
                story.append(Paragraph(f"<i>{obj['why_better']}</i>", styles['SmallText']))
            
            story.append(Spacer(1, 15))
            story.append(HRFlowable(width="50%", thickness=0.5, color=BRAND_LIGHT, spaceBefore=5, spaceAfter=15))
    
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
