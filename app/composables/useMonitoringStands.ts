import { getStands } from '~/services/data.request.service'
import type { MonitoringStand } from '~/types/monitoring'

export function useMonitoringStands(initialStand = 'local') {
  const stands = ref<MonitoringStand[]>([])
  const standsPending = ref(true)
  const standsError = ref('')
  const selectedStand = ref(initialStand)

  async function loadStands() {
    standsPending.value = true
    standsError.value = ''

    try {
      const data = await getStands();
      stands.value = data

      if (data[0] && data.length && !data.find(item => item.key === selectedStand.value)) {
        selectedStand.value = data[0].key
      }
    } catch (error: any) {
      standsError.value = error?.data?.message || error?.message || 'Не удалось загрузить стенды'
    } finally {
      standsPending.value = false
    }
  }

  return {
    stands,
    standsPending,
    standsError,
    selectedStand,
    loadStands
  }
}
