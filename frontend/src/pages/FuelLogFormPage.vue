<template>
  <el-card class="form-card" shadow="never">
    <template #header>
      <strong>{{ isEdit ? '編輯加油紀錄' : '新增加油紀錄' }}</strong>
    </template>
    <el-form label-position="top" :model="form" @submit.prevent>
      <el-row :gutter="16">
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
        <el-col :xs="24" :sm="8">
          <el-form-item label="公升數" required>
            <el-input v-model.number="form.liters" type="number" inputmode="decimal" min="0" @input="recalculate('liters')" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="16">
          <el-form-item label="儀表油量比例">
            <el-slider v-model="form.fuel_fill_percent" :min="0" :max="100" :step="1" show-input />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="單價">
            <el-input v-model.number="form.unit_price" type="number" inputmode="decimal" min="0" @input="recalculate('unit_price')" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="總金額">
            <el-input v-model.number="form.total_price" type="number" inputmode="decimal" min="0" @input="recalculate('total_price')" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="油品">
            <el-input v-model="form.fuel_type" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="上次忘記紀錄">
            <el-switch v-model="form.last_record_missing" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="備註">
            <el-input v-model="form.note" type="textarea" :rows="3" />
          </el-form-item>
        </el-col>
      </el-row>
      <div class="mobile-actions">
        <el-button @click="router.push({ name: 'records', query: { vehicle_id: form.vehicle_id, tab: 'fuel' } })">返回紀錄</el-button>
        <el-button type="primary" :icon="Check" :loading="saving" @click="submit">儲存</el-button>
      </div>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import { apiGet, apiPost } from '../api/client';
import type { FuelLog, Vehicle } from '../types';
import { formatDateOnly, round, today } from '../utils/format';

const route = useRoute();
const router = useRouter();
const fuelLogId = computed(() => String(route.params.fuel_log_id || ''));
const isEdit = computed(() => Boolean(fuelLogId.value));
const vehicleId = computed(() => String(route.query.vehicle_id || ''));
const saving = ref(false);
const form = reactive({
  fuel_log_id: '',
  vehicle_id: '',
  date: today(),
  odometer_km: 0,
  liters: null as number | null,
  unit_price: null as number | null,
  total_price: null as number | null,
  fuel_type: '',
  station: '',
  full_tank: true,
  last_record_missing: false,
  fuel_fill_percent: 100,
  note: ''
});
const manuallyEdited = reactive({
  liters: false,
  unit_price: false,
  total_price: false
});

type FuelPriceField = 'liters' | 'unit_price' | 'total_price';

function hasPositiveNumber(value: unknown): value is number {
  return value !== null && value !== undefined && value !== '' && Number(value) > 0;
}

function isTrue(value: unknown): boolean {
  return value === true || String(value).toLowerCase() === 'true';
}

function resetPriceTouchedState(markExistingAsManual = false) {
  manuallyEdited.liters = markExistingAsManual && hasPositiveNumber(form.liters);
  manuallyEdited.unit_price = markExistingAsManual && hasPositiveNumber(form.unit_price);
  manuallyEdited.total_price = markExistingAsManual && hasPositiveNumber(form.total_price);
}

function recalculate(changed: FuelPriceField) {
  manuallyEdited[changed] = hasPositiveNumber(form[changed]);
  const { liters, unit_price: unitPrice, total_price: totalPrice } = form;
  if (hasPositiveNumber(liters) && hasPositiveNumber(unitPrice) && !manuallyEdited.total_price) {
    form.total_price = round(liters * unitPrice, 2);
    return;
  }
  if (hasPositiveNumber(liters) && hasPositiveNumber(totalPrice) && !manuallyEdited.unit_price) {
    form.unit_price = round(totalPrice / liters, 3);
    return;
  }
  if (hasPositiveNumber(unitPrice) && hasPositiveNumber(totalPrice) && !manuallyEdited.liters) {
    form.liters = round(totalPrice / unitPrice, 3);
  }
}

function getPayloadFullTank() {
  return Number(form.fuel_fill_percent || 0) >= 100;
}

function getPayloadFuelFillPercent() {
  return Number(form.fuel_fill_percent || 0);
}

async function loadFuelLogForEdit(): Promise<FuelLog> {
  try {
    return await apiGet<FuelLog>('getFuelLog', { fuel_log_id: fuelLogId.value });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('Unknown GET action')) throw error;
    const rows = await apiGet<FuelLog[]>('listFuelLogs', { vehicle_id: vehicleId.value });
    const log = rows.find((row) => row.fuel_log_id === fuelLogId.value);
    if (!log) throw new Error('找不到這筆加油紀錄');
    return log;
  }
}

async function submit() {
  saving.value = true;
  try {
    const payload = {
      ...form,
      full_tank: getPayloadFullTank(),
      fuel_fill_percent: getPayloadFuelFillPercent()
    };
    await apiPost(isEdit.value ? 'updateFuelLog' : 'createFuelLog', payload);
    ElMessage.success(isEdit.value ? '已更新加油紀錄' : '已儲存加油紀錄');
    router.push({ name: 'records', query: { vehicle_id: form.vehicle_id, tab: 'fuel' } });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    if (isEdit.value) {
      const log = await loadFuelLogForEdit();
      form.fuel_log_id = log.fuel_log_id;
      form.vehicle_id = log.vehicle_id;
      form.date = formatDateOnly(log.date);
      form.odometer_km = Number(log.odometer_km || 0);
      form.liters = Number(log.liters || 0);
      form.unit_price = Number(log.unit_price || 0);
      form.total_price = Number(log.total_price || 0);
      form.fuel_type = log.fuel_type || '';
      form.full_tank = isTrue(log.full_tank);
      form.last_record_missing = isTrue(log.last_record_missing);
      form.fuel_fill_percent = Number(log.fuel_fill_percent || 0);
      if (!form.fuel_fill_percent && isTrue(log.full_tank)) form.fuel_fill_percent = 100;
      form.note = log.note || '';
      resetPriceTouchedState(true);
      return;
    }
    form.vehicle_id = vehicleId.value;
    const vehicle = await apiGet<Vehicle>('getVehicle', { vehicle_id: vehicleId.value });
    form.odometer_km = Number(vehicle.current_odometer || 0);
    form.fuel_type = vehicle.fuel_type || '';
    form.fuel_fill_percent = 100;
    resetPriceTouchedState(false);
  } catch {
    form.odometer_km = 0;
  }
});
</script>
