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
            {{ column.label }}
          </th>
        </tr>
      </thead>

      <tbody class="divide-y divide-gray-200 bg-white">
        <tr
          v-for="(row, index) in rows"
          :key="getRowKey(row, index)"
          class="hover:bg-gray-50"
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
              {{ getCellValue(row, getColumnKey(column)) }}
            </slot>
          </td>
        </tr>

        <tr v-if="rows.length === 0">
          <td
            :colspan="Math.max(columns.length, 1)"
            class="px-4 py-6 text-center text-sm text-gray-500"
          >
            <slot name="empty">No records found.</slot>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue'

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

function getRowKey(row, index) {
  return row?.[props.rowKey] ?? index
}

function getColumnKey(column) {
  return column.key ?? column.field
}

function getCellValue(row, key) {
  return key.split('.').reduce((value, part) => value?.[part], row)
}
</script>