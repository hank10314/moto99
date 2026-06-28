export function today(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateOnly(value: string | Date | undefined | null): string {
  if (!value) return '';
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return `${match[3]}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
  }
  return text;
}

export function formatKm(value: number | string | undefined | null): string {
  return `${formatNumber(value)} km`;
}

export function formatMoney(value: number | string | undefined | null): string {
  const numberValue = Number(value || 0);
  return numberValue.toLocaleString('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

export function formatNumber(value: number | string | undefined | null, digits = 1, fallback = '0.0'): string {
  if (value === undefined || value === null || value === '') return fallback;
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return fallback;
  return numberValue.toLocaleString('zh-TW', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

export function formatLiters(value: number | string | undefined | null): string {
  return `${formatNumber(value)} L`;
}

export function formatPercent(value: number | string | undefined | null): string {
  const formatted = formatNumber(value, 1, '-');
  return formatted === '-' ? formatted : `${formatted}%`;
}

export function formatFuelConsumption(value: number | string | undefined | null): string {
  const formatted = formatNumber(value, 1, '-');
  return formatted === '-' ? formatted : `${formatted} km/L`;
}

export function addMonths(dateString: string, months: number): string {
  const normalized = formatDateOnly(dateString);
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return '';
  date.setMonth(date.getMonth() + months);
  return formatDateOnly(date);
}

export function round(value: number, places = 2): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
