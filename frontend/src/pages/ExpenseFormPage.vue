<template>
  <el-card class="form-card" shadow="never">
    <template #header>
      <strong>{{ isEdit ? '編輯費用紀錄' : '新增費用紀錄' }}</strong>
    </template>
    <el-form label-position="top" :model="form" @submit.prevent>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="標題" required>
            <el-input v-model="form.title" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="日期" required>
            <el-date-picker v-model="form.date" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="里程" required>
            <el-input v-model.number="form.odometer_km" type="number" inputmode="decimal" min="0" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="總額" required>
            <el-input v-model.number="form.total_price" type="number" inputmode="decimal" min="0" />
          </el-form-item>
        </el-col>
      </el-row>
      <div class="mobile-actions">
        <el-button @click="router.push({ name: 'records', query: { vehicle_id: form.vehicle_id, tab: 'expense' } })">返回紀錄</el-button>
        <el-button type="primary" :icon="Check" :loading="saving" @click="submit">儲存</el-button>
      </div>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import { apiGet, apiPost } from '../api/client';
import type { ExpenseLog, Vehicle } from '../types';
import { formatDateOnly, today } from '../utils/format';

const route = useRoute();
const router = useRouter();
const expenseLogId = computed(() => String(route.params.expense_log_id || ''));
const isEdit = computed(() => Boolean(expenseLogId.value));
const vehicleId = computed(() => String(route.query.vehicle_id || ''));
const saving = ref(false);
const form = reactive({
  expense_log_id: '',
  vehicle_id: '',
  title: '',
  date: today(),
  odometer_km: 0,
  total_price: 0
});

async function loadExpenseLogForEdit(): Promise<ExpenseLog> {
  try {
    return await apiGet<ExpenseLog>('getExpenseLog', { expense_log_id: expenseLogId.value });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('Unknown GET action')) throw error;
    const rows = await apiGet<ExpenseLog[]>('listExpenseLogs', { vehicle_id: vehicleId.value });
    const log = rows.find((row) => row.expense_log_id === expenseLogId.value);
    if (!log) throw new Error('找不到這筆費用紀錄');
    return log;
  }
}

async function submit() {
  saving.value = true;
  try {
    await apiPost(isEdit.value ? 'updateExpenseLog' : 'createExpenseLog', { ...form });
    ElMessage.success(isEdit.value ? '已更新費用紀錄' : '已儲存費用紀錄');
    router.push({ name: 'records', query: { vehicle_id: form.vehicle_id, tab: 'expense' } });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    if (isEdit.value) {
      const log = await loadExpenseLogForEdit();
      form.expense_log_id = log.expense_log_id;
      form.vehicle_id = log.vehicle_id;
      form.title = log.title;
      form.date = formatDateOnly(log.date);
      form.odometer_km = Number(log.odometer_km || 0);
      form.total_price = Number(log.total_price || 0);
      return;
    }
    form.vehicle_id = vehicleId.value;
    const vehicle = await apiGet<Vehicle>('getVehicle', { vehicle_id: vehicleId.value });
    form.odometer_km = Number(vehicle.current_odometer || 0);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  }
});
</script>
