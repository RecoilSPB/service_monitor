import type { MonitoringJobRecord, MonitoringJobRequest } from '~/types/monitoring-jobs'
import { api, backendBaseUrl } from '~/services/api.service'

export function useMonitoringAsyncJobs() {
  const jobs = useState<MonitoringJobRecord[]>('monitoring-async-jobs', () => [])
  const eventSources = new Map<string, EventSource>()
  const clientId = useState<string>('monitoring-client-id-state', () => '')

  function upsertJob(job: MonitoringJobRecord) {
    const idx = jobs.value.findIndex(item => item.jobId === job.jobId)
    if (idx === -1) {
      jobs.value = [job, ...jobs.value]
    } else {
      jobs.value[idx] = job
      jobs.value = [...jobs.value]
    }
  }

  async function createJob(request: Omit<MonitoringJobRequest, 'clientId'>) {
    const response = await api.post<{ jobId: string }>('/api/monitoring/docs/jobs', {
      ...request,
      clientId: clientId.value
    })

    const created = response.data
    await refreshJob(created.jobId)
    subscribe(created.jobId)
    return created
  }

  async function refreshJob(jobId: string) {
    const response = await api.get<MonitoringJobRecord>(`/api/monitoring/docs/jobs/${jobId}`)
    const job = response.data
    upsertJob(job)
    return job
  }

  async function loadResult(jobId: string) {
    const response = await api.get(`/api/monitoring/docs/jobs/${jobId}/result`)
    return response.data
  }

  async function cancelJob(jobId: string) {
    await api.post(`/api/monitoring/docs/jobs/${jobId}/cancel`, {
      clientId: clientId.value
    })

    await refreshJob(jobId)
  }

  async function retryJob(jobId: string) {
    const response = await api.post<{ jobId: string }>(`/api/monitoring/docs/jobs/${jobId}/retry`)
    const created = response.data
    await refreshJob(created.jobId)
    subscribe(created.jobId)
    return created
  }

  function subscribe(jobId: string) {
    // if (process.server || eventSources.has(jobId)) return

    const base = backendBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
    const eventUrl = new URL(`/api/monitoring/docs/jobs/${jobId}/events`, base).toString()

    const es = new EventSource(eventUrl)
    es.addEventListener('job', (event) => {
      const data = JSON.parse((event as MessageEvent).data) as MonitoringJobRecord
      upsertJob(data)
      if (['completed', 'failed', 'cancelled'].includes(data.status)) {
        unsubscribe(jobId)
      }
    })
    es.onerror = () => {}
    eventSources.set(jobId, es)
  }

  function unsubscribe(jobId: string) {
    const es = eventSources.get(jobId)
    if (!es) return
    es.close()
    eventSources.delete(jobId)
  }

  onBeforeUnmount(() => {
    eventSources.forEach(es => es.close())
    eventSources.clear()
  })

  return {
    jobs,
    clientId,
    createJob,
    refreshJob,
    loadResult,
    cancelJob,
    retryJob,
    subscribe,
    unsubscribe
  }
}