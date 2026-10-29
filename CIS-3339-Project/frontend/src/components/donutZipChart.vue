<template>
  <div class="w-1/2">
    <canvas class="p-10" ref="zipChart"></canvas>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

//define props (label and chartData)
const props = defineProps({
  label: { type: Array, default: () => [] },
  chartData: { type: Array, default: () => [] }
})

// matches ref="zipChart" on the canvas
const zipChart = ref(null)
let chart

function renderChart() {
  if (!zipChart.value) return
  // destroy the old chart before drawing a new one so canvas handlers don't pile up
  chart?.destroy()
  chart = new Chart(zipChart.value, {
    type: 'doughnut',
    data: {
      labels: [...props.label],
      datasets: [{ borderWidth: 1, data: [...props.chartData] }]
    },
    options: {
      plugins: { legend: { display: false }, title: { display: true, text: 'Clients by Zip Code' } },
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