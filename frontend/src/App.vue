<template>
  <el-container class="app-shell">
    <el-aside class="sidebar" width="248px">
      <RouterLink class="brand" to="/">
        <img src="/icon.svg" alt="" />
        <span>汽機車紀錄</span>
      </RouterLink>
      <el-menu router :default-active="$route.path" class="nav-menu">
        <el-menu-item index="/">
          <el-icon><DataBoard /></el-icon>
          <span>Dashboard</span>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><Tickets /></el-icon>
          <span>紀錄</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>設定</span>
        </el-menu-item>
      </el-menu>
      <div class="sync-panel">
        <el-button :icon="Refresh" plain size="small" :loading="syncing" @click="syncNow">同步</el-button>
        <span>{{ queueCount }} pending</span>
      </div>
    </el-aside>
    <el-container>
      <el-header class="topbar">
        <div>
          <strong>{{ pageTitle }}</strong>
          <span>{{ online ? 'Online' : 'Offline' }}</span>
        </div>
      </el-header>
      <el-main class="content">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { syncPendingQueue } from './api/client';
import { listQueue } from './api/offlineQueue';

const route = useRoute();
const online = ref(navigator.onLine);
const syncing = ref(false);
const queueCount = ref(0);

const titles: Record<string, string> = {
  dashboard: 'Dashboard',
  records: '紀錄',
  vehicles: 'Dashboard',
  'vehicle-new': '系統設定',
  'vehicle-detail': '車輛詳情',
  'fuel-logs': '加油紀錄',
  'fuel-new': '新增加油',
  'expense-new': '新增費用',
  'expense-edit': '編輯費用',
  'maintenance-logs': '保養紀錄',
  'maintenance-new': '新增保養',
  'maintenance-edit': '編輯保養',
  'fuel-edit': '編輯加油',
  'maintenance-status': '保養狀態',
  templates: '保養模板',
  odometer: '里程紀錄',
  settings: '系統設定'
};

const pageTitle = computed(() => titles[String(route.name)] || '汽機車紀錄');

async function refreshQueueCount() {
  queueCount.value = (await listQueue()).length;
}

async function syncNow() {
  syncing.value = true;
  try {
    const count = await syncPendingQueue();
    await refreshQueueCount();
    ElMessage.success(count ? `已同步 ${count} 筆` : '沒有待同步資料');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    syncing.value = false;
  }
}

onMounted(() => {
  void refreshQueueCount();
  window.addEventListener('online', () => {
    online.value = true;
    void syncNow();
  });
  window.addEventListener('offline', () => {
    online.value = false;
  });
});
</script>
