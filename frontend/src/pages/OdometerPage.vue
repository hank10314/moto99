<template>
  <div v-loading="loading">
    <el-card class="form-card" shadow="never" style="margin-bottom: 16px">
      <el-form label-position="top" :model="form" @submit.prevent>
        <el-row :gutter="12">
          <el-col :xs="24" :sm="8">
            <el-form-item label="日期" required>
              <el-date-picker v-model="form.date" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="里程" required>
              <el-input v-model.number="form.odometer_km" type="number" inputmode="decimal" min="0" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="備註">
              <el-input v-model="form.note" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-button type="primary" :icon="Check" :loading="saving" @click="submit">更新里程</el-button>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="logs">
        <el-table-column label="日期" width="120">
          <template #default="{ row }">{{ formatDateOnly(row.date) }}</template>
        </el-table-column>
        <el-table-column prop="odometer_km" label="里程" align="right">
          <template #default="{ row }">{{ formatKm(row.odometer_km) }}</template>
        </el-table-column>
        <el-table-column prop="source_type" label="來源" width="120" />
        <el-table-column prop="note" label="備註" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import { apiGet, apiPost } from '../api/client';
import type { Vehicle } from '../types';
import { formatDateOnly, formatKm, today } from '../utils/format';

interface OdometerLog {
  odometer_log_id: string;
  date: string;
  odometer_km: number;
  source_type: string;
  note?: string;
}

const route = useRoute();
const vehicleId = String(route.params.vehicle_id);
const logs = ref<OdometerLog[]>([]);
const loading = ref(false);
const saving = ref(false);
const form = reactive({
  vehicle_id: vehicleId,
  date: today(),
  odometer_km: 0,
  source_type: 'manual',
  note: ''
});

async function load() {
  loading.value = true;
  try {
    const [vehicle, fetchedLogs] = await Promise.all([
      apiGet<Vehicle>('getVehicle', { vehicle_id: vehicleId }),
      apiGet<OdometerLog[]>('listOdometerLogs', { vehicle_id: vehicleId })
    ]);
    form.odometer_km = Number(vehicle.current_odometer || 0);
    logs.value = fetchedLogs;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    loading.value = false;
  }
}

async function submit() {
  saving.value = true;
  try {
    await apiPost('createOdometerLog', { ...form });
    await load();
    ElMessage.success('已更新里程');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
