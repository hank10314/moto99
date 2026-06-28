<template>
  <div ref="chartEl" style="height: 260px"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { formatMoney, round } from '../utils/format';

const props = defineProps<{
  fuel: Array<{ month: string; total: number }>;
  maintenance: Array<{ month: string; total: number }>;
}>();

const chartEl = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

function renderChart() {
  if (!chartEl.value) return;
  if (!chart) chart = echarts.init(chartEl.value);
  const months = Array.from(new Set([...props.fuel.map((item) => item.month), ...props.maintenance.map((item) => item.month)])).sort();
  chart.setOption({
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value: number | string) => formatMoney(value)
    },
    legend: { bottom: 0, data: ['加油', '保養'] },
    grid: { top: 16, right: 16, bottom: 48, left: 52 },
    xAxis: { type: 'category', data: months },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => formatMoney(value)
      }
    },
    series: [
      {
        name: '加油',
        type: 'bar',
        data: months.map((month) => round(props.fuel.find((item) => item.month === month)?.total ?? 0, 1)),
        itemStyle: { color: '#2a9d8f' }
      },
      {
        name: '保養',
        type: 'bar',
        data: months.map((month) => round(props.maintenance.find((item) => item.month === month)?.total ?? 0, 1)),
        itemStyle: { color: '#f4a261' }
      }
    ]
  });
}

onMounted(() => {
  renderChart();
  window.addEventListener('resize', renderChart);
});
watch(() => [props.fuel, props.maintenance], renderChart, { deep: true });
onBeforeUnmount(() => {
  window.removeEventListener('resize', renderChart);
  chart?.dispose();
});
</script>
