<script setup lang="ts">
import { buildPreviewUrl, buildTargetQuery, toDatetimeLocalFromApiDate } from '~/composables/useMonitoringUtils'
import { useMonitoringHistory } from '~/composables/useMonitoringHistory'
import { useMonitoringRequests } from '~/composables/useMonitoringRequests'
import { useMonitoringStands } from '~/composables/useMonitoringStands'
import type { MonitoringJobRecordAsync } from '~/types/monitoring-async'

useHead({
  title: 'Monitoring Docs Viewer'
})

const form = reactive({
  stand: 'local',
  val: null as number | null,
  template_id: null as number | null,
  document_id: null as string | null,
  dateFromLocal: '',
  dateToLocal: ''
})

const expandedIndexes = ref<number[]>([])
const copyState = ref<'idle' | 'done' | 'error'>('idle')

const {
  stands,
  standsPending,
  standsError,
  selectedStand,
  loadStands
} = useMonitoringStands(form.stand)

watch(selectedStand, (value) => {
  form.stand = value
})

watch(() => form.stand, (value) => {
  selectedStand.value = value
})

const {
  requestHistory,
  historyCollapsed,
  loadJobs,
  removeHistoryItem,
  clearHistory
} = useMonitoringHistory()

const {
  runningRequestsCount,
  responseData,
  errorMessage,
  startActiveRequestsTimer,
  stopActiveRequestsTimer,
  openRequestResult,
  openActiveRequestResult,
  submit
} = useMonitoringRequests({
  stands
})

const requestPreview = computed(() => {
  const params = buildTargetQuery(form)
  return buildPreviewUrl(stands.value, form.stand, params)
})

function resetForm() {
  form.val = null
  form.template_id = null
  form.document_id = null
  form.dateFromLocal = ''
  form.dateToLocal = ''
}

function toggleExpanded(index: number) {
  if (expandedIndexes.value.includes(index)) {
    expandedIndexes.value = expandedIndexes.value.filter(item => item !== index)
    return
  }

  expandedIndexes.value = [...expandedIndexes.value, index]
}

function applyHistoryItem(item: MonitoringJobRecordAsync) {
  form.stand = item.request.stand || form.stand
  form.val = item.request.params.val ? Number(item.request.params.val) : null
  form.template_id = item.request.params.template_id ? Number(item.request.params.template_id) : null
  form.document_id = item.jobId ? item.jobId : null
  form.dateFromLocal = item.createdAt ? toDatetimeLocalFromApiDate(item.createdAt) : ''
  form.dateToLocal = item.startedAt ? toDatetimeLocalFromApiDate(item.startedAt) : ''
}

function openHistoryResult(item: MonitoringJobRecordAsync) {
  expandedIndexes.value = []
  openRequestResult(item.result)
  openActiveRequestResult(item)
}

async function copyUrl() {
  if (!requestPreview.value) return

  try {
    await navigator.clipboard.writeText(requestPreview.value)
    copyState.value = 'done'
  } catch {
    copyState.value = 'error'
  }

  window.setTimeout(() => {
    copyState.value = 'idle'
  }, 1500)
}

async function submitCurrentForm() {
  expandedIndexes.value = []
  await submit(form)
}

onMounted(async () => {
  await loadStands()
  loadJobs()
  startActiveRequestsTimer()
})

onBeforeUnmount(() => {
  stopActiveRequestsTimer()
})
</script>

<template>
  <main class="page">
    <section class="hero card">
      <div>
        <p class="eyebrow">Монитор сервиса генерации СЭМД</p>
        <h1>Просмотр результата сравнения СЭМД</h1>
        <p class="muted">
          Выбирайте стенд, запускайте несколько запросов параллельно, проверяйте итоговый URL и смотрите разобранный diff в удобном виде.
        </p>
      </div>
    </section>

    <section class="grid two-columns">
      <MonitoringRequestForm
        :stands="stands"
        :stands-pending="standsPending"
        :stands-error="standsError"
        :form="form"
        :running-requests-count="runningRequestsCount"
        @submit="submitCurrentForm"
        @reset="resetForm"
      />

      <MonitoringPreviewCard
        :request-preview="requestPreview"
        :copy-state="copyState"
        @copy="copyUrl"
      />
    </section>

    <MonitoringHistory
      :items="requestHistory"
      :collapsed="historyCollapsed"
      @toggle="historyCollapsed = !historyCollapsed"
      @clear="clearHistory"
      @apply="applyHistoryItem"
      @open="openHistoryResult"
      @remove="removeHistoryItem"
    />

    <section v-if="errorMessage" class="alert error">
      {{ errorMessage }}
    </section>

    <MonitoringResults
      :response-data="responseData"
      :expanded-indexes="expandedIndexes"
      @toggle="toggleExpanded"
    />
  </main>
</template>
