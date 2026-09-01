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
          <p class="footer-tagline">Real people. Real coverage. Your whole life.<br>Independent broker serving clients in <span class="js-state-count">37</span> states from Liberty Hill, TX.</p>
          <div class="footer-contact">
            <a href="tel:5128176906">📞 512-817-6906</a>
            <a class="js-email" data-user="Emily" data-domain="HansonFirst.com" href="#">✉️ <span class="js-email-text">Emily [at] HansonFirst.com</span></a>
            <a href="https://maps.google.com/?q=13985+TX-29,+Liberty+Hill,+TX+78642" target="_blank" rel="noopener">📍 13985 TX-29, Liberty Hill, TX 78642</a>
            <a href="${root}book.html">📅 Book an Appointment</a>
          </div>
          <div class="footer-social">
            <a href="https://www.facebook.com/yourmedicarespecialisttexas" target="_blank" rel="noopener" class="social-icon" aria-label="Facebook">f</a>
            <a href="https://www.linkedin.com/in/emilyhansoninsurance/" target="_blank" rel="noopener" class="social-icon" aria-label="LinkedIn">in</a>
            <a href="https://www.instagram.com/hanson.insurance/" target="_blank" rel="noopener" class="social-icon" aria-label="Instagram">ig</a>
            <a href="https://www.youtube.com/@hansoninsuranceagency9070/featured" target="_blank" rel="noopener" class="social-icon" aria-label="YouTube">▶</a>
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
            <a href="https://docs.google.com/forms/d/e/1FAIpQLSfj7fO_VLcRAWZxU6d4j6IJJOUkSe1p7HojB9edztHuZ2Yg_A/viewform" target="_blank" rel="noopener">Get a Quote</a>
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
          &copy; ${new Date().getFullYear()} Hanson Insurance, LLC. All rights reserved. Liberty Hill, TX.
        </div>
        <div class="footer-badges">
          <span class="footer-badge">HIPAA Compliant</span>
          <span class="footer-badge">Licensed in <span class="js-state-count">37</span> States</span>
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

/* ── Live stats (agent count + licensed states) ──────────── */
/* The "X licensed advisors" and "licensed in X states" copy    */
/* around the site is pulled live from the same Google Sheet    */
/* that manages the Team page and the new "States" tab, so the  */
/* numbers always agree with the actual lists. The hardcoded    */
/* numbers in the HTML act as fallbacks: if the Sheet can't be  */
/* reached, the page just keeps showing them.                   */
/*                                                              */
/* To use in page copy:                                         */
/*   <span class="js-agent-count">24</span> licensed advisors   */
/*   licensed in <span class="js-state-count">37</span> states  */
/* To render the full state pill grid from the sheet, give the  */
/* grid container id="states-grid" (about.html does this).      */
const STATS_SHEET_ID = '1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI';

function fetchSheetRows(tabName) {
  const url = 'https://docs.google.com/spreadsheets/d/' + STATS_SHEET_ID +
              '/gviz/tq?tqx=out:json&headers=1&sheet=' +
              encodeURIComponent(tabName) + '&_=' + Date.now();
  return fetch(url)
    .then(r => r.text())
    .then(text => {
      const json = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
      return (json.table && json.table.rows) || [];
    });
}

function initLiveStats() {
  const agentEls = document.querySelectorAll('.js-agent-count');
  const stateEls = document.querySelectorAll('.js-state-count');
  const statesGrid = document.getElementById('states-grid');

  if (agentEls.length > 0) {
    fetchSheetRows('Team').then(rows => {
      // Same rule as the team page grid: a row counts if it has a
      // first or last name (columns A/B of the Team tab).
      const count = rows.filter(row => {
        const first = (row.c && row.c[0] && row.c[0].v != null) ? String(row.c[0].v).trim() : '';
        const last  = (row.c && row.c[1] && row.c[1].v != null) ? String(row.c[1].v).trim() : '';
        return first !== '' || last !== '';
      }).length;
      if (count > 0) agentEls.forEach(el => { el.textContent = count; });
    }).catch(() => {}); // fallback: hardcoded number stays
  }

  if (stateEls.length > 0 || statesGrid) {
    fetchSheetRows('States').then(rows => {
      const states = rows
        .map(row => (row.c && row.c[0] && row.c[0].v != null) ? String(row.c[0].v).trim() : '')
        .filter(s => s !== '');
      if (states.length === 0) return;
      stateEls.forEach(el => { el.textContent = states.length; });
      if (statesGrid) {
        statesGrid.innerHTML = states
          .sort((a, b) => a.localeCompare(b))
          .map(s => '<div class="state-pill">' +
            s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</div>')
          .join('');
      }
    }).catch(() => {}); // fallback: hardcoded pills/numbers stay
  }
}

/* ── Init all ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  renderFooter();
  renderMobileSticky();
  revealEmails();
  initAccordions();
  initTestimonialFilter();
  initLiveStats();
});
