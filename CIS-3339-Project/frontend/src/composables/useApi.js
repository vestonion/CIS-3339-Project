import { ref } from 'vue'
 
export function useApi(apiCall) {
  const data = ref(null)
  const loading = ref(false)
  const error = ref(null)
 
  async function execute(call = apiCall) {
    loading.value = true
    error.value = null
 
    try {
      data.value = await call()
      return data.value
    } catch (err) {
      error.value = err?.message || 'Something went wrong'
      return null
    } finally {
      loading.value = false
    }
  }
 
  return { data, loading, error, execute }
}