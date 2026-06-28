import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';
import 'element-plus/dist/index.css';
import './styles.css';
import App from './App.vue';
import { router } from './router';
import { syncPendingQueue } from './api/client';

const app = createApp(App);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
app.use(router);
app.use(ElementPlus);
app.mount('#app');

window.addEventListener('online', () => {
  void syncPendingQueue();
});

if ('serviceWorker' in navigator) {
  void import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }));
}
