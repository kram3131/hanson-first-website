/* ============================================================
   HANSON INSURANCE — TESTIMONIALS
   ============================================================
   Reviews are managed in the Google Sheet on a tab named
   "Testimonials". No code changes needed to add or edit reviews.

   ── THE SHEET ───────────────────────────────────────────────
   https://docs.google.com/spreadsheets/d/1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI/edit
   Use the tab named "Testimonials".

   • Add a review  → add a new row
   • Edit a review → change the row
   • Remove        → delete the row
   • Order on site matches row order in the sheet.

   ── "Testimonials" TAB COLUMNS (row 1 = headers) ────────────
     Name       e.g. Sandra L.
     Location   e.g. Georgetown, TX
     Club       medicare | health | life  (leave blank for "general")
     Quote      The review text (no quotes needed — they're added automatically)
     Stars      1–5  (leave blank to default to 5)
   ============================================================ */

var TESTIMONIALS_SHEET_ID = "1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI";
var TESTIMONIALS_TAB = "Testimonials";

/* ============================================================
   No need to edit anything below this line.
   ============================================================ */
(function () {

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function starsHtml(n) {
    var count = Math.min(5, Math.max(1, parseInt(n) || 5));
    return "★".repeat(count) + "☆".repeat(5 - count);
  }

  function avatarLetter(name) {
    return String(name || "?").trim().charAt(0).toUpperCase();
  }

  function clubLabel(club) {
    var map = { medicare: "Club Medicare", health: "Club Health", life: "Club Life" };
    return map[club] || "";
  }

  function cardHtml(r) {
    var badgeHtml = r.club
      ? '<div class="badge badge-' + r.club + '" style="margin-bottom:12px;">' + esc(clubLabel(r.club)) + '</div>'
      : '';

    return '' +
      '<div class="testimonial-card" data-club="' + esc(r.club) + '">' +
        '<div class="stars">' + starsHtml(r.stars) + '</div>' +
        badgeHtml +
        '<p class="testimonial-text">“' + esc(r.quote) + '”</p>' +
        '<div class="testimonial-author">' +
          '<div class="testimonial-avatar">' + esc(avatarLetter(r.name)) + '</div>' +
          '<div>' +
            '<div class="testimonial-name">' + esc(r.name) + '</div>' +
            '<div class="testimonial-location">' + esc(r.location) + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderTestimonials() {
    var grid = document.getElementById('testimonials-grid');
    if (!grid) return;

    var url = "https://docs.google.com/spreadsheets/d/" + TESTIMONIALS_SHEET_ID +
              "/gviz/tq?tqx=out:json&headers=1&sheet=" +
              encodeURIComponent(TESTIMONIALS_TAB) + "&_=" + Date.now();

    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var json = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
        if (!json.table || !json.table.rows) {
          grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--color-ink-light);padding:32px;">No reviews yet. Check back soon!</p>';
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
          return String(row.c[i].v).trim();
        }

        var reviews = rows.map(function (row) {
          return {
            name:     cell(row, "name"),
            location: cell(row, "location"),
            club:     cell(row, "club").toLowerCase(),
            quote:    cell(row, "quote"),
            stars:    cell(row, "stars")
          };
        }).filter(function (r) { return r.name && r.quote; });

        if (reviews.length === 0) {
          grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--color-ink-light);padding:32px;">No reviews yet. Check back soon!</p>';
          return;
        }

        grid.innerHTML = reviews.map(cardHtml).join('');
      })
      .catch(function () {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--color-ink-light);padding:32px;">Reviews are loading. Check back soon!</p>';
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderTestimonials);
  } else {
    renderTestimonials();
  }

})();
