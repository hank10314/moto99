<template>
  <el-card class="form-card" shadow="never">
    <el-form label-position="top" :model="form" @submit.prevent>
      <el-row :gutter="16">
        <el-col :xs="24" :sm="12">
          <el-form-item label="車輛名稱" required>
            <el-input v-model="form.name" autocomplete="off" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="類型" required>
            <el-select v-model="form.type" style="width: 100%">
              <el-option label="汽車" value="car" />
              <el-option label="機車" value="motorcycle" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="廠牌">
            <el-input v-model="form.brand" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="型號">
            <el-input v-model="form.model" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="年份">
            <el-input v-model.number="form.year" type="number" inputmode="numeric" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="車牌">
            <el-input v-model="form.plate_no" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="8">
          <el-form-item label="能源">
            <el-select v-model="form.fuel_type" clearable style="width: 100%">
              <el-option label="汽油" value="gasoline" />
              <el-option label="柴油" value="diesel" />
              <el-option label="電動" value="electric" />
              <el-option label="油電" value="hybrid" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="目前里程" required>
            <el-input v-model.number="form.current_odometer" type="number" min="0" inputmode="decimal" />
          </el-form-item>
        </el-col>
        <el-col :xs="24" :sm="12">
          <el-form-item label="建立預設模板">
            <el-switch v-model="form.create_default_templates" />
          </el-form-item>
        </el-col>
        <el-col :span="24">
          <el-form-item label="備註">
            <el-input v-model="form.note" type="textarea" :rows="3" />
          </el-form-item>
        </el-col>
      </el-row>
      <el-button type="primary" :icon="Check" :loading="saving" @click="submit">儲存</el-button>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Check } from '@element-plus/icons-vue';
import { apiPost } from '../api/client';

const router = useRouter();
const saving = ref(false);
const form = reactive({
  name: '',
  type: 'car',
  brand: '',
  model: '',
  year: '' as number | '',
  plate_no: '',
  fuel_type: 'gasoline',
  current_odometer: 0,
  create_default_templates: true,
  note: ''
});

async function submit() {
  saving.value = true;
  try {
    await apiPost('createVehicle', { ...form });
    ElMessage.success('已儲存車輛');
    router.push('/vehicles');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    saving.value = false;
  }
}
</script>
