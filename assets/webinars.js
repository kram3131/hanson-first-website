/* ============================================================
   HANSON INSURANCE — WEBINAR REPLAYS
   ============================================================
   The "Webinar Replays" section is managed in the same Google
   Sheet as events — on a separate tab named "Webinars". Nobody
   needs to touch website code to feature or remove a replay.

   ── THE SHEET ───────────────────────────────────────────────
   https://docs.google.com/spreadsheets/d/1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI/edit
   Use the tab named "Webinars".

   • Feature a replay → add a row
   • Remove a replay  → delete the row
   • The order on the website matches the row order in the sheet.
   Changes appear on the website within about a minute.

   If the "Webinars" tab is empty or missing, the whole Webinar
   Replays section simply hides itself — it never shows broken.

   ── "Webinars" TAB COLUMNS (row 1 must be these headers) ────
     YouTube Link   full link to the video
     Title          the card title
     Area           Medicare, Health, or Life  (sets the badge color)
     Recorded       optional — e.g. "August 2025" or "August 2025 · 45 min"
     Description    one short sentence about the replay
   ============================================================ */

var WEBINARS_SHEET_ID = "1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI";
var WEBINARS_TAB = "Webinars";


/* ============================================================
   No need to edit anything below this line.
   ============================================================ */
(function () {

  function accentOf(area) {
    var a = String(area || "").toLowerCase();
    if (a.indexOf("health") > -1) return "health";
    if (a.indexOf("life") > -1) return "life";
    return "medicare";
  }

  function labelOf(accent) {
    return accent.charAt(0).toUpperCase() + accent.slice(1);
  }

  // Pull the 11-character video ID out of any form of YouTube link.
  function videoId(url) {
    var s = String(url || "").trim();
    var m = s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
    if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
    return "";
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function showSection() {
    var sec = document.getElementById("webinars-section");
    if (sec) sec.style.display = "";
  }

  function render(container, items) {
    container.innerHTML = items.map(function (w) {
      var url = "https://www.youtube.com/watch?v=" + w.id;
      var thumb = "https://img.youtube.com/vi/" + w.id + "/hqdefault.jpg";
      return '' +
        '<div class="card">' +
          '<a href="' + url + '" target="_blank" rel="noopener" ' +
             'style="display:block;position:relative;aspect-ratio:16/9;border-radius:8px;overflow:hidden;margin-bottom:16px;">' +
            '<img src="' + thumb + '" alt="' + esc(w.title) + '" loading="lazy" ' +
               'style="width:100%;height:100%;object-fit:cover;display:block;">' +
            '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">' +
              '<span style="width:54px;height:54px;border-radius:50%;background:rgba(0,0,0,0.62);' +
                'color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.3rem;">▶</span>' +
            '</span>' +
          '</a>' +
          '<div class="badge badge-' + w.accent + '" style="margin-bottom:8px;">' + esc(w.label) + '</div>' +
          '<h4>' + esc(w.title) + '</h4>' +
          '<p style="margin-top:8px;font-size:.85rem;color:var(--color-ink-mid);">' + esc(w.description) + '</p>' +
          (w.recorded
            ? '<p style="margin-top:8px;font-size:.8rem;color:var(--color-ink-light);">Recorded ' + esc(w.recorded) + '</p>'
            : '') +
          '<a href="' + url + '" target="_blank" rel="noopener" ' +
             'class="btn btn-' + w.accent + '-outline btn-sm" style="margin-top:12px;">Watch Replay →</a>' +
        '</div>';
    }).join("");
  }

  function renderWebinars() {
    var container = document.getElementById("webinars-list");
    if (!container) return;

    var url = "https://docs.google.com/spreadsheets/d/" + WEBINARS_SHEET_ID +
              "/gviz/tq?tqx=out:json&headers=1&sheet=" +
              encodeURIComponent(WEBINARS_TAB) + "&_=" + Date.now();

    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (text) {
        var json = JSON.parse(
          text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
        if (!json.table) return;                 // tab missing — stay hidden
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

        var items = rows.map(function (row) {
          var accent = accentOf(cell(row, "area"));
          return {
            id: videoId(cell(row, "youtube link")),
            title: cell(row, "title"),
            description: cell(row, "description"),
            recorded: cell(row, "recorded"),
            accent: accent,
            label: labelOf(accent)
          };
        })
        .filter(function (w) { return w.id && w.title; });

        if (items.length === 0) return;          // nothing to show — stay hidden
        render(container, items);
        showSection();
      })
      .catch(function () {
        // Tab missing or sheet unreachable — section stays hidden, never broken.
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderWebinars);
  } else {
    renderWebinars();
  }
})();
