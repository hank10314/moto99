function listMaintenanceLogs(vehicleId) {
  return sortByDateDesc(
    getRows('MaintenanceLogs').filter(function (log) {
      return !vehicleId || String(log.vehicle_id) === String(vehicleId);
    })
  );
}

function getMaintenanceLog(maintenanceLogId) {
  var log = findById('MaintenanceLogs', 'maintenance_log_id', maintenanceLogId);
  if (!log) throw new Error('Maintenance log not found');
  return log;
}

function createMaintenanceLog(payload) {
  requireFields(payload, ['vehicle_id', 'date', 'odometer_km', 'item']);
  getVehicle(payload.vehicle_id);
  var odometer = toNumber(payload.odometer_km, null);
  if (odometer === null || odometer < 0) throw new Error('odometer_km must be >= 0');
  var partsCost = toNumber(payload.parts_cost, 0);
  var laborCost = toNumber(payload.labor_cost, 0);
  if (partsCost < 0 || laborCost < 0 || toNumber(payload.total_cost, 0) < 0) throw new Error('cost must be >= 0');
  var totalCost = payload.total_cost === undefined || payload.total_cost === '' ? partsCost + laborCost : toNumber(payload.total_cost, 0);
  var timestamp = nowIso();
  var log = {
    maintenance_log_id: generateId('maint'),
    vehicle_id: payload.vehicle_id,
    date: payload.date,
    odometer_km: odometer,
    category: payload.category || '',
    item: payload.item,
    vendor: payload.vendor || '',
    parts: payload.parts || '',
    parts_cost: partsCost,
    labor_cost: laborCost,
    total_cost: roundTo(totalCost, 2),
    next_due_km: payload.next_due_km === undefined || payload.next_due_km === '' ? '' : toNumber(payload.next_due_km, null),
    next_due_date: payload.next_due_date || '',
    note: payload.note || '',
    attachment_file_id: payload.attachment_file_id || '',
    created_at: timestamp,
    updated_at: timestamp,
  };
  appendRow('MaintenanceLogs', log);
  createOdometerLog({
    vehicle_id: payload.vehicle_id,
    date: payload.date,
    odometer_km: odometer,
    source_type: 'maintenance',
    source_id: log.maintenance_log_id,
    note: payload.item,
  });
  return log;
}

function updateMaintenanceLog(payload) {
  requireFields(payload, ['maintenance_log_id', 'vehicle_id', 'date', 'odometer_km', 'item']);
  getVehicle(payload.vehicle_id);
  getMaintenanceLog(payload.maintenance_log_id);
  var odometer = toNumber(payload.odometer_km, null);
  if (odometer === null || odometer < 0) throw new Error('odometer_km must be >= 0');
  var partsCost = toNumber(payload.parts_cost, 0);
  var laborCost = toNumber(payload.labor_cost, 0);
  if (partsCost < 0 || laborCost < 0 || toNumber(payload.total_cost, 0) < 0) throw new Error('cost must be >= 0');
  var totalCost = payload.total_cost === undefined || payload.total_cost === '' ? partsCost + laborCost : toNumber(payload.total_cost, 0);
  var updated = updateRowById('MaintenanceLogs', 'maintenance_log_id', payload.maintenance_log_id, {
    vehicle_id: payload.vehicle_id,
    date: payload.date,
    odometer_km: odometer,
    category: payload.category || '',
    item: payload.item,
    vendor: payload.vendor || '',
    parts: payload.parts || '',
    parts_cost: partsCost,
    labor_cost: laborCost,
    total_cost: roundTo(totalCost, 2),
    next_due_km: payload.next_due_km === undefined || payload.next_due_km === '' ? '' : toNumber(payload.next_due_km, null),
    next_due_date: payload.next_due_date || '',
    note: payload.note || '',
    attachment_file_id: payload.attachment_file_id || '',
    updated_at: nowIso(),
  });
  updateVehicleOdometer(payload.vehicle_id, odometer);
  return updated;
}

function calculateMaintenanceStatus(vehicleId) {
  var vehicle = getVehicle(vehicleId);
  var templates = listServiceTemplates(vehicleId).filter(function (template) {
    return toBoolean(template.enabled, true);
  });
  var logs = listMaintenanceLogs(vehicleId);
  return buildMaintenanceStatus(vehicle, templates, logs);
}

function buildMaintenanceStatus(vehicle, templates, logs) {
  var vehicleId = vehicle.vehicle_id;
  var currentOdometer = toNumber(vehicle.current_odometer, 0);
  var today = todayString();
  var rows = templates.map(function (template) {
    var itemLogs = logs
      .filter(function (log) {
        return String(log.item) === String(template.item);
      })
      .sort(function (a, b) {
        return Number(b.odometer_km || 0) - Number(a.odometer_km || 0);
      });
    var lastLog = itemLogs[0] || null;
    var intervalKm = toNumber(template.interval_km, 0);
    var nextDueKm = lastLog && lastLog.next_due_km ? toNumber(lastLog.next_due_km, null) : null;
    if (nextDueKm === null && lastLog && intervalKm) nextDueKm = toNumber(lastLog.odometer_km, 0) + intervalKm;
    var intervalMonths = toNumber(template.interval_months, 0);
    var nextDueDate = lastLog && lastLog.next_due_date ? lastLog.next_due_date : '';
    if (!nextDueDate && lastLog && intervalMonths) nextDueDate = addMonths(lastLog.date, intervalMonths);
    var remainingKm = nextDueKm === null ? null : nextDueKm - currentOdometer;
    var remainingDays = nextDueDate ? dateDiffDays(today, nextDueDate) : null;
    var status = 'unknown';
    if (remainingKm !== null || remainingDays !== null) {
      status = 'normal';
      if ((remainingKm !== null && remainingKm <= 0) || (remainingDays !== null && remainingDays <= 0)) {
        status = 'overdue';
      } else if (
        (remainingKm !== null && remainingKm <= toNumber(template.warning_km, 0)) ||
        (remainingDays !== null && remainingDays <= toNumber(template.warning_days, 0))
      ) {
        status = 'warning';
      }
    }
    return {
      status_id: 'status_' + vehicleId + '_' + template.template_id,
      vehicle_id: vehicleId,
      item: template.item,
      category: template.category || '',
      last_maintenance_log_id: lastLog ? lastLog.maintenance_log_id : '',
      last_maintenance_km: lastLog ? toNumber(lastLog.odometer_km, 0) : '',
      last_maintenance_date: lastLog ? lastLog.date : '',
      next_due_km: nextDueKm === null ? '' : nextDueKm,
      next_due_date: nextDueDate || '',
      remaining_km: remainingKm === null ? '' : remainingKm,
      remaining_days: remainingDays === null ? '' : remainingDays,
      status: status,
      updated_at: nowIso(),
    };
  });
  var order = { overdue: 0, warning: 1, normal: 2, unknown: 3 };
  return rows.sort(function (a, b) {
    return order[a.status] - order[b.status] || String(a.item).localeCompare(String(b.item));
  });
}
