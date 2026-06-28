function getDashboard(vehicleId) {
  var vehicleRows = getRows('Vehicles');
  var vehicles = vehicleRows.filter(function (vehicle) {
    return vehicle.active !== false && String(vehicle.active).toLowerCase() !== 'false';
  });
  var vehicle = vehicleId
    ? vehicleRows.find(function (row) {
        return String(row.vehicle_id) === String(vehicleId);
      })
    : vehicles[0];
  if (vehicleId && !vehicle) throw new Error('Vehicle not found');
  if (!vehicle) {
    return {
      vehicle: null,
      vehicles: [],
      maintenance_summary: { normal: 0, warning: 0, overdue: 0, unknown: 0 },
      maintenance_status: [],
      fuel_summary: {
        avg_fuel_consumption_km_l: 0,
        monthly_fuel_cost: 0,
        yearly_fuel_cost: 0,
        yearly_maintenance_cost: 0,
        avg_cost_per_km: 0,
      },
      monthly_fuel_costs: [],
      monthly_maintenance_costs: [],
      expense_category_totals: { all: [], yearly: [] },
      fuel_efficiency_trend: [],
      recent_fuel_logs: [],
      recent_maintenance_logs: [],
      recent_expense_logs: [],
      recent_logs: [],
    };
  }
  var fuelLogs = sortByDateDesc(
    getRows('FuelLogs').filter(function (log) {
      return String(log.vehicle_id) === String(vehicle.vehicle_id);
    })
  );
  var maintenanceLogs = sortByDateDesc(
    getRows('MaintenanceLogs').filter(function (log) {
      return String(log.vehicle_id) === String(vehicle.vehicle_id);
    })
  );
  var expenseLogs = sortByDateDesc(
    getRows('ExpenseLogs').filter(function (log) {
      return String(log.vehicle_id) === String(vehicle.vehicle_id);
    })
  );
  var templates = getRows('ServiceTemplates').filter(function (template) {
    return String(template.vehicle_id) === String(vehicle.vehicle_id) && toBoolean(template.enabled, true);
  });
  var statuses = buildMaintenanceStatus(vehicle, templates, maintenanceLogs);
  var maintenanceSummary = statuses.reduce(
    function (acc, row) {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    },
    { normal: 0, warning: 0, overdue: 0, unknown: 0 }
  );
  var yearPrefix = todayString().slice(0, 4);
  var monthPrefix = todayString().slice(0, 7);
  var fuelEfficiencyRows = buildFuelEfficiencyRows(fuelLogs, vehicle.tank_capacity_liters);
  var monthlyFuelCost = fuelLogs
    .filter(function (log) {
      return dateString(log.date).slice(0, 7) === monthPrefix;
    })
    .reduce(function (sum, log) {
      return sum + toNumber(log.total_price, 0);
    }, 0);
  var yearlyFuelCost = fuelLogs
    .filter(function (log) {
      return dateString(log.date).slice(0, 4) === yearPrefix;
    })
    .reduce(function (sum, log) {
      return sum + toNumber(log.total_price, 0);
    }, 0);
  var yearlyMaintenanceCost = maintenanceLogs
    .filter(function (log) {
      return dateString(log.date).slice(0, 4) === yearPrefix;
    })
    .reduce(function (sum, log) {
      return sum + toNumber(log.total_cost, 0);
    }, 0);

  return {
    vehicle: vehicle,
    vehicles: vehicles,
    maintenance_summary: maintenanceSummary,
    maintenance_status: statuses
      .filter(function (status) {
        return !!status.last_maintenance_log_id;
      })
      .slice(0, 8),
    fuel_summary: {
      avg_fuel_consumption_km_l: average(fuelEfficiencyRows, 'fuel_consumption_km_l'),
      monthly_fuel_cost: roundTo(monthlyFuelCost, 2),
      yearly_fuel_cost: roundTo(yearlyFuelCost, 2),
      yearly_maintenance_cost: roundTo(yearlyMaintenanceCost, 2),
      avg_cost_per_km: average(fuelEfficiencyRows, 'cost_per_km'),
    },
    monthly_fuel_costs: groupMonthlyCost(fuelLogs, 'total_price'),
    monthly_maintenance_costs: groupMonthlyCost(maintenanceLogs, 'total_cost'),
    expense_category_totals: buildExpenseCategoryTotals(fuelLogs, maintenanceLogs, expenseLogs, yearPrefix),
    fuel_efficiency_trend: buildFuelEfficiencyTrend(fuelEfficiencyRows),
    recent_fuel_logs: fuelLogs.slice(0, 5),
    recent_maintenance_logs: maintenanceLogs.slice(0, 5),
    recent_expense_logs: expenseLogs.slice(0, 5),
    recent_logs: buildRecentLogs(fuelLogs, maintenanceLogs, expenseLogs),
  };
}

function buildExpenseCategoryTotals(fuelLogs, maintenanceLogs, expenseLogs, yearPrefix) {
  return {
    all: buildExpenseCategoryRows(fuelLogs, maintenanceLogs, expenseLogs),
    yearly: buildExpenseCategoryRows(
      filterRowsByYear(fuelLogs, yearPrefix),
      filterRowsByYear(maintenanceLogs, yearPrefix),
      filterRowsByYear(expenseLogs, yearPrefix)
    ),
  };
}

function filterRowsByYear(rows, yearPrefix) {
  return rows.filter(function (row) {
    return dateString(row.date).slice(0, 4) === yearPrefix;
  });
}

function buildExpenseCategoryRows(fuelLogs, maintenanceLogs, expenseLogs) {
  var rows = [
    {
      category: '加油',
      total: sumRows(fuelLogs, 'total_price'),
    },
    {
      category: '保養',
      total: sumRows(maintenanceLogs, 'total_cost'),
    },
    {
      category: '其他費用',
      total: sumRows(expenseLogs, 'total_price'),
    },
  ];
  return rows.filter(function (row) {
    return row.total > 0;
  });
}

function sumRows(rows, field) {
  return roundTo(
    rows.reduce(function (sum, row) {
      return sum + toNumber(row[field], 0);
    }, 0),
    2
  );
}

function buildFuelEfficiencyTrend(fuelEfficiencyRows) {
  return fuelEfficiencyRows
    .sort(function (a, b) {
      var dateOrder = dateString(a.date).localeCompare(dateString(b.date));
      if (dateOrder !== 0) return dateOrder;
      return toNumber(a.odometer_km, 0) - toNumber(b.odometer_km, 0);
    })
    .map(function (log) {
      return {
        date: dateString(log.date),
        odometer_km: toNumber(log.odometer_km, 0),
        fuel_consumption_km_l: roundTo(toNumber(log.fuel_consumption_km_l, 0), 2),
        cost_per_km: log.cost_per_km === '' ? '' : roundTo(toNumber(log.cost_per_km, 0), 2),
      };
    });
}

function buildFuelEfficiencyRows(fuelLogs, tankCapacityLiters) {
  var rows = [];
  for (var index = 0; index < fuelLogs.length - 1; index += 1) {
    var newerLog = fuelLogs[index];
    var previousLog = fuelLogs[index + 1];
    if (toBoolean(newerLog.last_record_missing, false) === true) continue;
    var distance = toNumber(newerLog.odometer_km, 0) - toNumber(previousLog.odometer_km, 0);
    var liters = calculateGaugeAdjustedFuelUsedLiters(
      toNumber(newerLog.liters, 0),
      getFuelGaugePercent(newerLog),
      getFuelGaugePercent(previousLog),
      tankCapacityLiters
    );
    if (distance <= 0 || liters <= 0) continue;
    var fuelCost = liters * toNumber(newerLog.unit_price, 0);
    rows.push({
      date: newerLog.date,
      odometer_km: toNumber(newerLog.odometer_km, 0),
      fuel_consumption_km_l: roundTo(distance / liters, 2),
      cost_per_km: roundTo(fuelCost / distance, 2),
    });
  }
  return rows;
}

function average(rows, field) {
  if (!rows.length) return 0;
  var sum = rows.reduce(function (acc, row) {
    return acc + toNumber(row[field], 0);
  }, 0);
  return roundTo(sum / rows.length, 2);
}

function groupMonthlyCost(rows, field) {
  var map = {};
  rows.forEach(function (row) {
    if (!row.date) return;
    var month = dateString(row.date).slice(0, 7);
    if (!month) return;
    map[month] = (map[month] || 0) + toNumber(row[field], 0);
  });
  return Object.keys(map)
    .sort()
    .map(function (month) {
      return { month: month, total: roundTo(map[month], 2) };
    });
}

function buildRecentLogs(fuelLogs, maintenanceLogs, expenseLogs) {
  var fuel = fuelLogs.map(function (log) {
    return { type: 'fuel', date: log.date, title: '加油', amount: log.total_price, odometer_km: log.odometer_km };
  });
  var maintenance = maintenanceLogs.map(function (log) {
    return { type: 'maintenance', date: log.date, title: log.item, amount: log.total_cost, odometer_km: log.odometer_km };
  });
  var expense = (expenseLogs || []).map(function (log) {
    return { type: 'expense', date: log.date, title: log.title, amount: log.total_price, odometer_km: log.odometer_km };
  });
  return fuel
    .concat(maintenance)
    .concat(expense)
    .sort(function (a, b) {
      var aDate = toDate(a.date);
      var bDate = toDate(b.date);
      var aTime = aDate ? aDate.getTime() : 0;
      var bTime = bDate ? bDate.getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 10);
}
