<!-- This view displays a list of events. Users can search for events, and click on an event to be redirected to another component to view that event's details -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        List of Events
      </h1>
    </div>

    <div class="px-10 pt-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <h2 class="text-2xl font-bold">Search Event By</h2>

        <!-- Displays Event Name or Event Date selection -->
        <div class="flex flex-col">
          <select
            v-model="searchBy"
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="Event Name">Event Name</option>
            <option value="Event Date">Event Date</option>
          </select>
        </div>

        <!--Displays event name search field-->
        <div class="flex flex-col" v-if="searchBy === 'Event Name'">
          <label class="block">
            <input
              type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="name"
              @keyup.enter="handleSubmitForm"
              placeholder="Enter event name"
            />
          </label>
        </div>

        <!-- Displays event date search field -->
        <div class="flex flex-col" v-if="searchBy === 'Event Date'">
          <input
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            type="date"
            v-model="eventDate"
            @keyup.enter="handleSubmitForm"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div></div>
        <div></div>

        <!--Clear Search button-->
        <div class="mt-5 grid-cols-2">
          <button
            class="mr-10 border border-red-700 bg-white text-red-700 rounded"
            @click="loadData"
            type="button"
          >
            Clear Search
          </button>

          <!--Search Event button-->
          <button
            class="bg-red-700 text-white rounded"
            @click="handleSubmitForm"
            type="button"
          >
            Search Event
          </button>
        </div>
      </div>
    </div>

    <hr class="mt-10 mb-10" />

    <!-- Display Found Data -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <!--Table showing List of Events-->
      <div class="ml-10">
        <h2 class="text-2xl font-bold">List of Events</h2>
        <h3 class="italic">Click table row to view event details</h3>
      </div>

      <div class="flex flex-col col-span-2">
        <p v-if="loading" role="status">Loading events...</p>

        <div v-else-if="error" role="alert">
          <p>{{ error }}</p>
          <button type="button" @click="execute(lastRequest)">Retry</button>
        </div>

        <DataTable
          v-else
          :columns="columns"
          :rows="data || []"
          @row-click="openEvent"
        >
          <template #cell-date="{ value }">
            {{ formatDate(value) }}
          </template>
        </DataTable>
      </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getEvents, searchEvents } from '../api/api'
import { useApi } from '../composables/useApi'
import DataTable from '../components/DataTable.vue'

const router = useRouter()

const searchBy = ref('Event Name')
const name = ref('')
const eventDate = ref('')

const columns = [
  { label: 'Event Name', field: 'name' },
  { label: 'Event Date', field: 'date' },
  { label: 'Event Address', field: 'address.line1' }
]

const { data, loading, error, execute } = useApi(() => getEvents())
const lastRequest = ref(() => getEvents())

onMounted(loadData)

async function loadData() {
  searchBy.value = 'Event Name'
  name.value = ''
  eventDate.value = ''

  lastRequest.value = () => getEvents()
  await execute(lastRequest.value)
}

async function handleSubmitForm() {
  let query

  if (searchBy.value === 'Event Name') {
    if (!name.value) return

    query = {
      searchBy: 'name',
      name: name.value
    }
  } else if (searchBy.value === 'Event Date') {
    if (!eventDate.value) return

    query = {
      searchBy: 'date',
      eventDate: eventDate.value
    }
  } else {
    return
  }

  lastRequest.value = () => searchEvents(query)
  await execute(lastRequest.value)
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

function openEvent(event) {
  router.push({
    name: 'eventdetails',
    params: { id: event._id }
  })
}
</script>