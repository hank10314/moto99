<template>
  <el-empty v-if="!trend.length" description="尚無油耗資料" :image-size="80" />
  <div v-show="trend.length" ref="chartEl" class="dashboard-chart"></div>
</template>

<script setup lang="ts">
import * as echarts from 'echarts';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { formatDateOnly, formatFuelConsumption, formatKm, formatMoney, round } from '../utils/format';

const props = defineProps<{
  trend: Array<{
    date: string;
    odometer_km: number;
    fuel_consumption_km_l: number;
    cost_per_km?: number | '';
  }>;
}>();

const chartEl = ref<HTMLDivElement | null>(null);
let chart: echarts.ECharts | null = null;

const sortedTrend = computed(() =>
  [...props.trend].sort((a, b) => {
    const dateDiff = getDateTime(a.date) - getDateTime(b.date);
    if (dateDiff !== 0) return dateDiff;
    return Number(a.odometer_km || 0) - Number(b.odometer_km || 0);
  })
);

function renderChart() {
  if (!chartEl.value || !sortedTrend.value.length) return;
  if (!chart) chart = echarts.init(chartEl.value);
  chart.setOption({
    backgroundColor: 'transparent',
    color: ['#2dd4bf'],
    textStyle: { color: '#b7c4d8' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(17, 24, 39, 0.96)',
      borderColor: 'rgba(148, 163, 184, 0.24)',
      textStyle: { color: '#edf4ff' },
      formatter: (params: Array<{ dataIndex: number; marker: string; value: number }>) => {
        const index = params[0]?.dataIndex ?? 0;
        const row = sortedTrend.value[index];
        if (!row) return '';
        const cost = row.cost_per_km === '' || row.cost_per_km === undefined ? '-' : formatMoney(row.cost_per_km);
        return [
          formatDateOnly(row.date),
          `${params[0].marker}油耗：${formatFuelConsumption(row.fuel_consumption_km_l)}`,
          `里程：${formatKm(row.odometer_km)}`,
          `每公里：${cost}`
        ].join('<br/>');
      }
    },
    grid: { top: 18, right: 18, bottom: 42, left: 48 },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: sortedTrend.value.map((row) => formatDateOnly(row.date).slice(5)),
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.24)' } },
      axisLabel: { color: '#96a5bb' }
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.24)' } },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
      axisLabel: {
        color: '#96a5bb',
        formatter: (value: number) => `${round(value, 1)}`
      }
    },
    series: [
      {
        name: '油耗',
        type: 'line',
        smooth: true,
        symbolSize: 7,
        data: sortedTrend.value.map((row) => round(row.fuel_consumption_km_l, 2)),
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(45, 212, 191, 0.28)' },
              { offset: 1, color: 'rgba(45, 212, 191, 0.02)' }
            ]
          }
        }
      }
    ]
  });
}

function getDateTime(value: string): number {
  const normalized = formatDateOnly(value);
  const ymd = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])).getTime();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

onMounted(() => {
  renderChart();
  window.addEventListener('resize', renderChart);
});

watch(() => props.trend, renderChart, { deep: true });

onBeforeUnmount(() => {
  window.removeEventListener('resize', renderChart);
  chart?.dispose();
});
</script>
