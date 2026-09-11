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

   This same deployment also serves every per-advisor clone site
   (see tools/generate_clone.py) — one Web App URL for all of them,
   no per-agent setup needed. A clone's submissions land in the same
   shared tabs, but its email alert routes ONLY to that agent's own
   inbox (see doPost's routing logic below), never to NOTIFY_EMAILS.

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
     - Agent Intake Submissions  (from agent-intake.html — one row
       per team member requesting their own site. Turn a row into
       a ready generator config with tools/intake_to_config.py.)

   ── RE-DEPLOYING AFTER EDITS ────────────────────────────────
   If you ever edit this script later, use Deploy → Manage
   deployments → Edit (pencil icon) → New version, so the same
   Web app URL keeps working. Creating a brand new deployment
   gives you a different URL and breaks the site until it's
   updated with the new one.
   ============================================================ */

var SHEET_ID = "1sXGSpw-7-Tq1xpTVxbKU343rw9GDM9qHKVjY_fwd3uI";

// Agent intake submissions (agent-intake.html) carry private,
// compliance-sensitive info about team members — their bio, personal
// email, domain, and whether they run their own separate licensed
// business. That should NOT be visible to everyone with access to the
// main shared Sheet. Once you've created a separate private Sheet
// (File -> New spreadsheet, share it with no one else) and pasted its
// ID below, agentIntake submissions write there instead, and the
// alert email goes only to AGENT_INTAKE_NOTIFY_EMAIL, never to
// NOTIFY_EMAILS. Leave AGENT_INTAKE_SHEET_ID blank and everything
// still works — submissions just land in the main shared Sheet
// (Agent Intake Submissions tab) until you set this up.
var AGENT_INTAKE_SHEET_ID = "";
var AGENT_INTAKE_NOTIFY_EMAIL = "mark@laimen.ai";

var TAB_MAP = {
  contact:     "Contact Submissions",
  joinus:      "Recruiting Applications",
  lifequote:   "Life Quote Requests",
  soa:         "SOA Requests",
  newsletter:  "Newsletter Signups",
  testimonial: "Testimonial Submissions",
  agentIntake: "Agent Intake Submissions"  // agent-intake.html — see tools/intake_to_config.py
};

// Who gets an email alert for each new submission. Comma-separated
// to add more, e.g. "emily@hansonfirst.com, mark@laimen.ai"
var NOTIFY_EMAILS = "emily@hansonfirst.com";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var formType = data.formType;
    var tabName = TAB_MAP[formType] || "Unrecognized Submissions";
    var isAgentIntake = formType === "agentIntake";

    // Agent intake goes to its own private Sheet once one is
    // configured (see AGENT_INTAKE_SHEET_ID above); every other form
    // type is completely unaffected and keeps using the main Sheet.
    var targetSheetId = (isAgentIntake && AGENT_INTAKE_SHEET_ID) ? AGENT_INTAKE_SHEET_ID : SHEET_ID;
    var ss = SpreadsheetApp.openById(targetSheetId);
    var sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
    }

    // A per-advisor clone site's submissions carry two extra fields
    // (agentSlug, agentEmail) used ONLY for the email routing below —
    // they are never written to the Sheet. The header row for each tab
    // was fixed once, back when that tab was first created, and never
    // grows automatically; if a future submission's field set/order
    // ever differed from the original, the row values would land in
    // columns that no longer match the header above them, corrupting
    // data already in use. Stripping these two fields before building
    // the row keeps every tab's shape identical to what it's always
    // been, on the main site and on every clone alike.
    var sheetOnlyData = {};
    for (var k in data) {
      if (k !== "agentEmail" && k !== "agentSlug") sheetOnlyData[k] = data[k];
    }

    // Every field except formType becomes a column. Header row is
    // built automatically from the first submission of each type.
    var keys = Object.keys(sheetOnlyData).filter(function (k) { return k !== "formType"; });

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp"].concat(keys));
    }

    var row = [new Date()];
    keys.forEach(function (k) { row.push(sheetOnlyData[k]); });
    sheet.appendRow(row);

    // Email alert — wrapped so a mail hiccup never loses the submission
    // (the row above is already saved by this point).
    //
    // Routing: the main site's own submissions have no agentEmail field
    // at all (data.agentEmail is undefined), so they keep going to
    // NOTIFY_EMAILS exactly as before. A clone site's submissions DO
    // carry agentEmail — those go ONLY to that agent's own inbox, never
    // to NOTIFY_EMAILS, per the confirmed "agent-only, fully private"
    // decision. Agent intake submissions go only to
    // AGENT_INTAKE_NOTIFY_EMAIL, never to NOTIFY_EMAILS — the alert
    // body includes every field value, so this matters just as much as
    // which Sheet the row lands in. No agent is ever given direct
    // access to any Sheet, so the "view all submissions" link below is
    // only included when mailing whoever actually has access to
    // wherever this particular submission landed.
    try {
      var agentEmail = data.agentEmail || "";
      var recipients = agentEmail || (isAgentIntake ? AGENT_INTAKE_NOTIFY_EMAIL : NOTIFY_EMAILS);
      var lines = keys.map(function (k) {
        return k + ": " + String(sheetOnlyData[k]);
      });
      if (data.agentSlug) lines.unshift("Site: " + data.agentSlug);
      var body =
        "A new submission just came in from the website.\n\n" +
        "Type: " + tabName + "\n" +
        "Time: " + new Date().toLocaleString() + "\n\n" +
        lines.join("\n");
      if (!agentEmail) {
        body += "\n\nView all submissions:\n" +
          "https://docs.google.com/spreadsheets/d/" + targetSheetId + "/edit";
      }
      MailApp.sendEmail({
        to: recipients,
        subject: "New website submission: " + tabName.replace(/s$/, ""),
        body: body
      });
    } catch (mailErr) {
      // Capture succeeded either way — only the notification failed.
      // Logged (not thrown) so it's visible in Executions without
      // ever losing the submission itself. A common cause: MailApp
      // needs its send-email scope re-authorized after this code is
      // added — run doPost once from the editor to trigger the
      // authorization prompt, then redeploy (New version).
      console.error("Email alert failed: " + mailErr);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
