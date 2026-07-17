/* ============================================================
   HANSON INSURANCE — FORM SUBMISSION CAPTURE
   ============================================================
   This is NOT part of the deployed website — it's a Google Apps
   Script that runs INSIDE the Google Sheet and receives form
   submissions from every form on the site (Contact, Join Us,
   Club Life quote, SOA, newsletter, testimonial submissions).

   Every submission gets appended as a new row to a matching tab
   in this Sheet, tagged with a timestamp. No CRM, no third-party
   vendor, no API key — just the Sheet you already manage Events/
   Team/Testimonials from.

   ── ONE-TIME SETUP (Emily, or whoever owns the Sheet) ─────────
   1. Open the Sheet:
      https://docs.google.com/spreadsheets/d/1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI/edit
   2. Go to Extensions → Apps Script.
   3. Delete any starter code in the editor, then paste in the
      entire contents of this file.
   4. Click Deploy → New deployment.
      - Select type: "Web app"
      - Description: "Form capture"
      - Execute as: "Me"
      - Who has access: "Anyone"
   5. Click Deploy. Google will ask you to authorize the script —
      approve it (it only has permission to edit this one Sheet).
   6. Copy the "Web app URL" it gives you — it looks like:
      https://script.google.com/macros/s/AKfycb.../exec
   7. Send that URL to Mark. It gets pasted into
      assets/form-submit.js as WEB_APP_URL — that's the only
      code change needed on the website side.

   Submissions will start appearing in the Sheet immediately,
   each in their own tab (auto-created the first time a
   submission of that type comes in — no need to pre-create them):
     - Contact Submissions
     - Recruiting Applications
     - Life Quote Requests
     - SOA Requests
     - Newsletter Signups
     - Testimonial Submissions   (NOTE: this is a holding tab for
       review — it is NOT the same as the "Testimonials" tab that
       drives the live testimonials page. Copy an entry over to
       "Testimonials" only after reviewing it.)

   ── RE-DEPLOYING AFTER EDITS ────────────────────────────────
   If you ever edit this script later, use Deploy → Manage
   deployments → Edit (pencil icon) → New version, so the same
   Web app URL keeps working. Creating a brand new deployment
   gives you a different URL and breaks the site until it's
   updated with the new one.
   ============================================================ */

var SHEET_ID = "1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI";

var TAB_MAP = {
  contact:     "Contact Submissions",
  joinus:      "Recruiting Applications",
  lifequote:   "Life Quote Requests",
  soa:         "SOA Requests",
  newsletter:  "Newsletter Signups",
  testimonial: "Testimonial Submissions"
};

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var formType = data.formType;
    var tabName = TAB_MAP[formType] || "Unrecognized Submissions";

    var ss = SpreadsheetApp.openById(SHEET_ID);
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }

    // Every field except formType becomes a column. Header row is
    // built automatically from the first submission of each type.
    var keys = Object.keys(data).filter(function (k) { return k !== "formType"; });

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp"].concat(keys));
    }

    var row = [new Date()];
    keys.forEach(function (k) { row.push(data[k]); });
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
