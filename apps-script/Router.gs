function routeGet(action, params) {
  switch (action) {
    case 'initDatabase':
      return initDatabase();
    case 'listVehicles':
      return listVehicles();
    case 'getVehicle':
      return getVehicle(params.vehicle_id);
    case 'listOdometerLogs':
      return listOdometerLogs(params.vehicle_id);
    case 'listFuelLogs':
      return listFuelLogs(params.vehicle_id);
    case 'getFuelLog':
      return getFuelLog(params.fuel_log_id);
    case 'listMaintenanceLogs':
      return listMaintenanceLogs(params.vehicle_id);
    case 'getMaintenanceLog':
      return getMaintenanceLog(params.maintenance_log_id);
    case 'listExpenseLogs':
      return listExpenseLogs(params.vehicle_id);
    case 'getExpenseLog':
      return getExpenseLog(params.expense_log_id);
    case 'listServiceTemplates':
      return listServiceTemplates(params.vehicle_id);
    case 'maintenanceStatus':
      return calculateMaintenanceStatus(params.vehicle_id);
    case 'dashboard':
      return getDashboard(params.vehicle_id);
    default:
      throw new Error('Unknown GET action: ' + action);
  }
}

function routePost(action, payload) {
  switch (action) {
    case 'initDatabase':
      return initDatabase();
    case 'createVehicle':
      return createVehicle(payload);
    case 'updateVehicle':
      return updateVehicle(payload);
    case 'deactivateVehicle':
      return deactivateVehicle(payload);
    case 'createOdometerLog':
      return createOdometerLog(payload);
    case 'createFuelLog':
      return createFuelLog(payload);
    case 'updateFuelLog':
      return updateFuelLog(payload);
    case 'createMaintenanceLog':
      return createMaintenanceLog(payload);
    case 'updateMaintenanceLog':
      return updateMaintenanceLog(payload);
    case 'createExpenseLog':
      return createExpenseLog(payload);
    case 'updateExpenseLog':
      return updateExpenseLog(payload);
    case 'createServiceTemplate':
      return createServiceTemplate(payload);
    case 'updateServiceTemplate':
      return updateServiceTemplate(payload);
    default:
      throw new Error('Unknown POST action: ' + action);
  }
}
