<template>
  <div>
    <canvas class="p-10" ref="attendanceChart"></canvas>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart, Colors, registerables } from 'chart.js'

Chart.register(...registerables, Colors)

const props = defineProps({
  label: { type: Array, default: () => [] },
  chartData: { type: Array, default: () => [] }
})

// matches ref="attendanceChart" on the canvas
const attendanceChart = ref(null)
let chart

function renderChart() {
  if (!attendanceChart.value) return
  // destroy the old chart before drawing a new one so canvas handlers don't pile up
  chart?.destroy()
  chart = new Chart(attendanceChart.value, {
    type: 'bar',
    data: {
      labels: [...props.label],
      datasets: [{ borderWidth: 1, data: [...props.chartData] }]
    },
    options: {
      scales: { y: { ticks: { stepSize: 1 } }, x: { grid: { display: false } } },
      plugins: { legend: { display: false }, title: { display: true, text: 'Attendance Chart' } },
      responsive: true,
      maintainAspectRatio: true
    }
  })
}

onMounted(renderChart)
// redraw if the dashboard passes in new data while the page is open
watch(() => [props.label, props.chartData], renderChart, { deep: true })
// clean up the chart when leaving the page to prevent memory leaks
onBeforeUnmount(() => chart?.destroy())
</script>