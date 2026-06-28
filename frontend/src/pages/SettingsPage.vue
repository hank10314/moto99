<template>
  <el-card class="form-card" shadow="never" style="margin-bottom: 16px">
    <el-alert
      title="Apps Script Web App 建議部署成 Anyone。Only myself / Anyone with Google account 可能會讓前端 fetch 拿到 Google 登入頁，導致連線測試失敗。"
      type="warning"
      :closable="false"
      show-icon
      style="margin-bottom: 16px"
    />
    <el-form label-position="top" @submit.prevent>
      <el-form-item label="Apps Script Web App URL">
        <el-input v-model="endpoint" placeholder="https://script.google.com/macros/s/.../exec" />
      </el-form-item>
      <div class="mobile-actions">
        <el-button type="primary" :icon="Check" @click="save">儲存</el-button>
        <el-button :icon="Connection" :loading="testing" @click="test">測試連線並初始化</el-button>
      </div>
    </el-form>
  </el-card>

  <el-card class="form-card" shadow="never" style="margin-bottom: 16px">
    <template #header>
      <div class="maintenance-header">
        <strong>現有車輛</strong>
        <el-button :icon="Refresh" @click="loadVehicles">重新整理</el-button>
      </div>
    </template>
    <el-table :data="vehicles">
      <el-table-column prop="name" label="車輛" min-width="140" />
      <el-table-column prop="type" label="類型" width="110" />
      <el-table-column prop="fuel_type" label="能源" width="110" />
      <el-table-column label="油箱容量（公升）" min-width="180">
        <template #default="{ row }">
          <el-input v-model.number="row.tank_capacity_liters" type="number" inputmode="decimal" min="0" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button size="small" :loading="savingVehicleId === row.vehicle_id" @click="saveExistingVehicle(row)">儲存</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>

  <el-card class="form-card" shadow="never">
    <template #header>
      <strong>新增車輛</strong>
    </template>
    <el-form label-position="top" :model="vehicleForm" @submit.prevent>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="車輛名稱" required>
            <el-input v-model="vehicleForm.name" autocomplete="off" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="類型" required>
            <el-select v-model="vehicleForm.type" style="width: 100%">
              <el-option label="汽車" value="car" />
              <el-option label="機車" value="motorcycle" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="廠牌">
            <el-input v-model="vehicleForm.brand" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="型號">
            <el-input v-model="vehicleForm.model" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="年份">
            <el-input v-model.number="vehicleForm.year" type="number" inputmode="numeric" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="車牌">
            <el-input v-model="vehicleForm.plate_no" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="能源">
            <el-select v-model="vehicleForm.fuel_type" clearable style="width: 100%">
              <el-option label="汽油" value="gasoline" />
              <el-option label="柴油" value="diesel" />
              <el-option label="電動" value="electric" />
              <el-option label="油電" value="hybrid" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="油箱容量（公升）">
            <el-input v-model.number="vehicleForm.tank_capacity_liters" type="number" inputmode="decimal" min="0" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="目前里程" required>
            <el-input v-model.number="vehicleForm.current_odometer" type="number" min="0" inputmode="decimal" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="建立預設保養項目">
            <el-switch v-model="vehicleForm.create_default_templates" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="備註">
            <el-input v-model="vehicleForm.note" type="textarea" :rows="3" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-button type="primary" :icon="Plus" :loading="savingVehicle" @click="submitVehicle">新增車輛</el-button>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Check, Connection, Plus, Refresh } from '@element-plus/icons-vue';
import { apiGet, apiPost, getEndpoint, setEndpoint } from '../api/client';
import type { Vehicle } from '../types';

const endpoint = ref(getEndpoint());
const testing = ref(false);
const savingVehicle = ref(false);
const savingVehicleId = ref('');
const vehicles = ref<Vehicle[]>([]);
const vehicleForm = reactive({
  name: '',
  type: 'car',
  brand: '',
  model: '',
  year: '' as number | '',
  plate_no: '',
  fuel_type: 'gasoline',
  tank_capacity_liters: null as number | null,
  current_odometer: 0,
  create_default_templates: true,
  note: ''
});

function save() {
  setEndpoint(endpoint.value);
  ElMessage.success('已儲存設定');
}

async function test() {
  save();
  testing.value = true;
  try {
    const result = await apiGet<{ spreadsheet_id: string; spreadsheet_url: string }>('initDatabase');
    ElMessage.success(`已初始化 ${result.spreadsheet_id}`);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    testing.value = false;
  }
}

function resetVehicleForm() {
  vehicleForm.name = '';
  vehicleForm.type = 'car';
  vehicleForm.brand = '';
  vehicleForm.model = '';
  vehicleForm.year = '';
  vehicleForm.plate_no = '';
  vehicleForm.fuel_type = 'gasoline';
  vehicleForm.tank_capacity_liters = null;
  vehicleForm.current_odometer = 0;
  vehicleForm.create_default_templates = true;
  vehicleForm.note = '';
}

async function submitVehicle() {
  savingVehicle.value = true;
  try {
    await apiPost('createVehicle', { ...vehicleForm });
    ElMessage.success('已新增車輛，回 Dashboard 即可選擇');
    resetVehicleForm();
    await loadVehicles();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    savingVehicle.value = false;
  }
}

async function loadVehicles() {
  try {
    vehicles.value = await apiGet<Vehicle[]>('listVehicles');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  }
}

async function saveExistingVehicle(vehicle: Vehicle) {
  savingVehicleId.value = vehicle.vehicle_id;
  try {
    await apiPost('updateVehicle', {
      ...vehicle,
      tank_capacity_liters: vehicle.tank_capacity_liters || ''
    });
    ElMessage.success('已更新車輛油箱容量');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    savingVehicleId.value = '';
  }
}

onMounted(loadVehicles);
</script>
