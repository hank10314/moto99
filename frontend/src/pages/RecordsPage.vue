<template>
  <div v-loading="loading">
    <div class="page-actions dashboard-actions">
      <el-select v-model="selectedVehicleId" placeholder="選擇車輛" style="min-width: 240px" @change="loadRecords">
        <el-option v-for="vehicle in vehicles" :key="vehicle.vehicle_id" :label="vehicle.name" :value="vehicle.vehicle_id" />
      </el-select>
      <el-button :icon="Refresh" @click="loadRecords">重新整理</el-button>
      <el-button type="primary" :icon="Plus" @click="newRecord">新增{{ activeRecordLabel }}</el-button>
    </div>

    <el-card class="table-card" shadow="never">
      <el-tabs v-model="activeTab" @tab-change="syncRouteTab">
        <el-tab-pane label="加油紀錄" name="fuel">
          <el-table :data="fuelLogsForDisplay" @row-click="editFuel">
            <el-table-column label="日期" width="120">
              <template #default="{ row }">{{ formatDateOnly(row.date) }}</template>
            </el-table-column>
            <el-table-column label="里程" align="right">
              <template #default="{ row }">{{ formatKm(row.odometer_km) }}</template>
            </el-table-column>
            <el-table-column label="公升" align="right">
              <template #default="{ row }">{{ formatLiters(row.liters) }}</template>
            </el-table-column>
            <el-table-column label="油量%" align="right">
              <template #default="{ row }">{{ formatPercent(row.display_fuel_fill_percent) }}</template>
            </el-table-column>
            <el-table-column label="單價" align="right">
              <template #default="{ row }">{{ formatNumber(row.unit_price) }}</template>
            </el-table-column>
            <el-table-column label="總金額" align="right">
              <template #default="{ row }">{{ formatMoney(row.total_price) }}</template>
            </el-table-column>
            <el-table-column label="km/L" align="right">
              <template #default="{ row }">{{ formatNumber(row.display_fuel_consumption_km_l, 1, '-') }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="保養紀錄" name="maintenance">
          <el-table :data="maintenanceLogs" @row-click="editMaintenance">
            <el-table-column label="日期" width="120">
              <template #default="{ row }">{{ formatDateOnly(row.date) }}</template>
            </el-table-column>
            <el-table-column prop="item" label="項目" min-width="130" />
            <el-table-column prop="vendor" label="保養方式" width="110" />
            <el-table-column label="里程" align="right">
              <template #default="{ row }">{{ formatKm(row.odometer_km) }}</template>
            </el-table-column>
            <el-table-column label="項目費用" align="right">
              <template #default="{ row }">{{ formatMoney(row.parts_cost) }}</template>
            </el-table-column>
            <el-table-column label="工資" align="right">
              <template #default="{ row }">{{ formatMoney(row.labor_cost) }}</template>
            </el-table-column>
            <el-table-column label="總金額" align="right">
              <template #default="{ row }">{{ formatMoney(row.total_cost) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="費用紀錄" name="expense">
          <el-table :data="expenseLogs" @row-click="editExpense">
            <el-table-column label="日期" width="120">
              <template #default="{ row }">{{ formatDateOnly(row.date) }}</template>
            </el-table-column>
            <el-table-column prop="title" label="標題" min-width="150" />
            <el-table-column label="里程" align="right">
              <template #default="{ row }">{{ formatKm(row.odometer_km) }}</template>
            </el-table-column>
            <el-table-column label="總額" align="right">
              <template #default="{ row }">{{ formatMoney(row.total_price) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus, Refresh } from '@element-plus/icons-vue';
import { apiGet } from '../api/client';
import type { ExpenseLog, FuelLog, MaintenanceLog, Vehicle } from '../types';
import { formatDateOnly, formatKm, formatLiters, formatMoney, formatNumber, formatPercent } from '../utils/format';
import { shiftFuelConsumptionToPreviousTank } from '../utils/fuel';

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const vehicles = ref<Vehicle[]>([]);
const selectedVehicleId = ref(String(route.query.vehicle_id || ''));
const activeTab = ref<'fuel' | 'maintenance' | 'expense'>(
  route.query.tab === 'maintenance' || route.query.tab === 'expense' ? route.query.tab : 'fuel'
);
const fuelLogs = ref<FuelLog[]>([]);
const maintenanceLogs = ref<MaintenanceLog[]>([]);
const expenseLogs = ref<ExpenseLog[]>([]);
const selectedVehicle = computed(() => vehicles.value.find((vehicle) => vehicle.vehicle_id === selectedVehicleId.value));
const fuelLogsForDisplay = computed(() => shiftFuelConsumptionToPreviousTank(fuelLogs.value, selectedVehicle.value?.tank_capacity_liters));
const activeRecordLabel = computed(() => {
  if (activeTab.value === 'fuel') return '加油';
  if (activeTab.value === 'maintenance') return '保養';
  return '費用';
});

async function loadExpenseLogsSafe(vehicleId: string): Promise<ExpenseLog[]> {
  try {
    return await apiGet<ExpenseLog[]>('listExpenseLogs', { vehicle_id: vehicleId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('Unknown GET action') || message.includes('ExpenseLogs')) return [];
    throw error;
  }
}

async function loadRecords() {
  loading.value = true;
  try {
    if (!vehicles.value.length) vehicles.value = await apiGet<Vehicle[]>('listVehicles');
    if (!selectedVehicleId.value) selectedVehicleId.value = vehicles.value[0]?.vehicle_id || '';
    if (!selectedVehicleId.value) {
      fuelLogs.value = [];
      maintenanceLogs.value = [];
      expenseLogs.value = [];
      return;
    }
    const [fetchedFuelLogs, fetchedMaintenanceLogs, fetchedExpenseLogs] = await Promise.all([
      apiGet<FuelLog[]>('listFuelLogs', { vehicle_id: selectedVehicleId.value }),
      apiGet<MaintenanceLog[]>('listMaintenanceLogs', { vehicle_id: selectedVehicleId.value }),
      loadExpenseLogsSafe(selectedVehicleId.value)
    ]);
    fuelLogs.value = fetchedFuelLogs;
    maintenanceLogs.value = fetchedMaintenanceLogs;
    expenseLogs.value = fetchedExpenseLogs;
    syncRouteTab();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    loading.value = false;
  }
}

function syncRouteTab() {
  router.replace({ name: 'records', query: { vehicle_id: selectedVehicleId.value, tab: activeTab.value } });
}

function newRecord() {
  router.push({
    name: activeTab.value === 'fuel' ? 'fuel-new' : activeTab.value === 'maintenance' ? 'maintenance-new' : 'expense-new',
    query: { vehicle_id: selectedVehicleId.value }
  });
}

function editFuel(row: FuelLog) {
  router.push({ name: 'fuel-edit', params: { fuel_log_id: row.fuel_log_id }, query: { vehicle_id: row.vehicle_id } });
}

function editMaintenance(row: MaintenanceLog) {
  router.push({ name: 'maintenance-edit', params: { maintenance_log_id: row.maintenance_log_id }, query: { vehicle_id: row.vehicle_id } });
}

function editExpense(row: ExpenseLog) {
  router.push({ name: 'expense-edit', params: { expense_log_id: row.expense_log_id }, query: { vehicle_id: row.vehicle_id } });
}

onMounted(loadRecords);
</script>
