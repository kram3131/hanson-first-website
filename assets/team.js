/* ============================================================
   HANSON INSURANCE — TEAM
   ============================================================
   The Team page is managed in the same Google Sheet as events
   and webinars, on a tab named "Team". Nobody needs to touch
   website code to add, edit, or remove an advisor.

   ── THE SHEET ───────────────────────────────────────────────
   https://docs.google.com/spreadsheets/d/1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI/edit
   Use the tab named "Team".

   • Add an advisor    → add a new row
   • Edit an advisor   → change the row
   • Remove an advisor → delete the row
   • Order on the website matches the row order in the sheet.
   Changes appear on the website within about a minute.

   If the "Team" tab is empty or missing, the page shows a
   friendly "team being set up" message — it never shows broken.

   ── "Team" TAB COLUMNS (row 1 must be these headers) ────────
     First Name      e.g. Tia
     Last Name       e.g. Pruett
     Role            e.g. Licensed Insurance Advisor, Principal Advisor
     Clubs           Comma- or slash-separated: Medicare, Health, Life
                     (or "All" for all three)
     Photo File      Filename of the headshot in /agents/ (e.g. tia-pruett.jpg)
                     Leave blank to use a colored-initial avatar instead.
     Booking Link    Optional URL for the advisor's Calendly / booking page
     Notes           Optional short blurb shown on the card
   ============================================================ */

var TEAM_SHEET_ID = "1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI";
var TEAM_TAB = "Team";


/* ============================================================
   No need to edit anything below this line.
   ============================================================ */
(function () {

  function clubsOf(value) {
    var v = String(value || "").toLowerCase().trim();
    if (!v) return [];
    if (v === "all") return ["medicare", "health", "life"];
    return v.split(/[,/]/).map(function (s) { return s.trim(); }).filter(function (s) {
      return s === "medicare" || s === "health" || s === "life";
    });
  }

  function initialsOf(first, last) {
    var f = String(first || "").trim().charAt(0).toUpperCase();
    var l = String(last || "").trim().charAt(0).toUpperCase();
    return f + l;
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function cardHtml(agent) {
    var clubBadges = agent.clubs.map(function (c) {
      var label = c.charAt(0).toUpperCase() + c.slice(1);
      return '<span class="badge badge-' + c + '" style="font-size:.7rem;padding:3px 9px;">' + label + '</span>';
    }).join(' ');

    // The initial-avatar is always rendered. If a photo file is named, an <img>
    // is laid over it; on a 404 the <img> removes itself and the initials show.
    var photoOverlay = agent.photo
      ? '<img src="agents/' + esc(agent.photo) + '" alt="' + esc(agent.first + ' ' + agent.last) + '" loading="lazy" ' +
        'style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" onerror="this.remove();">'
      : '';

    var bookingBtn = agent.booking
      ? '<a href="' + esc(agent.booking) + '" target="_blank" rel="noopener" class="btn btn-outline btn-sm" style="margin-top:14px;width:100%;">Book a time →</a>'
      : '';

    var notes = agent.notes
      ? '<p class="agent-bio" style="font-size:.85rem;color:var(--color-ink-mid);margin-top:8px;">' + esc(agent.notes) + '</p>'
      : '';

    return '' +
      '<div class="agent-card" data-clubs="' + agent.clubs.join(' ') + '">' +
        '<div class="agent-photo" style="position:relative;background:linear-gradient(135deg,var(--medicare-primary),var(--health-primary));display:flex;align-items:center;justify-content:center;color:white;font-size:2.4rem;font-weight:700;aspect-ratio:1/1;overflow:hidden;">' +
          esc(agent.initials) +
          photoOverlay +
        '</div>' +
        '<div class="agent-info">' +
          '<div class="agent-name">' + esc(agent.first + ' ' + agent.last) + '</div>' +
          '<div class="agent-title">' + esc(agent.role) + '</div>' +
          notes +
          '<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:6px;">' + clubBadges + '</div>' +
          bookingBtn +
        '</div>' +
      '</div>';
  }

  function setupFilters() {
    var bar = document.getElementById('team-filters');
    if (!bar) return;
    bar.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-filter]');
      if (!btn) return;
      bar.querySelectorAll('button').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var f = btn.dataset.filter;
      document.querySelectorAll('#team-grid .agent-card').forEach(function (card) {
        var clubs = (card.dataset.clubs || '').split(' ');
        card.style.display = (f === 'all' || clubs.indexOf(f) > -1) ? '' : 'none';
      });
    });
  }

  function showMessage(grid, text) {
    grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--color-ink-light);padding:32px;">' + text + '</p>';
  }

  function renderTeam() {
    var grid = document.getElementById('team-grid');
    if (!grid) return;

    var url = "https://docs.google.com/spreadsheets/d/" + TEAM_SHEET_ID +
              "/gviz/tq?tqx=out:json&headers=1&sheet=" +
              encodeURIComponent(TEAM_TAB) + "&_=" + Date.now();

    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var json = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
        if (!json.table) {
          showMessage(grid, "The team is being set up. Check back soon.");
          return;
        }
        var cols = json.table.cols || [];
        var rows = json.table.rows || [];

        var idx = {};
        cols.forEach(function (c, i) {
          idx[String(c.label || "").trim().toLowerCase()] = i;
        });
        function cell(row, name) {
          var i = idx[name];
          if (i == null || !row.c || !row.c[i] || row.c[i].v == null) return "";
          return row.c[i].v;
        }

        var agents = rows.map(function (row) {
          var first = String(cell(row, "first name") || "").trim();
          var last = String(cell(row, "last name") || "").trim();
          return {
            first: first,
            last: last,
            role: String(cell(row, "role") || "Licensed Insurance Advisor").trim(),
            clubs: clubsOf(cell(row, "clubs")),
            photo: String(cell(row, "photo file") || "").trim(),
            booking: String(cell(row, "booking link") || "").trim(),
            notes: String(cell(row, "notes") || "").trim(),
            initials: initialsOf(first, last)
          };
        })
        .filter(function (a) { return a.first || a.last; });

        if (agents.length === 0) {
          showMessage(grid, "No team members listed yet.");
          return;
        }

        grid.innerHTML = agents.map(cardHtml).join('');
        setupFilters();
      })
      .catch(function () {
        showMessage(grid, "The team is being set up. Check back soon.");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderTeam);
  } else {
    renderTeam();
  }
})();
