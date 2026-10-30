<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-100">
        <tr>
          <th
            v-for="column in columns"
            :key="getColumnKey(column)"
            scope="col"
            class="px-4 py-3 text-left text-sm font-semibold text-gray-700"
          >
            <button
              type="button"
              class="flex items-center gap-1"
              @click="toggleSort(column)"
            >
              {{ column.label }}

              <span v-if="sortField === getColumnKey(column)">
                <span v-if="sortDirection === 'asc'">▲</span>
                <span v-else-if="sortDirection === 'desc'">▼</span>
              </span>
            </button>
          </th>
        </tr>
      </thead>

      <tbody class="divide-y divide-gray-200 bg-white">
        <tr
          v-for="(row, index) in paginatedRows"
          :key="getRowKey(row, index)"
          class="cursor-pointer hover:bg-gray-50"
          :class="[
            rowClass ? rowClass(row) : '',
            hoveredRow === getRowKey(row, index) ? 'bg-gray-50' : ''
          ]"
          @mouseenter="hoveredRow = getRowKey(row, index)"
          @mouseleave="hoveredRow = null"
          @click="emit('row-click', row)"
        >
          <td
            v-for="column in columns"
            :key="getColumnKey(column)"
            class="px-4 py-3 text-sm text-gray-700"
          >
            <slot
              :name="`cell-${getColumnKey(column)}`"
              :row="row"
              :value="getCellValue(row, getColumnKey(column))"
              :column="column"
            >
              {{ getDisplayValue(row, column) }}
            </slot>
          </td>
        </tr>

        <tr v-if="rows.length === 0">
          <td
            :colspan="Math.max(columns.length, 1)"
            class="px-4 py-6 text-center text-sm text-gray-500"
          >
            No results found.
          </td>
        </tr>
      </tbody>
    </table>

    <div
      v-if="rows.length > 0"
      class="mt-4 flex items-center justify-between"
    >
      <p class="text-sm text-gray-600">
        Showing {{ showingStart }}-{{ showingEnd }} of {{ rows.length }}
      </p>

      <div class="flex items-center gap-2">
        <button
          type="button"
          class="rounded border px-3 py-1 disabled:opacity-50"
          :disabled="currentPage === 1"
          @click="previousPage"
        >
          Previous
        </button>

        <span class="text-sm">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <button
          type="button"
          class="rounded border px-3 py-1 disabled:opacity-50"
          :disabled="currentPage === totalPages"
          @click="nextPage"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true
  },
  rows: {
    type: Array,
    required: true
  },
  rowKey: {
    type: String,
    default: '_id'
  },
  rowClass: {
    type: Function,
    default: null
  }
})

const emit = defineEmits(['row-click'])

const hoveredRow = ref(null)
const sortField = ref(null)
const sortDirection = ref(null)
const currentPage = ref(1)
const rowsPerPage = 10

const sortedRows = computed(() => {
  const copiedRows = [...props.rows]

  if (!sortField.value || !sortDirection.value) {
    return copiedRows
  }

  return copiedRows.sort((firstRow, secondRow) => {
    const firstValue = getCellValue(firstRow, sortField.value)
    const secondValue = getCellValue(secondRow, sortField.value)

    if (firstValue == null && secondValue == null) return 0
    if (firstValue == null) return 1
    if (secondValue == null) return -1

    let comparison

    if (
      typeof firstValue === 'number' &&
      typeof secondValue === 'number'
    ) {
      comparison = firstValue - secondValue
    } else {
      comparison = String(firstValue).localeCompare(
        String(secondValue),
        undefined,
        {
          numeric: true,
          sensitivity: 'base'
        }
      )
    }

    return sortDirection.value === 'asc'
      ? comparison
      : -comparison
  })
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(sortedRows.value.length / rowsPerPage))
)

const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage
  return sortedRows.value.slice(start, start + rowsPerPage)
})

const showingStart = computed(() => {
  if (props.rows.length === 0) return 0
  return (currentPage.value - 1) * rowsPerPage + 1
})

const showingEnd = computed(() =>
  Math.min(currentPage.value * rowsPerPage, props.rows.length)
)

// Return to the first page when a search supplies a new list of rows.
watch(
  () => props.rows,
  () => {
    currentPage.value = 1
  },
  { deep: true }
)

watch(totalPages, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value
  }
})

function getRowKey(row, index) {
  return row?.[props.rowKey] ?? index
}

function getColumnKey(column) {
  return column.key ?? column.field
}

function getCellValue(row, key) {
  return key
    .split('.')
    .reduce((value, part) => value?.[part], row)
}

function getDisplayValue(row, column) {
  const value = getCellValue(row, getColumnKey(column))

  if (typeof column.render === 'function') {
    return column.render(value, row)
  }

  return value
}

function toggleSort(column) {
  const field = getColumnKey(column)

  if (sortField.value !== field) {
    sortField.value = field
    sortDirection.value = 'asc'
  } else if (sortDirection.value === 'asc') {
    sortDirection.value = 'desc'
  } else if (sortDirection.value === 'desc') {
    sortField.value = null
    sortDirection.value = null
  } else {
    sortDirection.value = 'asc'
  }

  currentPage.value = 1
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}
</script>