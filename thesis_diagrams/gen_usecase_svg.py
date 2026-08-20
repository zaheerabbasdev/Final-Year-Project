"""
Generate a professional use-case diagram HTML/SVG for both
Customer and Service Provider actors on one A4-landscape page.
"""
import textwrap

# ─── Layout constants ─────────────────────────────────────────────────────────
W, H = 1680, 1060        # page canvas (A4 landscape ≈ this ratio)
MIDX = W // 2            # divider x

# colours
C_NAVY   = "#1e3a5f"
C_BORDER = "#3a6fa0"
C_TEXT   = "#111111"
C_ACTOR  = "#1e3a5f"
C_LINE   = "#1e3a5f"
PALETTE  = ["#e8f0fb","#e8f7ee","#fff4e6","#f5e8fb","#fbe8e8","#e8fbfb","#fffff0"]

# ellipse half-sizes
RX, RY = 105, 20

# ─── Helpers ──────────────────────────────────────────────────────────────────
def ell(cx, cy, label, color=C_NAVY):
    """Return SVG for one use-case ellipse."""
    lines = label.split("\n")
    if len(lines) == 1:
        txt = f'<text x="{cx}" y="{cy+4}" text-anchor="middle" font-family="Arial" font-size="11" fill="{C_TEXT}">{label}</text>'
    else:
        l1,l2 = lines
        txt = (f'<text text-anchor="middle" font-family="Arial" font-size="10.5" fill="{C_TEXT}">'
               f'<tspan x="{cx}" dy="-5">{l1}</tspan>'
               f'<tspan x="{cx}" dy="13">{l2}</tspan>'
               f'</text>')
        # reposition tspan
        txt = txt.replace('dy="-5"', f'x="{cx}" y="{cy-3}"').replace('dy="13"', f'x="{cx}" y="{cy+10}"')
        txt = (f'<text text-anchor="middle" font-family="Arial" font-size="10.5" fill="{C_TEXT}">'
               f'<tspan x="{cx}" y="{cy-3}">{l1}</tspan>'
               f'<tspan x="{cx}" y="{cy+10}">{l2}</tspan>'
               f'</text>')
    return (f'<ellipse cx="{cx}" cy="{cy}" rx="{RX}" ry="{RY}" '
            f'fill="white" stroke="{color}" stroke-width="1.5"/>\n'
            + txt)

def sub(x, y, w, h, label, bg):
    """Return SVG for a subsystem rectangle with label."""
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="5" '
            f'fill="{bg}" stroke="{C_BORDER}" stroke-width="1" opacity="0.85"/>\n'
            f'<text x="{x+8}" y="{y+14}" font-family="Arial" font-size="9.5" '
            f'font-weight="bold" fill="{C_NAVY}">{label}</text>\n')

def actor(cx, label):
    """Return SVG for a stick-figure actor centred at (cx, 520)."""
    ay = 500
    return f"""
  <!-- Actor: {label} -->
  <circle cx="{cx}" cy="{ay-65}" r="22" fill="none" stroke="{C_ACTOR}" stroke-width="2"/>
  <line x1="{cx}" y1="{ay-43}" x2="{cx}" y2="{ay}" stroke="{C_ACTOR}" stroke-width="2"/>
  <line x1="{cx-28}" y1="{ay-25}" x2="{cx+28}" y2="{ay-25}" stroke="{C_ACTOR}" stroke-width="2"/>
  <line x1="{cx}" y1="{ay}" x2="{cx-22}" y2="{ay+40}" stroke="{C_ACTOR}" stroke-width="2"/>
  <line x1="{cx}" y1="{ay}" x2="{cx+22}" y2="{ay+40}" stroke="{C_ACTOR}" stroke-width="2"/>
  <text x="{cx}" y="{ay+60}" text-anchor="middle" font-family="Arial" font-size="13"
        font-weight="bold" fill="{C_ACTOR}">{label}</text>
"""

def connection(ax, ay, bx, by):
    """Straight line from actor to a point on the system boundary."""
    return f'<line x1="{ax}" y1="{ay}" x2="{bx}" y2="{by}" stroke="{C_LINE}" stroke-width="1" opacity="0.6"/>\n'

# ─── Diagram data ─────────────────────────────────────────────────────────────
# Each subsystem: (label, colour_index, rows)
# Each row: list of use-case labels (None = empty cell)

CUSTOMER_SUBS = [
    ("Authentication", 0, [
        ["Register Account", "Login", "Verify OTP"],
        ["Forgot Password",  "Reset Password", None],
    ]),
    ("Job Management", 1, [
        ["Post a Job",       "View My Jobs",    "View Job Details"],
    ]),
    ("Provider Discovery", 2, [
        ["Browse Providers", "View Provider Profile", "View Provider Reviews"],
    ]),
    ("Bid Management", 3, [
        ["View Bids on Job", "Accept a Bid",    "Reject a Bid"],
    ]),
    ("Booking Management", 4, [
        ["View My Bookings", "Track Booking",   "Complete Booking"],
    ]),
    ("Communication & Reviews", 5, [
        ["Chat with Provider","View Notifications","Submit Review"],
    ]),
    ("Support", 6, [
        [None, "AI Support Chatbot", None],
    ]),
]

PROVIDER_SUBS = [
    ("Authentication & Registration", 0, [
        ["Register Account", "Upload CNIC",      "Login"],
        ["Upload Certificates","Verify OTP",     "Reset Password"],
    ]),
    ("Profile Management", 1, [
        ["Update Profile",  "Update Bio & Skills", "Set Availability"],
    ]),
    ("Job Discovery", 2, [
        ["Browse Available Jobs","Filter by Category","View Job Details"],
    ]),
    ("Bid Management", 3, [
        ["Place a Bid",     "View My Bids",      "View Bid Status"],
    ]),
    ("Booking & Service Delivery", 4, [
        ["Accept Booking",  "Start Service",     "Complete Service"],
    ]),
    ("Reviews & Communication", 5, [
        ["Chat with Customer","View Notifications","View My Reviews"],
    ]),
    ("Dashboard & Support", 6, [
        ["View Dashboard",  "View Earnings",     "AI Support Chatbot"],
    ]),
]

# ─── Build diagram SVG for one actor ─────────────────────────────────────────
def build_diagram(subs, sys_x, sys_w, actor_x):
    """
    subs      : list of subsystem tuples
    sys_x     : x of system boundary rect
    sys_w     : width of system boundary rect
    actor_x   : x centre of actor stick figure
    """
    ROW_H  = 55      # height per use-case row
    SUB_PAD_TOP = 22 # space for subsystem label
    SUB_PAD_Y   = 8  # gap between subsystems
    INNER_PAD   = 12 # left/right padding inside system box

    # col centres inside system box
    inner_w = sys_w - 2*INNER_PAD
    COL_W   = inner_w // 3
    col_cx  = [sys_x + INNER_PAD + COL_W*i + COL_W//2 for i in range(3)]

    sys_top  = 48
    cur_y    = sys_top + 15   # start inside system box

    parts    = []
    conn_pts = []  # (cx, cy) of each subsystem midpoint for actor lines

    for i, (label, ci, rows) in enumerate(subs):
        num_rows = len(rows)
        sub_h    = SUB_PAD_TOP + num_rows * ROW_H + 10
        sub_x    = sys_x + 8
        sub_w    = sys_w - 16
        bg       = PALETTE[ci % len(PALETTE)]

        parts.append(sub(sub_x, cur_y, sub_w, sub_h, label, bg))

        # ellipses
        for ri, row in enumerate(rows):
            ell_y = cur_y + SUB_PAD_TOP + ROW_H//2 + ri * ROW_H
            for ci2, lbl in enumerate(row):
                if lbl is None:
                    continue
                parts.append(ell(col_cx[ci2], ell_y, lbl))

        # midpoint for actor connection
        conn_pts.append((sys_x, cur_y + sub_h // 2))

        cur_y += sub_h + SUB_PAD_Y

    # system boundary box
    sys_h = cur_y - sys_top + 10
    sys_box = (f'<rect x="{sys_x}" y="{sys_top}" width="{sys_w}" height="{sys_h}" '
               f'fill="none" stroke="{C_NAVY}" stroke-width="2.5"/>\n')

    # actor (centred at y=sys_top + sys_h//2)
    actor_cy = sys_top + sys_h // 2
    act_svg  = f"""
  <circle cx="{actor_x}" cy="{actor_cy-65}" r="22" fill="none" stroke="{C_ACTOR}" stroke-width="2"/>
  <line x1="{actor_x}" y1="{actor_cy-43}" x2="{actor_x}" y2="{actor_cy}" stroke="{C_ACTOR}" stroke-width="2"/>
  <line x1="{actor_x-28}" y1="{actor_cy-25}" x2="{actor_x+28}" y2="{actor_cy-25}" stroke="{C_ACTOR}" stroke-width="2"/>
  <line x1="{actor_x}" y1="{actor_cy}" x2="{actor_x-22}" y2="{actor_cy+40}" stroke="{C_ACTOR}" stroke-width="2"/>
  <line x1="{actor_x}" y1="{actor_cy}" x2="{actor_x+22}" y2="{actor_cy+40}" stroke="{C_ACTOR}" stroke-width="2"/>
"""

    # connection lines from actor to system boundary
    conn_svg = ""
    edge_x   = sys_x if actor_x < sys_x else sys_x + sys_w
    for (bx, by) in conn_pts:
        conn_svg += f'<line x1="{actor_x}" y1="{actor_cy}" x2="{bx}" y2="{by}" stroke="{C_LINE}" stroke-width="1" opacity="0.55"/>\n'

    return sys_box + conn_svg + "".join(parts) + act_svg, sys_h

# ─── Generate full page ───────────────────────────────────────────────────────
SYS_W = 740    # system boundary width for each diagram
LEFT_SYS_X  = 90
RIGHT_SYS_X = MIDX + 10
LEFT_ACTOR_X  = 38
RIGHT_ACTOR_X = RIGHT_SYS_X + SYS_W + 45

left_svg,  lh = build_diagram(CUSTOMER_SUBS,  LEFT_SYS_X,  SYS_W, LEFT_ACTOR_X)
right_svg, rh = build_diagram(PROVIDER_SUBS, RIGHT_SYS_X, SYS_W, RIGHT_ACTOR_X)

page_h = max(lh, rh) + 80

# Actor labels
left_actor_label_y  = 48 + lh // 2 + 65
right_actor_label_y = 48 + rh // 2 + 65

svg = f"""<?xml version="1.0" encoding="utf-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 {W} {page_h}"
     style="font-family: Arial, sans-serif; background: white;">

  <!-- Page title -->
  <text x="{W//2}" y="22" text-anchor="middle" font-family="Arial"
        font-size="15" font-weight="bold" fill="{C_NAVY}" letter-spacing="0.5">
    KAARKUN — USE CASE DIAGRAMS
  </text>

  <!-- Sub-titles -->
  <text x="{LEFT_SYS_X + SYS_W//2}" y="40" text-anchor="middle" font-family="Arial"
        font-size="11" fill="#444">FIGURE 3.3 — Customer Actor</text>
  <text x="{RIGHT_SYS_X + SYS_W//2}" y="40" text-anchor="middle" font-family="Arial"
        font-size="11" fill="#444">FIGURE 3.4 — Service Provider Actor</text>

  <!-- Vertical divider -->
  <line x1="{MIDX}" y1="30" x2="{MIDX}" y2="{page_h-10}" stroke="#cccccc" stroke-width="1" stroke-dasharray="5,5"/>

  <!-- Actor labels -->
  <text x="{LEFT_ACTOR_X}" y="{left_actor_label_y+5}" text-anchor="middle"
        font-family="Arial" font-size="12" font-weight="bold" fill="{C_NAVY}">Customer</text>
  <text x="{RIGHT_ACTOR_X}" y="{right_actor_label_y+5}" text-anchor="middle"
        font-family="Arial" font-size="12" font-weight="bold" fill="{C_NAVY}">Service Provider</text>

  <!-- LEFT: Customer diagram -->
  {left_svg}

  <!-- RIGHT: Provider diagram -->
  {right_svg}

</svg>"""

# Write HTML wrapper
html = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Use Case Diagrams — Kaarkun</title>
<style>
  @page {{ size: A4 landscape; margin: 6mm; }}
  body {{ margin: 0; padding: 0; background: white; }}
  svg {{ width: 100%; height: auto; display: block; }}
</style>
</head>
<body>
{svg}
</body>
</html>"""

out_html = r"E:\fyp\thesis_diagrams\use_case_combined.html"
out_svg  = r"E:\fyp\thesis_diagrams\use_case_combined.svg"

with open(out_html, "w", encoding="utf-8") as f:
    f.write(html)
with open(out_svg, "w", encoding="utf-8") as f:
    f.write(svg)

print(f"Written: {out_html}")
print(f"Written: {out_svg}")
print(f"Page canvas: {W} x {page_h}")
