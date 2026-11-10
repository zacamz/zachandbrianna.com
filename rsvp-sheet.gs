/**
 * Bound to the RSVP Google Sheet.
 * Deploy: Extensions → Apps Script, paste this file, then Deploy → New deployment
 * → Web app. Execute as Me. Who has access: Anyone.
 * Paste the web app URL into SHEET_URL in main.js.
 */
var NOTIFY = "zachandbriannajohnson@gmail.com";
var HEADERS = [
  "Submitted",
  "Name",
  "Email",
  "Coming",
  "Invitation",
  "Street",
  "City",
  "State",
  "ZIP",
  "Note",
  "Adults",
  "Children",
];

function doPost(e) {
  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    data = e.parameter || {};
  }

  if (data._honey) {
    return json_({ success: true });
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    ensureHeaders_(sheet);

    var submitted = Utilities.formatDate(new Date(), "America/Chicago", "yyyy-MM-dd HH:mm");
    var row = [
      submitted,
      data.name || "",
      data.email || "",
      data.coming || "",
      data.invitation || "",
      data.street || "",
      data.city || "",
      data.state || "",
      data.zip || "",
      data.note || "",
      data.adults || "",
      data.children || "",
    ];
    sheet.appendRow(row);
    notify_(data, submitted);
  } finally {
    lock.releaseLock();
  }

  return json_({ success: true });
}

function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    return;
  }
  var width = Math.max(sheet.getLastColumn(), 1);
  var header = sheet.getRange(1, 1, 1, width).getValues()[0];
  if (header.indexOf("Adults") !== -1) return;
  sheet.getRange(1, width + 1, 1, 2).setValues([["Adults", "Children"]]);
}

function notify_(data, submitted) {
  var address = [data.street, data.city, data.state, data.zip].filter(Boolean).join(", ");
  var body = [
    data.name + " replied on " + submitted + ".",
    "",
    "Email: " + (data.email || ""),
    "Coming: " + (data.coming || ""),
    "Adults: " + (data.adults || "0"),
    "Children: " + (data.children || "0"),
    "Invitation: " + (data.invitation || ""),
    address ? "Address: " + address : "",
    data.note ? "Note: " + data.note : "",
  ]
    .filter(function (line) {
      return line !== "";
    })
    .join("\n");

  MailApp.sendEmail({
    to: NOTIFY,
    replyTo: data.email || NOTIFY,
    subject: "Wedding reply from " + (data.name || "a guest"),
    body: body,
  });
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
