function listOdometerLogs(vehicleId) {
  return sortByDateDesc(
    getRows('OdometerLogs').filter(function (log) {
      return !vehicleId || String(log.vehicle_id) === String(vehicleId);
    })
  );
}

function createOdometerLog(payload) {
  requireFields(payload, ['vehicle_id', 'date', 'odometer_km', 'source_type']);
  getVehicle(payload.vehicle_id);
  var odometer = toNumber(payload.odometer_km, null);
  if (odometer === null || odometer < 0) throw new Error('odometer_km must be >= 0');
  var log = {
    odometer_log_id: generateId('odo'),
    vehicle_id: payload.vehicle_id,
    date: payload.date,
    odometer_km: odometer,
    source_type: payload.source_type,
    source_id: payload.source_id || '',
    note: payload.note || '',
    created_at: nowIso(),
  };
  appendRow('OdometerLogs', log);
  updateVehicleOdometer(payload.vehicle_id, odometer);
  return log;
}
