<!-- This is the home view - which shows a dashboard -->
<template>
  <main>
    <div>
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        Dashboard
      </h1>
      <br />

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div class="ml-10"></div>

        <div class="flex flex-col col-span-2">
          <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
            Events Attendance
          </h1>

          <p v-if="attendanceLoading" class="mt-10 text-center" role="status">
            Loading...
          </p>

          <div v-else-if="attendanceError" class="mt-12 bg-red-50" role="alert">
            <h3 class="px-4 py-1 text-4xl font-bold text-white bg-red-800">
              Unable to load attendance
            </h3>
            <p class="p-4 text-lg font-bold text-red-900">
              {{ attendanceError }}
            </p>
            <button class="mb-4 ml-4 rounded border px-3 py-1" @click="loadAttendance">
              Retry
            </button>
          </div>

          <div
            v-else-if="!recentEvents.length"
            class="flex justify-center mt-10"
          >
            No events found.
          </div>

          <template v-else>
            <table class="min-w-full shadow-md rounded">
              <thead class="bg-gray-50 text-xl">
                <tr class="p-4 text-left">
                  <th class="p-4 text-left">Event Name</th>
                  <th class="p-4 text-left">Event Date</th>
                  <th class="p-4 text-left">Number of Attendees</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-gray-300">
                <tr
                  v-for="event in recentEvents"
                  :key="event._id"
                  class="cursor-pointer"
                  @click="editEvent(event._id)"
                >
                  <td class="p-2 text-left">{{ event.name }}</td>
                  <td class="p-2 text-left">{{ formatDate(event.date) }}</td>
                  <td class="p-2 text-left">
                    {{ event.attendees?.length || 0 }}
                  </td>
                </tr>
              </tbody>
            </table>

            <AttendanceChart
              :label="attendanceLabels"
              :chart-data="attendanceChartData"
            />
          </template>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div class="ml-10"></div>

        <div class="flex flex-col col-span-2">
          <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
            Clients by Zip Code
          </h1>

          <p v-if="zipLoading" class="mt-10 text-center" role="status">
            Loading...
          </p>

          <div v-else-if="zipError" class="mt-12 bg-red-50" role="alert">
            <h3 class="px-4 py-1 text-4xl font-bold text-white bg-red-800">
              Unable to load client zip code data
            </h3>
            <p class="p-4 text-lg font-bold text-red-900">
              {{ zipError }}
            </p>
            <button class="mb-4 ml-4 rounded border px-3 py-1" @click="loadZipData">
              Retry
            </button>
          </div>

          <div v-else-if="!zips.length" class="flex justify-center mt-10">
            No clients found.
          </div>

          <template v-else>
            <table class="min-w-full shadow-md rounded">
              <thead class="bg-gray-50 text-xl">
                <tr class="p-4 text-left">
                  <th class="p-4 text-left">Zip Number</th>
                  <th class="p-4 text-left">Client Count</th>
                </tr>
              </thead>

              <tbody class="divide-y divide-gray-300">
                <tr v-for="zip in zips" :key="zip._id">
                  <td class="p-2 text-left">{{ zip._id }}</td>
                  <td class="p-2 text-left">{{ zip.count }}</td>
                </tr>
              </tbody>
            </table>

            <div class="flex justify-center mt-10">
              <ZipChart
                :label="zipLabels"
                :chart-data="zipChartData"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AttendanceChart from '../components/barChart.vue'
import ZipChart from '../components/donutZipChart.vue'
import { getAttendance, getClientsByZipCode } from '../api/api'
import { useApi } from '../composables/useApi'

const router = useRouter()

const {
  data: attendanceData,
  loading: attendanceLoading,
  error: attendanceError,
  execute: executeAttendance
} = useApi(() => getAttendance())

const {
  data: zipData,
  loading: zipLoading,
  error: zipError,
  execute: executeZipData
} = useApi(() => getClientsByZipCode())

const recentEvents = computed(() => attendanceData.value || [])
const zips = computed(() => zipData.value || [])

const attendanceLabels = computed(() =>
  recentEvents.value.map(
    event => `${event.name} (${formatDate(event.date)})`
  )
)

const attendanceChartData = computed(() =>
  recentEvents.value.map(event => event.attendees?.length || 0)
)

const zipLabels = computed(() =>
  zips.value.map(zip => zip._id)
)

const zipChartData = computed(() =>
  zips.value.map(zip => zip.count)
)

onMounted(() => {
  loadAttendance()
  loadZipData()
})

async function loadAttendance() {
  await executeAttendance()
}

async function loadZipData() {
  await executeZipData()
}

function formatDate(date) {
  if (!date) return ''

  const isoDate = new Date(date)
  if (Number.isNaN(isoDate.getTime())) return ''

  const year = isoDate.getUTCFullYear()
  const month = String(isoDate.getUTCMonth() + 1).padStart(2, '0')
  const day = String(isoDate.getUTCDate()).padStart(2, '0')

  return `${month}/${day}/${year}`
}

function editEvent(id) {
  router.push({
    name: 'eventdetails',
    params: { id }
  })
}
</script>