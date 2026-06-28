<template>
  <div v-loading="loading">
    <div class="page-actions">
      <el-button :icon="Refresh" @click="load">重新整理</el-button>
      <el-button :icon="Setting" @click="$router.push(`/vehicles/${vehicleId}/templates`)">模板</el-button>
    </div>
    <el-card class="table-card" shadow="never">
      <el-table :data="rows">
        <el-table-column prop="item" label="項目" min-width="130" />
        <el-table-column label="上次 km" align="right">
          <template #default="{ row }">{{ formatKm(row.last_maintenance_km) }}</template>
        </el-table-column>
        <el-table-column label="上次日期" width="110">
          <template #default="{ row }">{{ formatDateOnly(row.last_maintenance_date) || '-' }}</template>
        </el-table-column>
        <el-table-column label="下次 km" align="right">
          <template #default="{ row }">{{ formatKm(row.next_due_km) }}</template>
        </el-table-column>
        <el-table-column label="下次日期" width="110">
          <template #default="{ row }">{{ formatDateOnly(row.next_due_date) || '-' }}</template>
        </el-table-column>
        <el-table-column label="剩餘 km" align="right">
          <template #default="{ row }">{{ formatKm(row.remaining_km) }}</template>
        </el-table-column>
        <el-table-column label="剩餘天數" align="right">
          <template #default="{ row }">{{ formatNumber(row.remaining_days) }}</template>
        </el-table-column>
        <el-table-column label="狀態" width="120">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Refresh, Setting } from '@element-plus/icons-vue';
import { apiGet } from '../api/client';
import StatusTag from '../components/StatusTag.vue';
import type { MaintenanceStatus } from '../types';
import { formatDateOnly, formatKm, formatNumber } from '../utils/format';

const route = useRoute();
const vehicleId = String(route.params.vehicle_id);
const rows = ref<MaintenanceStatus[]>([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    rows.value = await apiGet<MaintenanceStatus[]>('maintenanceStatus', { vehicle_id: vehicleId });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
