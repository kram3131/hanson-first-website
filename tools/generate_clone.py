#!/usr/bin/env python3
"""
generate_clone.py — Hanson First per-advisor site clone generator.

Turns a committed copy of this repo + one agent's intake config into a
standalone, deployable personal website. See the approved plan at
/Users/markgarza/.claude/plans/lovely-gathering-prism.md for the full
design rationale.

IMPORTANT — safety property this script guarantees:
  It reads the master repo via `git archive HEAD` (a clean export of
  the last COMMIT, never the working tree) and writes only into a new
  --out directory. It never modifies any file inside the master repo
  itself. Run it from anywhere; the master site is never touched.

Usage:
    python3 tools/generate_clone.py --config path/to/agent.json --out ../hanson-tia-pruett

Then review the output (see the skill's dry-run step) before doing
anything with GitHub/Vercel/DNS.
"""

import argparse
import json
import re
import shutil
import subprocess
import sys
import tarfile
import io
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# ── Master site's real identity constants (what gets substituted) ──────────
HANSON_DOMAIN = "hansonfirst.com"
HANSON_PHONE_E164 = "+1-512-817-6906"
HANSON_PHONE_DASHED = "512-817-6906"
HANSON_PHONE_DIGITS = "5128176906"
HANSON_LEGAL_NAME = "Hanson Insurance, LLC"
HANSON_BRAND_NAME = "Hanson Insurance Agency"
HANSON_EMAIL = "admin@HansonFirst.com"
HANSON_SOCIAL = {
    "facebook": "https://www.facebook.com/yourmedicarespecialisttexas",
    "linkedin": "https://www.linkedin.com/in/emilyhansoninsurance/",
    "instagram": "https://www.instagram.com/hanson.insurance/",
    "youtube": "https://www.youtube.com/@hansoninsuranceagency9070",
}

CLUB_DIRS = {"medicare": "club-medicare", "health": "club-health", "life": "club-life"}

# Files/dirs removed from EVERY clone regardless of config.
ALWAYS_DELETE = [
    "team.html",
    "join-us.html",
    "HANSON_BUILD_SPEC.md",
    "emilyHeadshot.webp",
    "images/emily-family-sweden.jpg",
    "images/emily-sweden-smooches.jpg",
    "agents",
    "google-apps-script",
    "Solidarity_Community_FCU_Website_Compilation.docx",  # unrelated stray file
    ".vercelignore",  # regenerated fresh below, clone has nothing internal to hide
    "tools",  # the generator itself never ships in a clone's output
]

TEXT_EXTS = {".html", ".js", ".xml", ".txt", ".json"}


class ConfigError(Exception):
    pass


class AgentConfig:
    REQUIRED = [
        "agent_slug", "first_name", "last_name", "role", "clubs", "photo",
        "bio_paragraphs", "phone", "email", "calendly_url", "service_area",
        "is_separate_entity", "domain",
    ]

    def __init__(self, data: dict):
        self.data = data
        missing = [k for k in self.REQUIRED if not data.get(k) and data.get(k) != False]
        if missing:
            raise ConfigError(f"Missing required config field(s): {', '.join(missing)}")
        if not isinstance(data["clubs"], list) or not data["clubs"]:
            raise ConfigError("clubs must be a non-empty list of medicare/health/life")
        for c in data["clubs"]:
            if c not in CLUB_DIRS:
                raise ConfigError(f"Unknown club '{c}' — must be one of {list(CLUB_DIRS)}")
        if not isinstance(data["bio_paragraphs"], list) or not data["bio_paragraphs"]:
            raise ConfigError(
                "bio_paragraphs is empty. This is a required field, not something the "
                "generator should invent — write a real bio before generating, or pass "
                "--allow-placeholder-bio to proceed with an obvious placeholder that "
                "must be replaced before launch."
            )

    # ── Derived identity values ─────────────────────────────────────────
    @property
    def full_name(self) -> str:
        return f"{self.data['first_name']} {self.data['last_name']}"

    @property
    def brand_name(self) -> str:
        """Marketing name: page titles, og tags, JSON-LD 'name'."""
        return self.data.get("dba_name") or self.full_name

    @property
    def legal_name(self) -> str:
        """Footer copyright + legal-page body text."""
        if self.data.get("is_separate_entity"):
            ln = self.data.get("legal_name")
            if not ln:
                raise ConfigError(
                    "is_separate_entity is true but legal_name is not set — "
                    "a separately-licensed entity needs its real legal name."
                )
            return ln
        return self.data.get("legal_name") or HANSON_LEGAL_NAME

    @property
    def needs_affiliation_disclosure(self) -> bool:
        return bool(self.data.get("is_separate_entity"))

    @property
    def affiliation_line(self) -> str:
        return f"{self.brand_name} operates in affiliation with {HANSON_LEGAL_NAME}."

    @property
    def phone_dashed(self) -> str:
        return self.data["phone"]

    @property
    def phone_digits(self) -> str:
        return re.sub(r"[^\d]", "", self.data["phone"])

    @property
    def phone_e164(self) -> str:
        d = self.phone_digits
        return f"+1-{d[0:3]}-{d[3:6]}-{d[6:10]}" if len(d) == 10 else f"+1-{self.phone_dashed}"

    @property
    def tel_href(self) -> str:
        return self.phone_digits if len(self.phone_digits) >= 10 else f"1{self.phone_digits}"

    @property
    def email_user(self) -> str:
        return self.data["email"].split("@", 1)[0]

    @property
    def email_domain(self) -> str:
        return self.data["email"].split("@", 1)[1]

    @property
    def same_as(self) -> list:
        social = self.data.get("social") or {}
        return [social[k] for k in ("facebook", "linkedin", "instagram", "youtube")
                if social.get(k)]

    def office_hours_rows(self):
        return self.data.get("office_hours") or [
            {"day": "Monday – Friday", "hours": "9:00 AM – 5:00 PM CT"},
            {"day": "Saturday", "hours": "By appointment"},
            {"day": "Sunday", "hours": "Closed"},
        ]


# ── Step 1: export the master repo via git archive ─────────────────────────
def export_master(out_dir: Path):
    if out_dir.exists():
        raise SystemExit(f"Output directory already exists: {out_dir} (refusing to overwrite)")
    out_dir.mkdir(parents=True)
    proc = subprocess.run(
        ["git", "archive", "HEAD"], cwd=REPO_ROOT, capture_output=True, check=True
    )
    with tarfile.open(fileobj=io.BytesIO(proc.stdout)) as tf:
        tf.extractall(out_dir)
    print(f"  exported master repo (git archive HEAD) -> {out_dir}")


# ── Step 2: delete pages/dirs not in scope ──────────────────────────────────
def prune(out_dir: Path, cfg: AgentConfig):
    for rel in ALWAYS_DELETE:
        p = out_dir / rel
        if p.is_dir():
            shutil.rmtree(p)
        elif p.exists():
            p.unlink()
    for club, dirname in CLUB_DIRS.items():
        if club not in cfg.data["clubs"]:
            p = out_dir / dirname
            if p.exists():
                shutil.rmtree(p)
    print(f"  pruned to clubs={cfg.data['clubs']}, dropped Team/Join-Us pages")


# ── Step 3: build the ordered substitution list (longest-match-first) ──────
def build_substitutions(cfg: AgentConfig) -> list:
    """Returns [(old, new), ...]. Applied via one regex alternation pass
    per file so longer/overlapping strings (e.g. the e164 phone contains
    the dashed phone as a substring) can never partially corrupt each
    other regardless of list order — but keep this roughly longest-first
    for readability anyway."""
    subs = [
        (HANSON_PHONE_E164, cfg.phone_e164),
        (HANSON_PHONE_DASHED, cfg.phone_dashed),
        (HANSON_PHONE_DIGITS, cfg.phone_digits),
        (HANSON_BRAND_NAME, cfg.brand_name),
        (HANSON_LEGAL_NAME, cfg.legal_name),
        (HANSON_EMAIL, cfg.data["email"]),
        (f"https://{HANSON_DOMAIN}", f"https://{cfg.data['domain']}"),
        (HANSON_DOMAIN, cfg.data["domain"]),
        ("<!-- ── How Emily Helps", "<!-- ── How We Help"),  # dev comment only, invisible either way
    ]
    # Social links: only substitute platforms the agent actually has.
    # Ones they don't have get removed separately (see rewrite_components_js
    # and the JSON-LD sameAs handling), not substituted to a blank string
    # here (that would leave a dangling href="").
    social = cfg.data.get("social") or {}
    for platform, hanson_url in HANSON_SOCIAL.items():
        if social.get(platform):
            subs.append((hanson_url, social[platform]))
    return subs


def apply_substitutions(text: str, subs: list) -> str:
    # Longest-first so no replacement string is a substring of an
    # earlier pattern that hasn't been matched yet.
    ordered = sorted(subs, key=lambda kv: -len(kv[0]))
    pattern = re.compile("|".join(re.escape(k) for k, _ in ordered))
    lookup = dict(ordered)
    return pattern.sub(lambda m: lookup[m.group(0)], text)


def apply_global_pass(out_dir: Path, cfg: AgentConfig):
    subs = build_substitutions(cfg)
    n = 0
    for path in out_dir.rglob("*"):
        if path.is_file() and path.suffix in TEXT_EXTS:
            text = path.read_text(encoding="utf-8")
            new_text = apply_substitutions(text, subs)
            # Fix the latent main-site bug: JSON-LD "url" always pointed
            # at the homepage on every page. Give each page its own.
            rel = path.relative_to(out_dir).as_posix()
            if rel != "index.html":
                page_url = f"https://{cfg.data['domain']}/{rel}"
                new_text = new_text.replace(
                    f'"url": "https://{cfg.data["domain"]}/",', f'"url": "{page_url}",'
                )
            if new_text != text:
                path.write_text(new_text, encoding="utf-8")
                n += 1
    print(f"  global identity substitution: {n} files updated")


# ── JSON-LD: strip the PostalAddress block, drop unused sameAs entries ─────
ADDRESS_BLOCK_RE = re.compile(
    r'"address": \{\s*"@type": "PostalAddress",.*?\},\n', re.DOTALL
)


def rewrite_jsonld_blocks(out_dir: Path, cfg: AgentConfig):
    n = 0
    for path in out_dir.rglob("*.html"):
        text = path.read_text(encoding="utf-8")
        new_text = ADDRESS_BLOCK_RE.sub("", text)
        new_text = new_text.replace(
            '"areaServed": "US",', f'"areaServed": "{cfg.data["service_area"]}",'
        )
        # sameAs[] — rebuild with only the platforms this agent has.
        same_as = cfg.same_as
        old_same_as_re = re.compile(
            r'"sameAs": \[\s*"https://www\.facebook\.com/[^"]*",\s*'
            r'"https://www\.linkedin\.com/in/[^"]*",\s*'
            r'"https://www\.instagram\.com/[^"]*",\s*'
            r'"https://www\.youtube\.com/[^"]*"\s*\]',
            re.DOTALL,
        )
        if same_as:
            new_arr = "\"sameAs\": [\n      " + ",\n      ".join(f'"{u}"' for u in same_as) + "\n    ]"
        else:
            new_arr = '"sameAs": []'
        new_text2 = old_same_as_re.sub(new_arr, new_text)
        if new_text2 != text:
            path.write_text(new_text2, encoding="utf-8")
            n += 1
    print(f"  JSON-LD address/sameAs rewritten in {n} pages")


# ── assets/components.js: nav, footer, legal identity ──────────────────────
def rewrite_components_js(out_dir: Path, cfg: AgentConfig):
    p = out_dir / "assets" / "components.js"
    text = p.read_text(encoding="utf-8")

    # Nav (desktop + mobile): drop Team and Join Us links entirely.
    text = re.sub(r'\s*<a href="\$\{root\}team\.html">Team</a>\n', "\n", text)
    text = re.sub(r'\s*<a href="\$\{root\}join-us\.html">Join Us</a>\n', "\n", text)

    club_pill_re = {
        "medicare": re.compile(r'\s*<a href="\$\{root\}club-medicare/index\.html"[^\n]*Club Medicare</a>\n'),
        "health": re.compile(r'\s*<a href="\$\{root\}club-health/index\.html"[^\n]*Club Health</a>\n'),
        "life": re.compile(r'\s*<a href="\$\{root\}club-life/index\.html"[^\n]*Club Life</a>\n'),
    }
    for club, rx in club_pill_re.items():
        if club not in cfg.data["clubs"]:
            text = rx.sub("\n", text)

    # Footer: drop the whole Club Medicare / Club Health+Life columns for
    # any club not licensed. Health and Life currently share one <div>
    # column, so we only drop that column if BOTH are missing.
    if "medicare" not in cfg.data["clubs"]:
        text = re.sub(
            r'\s*<!-- Club Medicare -->.*?</div>\n(?=\s*<!-- Club Health -->)',
            "\n", text, flags=re.DOTALL,
        )
    if "health" not in cfg.data["clubs"] and "life" not in cfg.data["clubs"]:
        text = re.sub(
            r'\s*<!-- Club Health -->.*?</div>\n(?=\s*<!-- Company -->)',
            "\n", text, flags=re.DOTALL,
        )
    elif "health" not in cfg.data["clubs"]:
        text = re.sub(
            r'\s*<div class="footer-col-title">Club Health</div>.*?</div>\n(?=\s*<div class="footer-col-title" style="margin-top:24px;">Club Life</div>)',
            "\n", text, flags=re.DOTALL,
        )
    elif "life" not in cfg.data["clubs"]:
        text = re.sub(
            r'\s*<div class="footer-col-title" style="margin-top:24px;">Club Life</div>.*?(?=\n\s*</div>\n\s*<!-- Company -->)',
            "", text, flags=re.DOTALL,
        )

    # Footer nav column: drop Team/Join Us links there too.
    text = text.replace('            <a href="${root}team.html">Meet the Team</a>\n', "")
    text = text.replace('            <a href="${root}join-us.html">Join the Team</a>\n', "")

    # Footer email/phone/tagline/address — the tagline sentence references
    # both the (now-dropped) states claim and Hanson's own office; replace
    # wholesale rather than trying to salvage fragments of it.
    text = text.replace(
        'data-user="admin" data-domain="HansonFirst.com"',
        f'data-user="{cfg.email_user}" data-domain="{cfg.email_domain}"',
    )
    text = text.replace("admin [at] HansonFirst.com", f"{cfg.email_user} [at] {cfg.email_domain}")
    text = re.sub(
        r'<p class="footer-tagline">.*?</p>',
        f'<p class="footer-tagline">Real people. Real coverage. Your whole life.<br>'
        f'{cfg.data["service_area"]}.</p>',
        text, flags=re.DOTALL,
    )
    text = re.sub(
        r'<a href="https://maps\.google\.com/\?q=13985\+TX-29[^"]*"[^>]*>📍[^<]*</a>\n',
        "", text,
    )

    # Social icons: drop any platform this agent doesn't have (rather than
    # leaving a dead link to Hanson's own accounts).
    social = cfg.data.get("social") or {}
    # Anchored on aria-label, not the visible link text — the actual
    # markup only shows "f"/"in"/"ig"/"▶", the platform name only ever
    # appears in aria-label="Facebook" etc.
    icon_re = {
        "facebook": re.compile(r'\s*<a href="https://www\.facebook\.com/[^"]*"[^>]*aria-label="Facebook">[^<]*</a>\n'),
        "linkedin": re.compile(r'\s*<a href="https://www\.linkedin\.com/[^"]*"[^>]*aria-label="LinkedIn">[^<]*</a>\n'),
        "instagram": re.compile(r'\s*<a href="https://www\.instagram\.com/[^"]*"[^>]*aria-label="Instagram">[^<]*</a>\n'),
        "youtube": re.compile(r'\s*<a href="https://www\.youtube\.com/[^"]*"[^>]*aria-label="YouTube">[^<]*</a>\n'),
    }
    for platform, rx in icon_re.items():
        if not social.get(platform):
            text, count = rx.subn("\n", text)
            if count == 0:
                print(f"  WARNING: {platform} social icon removal pattern found nothing to "
                      "remove — verify by hand, the icon may still be showing")

    # "Licensed in N states" badge (footer + header) and its backing
    # live-stats logic — dropped from clones entirely (confirmed decision).
    text = re.sub(
        r'\s*<span class="footer-badge">Licensed in <span class="js-state-count">37</span> States</span>\n',
        "\n", text,
    )
    text = re.sub(r'const STATS_SHEET_ID[\s\S]*?^}\n', "", text, flags=re.MULTILINE)
    text = text.replace("  initLiveStats();\n", "")

    # Phone: literal tel: href + display text in header/footer/sticky CTA.
    text = text.replace(f'href="tel:{HANSON_PHONE_DIGITS}"', f'href="tel:{cfg.tel_href}"')

    # Footer copyright: legal_name already substituted by the global pass;
    # add the affiliation disclosure line if this is a separate entity.
    if cfg.needs_affiliation_disclosure:
        text = text.replace(
            "          &copy; ${new Date().getFullYear()} " + cfg.legal_name +
            ". All rights reserved. Liberty Hill, TX.\n",
            "          &copy; ${new Date().getFullYear()} " + cfg.legal_name +
            ". All rights reserved.<br>" + cfg.affiliation_line + "\n",
        )
    else:
        text = text.replace(". All rights reserved. Liberty Hill, TX.", ". All rights reserved.")

    p.write_text(text, encoding="utf-8")
    print("  assets/components.js rewritten (nav/footer/legal identity)")


# ── book.html: replace the club picker with a single Calendly embed ───────
def rewrite_book_html(out_dir: Path, cfg: AgentConfig):
    p = out_dir / "book.html"
    text = p.read_text(encoding="utf-8")

    picker_re = re.compile(
        r'<!-- Calendly embed placeholder -->.*?<!-- Right: contact \+ reassurance -->',
        re.DOTALL,
    )
    replacement = f"""<!-- Booking -->
      <div>
        <div class="section-label">Book Online</div>
        <h2>Pick a time that works for you.</h2>
        <p style="margin-top:12px;color:var(--color-ink-mid);">Book directly on {cfg.first_name_safe}'s calendar below.</p>
        <div style="margin-top:24px;">
          <div class="calendly-inline-widget" data-url="{cfg.data['calendly_url']}?hide_gdpr_banner=1" style="min-width:320px;height:720px;"></div>
          <script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
          <p style="margin-top:12px;font-size:.85rem;color:var(--color-ink-mid);text-align:center;">Trouble viewing the calendar? <a href="{cfg.data['calendly_url']}" target="_blank" rel="noopener" style="color:var(--medicare-primary);font-weight:600;">Open Calendly in a new tab →</a></p>
        </div>
      </div>

      <!-- Right: contact + reassurance -->"""
    text = picker_re.sub(replacement, text)

    # Drop the whole inline booking-state <script> block at the bottom —
    # it only existed for the multi-URL club/New-Existing picker.
    text = re.sub(
        r'<script>\n  // Fill in each URL as it\'s provided.*?</script>\n</body>',
        "</body>", text, flags=re.DOTALL,
    )

    p.write_text(text, encoding="utf-8")
    print("  book.html simplified to a single Calendly embed")


# ── assets/events.js: hard-filter to this agent's hosted events ───────────
def rewrite_events_js(out_dir: Path, cfg: AgentConfig):
    p = out_dir / "assets" / "events.js"
    text = p.read_text(encoding="utf-8")

    text = text.replace(
        "        allUpcomingEvents = events;\n",
        f'        events = events.filter(function (e) {{ return e.host === "{cfg.full_name_js}"; }});\n'
        f'        var recurring = recurring.filter(function (e) {{ return e.host === "{cfg.full_name_js}"; }});\n'
        "        allUpcomingEvents = events;\n",
        1,
    )
    # The line above declares `recurring` again with `var` inside the same
    # function scope where it's already declared — harmless in JS (var
    # redeclare is a no-op), left as-is deliberately rather than risking a
    # brittle regex edit of the original declaration site.

    # Host filter dropdown is redundant once every visible event already
    # has the same host — skip rendering it.
    text = text.replace(
        '    if (hosts.length > 0) {\n',
        '    if (hosts.length > 0 && hosts.length > 1) {\n',
    )

    p.write_text(text, encoding="utf-8")
    print(f"  assets/events.js hard-filtered to host == \"{cfg.full_name}\"")


# ── assets/form-submit.js: agent email routing, no Sheet-shape change ─────
def rewrite_form_submit_js(out_dir: Path, cfg: AgentConfig):
    p = out_dir / "assets" / "form-submit.js"
    text = p.read_text(encoding="utf-8")
    text = text.replace(
        "WEB_APP_URL starts empty. Until Emily deploys the Apps Script",
        "WEB_APP_URL starts empty. Until the Apps Script is deployed",
    )
    text = text.replace(
        'function submitToSheet(formType, data) {\n  if (!WEB_APP_URL) return Promise.resolve();\n\n'
        '  return fetch(WEB_APP_URL, {\n'
        '    method: "POST",\n'
        '    mode: "no-cors",\n'
        '    headers: { "Content-Type": "text/plain;charset=utf-8" },\n'
        '    body: JSON.stringify(Object.assign({ formType: formType }, data))\n'
        '  });',
        'function submitToSheet(formType, data) {\n  if (!WEB_APP_URL) return Promise.resolve();\n\n'
        '  return fetch(WEB_APP_URL, {\n'
        '    method: "POST",\n'
        '    mode: "no-cors",\n'
        '    headers: { "Content-Type": "text/plain;charset=utf-8" },\n'
        '    body: JSON.stringify(Object.assign(\n'
        f'      {{ formType: formType, agentSlug: "{cfg.data["agent_slug"]}", agentEmail: "{cfg.data["email"]}" }},\n'
        '      data\n'
        '    ))\n'
        '  });',
    )
    p.write_text(text, encoding="utf-8")
    print("  assets/form-submit.js now tags submissions for agent-only email routing")


# ── assets/team.js -> assets/agent-bio.js (single-row photo/phone sync) ───
def write_agent_bio_js(out_dir: Path, cfg: AgentConfig):
    content = f'''/* ============================================================
   {cfg.full_name.upper()} — SELF-SERVE PHOTO/PHONE SYNC
   ============================================================
   Pulls this agent's own row from the shared Hanson Team sheet so
   their photo and phone number can be updated by editing that one
   row (no redeploy needed) — same self-serve pattern as the main
   site's Team page. Everything else on this site (bio prose, etc.)
   is static HTML, not Sheet-driven.

   Matched by exact First Name + Last Name == "{cfg.full_name}" in
   the shared Team tab. If that row is ever renamed/deleted, this
   just silently keeps whatever photo/phone the page already has.
   ============================================================ */
(function () {{
  var SHEET_ID = "1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI";
  var AGENT_FIRST = {json.dumps(cfg.data["first_name"])};
  var AGENT_LAST = {json.dumps(cfg.data["last_name"])};

  function photoSrc(value) {{
    var v = String(value || "").trim();
    if (!v) return "";
    var m = v.match(/drive\\.google\\.com\\/(?:file\\/d\\/|open\\?id=|uc\\?[^ ]*id=)([\\w-]+)/);
    if (m) return "https://drive.google.com/thumbnail?id=" + m[1] + "&sz=w1200";
    if (/^https?:\\/\\//i.test(v)) return v;
    return v;
  }}

  function syncAgentBio() {{
    var photoEl = document.getElementById("agent-photo-img");
    var phoneEls = document.querySelectorAll(".js-agent-phone");
    if (!photoEl && phoneEls.length === 0) return;

    var url = "https://docs.google.com/spreadsheets/d/" + SHEET_ID +
              "/gviz/tq?tqx=out:json&headers=1&sheet=Team&_=" + Date.now();
    fetch(url)
      .then(function (r) {{ return r.text(); }})
      .then(function (text) {{
        var json = JSON.parse(text.substring(text.indexOf("{{"), text.lastIndexOf("}}") + 1));
        var cols = (json.table && json.table.cols) || [];
        var rows = (json.table && json.table.rows) || [];
        var idx = {{}};
        cols.forEach(function (c, i) {{ idx[String(c.label || "").trim().toLowerCase()] = i; }});
        function cell(row, name) {{
          var i = idx[name];
          if (i == null || !row.c || !row.c[i] || row.c[i].v == null) return "";
          return row.c[i].v;
        }}
        var row = rows.find(function (r) {{
          return String(cell(r, "first name")).trim() === AGENT_FIRST &&
                 String(cell(r, "last name")).trim() === AGENT_LAST;
        }});
        if (!row) return;

        var photo = photoSrc(cell(row, "photo file"));
        if (photoEl && photo) photoEl.setAttribute("src", photo);

        var phone = String(cell(row, "phone") || "").trim();
        if (phone) phoneEls.forEach(function (el) {{ el.textContent = phone; }});
      }})
      .catch(function () {{}}); // fallback: whatever's already in the HTML stays
  }}

  if (document.readyState === "loading") {{
    document.addEventListener("DOMContentLoaded", syncAgentBio);
  }} else {{
    syncAgentBio();
  }}
}})();
'''
    (out_dir / "assets" / "agent-bio.js").write_text(content, encoding="utf-8")
    p = out_dir / "assets" / "team.js"
    if p.exists():
        p.unlink()
    print("  assets/team.js -> assets/agent-bio.js (single-row photo/phone sync)")


# ── about.html: Emily's bio -> this agent's bio, drop org-wide sections ───
def rewrite_about_html(out_dir: Path, cfg: AgentConfig):
    p = out_dir / "about.html"
    text = p.read_text(encoding="utf-8")

    # Head metadata literally named Emily by name (not caught by the
    # global brand-name substitution, which only matches "Hanson
    # Insurance Agency" as a phrase).
    about_title = "Meet Your Advisor" if cfg.brand_name == cfg.full_name else f"About {cfg.full_name}"
    text = text.replace(
        "About Emily Hanson & The Team", about_title
    ).replace(
        "Meet Emily Hanson and the Hanson Insurance team. Independent broker "
        "licensed in dozens of states, based in Liberty Hill, TX.",
        f"Meet {cfg.full_name}, an independent insurance advisor helping clients "
        f"with Medicare, health, and life insurance. {cfg.data['service_area']}.",
    )

    bio_html = "\n        ".join(f"<p style=\"margin-top:12px;\">{para}</p>" for para in cfg.data["bio_paragraphs"])

    bio_card_re = re.compile(
        r'<!-- ── Emily Bio ──.*?</section>\n\n<!-- ── Life outside the office',
        re.DOTALL,
    )
    replacement = f'''<!-- ── Agent Bio ──────────────────────────────────────────── -->
<section class="section">
  <div class="container">
    <div class="two-col">
      <div class="emily-card">
        <div class="emily-photo" style="padding:0;overflow:hidden;">
          <img id="agent-photo-img" src="{cfg.photo_src}" alt="{cfg.full_name}" style="width:100%;height:100%;object-fit:cover;object-position:top;" />
        </div>
        <div class="emily-info">
          <h3>{cfg.full_name}</h3>
          <p style="color:var(--color-ink-light);font-size:.9rem;margin-top:4px;">{cfg.data["role"]}</p>
          <p style="margin-top:12px;font-size:.9rem;">📞 <a href="tel:{cfg.tel_href}" style="color:var(--medicare-primary);" class="js-agent-phone">{cfg.phone_dashed}</a></p>
          <p style="margin-top:4px;font-size:.9rem;">✉️ <a class="js-email" data-user="{cfg.email_user}" data-domain="{cfg.email_domain}" href="#" style="color:var(--medicare-primary);"><span class="js-email-text">{cfg.email_user} [at] {cfg.email_domain}</span></a></p>
          <a href="book.html" class="btn btn-dark" style="margin-top:20px;width:100%;">Book an Appointment</a>
        </div>
      </div>
      <div>
        <div class="section-label">About {cfg.first_name_safe}</div>
        <h2>{cfg.full_name}</h2>
        {bio_html}
      </div>
    </div>
  </div>
</section>

<!-- ── Life outside the office'''
    text = bio_card_re.sub(replacement, text)

    if not cfg.data.get("personal_photos"):
        text = re.sub(
            r'<!-- ── Life outside the office ──.*?</section>\n\n(?=<!-- ── Team)',
            "", text, flags=re.DOTALL,
        )
    # Else: leave the section's structure; the two hardcoded Sweden photo
    # paths were already replaced by the caller before this ran (see main()).

    # "A team of N advisors across five agencies" — always dropped, refers
    # to org-wide structure that doesn't apply to a solo clone.
    text = re.sub(
        r'<!-- ── Team ──.*?</section>\n\n(?=<!-- ── Agency Values)',
        "", text, flags=re.DOTALL,
    )

    # States section — dropped along with the "Licensed in N states" claim.
    text = re.sub(
        r'<!-- ── States ──.*?</section>\n\n(?=<!-- ── Community)',
        "", text, flags=re.DOTALL,
    )

    # Community section's Maps card points at Hanson's own office address
    # — drop the card, keep the left-column copy (already agent-neutral
    # after the global substitution pass rewrote "Our team" language).
    text = re.sub(
        r'      <a href="https://maps\.google\.com/\?q=13985[^"]*"[\s\S]*?</a>\n',
        "", text,
    )
    text = text.replace('<div class="two-col">\n      <div>\n        <div class="section-label">Community Roots',
                         '<div>\n        <div class="section-label">Community Roots')
    text = text.replace(
        'a trusted resource for all things insurance.</p>\n        <a href="events.html" class="btn btn-outline" style="margin-top:24px;">See upcoming events →</a>\n      </div>\n    </div>',
        'a trusted resource for all things insurance.</p>\n        <a href="events.html" class="btn btn-outline" style="margin-top:24px;">See upcoming events →</a>\n      </div>',
    )

    p.write_text(text, encoding="utf-8")
    print("  about.html rebuilt around this agent's own bio")


# ── index.html: named testimonials -> link-only teaser (no misattribution) ─
def rewrite_index_html(out_dir: Path, cfg: AgentConfig):
    p = out_dir / "index.html"
    text = p.read_text(encoding="utf-8")

    testimonial_grid_re = re.compile(
        r'    <div class="grid-3">\n\n      <div class="testimonial-card">.*?</div>\n\n    </div>\n'
        r'    <div style="text-align:center;margin-top:40px;">\n'
        r'      <a href="testimonials\.html" class="btn btn-outline">Read all testimonials →</a>\n'
        r'    </div>',
        re.DOTALL,
    )
    if cfg.data.get("featured_testimonial"):
        t = cfg.data["featured_testimonial"]
        loc_html = f'{t["location"]} · ' if t.get("location") else ""
        club_badge = f'<span class="badge badge-{t.get("club", "medicare")}" style="font-size:.7rem;padding:2px 8px;">Club {t.get("club", "Medicare").title()}</span>' if t.get("club") else ""
        replacement = f'''    <div class="grid-3" style="max-width:520px;margin:0 auto;">
      <div class="testimonial-card">
        <div class="stars">{'★' * int(t.get("stars", 5))}</div>
        <p class="testimonial-text">"{t["quote"]}"</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">{t["name"][0]}</div>
          <div>
            <div class="testimonial-name">{t["name"]}</div>
            <div class="testimonial-location">{loc_html}{club_badge}</div>
          </div>
        </div>
      </div>
    </div>
    <div style="text-align:center;margin-top:40px;">
      <a href="testimonials.html" class="btn btn-outline">Read all testimonials →</a>
    </div>'''
    else:
        replacement = '''    <div style="text-align:center;">
      <a href="testimonials.html" class="btn btn-outline">Read what clients say →</a>
    </div>'''
    text = testimonial_grid_re.sub(replacement, text)

    # "Meet Emily" section -> this agent, reusing their own photo/bio intro.
    meet_re = re.compile(r'<!-- ── Meet Emily ──.*?</section>', re.DOTALL)
    replacement2 = f'''<!-- ── Meet Your Advisor ──────────────────────────────────── -->
<section class="section" style="background:var(--color-card);">
  <div class="container">
    <div class="two-col">
      <div class="emily-card">
        <div class="emily-photo" style="aspect-ratio:431/510;max-width:380px;margin:24px auto 0;border-radius:12px;"><img id="agent-photo-img-home" src="{cfg.photo_src}" alt="{cfg.full_name}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"></div>
        <div class="emily-info">
          <div class="badge badge-neutral" style="margin-bottom:12px;">{cfg.data["role"]}</div>
          <h3 style="font-size:1.6rem;">{cfg.full_name}</h3>
          <p style="margin-top:8px;font-size:.85rem;color:var(--color-ink-light);">{cfg.data["service_area"]}</p>
        </div>
      </div>
      <div>
        <div class="section-label">Meet Your Advisor</div>
        <h2>An agent who believes in doing the right thing. No matter what.</h2>
        <p style="margin-top:16px;">{cfg.data["bio_paragraphs"][0]}</p>
        <div style="margin-top:32px;display:flex;gap:16px;flex-wrap:wrap;">
          <a href="book.html" class="btn btn-dark btn-lg">Book an Appointment →</a>
          <a href="about.html" class="btn btn-outline btn-lg">More about {cfg.first_name_safe}</a>
        </div>
      </div>
    </div>
  </div>
</section>'''
    text = meet_re.sub(replacement2, text)

    p.write_text(text, encoding="utf-8")
    print("  index.html testimonial + Meet-Your-Advisor sections rewritten")


# ── Strip unlicensed-club cards/links from pages other than the nav/footer ─
# rewrite_components_js only handles the shared header/footer template.
# index.html, 404.html, and forms.html each embed their OWN club-specific
# cards/buttons/links directly in page markup — found during pilot testing
# with a medicare-only agent (Cameron Vigil): the homepage still showed a
# "Club Life" card linking to a now-deleted club-life/ directory, and
# 404.html still linked to the deleted team.html and both dropped clubs.
def strip_unlicensed_club_content(out_dir: Path, cfg: AgentConfig):
    clubs = cfg.data["clubs"]
    club_labels = {"medicare": "Medicare", "health": "Health", "life": "Life"}

    # index.html hero buttons — one <a> per club, single line each.
    p = out_dir / "index.html"
    text = p.read_text(encoding="utf-8")
    for club in ("medicare", "health", "life"):
        if club in clubs:
            continue
        text = re.sub(
            rf'\s*<a href="club-{club}/index\.html"[^\n]*Club {club_labels[club]}</a>\n',
            "\n", text,
        )
    # index.html "Three Clubs" grid — a whole <!-- Club X --> ... </div> card.
    # Anchored on the card's own closing "Explore Club X" link + </div>,
    # not just the first </div> encountered (the card has several nested
    # ones before that point, e.g. around the club-icon <img>).
    for club in ("medicare", "health", "life"):
        if club in clubs:
            continue
        text = re.sub(
            rf'\s*<!-- Club {club_labels[club]} -->\n\s*<div class="card card-{club} club-card">.*?'
            rf'Explore Club {club_labels[club]} →</a>\n\s*</div>\n',
            "\n", text, flags=re.DOTALL,
        )
    p.write_text(text, encoding="utf-8")

    # 404.html — dead Team link (page always dropped) + dead club links.
    p = out_dir / "404.html"
    text = p.read_text(encoding="utf-8")
    text = re.sub(
        r'\s*<a href="team\.html"[^\n]*Meet the Team →</a>\n', "\n", text,
    )
    for club in ("medicare", "health", "life"):
        if club in clubs:
            continue
        text = re.sub(
            rf'\s*<a href="club-{club}/index\.html"[^\n]*Club {club_labels[club]} →</a>\n',
            "\n", text,
        )
    p.write_text(text, encoding="utf-8")

    # forms.html — the Health Intake / Life Quote cards (Medicare's SOA
    # card has no club-specific outbound link, so it's harmless to leave,
    # but drop it too for consistency when medicare isn't licensed).
    p = out_dir / "forms.html"
    text = p.read_text(encoding="utf-8")
    if "health" not in clubs:
        text = re.sub(
            r'\s*<div class="card" style="text-align:center;border-top:4px solid var\(--health-primary\);">\n'
            r'\s*<div style="margin-bottom:12px;"><img src="logos/Logo Club HEALTH\.png"[\s\S]*?</div>\n\s*</div>\n',
            "\n", text,
        )
    if "life" not in clubs:
        text = re.sub(
            r'\s*<div class="card" style="text-align:center;border-top:4px solid var\(--life-primary\);">\n'
            r'\s*<div style="margin-bottom:12px;"><img src="logos/clublife\.png"[\s\S]*?</div>\n\s*</div>\n',
            "\n", text,
        )
    if "medicare" not in clubs:
        text = re.sub(
            r'\s*<div class="card" style="text-align:center;border-top:4px solid var\(--medicare-primary\);">\n'
            r'\s*<div style="font-size:2rem;margin-bottom:12px;">🤝</div>[\s\S]*?</div>\n\s*</div>\n',
            "\n", text,
        )
    p.write_text(text, encoding="utf-8")

    # events.js Area filter bar — only offer clubs this agent actually has
    # (harmless either way since events are already host-filtered, but a
    # filter button for a club with zero possible matches is just noise).
    p = out_dir / "assets" / "events.js"
    text = p.read_text(encoding="utf-8")
    for club in ("health", "life"):
        if club not in clubs:
            text = text.replace(
                f"        '<button type=\"button\" class=\"filter-btn\" data-area=\"{club}\">Club {club_labels[club]}</button>' +\n",
                "",
            )
    p.write_text(text, encoding="utf-8")

    print(f"  unlicensed-club cards/links stripped from index.html, 404.html, forms.html, events.js")

    # Safety net: fail loudly if a link to a now-deleted club directory
    # somehow survives anywhere, rather than silently shipping a 404.
    dead_links = []
    for club in ("medicare", "health", "life"):
        if club in clubs:
            continue
        for path in out_dir.rglob("*.html"):
            if f'href="club-{club}/' in path.read_text(encoding="utf-8") or \
               f'href="../club-{club}/' in path.read_text(encoding="utf-8"):
                dead_links.append((str(path.relative_to(out_dir)), club))
    if dead_links:
        print(f"  WARNING: dead links to a dropped club directory found: {dead_links} — fix before launch")


# ── Strip every remaining "Licensed in N states" claim site-wide ──────────
# assets/components.js's own footer badge + initLiveStats() were already
# handled in rewrite_components_js, but several pages hardcode the SAME
# claim directly in their own HTML (not injected by that JS), which would
# otherwise freeze at the master's own agency-wide "37" forever once
# initLiveStats() is gone — misattributing Hanson's agency-wide count to
# this one agent specifically. Every occurrence found across the whole
# site during pilot testing is handled explicitly here rather than via a
# generic regex, since each one sits in different surrounding markup.
def strip_states_claims(out_dir: Path, cfg: AgentConfig):
    area = cfg.data["service_area"]
    replacements = {
        "index.html": [
            ("No broker fees. Licensed in dozens of states.",
             f"No broker fees. {area}."),
            ('Licensed in <span class="js-state-count">37</span> States · Liberty Hill, TX',
             area),
            ('<div class="trust-item"><span class="icon">🗺️</span> Licensed in <span class="js-state-count">37</span> States</div>',
             f'<div class="trust-item"><span class="icon">🗺️</span> {area}</div>'),
            ('Licensed in <span class="js-state-count">37</span> states and serving clients coast to coast. Local heart, national capability.',
             f"{area}. Local heart, national capability."),
            ('<div class="value-stat js-state-count" style="color:var(--medicare-dark);">37</div>\n'
             '            <div class="value-label">States Licensed</div>',
             '<div class="value-stat" style="color:var(--medicare-dark);">📍</div>\n'
             f'            <div class="value-label">{area}</div>'),
        ],
        "contact.html": [
            ('Serving clients in <span class="js-state-count">37</span> states',
             area),
            ('We serve clients locally and across <span class="js-state-count">37</span> states.',
             f"{area}."),
        ],
    }
    n = 0
    for filename, pairs in replacements.items():
        p = out_dir / filename
        if not p.exists():
            continue
        text = p.read_text(encoding="utf-8")
        for old, new in pairs:
            if old in text:
                text = text.replace(old, new)
                n += 1
        p.write_text(text, encoding="utf-8")
    # Catch-all safety net: any remaining js-state-count span anywhere else
    # (a page not enumerated above) still shows a live number by design —
    # since initLiveStats() is now gone, freeze-print a warning comment
    # instead of silently showing a stale "37" if this ever happens.
    leftover = []
    for path in out_dir.rglob("*.html"):
        if "js-state-count" in path.read_text(encoding="utf-8"):
            leftover.append(str(path.relative_to(out_dir)))
    if leftover:
        print(f"  WARNING: js-state-count still present in {leftover} — "
              "review by hand before launch, initLiveStats() no longer updates it")
    print(f"  states-claim replaced with service-area text in {n} spots")


# ── sitemap.xml + robots.txt: regenerate for the surviving pages only ─────
def regenerate_sitemap_and_robots(out_dir: Path, cfg: AgentConfig):
    domain = cfg.data["domain"]
    today = __import__("datetime").date.today().isoformat()
    pages = sorted(
        str(p.relative_to(out_dir).as_posix())
        for p in out_dir.rglob("*.html")
        if p.name != "404.html"
    )
    entries = "\n".join(
        f'  <url>\n    <loc>https://{domain}/{"" if p == "index.html" else p}</loc>\n'
        f'    <lastmod>{today}</lastmod>\n    <changefreq>monthly</changefreq>\n'
        f'    <priority>{"1.0" if p == "index.html" else "0.7"}</priority>\n  </url>'
        for p in pages
    )
    sitemap = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{entries}\n</urlset>\n"
    )
    (out_dir / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    (out_dir / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\n\nSitemap: https://{domain}/sitemap.xml\n",
        encoding="utf-8",
    )
    print(f"  sitemap.xml regenerated ({len(pages)} pages), robots.txt updated")


# ── vercel.json: keep only the www->apex rules, drop legacy WP redirects ──
def rewrite_vercel_json(out_dir: Path, cfg: AgentConfig):
    domain = cfg.data["domain"]
    data = {
        "redirects": [
            {
                "source": "/",
                "has": [{"type": "host", "value": f"www.{domain}"}],
                "destination": f"https://{domain}/",
                "permanent": True,
            },
            {
                "source": "/:path*",
                "has": [{"type": "host", "value": f"www.{domain}"}],
                "destination": f"https://{domain}/:path*",
                "permanent": True,
            },
        ]
    }
    (out_dir / "vercel.json").write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print("  vercel.json simplified to just the www->apex rule for the new domain")


# ── copy the agent's photo + personal photos into place ───────────────────
def stage_media(out_dir: Path, cfg: AgentConfig, source_dir: Path):
    agents_dir = out_dir / "agents"
    photo = cfg.data["photo"]
    if photo.startswith("http"):
        cfg._photo_src = photo  # Drive link / full URL — used directly, no copy needed
    else:
        agents_dir.mkdir(exist_ok=True)
        src = source_dir / photo
        if src.exists():
            shutil.copy(src, agents_dir / Path(photo).name)
            cfg._photo_src = f"agents/{Path(photo).name}"
        else:
            print(f"  WARNING: photo file not found at {src} — using filename as-is, verify before launch")
            cfg._photo_src = f"agents/{photo}"

    personal = cfg.data.get("personal_photos") or []
    if personal:
        images_dir = out_dir / "images"
        images_dir.mkdir(exist_ok=True)
        copied = []
        for rel in personal[:2]:
            src = source_dir / rel
            if src.exists():
                dest = images_dir / Path(rel).name
                shutil.copy(src, dest)
                copied.append(f"images/{Path(rel).name}")
            else:
                print(f"  WARNING: personal photo not found at {src}, skipping")
        if len(copied) == 2:
            about = out_dir / "about.html"
            text = about.read_text(encoding="utf-8")
            text = text.replace("images/emily-family-sweden.jpg", copied[0])
            text = text.replace("images/emily-sweden-smooches.jpg", copied[1])
            about.write_text(text, encoding="utf-8")
    if cfg.data.get("hero_video"):
        src = source_dir / cfg.data["hero_video"]
        if src.exists():
            dest = out_dir / "assets" / "hero-medicare.mp4"
            shutil.copy(src, dest)
            print("  hero video replaced with agent-supplied override")


# ── small helper properties added onto AgentConfig after construction ─────
def _attach_helpers(cfg: AgentConfig):
    cfg.first_name_safe = cfg.data["first_name"]
    cfg.full_name_js = cfg.full_name.replace('"', '\\"')

    def photo_src(self=cfg):
        return getattr(self, "_photo_src", self.data["photo"])

    AgentConfig.photo_src = property(lambda self: getattr(self, "_photo_src", self.data["photo"]))


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--config", required=True, type=Path, help="path to the agent's intake JSON")
    ap.add_argument("--out", required=True, type=Path, help="output directory for the generated clone (must not exist)")
    ap.add_argument("--media-dir", type=Path, default=None,
                     help="directory to resolve local photo/video paths from (default: same dir as --config)")
    args = ap.parse_args()

    raw = json.loads(args.config.read_text(encoding="utf-8"))
    cfg = AgentConfig(raw)
    _attach_helpers(cfg)

    out_dir = args.out.resolve()
    media_dir = (args.media_dir or args.config.parent).resolve()

    print(f"Generating clone for {cfg.full_name} -> {out_dir}")
    export_master(out_dir)
    prune(out_dir, cfg)
    stage_media(out_dir, cfg, media_dir)
    apply_global_pass(out_dir, cfg)
    rewrite_jsonld_blocks(out_dir, cfg)
    rewrite_components_js(out_dir, cfg)
    rewrite_book_html(out_dir, cfg)
    rewrite_events_js(out_dir, cfg)
    rewrite_form_submit_js(out_dir, cfg)
    write_agent_bio_js(out_dir, cfg)
    rewrite_about_html(out_dir, cfg)
    rewrite_index_html(out_dir, cfg)
    strip_unlicensed_club_content(out_dir, cfg)
    strip_states_claims(out_dir, cfg)
    regenerate_sitemap_and_robots(out_dir, cfg)
    rewrite_vercel_json(out_dir, cfg)

    # Wire the new script tags: about.html and index.html both need
    # assets/agent-bio.js now that assets/team.js is gone.
    for page in ("about.html", "index.html"):
        p = out_dir / page
        text = p.read_text(encoding="utf-8")
        if "assets/agent-bio.js" not in text:
            text = text.replace(
                '<script src="assets/components.js"></script>',
                '<script src="assets/components.js"></script>\n<script src="assets/agent-bio.js"></script>',
            )
            p.write_text(text, encoding="utf-8")

    print(f"\nDone. Clone written to {out_dir}")
    print("Next: serve it locally and review before any GitHub/Vercel/DNS step —")
    print(f"  cd {out_dir} && python3 -m http.server 8080")


if __name__ == "__main__":
    main()
