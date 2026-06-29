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
    backgroundColor: 'transparent',
    textStyle: { color: '#b7c4d8' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17, 24, 39, 0.96)',
      borderColor: 'rgba(148, 163, 184, 0.24)',
      textStyle: { color: '#edf4ff' },
      valueFormatter: (value: number | string) => formatMoney(value)
    },
    legend: { bottom: 0, data: ['加油', '保養'], textStyle: { color: '#b7c4d8' } },
    grid: { top: 16, right: 16, bottom: 48, left: 52 },
    xAxis: {
      type: 'category',
      data: months,
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.24)' } },
      axisLabel: { color: '#96a5bb' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.24)' } },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
      axisLabel: {
        color: '#96a5bb',
        formatter: (value: number) => formatMoney(value)
      }
    },
    series: [
      {
        name: '加油',
        type: 'bar',
        data: months.map((month) => round(props.fuel.find((item) => item.month === month)?.total ?? 0, 1)),
        itemStyle: { color: '#2dd4bf' }
      },
      {
        name: '保養',
        type: 'bar',
        data: months.map((month) => round(props.maintenance.find((item) => item.month === month)?.total ?? 0, 1)),
        itemStyle: { color: '#f59e0b' }
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
