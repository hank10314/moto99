function success(data) {
  return { success: true, data: data, error: null };
}

function failure(code, message) {
  return { success: false, data: null, error: { code: code, message: message } };
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function parsePostBody(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error('Invalid JSON body');
  }
}

function nowIso() {
  return Utilities.formatDate(new Date(), APP_CONFIG.timezone, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function todayString() {
  return Utilities.formatDate(new Date(), APP_CONFIG.timezone, 'yyyy-MM-dd');
}

function generateId(prefix) {
  var date = Utilities.formatDate(new Date(), APP_CONFIG.timezone, 'yyyyMMdd');
  var random = Utilities.getUuid().replace(/-/g, '').slice(0, 6);
  return prefix + '_' + date + '_' + random;
}

function requireFields(payload, fields) {
  fields.forEach(function (field) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      throw new Error(field + ' is required');
    }
  });
}

function toNumber(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback === undefined ? null : fallback;
  var numberValue = Number(value);
  if (isNaN(numberValue)) return fallback === undefined ? null : fallback;
  return numberValue;
}

function toBoolean(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback === undefined ? false : fallback;
  if (value === true || value === false) return value;
  return String(value).toLowerCase() === 'true';
}

function toDate(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    var match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) return new Date(Number(match[3]), Number(match[1]) - 1, Number(match[2]));
  }
  var date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return null;
  return date;
}

function dateString(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    var match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return match[1] + '-' + match[2] + '-' + match[3];
  }
  var date = toDate(value);
  if (!date) return '';
  return Utilities.formatDate(date, APP_CONFIG.timezone, 'yyyy-MM-dd');
}

function addMonths(dateString, months) {
  if (!dateString || !months) return '';
  var date = toDate(dateString);
  if (!date) return '';
  date.setMonth(date.getMonth() + Number(months));
  return Utilities.formatDate(date, APP_CONFIG.timezone, 'yyyy-MM-dd');
}

function dateDiffDays(fromDateString, toDateString) {
  var fromDate = toDate(fromDateString);
  var toDateValue = toDate(toDateString);
  if (!fromDate || !toDateValue) return null;
  var dayMs = 24 * 60 * 60 * 1000;
  return Math.ceil((toDateValue.getTime() - fromDate.getTime()) / dayMs);
}

function roundTo(value, places) {
  if (value === null || value === undefined || value === '' || isNaN(Number(value))) return null;
  var factor = Math.pow(10, places || 2);
  return Math.round(Number(value) * factor) / factor;
}

function calculateGaugeAdjustedFuelUsedLiters(addedLiters, currentFillPercent, previousFillPercent, tankCapacityLiters) {
  var currentPercent = toNumber(currentFillPercent, null);
  var previousPercent = toNumber(previousFillPercent, null);
  var tankCapacity = toNumber(tankCapacityLiters, 0);
  if (tankCapacity > 0 && currentPercent !== null && previousPercent !== null) {
    return addedLiters + (tankCapacity * (previousPercent - currentPercent)) / 100;
  }
  return addedLiters;
}

function getFuelGaugePercent(log) {
  var percent = toNumber(log.fuel_fill_percent, null);
  if (percent !== null) return percent;
  if (toBoolean(log.full_tank, false)) return 100;
  return null;
}

function sortByDateDesc(rows) {
  return rows.sort(function (a, b) {
    var aDate = toDate(a.date);
    var bDate = toDate(b.date);
    var aTime = aDate ? aDate.getTime() : 0;
    var bTime = bDate ? bDate.getTime() : 0;
    return bTime - aTime || Number(b.odometer_km || 0) - Number(a.odometer_km || 0);
  });
}
