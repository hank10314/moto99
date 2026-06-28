<template>
  <el-tag class="status-pill" :type="type" effect="light">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MaintenanceStatusType } from '../types';

const props = defineProps<{ status: MaintenanceStatusType }>();

const label = computed(() => {
  const map: Record<MaintenanceStatusType, string> = {
    normal: '正常',
    warning: '即將到期',
    overdue: '已逾期',
    unknown: '未建立'
  };
  return map[props.status];
});

const type = computed(() => {
  const map: Record<MaintenanceStatusType, 'success' | 'warning' | 'danger' | 'info'> = {
    normal: 'success',
    warning: 'warning',
    overdue: 'danger',
    unknown: 'info'
  };
  return map[props.status];
});
</script>
