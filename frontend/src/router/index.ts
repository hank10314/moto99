import { createRouter, createWebHistory } from 'vue-router';
import DashboardPage from '../pages/DashboardPage.vue';
import ExpenseFormPage from '../pages/ExpenseFormPage.vue';
import FuelLogFormPage from '../pages/FuelLogFormPage.vue';
import MaintenanceFormPage from '../pages/MaintenanceFormPage.vue';
import RecordsPage from '../pages/RecordsPage.vue';
import SettingsPage from '../pages/SettingsPage.vue';

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardPage },
    { path: '/records', name: 'records', component: RecordsPage },
    { path: '/records/fuel/new', name: 'fuel-new', component: FuelLogFormPage },
    { path: '/records/fuel/:fuel_log_id/edit', name: 'fuel-edit', component: FuelLogFormPage },
    { path: '/records/maintenance/new', name: 'maintenance-new', component: MaintenanceFormPage },
    { path: '/records/maintenance/:maintenance_log_id/edit', name: 'maintenance-edit', component: MaintenanceFormPage },
    { path: '/records/expense/new', name: 'expense-new', component: ExpenseFormPage },
    { path: '/records/expense/:expense_log_id/edit', name: 'expense-edit', component: ExpenseFormPage },
    { path: '/settings', name: 'settings', component: SettingsPage },
    { path: '/vehicles/new', redirect: '/settings' },
    { path: '/vehicles/:pathMatch(.*)*', redirect: '/' }
  ]
});
