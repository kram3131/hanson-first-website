---
name: new-agent-site
description: Generate and deploy a personal website for one Hanson Insurance team member/advisor, cloned from the Hanson First template with their own identity, licensed clubs, booking link, and domain. Use when Mark asks to give a team member their own site, create an agent site, clone the site for an advisor, or set up a personal website for someone on the team.
---

# New Agent Site

Turns one team member into a real, deployed personal website — their own
domain, their own GitHub repo, their own Vercel project — built from the
Hanson First template. Full design rationale lives in the approved plan
at `/Users/markgarza/.claude/plans/lovely-gathering-prism.md`; read it if
anything below is unclear about *why* a step exists.

**Core safety property**: `tools/generate_clone.py` reads the master repo
via `git archive HEAD` (a committed snapshot) and writes only into a new
`--out` directory. It never modifies the master repo's own files. Nothing
in this flow touches the live hansonfirst.com site.

## When to use this

Mark says something like "give Tia her own site," "clone the site for
Cameron," "set up a personal website for [name]," or similar. This is a
real, multi-step, outward-facing process (creates a GitHub repo, a Vercel
project, and hands DNS instructions to a third party) — follow every step,
don't skip the review checkpoint in Step 4.

## Step 1 — Identify the agent, validate against the live Sheet

Ask for the agent's first and last name if not already given. Then fetch
the live Team sheet and confirm a matching row exists with both `Booking
Link` and `Clubs` populated:

```bash
curl -s "https://docs.google.com/spreadsheets/d/1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI/gviz/tq?tqx=out:json&headers=1&sheet=Team"
```

If no matching row exists, or Booking Link / Clubs is blank: **stop** and
tell Mark to add/complete that row in the Sheet first. The clone's photo
and phone stay self-serve-synced from that row after launch (via
`assets/agent-bio.js`) — generating without it means those fields never
populate.

## Step 2 — Collect the remaining intake fields

**Preferred path: self-serve.** Send the agent this link:
`https://hansonfirst.com/agent-intake.html` (unlisted — not in nav or
the sitemap, `noindex`, found only by direct link). It's a real page on
the live site, styled like the rest of it, and checks their name against
the live Team sheet as they type (won't block submission, just warns).
It posts through the same shared Apps Script every other form on the
site uses. **The live deployed Apps Script needs two things from
`google-apps-script/form-capture.gs` before this works** — check both
before sending an agent the link:

1. The `agentIntake` entry in `TAB_MAP`. If missing, submissions land
   safely in "Unrecognized Submissions" instead of erroring, so nothing
   is lost, but the converter won't find them by name.
2. `AGENT_INTAKE_SHEET_ID` set to a **private** Sheet (create one via
   sheets.new, share it with no one else, paste its ID in). This
   submission carries an agent's bio, personal email, domain, and
   whether they run their own separate business — deliberately kept
   out of the main shared Sheet everyone with Sheet access can see.
   Leave it blank and everything still works, just less privately
   (lands in the main Sheet's "Agent Intake Submissions" tab instead,
   and the alert email goes to `AGENT_INTAKE_NOTIFY_EMAIL` — still not
   `NOTIFY_EMAILS`/Emily, but check both are actually set the way you
   want before relying on it).

Once an agent submits, pull their row into a ready config — pass
`--sheet-id` if submissions are landing in the private Sheet:

```bash
python3 tools/intake_to_config.py --list                       # see who's submitted
python3 tools/intake_to_config.py --name "Tia Pruett" --out tools/agent-tia-pruett.json --sheet-id {private-sheet-id-if-set}
```

**Review the output before generating** — the converter deliberately
does not silently resolve the compliance-sensitive fields for you:
- `bio_paragraphs` — read it, it's the agent's own words, not yours
- If `is_separate_entity` is `true`, the converter adds a
  `_REVIEW_legal_name` note — the form only collects a "Business/Brand
  Name," which may not be their exact legal entity name. Confirm it (or
  correct it) before generating, then delete the `_REVIEW_...` key.
- If the agent's `team_sheet_match` came back `no` (shown in `--list`
  and the console output), their Team-sheet row still needs adding
  before this can ship — same requirement as Step 1.

**Fallback path: ask them yourself.** If self-serve doesn't fit (or the
form isn't reachable for some reason), collect the same fields directly
in conversation and write the JSON by hand — reference
`tools/clone_config.schema.json` for the full field list. `clubs`,
`phone`, and `calendly_url` should come from the Team sheet row, not be
re-asked. `featured_testimonial` and `hero_video` are curation calls the
self-serve form doesn't collect either way — add them to the config
yourself if wanted, they're optional.

Either path ends the same way: a JSON file matching the schema, e.g.
`tools/agent-{slug}.json` (see `tools/pilot-tia-pruett.json` and
`tools/pilot-cameron-vigil.json` for real worked examples — one an
all-clubs Hanson advisor, one a medicare-only separate-DBA entity).

## Step 3 — Generate

```bash
python3 tools/generate_clone.py --config tools/agent-{slug}.json --out /tmp/hanson-{slug}
```

Watch the output for `WARNING:` lines — the generator self-checks several
failure-prone spots (social icon removal, dead links to a dropped club
directory) and prints a warning rather than silently shipping something
broken. **Do not proceed past a WARNING without resolving it.**

## Step 4 — Dry-run review (required checkpoint before Step 5)

Serve the output locally and actually look at it — this is not optional,
it's the one checkpoint before real external resources get created:

```bash
cd /tmp/hanson-{slug} && python3 -m http.server 8080
```

Click through in a browser (or drive it with the Browser tool) and check:
- Nav/footer show only this agent's licensed clubs, no Team/Join Us links
- `book.html` embeds their one Calendly link directly, no club picker
- `events.html` shows only events where they're the Host
- Homepage testimonial is either their featured one or the link-only
  teaser — never another advisor's quote
- Footer legal name/phone/email are correct; if `is_separate_entity` is
  true, the affiliation disclosure line is present
- No stray "Emily," "Hanson Insurance Agency," "hansonfirst.com," or the
  master's phone number survive anywhere:
  ```bash
  grep -rln "hansonfirst.com\|Hanson Insurance Agency\|512-817-6906\|Emily" --include="*.html" --include="*.js" /tmp/hanson-{slug}
  ```
  (should be empty)

Show Mark a summary of what was generated and get his explicit go-ahead
before Step 5 — everything past this point creates real, outward-facing
resources.

## Step 5 — Provisioning (only after Step 4's go-ahead)

```bash
cd /tmp/hanson-{slug}
gh repo create kram3131/hanson-{slug}-website --private --description "Personal site for {Agent Name}"
git init && git add -A && git commit -m "Generate {Agent Name}'s site from Hanson First template"
git remote add origin https://github.com/kram3131/hanson-{slug}-website.git
git push -u origin main
```

Create the Vercel project and connect it to that repo, then deploy —
wrap the deploy in one automatic retry, the same transient
`"status":"error"` blip that shows up on the main site's own deploys
happens here too and clears on retry:

```bash
vercel link --yes
vercel git connect
vercel --prod --yes || vercel --prod --yes
```

Attach the domain:

```bash
vercel domains add {domain} hanson-{slug}-website
vercel domains add www.{domain} hanson-{slug}-website
```

## Step 6 — Hand off DNS instructions

Give the agent these two records, copy-pasteable, same pattern already
proven for hansonfirst.com's own cutover:

| Type | Name | Content |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

If they're on Cloudflare specifically, call out explicitly that both
records need **DNS-only (grey cloud)**, not proxied — that's the one
gotcha that doesn't generalize to other registrars. SSL issues
automatically once DNS resolves; if it doesn't within a few minutes, the
same fix used on the main site applies: `vercel certs issue {domain}
www.{domain}`.

## Step 7 — Final handoff summary

Tell Mark, in the same "done vs. still-open, none blocking" format used
throughout this project:

- **Done**: repo created and pushed, Vercel project deployed, domain
  attached, live and reachable on the `.vercel.app` URL right now.
- **Still open (agent-side)**: DNS records to add at their registrar;
  SSL completes automatically once that propagates.
- **Still open (worth a pass, non-blocking)**: bio copy deserves a human
  read-through before wide distribution; confirm the featured testimonial
  choice if one wasn't given.

## Notes for future edits to this flow

- If the master site's template changes later (a new page, a redesigned
  section, a new identity constant), `tools/generate_clone.py` needs a
  matching update — clones are frozen snapshots by design (confirmed
  decision: no auto-sync), so this only affects *future* clones, not
  ones already generated.
- Two real bugs were caught during pilot testing that are worth knowing
  about if this script is ever modified: (1) a regex that matches social
  icons by their **visible text** will silently fail, since the actual
  markup only shows "f"/"in"/"ig"/"▶" — match on `aria-label` instead;
  (2) index.html's hero buttons and "Three Clubs" grid, 404.html's
  helpful-links list, and forms.html's per-club quote cards all embed
  their own club-specific links directly in page markup, separate from
  the shared nav/footer in `assets/components.js` — all of them need
  filtering by licensed club, not just the nav.
