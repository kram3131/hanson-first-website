/* ============================================================
   HANSON INSURANCE — EVENTS
   ============================================================
   Events on the website are managed entirely in a Google Sheet.
   Nobody needs to touch this file or any website code to post,
   edit, or remove an event.

   ── THE EVENTS SHEET ────────────────────────────────────────
   https://docs.google.com/spreadsheets/d/1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI/edit
   Use the tab named "Events".

   • Add an event    → add a new row
   • Change an event → edit the row
   • Remove an event → delete the row (or just leave it — past
                       events drop off the website by themselves)
   Changes appear on the website within about a minute.

   ── SHEET COLUMNS (row 1 must be these headers) ─────────────
     Date           e.g. 2026-06-10   (controls automatic fall-off)
     Time           e.g. 1:00 PM – 3:00 PM
     Area           Medicare, Health, or Life   (sets the color)
     Format         In Person or Webinar        (sets the icon)
     Title          the event name
     Description    one short paragraph
     Venue          place name, or "Zoom Webinar"
     Register Link  where the button goes (e.g. book.html)
   ============================================================ */

var SHEET_ID = "1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI";
var EVENTS_TAB = "Events";


/* ============================================================
   No need to edit anything below this line.
   ============================================================ */
(function () {
  var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  // Accepts the Google date format Date(2026,5,10), ISO 2026-06-10,
  // or US 6/10/2026 — returns a Date at local midnight, or null.
  function parseDate(val) {
    if (val == null || val === "") return null;
    var s = String(val).trim();
    var m = s.match(/^Date\((\d+),(\d+),(\d+)/);          // gviz: month 0-indexed
    if (m) return new Date(+m[1], +m[2], +m[3]);
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);           // ISO
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);         // US
    if (m) return new Date(+m[3], +m[1] - 1, +m[2]);
    var d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function accentOf(area) {
    var a = String(area || "").toLowerCase();
    if (a.indexOf("health") > -1) return "health";
    if (a.indexOf("life") > -1) return "life";
    return "medicare";
  }

  function iconOf(format) {
    var f = String(format || "").toLowerCase();
    if (f.indexOf("webinar") > -1 || f.indexOf("online") > -1 ||
        f.indexOf("zoom") > -1 || f.indexOf("virtual") > -1) return "💻";
    return "📍";
  }

  // Escape sheet text so a stray < or & can never break the page.
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function showEmpty(container) {
    container.innerHTML =
      '<div class="card" style="text-align:center;padding:40px 32px;">' +
        '<div style="font-size:2rem;margin-bottom:8px;">📅</div>' +
        '<h4>No upcoming events right now</h4>' +
        '<p style="margin-top:8px;font-size:.9rem;color:var(--color-ink-mid);">' +
          'New workshops and webinars are added regularly. Check back soon, or ' +
          '<a href="contact.html" style="color:var(--medicare-primary);font-weight:600;">contact us</a> ' +
          'to schedule a one-on-one with Emily.</p>' +
      '</div>';
  }

  function render(container, events) {
    container.innerHTML = events.map(function (e) {
      var d = e.dateObj;
      return '' +
        '<div class="event-card">' +
          '<div class="event-date-col" style="background:var(--' + e.accent + '-light);color:var(--' + e.accent + '-dark);">' +
            '<div class="event-month">' + MONTHS[d.getMonth()] + '</div>' +
            '<div class="event-day">' + d.getDate() + '</div>' +
          '</div>' +
          '<div class="event-body">' +
            '<div class="event-type">' + esc(e.area) + ' · ' + esc(e.format) + '</div>' +
            '<h4 style="color:var(--' + e.accent + '-dark);">' + esc(e.title) + '</h4>' +
            '<p style="margin-top:8px;font-size:.875rem;color:var(--color-ink-mid);">' + esc(e.description) + '</p>' +
            '<div style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">' +
              '<span style="font-size:.8rem;color:var(--color-ink-light);">' + e.icon + ' ' + esc(e.venue) + ' · ' + esc(e.time) + '</span>' +
              '<a href="' + esc(e.link) + '" class="btn btn-' + e.accent + ' btn-sm">Register →</a>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join("");
  }

  function renderEvents() {
    var container = document.getElementById("events-list");
    if (!container) return;

    container.innerHTML =
      '<p style="color:var(--color-ink-light);font-size:.9rem;">Loading events…</p>';

    // Cache-buster keeps the page in sync with recent sheet edits.
    var url = "https://docs.google.com/spreadsheets/d/" + SHEET_ID +
              "/gviz/tq?tqx=out:json&headers=1&sheet=" +
              encodeURIComponent(EVENTS_TAB) + "&_=" + Date.now();

    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (text) {
        // gviz wraps the JSON in /*O_o*/ google...setResponse({ ... });
        var json = JSON.parse(
          text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
        var cols = (json.table && json.table.cols) || [];
        var rows = (json.table && json.table.rows) || [];

        // Map header label -> column index (so column order can change).
        var idx = {};
        cols.forEach(function (c, i) {
          idx[String(c.label || "").trim().toLowerCase()] = i;
        });
        function cell(row, name) {
          var i = idx[name];
          if (i == null || !row.c || !row.c[i] || row.c[i].v == null) return "";
          return row.c[i].v;
        }

        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var events = rows.map(function (row) {
          var area = cell(row, "area");
          return {
            dateObj: parseDate(cell(row, "date")),
            time: cell(row, "time"),
            area: area,
            format: cell(row, "format"),
            title: cell(row, "title"),
            description: cell(row, "description"),
            venue: cell(row, "venue"),
            link: String(cell(row, "register link") || "").trim() || "book.html",
            accent: accentOf(area),
            icon: iconOf(cell(row, "format"))
          };
        })
        .filter(function (e) {
          return e.dateObj && e.title && e.dateObj >= today;
        })
        .sort(function (a, b) { return a.dateObj - b.dateObj; });

        if (events.length === 0) { showEmpty(container); return; }
        render(container, events);
      })
      .catch(function () {
        // Sheet unreachable — fail gracefully, never show a broken page.
        showEmpty(container);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderEvents);
  } else {
    renderEvents();
  }
})();
