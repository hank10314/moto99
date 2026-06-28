function getSpreadsheet() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = properties.getProperty(APP_CONFIG.spreadsheetIdProperty);
  if (spreadsheetId) return SpreadsheetApp.openById(spreadsheetId);

  var spreadsheet = SpreadsheetApp.create(APP_CONFIG.spreadsheetName);
  properties.setProperty(APP_CONFIG.spreadsheetIdProperty, spreadsheet.getId());
  return spreadsheet;
}

function initDatabase() {
  var spreadsheet = getSpreadsheet();
  Object.keys(SHEET_SCHEMAS).forEach(function (sheetName) {
    var sheet = spreadsheet.getSheetByName(sheetName) || spreadsheet.insertSheet(sheetName);
    var headers = SHEET_SCHEMAS[sheetName];
    var lastColumn = Math.max(sheet.getLastColumn(), headers.length);
    var firstRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    var isEmpty = firstRow.join('') === '';
    if (isEmpty) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      return;
    }

    var existingHeaders = firstRow.filter(function (value) {
      return value !== '';
    });
    var nextHeaders = existingHeaders.slice();
    headers.forEach(function (header) {
      if (nextHeaders.indexOf(header) === -1) nextHeaders.push(header);
    });
    if (nextHeaders.join('|') !== existingHeaders.join('|')) {
      sheet.getRange(1, 1, 1, nextHeaders.length).setValues([nextHeaders]);
      sheet.setFrozenRows(1);
    }
  });
  seedSettings();
  PropertiesService.getScriptProperties().setProperty(APP_CONFIG.schemaVersionProperty, APP_CONFIG.schemaVersion);
  return { spreadsheet_id: spreadsheet.getId(), spreadsheet_url: spreadsheet.getUrl() };
}

function ensureDatabaseInitialized() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = properties.getProperty(APP_CONFIG.spreadsheetIdProperty);
  var schemaVersion = properties.getProperty(APP_CONFIG.schemaVersionProperty);
  if (spreadsheetId && schemaVersion === APP_CONFIG.schemaVersion) return;
  initDatabase();
}

function seedSettings() {
  var settings = getRows('Settings');
  if (settings.length > 0) return;
  appendRow('Settings', {
    key: 'currency',
    value: 'TWD',
    description: 'Default currency',
    updated_at: nowIso(),
  });
}

function getSheet(sheetName) {
  var spreadsheet = getSpreadsheet();
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    initDatabase();
    sheet = spreadsheet.getSheetByName(sheetName);
  }
  return sheet;
}

function getHeaders(sheetName) {
  return SHEET_SCHEMAS[sheetName];
}

function getRows(sheetName) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheetName);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  return values
    .filter(function (row) {
      return row.join('') !== '';
    })
    .map(function (row, index) {
      var record = { _rowNumber: index + 2 };
      headers.forEach(function (header, columnIndex) {
        record[header] = row[columnIndex];
      });
      return record;
    });
}

function appendRow(sheetName, record) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheetName);
  var row = headers.map(function (header) {
    return record[header] === undefined ? '' : record[header];
  });
  sheet.appendRow(row);
  return record;
}

function updateRowById(sheetName, idField, idValue, patch) {
  var sheet = getSheet(sheetName);
  var headers = getHeaders(sheetName);
  var rows = getRows(sheetName);
  var target = rows.find(function (row) {
    return String(row[idField]) === String(idValue);
  });
  if (!target) throw new Error(sheetName + ' record not found: ' + idValue);
  var nextRecord = Object.assign({}, target, patch);
  delete nextRecord._rowNumber;
  var values = headers.map(function (header) {
    return nextRecord[header] === undefined ? '' : nextRecord[header];
  });
  sheet.getRange(target._rowNumber, 1, 1, headers.length).setValues([values]);
  return nextRecord;
}

function deleteRowById(sheetName, idField, idValue) {
  var sheet = getSheet(sheetName);
  var rows = getRows(sheetName);
  var target = rows.find(function (row) {
    return String(row[idField]) === String(idValue);
  });
  if (!target) throw new Error(sheetName + ' record not found: ' + idValue);
  sheet.deleteRow(target._rowNumber);
  return { deleted: true, id: idValue };
}

function findById(sheetName, idField, idValue) {
  return getRows(sheetName).find(function (row) {
    return String(row[idField]) === String(idValue);
  });
}
