<template>
  <div v-loading="loading">
    <div class="page-actions">
      <el-button :icon="Money" type="primary" @click="$router.push(`/vehicles/${vehicleId}/fuel/new`)">加油</el-button>
      <el-button :icon="Tools" @click="$router.push(`/vehicles/${vehicleId}/maintenance/new`)">保養</el-button>
      <el-button :icon="Odometer" @click="$router.push(`/vehicles/${vehicleId}/odometer`)">里程</el-button>
    </div>
    <el-card v-if="vehicle" class="table-card" shadow="never">
      <template #header>
        <strong>{{ vehicle.name }}</strong>
      </template>
      <div class="metric-grid">
        <div>
          <div class="muted">目前里程</div>
          <h2>{{ formatKm(vehicle.current_odometer) }}</h2>
        </div>
        <div>
          <div class="muted">車型</div>
          <h2>{{ vehicle.brand || '-' }} {{ vehicle.model || '' }}</h2>
        </div>
        <div>
          <div class="muted">類型</div>
          <h2>{{ vehicle.type }}</h2>
        </div>
        <div>
          <div class="muted">能源</div>
          <h2>{{ vehicle.fuel_type || '-' }}</h2>
        </div>
      </div>
      <div class="mobile-actions">
        <el-button @click="$router.push(`/vehicles/${vehicleId}/fuel`)">加油紀錄</el-button>
        <el-button @click="$router.push(`/vehicles/${vehicleId}/maintenance`)">保養紀錄</el-button>
        <el-button @click="$router.push(`/vehicles/${vehicleId}/status`)">保養狀態</el-button>
        <el-button @click="$router.push(`/vehicles/${vehicleId}/templates`)">保養模板</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Money, Odometer, Tools } from '@element-plus/icons-vue';
import { apiGet } from '../api/client';
import type { Vehicle } from '../types';
import { formatKm } from '../utils/format';

const route = useRoute();
const vehicleId = String(route.params.vehicle_id);
const vehicle = ref<Vehicle | null>(null);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    vehicle.value = await apiGet<Vehicle>('getVehicle', { vehicle_id: vehicleId });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
