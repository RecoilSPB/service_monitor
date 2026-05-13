// import type { MonitoringResponse } from '~/types/monitoring'
// import type { RequestHistoryItem, RequestResultMeta } from '~/types/monitoring-ui'
// import { makeId } from './useMonitoringUtils'
import { api } from '~/services/api.service'
import type { MonitoringJobRecordAsync } from '~/types/monitoring-async'
import { useMonitoringAsyncJobs } from './useMonitoringAsyncJobs'

// const HISTORY_STORAGE_KEY = 'monitoring-docs-history'
// const HISTORY_TTL_DAYS = 7

// function getExpireAt(createdAt: Date) {
//   const expireAt = new Date(createdAt)
//   expireAt.setDate(expireAt.getDate() + HISTORY_TTL_DAYS)
//   expireAt.setHours(23, 59, 59, 999)
//   return expireAt.toISOString()
// }

// function isHistoryItemExpired(item: RequestHistoryItem) {
//   return new Date(item.expireAt).getTime() < Date.now()
// }

// function normalizeHistoryItem(item: any): RequestHistoryItem {
//   return {
//     id: item.id || makeId(),
//     createdAt: item.createdAt || new Date().toISOString(),
//     expireAt: item.expireAt || getExpireAt(new Date()),
//     stand: item.stand || 'unknown',
//     params: item.params || {},
//     previewUrl: item.previewUrl || '',
//     durationMs: item.durationMs,
//     result: item.result || null,
//     resultMeta: item.resultMeta || {
//       success: false,
//       errorMessage: 'Старая запись (без meta)'
//     }
//   }
// }

export function useMonitoringHistory() {
  const requestHistory = ref<MonitoringJobRecordAsync[]>([])
  const historyCollapsed = ref(true)
  const jobs = useState<MonitoringJobRecordAsync[]>('monitoring-async-jobs', () => [])
  const { subscribe } = useMonitoringAsyncJobs()

  const hasHistory = computed(() => requestHistory.value.length > 0)
  const historyCount = computed(() => requestHistory.value.length)

  // function pruneHistory(items: RequestHistoryItem[]) {
  //   return items.filter(item => !isHistoryItemExpired(item))
  // }

  async function loadJobs(limit = 100) {
    const response = await api.get<{ items: MonitoringJobRecordAsync[] }>('/api/monitoring/docs/jobs', {
      params: { limit }
    })

    requestHistory.value = response.data.items
    jobs.value = response.data.items
    response.data.items
      .filter(job => job.status === 'queued' || job.status === 'running')
      .forEach(job => subscribe(job.jobId))
    return requestHistory.value
  }

  // function saveHistoryItem(
  //   stand: string,
  //   params: Record<string, string>,
  //   previewUrl: string,
  //   result: MonitoringResponse | null,
  //   resultMeta: RequestResultMeta,
  //   durationMs?: number
  // ) {
  //   const now = new Date()

  //   const item: MonitoringJobRecord = {
  //     jobId,
  //     createdAt: now.toISOString(),
  //     expireAt: getExpireAt(now),
  //     stand,
  //     params,
  //     previewUrl,
  //     durationMs,
  //     result,
  //     resultMeta
  //   }

  //   requestHistory.value = [item, ...requestHistory.value]
  // }

  function removeHistoryItem(id: string) {
    requestHistory.value = requestHistory.value.filter(item => item.jobId !== id)
  }

  function clearHistory() {
    requestHistory.value = []
  }

  return {
    requestHistory,
    historyCollapsed,
    hasHistory,
    historyCount,
    loadJobs,
    removeHistoryItem,
    clearHistory
  }
}
