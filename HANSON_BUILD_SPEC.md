# Hanson Insurance — Website Build Specification
**For use with Claude Code**
Prepared by Laimen AI | March 2026

---

## MISSION BRIEF

Build a production-ready website for **Hanson Insurance Agency** (HansonFirst.com), a Texas-based independent insurance broker owned by Emily Hanson. The site expands from a Medicare-only presence into a three-section platform organized around a "Club" identity system:

- **Club Medicare** — for adults 65+ enrolling in Medicare
- **Club Health** — for adults under 65 AND adults 65+ not on Medicare (still working, on a spouse's plan, or with delayed enrollment)
- **Club Life** — for all ages seeking life insurance

Emily's brokerage **service** is always free (she is paid by carriers). The insurance **products** in Club Health and Club Life cost money — clients pay premiums to the carrier, never to Hanson. This distinction must be clear on every page.

---

## PLATFORM & STACK

**Platform:** WordPress with Elementor Pro
**Reason:** Emily's team must be able to update content, blog posts, events, and forms without a developer after launch.

**Required integrations:**
- Calendly (Book an Appointment — embed on every page)
- SunFire Matrix plan comparison tool (Club Medicare)
- YouTube (video library, webinar replays)
- Mailchimp or GoHighLevel for newsletter signup
- Google Maps embed (Contact page)

**Hosting:** Existing hosting on HansonFirst.com — do not change the domain.

---

## DESIGN SYSTEM

### Aesthetic direction
Warm editorial. Generous whitespace. Serif display headings paired with a clean humanist sans body. Feels like a trusted local professional — not a national insurance conglomerate. Photography-forward. Real people, real Texas.

**Do not build something that looks like a generic insurance site.** Avoid stock-photo-of-happy-senior-couple clichés. Think warm, approachable, and confident.

### Typography
```
Display / headings:  DM Serif Display (Google Fonts)
Body / UI:           DM Sans (Google Fonts)
Fallback:            Georgia, Arial, sans-serif
```

### Color tokens
```css
/* Base */
--color-bg:          #faf9f7;   /* warm off-white page background */
--color-card:        #ffffff;   /* card surfaces */
--color-ink:         #1a1a1a;   /* primary text */
--color-ink-mid:     #444444;   /* secondary text */
--color-ink-light:   #777777;   /* muted/label text */
--color-rule:        #e0ddd8;   /* borders and dividers */

/* Club Medicare — teal/green */
--medicare-primary:  #1D9E75;
--medicare-light:    #E1F5EE;
--medicare-mid:      #5DCAA5;
--medicare-dark:     #085041;

/* Club Health — sky blue */
--health-primary:    #378ADD;
--health-light:      #E6F1FB;
--health-mid:        #85B7EB;
--health-dark:       #0C447C;

/* Club Life — soft purple */
--life-primary:      #7F77DD;
--life-light:        #EEEDFE;
--life-mid:          #AFA9EC;
--life-dark:         #3C3489;
```

### Spacing scale
```
4px / 8px / 12px / 16px / 24px / 32px / 48px / 64px / 96px
```

### Border radius
```
Small elements:  6px
Cards:           12px
Large sections:  16px
Pills/badges:    999px
```

### Trust signals — include on EVERY page
- "No broker fees. Ever." badge in the header/nav
- Phone number: 512-817-6906 (click-to-call on mobile)
- Licensed in 26 states
- HIPAA compliant badge (forms pages)
- On Club Medicare pages only: "Our service is always free to you"

---

## NAVIGATION STRUCTURE

```
[Hanson Insurance logo]
  Home
  About
  Club Medicare      ← teal pill
  Club Health        ← blue pill
  Club Life          ← purple pill
  Testimonials
  Events
  [Book Appointment] ← dark CTA button, always visible
```

Mobile: hamburger menu. Sticky header. "Book Appointment" always visible as a floating CTA on mobile.

---

## COMPLETE PAGE INVENTORY

### SITEWIDE PAGES

---

#### Home (`/`)

**Purpose:** Welcome all three audiences, direct them to the right club, establish trust immediately.

**Sections:**
1. **Hero** — Full-width. Headline: "Real people. Real coverage. Your whole life." Subhead: "Whether you're turning 65, looking for health coverage, or protecting your family — Hanson Insurance is on your side. No broker fees. Ever." Three CTA buttons: Club Medicare / Club Health / Club Life. Background: warm photo of real Texans or Emily's team.
2. **Trust bar** — Single row: "Licensed in 26 states" · "No broker fees, ever" · "Real agents, not call centers" · "HIPAA compliant"
3. **Three clubs intro** — Three cards side by side. Medicare (teal), Health (blue), Life (purple). Each: club name, who it's for, 2-sentence description, CTA arrow.
4. **Why Hanson** — 3-4 reasons. Independent broker (not tied to one company). Long-term advocacy. Free guidance. Texas-based, multi-state licensed.
5. **Testimonials strip** — 3 rotating testimonials. Real names. Pull from existing HansonFirst.com testimonials (Tia, Katie, Katherine clients).
6. **Emily intro** — Photo of Emily. Brief personal intro. "Book a time with me" CTA → Calendly.
7. **Newsletter signup** — Simple email capture. "Get quarterly Medicare and health insurance updates."
8. **Footer** — Logo, nav links, phone, email, social icons (Facebook, LinkedIn, YouTube), HIPAA badge, license disclaimer.

**Key copy note:** Include the Medicare carrier disclaimer: "We do not offer every plan available in your area. Currently we represent 13 organizations which offer 92 plans in your area. Please contact Medicare.gov, 1-800-MEDICARE, or your local State Health Insurance Program (SHIP) to get information on all of your options."

---

#### About / Meet the Team (`/about`)

**Sections:**
1. Emily Hanson bio — founder story, why she started the agency, her philosophy
2. Agent profiles — Tia Pruett, Katie/Katherine Bruner, and others (request headshots and bios from Emily)
3. Agency values — Independent. Honest. Long-term. Free.
4. Multi-state license list — all 26 states displayed
5. Liberty Hill, TX roots — brief community connection
6. Book CTA

---

#### Testimonials (`/testimonials`)

**Features:**
- Filter by club: All / Club Medicare / Club Health / Club Life
- Star ratings displayed
- Client name, location, club type badge on each card
- Submission form for new testimonials
- Migrate all existing testimonials from current HansonFirst.com

**Existing testimonials to migrate:** Tia Pruett (multiple), Katie/Katherine Bruner, Emily Hanson. Source: `https://hansonfirst.com/testimonials/`

---

#### Events (`/events`)

**Features:**
- Calendar view of upcoming events
- Event types: Medicare 101, Community Fairs, Enrollment Help Sessions, Webinars
- Registration links (Calendly or external)
- Webinar replay section with YouTube embeds
- Past events archive

---

#### Book an Appointment (`/book`)

**Features:**
- Calendly embed — primary CTA
- Route by topic: Medicare / Health / Life / General
- Phone: 512-817-6906
- Email: Emily@HansonFirst.com
- Office hours
- Reassurance copy: "No pressure. No fees. Just honest guidance."

---

#### Forms Hub (`/forms`)

**Forms to include:**
- Update/Change Form (existing — migrate from current site)
- Scope of Appointment (SOA) form
- Quote Request (Club Health)
- Quote Request (Club Life)
- General Contact Form
- Newsletter Signup

**HIPAA notice:** Display prominently on all forms pages. Include checkbox acknowledgment where appropriate.

---

#### Contact (`/contact`)

**Content:**
- Phone: 512-817-6906 (click-to-call)
- Email: Emily@HansonFirst.com
- Mailing address: Liberty Hill, TX
- Office hours
- Google Maps embed
- Social links: Facebook, LinkedIn, YouTube
- Simple contact form

---

### CLUB MEDICARE PAGES

**Color theme:** Teal (#1D9E75)
**Key message on every page:** "Our service is always free to you — we're paid by the carriers, not by you."

---

#### Club Medicare Overview (`/club-medicare`)

**Sections:**
1. Hero — "Medicare, made simple." Who this is for. Free service message.
2. The Medicare gap — "Medicare only covers 80% of your medical costs. We help you cover the other 20%."
3. Four plan types at a glance — Advantage, Supplement, Part D, Special Needs (visual cards)
4. How Emily helps — 3 steps: Understand your options → Compare plans → Enroll with confidence
5. Shop & Compare CTA → SunFire tool link
6. Book Appointment CTA

---

#### Medicare Advantage (`/club-medicare/advantage`)

**Content:**
- What Part C is and how it works
- Benefits beyond Original Medicare: dental, vision, hearing, gym, OTC credits
- Chronic Special Needs Plans (C-SNP)
- Dual Plans (Medicare + Medicaid)
- Plans with and without prescription coverage
- Large provider network explanation
- Carrier comparison (do not list specific carriers — direct to SunFire)
- Book CTA + SunFire link

---

#### Medicare Supplement / Medigap (`/club-medicare/supplement`)

**Content:**
- What Medigap is — fills the gaps Original Medicare doesn't cover
- Plans A through N explained (summary table)
- When to choose Supplement vs. Advantage
- Foreign travel emergency coverage note
- Enrollment timing guidance
- Book CTA

---

#### Part D — Prescription Drug Plans (`/club-medicare/part-d`)

**Content:**
- Standalone PDP — how it works with Original Medicare
- MAPD — Medicare Advantage with Drug Coverage combo
- Enrollment rules and deadlines
- Late enrollment penalty explainer
- SunFire plan compare link
- Book CTA

---

#### Special Needs Plans (`/club-medicare/special-needs`)

**Content:**
- Chronic Special Needs Plans (C-SNP) — diabetes, heart disease, cardiovascular
- Dual Eligible Plans (D-SNP) — for those with both Medicare and Medicaid
- Who qualifies
- How to enroll
- Book CTA

---

#### 2026 Updates (`/club-medicare/2026-updates`)

**Content:**
- Annual Enrollment Period (AEP): Oct 15 – Dec 7 each year
- 2026 Part B premium changes
- Inflation Reduction Act impact on Medicare
- Part D out-of-pocket cap changes
- Enrollment period calendar (IEP, SEP, AEP, OEP)
- Migrate existing content from: `https://hansonfirst.com/how-inflation-reduction-act-affect-me/`

---

### CLUB HEALTH PAGES

**Color theme:** Sky blue (#378ADD)
**Key message on every page:** "Expert guidance at no charge — you pay your carrier, never us."
**Audience:** Adults under 65 AND adults 65+ who are not on Medicare (still working with employer coverage, on a spouse's employer plan, or have delayed Medicare enrollment for any reason)

---

#### Club Health Overview (`/club-health`)

**Sections:**
1. Hero — "Health coverage for real life." Who this is for — explicitly name under-65 AND 65+ not on Medicare.
2. Are you 65+ and not on Medicare? — Dedicated callout block. Explain: you can delay Medicare if you have qualifying employer coverage. Hanson can help you understand your options and find the right bridge coverage.
3. Plan types overview — ACA Marketplace, short-term, individual/family, self-employed
4. No broker fees explanation
5. Book CTA + Quote request CTA

---

#### ACA / Marketplace Plans (`/club-health/aca-marketplace`)

**Content:**
- What ACA Marketplace plans are
- Metal tiers: Bronze, Silver, Gold, Platinum
- Premium tax credit / subsidy estimator widget (interactive — user inputs income and household size, gets subsidy estimate)
- Open Enrollment Period dates
- Special Enrollment Period — qualifying life events
- Book CTA

---

#### Individual & Family Plans (`/club-health/individual-family`)

**Content:**
- Individual plans
- Family plans
- Self-employed / 1099 worker coverage options
- Short-term health insurance
- Dental and vision add-ons
- Critical illness plans
- Adults 65+ not yet on Medicare — bridge coverage options
- Book CTA

---

#### Club Health Quote Request (`/club-health/quote`)

**Features:**
- Quote request form (HIPAA notice required)
- Fields: Name, DOB, zip code, household size, income estimate (for subsidy calc), current coverage situation, best time to call
- Carrier comparison grid (general — not carrier-specific pricing, direct to conversation with Emily)
- "What happens next" explainer — Emily or a team member contacts within 1 business day

---

### CLUB LIFE PAGES

**Color theme:** Soft purple (#7F77DD)
**Key message on every page:** "Independent advice. No broker fees. Ever."

---

#### Club Life Overview (`/club-life`)

**Sections:**
1. Hero — "Protect what matters most." Who needs life insurance and why.
2. Independent broker advantage — not tied to one company, finds the best fit
3. Plan types at a glance — Term, Whole, Final Expense, Universal (4 cards)
4. Life insurance for seniors crossover block — link to Club Medicare for those near 65
5. No broker fees explanation
6. Book CTA

---

#### Term & Whole Life (`/club-life/term-whole`)

**Content:**
- Term life — how it works, who it's for, typical terms (10/20/30 year)
- Whole life — how it works, cash value, permanent coverage
- Universal life — flexible premiums, adjustable death benefit
- Coverage needs calculator (interactive — user inputs age, income, dependents, debts → suggests coverage range)
- Who each product is right for (comparison)
- Book CTA

---

#### Final Expense / Burial Plans (`/club-life/final-expense`)

**Content:**
- What final expense insurance covers
- Seniors focus — simplified enrollment, no medical exam options
- Typical coverage amounts ($5K–$25K)
- Peace of mind messaging — protect your family from unexpected costs
- Book CTA

---

#### Club Life Quote Request (`/club-life/quote`)

**Features:**
- Quote request form
- Fields: Name, DOB, health status (general), coverage amount interest, type of coverage interested in, best time to call
- Carrier comparison grid (general)
- Common questions and myth-busting section:
  - "Life insurance is too expensive" — myth bust
  - "I'm too old to get life insurance" — myth bust
  - "I have life insurance through work, I'm covered" — myth bust
- Book CTA

---

## INTERACTIVE TOOLS TO BUILD

### 1. Subsidy / Tax Credit Estimator (Club Health)
Simple calculator. Inputs: household size, estimated annual income. Output: estimated monthly subsidy, whether they likely qualify for Medicaid, and a CTA to book with Emily for exact figures. Note: display disclaimer that this is an estimate only.

### 2. Coverage Needs Calculator (Club Life)
Inputs: age, annual income, number of dependents, outstanding debts (mortgage, loans). Output: suggested coverage range (e.g., "$300K–$500K") with explanation. CTA to book.

### 3. Enrollment Period Calendar (Club Medicare)
Visual calendar or timeline showing:
- Initial Enrollment Period (7-month window around 65th birthday)
- Annual Enrollment Period (Oct 15 – Dec 7)
- Open Enrollment Period (Jan 1 – Mar 31)
- Special Enrollment Periods (triggered by qualifying events)

---

## GLOBAL COMPONENTS

### Header
- Logo (left)
- Nav links (center) — with club-colored pills for the three clubs
- "No broker fees. Ever." micro-badge
- Phone number (desktop)
- "Book Appointment" button (right, dark)
- Sticky on scroll

### Footer
- Logo + tagline
- Nav links in columns by club
- Contact: 512-817-6906 | Emily@HansonFirst.com
- Social: Facebook, LinkedIn, YouTube
- HIPAA badge
- Medicare carrier disclaimer (required)
- State license list or "Licensed in 26 states" badge
- Copyright

### Sticky Mobile CTA
- On mobile, a fixed bottom bar: [Phone icon] Call | [Calendar icon] Book
- Always visible

### Book Appointment CTA Block
Reusable section used at the bottom of every page:
- Heading: "Ready to find the right coverage?"
- Sub: "No pressure. No fees. Just honest guidance from a real agent."
- Two buttons: "Book Appointment" (Calendly) + "Call 512-817-6906"

---

## CONTENT MIGRATION CHECKLIST

Migrate these from the existing HansonFirst.com:

- [ ] All testimonials (`/testimonials/`)
- [ ] About Medicare content (`/about-medicare/`)
- [ ] 2026 Updates / Inflation Reduction Act post
- [ ] Forms (Update form, SOA)
- [ ] Events (any upcoming)
- [ ] Newsletter signup form/widget
- [ ] SunFire plan comparison tool link
- [ ] Medicare carrier disclaimer text
- [ ] Emily's headshot and bio
- [ ] Social media links (Facebook, LinkedIn, YouTube)
- [ ] Phone and email

---

## COMPLIANCE REQUIREMENTS

### Medicare Carrier Disclaimer (required on all Club Medicare pages)
> "We do not offer every plan available in your area. Currently we represent 13 organizations which offer 92 plans in your area. Please contact Medicare.gov, 1-800-MEDICARE, or your local State Health Insurance Program (SHIP) to get information on all of your options. We also offer many top-rated Medicare Supplement organizations."

### HIPAA
- Display HIPAA compliance notice on all forms collecting health-related information
- No unsecured transmission of PHI
- Consent checkbox on quote request forms

### ADA Accessibility
- All images must have alt text
- Sufficient color contrast (WCAG AA minimum)
- Keyboard navigable
- Click-to-call links on all phone numbers

---

## MESSAGING RULES — FOLLOW ON EVERY PAGE

| Context | Correct phrasing |
|---|---|
| Club Medicare pages | "Our service is always free to you" |
| Club Health pages | "Expert guidance at no charge — you pay your carrier, never us" |
| Club Life pages | "Independent advice. No broker fees. Ever." |
| Sitewide / header | "No broker fees. Ever." |
| Never say sitewide | "Our service is free" or "Always free to you" — this is only true for Medicare |

---

## WHAT EMILY NEEDS TO PROVIDE

Before build can be completed, collect from Emily:

- [ ] Headshots — Emily + all agents (Tia, Katie, Katherine, others)
- [ ] Agency logo (high-res, SVG preferred)
- [ ] Any existing brand colors or fonts she wants to keep
- [ ] Agent bios (2–3 sentences each)
- [ ] Calendly account link / embed code
- [ ] SunFire Matrix link (already on site: `https://www.sunfirematrix.com/app/consumer/tbr/18816155/`)
- [ ] GoHighLevel or Mailchimp account for newsletter
- [ ] Confirmation of office address for map embed
- [ ] Any additional carrier logos she has rights to display
- [ ] Approval of homepage hero copy before build begins

---

## BUILD ORDER (suggested for Claude Code)

1. Set up WordPress + Elementor Pro + child theme
2. Implement design system: CSS variables, typography, color tokens
3. Build global components: header, footer, sticky mobile CTA, Book Appointment block
4. Build Home page (establishes the full design pattern)
5. Build Club Medicare section (existing content — lowest risk, fastest win)
6. Build Club Health section
7. Build Club Life section
8. Build sitewide pages: About, Testimonials, Events, Book, Forms, Contact
9. Build interactive tools: Subsidy estimator, Coverage calculator, Enrollment calendar
10. Content migration from HansonFirst.com
11. HIPAA compliance review on all forms
12. ADA accessibility audit
13. Mobile QA pass
14. DNS/launch

---

## CONTACT

**Agency:** Hanson Insurance Agency
**Owner:** Emily Hanson
**Phone:** 512-817-6906
**Email:** Emily@HansonFirst.com
**Website:** HansonFirst.com
**Location:** Liberty Hill, TX

**Built by:** Mark Garza, Laimen AI
**Email:** mark@laimenai.com
