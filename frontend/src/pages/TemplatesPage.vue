<template>
  <div v-loading="loading">
    <el-card class="form-card" shadow="never" style="margin-bottom: 16px">
      <el-form label-position="top" :model="form" @submit.prevent>
        <el-row :gutter="12">
          <el-col :xs="24" :sm="6">
            <el-form-item label="項目" required>
              <el-input v-model="form.item" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="4">
            <el-form-item label="分類">
              <el-input v-model="form.category" />
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="4">
            <el-form-item label="週期 km">
              <el-input v-model.number="form.interval_km" type="number" inputmode="decimal" min="0" />
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="4">
            <el-form-item label="週期月">
              <el-input v-model.number="form.interval_months" type="number" inputmode="numeric" min="0" />
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="3">
            <el-form-item label="提醒 km">
              <el-input v-model.number="form.warning_km" type="number" inputmode="decimal" min="0" />
            </el-form-item>
          </el-col>
          <el-col :xs="12" :sm="3">
            <el-form-item label="提醒天">
              <el-input v-model.number="form.warning_days" type="number" inputmode="numeric" min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-button type="primary" :icon="Plus" :loading="saving" @click="submit">新增模板</el-button>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <el-table :data="templates">
        <el-table-column prop="item" label="項目" min-width="130" />
        <el-table-column prop="category" label="分類" width="110" />
        <el-table-column prop="interval_km" label="週期 km" align="right" />
        <el-table-column prop="interval_months" label="週期月" align="right" />
        <el-table-column prop="warning_km" label="提醒 km" align="right" />
        <el-table-column prop="warning_days" label="提醒天" align="right" />
        <el-table-column prop="enabled" label="啟用" width="90">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '是' : '否' }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import { apiGet, apiPost } from '../api/client';
import type { ServiceTemplate } from '../types';

const route = useRoute();
const vehicleId = String(route.params.vehicle_id);
const templates = ref<ServiceTemplate[]>([]);
const loading = ref(false);
const saving = ref(false);
const form = reactive({
  vehicle_id: vehicleId,
  item: '',
  category: '',
  interval_km: 5000,
  interval_months: 6,
  warning_km: 500,
  warning_days: 14,
  enabled: true,
  note: ''
});

async function load() {
  loading.value = true;
  try {
    templates.value = await apiGet<ServiceTemplate[]>('listServiceTemplates', { vehicle_id: vehicleId });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    loading.value = false;
  }
}

async function submit() {
  saving.value = true;
  try {
    await apiPost('createServiceTemplate', { ...form });
    form.item = '';
    await load();
    ElMessage.success('已新增模板');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
