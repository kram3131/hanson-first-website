/* ============================================================
   HANSON INSURANCE — SHARED COMPONENTS JS
   Header, Footer, Mobile nav, Interactive tools
   ============================================================ */

// Determine asset root based on current page depth
const isSubpage = window.location.pathname.split('/').filter(Boolean).length >= 2;
const root = isSubpage ? '../' : './';

/* ── Header ─────────────────────────────────────────────── */
function renderHeader() {
  const header = document.getElementById('site-header');
  if (!header) return;
  header.innerHTML = `
    <div class="container">
      <div class="header-inner">
        <a href="${root}index.html" class="header-logo">
          <img src="${root}logos/NewHansonLogo.png" alt="Hanson Insurance Agency" />
        </a>
        <nav class="header-nav" aria-label="Main navigation">
          <a href="${root}index.html">Home</a>
          <a href="${root}about.html">About</a>
          <a href="${root}team.html">Team</a>
          <a href="${root}club-medicare/index.html" class="nav-pill-medicare">Club Medicare</a>
          <a href="${root}club-health/index.html"   class="nav-pill-health">Club Health</a>
          <a href="${root}club-life/index.html"     class="nav-pill-life">Club Life</a>
          <a href="${root}testimonials.html">Testimonials</a>
          <a href="${root}events.html">Events</a>
          <a href="${root}join-us.html">Join Us</a>
        </nav>
        <div class="header-right">
          <span class="no-fee-badge">No broker fees.</span>
          <a href="tel:5128176906" class="header-phone">📞 512-817-6906</a>
          <a href="${root}contact.html" class="btn btn-outline btn-sm">Contact Us</a>
          <a href="${root}book.html" class="btn btn-dark btn-sm">Book Appointment</a>
          <button class="hamburger" id="hamburger-btn" aria-label="Open menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </div>
    <nav class="mobile-nav" id="mobile-nav">
      <a href="${root}index.html">Home</a>
      <a href="${root}about.html">About</a>
      <a href="${root}team.html">Team</a>
      <a href="${root}club-medicare/index.html" style="color:var(--medicare-dark);font-weight:600;"><img src="${root}logos/clubmedicare.png" alt="" style="height:20px;width:20px;border-radius:50%;vertical-align:middle;margin-right:6px;">Club Medicare</a>
      <a href="${root}club-health/index.html"   style="color:var(--health-dark);font-weight:600;"><img src="${root}logos/Logo Club HEALTH.png" alt="" style="height:20px;width:20px;border-radius:50%;vertical-align:middle;margin-right:6px;">Club Health</a>
      <a href="${root}club-life/index.html"     style="color:var(--life-dark);font-weight:600;"><img src="${root}logos/clublife.png" alt="" style="height:20px;width:20px;border-radius:50%;vertical-align:middle;margin-right:6px;">Club Life</a>
      <a href="${root}testimonials.html">Testimonials</a>
      <a href="${root}events.html">Events</a>
      <a href="${root}join-us.html">Join Us</a>
      <a href="${root}forms.html">Forms</a>
      <a href="${root}contact.html">Contact</a>
      <a href="${root}book.html" class="btn btn-dark" style="margin-top:8px;">Book Appointment</a>
      <a href="tel:5128176906" style="text-align:center;font-weight:600;">📞 512-817-6906</a>
    </nav>
  `;
  document.getElementById('hamburger-btn').addEventListener('click', () => {
    document.getElementById('mobile-nav').classList.toggle('open');
  });
}

/* ── Footer ─────────────────────────────────────────────── */
function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;
  footer.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <!-- Brand col -->
        <div>
          <div class="footer-logo">
            <img src="${root}logos/NewHansonLogo.png" alt="Hanson Insurance Agency" />
          </div>
          <p class="footer-tagline">Real people. Real coverage. Your whole life.<br>Independent broker serving clients in 37 states from Liberty Hill, TX.</p>
          <div class="footer-contact">
            <a href="tel:5128176906">📞 512-817-6906</a>
            <a class="js-email" data-user="Emily" data-domain="HansonFirst.com" href="#">✉️ <span class="js-email-text">Emily [at] HansonFirst.com</span></a>
            <a href="https://maps.google.com/?q=13985+TX-29,+Liberty+Hill,+TX+78642" target="_blank" rel="noopener">📍 13985 TX-29, Liberty Hill, TX 78642</a>
            <a href="${root}book.html">📅 Book an Appointment</a>
          </div>
          <div class="footer-social">
            <a href="#" class="social-icon" aria-label="Facebook">f</a>
            <a href="#" class="social-icon" aria-label="LinkedIn">in</a>
            <a href="#" class="social-icon" aria-label="YouTube">▶</a>
          </div>
        </div>
        <!-- Club Medicare -->
        <div>
          <div class="footer-col-title">Club Medicare</div>
          <div class="footer-links">
            <a href="${root}club-medicare/index.html">Medicare Overview</a>
            <a href="${root}club-medicare/advantage.html">Medicare Advantage</a>
            <a href="${root}club-medicare/supplement.html">Medicare Supplement</a>
            <a href="${root}club-medicare/part-d.html">Part D Drug Plans</a>
            <a href="${root}club-medicare/special-needs.html">Special Needs Plans</a>
            <a href="${root}club-medicare/2026-updates.html">2026 Updates</a>
          </div>
        </div>
        <!-- Club Health -->
        <div>
          <div class="footer-col-title">Club Health</div>
          <div class="footer-links">
            <a href="${root}club-health/index.html">Health Overview</a>
            <a href="${root}club-health/aca-marketplace.html">ACA Marketplace</a>
            <a href="${root}club-health/individual-family.html">Individual &amp; Family</a>
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfj7fO_VLcRAWZxU6d4j6IJJOUkSe1p7HojB9edztHuZ2Yg_A/viewform" target="_blank">Get a Quote</a>
          </div>
          <div class="footer-col-title" style="margin-top:24px;">Club Life</div>
          <div class="footer-links">
            <a href="${root}club-life/index.html">Life Overview</a>
            <a href="${root}club-life/term-whole.html">Term &amp; Whole Life</a>
            <a href="${root}club-life/final-expense.html">Final Expense</a>
            <a href="${root}club-life/quote.html">Get a Quote</a>
          </div>
        </div>
        <!-- Company -->
        <div>
          <div class="footer-col-title">Company</div>
          <div class="footer-links">
            <a href="${root}about.html">About Emily</a>
            <a href="${root}team.html">Meet the Team</a>
            <a href="${root}testimonials.html">Testimonials</a>
            <a href="${root}events.html">Events &amp; Webinars</a>
            <a href="${root}join-us.html">Join the Team</a>
            <a href="${root}forms.html">Forms Hub</a>
            <a href="${root}contact.html">Contact</a>
            <a href="${root}book.html">Book Appointment</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <div class="footer-copyright">
          &copy; ${new Date().getFullYear()} Hanson Insurance Agency. All rights reserved. Liberty Hill, TX.
        </div>
        <div class="footer-badges">
          <span class="footer-badge">HIPAA Compliant</span>
          <span class="footer-badge">Licensed in 37 States</span>
          <span class="footer-badge">No Broker Fees.</span>
        </div>
      </div>
      <div class="footer-disclaimer">
        We do not offer every plan available in your area. Currently we represent 13 organizations which offer 92 plans in your area. Please contact Medicare.gov, 1-800-MEDICARE, or your local State Health Insurance Program (SHIP) to get information on all of your options. We also offer many top-rated Medicare Supplement organizations. This website is not affiliated with or endorsed by the U.S. government or the federal Medicare program.
      </div>
    </div>
  `;
}

/* ── Mobile sticky CTA ───────────────────────────────────── */
function renderMobileSticky() {
  const el = document.getElementById('mobile-sticky');
  if (!el) return;
  el.innerHTML = `
    <div class="mobile-sticky-inner">
      <a href="tel:5128176906" class="mobile-sticky-btn mobile-sticky-call">📞 Call Us</a>
      <a href="${root}book.html" class="mobile-sticky-btn mobile-sticky-book">📅 Book</a>
    </div>
  `;
}

/* ── Accordion ───────────────────────────────────────────── */
function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
}

/* ── Testimonial filter ──────────────────────────────────── */
function initTestimonialFilter() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('active','active-medicare','active-health','active-life');
      });
      btn.classList.add('active' + (filter !== 'all' ? '-' + filter : ''));
      if (filter === 'all') btn.classList.add('active');

      document.querySelectorAll('[data-club]').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.club === filter) ? '' : 'none';
      });
    });
  });
}

/* ── Subsidy Calculator (Club Health) ───────────────────── */
function initSubsidyCalc() {
  const form = document.getElementById('subsidy-calc');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const income  = parseFloat(document.getElementById('calc-income').value) || 0;
    const hh      = parseInt(document.getElementById('calc-household').value)  || 1;
    const result  = document.getElementById('subsidy-result');

    // 2026 FPL approximate thresholds (simplified illustrative calc)
    const fpl2026 = [0, 15060, 20440, 25820, 31200, 36580, 41960, 47340, 52720];
    const fplBase = fpl2026[Math.min(hh, 8)];
    const pctFpl  = (income / fplBase) * 100;

    let msg, monthly, eligible;
    if (pctFpl < 138) {
      monthly = 0; eligible = 'Medicaid';
      msg = `Based on your income, you may qualify for <strong>Medicaid</strong> — which could provide free or very low-cost health coverage. Emily can help you understand your options.`;
    } else if (pctFpl <= 400) {
      const subsidy = Math.max(0, Math.round((income * 0.085 - income * 0.02) / 12 * -1 + 800));
      monthly = Math.min(subsidy, 700);
      eligible = 'ACA subsidy';
      msg = `You may qualify for a <strong>Premium Tax Credit of approximately $${monthly}/month</strong>. This is an estimate only — actual amounts depend on the plans available in your area and other factors.`;
    } else {
      monthly = 0; eligible = 'No subsidy';
      msg = `Based on your income, you may not qualify for an ACA subsidy, but you can still purchase Marketplace or individual plans. Emily can help find affordable options.`;
    }

    result.classList.add('visible');
    result.innerHTML = `
      <div class="tool-result-label">Estimated Monthly Subsidy</div>
      <div class="tool-result-main">${monthly > 0 ? '$' + monthly + '/mo' : eligible}</div>
      <p style="margin-top:12px;font-size:.95rem;color:var(--color-ink-mid);">${msg}</p>
      <a href="${root}book.html" class="btn btn-health" style="margin-top:16px;">Book a Free Consultation →</a>
      <div class="tool-disclaimer">This is an estimate for informational purposes only. Actual subsidy amounts depend on your state, plan selection, and household details. Contact Emily for an accurate quote.</div>
    `;
  });
}

/* ── Coverage Needs Calculator (Club Life) ──────────────── */
function initCoverageCalc() {
  const form = document.getElementById('coverage-calc');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const age      = parseInt(document.getElementById('calc-age').value)      || 35;
    const income   = parseFloat(document.getElementById('calc-income-life').value) || 0;
    const deps     = parseInt(document.getElementById('calc-deps').value)     || 0;
    const debts    = parseFloat(document.getElementById('calc-debts').value)  || 0;
    const result   = document.getElementById('coverage-result');

    // Simple DIME-inspired estimate
    const incomeMultiplier = age < 40 ? 12 : age < 55 ? 10 : 7;
    const base    = income * incomeMultiplier;
    const depAdj  = deps * 50000;
    const low     = Math.round((base + depAdj + debts) / 50000) * 50000;
    const high    = Math.round(low * 1.4 / 50000) * 50000;

    result.classList.add('visible');
    result.innerHTML = `
      <div class="tool-result-label">Suggested Coverage Range</div>
      <div class="tool-result-main">$${(low/1000).toFixed(0)}K – $${(high/1000).toFixed(0)}K</div>
      <p style="margin-top:12px;font-size:.95rem;color:var(--color-ink-mid);">
        Based on your age, income, ${deps} dependent${deps !== 1 ? 's' : ''}, and $${debts.toLocaleString()} in debts,
        a coverage range of <strong>$${(low/1000).toFixed(0)}K–$${(high/1000).toFixed(0)}K</strong> is a common starting point.
        Emily can help you find the right policy at a price that fits your budget.
      </p>
      <a href="${root}book.html" class="btn btn-life" style="margin-top:16px;">Talk to Emily for Free →</a>
      <div class="tool-disclaimer">This estimate is for illustrative purposes only and should not be considered financial or insurance advice. Actual coverage needs vary based on individual circumstances.</div>
    `;
  });
}

/* ── Email reveal (anti-harvest) ─────────────────────────── */
/* Email addresses are kept out of the page source — split across */
/* data-* attributes with no "@" and no mailto: link. This        */
/* assembles a working link for real visitors at load time, so    */
/* scraper bots reading the raw HTML never see a usable address.   */
function revealEmails() {
  document.querySelectorAll('.js-email').forEach(function (el) {
    var addr = el.dataset.user + '@' + el.dataset.domain;
    el.setAttribute('href', 'mailto:' + addr);
    var label = el.querySelector('.js-email-text');
    if (label) label.textContent = addr;
  });
}

/* ── Init all ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  renderMobileSticky();
  revealEmails();
  initAccordions();
  initTestimonialFilter();
  initSubsidyCalc();
  initCoverageCalc();
});
