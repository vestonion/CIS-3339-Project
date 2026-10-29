<!-- This view shows a list of services. Users can search for services and click on a service to be redirected to another component that displays the service's details -->
<template>
  <main>
    <div>
      <!--Header-->
      <h1 class="font-bold text-4xl text-red-700 tracking-widest text-center mt-10">
        Find Services
      </h1>
    </div>

    <div class="px-10 pt-20">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <h2 class="text-2xl font-bold">Search Service By</h2>

        <!-- Displays Service Name and Description selection -->
        <div class="flex flex-col">
          <select
            v-model="searchBy"
            class="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="Service Name">Service Name</option>
            <option value="Service Description">Service Description</option>
          </select>
        </div>

        <!--Display service name search field-->
        <div class="flex flex-col" v-if="searchBy === 'Service Name'">
          <label class="block">
            <input
              type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="name"
              @keyup.enter="handleSubmitForm"
              placeholder="Enter service name"
            />
          </label>
        </div>

        <!--Display service description search field-->
        <div class="flex flex-col" v-if="searchBy === 'Service Description'">
          <label class="block">
            <input
              type="text"
              class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              v-model="description"
              @keyup.enter="handleSubmitForm"
              placeholder="Enter service description"
            />
          </label>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        <div></div>
        <div></div>

        <div class="mt-5 grid-cols-2">
          <!--Clear Search button-->
          <button
            class="mr-10 border border-red-700 bg-white text-red-700 rounded"
            @click="loadData"
            type="button"
          >
            Clear Search
          </button>

          <!--Search Service button-->
          <button
            class="bg-red-700 text-white rounded"
            @click="handleSubmitForm"
            type="button"
          >
            Search Service
          </button>
        </div>
      </div>
    </div>

    <hr class="mt-10 mb-10" />

    <!-- Display Found Data -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
      <!--List of Services table-->
      <div class="ml-10">
        <h2 class="text-2xl font-bold">List of Services</h2>
        <h3 class="italic">Click table row to view service details</h3>
      </div>

      <div class="flex flex-col col-span-2">
        <p v-if="loading" role="status">Loading services...</p>

        <div v-else-if="error" role="alert">
          <p>{{ error }}</p>
          <button type="button" @click="execute(lastRequest)">Retry</button>
        </div>

        <DataTable
          v-else
          :columns="columns"
          :rows="data || []"
          @row-click="openService"
        />
      </div>
    </div>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getServices, searchServices } from '../api/api'
import { useApi } from '../composables/useApi'
import DataTable from '../components/DataTable.vue'

const router = useRouter()

const searchBy = ref('Service Name')
const name = ref('')
const description = ref('')

const columns = [
  { label: 'Service Name', field: 'name' },
  { label: 'Service Description', field: 'description' }
]

const { data, loading, error, execute } = useApi(() => getServices())
const lastRequest = ref(() => getServices())

onMounted(loadData)

async function loadData() {
  searchBy.value = 'Service Name'
  name.value = ''
  description.value = ''

  lastRequest.value = () => getServices()
  await execute(lastRequest.value)
}

async function handleSubmitForm() {
  let query

  if (searchBy.value === 'Service Name') {
    if (!name.value) return

    query = {
      searchBy: 'name',
      name: name.value
    }
  } else if (searchBy.value === 'Service Description') {
    if (!description.value) return

    query = {
      searchBy: 'description',
      description: description.value
    }
  } else {
    return
  }

  lastRequest.value = () => searchServices(query)
  await execute(lastRequest.value)
}

function openService(service) {
  router.push({
    name: 'servicedetails',
    params: { id: service._id }
  })
}
</script>