export type VehicleType = 'car' | 'motorcycle' | 'other';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid' | '';
export type MaintenanceStatusType = 'normal' | 'warning' | 'overdue' | 'unknown';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: null | { code: string; message: string };
}

export interface Vehicle {
  vehicle_id: string;
  name: string;
  type: VehicleType;
  brand?: string;
  model?: string;
  year?: number | '';
  plate_no?: string;
  fuel_type?: FuelType;
  tank_capacity_liters?: number | '';
  current_odometer: number;
  active: boolean;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FuelLog {
  fuel_log_id: string;
  vehicle_id: string;
  date: string;
  odometer_km: number;
  liters: number;
  unit_price: number;
  total_price: number;
  fuel_type?: string;
  station?: string;
  full_tank: boolean;
  last_record_missing?: boolean;
  fuel_fill_percent?: number | '';
  distance_since_last_full?: number | '';
  fuel_consumption_km_l?: number | '';
  cost_per_km?: number | '';
  note?: string;
}

export interface ExpenseLog {
  expense_log_id: string;
  vehicle_id: string;
  title: string;
  date: string;
  odometer_km: number;
  total_price: number;
  note?: string;
}

export interface MaintenanceLog {
  maintenance_log_id: string;
  vehicle_id: string;
  date: string;
  odometer_km: number;
  category?: string;
  item: string;
  vendor?: string;
  parts?: string;
  parts_cost?: number;
  labor_cost?: number;
  total_cost?: number;
  next_due_km?: number | '';
  next_due_date?: string;
  note?: string;
}

export interface ServiceTemplate {
  template_id: string;
  vehicle_id: string;
  item: string;
  category?: string;
  interval_km?: number;
  interval_months?: number;
  warning_km?: number;
  warning_days?: number;
  enabled: boolean;
  note?: string;
}

export interface MaintenanceStatus {
  vehicle_id: string;
  item: string;
  category?: string;
  last_maintenance_km?: number | '';
  last_maintenance_date?: string;
  next_due_km?: number | '';
  next_due_date?: string;
  remaining_km?: number | '';
  remaining_days?: number | '';
  status: MaintenanceStatusType;
}

export interface DashboardData {
  vehicle: Vehicle | null;
  vehicles: Vehicle[];
  maintenance_summary: Record<MaintenanceStatusType, number>;
  maintenance_status: MaintenanceStatus[];
  fuel_summary: {
    avg_fuel_consumption_km_l: number;
    monthly_fuel_cost: number;
    yearly_fuel_cost: number;
    yearly_maintenance_cost: number;
    avg_cost_per_km: number;
  };
  monthly_fuel_costs: Array<{ month: string; total: number }>;
  monthly_maintenance_costs: Array<{ month: string; total: number }>;
  expense_category_totals: {
    all: Array<{ category: string; total: number }>;
    yearly: Array<{ category: string; total: number }>;
  };
  fuel_efficiency_trend: Array<{
    date: string;
    odometer_km: number;
    fuel_consumption_km_l: number;
    cost_per_km?: number | '';
  }>;
  recent_fuel_logs?: FuelLog[];
  recent_maintenance_logs?: MaintenanceLog[];
  recent_expense_logs?: ExpenseLog[];
  recent_logs: Array<{ type: string; date: string; title: string; amount: number; odometer_km: number }>;
}
