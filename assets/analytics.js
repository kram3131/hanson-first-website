/* ============================================================
   HANSON INSURANCE — ANALYTICS (Google Analytics 4)
   ============================================================
   GA4_MEASUREMENT_ID starts empty on purpose. Until a real ID is
   pasted in below, this file quietly does nothing — no broken
   script, no console errors, just no tracking yet.

   To activate: paste the Measurement ID (looks like "G-XXXXXXXXXX")
   below, then include this script on every page — it's already
   wired into all 24 pages via <script src="assets/analytics.js">
   in each <head>.

   Before creating a fresh GA4 property, check whether the old
   hansonfirst.com site's Google Analytics / Google Site Kit access
   is recoverable — reusing the existing property preserves
   historical traffic trends instead of starting from zero.
   ============================================================ */

var GA4_MEASUREMENT_ID = ""; // e.g. "G-XXXXXXXXXX"

(function () {
  if (!GA4_MEASUREMENT_ID) return;

  var script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_MEASUREMENT_ID;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA4_MEASUREMENT_ID);
})();
