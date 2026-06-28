<template>
  <div v-loading="loading">
    <div class="page-actions dashboard-actions">
      <el-select v-model="selectedVehicleId" placeholder="選擇車輛" style="min-width: 240px" @change="load">
        <el-option v-for="vehicle in data?.vehicles || []" :key="vehicle.vehicle_id" :label="vehicle.name" :value="vehicle.vehicle_id" />
      </el-select>
      <el-button :icon="Refresh" @click="load">重新整理</el-button>
    </div>

    <el-empty v-if="!data?.vehicle" description="尚未建立車輛">
      <el-button type="primary" :icon="Setting" @click="$router.push('/settings')">到設定新增車輛</el-button>
    </el-empty>

    <template v-else>
      <div class="dashboard-command-row">
        <el-button type="primary" :icon="Plus" @click="goNewFuel">新增加油</el-button>
        <el-button type="primary" plain :icon="Tools" @click="goNewMaintenance">新增保養</el-button>
        <el-button :icon="Money" @click="goNewExpense">新增費用</el-button>
        <el-button :icon="Tickets" @click="goRecords">查看所有紀錄</el-button>
      </div>

      <div class="metric-grid">
        <el-card class="metric-card" shadow="never">
          <div class="label">目前里程</div>
          <div class="value">{{ formatKm(data.vehicle.current_odometer) }}</div>
        </el-card>
        <el-card class="metric-card" shadow="never">
          <div class="label">平均 km/L</div>
          <div class="value">{{ formatNumber(data.fuel_summary.avg_fuel_consumption_km_l, 1, '-') }}</div>
        </el-card>
        <el-card class="metric-card" shadow="never">
          <div class="label">本月加油</div>
          <div class="value">{{ formatMoney(data.fuel_summary.monthly_fuel_cost) }}</div>
        </el-card>
        <el-card class="metric-card" shadow="never">
          <div class="label">年度保養</div>
          <div class="value">{{ formatMoney(data.fuel_summary.yearly_maintenance_cost) }}</div>
        </el-card>
      </div>

      <div class="content-grid">
        <el-card class="table-card" shadow="never">
          <template #header>
            <div class="maintenance-header">
              <strong>最近加油</strong>
              <el-button text @click="goRecords('fuel')">全部</el-button>
            </div>
          </template>
          <el-table :data="fuelPreview" size="small" @row-click="editFuel">
            <el-table-column label="日期" width="110">
              <template #default="{ row }">{{ formatDateOnly(row.date) }}</template>
            </el-table-column>
            <el-table-column label="里程" align="right">
              <template #default="{ row }">{{ formatKm(row.odometer_km) }}</template>
            </el-table-column>
            <el-table-column label="公升" align="right">
              <template #default="{ row }">{{ formatLiters(row.liters) }}</template>
            </el-table-column>
            <el-table-column label="金額" align="right">
              <template #default="{ row }">{{ formatMoney(row.total_price) }}</template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card class="table-card" shadow="never">
          <template #header>
            <div class="maintenance-header">
              <strong>最近保養</strong>
              <el-button text @click="goRecords('maintenance')">全部</el-button>
            </div>
          </template>
          <el-table :data="maintenancePreview" size="small" @row-click="editMaintenance">
            <el-table-column label="日期" width="110">
              <template #default="{ row }">{{ formatDateOnly(row.date) }}</template>
            </el-table-column>
            <el-table-column prop="item" label="項目" min-width="130" />
            <el-table-column label="里程" align="right">
              <template #default="{ row }">{{ formatKm(row.odometer_km) }}</template>
            </el-table-column>
            <el-table-column label="總金額" align="right">
              <template #default="{ row }">{{ formatMoney(row.total_cost) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>

      <el-card class="table-card" shadow="never" style="margin-top: 16px">
        <template #header>
          <div class="maintenance-header">
            <strong>最近費用</strong>
            <el-button text @click="goRecords('expense')">全部</el-button>
          </div>
        </template>
        <el-table :data="expensePreview" size="small" @row-click="editExpense">
          <el-table-column label="日期" width="110">
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
      </el-card>

      <div class="content-grid" style="margin-top: 16px">
        <el-card class="table-card" shadow="never">
          <template #header>
            <strong>費用趨勢</strong>
          </template>
          <MiniCostChart :fuel="data.monthly_fuel_costs" :maintenance="data.monthly_maintenance_costs" />
        </el-card>
        <el-card class="table-card" shadow="never">
          <template #header>
            <strong>支出類別比例</strong>
          </template>
          <ExpensePieChart :totals="data.expense_category_totals || emptyExpenseCategoryTotals" />
        </el-card>
      </div>

      <div class="content-grid" style="margin-top: 16px">
        <el-card class="table-card" shadow="never">
          <template #header>
            <strong>油耗趨勢</strong>
          </template>
          <FuelEfficiencyLineChart :trend="data.fuel_efficiency_trend || []" />
        </el-card>
        <el-card class="table-card" shadow="never">
          <template #header>
            <strong>保養提醒</strong>
          </template>
          <el-table :data="data.maintenance_status" size="small">
            <el-table-column prop="item" label="項目" min-width="120" />
            <el-table-column label="剩餘 km" width="110" align="right">
              <template #default="{ row }">{{ formatKm(row.remaining_km) }}</template>
            </el-table-column>
            <el-table-column label="狀態" width="110">
              <template #default="{ row }">
                <StatusTag :status="row.status" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Money, Plus, Refresh, Setting, Tickets, Tools } from '@element-plus/icons-vue';
import { apiGet } from '../api/client';
import ExpensePieChart from '../components/ExpensePieChart.vue';
import FuelEfficiencyLineChart from '../components/FuelEfficiencyLineChart.vue';
import MiniCostChart from '../components/MiniCostChart.vue';
import StatusTag from '../components/StatusTag.vue';
import type { DashboardData, ExpenseLog, FuelLog, MaintenanceLog } from '../types';
import { formatDateOnly, formatKm, formatLiters, formatMoney, formatNumber } from '../utils/format';
import { sortFuelLogs } from '../utils/fuel';

const router = useRouter();
const loading = ref(false);
const data = ref<DashboardData | null>(null);
const fuelLogs = ref<FuelLog[]>([]);
const maintenanceLogs = ref<MaintenanceLog[]>([]);
const expenseLogs = ref<ExpenseLog[]>([]);
const selectedVehicleId = ref('');

const fuelPreview = computed(() => sortFuelLogs(fuelLogs.value).slice(0, 5));
const maintenancePreview = computed(() => maintenanceLogs.value.slice(0, 5));
const expensePreview = computed(() => expenseLogs.value.slice(0, 5));
const emptyExpenseCategoryTotals = { all: [], yearly: [] };

async function load() {
  loading.value = true;
  try {
    data.value = await apiGet<DashboardData>('dashboard', { vehicle_id: selectedVehicleId.value });
    selectedVehicleId.value = data.value.vehicle?.vehicle_id || selectedVehicleId.value;
    fuelLogs.value = data.value.recent_fuel_logs || [];
    maintenanceLogs.value = data.value.recent_maintenance_logs || [];
    expenseLogs.value = data.value.recent_expense_logs || [];
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    loading.value = false;
  }
}

function vehicleQuery() {
  return { vehicle_id: selectedVehicleId.value };
}

function goNewFuel() {
  router.push({ name: 'fuel-new', query: vehicleQuery() });
}

function goNewMaintenance() {
  router.push({ name: 'maintenance-new', query: vehicleQuery() });
}

function goNewExpense() {
  router.push({ name: 'expense-new', query: vehicleQuery() });
}

function goRecords(tab = 'fuel') {
  router.push({ name: 'records', query: { ...vehicleQuery(), tab } });
}

function editFuel(row: FuelLog) {
  router.push({ name: 'fuel-edit', params: { fuel_log_id: row.fuel_log_id }, query: vehicleQuery() });
}

function editMaintenance(row: MaintenanceLog) {
  router.push({ name: 'maintenance-edit', params: { maintenance_log_id: row.maintenance_log_id }, query: vehicleQuery() });
}

function editExpense(row: ExpenseLog) {
  router.push({ name: 'expense-edit', params: { expense_log_id: row.expense_log_id }, query: vehicleQuery() });
}

onMounted(load);
</script>
