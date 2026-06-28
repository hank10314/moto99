function listServiceTemplates(vehicleId) {
  return getRows('ServiceTemplates').filter(function (template) {
    return !vehicleId || String(template.vehicle_id) === String(vehicleId);
  });
}

function createServiceTemplate(payload) {
  requireFields(payload, ['vehicle_id', 'item']);
  getVehicle(payload.vehicle_id);
  var intervalKm = toNumber(payload.interval_km, 0);
  var intervalMonths = toNumber(payload.interval_months, 0);
  if (!intervalKm && !intervalMonths) throw new Error('interval_km or interval_months is required');
  if (toNumber(payload.warning_km, 0) < 0 || toNumber(payload.warning_days, 0) < 0) {
    throw new Error('warning values must be >= 0');
  }
  var timestamp = nowIso();
  var template = {
    template_id: generateId('tmpl'),
    vehicle_id: payload.vehicle_id,
    item: payload.item,
    category: payload.category || '',
    interval_km: intervalKm,
    interval_months: intervalMonths,
    warning_km: toNumber(payload.warning_km, 0),
    warning_days: toNumber(payload.warning_days, 0),
    enabled: payload.enabled === undefined ? true : toBoolean(payload.enabled, true),
    note: payload.note || '',
    created_at: timestamp,
    updated_at: timestamp,
  };
  appendRow('ServiceTemplates', template);
  return template;
}

function updateServiceTemplate(payload) {
  requireFields(payload, ['template_id']);
  var existing = findById('ServiceTemplates', 'template_id', payload.template_id);
  if (!existing) throw new Error('Service template not found');
  var patch = Object.assign({}, existing, payload, { updated_at: nowIso() });
  delete patch._rowNumber;
  patch.interval_km = toNumber(patch.interval_km, 0);
  patch.interval_months = toNumber(patch.interval_months, 0);
  patch.warning_km = toNumber(patch.warning_km, 0);
  patch.warning_days = toNumber(patch.warning_days, 0);
  patch.enabled = toBoolean(patch.enabled, true);
  return updateRowById('ServiceTemplates', 'template_id', payload.template_id, patch);
}

function createDefaultTemplatesForVehicle(vehicle) {
  var defaults = DEFAULT_SERVICE_TEMPLATES[vehicle.type] || [];
  defaults.forEach(function (entry) {
    createServiceTemplate({
      vehicle_id: vehicle.vehicle_id,
      item: entry[0],
      category: entry[1],
      interval_km: entry[2],
      interval_months: entry[3],
      warning_km: entry[4],
      warning_days: entry[5],
      enabled: true,
      note: 'Default template',
    });
  });
}
