import type { FuelLog } from '../types';

export type FuelLogWithDisplayConsumption = FuelLog & {
  display_fuel_consumption_km_l?: number | '';
  display_fuel_fill_percent?: number | '';
};

export function shiftFuelConsumptionToPreviousTank<T extends FuelLog>(
  logs: T[],
  tankCapacityLiters: number | string | undefined | null = 0
): Array<T & FuelLogWithDisplayConsumption> {
  const sortedLogs = sortFuelLogs(logs);
  return sortedLogs.map((log, index) => ({
    ...log,
    display_fuel_fill_percent: getGaugePercent(log) ?? '',
    display_fuel_consumption_km_l: calculateDisplayConsumption(sortedLogs, index, Number(tankCapacityLiters || 0))
  }));
}

export function sortFuelLogs<T extends FuelLog>(logs: T[]): T[] {
  return [...logs].sort((a, b) => {
    const dateDiff = getDateTime(b.date) - getDateTime(a.date);
    if (dateDiff !== 0) return dateDiff;
    return Number(b.odometer_km || 0) - Number(a.odometer_km || 0);
  });
}

function calculateDisplayConsumption<T extends FuelLog>(logs: T[], index: number, tankCapacityLiters: number): number | '' {
  if (index <= 0) return '';
  const newerLog = logs[index - 1];
  const previousLog = logs[index];
  if (isTrue(newerLog.last_record_missing)) return '';
  const distance = Number(newerLog.odometer_km || 0) - Number(previousLog.odometer_km || 0);
  const fuelUsedLiters = calculateFuelUsedLiters(newerLog, previousLog, tankCapacityLiters);
  if (distance <= 0 || fuelUsedLiters <= 0) return '';
  return distance / fuelUsedLiters;
}

function isTrue(value: unknown): boolean {
  return value === true || String(value).toLowerCase() === 'true';
}

function calculateFuelUsedLiters(currentLog: FuelLog, previousLog: FuelLog, tankCapacityLiters: number): number {
  const addedLiters = Number(currentLog.liters || 0);
  const currentPercent = getGaugePercent(currentLog);
  const previousPercent = getGaugePercent(previousLog);
  if (tankCapacityLiters > 0 && currentPercent !== null && previousPercent !== null) {
    return addedLiters + (tankCapacityLiters * (previousPercent - currentPercent)) / 100;
  }
  return addedLiters;
}

function getGaugePercent(log: FuelLog): number | null {
  const percent = toOptionalNumber(log.fuel_fill_percent);
  if (percent !== null) return percent;
  if (isTrue(log.full_tank)) return 100;
  return null;
}

function toOptionalNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? null : numberValue;
}

function getDateTime(value: unknown): number {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  const text = String(value);
  const ymd = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])).getTime();
  const mdy = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdy) return new Date(Number(mdy[3]), Number(mdy[1]) - 1, Number(mdy[2])).getTime();
  const parsed = new Date(text).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}
