<template>
  <div>
    <el-card class="form-card" shadow="never" style="margin-bottom: 16px">
      <template #header>
        <strong>{{ isEdit ? '編輯保養紀錄' : '新增保養紀錄' }}</strong>
      </template>
      <el-form label-position="top" @submit.prevent>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="10">
            <el-form-item label="保養方式">
              <el-segmented v-model="serviceMethod" :options="serviceMethodOptions" />
            </el-form-item>
          </el-col>
          <el-col v-if="serviceMethod === 'outside'" :xs="24" :sm="7">
            <el-form-item label="工資">
              <el-input v-model.number="laborCost" type="number" inputmode="decimal" min="0" />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="7">
            <el-form-item label="本次總花費">
              <div class="maintenance-total">{{ formatMoney(grandTotal) }}</div>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item label="本次保養備註">
              <el-input v-model="batchNote" type="textarea" :rows="2" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="maintenance-header">
          <strong>保養細部項目</strong>
          <el-button v-if="!isEdit" :icon="Plus" type="primary" @click="addDetail">新增細項</el-button>
        </div>
      </template>

      <div class="maintenance-detail-list">
        <div v-for="(detail, index) in details" :key="detail.local_id" class="maintenance-detail-row">
          <div class="detail-row-title">
            <strong>細項 {{ index + 1 }}</strong>
            <el-button v-if="!isEdit && details.length > 1" :icon="Delete" text type="danger" @click="removeDetail(detail.local_id)">移除</el-button>
          </div>

          <el-row :gutter="12">
            <el-col :xs="24" :md="7">
              <el-form-item label="保養項目" required>
                <el-select
                  v-model="detail.item"
                  filterable
                  allow-create
                  clearable
                  style="width: 100%"
                  @change="applyItem(detail)"
                >
                  <el-option v-for="option in itemOptions" :key="option.item" :label="option.item" :value="option.item" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="12" :md="4">
              <el-form-item label="保養日期" required>
                <el-date-picker v-model="detail.date" value-format="YYYY-MM-DD" type="date" style="width: 100%" @change="recalculateDue(detail)" />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :md="4">
              <el-form-item label="保養里程" required>
                <el-input v-model.number="detail.odometer_km" type="number" inputmode="decimal" min="0" @input="recalculateDue(detail)" />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :md="3">
              <el-form-item label="項目費用">
                <el-input v-model.number="detail.parts_cost" type="number" inputmode="decimal" min="0" />
              </el-form-item>
            </el-col>
            <el-col :xs="12" :md="3">
              <el-form-item label="下次里程">
                <el-input v-model.number="detail.next_due_km" type="number" inputmode="decimal" min="0" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="3">
              <el-form-item label="下次日期">
                <el-date-picker v-model="detail.next_due_date" value-format="YYYY-MM-DD" type="date" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="細項備註">
                <el-input v-model="detail.note" />
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </div>

      <el-divider />

      <el-descriptions :column="3" border>
        <el-descriptions-item label="細項數">{{ validDetails.length }}</el-descriptions-item>
        <el-descriptions-item label="項目費用">{{ formatMoney(partsTotal) }}</el-descriptions-item>
        <el-descriptions-item label="工資">{{ formatMoney(effectiveLaborCost) }}</el-descriptions-item>
      </el-descriptions>

      <div class="page-actions" style="margin-top: 18px">
        <el-button @click="router.push({ name: 'records', query: { vehicle_id: vehicleId, tab: 'maintenance' } })">返回紀錄</el-button>
        <el-button v-if="!isEdit" :icon="Plus" @click="addDetail">新增細項</el-button>
        <el-button type="primary" :icon="Check" :loading="saving" @click="submit">{{ isEdit ? '更新保養' : '儲存本次保養' }}</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Check, Delete, Plus } from '@element-plus/icons-vue';
import { apiGet, apiPost } from '../api/client';
import type { MaintenanceLog, ServiceTemplate, Vehicle } from '../types';
import { addMonths, formatDateOnly, formatMoney, today } from '../utils/format';
import { getPresetByItem, maintenanceItemPresets, mergeTemplateOptions, type MaintenanceItemPreset } from '../utils/maintenanceItems';

interface MaintenanceDetail {
  local_id: string;
  item: string;
  date: string;
  odometer_km: number;
  parts_cost: number;
  next_due_km: number | '';
  next_due_date: string;
  note: string;
  preset?: MaintenanceItemPreset;
}

const route = useRoute();
const router = useRouter();
const maintenanceLogId = computed(() => String(route.params.maintenance_log_id || ''));
const isEdit = computed(() => Boolean(maintenanceLogId.value));
const vehicleId = ref(String(route.query.vehicle_id || ''));
const templates = ref<ServiceTemplate[]>([]);
const itemOptions = ref<MaintenanceItemPreset[]>(maintenanceItemPresets);
const serviceMethod = ref<'self' | 'outside'>('self');
const laborCost = ref(0);
const batchNote = ref('');
const saving = ref(false);
const currentOdometer = ref(0);
const details = ref<MaintenanceDetail[]>([]);

const serviceMethodOptions = [
  { label: '自己保養', value: 'self' },
  { label: '外面保養', value: 'outside' }
];

const validDetails = computed(() => details.value.filter((detail) => detail.item && detail.date && Number(detail.odometer_km) >= 0));
const partsTotal = computed(() => details.value.reduce((sum, detail) => sum + Number(detail.parts_cost || 0), 0));
const effectiveLaborCost = computed(() => (serviceMethod.value === 'outside' ? Number(laborCost.value || 0) : 0));
const grandTotal = computed(() => partsTotal.value + effectiveLaborCost.value);

async function loadMaintenanceLogForEdit(): Promise<MaintenanceLog> {
  try {
    return await apiGet<MaintenanceLog>('getMaintenanceLog', { maintenance_log_id: maintenanceLogId.value });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes('Unknown GET action')) throw error;
    const rows = await apiGet<MaintenanceLog[]>('listMaintenanceLogs', { vehicle_id: vehicleId.value });
    const log = rows.find((row) => row.maintenance_log_id === maintenanceLogId.value);
    if (!log) throw new Error('找不到這筆保養紀錄');
    return log;
  }
}

function createDetail(item = ''): MaintenanceDetail {
  const detail: MaintenanceDetail = {
    local_id: crypto.randomUUID(),
    item,
    date: today(),
    odometer_km: currentOdometer.value,
    parts_cost: 0,
    next_due_km: '',
    next_due_date: '',
    note: ''
  };
  if (item) applyItem(detail);
  return detail;
}

function addDetail() {
  details.value.push(createDetail());
}

function removeDetail(localId: string) {
  details.value = details.value.filter((detail) => detail.local_id !== localId);
}

function findPreset(item: string): MaintenanceItemPreset | undefined {
  return itemOptions.value.find((option) => option.item === item) || getPresetByItem(item);
}

function applyItem(detail: MaintenanceDetail) {
  detail.preset = findPreset(detail.item);
  recalculateDue(detail);
}

function recalculateDue(detail: MaintenanceDetail) {
  const preset = detail.preset || findPreset(detail.item);
  if (!preset) return;
  if (preset.interval_km) detail.next_due_km = Number(detail.odometer_km || 0) + Number(preset.interval_km);
  if (preset.interval_months) detail.next_due_date = addMonths(detail.date, Number(preset.interval_months));
}

function validateDetails() {
  if (validDetails.value.length === 0) throw new Error('請至少新增一個保養細項');
  const missing = details.value.find((detail) => !detail.item || !detail.date || detail.odometer_km === null || detail.odometer_km === undefined);
  if (missing) throw new Error('每個細項都需要保養項目、保養日期與保養里程');
  const negativeCost = details.value.find((detail) => Number(detail.parts_cost || 0) < 0);
  if (negativeCost || effectiveLaborCost.value < 0) throw new Error('費用不可小於 0');
}

async function submit() {
  saving.value = true;
  try {
    validateDetails();
    if (isEdit.value) {
      const detail = validDetails.value[0];
      const methodText = serviceMethod.value === 'self' ? '自己保養' : '外面保養';
      await apiPost('updateMaintenanceLog', {
        maintenance_log_id: maintenanceLogId.value,
        vehicle_id: vehicleId.value,
        date: detail.date,
        odometer_km: detail.odometer_km,
        category: detail.preset?.category || findPreset(detail.item)?.category || '',
        item: detail.item,
        vendor: methodText,
        parts: '',
        parts_cost: Number(detail.parts_cost || 0),
        labor_cost: effectiveLaborCost.value,
        total_cost: Number(detail.parts_cost || 0) + effectiveLaborCost.value,
        next_due_km: detail.next_due_km,
        next_due_date: detail.next_due_date,
        note: [batchNote.value, detail.note].filter(Boolean).join(' / ')
      });
      ElMessage.success('已更新保養紀錄');
      router.push({ name: 'records', query: { vehicle_id: vehicleId.value, tab: 'maintenance' } });
      return;
    }
    const batchId = crypto.randomUUID();
    for (const [index, detail] of validDetails.value.entries()) {
      const labor = index === 0 ? effectiveLaborCost.value : 0;
      const methodText = serviceMethod.value === 'self' ? '自己保養' : '外面保養';
      await apiPost('createMaintenanceLog', {
        vehicle_id: vehicleId.value,
        date: detail.date,
        odometer_km: detail.odometer_km,
        category: detail.preset?.category || findPreset(detail.item)?.category || '',
        item: detail.item,
        vendor: methodText,
        parts: '',
        parts_cost: Number(detail.parts_cost || 0),
        labor_cost: labor,
        total_cost: Number(detail.parts_cost || 0) + labor,
        next_due_km: detail.next_due_km,
        next_due_date: detail.next_due_date,
        note: [batchNote.value, detail.note, `batch:${batchId}`].filter(Boolean).join(' / ')
      });
    }
    ElMessage.success(`已儲存 ${validDetails.value.length} 個保養細項，總花費 ${formatMoney(grandTotal.value)}`);
    router.push({ name: 'records', query: { vehicle_id: vehicleId.value, tab: 'maintenance' } });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    saving.value = false;
  }
}

onMounted(async () => {
  try {
    if (isEdit.value) {
      const log = await loadMaintenanceLogForEdit();
      vehicleId.value = log.vehicle_id;
      const [vehicle, fetchedTemplates] = await Promise.all([
        apiGet<Vehicle>('getVehicle', { vehicle_id: log.vehicle_id }),
        apiGet<ServiceTemplate[]>('listServiceTemplates', { vehicle_id: log.vehicle_id })
      ]);
      currentOdometer.value = Number(vehicle.current_odometer || 0);
      templates.value = fetchedTemplates;
      itemOptions.value = mergeTemplateOptions(fetchedTemplates);
      serviceMethod.value = log.vendor === '外面保養' || Number(log.labor_cost || 0) > 0 ? 'outside' : 'self';
      laborCost.value = Number(log.labor_cost || 0);
      batchNote.value = '';
      details.value = [
        {
          local_id: crypto.randomUUID(),
          item: log.item,
          date: formatDateOnly(log.date),
          odometer_km: Number(log.odometer_km || 0),
          parts_cost: Number(log.parts_cost || 0),
          next_due_km: log.next_due_km === '' || log.next_due_km === undefined ? '' : Number(log.next_due_km),
          next_due_date: formatDateOnly(log.next_due_date),
          note: log.note || '',
          preset: findPreset(log.item)
        }
      ];
      return;
    }
    const [vehicle, fetchedTemplates] = await Promise.all([
      apiGet<Vehicle>('getVehicle', { vehicle_id: vehicleId.value }),
      apiGet<ServiceTemplate[]>('listServiceTemplates', { vehicle_id: vehicleId.value })
    ]);
    currentOdometer.value = Number(vehicle.current_odometer || 0);
    templates.value = fetchedTemplates;
    itemOptions.value = mergeTemplateOptions(fetchedTemplates);
    details.value = [createDetail()];
  } catch (error) {
    details.value = [createDetail()];
    ElMessage.error(error instanceof Error ? error.message : String(error));
  }
});
</script>
