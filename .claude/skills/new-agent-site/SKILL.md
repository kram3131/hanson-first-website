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

Everything not already in the Sheet. Reference
`tools/clone_config.schema.json` for the full field list and what each
one means — read it now if this is your first time running this skill.
In order:

1. **Identity**: first/last name (from Step 1), role/title, a real
   multi-paragraph bio (do not write a placeholder and move on — ask
   Mark for real bio text, or tell him it's needed before this can ship),
   optional personal photos.
2. **Licensing**: pull `clubs` straight from the Team sheet row — don't
   re-ask. Which club page-sets survive on this clone is driven entirely
   by this field.
3. **Contact/booking**: phone and `calendly_url` also come from the Team
   sheet row (Phone, Booking Link) — reuse, don't re-ask. Personal email
   is new — ask for it; it drives the JSON-LD, footer mailto, and *all*
   form-alert routing for this site.
4. **Service area**: free text like "Serving clients across Texas" — no
   street address is ever collected or shown, confirmed decision.
5. **Legal/compliance** — ask this precisely, it's compliance-sensitive:
   *"Is [Name] operating under their own separately-licensed agency, or
   as a Hanson Insurance, LLC advisor (optionally using a marketing/DBA
   name)?"* If separately licensed: collect `legal_name` and set
   `is_separate_entity: true`. If just a DBA under Hanson: set `dba_name`
   only, leave `legal_name` blank (defaults to "Hanson Insurance, LLC"),
   `is_separate_entity: false`. Do not guess this — if genuinely unsure,
   ask Mark rather than assuming either answer.
6. **Domain**: do they already own one, or need to buy one? If buying,
   **pause here** — domain purchase is their own external action, not
   something this skill does. Resume once they have it.
7. **Social** (optional, each independent): only fill in platforms this
   agent actually has. Never default to Hanson's own accounts.
8. **Content overrides** (optional): a `featured_testimonial` (name,
   location, club, quote, stars) to replace the default "Read what
   clients say →" link-only teaser; a `hero_video` override.

Write it all to a JSON file matching the schema, e.g.
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
