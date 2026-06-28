function listExpenseLogs(vehicleId) {
  return sortByDateDesc(
    getRows('ExpenseLogs').filter(function (log) {
      return !vehicleId || String(log.vehicle_id) === String(vehicleId);
    })
  );
}

function getExpenseLog(expenseLogId) {
  var log = findById('ExpenseLogs', 'expense_log_id', expenseLogId);
  if (!log) throw new Error('Expense log not found');
  return log;
}

function createExpenseLog(payload) {
  requireFields(payload, ['vehicle_id', 'title', 'date', 'odometer_km', 'total_price']);
  getVehicle(payload.vehicle_id);
  var odometer = toNumber(payload.odometer_km, null);
  var totalPrice = toNumber(payload.total_price, null);
  if (odometer === null || odometer < 0) throw new Error('odometer_km must be >= 0');
  if (totalPrice === null || totalPrice < 0) throw new Error('total_price must be >= 0');
  var timestamp = nowIso();
  var log = {
    expense_log_id: generateId('exp'),
    vehicle_id: payload.vehicle_id,
    title: payload.title,
    date: payload.date,
    odometer_km: odometer,
    total_price: roundTo(totalPrice, 2),
    note: payload.note || '',
    created_at: timestamp,
    updated_at: timestamp,
  };
  appendRow('ExpenseLogs', log);
  createOdometerLog({
    vehicle_id: payload.vehicle_id,
    date: payload.date,
    odometer_km: odometer,
    source_type: 'expense',
    source_id: log.expense_log_id,
    note: payload.title,
  });
  return log;
}

function updateExpenseLog(payload) {
  requireFields(payload, ['expense_log_id', 'vehicle_id', 'title', 'date', 'odometer_km', 'total_price']);
  getVehicle(payload.vehicle_id);
  getExpenseLog(payload.expense_log_id);
  var odometer = toNumber(payload.odometer_km, null);
  var totalPrice = toNumber(payload.total_price, null);
  if (odometer === null || odometer < 0) throw new Error('odometer_km must be >= 0');
  if (totalPrice === null || totalPrice < 0) throw new Error('total_price must be >= 0');
  var updated = updateRowById('ExpenseLogs', 'expense_log_id', payload.expense_log_id, {
    vehicle_id: payload.vehicle_id,
    title: payload.title,
    date: payload.date,
    odometer_km: odometer,
    total_price: roundTo(totalPrice, 2),
    note: payload.note || '',
    updated_at: nowIso(),
  });
  updateVehicleOdometer(payload.vehicle_id, odometer);
  return updated;
}
