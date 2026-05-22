/* ============================================================
   HANSON INSURANCE — EVENTS
   ============================================================
   This file controls the Events & Webinars page.

   ── HOW TO POST A NEW EVENT ─────────────────────────────────
   1. Copy the TEMPLATE block near the bottom of this file.
   2. Paste it inside the EVENTS list below (between the [ and ]).
   3. Fill in the details. Keep every quote " and comma , in place.
   4. Save the file and re-deploy. That's it.

   ── HOW EVENTS COME AND GO ──────────────────────────────────
   • You do NOT need to delete old events. The day after an
     event happens, it disappears from the website automatically.
   • You do NOT need to keep this list in date order. The page
     always shows events soonest-first on its own.
   • When there are no upcoming events, the page shows a friendly
     "no events right now" message automatically.

   ── FIELD GUIDE ─────────────────────────────────────────────
     date         Event date, always "YYYY-MM-DD"   e.g. "2026-06-10"
     time         Time shown to visitors            e.g. "1:00 PM – 3:00 PM"
     accent       Color theme — "medicare", "health", or "life"
     type         Small label shown above the title
     title        The event name
     description  One short paragraph about the event
     venueIcon    "📍" for in person, "💻" for online/webinar
     venue        Place name, or "Zoom Webinar"
     ctaLabel     Button text                       e.g. "Register →"
     ctaUrl       Where the button goes             e.g. "book.html"
   ============================================================ */

const EVENTS = [

  {
    date: "2026-06-10",
    time: "1:00 PM – 3:00 PM",
    accent: "medicare",
    type: "Medicare Enrollment Help · In Person",
    title: "Medicare Enrollment Help Session — Leander",
    description: "Turning 65 this summer? Bring your Medicare card (or your questions about getting one) and Emily will walk you through your enrollment options in a small group setting.",
    venueIcon: "📍",
    venue: "Leander Public Library",
    ctaLabel: "Register →",
    ctaUrl: "book.html"
  },

  /* ── COPY THE TEMPLATE BELOW TO ADD A NEW EVENT ──────────────
     (delete the surrounding comment marks once it's filled in)

  {
    date: "2026-00-00",
    time: "0:00 PM – 0:00 PM",
    accent: "health",
    type: "Health Insurance · Webinar",
    title: "Your Event Title Here",
    description: "One short, friendly paragraph describing the event.",
    venueIcon: "💻",
    venue: "Zoom Webinar",
    ctaLabel: "Register →",
    ctaUrl: "book.html"
  },

  ───────────────────────────────────────────────────────────── */

];


/* ============================================================
   RENDERING — no need to edit anything below this line.
   ============================================================ */
(function () {
  var MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN",
                "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  // Turn "YYYY-MM-DD" into a Date at local midnight (avoids timezone shifts).
  function parseDate(s) {
    var p = String(s).split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function renderEvents() {
    var container = document.getElementById("events-list");
    if (!container) return;

    // "Today" at local midnight — an event still shows on its own day,
    // then drops off automatically the next day.
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var upcoming = EVENTS
      .filter(function (e) { return parseDate(e.date) >= today; })
      .sort(function (a, b) { return parseDate(a.date) - parseDate(b.date); });

    if (upcoming.length === 0) {
      container.innerHTML =
        '<div class="card" style="text-align:center;padding:40px 32px;">' +
          '<div style="font-size:2rem;margin-bottom:8px;">📅</div>' +
          '<h4>No upcoming events right now</h4>' +
          '<p style="margin-top:8px;font-size:.9rem;color:var(--color-ink-mid);">' +
            'New workshops and webinars are added regularly. Check back soon, or ' +
            '<a href="contact.html" style="color:var(--medicare-primary);font-weight:600;">contact us</a> ' +
            'to schedule a one-on-one with Emily.</p>' +
        '</div>';
      return;
    }

    container.innerHTML = upcoming.map(function (e) {
      var d = parseDate(e.date);
      return '' +
        '<div class="event-card">' +
          '<div class="event-date-col" style="background:var(--' + e.accent + '-light);color:var(--' + e.accent + '-dark);">' +
            '<div class="event-month">' + MONTHS[d.getMonth()] + '</div>' +
            '<div class="event-day">' + d.getDate() + '</div>' +
          '</div>' +
          '<div class="event-body">' +
            '<div class="event-type">' + e.type + '</div>' +
            '<h4 style="color:var(--' + e.accent + '-dark);">' + e.title + '</h4>' +
            '<p style="margin-top:8px;font-size:.875rem;color:var(--color-ink-mid);">' + e.description + '</p>' +
            '<div style="margin-top:12px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">' +
              '<span style="font-size:.8rem;color:var(--color-ink-light);">' + e.venueIcon + ' ' + e.venue + ' · ' + e.time + '</span>' +
              '<a href="' + e.ctaUrl + '" class="btn btn-' + e.accent + ' btn-sm">' + e.ctaLabel + '</a>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join("");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderEvents);
  } else {
    renderEvents();
  }
})();
