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
        <el-tab-pane name="fuel">
          <template #label>
            <span class="tab-label-with-icon"><el-icon><Pouring /></el-icon>加油紀錄</span>
          </template>
          <el-table class="desktop-table" :data="fuelLogsForDisplay" @row-click="editFuel">
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
          <div class="mobile-record-list">
            <div v-if="fuelLogsForDisplay.length" class="record-card-list">
              <button v-for="row in fuelLogsForDisplay" :key="row.fuel_log_id" class="record-card" type="button" @click="editFuel(row)">
                <span class="record-card__label">加油紀錄</span>
                <div class="record-card__header">
                  <div class="record-card__title">{{ formatDateOnly(row.date) }}</div>
                  <div class="record-card__value">{{ formatMoney(row.total_price) }}</div>
                </div>
                <div class="record-card__details">
                  <span>{{ formatKm(row.odometer_km) }}</span>
                  <span>{{ formatLiters(row.liters) }}</span>
                  <span>{{ formatNumber(row.display_fuel_consumption_km_l, 1, '-') }} km/L</span>
                </div>
              </button>
            </div>
            <div v-else class="empty-state">尚無加油紀錄</div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="maintenance">
          <template #label>
            <span class="tab-label-with-icon"><el-icon><Tools /></el-icon>保養紀錄</span>
          </template>
          <el-table class="desktop-table" :data="maintenanceLogs" @row-click="editMaintenance">
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
          <div class="mobile-record-list">
            <div v-if="maintenanceLogs.length" class="record-card-list">
              <button
                v-for="row in maintenanceLogs"
                :key="row.maintenance_log_id"
                class="record-card"
                type="button"
                @click="editMaintenance(row)"
              >
                <span class="record-card__label">保養紀錄</span>
                <div class="record-card__header">
                  <div class="record-card__title">{{ row.item }}</div>
                  <div class="record-card__value">{{ formatMoney(row.total_cost) }}</div>
                </div>
                <div class="record-card__details">
                  <span>{{ formatDateOnly(row.date) }}</span>
                  <span>{{ formatKm(row.odometer_km) }}</span>
                  <span>{{ row.vendor || '未填保養方式' }}</span>
                </div>
              </button>
            </div>
            <div v-else class="empty-state">尚無保養紀錄</div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="expense">
          <template #label>
            <span class="tab-label-with-icon"><el-icon><Money /></el-icon>費用紀錄</span>
          </template>
          <el-table class="desktop-table" :data="expenseLogs" @row-click="editExpense">
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
          <div class="mobile-record-list">
            <div v-if="expenseLogs.length" class="record-card-list">
              <button v-for="row in expenseLogs" :key="row.expense_log_id" class="record-card" type="button" @click="editExpense(row)">
                <span class="record-card__label">費用紀錄</span>
                <div class="record-card__header">
                  <div class="record-card__title">{{ row.title }}</div>
                  <div class="record-card__value">{{ formatMoney(row.total_price) }}</div>
                </div>
                <div class="record-card__details">
                  <span>{{ formatDateOnly(row.date) }}</span>
                  <span>{{ formatKm(row.odometer_km) }}</span>
                </div>
              </button>
            </div>
            <div v-else class="empty-state">尚無費用紀錄</div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Money, Plus, Pouring, Refresh, Tools } from '@element-plus/icons-vue';
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
