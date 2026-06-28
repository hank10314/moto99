<template>
  <div>
    <div class="chart-toolbar">
      <el-radio-group v-model="scope" size="small">
        <el-radio-button label="all">總支出</el-radio-button>
        <el-radio-button label="yearly">年度支出</el-radio-button>
      </el-radio-group>
    </div>
    <el-empty v-if="!selectedRows.length" description="尚無支出資料" :image-size="80" />
    <div v-show="selectedRows.length" ref="chartEl" class="dashboard-chart"></div>
  </div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { formatMoney } from '../utils/format';

const props = defineProps<{
  totals: {
    all: Array<{ category: string; total: number }>;
    yearly: Array<{ category: string; total: number }>;
  };
}>();

const scope = ref<'all' | 'yearly'>('all');
const chartEl = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const selectedRows = computed(() => props.totals?.[scope.value] || []);

function renderChart() {
  if (!chartEl.value || !selectedRows.value.length) return;
  if (!chart) chart = echarts.init(chartEl.value);
  chart.setOption({
    color: ['#2a9d8f', '#e76f51', '#457b9d'],
    tooltip: {
      trigger: 'item',
      formatter: (params: { name: string; value: number; percent: number }) =>
        `${params.name}<br/>${formatMoney(params.value)} (${params.percent.toFixed(1)}%)`
    },
    legend: {
      bottom: 0,
      icon: 'circle'
    },
    series: [
      {
        name: scope.value === 'all' ? '總支出' : '年度支出',
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '43%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          formatter: '{b}\n{d}%'
        },
        data: selectedRows.value.map((row) => ({
          name: row.category,
          value: row.total
        }))
      }
    ]
  });
}

onMounted(() => {
  renderChart();
  window.addEventListener('resize', renderChart);
});

watch([selectedRows, scope], renderChart, { deep: true });

onBeforeUnmount(() => {
  window.removeEventListener('resize', renderChart);
  chart?.dispose();
});
</script>
