function listFuelLogs(vehicleId) {
  return sortByDateDesc(
    getRows('FuelLogs').filter(function (log) {
      return !vehicleId || String(log.vehicle_id) === String(vehicleId);
    })
  );
}

function getFuelLog(fuelLogId) {
  var log = findById('FuelLogs', 'fuel_log_id', fuelLogId);
  if (!log) throw new Error('Fuel log not found');
  return log;
}

function normalizeFuelPrice(payload) {
  var liters = toNumber(payload.liters, null);
  var unitPrice = toNumber(payload.unit_price, null);
  var totalPrice = toNumber(payload.total_price, null);
  if (liters !== null && liters <= 0) throw new Error('liters must be > 0');
  if (liters === null && unitPrice && totalPrice) liters = totalPrice / unitPrice;
  if (unitPrice === null && liters && totalPrice) unitPrice = totalPrice / liters;
  if (totalPrice === null && liters && unitPrice) totalPrice = liters * unitPrice;
  if (!liters || (!unitPrice && !totalPrice)) throw new Error('liters and unit_price or total_price are required');
  return {
    liters: roundTo(liters, 3),
    unit_price: roundTo(unitPrice, 3),
    total_price: roundTo(totalPrice, 2),
  };
}

function createFuelLog(payload) {
  requireFields(payload, ['vehicle_id', 'date', 'odometer_km']);
  var vehicle = getVehicle(payload.vehicle_id);
  var odometer = toNumber(payload.odometer_km, null);
  if (odometer === null || odometer < 0) throw new Error('odometer_km must be >= 0');
  var price = normalizeFuelPrice(payload);
  var lastRecordMissing = toBoolean(payload.last_record_missing, false);
  var fullTank = toBoolean(payload.full_tank, true);
  var previousFull = null;
  if (!lastRecordMissing) {
    previousFull = listFuelLogs(payload.vehicle_id)
      .filter(function (log) {
        return Number(log.odometer_km) < odometer;
      })
      .sort(function (a, b) {
        return Number(b.odometer_km) - Number(a.odometer_km);
      })[0];
  }
  var fuelFillPercent = toNumber(payload.fuel_fill_percent, fullTank ? 100 : '');
  var distance = previousFull ? odometer - Number(previousFull.odometer_km) : null;
  var fuelUsedLiters = previousFull
    ? calculateGaugeAdjustedFuelUsedLiters(price.liters, fuelFillPercent, getFuelGaugePercent(previousFull), vehicle.tank_capacity_liters)
    : null;
  var fuelConsumption = distance && distance > 0 && fuelUsedLiters && fuelUsedLiters > 0 ? distance / fuelUsedLiters : null;
  var fuelCost = fuelUsedLiters && fuelUsedLiters > 0 ? fuelUsedLiters * price.unit_price : null;
  var costPerKm = distance && distance > 0 && fuelCost ? fuelCost / distance : null;
  var timestamp = nowIso();
  var log = {
    fuel_log_id: generateId('fuel'),
    vehicle_id: payload.vehicle_id,
    date: payload.date,
    odometer_km: odometer,
    liters: price.liters,
    unit_price: price.unit_price,
    total_price: price.total_price,
    fuel_type: payload.fuel_type || '',
    station: payload.station || '',
    full_tank: fullTank,
    last_record_missing: lastRecordMissing,
    fuel_fill_percent: fuelFillPercent,
    distance_since_last_full: distance ? roundTo(distance, 1) : '',
    fuel_consumption_km_l: fuelConsumption ? roundTo(fuelConsumption, 2) : '',
    cost_per_km: costPerKm ? roundTo(costPerKm, 2) : '',
    note: payload.note || '',
    attachment_file_id: payload.attachment_file_id || '',
    created_at: timestamp,
    updated_at: timestamp,
  };
  appendRow('FuelLogs', log);
  createOdometerLog({
    vehicle_id: payload.vehicle_id,
    date: payload.date,
    odometer_km: odometer,
    source_type: 'fuel',
    source_id: log.fuel_log_id,
    note: payload.station || '',
  });
  return log;
}

function calculateFuelDerivedFields(payload, excludeFuelLogId, vehicle) {
  var odometer = toNumber(payload.odometer_km, null);
  if (odometer === null || odometer < 0) throw new Error('odometer_km must be >= 0');
  var price = normalizeFuelPrice(payload);
  var lastRecordMissing = toBoolean(payload.last_record_missing, false);
  var fullTank = toBoolean(payload.full_tank, true);
  var previousFull = null;
  if (!lastRecordMissing) {
    previousFull = listFuelLogs(payload.vehicle_id)
      .filter(function (log) {
        return (
          String(log.fuel_log_id) !== String(excludeFuelLogId || '') &&
          Number(log.odometer_km) < odometer
        );
      })
      .sort(function (a, b) {
        return Number(b.odometer_km) - Number(a.odometer_km);
      })[0];
  }
  var fuelFillPercent = toNumber(payload.fuel_fill_percent, fullTank ? 100 : '');
  var distance = previousFull ? odometer - Number(previousFull.odometer_km) : null;
  var fuelUsedLiters = previousFull
    ? calculateGaugeAdjustedFuelUsedLiters(price.liters, fuelFillPercent, getFuelGaugePercent(previousFull), vehicle.tank_capacity_liters)
    : null;
  var fuelConsumption = distance && distance > 0 && fuelUsedLiters && fuelUsedLiters > 0 ? distance / fuelUsedLiters : null;
  var fuelCost = fuelUsedLiters && fuelUsedLiters > 0 ? fuelUsedLiters * price.unit_price : null;
  var costPerKm = distance && distance > 0 && fuelCost ? fuelCost / distance : null;
  return {
    odometer_km: odometer,
    liters: price.liters,
    unit_price: price.unit_price,
    total_price: price.total_price,
    full_tank: fullTank,
    last_record_missing: lastRecordMissing,
    fuel_fill_percent: fuelFillPercent,
    distance_since_last_full: distance ? roundTo(distance, 1) : '',
    fuel_consumption_km_l: fuelConsumption ? roundTo(fuelConsumption, 2) : '',
    cost_per_km: costPerKm ? roundTo(costPerKm, 2) : '',
  };
}

function updateFuelLog(payload) {
  requireFields(payload, ['fuel_log_id', 'vehicle_id', 'date', 'odometer_km']);
  var vehicle = getVehicle(payload.vehicle_id);
  getFuelLog(payload.fuel_log_id);
  var derived = calculateFuelDerivedFields(payload, payload.fuel_log_id, vehicle);
  var patch = {
    vehicle_id: payload.vehicle_id,
    date: payload.date,
    odometer_km: derived.odometer_km,
    liters: derived.liters,
    unit_price: derived.unit_price,
    total_price: derived.total_price,
    fuel_type: payload.fuel_type || '',
    station: payload.station || '',
    full_tank: derived.full_tank,
    last_record_missing: derived.last_record_missing,
    fuel_fill_percent: derived.fuel_fill_percent,
    distance_since_last_full: derived.distance_since_last_full,
    fuel_consumption_km_l: derived.fuel_consumption_km_l,
    cost_per_km: derived.cost_per_km,
    note: payload.note || '',
    attachment_file_id: payload.attachment_file_id || '',
    updated_at: nowIso(),
  };
  var updated = updateRowById('FuelLogs', 'fuel_log_id', payload.fuel_log_id, patch);
  updateVehicleOdometer(payload.vehicle_id, derived.odometer_km);
  return updated;
}
