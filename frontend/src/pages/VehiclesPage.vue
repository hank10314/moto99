<template>
  <div v-loading="loading">
    <div class="page-actions">
      <el-button :icon="Refresh" @click="load">重新整理</el-button>
      <el-button type="primary" :icon="Plus" @click="$router.push('/vehicles/new')">新增車輛</el-button>
    </div>
    <el-card class="table-card" shadow="never">
      <el-table :data="vehicles">
        <el-table-column prop="name" label="名稱" min-width="150" />
        <el-table-column prop="type" label="類型" width="110" />
        <el-table-column prop="fuel_type" label="能源" width="110" />
        <el-table-column prop="current_odometer" label="目前里程" align="right">
          <template #default="{ row }">{{ formatKm(row.current_odometer) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button :icon="View" size="small" @click="$router.push(`/vehicles/${row.vehicle_id}`)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Refresh, View } from '@element-plus/icons-vue';
import { apiGet } from '../api/client';
import type { Vehicle } from '../types';
import { formatKm } from '../utils/format';

const vehicles = ref<Vehicle[]>([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    vehicles.value = await apiGet<Vehicle[]>('listVehicles');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
