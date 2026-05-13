import type { MonitoringResponse, MonitoringResponseView } from '~/types/monitoring'
import type { ActiveRequestItem } from '~/types/monitoring-ui'
import { buildPreviewUrl, buildTargetQuery, normalizeResponse } from './useMonitoringUtils'
import type { MonitoringStand } from '~/types/monitoring'
import { useMonitoringAsyncJobs } from './useMonitoringAsyncJobs'
import type { MonitoringJobRecord } from '~/types/monitoring-jobs'
import type { MonitoringJobRecordAsync, MonitorJobResult } from '~/types/monitoring-async'

const { loadJobs } = useMonitoringHistory()

function toActiveRequestItem(
  job: MonitoringJobRecord,
  stands: MonitoringStand[],
  currentClientId: string
): ActiveRequestItem {
  const params = {
    ...(job.request.params || {}),
    stand: job.request.stand
  } as Record<string, string>

  const previewUrl = buildPreviewUrl(stands, job.request.stand, params)

  const startedAtMs = job.startedAt
    ? Date.parse(job.startedAt)
    : Date.parse(job.createdAt)

  const now = Date.now()

  let status: ActiveRequestItem['status'] = 'running'
  if (job.status === 'completed') status = 'success'
  if (job.status === 'failed') status = 'error'
  if (job.status === 'cancelled') status = 'cancelled'

  const result = (job.result as MonitoringResponse | null) ?? null

  return {
    id: job.jobId,
    createdAt: job.createdAt,
    stand: job.request.stand,
    params,
    previewUrl,
    startedAt: Number.isNaN(startedAtMs) ? now : startedAtMs,
    elapsedSeconds: Math.max(
      0,
      Math.floor(((job.durationMs ?? (now - (Number.isNaN(startedAtMs) ? now : startedAtMs))) || 0) / 1000)
    ),
    controller: new AbortController(),
    status,
    canCancel:
      (job.status === 'queued' || job.status === 'running') &&
      !!currentClientId &&
      job.request.clientId === currentClientId,
    durationMs: job.durationMs ?? undefined,
    result,
    resultMeta: job.status === 'completed'
      ? {
          success: true,
          count: result?.count,
          documents_processed: result?.documents_processed,
          with_differences: result?.with_differences
        }
      : {
          success: false,
          errorMessage: job.error?.message || job.progress.message,
          cancelled: job.status === 'cancelled'
        }
  }
}

export function useMonitoringRequests(options: {
  stands: Ref<MonitoringStand[]>
}) {
  const responseData = ref<MonitoringResponseView | null>(null)
  const errorMessage = ref('')

  const {
    jobs,
    clientId,
    createJob,
    loadResult,
    cancelJob
  } = useMonitoringAsyncJobs()

  const activeRequests = computed<ActiveRequestItem[]>(() =>
    jobs.value.map(job => toActiveRequestItem(job, options.stands.value, clientId.value))
  )

  const hasActiveRequests = computed(() => activeRequests.value.length > 0)
  const activeRequestsCount = computed(() => activeRequests.value.length)
  const runningRequestsCount = computed(() => activeRequests.value.filter(item => item.status === 'running').length)

  let activeRequestsTimer: number | null = null

  function startActiveRequestsTimer() {
    stopActiveRequestsTimer()

    activeRequestsTimer = window.setInterval(() => {
      jobs.value = [...jobs.value]
    }, 1000)
  }

  function stopActiveRequestsTimer() {
    if (activeRequestsTimer) {
      clearInterval(activeRequestsTimer)
      activeRequestsTimer = null
    }
  }

  function openRequestResult(result: MonitorJobResult | null, resultMeta?: ActiveRequestItem['resultMeta']) {
    errorMessage.value = ''

    if (!result) {
      responseData.value = null
      errorMessage.value = resultMeta?.errorMessage || 'Результат недоступен'
      return
    }

    responseData.value = normalizeResponse(result)
  }

  async function openActiveRequestResult(item: MonitoringJobRecordAsync) {
    errorMessage.value = ''

    try {
      const result = await loadResult(item.jobId) as MonitoringResponse
      
      responseData.value = normalizeResponse(result)
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Результат недоступен'
      responseData.value = null
      errorMessage.value = message
    }
  }

  async function cancelActiveRequest(id: string) {
    await cancelJob(id)
    await loadJobs()
  }

  function removeActiveRequest(id: string) {
    jobs.value = jobs.value.filter(item => item.jobId !== id)
  }

  async function submit(form: {
    stand: string
    val: number | null
    template_id: number | null
    document_id: string | null
    dateFromLocal: string
    dateToLocal: string
  }) {
    errorMessage.value = ''

    const params = buildTargetQuery(form)
    const stand = form.stand
    const previewUrl = buildPreviewUrl(options.stands.value, stand, params)

    try {
      await createJob({
        stand,
        params
      })

      await loadJobs()
    } catch (error: any) {
      const message = error?.data?.message || error?.message || 'Ошибка выполнения запроса'
      errorMessage.value = message
    }
  }

  return {
    activeRequests,
    hasActiveRequests,
    activeRequestsCount,
    runningRequestsCount,
    responseData,
    errorMessage,
    startActiveRequestsTimer,
    stopActiveRequestsTimer,
    openRequestResult,
    openActiveRequestResult,
    cancelActiveRequest,
    removeActiveRequest,
    submit,
  }
}