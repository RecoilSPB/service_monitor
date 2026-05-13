import type { MonitoringResponse } from '~/types/monitoring'

export type XmlDiffLine = {
  lineNumber: number
  left: string
  right: string
  status: 'same' | 'changed' | 'added' | 'removed'
}

export type StoredMonitoringResponse = MonitoringResponse

export type RequestResultMeta = {
  success: boolean
  count?: number
  documents_processed?: number
  with_differences?: number
  errorMessage?: string
  cancelled?: boolean
}

export type RequestHistoryItem = {
  id: string
  createdAt: string
  expireAt: string
  stand: string
  params: Record<string, string>
  previewUrl: string
  durationMs?: number
  result: StoredMonitoringResponse | null
  resultMeta: RequestResultMeta
}

export type ActiveRequestItem = {
  id: string
  createdAt: string
  stand: string
  params: Record<string, string>
  previewUrl: string
  startedAt: number
  elapsedSeconds: number
  controller: AbortController
  status: 'running' | 'success' | 'error' | 'cancelled'
  canCancel: boolean
  durationMs?: number
  result: StoredMonitoringResponse | null
  resultMeta?: RequestResultMeta
}