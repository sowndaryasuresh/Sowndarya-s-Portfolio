"""Build the factual two-page A4 master resume. Run with reportlab and pypdf installed."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PdfReader

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/Sowndarya-Sureshkumar-Resume.pdf'
for alias,file in [('Body','GoogleSans-400.ttf'),('Bold','GoogleSans-600.ttf'),('Heading','InstrumentSans-500.ttf')]:
 pdfmetrics.registerFont(TTFont(alias,str(ROOT/'assets/fonts'/file)))
pdfmetrics.registerFontFamily('Body',normal='Body',bold='Bold',italic='Body',boldItalic='Bold')
W,H=A4; M=15*72/25.4; WIDTH=W-2*M
INK=HexColor('#172321'); GREEN=HexColor('#1A6A51'); MUTED=HexColor('#52625A'); LINE=HexColor('#D5DFD3')
c=canvas.Canvas(str(OUT),pagesize=A4,pageCompression=1)
c.setTitle('Sowndarya Sureshkumar | Customer Success, Business Analysis & Operations')
c.setAuthor('Sowndarya Sureshkumar');c.setSubject('Two-page master resume');c.setCreator('Portfolio resume builder / ReportLab')
y=H-M
styles={
 'body':ParagraphStyle('body',fontName='Body',fontSize=10.5,leading=15.5,textColor=INK),
 'small':ParagraphStyle('small',fontName='Body',fontSize=9.2,leading=14,textColor=MUTED),
 'bullet':ParagraphStyle('bullet',fontName='Body',fontSize=10.5,leading=15.5,textColor=INK,leftIndent=10,firstLineIndent=-10),
 'role':ParagraphStyle('role',fontName='Bold',fontSize=10.5,leading=15.5,textColor=GREEN),
}
def para(text,style='body',after=8):
 global y
 p=Paragraph(text,styles[style]);w,h=p.wrap(WIDTH,800)
 assert y-h> M+12, f'Overflow on page {c.getPageNumber()}: {text}'
 p.drawOn(c,M,y-h);y-=h+after

def section(title):
 global y
 y-=10;c.setStrokeColor(LINE);c.setLineWidth(.6);c.line(M,y,W-M,y);y-=20
 c.setFillColor(GREEN);c.setFont('Bold',10);c.drawString(M,y,title.upper());y-=20

def job(company,role,dates,bullets,note=None):
 global y
 c.setFillColor(INK);c.setFont('Heading',15);c.drawString(M,y,company);y-=20
 para(role+' | '+dates,'role',6)
 if note:para(note,'small',6)
 for b in bullets:para('• '+b,'bullet',5)
 y-=18

def footer(page):
 c.setStrokeColor(LINE);c.line(M,37,W-M,37);c.setFillColor(MUTED);c.setFont('Body',8)
 c.drawString(M,24,'Sowndarya Sureshkumar | Customer relations, analysis & operations')
 c.drawRightString(W-M,24,f'{page} / 2')

c.setFillColor(INK);c.setFont('Heading',28);c.drawString(M,y-24,'Sowndarya Sureshkumar');y-=49
para('Customer Relations &amp; Success | Business Analysis | Operations','role',10)
para('Coimbatore, Tamil Nadu, India | +91 7548814760<br/><link href="mailto:sowndaryas397@gmail.com" color="#1A6A51">sowndaryas397@gmail.com</link> | <link href="https://www.linkedin.com/in/sowndarya-suresh-kumar/" color="#1A6A51">LinkedIn</link> | <link href="https://sowndaryasuresh.github.io/Sowndarya-s-Portfolio/" color="#1A6A51">Professional portfolio</link>','small',8)
section('Professional summary')
para('MBA graduate in Finance and Data Analytics with experience supporting customer relationships, requirements gathering, stakeholder coordination and business documentation. Brings customer success internship experience and hands-on AI response evaluation, validation and structured feedback. Currently contributes to operational activities and process improvement in a customer relations role.')
section('Core competencies')
para('Customer Relationship Management (CRM) • Client communication • Requirements gathering • Stakeholder coordination • Business documentation • Operational support • Quality assessment • Response validation',after=6)
section('Professional experience')
job('Jeevan Infotech','Customer Relations Executive','Mar 2026 - Present',[
 'Support operational activities and contribute to process improvement.'
])
job('Charky Labs Pvt. Ltd.','Customer Success Specialist Intern','Jul 2025 - Nov 2025',[
 'Supported client communication, customer relationship management and coordination with internal stakeholders.',
 'Assisted with requirements gathering and proposal preparation.',
 'Used Odoo CRM and Notion to support documentation and collaborative activities.',
 'Contributed to Request for Proposal (RFP), Memorandum of Understanding (MoU) and vendor assessment activities.'
])
footer(1);c.showPage();y=H-M
c.setFillColor(INK);c.setFont('Heading',18);c.drawString(M,y-15,'Sowndarya Sureshkumar');y-=34
para('Experience, education & capabilities','small',0)
section('Professional experience - continued')
job('Turing','Business Analyst QA / LLM Trainer','Sep 2024 - Apr 2025',[
 'Evaluated AI-generated responses for accuracy and relevance across multilingual and multimodal tasks.',
 'Performed annotation and response validation, identifying inconsistencies in generated content.',
 'Provided structured feedback to support quality assessment.'
], 'Followed by short-term contract work.')
section('Education')
para('<b>Master of Business Administration</b> | Oct 2022 - May 2024<br/>Kumaraguru College of Technology - Business School<br/>Finance (Major), Data Analytics (Minor)',after=12)
para('<b>BSc. Biochemistry</b> | Jun 2019 - Jun 2022<br/>PSG College of Arts &amp; Science',after=4)
section('Tools & additional capabilities')
para('<b>Tools:</b> Odoo CRM, Notion, Microsoft Excel, Google Sheets, Microsoft Word, SQL Server Management Studio (SSMS), AI evaluation and annotation platforms.',after=8)
para('<b>Additional capabilities:</b> Business process analysis, SaaS and ERP operations, functional testing, User Acceptance Testing (UAT), data organisation and reporting.',after=4)
section('Certifications')
para('Marketing Analytics - Great Learning<br/>RDBMS PostgreSQL - IIT Bombay<br/>Managing Company of the Future - Coursera<br/>Organizational Behaviour: Know Your People - Coursera',after=4)
section('Leadership & additional experience')
para('<b>Chief Alumni Officer, KCT Business School</b><br/>Supported alumni engagement and event coordination, including Global Alumni Meet and Career Catalyst.',after=8)
para('<b>HR Admissions Coordinator internship - KCLAS</b>',after=0)
footer(2);c.save()
r=PdfReader(str(OUT));assert len(r.pages)==2
for p in r.pages:assert abs(float(p.mediabox.width)-W)<1 and abs(float(p.mediabox.height)-H)<1
print(f'{OUT}: {len(r.pages)} A4 pages')
