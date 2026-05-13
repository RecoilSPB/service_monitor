import type { MonitorJobDoc } from "./monitoring-async"

export interface MonitoringRequestParams {
  stand: string
  val: number | null
  template_id: number | null
  document_id: number | null
  dateFrom: string
  dateTo: string
}

export interface MonitoringDifferenceRaw {
  name: string
  report: string
}

export interface MonitoringResponse {
  results_path: string
  differences: MonitoringDifferenceRaw[]
  docs?: MonitorJobDoc[]
  documentError?: number
  documentsCount?: number
  uid?: string
  count: number
  documents_processed: number
  with_differences: number
  template_id: number
  skip: number
}

export interface ParsedDifferenceItem {
  index: number
  summary?: string
  where?: string
  context?: string
  expected?: string
  actual?: string
  expectedXml?: string
  actualXml?: string
  technical?: string
}

export interface ParsedDifferenceReport {
  expectedFile?: string
  actualFile?: string
  total?: number
  items: ParsedDifferenceItem[]
  raw: string
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

export interface MonitoringDifferenceView extends MonitoringDifferenceRaw {
  parsed: ParsedDifferenceReport
  validateDb: ValidateDbServ
  validateService: ValidateDbServ
}

export interface MonitoringResponseView extends Omit<MonitoringResponse, 'differences'> {
  differences: MonitoringDifferenceView[]
}

export interface MonitoringStand {
  key: string
  name: string
  baseURL: string
}
