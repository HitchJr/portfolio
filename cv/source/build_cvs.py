"""Build every CV version from one template.

All versions share the same design (style.css), layout (template.html.j2) and
wording. Each version only changes the eyebrow icon and label, the About me
text, which jobs get full entries, and the skills it leads with.

Run from anywhere:  python3 cv/source/build_cvs.py
Needs: pip install jinja2 playwright && python -m playwright install chromium
"""
from pathlib import Path

from jinja2 import Environment, FileSystemLoader
from markupsafe import Markup
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
OUT = HERE.parent

# ---------- Shared content (the same on every CV) ----------

CONTACT = [
    {"text": "Malmö, Sweden"},
    {"text": "+46 72 235 20 02"},
    {"text": "dantep@live.se", "href": "mailto:dantep@live.se"},
    {"text": "linkedin.com/in/dante-persson", "href": "https://www.linkedin.com/in/dante-persson"},
]
GITHUB = {"text": "github.com/HitchJr", "href": "https://github.com/HitchJr"}

LANGUAGES = [("Swedish", "Native"), ("English", "Fluent"), ("Danish", "Good"),
             ("Norwegian", "Good"), ("German", "Basic")]

INTERESTS = ("I travel whenever I get the chance, and I always try to find somewhere to surf. "
             "At home I play football with friends, and I'm trying to become a better cook.")

INTRO = ("I have worked in operations for most of my career, mostly on the railway. For almost four "
         "years I controlled rail traffic at Trafikverket, and since May 2026 I've worked as a Chief "
         "Track Work Supervisor, leading track work projects on the railway.")

HTSM = {
    "title": "Chief Track Work Supervisor (Huvudtillsyningsman)",
    "org": "LD Järnväg & Planering AB",
    "when": "May 2026 – present · Malmö",
    "bullets": [
        "Manage several teams on the ground across parallel railway projects",
        "Contact person between the teams and the customer who owns the railway",
        "Plan upcoming projects: staffing, equipment, logistics and timelines",
        "Plan track protection (A-, E-, L- and S-skydd) and risk assessments according to TTJ",
        "Responsible for traffic safety, electrical safety and the work environment on site",
        "Built Excel tools with VBA macros for tracking and safety documentation. A team of 6 uses "
        "them daily across 5 projects, and they save 2–4 work hours per day",
    ],
}
TRAFIKVERKET = {
    "title": "Train Traffic Controller and TLS Programmer",
    "org": "Trafikverket",
    "when": "Sep 2022 – May 2026 · Malmö",
    "bullets": [
        "Controlled rail traffic in the 24/7 traffic control centre, including trains, shunting and "
        "track inspection runs",
        "Handled accidents, near misses and other disruptions",
        "Coordinated emergency stops when the police, fire service or ambulance needed the line stopped",
        "Worked in TLS every day, and after one year joined the team of three that programmed it",
    ],
}
POSTNORD = {
    "title": "Customer Service and Invoicing",
    "org": "Postnord",
    "note": "employed through Randstad the first 6 months",
    "when": "Oct 2020 – Sep 2022 · Malmö",
    "bullets": [
        "Handled invoice disputes, credit notes and payouts",
        "Became Salesforce superuser after one year and helped improve how the team used it",
        "Import and export control in Citrix NCM",
    ],
}
BREDBAND2 = {
    "title": "IT Support and Customer Service",
    "org": "Bredband2",
    "when": "Jun 2020 – Sep 2020 · Malmö",
    "bullets": [
        "Troubleshooting for broadband, routers, telephony and antivirus",
        "IT advice to private customers by phone",
    ],
}
BREDBAND2_SHORT = {"title": "IT Support and Customer Service", "org": "Bredband2",
                   "when": "Jun – Sep 2020 · Malmö",
                   "line": "Troubleshooting for broadband, routers, telephony and antivirus"}
METSO_SHORT = {"title": "Machine Operator", "org": "Metso", "when": "Sep 2018 – Sep 2019 · Trelleborg",
               "line": "Machine operation and quality control in mineral processing production"}

RAIL_PULSE = ("Rail Pulse", "a dashboard of train punctuality, delays and their causes, built on "
              "Trafikverket's open data")
TOKENWISE = ("TokenWise AI", 'a website that explains to companies what AI costs and what it can do '
             '<a href="https://tokenwise-ai.vercel.app">tokenwise-ai.vercel.app</a>')

SCHOOL = {"what": "IT – Networking and Media", "where": "Sundsgymnasiet", "when": "2014 – 2018 · Vellinge"}
ODIN = {"what": "Full-stack web development", "where": "The Odin Project (self-study)", "when": "2026 – ongoing"}

# ---------- Role icons (inline SVG, 24x24, amber = the lit part) ----------

ICONS = {
    # Railway: the DP.IO signal head, top lamp lit
    "signal": '<svg class="icon" viewBox="0 0 24 24"><rect x="7.5" y="1.5" width="9" height="21" rx="4.5" '
              'fill="#000" stroke="#3A424D" stroke-width="1"/><circle cx="12" cy="7.5" r="2.6" fill="#FFB547"/>'
              '<circle cx="12" cy="16.5" r="2.6" fill="#1C2128"/></svg>',
    # IT and operations: a server rack with one unit's light lit
    "server": '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="1.5" width="18" height="21" rx="2.5" '
              'fill="#000" stroke="#3A424D" stroke-width="1"/>'
              '<rect x="5.5" y="4" width="13" height="4.5" rx="1" fill="#12161B" stroke="#3A424D" stroke-width=".6"/>'
              '<rect x="5.5" y="9.75" width="13" height="4.5" rx="1" fill="#12161B" stroke="#3A424D" stroke-width=".6"/>'
              '<rect x="5.5" y="15.5" width="13" height="4.5" rx="1" fill="#12161B" stroke="#3A424D" stroke-width=".6"/>'
              '<circle cx="16" cy="6.25" r="1.2" fill="#FFB547"/><circle cx="16" cy="12" r="1.2" fill="#1C2128"/>'
              '<circle cx="16" cy="17.75" r="1.2" fill="#1C2128"/>'
              '<rect x="7.5" y="5.75" width="5" height="1" rx=".5" fill="#3A424D"/>'
              '<rect x="7.5" y="11.5" width="5" height="1" rx=".5" fill="#3A424D"/>'
              '<rect x="7.5" y="17.25" width="5" height="1" rx=".5" fill="#3A424D"/></svg>',
    # Project management: a timeline of tasks, the current one lit
    "plan": '<svg class="icon" viewBox="0 0 24 24"><rect x="1.5" y="1.5" width="21" height="21" rx="3" '
            'fill="#000" stroke="#3A424D" stroke-width="1"/>'
            '<rect x="4.5" y="5.5" width="7" height="2.6" rx="1.3" fill="#3A424D"/>'
            '<rect x="8.5" y="10.7" width="9" height="2.6" rx="1.3" fill="#FFB547"/>'
            '<rect x="13" y="15.9" width="6.5" height="2.6" rx="1.3" fill="#3A424D"/></svg>',
}

# ---------- The versions ----------

CVS = [
    {
        "file": "Dante_Persson_CV_Standard.pdf",
        "label": "Standard",
        "icon": "signal",
        "eyebrow": "Railway operations · Project lead",
        "about": [
            INTRO,
            "I'm used to safety-critical work with strict rules, and to handling problems quickly and "
            "calmly when something goes wrong. I like finding more efficient ways to work. At my current "
            "job I built tools in Excel that my team uses every day.",
        ],
        "jobs": [HTSM, TRAFIKVERKET, POSTNORD],
        "earlier": [BREDBAND2_SHORT, METSO_SHORT],
        "skills": ["TLS, TTJ and track protection planning", "Excel and VBA macros",
                   "Salesforce (superuser), SAP, Citrix NCM, Microsoft Office",
                   "AI tools (Claude, ChatGPT), basic JavaScript and Git"],
        "projects": [RAIL_PULSE, TOKENWISE],
        "education": [SCHOOL],
    },
    {
        "file": "Dante_Persson_CV_Project_Management.pdf",
        "label": "Project management",
        "icon": "plan",
        "eyebrow": "Project management · Railway",
        "about": [
            INTRO,
            "In my current job I plan the projects, run several teams on the ground at the same time and "
            "keep the customer updated. I'm used to safety-critical work with strict rules, and to solving "
            "problems calmly when plans change. I like finding more efficient ways to work.",
        ],
        "jobs": [
            {**HTSM, "bullets": [
                "Plan upcoming projects: staffing, equipment, logistics and timelines",
                "Manage several teams on the ground across parallel railway projects",
                "Contact person between the teams and the customer who owns the railway",
                "Plan track protection (A-, E-, L- and S-skydd) and risk assessments according to TTJ",
                "Responsible for traffic safety, electrical safety and the work environment on site",
                HTSM["bullets"][5],
            ]},
            TRAFIKVERKET, POSTNORD,
        ],
        "earlier": [BREDBAND2_SHORT, METSO_SHORT],
        "skills": ["Project planning and logistics",
                   "Coordinating teams and customer contact",
                   "Risk assessment and track protection (TTJ)",
                   "Excel, VBA, Salesforce, SAP, Microsoft Office"],
        "projects": [RAIL_PULSE, TOKENWISE],
        "education": [SCHOOL],
    },
    {
        "file": "Dante_Persson_CV_IT_Operations.pdf",
        "label": "Operations and IT",
        "icon": "server",
        "eyebrow": "Operations · IT · Automation",
        "github": True,
        "about": [
            "I have worked in operations for most of my career, mostly on the railway, and I started out "
            "in IT support. For almost four years I controlled rail traffic at Trafikverket and programmed "
            "in its traffic control system, TLS. Since May 2026 I've worked as a Chief Track Work "
            "Supervisor, leading track work projects on the railway.",
            "I like finding more efficient ways to work. At my current job I built tools in Excel and VBA "
            "that my team uses every day, and in my free time I build web apps with AI coding tools.",
        ],
        "jobs": [
            {**HTSM, "bullets": [
                HTSM["bullets"][5],
                "Manage several teams on the ground across parallel railway projects",
                "Contact person between the teams and the customer who owns the railway",
                "Plan upcoming projects: staffing, equipment, logistics and timelines",
                "Responsible for traffic safety, electrical safety and the work environment on site",
            ]},
            {**TRAFIKVERKET, "bullets": [
                TRAFIKVERKET["bullets"][3],
                TRAFIKVERKET["bullets"][0],
                "Handled accidents, near misses and other disruptions, including emergency stops for the "
                "police, fire service or ambulance",
            ]},
            POSTNORD, BREDBAND2,
        ],
        "earlier": [METSO_SHORT],
        "skills": ["Excel and VBA macros",
                   "AI coding tools: Claude Code, ChatGPT",
                   "JavaScript, React, Git (learning)",
                   "Salesforce (superuser), SAP, Citrix NCM, TLS"],
        "projects_intro": False,
        "projects": [TOKENWISE, RAIL_PULSE],
        "education": [ODIN, SCHOOL],
    },
]


def build():
    env = Environment(loader=FileSystemLoader(HERE), autoescape=True)
    tpl = env.get_template("template.html.j2")
    icons = {k: Markup(v) for k, v in ICONS.items()}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for cv in CVS:
            cv = {**cv, "projects": [(n, Markup(t)) for n, t in cv["projects"]]}
            contact = CONTACT + ([GITHUB] if cv.get("github") else [])
            html = tpl.render(cv=cv, icons=icons, contact=contact,
                              languages=LANGUAGES, interests=INTERESTS)
            tmp = HERE / f"_{cv['label'].replace(' ', '_')}.html"
            tmp.write_text(html, encoding="utf-8")
            page.goto(tmp.as_uri())
            page.wait_for_timeout(300)
            page.pdf(path=str(OUT / cv["file"]), format="A4", print_background=True,
                     prefer_css_page_size=True)
            tmp.unlink()
            print("built", cv["file"])
        browser.close()


if __name__ == "__main__":
    build()
