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
     Date           e.g. 2026-06-10   (controls automatic fall-off
                    for a normal one-time event — see "Recurring"
                    below for a standing daily/weekly event)
     Time           e.g. 1:00 PM – 3:00 PM   (events on the same
                    day are shown in time order, earliest first)
     Area           Medicare, Health, or Life   (sets the color,
                    and lets visitors filter by club at the top
                    of the page)
     Format         In Person or Webinar        (sets the icon)
     Title          the event name
     Description    one short paragraph
     Host           agent's name, e.g. "Tia Pruett" — shown as
                    "Hosted by ___" on the event card. Leave blank
                    and it shows "Hanson Insurance" instead.
     Venue          place name, or "Zoom Webinar"
     Location       city, e.g. "Liberty Hill, TX" — lets visitors
                    filter events by city at the top of the page
     Carrier        e.g. "Aetna", "Humana" — lets visitors filter
                    events by carrier at the top of the page.
                    Leave blank if an event isn't carrier-specific.
     Recurring      Leave blank for a normal one-time event. Put
                    "Yes" for a standing event that repeats every
                    weekday/week over a date range (e.g. an open
                    house running all through AEP) — this shows as
                    a single pinned banner above the regular list
                    instead of needing one row per day.
     End Date       Only used when Recurring is "Yes" — the last
                    day the banner should show (e.g. 2026-12-07).
                    The Date column becomes the day the banner
                    should start showing; it won't appear before
                    that date, and disappears automatically after
                    End Date, same as a normal event falling off.
     Register Link  where the button goes (e.g. book.html)

   The Location and Carrier filter dropdowns at the top of the
   events page fill themselves in automatically from whatever
   values appear in those two columns — no code changes needed
   to add a new city or carrier.
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

  // Pulls the first HH:MM AM/PM (or H AM/PM) out of a free-text time
  // string like "1:00 PM – 3:00 PM" and returns minutes-since-midnight,
  // so events on the same day can be shown earliest-first. Returns a
  // very large number for unparseable/blank times so they sort last
  // rather than jumping to the top of the day.
  function parseTimeMinutes(val) {
    var s = String(val || "");
    var m = s.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM|am|pm)/);
    if (!m) return Infinity;
    var hours = parseInt(m[1], 10) % 12;
    var minutes = m[2] ? parseInt(m[2], 10) : 0;
    if (/pm/i.test(m[3])) hours += 12;
    return hours * 60 + minutes;
  }

  function accentOf(area) {
    var a = String(area || "").toLowerCase();
    if (a.indexOf("health") > -1) return "health";
    if (a.indexOf("life") > -1) return "life";
    return "medicare";
  }

  function isVirtual(format) {
    var f = String(format || "").toLowerCase();
    return f.indexOf("webinar") > -1 || f.indexOf("online") > -1 ||
           f.indexOf("zoom") > -1 || f.indexOf("virtual") > -1;
  }

  function iconOf(format) {
    return isVirtual(format) ? "💻" : "📍";
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
    if (events.length === 0) {
      container.innerHTML =
        '<div class="card" style="text-align:center;padding:32px;">' +
          '<p style="color:var(--color-ink-mid);">No events match those filters. ' +
          '<a href="#" id="events-filters-reset" style="color:var(--medicare-primary);font-weight:600;">Clear filters</a></p>' +
        '</div>';
      var resetLink = document.getElementById("events-filters-reset");
      if (resetLink) {
        resetLink.addEventListener("click", function (ev) {
          ev.preventDefault();
          var carrierSelect = document.getElementById("events-filter-carrier");
          var locationSelect = document.getElementById("events-filter-location");
          var formatBar = document.getElementById("events-filter-format");
          var areaBar = document.getElementById("events-filter-area");
          if (carrierSelect) carrierSelect.value = "";
          if (locationSelect) locationSelect.value = "";
          if (formatBar) {
            formatBar.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
            formatBar.querySelector('[data-format=""]').classList.add("active");
          }
          if (areaBar) {
            areaBar.querySelectorAll(".filter-btn").forEach(function (b) {
              b.classList.remove("active", "active-medicare", "active-health", "active-life");
            });
            areaBar.querySelector('[data-area=""]').classList.add("active");
          }
          selectedFormatType = "";
          selectedArea = "";
          applyFiltersAndRender();
        });
      }
      return;
    }

    container.innerHTML = events.map(function (e) {
      var d = e.dateObj;
      var meta = e.venue;
      if (e.location) meta += ' · ' + e.location;
      if (e.carrier) meta += ' · ' + e.carrier;
      return '' +
        '<div class="event-card">' +
          '<div class="event-date-col" style="background:var(--' + e.accent + '-light);color:var(--' + e.accent + '-dark);">' +
            '<div class="event-month">' + MONTHS[d.getMonth()] + '</div>' +
            '<div class="event-day">' + d.getDate() + '</div>' +
          '</div>' +
          '<div class="event-body">' +
            '<div class="event-type">' + esc(e.area) + ' · ' + esc(e.format) + '</div>' +
            '<h4 style="color:var(--' + e.accent + '-dark);">' + esc(e.title) + '</h4>' +
            '<p style="margin-top:4px;font-size:.8rem;color:var(--color-ink-light);">Hosted by ' + esc(e.host) + '</p>' +
            '<p style="margin-top:8px;font-size:.875rem;color:var(--color-ink-mid);">' + esc(e.description) + '</p>' +
            '<div style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">' +
              '<span style="font-size:.8rem;color:var(--color-ink-light);">' + e.icon + ' ' + esc(meta) + ' · ' + esc(e.time) + '</span>' +
              '<a href="' + esc(e.link) + '" class="btn btn-' + e.accent + ' btn-sm">Register →</a>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join("");
  }

  // Standing events (e.g. a weekday open house running through AEP) —
  // shown as a pinned banner above the regular list rather than one
  // row per day. Only rendered while today falls within the row's
  // start Date / End Date window (handled by the caller).
  function renderRecurring(container, recurringEvents) {
    if (!container) return;
    if (recurringEvents.length === 0) { container.innerHTML = ""; return; }

    container.innerHTML = recurringEvents.map(function (e) {
      var d = e.endDateObj;
      var through = MONTHS[d.getMonth()].charAt(0) + MONTHS[d.getMonth()].slice(1).toLowerCase() +
                    ' ' + d.getDate();
      var meta = e.venue;
      if (e.location) meta += ' · ' + e.location;
      if (e.carrier) meta += ' · ' + e.carrier;
      return '' +
        '<div class="callout callout-' + e.accent + '" style="margin-bottom:24px;">' +
          '<div class="callout-icon">🔁</div>' +
          '<div>' +
            '<h4 style="color:var(--' + e.accent + '-dark);">' + esc(e.title) + ' — ongoing through ' + through + '</h4>' +
            '<p style="color:var(--' + e.accent + '-dark);opacity:.7;margin-top:2px;font-size:.85rem;">Hosted by ' + esc(e.host) + '</p>' +
            '<p style="color:var(--' + e.accent + '-dark);opacity:.85;margin-top:4px;font-weight:600;">' + e.icon + ' ' + esc(e.time) + '</p>' +
            '<p style="color:var(--' + e.accent + '-dark);opacity:.85;margin-top:4px;">' + esc(e.description) + '</p>' +
            '<p style="color:var(--' + e.accent + '-dark);opacity:.7;margin-top:8px;font-size:.85rem;">' + esc(meta) + '</p>' +
            '<a href="' + esc(e.link) + '" class="btn btn-' + e.accent + ' btn-sm" style="margin-top:12px;">Learn More →</a>' +
          '</div>' +
        '</div>';
    }).join("");
  }

  // Builds the sorted list of unique, non-blank values for a filter
  // dropdown (e.g. every distinct carrier across all upcoming events).
  function uniqueValues(events, field) {
    var seen = {};
    var values = [];
    events.forEach(function (e) {
      var v = String(e[field] || "").trim();
      if (v && !seen[v]) { seen[v] = true; values.push(v); }
    });
    values.sort(function (a, b) { return a.localeCompare(b); });
    return values;
  }

  var selectedFormatType = ""; // "", "in-person", or "virtual"
  var selectedArea = "";       // "", "medicare", "health", or "life"

  function renderFilters(filtersContainer, allEvents) {
    if (!filtersContainer) return;

    selectedFormatType = "";
    selectedArea = "";
    var carriers = uniqueValues(allEvents, "carrier");
    var locations = uniqueValues(allEvents, "location");
    var hasInPerson = allEvents.some(function (e) { return !isVirtual(e.format); });
    var hasVirtual = allEvents.some(function (e) { return isVirtual(e.format); });
    var areasPresent = uniqueValues(allEvents, "accent"); // "medicare"/"health"/"life"

    if (carriers.length === 0 && locations.length === 0 &&
        !(hasInPerson && hasVirtual) && areasPresent.length <= 1) {
      filtersContainer.innerHTML = "";
      return;
    }

    var html = "";

    // Only worth showing a toggle when events actually span more than
    // one option — no point offering a choice that can't change anything.
    if (areasPresent.length > 1) {
      html += '<div class="filter-bar" id="events-filter-area">' +
        '<button type="button" class="filter-btn active" data-area="">All Clubs</button>' +
        '<button type="button" class="filter-btn" data-area="medicare">Club Medicare</button>' +
        '<button type="button" class="filter-btn" data-area="health">Club Health</button>' +
        '<button type="button" class="filter-btn" data-area="life">Club Life</button>' +
        '</div>';
    }

    if (hasInPerson && hasVirtual) {
      html += '<div class="filter-bar" id="events-filter-format">' +
        '<button type="button" class="filter-btn active" data-format="">All</button>' +
        '<button type="button" class="filter-btn" data-format="in-person">📍 In Person</button>' +
        '<button type="button" class="filter-btn" data-format="virtual">💻 Virtual</button>' +
        '</div>';
    }

    html += '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px;">';
    if (carriers.length > 0) {
      html += '<div class="form-group" style="min-width:200px;">' +
        '<label class="form-label" for="events-filter-carrier">Filter by Carrier</label>' +
        '<select class="form-select" id="events-filter-carrier"><option value="">All Carriers</option>' +
        carriers.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + '</option>'; }).join("") +
        '</select></div>';
    }
    if (locations.length > 0) {
      html += '<div class="form-group" style="min-width:200px;">' +
        '<label class="form-label" for="events-filter-location">Filter by Location</label>' +
        '<select class="form-select" id="events-filter-location"><option value="">All Locations</option>' +
        locations.map(function (l) { return '<option value="' + esc(l) + '">' + esc(l) + '</option>'; }).join("") +
        '</select></div>';
    }
    html += '</div>';
    filtersContainer.innerHTML = html;

    var carrierSelect = document.getElementById("events-filter-carrier");
    var locationSelect = document.getElementById("events-filter-location");
    if (carrierSelect) carrierSelect.addEventListener("change", applyFiltersAndRender);
    if (locationSelect) locationSelect.addEventListener("change", applyFiltersAndRender);

    var areaBar = document.getElementById("events-filter-area");
    if (areaBar) {
      areaBar.addEventListener("click", function (ev) {
        var btn = ev.target.closest("button[data-area]");
        if (!btn) return;
        areaBar.querySelectorAll(".filter-btn").forEach(function (b) {
          b.classList.remove("active", "active-medicare", "active-health", "active-life");
        });
        var area = btn.dataset.area;
        btn.classList.add(area ? "active-" + area : "active");
        selectedArea = area;
        applyFiltersAndRender();
      });
    }

    var formatBar = document.getElementById("events-filter-format");
    if (formatBar) {
      formatBar.addEventListener("click", function (ev) {
        var btn = ev.target.closest("button[data-format]");
        if (!btn) return;
        formatBar.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        selectedFormatType = btn.dataset.format;
        applyFiltersAndRender();
      });
    }
  }

  var allUpcomingEvents = [];

  function applyFiltersAndRender() {
    var container = document.getElementById("events-list");
    if (!container) return;

    var carrierSelect = document.getElementById("events-filter-carrier");
    var locationSelect = document.getElementById("events-filter-location");
    var carrier = carrierSelect ? carrierSelect.value : "";
    var location = locationSelect ? locationSelect.value : "";

    var filtered = allUpcomingEvents.filter(function (e) {
      return (!carrier || e.carrier === carrier) &&
             (!location || e.location === location) &&
             (!selectedFormatType || (selectedFormatType === "virtual") === isVirtual(e.format)) &&
             (!selectedArea || e.accent === selectedArea);
    });

    render(container, filtered);
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

        var allRows = rows.map(function (row) {
          var area = cell(row, "area");
          var time = cell(row, "time");
          return {
            dateObj: parseDate(cell(row, "date")),
            endDateObj: parseDate(cell(row, "end date")),
            recurring: /^y/i.test(String(cell(row, "recurring") || "").trim()),
            time: time,
            timeMinutes: parseTimeMinutes(time),
            area: area,
            format: cell(row, "format"),
            title: cell(row, "title"),
            description: cell(row, "description"),
            host: String(cell(row, "host") || "").trim() || "Hanson Insurance",
            venue: cell(row, "venue"),
            location: String(cell(row, "location") || "").trim(),
            carrier: String(cell(row, "carrier") || "").trim(),
            link: String(cell(row, "register link") || "").trim() || "book.html",
            accent: accentOf(area),
            icon: iconOf(cell(row, "format"))
          };
        });

        // Recurring rows (e.g. a weekday open house running through AEP)
        // are shown as a single pinned banner, active only for the window
        // between the start Date and End Date — never mixed into the
        // date-sorted list, since they don't have one specific date.
        var recurring = allRows.filter(function (e) {
          return e.recurring && e.title && e.dateObj && e.endDateObj &&
                 today >= e.dateObj && today <= e.endDateObj;
        });

        var events = allRows.filter(function (e) {
          return !e.recurring && e.dateObj && e.title && e.dateObj >= today;
        })
        .sort(function (a, b) {
          var dateDiff = a.dateObj - b.dateObj;
          return dateDiff !== 0 ? dateDiff : a.timeMinutes - b.timeMinutes;
        });

        allUpcomingEvents = events;

        renderRecurring(document.getElementById("events-recurring"), recurring);

        if (events.length === 0) {
          var filtersContainer = document.getElementById("events-filters");
          if (filtersContainer) filtersContainer.innerHTML = "";
          showEmpty(container);
          return;
        }

        renderFilters(document.getElementById("events-filters"), events);
        applyFiltersAndRender();
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
