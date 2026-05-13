export type MonitoringJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled'

export type MonitoringJobProgress = {
  phase: 'queued' | 'preparing' | 'requesting_backend' | 'processing_response' | 'completed' | 'failed' | 'cancelled'
  percent: number
  message: string
}

export type MonitoringJobRequestParams = {
  val?: string
  template_id?: string
  document_id?: string
  dateFrom?: string
  dateTo?: string
  stand: string
}

export type MonitoringJobRequest = {
  clientId: string
  stand: string
  params: MonitoringJobRequestParams
}

export type MonitoringJobError = {
  code: string
  message: string
}

interface ValidErrors {
  number: string
  path: string
  test: string
  text: string
}

interface ValidateDbServ {
  code: string
  text: string
  errors: ValidErrors[]
}

export interface MonitorJobDoc {
  diff: string
  documentId: number
  number: number
  templateId: number
  timeDb: string
  timeService: string
  validateDb: ValidateDbServ
  validateService: ValidateDbServ
}

export interface MonitorJobResult {
  docs?: MonitorJobDoc[]
  documentError?: number
  documentsCount?: number
  skip?: number
  time?: number
  uid?: string
  error?: string
  path?: string
  status?: number
  timestamp?: string
}

export type MonitoringJobRecordAsync = {
  jobId: string
  requestHash: string
  status: MonitoringJobStatus
  request: MonitoringJobRequest
  createdAt: string
  startedAt: string | null
  finishedAt: string | null
  durationMs: number | null | undefined
  progress: MonitoringJobProgress
  result: MonitorJobResult | null
  error: MonitoringJobError | null
  dedupeKey: string
  retryOfJobId: string | null
}

export type MonitoringJobCreatedResponse = {
  jobId: string
  deduped: boolean
  status: MonitoringJobStatus
  createdAt: string
  pollUrl: string
  resultUrl: string
  eventsUrl: string
  cancelUrl: string
  retryUrl: string
}

export type MonitoringJobListResponse = {
  items: MonitoringJobRecordAsync[]
  total: number
}
