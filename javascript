const SHEET_ID = "YOUR_SPREADSHEET_ID_HERE"; 

function doGet(e) {
  return ContentService.createTextOutput("QR Attendance API is Live");
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000); 
  try {
    const data = JSON.parse(e.postData.contents);
    const qrData = data.qrData;
    const scannerEmail = Session.getActiveUser().getEmail() || "Station User";
    const timestamp = new Date();

    const ss = SpreadsheetApp.openById(SHEET_ID);
    
    // Auto-create required Sheets kung wala pa
    const peopleSheet = getOrCreateSheet(ss, "People", ["QR Code ID", "Name", "Role", "Created At"]);
    const attendanceSheet = getOrCreateSheet(ss, "Attendance", ["QR Code ID", "Scanner Email", "Check In", "Check Out", "Status"]);
    const auditSheet = getOrCreateSheet(ss, "Audit", ["Timestamp", "Action", "QR Code ID", "Scanner Email"]);

    // 1. Audit Log for Scan Activity
    auditSheet.appendRow([timestamp, "SCAN_ATTEMPT", qrData, scannerEmail]);

    // 2. Check current status in Attendance Sheet
    const attData = attendanceSheet.getDataRange().getValues();
    let userRowIndex = -1;
    let isCheckedIn = false;

    for (let i = attData.length - 1; i >= 1; i--) {
      if (attData[i][0] === qrData) {
        if (attData[i][4] === "CHECKED_IN") {
          userRowIndex = i + 1; // 1-based index
          isCheckedIn = true;
        }
        break;
      }
    }

    let actionType = "";

    if (!isCheckedIn) {
      // FIRST SCAN = CHECK IN
      actionType = "CHECK_IN";
      attendanceSheet.appendRow([qrData, scannerEmail, timestamp, "", "CHECKED_IN"]);
    } else {
      // SECOND SCAN = CHECK OUT
      actionType = "CHECK_OUT";
      attendanceSheet.getRange(userRowIndex, 4).setValue(timestamp); // Set Check Out time
      attendanceSheet.getRange(userRowIndex, 5).setValue("CHECKED_OUT"); // Update Status
    }

    // Record Action in Audit Sheet
    auditSheet.appendRow([timestamp, actionType, qrData, scannerEmail]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: actionType,
      qrData: qrData,
      scannerEmail: scannerEmail,
      time: timestamp.toLocaleTimeString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getOrCreateSheet(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
  return sheet;
}
