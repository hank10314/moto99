function listVehicles() {
  return getRows('Vehicles').filter(function (vehicle) {
    return vehicle.active !== false && String(vehicle.active).toLowerCase() !== 'false';
  });
}

function getVehicle(vehicleId) {
  var vehicle = findById('Vehicles', 'vehicle_id', vehicleId);
  if (!vehicle) throw new Error('Vehicle not found');
  return vehicle;
}

function createVehicle(payload) {
  requireFields(payload, ['name', 'type']);
  var odometer = toNumber(payload.current_odometer, 0);
  if (odometer < 0) throw new Error('current_odometer must be >= 0');

  var timestamp = nowIso();
  var vehicle = {
    vehicle_id: generateId('veh'),
    name: payload.name,
    type: payload.type,
    brand: payload.brand || '',
    model: payload.model || '',
    year: payload.year || '',
    plate_no: payload.plate_no || '',
    fuel_type: payload.fuel_type || '',
    tank_capacity_liters: toNumber(payload.tank_capacity_liters, ''),
    current_odometer: odometer,
    active: true,
    note: payload.note || '',
    created_at: timestamp,
    updated_at: timestamp,
  };
  appendRow('Vehicles', vehicle);

  createOdometerLog({
    vehicle_id: vehicle.vehicle_id,
    date: todayString(),
    odometer_km: odometer,
    source_type: 'manual',
    source_id: vehicle.vehicle_id,
    note: 'Initial odometer',
  });

  if (payload.create_default_templates !== false) {
    createDefaultTemplatesForVehicle(vehicle);
  }
  return vehicle;
}

function updateVehicle(payload) {
  requireFields(payload, ['vehicle_id']);
  var existing = getVehicle(payload.vehicle_id);
  var odometer = payload.current_odometer !== undefined ? toNumber(payload.current_odometer, existing.current_odometer) : existing.current_odometer;
  if (odometer < 0) throw new Error('current_odometer must be >= 0');
  return updateRowById('Vehicles', 'vehicle_id', payload.vehicle_id, {
    name: payload.name !== undefined ? payload.name : existing.name,
    type: payload.type !== undefined ? payload.type : existing.type,
    brand: payload.brand !== undefined ? payload.brand : existing.brand,
    model: payload.model !== undefined ? payload.model : existing.model,
    year: payload.year !== undefined ? payload.year : existing.year,
    plate_no: payload.plate_no !== undefined ? payload.plate_no : existing.plate_no,
    fuel_type: payload.fuel_type !== undefined ? payload.fuel_type : existing.fuel_type,
    tank_capacity_liters:
      payload.tank_capacity_liters !== undefined ? toNumber(payload.tank_capacity_liters, '') : existing.tank_capacity_liters,
    current_odometer: odometer,
    active: payload.active !== undefined ? toBoolean(payload.active, true) : existing.active,
    note: payload.note !== undefined ? payload.note : existing.note,
    updated_at: nowIso(),
  });
}

function deactivateVehicle(payload) {
  requireFields(payload, ['vehicle_id']);
  return updateRowById('Vehicles', 'vehicle_id', payload.vehicle_id, { active: false, updated_at: nowIso() });
}

function updateVehicleOdometer(vehicleId, odometerKm) {
  var vehicle = getVehicle(vehicleId);
  var odometer = toNumber(odometerKm, 0);
  if (odometer > toNumber(vehicle.current_odometer, 0)) {
    updateRowById('Vehicles', 'vehicle_id', vehicleId, { current_odometer: odometer, updated_at: nowIso() });
  }
}
