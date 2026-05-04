"""
Build a brand-styled, editable PowerPoint pitch deck for SynaptixSchedule.

Why this exists:
  pandoc's pptx output is plain (title + bullets, no styling). We want a
  9-slide native-shape deck that retains brand colors + typography when a
  sales rep edits it in PowerPoint. The two product-UI mockup slides
  (clinical workspace + slot picker) are embedded as high-res PNGs
  rendered from the HTML deck — those mockups would take 800+ lines of
  shape construction to recreate as native shapes for marginal gain.

Run:
  .pptx_venv/bin/python build_pitch_pptx.py
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from copy import deepcopy
from lxml import etree
import os

# ─── Brand tokens ───────────────────────────────────────────────────────────
NAVY       = RGBColor(0x0B, 0x13, 0x40)
NAVY_DEEP  = RGBColor(0x06, 0x0B, 0x2A)
PRIMARY    = RGBColor(0x1A, 0x73, 0xE8)
SUCCESS    = RGBColor(0x34, 0xA8, 0x53)
ERROR      = RGBColor(0xDC, 0x35, 0x45)
URGENT     = RGBColor(0xFD, 0x7E, 0x14)
CYAN       = RGBColor(0x4F, 0xC9, 0xE8)
TEAL       = RGBColor(0x2E, 0xE2, 0xC8)
MINT       = RGBColor(0x1F, 0xE9, 0xA8)
INK        = RGBColor(0x20, 0x21, 0x24)
INK_SECOND = RGBColor(0x5F, 0x63, 0x68)
INK_TERT   = RGBColor(0x97, 0x9C, 0xA1)
PAPER      = RGBColor(0xFF, 0xFF, 0xFF)
BG         = RGBColor(0xF8, 0xFA, 0xFD)
DIVIDER    = RGBColor(0xCD, 0xD2, 0xD7)

FONT_BRAND = "Plus Jakarta Sans"
FONT_BODY  = "Roboto"
FONT_COND  = "Roboto Condensed"
FONT_MONO  = "Roboto Mono"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# ─── Helpers ────────────────────────────────────────────────────────────────
def emu_in(inches): return Inches(inches)

def add_text_box(slide, left_in, top_in, width_in, height_in, *,
                 text, font=FONT_BODY, size_pt=12, bold=False, color=INK,
                 align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing_after_pt=0):
    """Add a positioned text box with one paragraph."""
    box = slide.shapes.add_textbox(emu_in(left_in), emu_in(top_in),
                                    emu_in(width_in), emu_in(height_in))
    tf = box.text_frame
    tf.margin_left = tf.margin_right = 0
    tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = anchor
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    p.space_after = Pt(spacing_after_pt)
    run = p.add_run()
    run.text = text
    run.font.name = font
    run.font.size = Pt(size_pt)
    run.font.bold = bold
    run.font.color.rgb = color
    return box

def add_rect(slide, left_in, top_in, width_in, height_in, *,
             fill=None, line=None, line_width_pt=None):
    """Add a rectangle, optional fill + outline."""
    shp = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE if False else MSO_SHAPE.RECTANGLE,
        emu_in(left_in), emu_in(top_in),
        emu_in(width_in), emu_in(height_in)
    )
    if fill is not None:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill
    else:
        shp.fill.background()
    if line is not None:
        shp.line.color.rgb = line
        if line_width_pt:
            shp.line.width = Pt(line_width_pt)
    else:
        shp.line.fill.background()
    shp.shadow.inherit = False
    return shp

def add_rounded(slide, left_in, top_in, width_in, height_in, *,
                fill=None, line=None, line_width_pt=None, corner=0.06):
    shp = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        emu_in(left_in), emu_in(top_in),
        emu_in(width_in), emu_in(height_in)
    )
    # Adjust corner radius via the adjustment value (0..0.5).
    shp.adjustments[0] = corner
    if fill is not None:
        shp.fill.solid()
        shp.fill.fore_color.rgb = fill
    else:
        shp.fill.background()
    if line is not None:
        shp.line.color.rgb = line
        if line_width_pt:
            shp.line.width = Pt(line_width_pt)
    else:
        shp.line.fill.background()
    shp.shadow.inherit = False
    return shp

def add_gradient_strip(slide, left_in, top_in, width_in, height_in):
    """Add a horizontal cyan→teal→mint gradient strip."""
    shp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE,
                                  emu_in(left_in), emu_in(top_in),
                                  emu_in(width_in), emu_in(height_in))
    shp.line.fill.background()
    # Use solid mid-tone teal as a fallback (python-pptx gradient API is gnarly).
    shp.fill.solid()
    shp.fill.fore_color.rgb = TEAL
    shp.shadow.inherit = False
    return shp

def add_brand_chip(slide, left_in, top_in, size_in=0.45):
    """Navy rounded square — stand-in for the AppBar mark chip."""
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE,
                                  emu_in(left_in), emu_in(top_in),
                                  emu_in(size_in), emu_in(size_in))
    shp.adjustments[0] = 0.18
    shp.fill.solid()
    shp.fill.fore_color.rgb = NAVY
    shp.line.fill.background()
    shp.shadow.inherit = False
    # Add a small "S" letter in cyan as a glyph stand-in
    txt = slide.shapes.add_textbox(emu_in(left_in), emu_in(top_in),
                                    emu_in(size_in), emu_in(size_in))
    tf = txt.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = "S"
    r.font.name = FONT_BRAND
    r.font.size = Pt(int(size_in * 56))
    r.font.bold = True
    r.font.color.rgb = CYAN
    return shp

def add_topbar(slide, page_str, slide_w_in):
    """Mini top bar: chip + wordmark + page number on right."""
    add_brand_chip(slide, 0.5, 0.5, 0.35)
    add_text_box(slide, 0.95, 0.52, 4.0, 0.4,
                 text="SynaptixSchedule", font=FONT_BRAND, size_pt=14,
                 bold=True, color=NAVY)
    add_text_box(slide, slide_w_in - 1.5, 0.55, 1.0, 0.3,
                 text=page_str, font=FONT_MONO, size_pt=9,
                 color=INK_TERT, align=PP_ALIGN.RIGHT)

def add_eyebrow(slide, left_in, top_in, text, width_in=8.0):
    add_text_box(slide, left_in, top_in, width_in, 0.3,
                 text=text.upper(), font=FONT_COND, size_pt=10,
                 bold=True, color=PRIMARY, align=PP_ALIGN.LEFT,
                 spacing_after_pt=4)

def add_heading(slide, left_in, top_in, text, size_pt=36, width_in=10.5,
                color=NAVY, height_in=1.5):
    add_text_box(slide, left_in, top_in, width_in, height_in,
                 text=text, font=FONT_BRAND, size_pt=size_pt,
                 bold=True, color=color, align=PP_ALIGN.LEFT)

def add_footer_rule(slide, left_in, slide_w_in, slide_h_in):
    """Bottom gradient hairline as a thin teal rectangle."""
    rule_w = slide_w_in - 2 * left_in
    add_gradient_strip(slide, left_in, slide_h_in - 0.5, rule_w, 0.04)


# ─── Build deck ─────────────────────────────────────────────────────────────
prs = Presentation()
# A4 landscape: 11.69 × 8.27 inches (almost identical to widescreen 13.33×7.5)
SLIDE_W = 13.333
SLIDE_H = 7.5
prs.slide_width  = Inches(SLIDE_W)
prs.slide_height = Inches(SLIDE_H)
blank = prs.slide_layouts[6]  # Blank layout

LEFT_MARGIN = 0.85

# ---------- SLIDE 1: COVER ----------
s = prs.slides.add_slide(blank)
# White full-bleed background already
add_brand_chip(s, LEFT_MARGIN + 0.2, 1.6, 1.1)
add_text_box(s, LEFT_MARGIN + 0.2, 2.95, 11.0, 1.6,
             text="SynaptixSchedule", font=FONT_BRAND, size_pt=72,
             bold=True, color=NAVY)
add_text_box(s, LEFT_MARGIN + 0.2, 4.55, 10.5, 0.8,
             text="A simple tool for the medical assistants doing the hardest work.",
             font=FONT_BODY, size_pt=20, color=INK_SECOND)
add_text_box(s, LEFT_MARGIN + 0.2, 6.6, 5.0, 0.3,
             text="PITCH DECK · MAY 2026", font=FONT_MONO, size_pt=10,
             color=INK_SECOND)
# Bottom gradient stripe
add_gradient_strip(s, 0, SLIDE_H - 0.18, SLIDE_W, 0.18)

# ---------- SLIDE 2: THE PROBLEM ----------
s = prs.slides.add_slide(blank)
add_topbar(s, "02 / 09", SLIDE_W)
add_eyebrow(s, LEFT_MARGIN, 1.4, "The clinic that runs on memory")
add_heading(s, LEFT_MARGIN, 1.85,
            "Most clinics still run their day on a phone, a paper schedule,\nand the medical assistant's memory.",
            size_pt=30, width_in=11.5, height_in=1.8)
add_text_box(s, LEFT_MARGIN, 4.4, 11.0, 2.5,
             text=("A patient walks in with chest pain at 9:15. The MA flips through a binder, "
                   "calls the front desk, types the same patient ID into three different systems, "
                   "and someone gets seen ten minutes later. Repeat that fifty times a day, across "
                   "fifty MAs, and you've burned roughly a million and a half dollars in time you're "
                   "still paying for."),
             font=FONT_BODY, size_pt=14, color=INK_SECOND)
add_footer_rule(s, LEFT_MARGIN, SLIDE_W, SLIDE_H)

# ---------- SLIDE 3: WHAT IT IS ----------
s = prs.slides.add_slide(blank)
add_topbar(s, "03 / 09", SLIDE_W)
add_eyebrow(s, LEFT_MARGIN, 1.4, "What it is")
add_heading(s, LEFT_MARGIN, 1.85, "One screen. Replaces the whole dance.",
            size_pt=34, width_in=11.5, height_in=0.9)
add_text_box(s, LEFT_MARGIN, 3.3, 11.0, 1.0,
             text=("The MA pulls up a patient, types what's going on in plain English, and the "
                   "screen shows the urgency, the labs to order, and the next available appointment "
                   "with the right doctor — usually in under a minute."),
             font=FONT_BODY, size_pt=15, color=INK)
add_text_box(s, LEFT_MARGIN, 5.0, 11.0, 1.0,
             text=("It plugs into the EHR you already have through FHIR, so nobody has to re-enter "
                   "anything. It runs in a browser. There's no on-prem server."),
             font=FONT_BODY, size_pt=15, color=INK_SECOND)
add_footer_rule(s, LEFT_MARGIN, SLIDE_W, SLIDE_H)

# ---------- SLIDE 4: WORKSPACE UI MOCKUP (embedded PNG) ----------
s = prs.slides.add_slide(blank)
add_topbar(s, "04 / 09", SLIDE_W)
add_eyebrow(s, LEFT_MARGIN, 1.4, "The clinical workspace")
add_heading(s, LEFT_MARGIN, 1.85, "Everything Sarah needs — in one screen.",
            size_pt=26, width_in=11.5, height_in=0.7)
img_path = "/tmp/synaptix_slides/slide-4.png"
if os.path.exists(img_path):
    # Center the image within remaining space (~9.2 × 4.6 in)
    img_w = 11.0
    img_h = 4.6
    s.shapes.add_picture(img_path,
                          emu_in((SLIDE_W - img_w) / 2),
                          emu_in(2.7),
                          emu_in(img_w),
                          emu_in(img_h))
add_footer_rule(s, LEFT_MARGIN, SLIDE_W, SLIDE_H)

# ---------- SLIDE 5: SLOT PICKER UI MOCKUP (embedded PNG) ----------
s = prs.slides.add_slide(blank)
add_topbar(s, "05 / 09", SLIDE_W)
add_eyebrow(s, LEFT_MARGIN, 1.4, "The slot picker")
add_heading(s, LEFT_MARGIN, 1.85, "Best match on top. Alternatives one tap away.",
            size_pt=26, width_in=11.5, height_in=0.7)
img_path = "/tmp/synaptix_slides/slide-5.png"
if os.path.exists(img_path):
    img_w = 11.0
    img_h = 4.6
    s.shapes.add_picture(img_path,
                          emu_in((SLIDE_W - img_w) / 2),
                          emu_in(2.7),
                          emu_in(img_w),
                          emu_in(img_h))
add_footer_rule(s, LEFT_MARGIN, SLIDE_W, SLIDE_H)

# ---------- SLIDE 6: DAY IN THE LIFE ----------
s = prs.slides.add_slide(blank)
add_topbar(s, "06 / 09", SLIDE_W)
add_eyebrow(s, LEFT_MARGIN, 1.4, "Sarah, MA · Cardiology clinic")
# The quote — large semibold navy with PRIMARY accent for key bits.
quote_box = s.shapes.add_textbox(emu_in(LEFT_MARGIN), emu_in(2.0),
                                  emu_in(11.5), emu_in(3.5))
tf = quote_box.text_frame
tf.word_wrap = True
tf.margin_left = tf.margin_right = 0
p = tf.paragraphs[0]
p.alignment = PP_ALIGN.LEFT
r1 = p.add_run()
r1.text = 'Sarah types "'
r1.font.name = FONT_BRAND; r1.font.size = Pt(24); r1.font.bold = True
r1.font.color.rgb = NAVY
r2 = p.add_run()
r2.text = "chest pain, came in this morning, looks pale and short of breath"
r2.font.name = FONT_BRAND; r2.font.size = Pt(24); r2.font.bold = True
r2.font.color.rgb = PRIMARY
r3 = p.add_run()
r3.text = ('." The system flags it as an emergency, lists the three labs to order '
           'right now, and shows three doctors who can see this patient today — '
           'ranked best fit first. ')
r3.font.name = FONT_BRAND; r3.font.size = Pt(24); r3.font.bold = True
r3.font.color.rgb = NAVY
r4 = p.add_run()
r4.text = "One tap. Booked."
r4.font.name = FONT_BRAND; r4.font.size = Pt(24); r4.font.bold = True
r4.font.color.rgb = PRIMARY

add_text_box(s, LEFT_MARGIN, 5.7, 11.0, 1.2,
             text=("She didn't fill out a form. She didn't memorize the protocol card.\n"
                   "The system caught the red flags before she did."),
             font=FONT_BODY, size_pt=14, color=INK_SECOND)
add_footer_rule(s, LEFT_MARGIN, SLIDE_W, SLIDE_H)

# ---------- SLIDE 7: THE MATH ----------
s = prs.slides.add_slide(blank)
add_topbar(s, "07 / 09", SLIDE_W)
add_eyebrow(s, LEFT_MARGIN, 1.4, "A 50-MA clinic")
add_heading(s, LEFT_MARGIN, 1.85, "It pays for itself in three weeks.",
            size_pt=32, width_in=11.5, height_in=0.8)

stats = [
    ("$2M",   "value back per year",    PRIMARY),
    ("$120K", "software cost per year", NAVY),
    ("~3wk",  "payback period",         SUCCESS),
]
col_w = 3.6
gap = 0.5
total_w = col_w * 3 + gap * 2
start_x = (SLIDE_W - total_w) / 2
for i, (val, label, color) in enumerate(stats):
    x = start_x + i * (col_w + gap)
    add_text_box(s, x, 3.4, col_w, 1.7, text=val,
                 font=FONT_BRAND, size_pt=80, bold=True,
                 color=color, align=PP_ALIGN.CENTER)
    add_text_box(s, x, 5.2, col_w, 0.5, text=label.upper(),
                 font=FONT_COND, size_pt=12, bold=True,
                 color=INK_SECOND, align=PP_ALIGN.CENTER)

add_text_box(s, LEFT_MARGIN, 6.3, 11.5, 0.8,
             text=("Time saved on triage and booking. Fewer no-shows. More claims paid. "
                   "Earlier emergencies caught. Lower MA turnover. Lawsuits that don't happen."),
             font=FONT_BODY, size_pt=12, color=INK_SECOND, align=PP_ALIGN.CENTER)
add_footer_rule(s, LEFT_MARGIN, SLIDE_W, SLIDE_H)

# ---------- SLIDE 8: TECH STACK ----------
s = prs.slides.add_slide(blank)
add_topbar(s, "08 / 09", SLIDE_W)
add_eyebrow(s, LEFT_MARGIN, 1.4, "What it runs on")
add_heading(s, LEFT_MARGIN, 1.85, "Modern, boring, reliable.",
            size_pt=30, width_in=11.5, height_in=0.8)
add_text_box(s, LEFT_MARGIN, 3.0, 11.5, 1.0,
             text=("Standard browser front end, serverless back end, and an LLM for the language "
                   "understanding. FHIR R4 for the EHR connection. No special hardware. A small "
                   "clinic typically pays under $500 a month for hosting."),
             font=FONT_BODY, size_pt=14, color=INK_SECOND)

# Tech chips (rounded rectangles with text)
chips = [
    ("Frontend",    "React 18 · TypeScript · MUI v7"),
    ("Backend",     "FastAPI · Python 3.11"),
    ("AI",          "Vertex AI Llama 4 · RAG-ready"),
    ("FHIR",        "HAPI FHIR R4 · Patient · Slot · Appointment"),
    ("Data",        "Cloud SQL Postgres 15"),
    ("Hosting",     "Google Cloud Run · scales to zero"),
    ("Compliance",  "HIPAA-aligned · 21st Century Cures"),
]
chip_y = 4.4
chip_h = 0.42
gap_y = 0.18
for i, (label, body) in enumerate(chips):
    row = i // 2
    col = i % 2
    chip_w = 5.6
    x = LEFT_MARGIN + col * (chip_w + 0.4)
    y = chip_y + row * (chip_h + gap_y)
    add_rounded(s, x, y, chip_w, chip_h, fill=PAPER, line=DIVIDER,
                line_width_pt=0.75, corner=0.5)
    # Label (bold) + body in same text frame
    box = s.shapes.add_textbox(emu_in(x + 0.18), emu_in(y + 0.05),
                                emu_in(chip_w - 0.36), emu_in(chip_h - 0.05))
    tf = box.text_frame
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    rl = p.add_run()
    rl.text = label + "  "
    rl.font.name = FONT_BODY; rl.font.size = Pt(11); rl.font.bold = True
    rl.font.color.rgb = NAVY
    rb = p.add_run()
    rb.text = body
    rb.font.name = FONT_BODY; rb.font.size = Pt(11); rb.font.color.rgb = INK_SECOND
add_footer_rule(s, LEFT_MARGIN, SLIDE_W, SLIDE_H)

# ---------- SLIDE 9: DEMO + CLOSE ----------
s = prs.slides.add_slide(blank)
add_topbar(s, "09 / 09", SLIDE_W)
add_eyebrow(s, LEFT_MARGIN, 1.4, "In the demo")
add_heading(s, LEFT_MARGIN, 1.85,
            "Fifteen minutes. Five real patients. Five specialties.",
            size_pt=26, width_in=12.0, height_in=0.8)

bullets = [
    "Live MA login against the real FHIR server — test patients 1002, 1003, 1005, 1006, 1007",
    "Active triage protocols across cardiology, primary care, orthopedics, pulmonology, endocrinology",
    "Real appointment booking with FHIR confirmation number on screen",
    "Today's agenda populated from the live Postgres appointments table",
]
bullet_y = 3.0
for i, b in enumerate(bullets):
    y = bullet_y + i * 0.5
    # Gradient bullet dot
    dot = s.shapes.add_shape(MSO_SHAPE.OVAL,
                              emu_in(LEFT_MARGIN), emu_in(y + 0.15),
                              emu_in(0.12), emu_in(0.12))
    dot.fill.solid(); dot.fill.fore_color.rgb = PRIMARY
    dot.line.fill.background(); dot.shadow.inherit = False
    add_text_box(s, LEFT_MARGIN + 0.32, y, 11.5, 0.5,
                 text=b, font=FONT_BODY, size_pt=14, color=INK)

# Closing CTA card — navy → blue gradient (we use solid navy for simplicity).
add_rounded(s, LEFT_MARGIN, 5.6, 11.5, 1.45, fill=NAVY, line=None, corner=0.12)
add_text_box(s, LEFT_MARGIN + 0.5, 5.75, 10.5, 0.6,
             text="Want it for your team?", font=FONT_BRAND, size_pt=24,
             bold=True, color=PAPER)
add_text_box(s, LEFT_MARGIN + 0.5, 6.4, 10.5, 0.6,
             text=("Sandbox in two days — your facility, your specialties, "
                   "synthetic patients, no PHI, no commitment. Send a note."),
             font=FONT_BODY, size_pt=13, color=PAPER)

# ─── Save ───────────────────────────────────────────────────────────────────
out = os.path.join(SCRIPT_DIR, "SynaptixSchedule_pitch_deck.pptx")
prs.save(out)
print(f"Wrote {out}")
print(f"Slides: {len(prs.slides)}, size: {os.path.getsize(out)} bytes")
