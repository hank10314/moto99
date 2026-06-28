<template>
  <div v-loading="loading">
    <div class="page-actions">
      <el-button :icon="Plus" type="primary" @click="$router.push(`/vehicles/${vehicleId}/maintenance/new`)">新增保養</el-button>
    </div>
    <el-card class="table-card" shadow="never">
      <el-table :data="logs">
        <el-table-column label="日期" width="120">
          <template #default="{ row }">{{ formatDateOnly(row.date) }}</template>
        </el-table-column>
        <el-table-column prop="item" label="項目" min-width="120" />
        <el-table-column prop="vendor" label="保養方式" width="110" />
        <el-table-column prop="odometer_km" label="里程" align="right">
          <template #default="{ row }">{{ formatKm(row.odometer_km) }}</template>
        </el-table-column>
        <el-table-column prop="parts_cost" label="項目費用" align="right">
          <template #default="{ row }">{{ formatMoney(row.parts_cost) }}</template>
        </el-table-column>
        <el-table-column prop="labor_cost" label="工資" align="right">
          <template #default="{ row }">{{ formatMoney(row.labor_cost) }}</template>
        </el-table-column>
        <el-table-column prop="total_cost" label="總金額" align="right">
          <template #default="{ row }">{{ formatMoney(row.total_cost) }}</template>
        </el-table-column>
        <el-table-column label="下次里程" align="right">
          <template #default="{ row }">{{ formatKm(row.next_due_km) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { apiGet } from '../api/client';
import type { MaintenanceLog } from '../types';
import { formatDateOnly, formatKm, formatMoney } from '../utils/format';

const route = useRoute();
const vehicleId = String(route.params.vehicle_id);
const logs = ref<MaintenanceLog[]>([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    logs.value = await apiGet<MaintenanceLog[]>('listMaintenanceLogs', { vehicle_id: vehicleId });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
