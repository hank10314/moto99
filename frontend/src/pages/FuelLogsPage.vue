<template>
  <div v-loading="loading">
    <div class="page-actions">
      <el-button :icon="Plus" type="primary" @click="$router.push(`/vehicles/${vehicleId}/fuel/new`)">新增加油</el-button>
    </div>
    <el-card class="table-card" shadow="never">
      <el-table :data="logsForDisplay">
        <el-table-column label="日期" width="120">
          <template #default="{ row }">{{ formatDateOnly(row.date) }}</template>
        </el-table-column>
        <el-table-column prop="odometer_km" label="里程" align="right">
          <template #default="{ row }">{{ formatKm(row.odometer_km) }}</template>
        </el-table-column>
        <el-table-column label="公升" align="right">
          <template #default="{ row }">{{ formatLiters(row.liters) }}</template>
        </el-table-column>
        <el-table-column label="油量%" align="right">
          <template #default="{ row }">{{ formatPercent(row.display_fuel_fill_percent) }}</template>
        </el-table-column>
        <el-table-column prop="total_price" label="金額" align="right">
          <template #default="{ row }">{{ formatMoney(row.total_price) }}</template>
        </el-table-column>
        <el-table-column label="km/L" align="right">
          <template #default="{ row }">{{ formatNumber(row.display_fuel_consumption_km_l, 1, '-') }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { apiGet } from '../api/client';
import type { FuelLog, Vehicle } from '../types';
import { formatDateOnly, formatKm, formatLiters, formatMoney, formatNumber, formatPercent } from '../utils/format';
import { shiftFuelConsumptionToPreviousTank } from '../utils/fuel';

const route = useRoute();
const vehicleId = String(route.params.vehicle_id);
const logs = ref<FuelLog[]>([]);
const vehicle = ref<Vehicle | null>(null);
const logsForDisplay = computed(() => shiftFuelConsumptionToPreviousTank(logs.value, vehicle.value?.tank_capacity_liters));
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    const [fetchedLogs, fetchedVehicle] = await Promise.all([
      apiGet<FuelLog[]>('listFuelLogs', { vehicle_id: vehicleId }),
      apiGet<Vehicle>('getVehicle', { vehicle_id: vehicleId })
    ]);
    logs.value = fetchedLogs;
    vehicle.value = fetchedVehicle;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
