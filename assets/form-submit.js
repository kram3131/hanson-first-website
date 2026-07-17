/* ============================================================
   HANSON INSURANCE — FORM SUBMISSION CAPTURE (front end)
   ============================================================
   Every form on the site posts here, which forwards the data to
   a Google Apps Script Web App that appends it as a row in the
   Sheet (see google-apps-script/form-capture.gs for setup).

   WEB_APP_URL starts empty. Until Emily deploys the Apps Script
   and sends the URL, submitToSheet() silently no-ops — forms
   still show their normal success message, but nothing is saved
   yet. Paste the real URL in below the moment it's available;
   that's the only code change needed to turn this on.
   ============================================================ */

var WEB_APP_URL = ""; // e.g. "https://script.google.com/macros/s/AKfycb.../exec"

function submitToSheet(formType, data) {
  if (!WEB_APP_URL) return Promise.resolve();

  return fetch(WEB_APP_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(Object.assign({ formType: formType }, data))
  });
  // mode:"no-cors" means we can't read the response body, but Apps
  // Script Web Apps don't return CORS headers for anonymous access —
  // this is the standard workaround. We don't need to read anything
  // back; we just optimistically show the success message either way.
}
