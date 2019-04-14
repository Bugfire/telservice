// SELF: https://script.google.com/macros/s/XXX/exec

var TWILIO_ACCOUNT_SID = "XXX";
var TWILIO_ACCOUNT_TOKEN = "XXX";

var GDRIVE_DIR_ID = "XXX";
var GDRIVE_KEY = "XXX";

function timestamp () {
  return new Date(new Date().getTime() + 9*3600*1000).toISOString().replace(/[:-]/g, '').replace(/T/, '-').replace(/\..+/, '');
}

function doGet (e) {
  var url = e.parameter.uri;
  var caller = e.parameter.caller;
  var key = e.parameter.key;
  if (key !== GDRIVE_KEY) {
    return ContentService.createTextOutput("Error");
  }
  var recording = UrlFetchApp.fetch(url);
  var blob = recording.getBlob();
  blob.setName(timestamp () + "-" + caller);
  var outputDir = DriveApp.getFolderById(GDRIVE_DIR_ID);
  var f = outputDir.createFile(blob);
  var sharingUrl = f.getUrl();
  deleteRecording(url);
  var out = ContentService.createTextOutput(sharingUrl);
  out.setMimeType(ContentService.MimeType.TEXT);
  return out;
}

function deleteRecording(recordingUrl) {
  try {
    var payload = {
      method: "delete",
      headers: {
        Authorization: " Basic " + Utilities.base64Encode(TWILIO_ACCOUNT_SID + ":" + TWILIO_ACCOUNT_TOKEN),
      },
      muteHttpExceptions: true,
    };
    UrlFetchApp.fetch(recordingUrl + ".json", payload);
  } catch (ex) {
    Logger.log(ex);
  }
}

