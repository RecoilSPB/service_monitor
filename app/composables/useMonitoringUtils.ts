import type {
  MonitoringResponse,
  MonitoringResponseView,
  ParsedDifferenceItem,
  ParsedDifferenceReport,
  MonitoringStand,
  MonitoringDifferenceView
} from '~/types/monitoring'
import type { MonitorJobResult } from '~/types/monitoring-async'
import type { XmlDiffLine } from '~/types/monitoring-ui'

export function makeId() {
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.crypto &&
    'randomUUID' in globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID()
  }

  return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function formatApiDate(value: string) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (part: number) => String(part).padStart(2, '0')

  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function toDatetimeLocalFromApiDate(value: string) {
  const match = value.match(
    /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/
  )

  if (!match) return ''

  const [, dd, mm, yyyy, hh, min, ss] = match

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`
}

export function formatDurationMs(durationMs?: number) {
  if (durationMs == null) return '—'

  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  if (minutes <= 0) return `${seconds} сек`
  return `${minutes} мин ${seconds} сек`
}

export function formatElapsedSeconds(total: number) {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60

  if (minutes <= 0) return `${seconds} сек`
  return `${minutes} мин ${seconds} сек`
}

export function formatHistoryDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(date)
}

export function formatHistoryExpireDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date)
}

export function buildTargetQuery(form: {
  stand: string
  val: number | null
  template_id: number | null
  document_id: string | null
  dateFromLocal: string
  dateToLocal: string
}) {
  const params: Record<string, string> = {}

  if (form.stand) params.stand = form.stand
  if (form.val !== null && form.val !== undefined) params.val = String(form.val)
  if (form.template_id !== null && form.template_id !== undefined) params.template_id = String(form.template_id)
  if (form.document_id !== null && form.document_id !== undefined) params.document_id = String(form.document_id)

  const formattedDateFrom = formatApiDate(form.dateFromLocal)
  const formattedDateTo = formatApiDate(form.dateToLocal)

  if (formattedDateFrom) params.dateFrom = formattedDateFrom
  if (formattedDateTo) params.dateTo = formattedDateTo

  return params
}

export function buildPreviewUrl(stands: MonitoringStand[], standKey: string, params: Record<string, string>) {
  const stand = stands.find(item => item.key === standKey)
  if (!stand) return ''

  const url = new URL('/monitoring/docs', stand.baseURL)
  Object.entries(params).forEach(([key, value]) => {
    if (key !== 'stand') {
      url.searchParams.set(key, value)
    }
  })
  return url.toString()
}

export function normalizeMultilineXml(value?: string) {
  return (value || '').replace(/\r\n/g, '\n').trim()
}

export function diffXmlLines(leftRaw?: string, rightRaw?: string): XmlDiffLine[] {
  const leftNormalized = normalizeMultilineXml(leftRaw)
  const rightNormalized = normalizeMultilineXml(rightRaw)

  const leftLines = leftNormalized ? leftNormalized.split('\n') : []
  const rightLines = rightNormalized ? rightNormalized.split('\n') : []

  if (!leftLines.length && !rightLines.length) return []

  const maxLen = Math.max(leftLines.length, rightLines.length)
  const rows: XmlDiffLine[] = []

  for (let i = 0; i < maxLen; i++) {
    const left = leftLines[i] ?? ''
    const right = rightLines[i] ?? ''

    let status: XmlDiffLine['status'] = 'same'
    if (left && !right) status = 'removed'
    else if (!left && right) status = 'added'
    else if (left !== right) status = 'changed'

    rows.push({ lineNumber: i + 1, left, right, status })
  }

  return rows
}

export function parseDifferenceReport(report: string): ParsedDifferenceReport {
  const normalized = report.replace(/\r\n/g, '\n')
  const expectedFile = normalized.match(/Expected file:\s*(.+)/)?.[1]?.trim()
  const actualFile = normalized.match(/Actual file:\s*(.+)/)?.[1]?.trim()
  const total = Number(normalized.match(/Всего различий:\s*(\d+)/)?.[1] || 0) || undefined

  const chunks = normalized.split(/-+\nРазличие\s+#\d+\n/g).slice(1)
  const indexes = [...normalized.matchAll(/Различие\s+#(\d+)/g)].map(match => Number(match[1]))

  const items: ParsedDifferenceItem[] = chunks.map((chunk, idx) => ({
    index: indexes[idx] || idx + 1,
    summary: chunk.match(/Суть:\s*(.+)/)?.[1]?.trim(),
    where: chunk.match(/Где:\s*(.+)/)?.[1]?.trim(),
    context: chunk.match(/Контекст:\s*(.+)/)?.[1]?.trim(),
    expected: chunk.match(/Expected:\s*(.+)/)?.[1]?.trim(),
    actual: chunk.match(/Actual:\s*(.+)/)?.[1]?.trim(),
    expectedXml: chunk.match(/Expected XML:\s*\n([\s\S]*?)\nActual:/)?.[1]?.trim(),
    actualXml: chunk.match(/Actual XML:\s*\n([\s\S]*?)\nТехнически:/)?.[1]?.trim(),
    technical: chunk.match(/Технически:\s*(.+)/)?.[1]?.trim()
  }))

  return { expectedFile, actualFile, total, items, raw: normalized }
}

export function normalizeResponse(payload: MonitorJobResult): MonitoringResponseView {
  const docs = Array.isArray(payload.docs) ? payload.docs : []
  const differences: MonitoringDifferenceView[] = docs
    .filter(doc => doc.diff)
    .map(doc => ({
      name: String(doc.documentId || doc.number),
      report: doc.diff,
      parsed: parseDifferenceReport(doc.diff),
      validateDb: doc.validateDb,
      validateService: doc.validateService
    }))

  return {
    results_path: payload.path || '',
    differences,
    count: payload.documentsCount || 0,
    documents_processed: payload.documentsCount || 0,
    with_differences: differences.length,
    template_id: docs[0]?.templateId || 0,
    skip: payload.skip || 0,
    ...payload // spread other fields if needed
  }
}
