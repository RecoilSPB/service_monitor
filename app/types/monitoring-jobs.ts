export type MonitoringJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface MonitoringJobParams {
  val?: string
  template_id?: string
  document_id?: string
  dateFrom?: string
  dateTo?: string
}

export interface MonitoringJobRequest {
  stand: string
  params: MonitoringJobParams
  clientId: string
}

export interface MonitoringJobProgress {
  phase: 'queued' | 'starting' | 'fetching' | 'processing' | 'completed' | 'failed' | 'cancelled'
  percent: number
  message?: string
}

export interface MonitoringJobError {
  code: string
  message: string
}

export interface MonitoringJobRecord {
  jobId: string
  dedupeKey: string
  status: MonitoringJobStatus
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  durationMs: number | null
  request: MonitoringJobRequest
  requestIp: string | null
  progress: MonitoringJobProgress
  result: unknown | null
  error: MonitoringJobError | null
  retryOfJobId?: string | null
}

export interface MonitoringJobListResponse {
  items: MonitoringJobRecord[]
  total: number
}