import type { ServiceTemplate } from '../types';

export interface MaintenanceItemPreset {
  item: string;
  category: string;
  interval_km: number;
  interval_months: number;
  warning_km: number;
  warning_days: number;
}

export const maintenanceItemPresets: MaintenanceItemPreset[] = [
  { item: '機油', category: 'engine', interval_km: 5000, interval_months: 6, warning_km: 500, warning_days: 14 },
  { item: '機油芯', category: 'engine', interval_km: 10000, interval_months: 12, warning_km: 1000, warning_days: 30 },
  { item: '空氣濾芯', category: 'engine', interval_km: 10000, interval_months: 12, warning_km: 1000, warning_days: 30 },
  { item: '冷氣濾芯', category: 'air', interval_km: 10000, interval_months: 12, warning_km: 1000, warning_days: 30 },
  { item: '煞車油', category: 'brake', interval_km: 40000, interval_months: 24, warning_km: 2000, warning_days: 30 },
  { item: '輪胎對調', category: 'tire', interval_km: 10000, interval_months: 12, warning_km: 1000, warning_days: 30 },
  { item: '輪胎（前輪）', category: 'tire', interval_km: 10000, interval_months: 24, warning_km: 1000, warning_days: 30 },
  { item: '輪胎（後輪）', category: 'tire', interval_km: 10000, interval_months: 24, warning_km: 1000, warning_days: 30 },
  { item: '鏈條', category: 'drivetrain', interval_km: 10000, interval_months: 12, warning_km: 1000, warning_days: 30 },
  { item: '皮帶', category: 'drivetrain', interval_km: 15000, interval_months: 36, warning_km: 1000, warning_days: 60 },
  { item: '冷卻水', category: 'cooling', interval_km: 40000, interval_months: 24, warning_km: 2000, warning_days: 30 },
  { item: '火星塞', category: 'engine', interval_km: 10000, interval_months: 24, warning_km: 1000, warning_days: 30 },
  { item: '變速箱油', category: 'drivetrain', interval_km: 40000, interval_months: 36, warning_km: 3000, warning_days: 60 },
  { item: '差速器油', category: 'drivetrain', interval_km: 40000, interval_months: 36, warning_km: 3000, warning_days: 60 },
  { item: '煞車來另（前）', category: 'brake', interval_km: 12000, interval_months: 24, warning_km: 1000, warning_days: 30 },
  { item: '煞車來另（後）', category: 'brake', interval_km: 12000, interval_months: 24, warning_km: 1000, warning_days: 30 },
  { item: '避震器（前）', category: 'suspension', interval_km: 30000, interval_months: 36, warning_km: 2000, warning_days: 60 },
  { item: '避震器（後）', category: 'suspension', interval_km: 30000, interval_months: 36, warning_km: 2000, warning_days: 60 },
  { item: '驅動齒盤', category: 'drivetrain', interval_km: 10000, interval_months: 24, warning_km: 1000, warning_days: 30 },
  { item: '電瓶', category: 'electric', interval_km: 0, interval_months: 36, warning_km: 0, warning_days: 60 }
];

export function getPresetByItem(item: string): MaintenanceItemPreset | undefined {
  return maintenanceItemPresets.find((preset) => preset.item === item);
}

export function mergeTemplateOptions(templates: ServiceTemplate[]): MaintenanceItemPreset[] {
  const map = new Map<string, MaintenanceItemPreset>();
  maintenanceItemPresets.forEach((preset) => map.set(preset.item, preset));
  templates.forEach((template) => {
    map.set(template.item, {
      item: template.item,
      category: template.category || '',
      interval_km: Number(template.interval_km || 0),
      interval_months: Number(template.interval_months || 0),
      warning_km: Number(template.warning_km || 0),
      warning_days: Number(template.warning_days || 0)
    });
  });
  return Array.from(map.values()).sort((a, b) => a.item.localeCompare(b.item, 'zh-Hant'));
}
