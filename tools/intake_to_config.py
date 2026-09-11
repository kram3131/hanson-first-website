#!/usr/bin/env python3
"""
intake_to_config.py — turn one agent-intake.html submission into a
ready generate_clone.py config.

The self-serve form (agent-intake.html) writes each submission as a row
in the shared Sheet's "Agent Intake Submissions" tab (via the same
Apps Script every other form on the site already uses — see
google-apps-script/form-capture.gs). This script fetches that tab,
finds the submission for one agent, and writes it out in the exact
shape tools/generate_clone.py --config expects.

It does NOT run the generator itself, and it does NOT auto-approve
anything — the output is meant to be reviewed (especially the
is_separate_entity / legal_name compliance question) before it's ever
handed to generate_clone.py. See the new-agent-site skill's Step 2.

Usage:
    python3 tools/intake_to_config.py --name "Tia Pruett" --out tools/agent-tia-pruett.json
    python3 tools/intake_to_config.py --list          # show all submissions found
"""

import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path

# The private intake Sheet (matches AGENT_INTAKE_SHEET_ID in
# google-apps-script/form-capture.gs — keep these two in sync). Only
# readable because it's shared "Anyone with the link, Viewer" — the
# actual privacy comes from this ID being an unguessable 44-character
# string, not from requiring a Google login. Pass --sheet-id to read
# somewhere else instead (e.g. the main shared Sheet, if intake
# submissions were ever landing there before this was set up).
SHEET_ID = "1js4dprqzcj_ISM456yZSRpd8pK4KXstEkMugFQ_eY78"
TAB = "Agent Intake Submissions"


def fetch_rows(sheet_id=SHEET_ID):
    url = (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq"
        f"?tqx=out:json&headers=1&sheet={urllib.parse.quote(TAB)}"
    )
    with urllib.request.urlopen(url, timeout=20) as r:
        text = r.read().decode("utf-8")
    raw = text[text.index("{"): text.rindex("}") + 1]
    data = json.loads(raw)
    cols = data.get("table", {}).get("cols", [])
    rows = data.get("table", {}).get("rows", [])
    idx = {str(c.get("label") or "").strip().lower(): i for i, c in enumerate(cols)}

    def cell(row, name):
        i = idx.get(name)
        if i is None or i >= len(row["c"]) or row["c"][i] is None:
            return ""
        v = row["c"][i].get("v")
        return "" if v is None else str(v)

    out = []
    for row in rows:
        c = row.get("c") or []
        if not c or all(x is None for x in c):
            continue
        out.append({
            "timestamp": cell(row, "timestamp"),
            "first_name": cell(row, "firstname"),
            "last_name": cell(row, "lastname"),
            "role": cell(row, "role"),
            "photo": cell(row, "photo"),
            "bio": cell(row, "bio"),
            "clubs": cell(row, "clubs"),
            "phone": cell(row, "phone"),
            "email": cell(row, "email"),
            "calendly_url": cell(row, "calendlyurl"),
            "service_area": cell(row, "servicearea"),
            "is_separate_entity": cell(row, "isseparateentity"),
            "dba_name": cell(row, "dbaname"),
            "domain": cell(row, "domain"),
            "domain_status": cell(row, "domainstatus"),
            "facebook": cell(row, "facebook"),
            "linkedin": cell(row, "linkedin"),
            "instagram": cell(row, "instagram"),
            "youtube": cell(row, "youtube"),
            "team_sheet_match": cell(row, "teamsheetmatch"),
        })
    return out


def slugify(first: str, last: str) -> str:
    s = f"{first}-{last}".lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def to_config(intake: dict) -> dict:
    clubs = [c.strip() for c in intake["clubs"].split(",") if c.strip()]
    bio_paragraphs = [p.strip() for p in re.split(r"\n\s*\n", intake["bio"]) if p.strip()]
    is_separate = intake["is_separate_entity"].strip().lower() == "yes"

    cfg = {
        "agent_slug": slugify(intake["first_name"], intake["last_name"]),
        "first_name": intake["first_name"],
        "last_name": intake["last_name"],
        "role": intake["role"],
        "clubs": clubs,
        "photo": intake["photo"],
        "bio_paragraphs": bio_paragraphs,
        "personal_photos": [],
        "phone": intake["phone"],
        "email": intake["email"],
        "calendly_url": intake["calendly_url"],
        "service_area": intake["service_area"],
        "is_separate_entity": is_separate,
        "domain": intake["domain"],
        "social": {
            "facebook": intake["facebook"] or None,
            "linkedin": intake["linkedin"] or None,
            "instagram": intake["instagram"] or None,
            "youtube": intake["youtube"] or None,
        },
    }
    if intake["dba_name"]:
        cfg["dba_name"] = intake["dba_name"]
    if is_separate:
        # Real legal name still needs a human to confirm — the form only
        # collects a "Business/Brand Name," which may or may not be the
        # exact legal entity name. Flagged, not guessed.
        cfg["legal_name"] = intake["dba_name"] or None
        cfg["_REVIEW_legal_name"] = (
            "is_separate_entity is true — confirm this is the agent's exact "
            "legal entity name (not just a brand name) before generating."
        )
    return cfg


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--name", help='Agent full name, e.g. "Tia Pruett" — matches First+Last from the form')
    ap.add_argument("--out", type=Path, help="where to write the config JSON")
    ap.add_argument("--list", action="store_true", help="list every submission found and exit")
    ap.add_argument("--sheet-id", default=SHEET_ID,
                     help="override if intake submissions have moved to a private Sheet")
    args = ap.parse_args()

    rows = fetch_rows(args.sheet_id)
    if args.list or not args.name:
        if not rows:
            print("No submissions found in 'Agent Intake Submissions' yet.")
        for r in rows:
            match = "✓ in Team sheet" if r["team_sheet_match"] == "yes" else "✗ NOT in Team sheet"
            print(f'  {r["timestamp"]:<22} {r["first_name"]} {r["last_name"]:<15} ({match})')
        if not args.name:
            print('\nRe-run with --name "First Last" to convert one submission.')
        return

    matches = [r for r in rows if f'{r["first_name"]} {r["last_name"]}'.strip().lower() == args.name.strip().lower()]
    if not matches:
        print(f"No submission found for '{args.name}'. Run with --list to see what's there.", file=sys.stderr)
        sys.exit(1)
    intake = matches[-1]  # most recent, if they submitted more than once

    if intake["team_sheet_match"] != "yes":
        print(f"WARNING: '{args.name}' was not matched against the Team sheet at submission time — "
              "confirm their row exists there before generating.", file=sys.stderr)

    cfg = to_config(intake)
    out_path = args.out or Path(f"tools/agent-{cfg['agent_slug']}.json")
    out_path.write_text(json.dumps(cfg, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {out_path}")
    print("Review before generating — especially:")
    print(f"  - bio_paragraphs ({len(cfg['bio_paragraphs'])} found) — read it")
    print(f"  - is_separate_entity: {cfg['is_separate_entity']}"
          + ("  <-- confirm legal_name is their real legal entity name, not just a brand" if cfg["is_separate_entity"] else ""))
    print(f"  - domain: {cfg['domain']} ({intake['domain_status']})")


if __name__ == "__main__":
    main()
