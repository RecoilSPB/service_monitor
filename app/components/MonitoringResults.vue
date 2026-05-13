<script setup lang="ts">
import { computed } from 'vue'
import type { MonitoringResponseView } from '~/types/monitoring'
import { diffXmlLines, parseDifferenceReport } from '~/composables/useMonitoringUtils'

interface AltResponse {
  count: number
  documents_processed: number
  template_id: number | null
  skip: number
  differences: { name: string, report: string }[]
  results_path: string | null
  structural_errors_count: number
}

const props = defineProps<{
  responseData: MonitoringResponseView | AltResponse | null
  expandedIndexes: number[]
}>()

const emit = defineEmits<{
  toggle: [index: number]
}>()

const isAltResponse = computed(() => props.responseData && 'structural_errors_count' in props.responseData)

const docs = computed(() => {
  if (!props.responseData) return []

  if (isAltResponse.value) {
    const alt = props.responseData as AltResponse
    return alt.differences.map(diff => ({
      name: diff.name,
      report: diff.report,
      parsed: parseDifferenceReport(diff.report),
      hasDifferences: diff.report !== 'XML-файлы совпадают.'
    }))
  } else {
    const view = props.responseData as MonitoringResponseView
    return (view.docs ?? []).map(doc => ({
      name: String(doc.documentId ?? doc.number ?? doc.templateId ?? 'unknown'),
      report: doc.diff || '',
      ...doc,
      parsed: parseDifferenceReport(doc.diff || ''),
      hasDifferences: Boolean(doc.diff && doc.diff !== 'XML-файлы совпадают.')
    }))
  }
})

const differencesCount = computed(() => {
  if (!props.responseData) return 0

  if (isAltResponse.value) {
    const alt = props.responseData as AltResponse
    return alt.differences.filter(diff => diff.report !== 'XML-файлы совпадают.').length
  } else {
    const view = props.responseData as MonitoringResponseView
    return view.differences.filter(diff => diff.parsed.items.length > 0).length
  }
})

const isExpanded = (index: number) => props.expandedIndexes.includes(index)
</script>

<template>
  <template v-if="props.responseData">
    <section class="stats-grid">
      <article class="card stat-card">
        <span class="stat-label">Обработано документов</span>
        <strong>{{ props.responseData.documents_processed ?? props.responseData.count }}</strong>
      </article>
      <article class="card stat-card">
        <span class="stat-label">С различиями</span>
        <strong>{{ differencesCount }}</strong>
      </article>
      <article class="card stat-card">
        <span class="stat-label">Всего</span>
        <strong>{{ props.responseData.count }}</strong>
      </article>
      <article class="card stat-card">
        <span class="stat-label">template_id</span>
        <strong>{{ props.responseData.template_id ?? '—' }}</strong>
      </article>
    </section>

    <section class="card path-card">
      <div class="section-header">
        <h2>Результат запроса</h2>
      </div>
      <p>
        <strong>Идентификатор запроса:</strong>
      </p>
      <pre class="result-uid">{{ (props.responseData as MonitoringResponseView)?.uid || (props.responseData as AltResponse)?.results_path || '—' }}</pre>
      <template v-if="isAltResponse">
        <p><strong>Структурных ошибок:</strong> {{ (props.responseData as AltResponse).structural_errors_count }}</p>
      </template>
    </section>

    <section class="results-list">
      <article
        v-for="(doc, docIndex) in docs"
        :key="`${doc.name}-${docIndex}`"
        class="card diff-card"
      >
        <div class="section-header top-aligned">
          <div>
            <h2>Документ: {{ doc.name }}</h2>
            <p class="muted small" :class="{ 'diff-found': doc.hasDifferences, 'no-diff': !doc.hasDifferences }">
              {{ doc.hasDifferences ? `Различий: ${doc.parsed.total ?? doc.parsed.items.length}` : 'Различий не обнаружено' }}
            </p>
          </div>
          <span class="badge accent">#{{ docIndex + 1 }}</span>
        </div>

        <template v-if="doc.hasDifferences">
          <div class="differences">
            <details
              v-for="item in doc.parsed.items"
              :key="`${doc.name}-${item.index}`"
              class="difference-item"
              :open="isExpanded(docIndex * 1000 + item.index)"
              @toggle="emit('toggle', docIndex * 1000 + item.index)"
            >
              <summary>
                <span>#{{ item.index }}</span>
                <span>{{ item.summary || 'Без заголовка' }}</span>
                <code>{{ item.technical || '—' }}</code>
              </summary>

              <div class="difference-body">
                <div class="kv"><span>Где</span><code>{{ item.where || '—' }}</code></div>
                <div class="kv"><span>Контекст</span><code>{{ item.context || '—' }}</code></div>
                <div class="kv"><span>Expected</span><code>{{ item.expected || '—' }}</code></div>
                <div class="kv"><span>Actual</span><code>{{ item.actual || '—' }}</code></div>

                <div class="code-grid">
                  <div>
                    <h3>XML diff</h3>
                    <div class="xml-diff-table">
                      <div class="xml-diff-header">
                        <span>#</span>
                        <span>Expected</span>
                        <span>Actual</span>
                      </div>

                      <div
                        v-for="row in diffXmlLines(item.expectedXml, item.actualXml)"
                        :key="`${doc.name}-${item.index}-${row.lineNumber}`"
                        class="xml-diff-row"
                        :class="`is-${row.status}`"
                      >
                        <span class="line-number">{{ row.lineNumber }}</span>
                        <pre class="xml-cell left">{{ row.left }}</pre>
                        <pre class="xml-cell right">{{ row.right }}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </template>

        <details class="raw-report">
          <summary>Показать сырой report</summary>
          <pre>{{ doc.report }}</pre>
        </details>
        <template v-if="!isAltResponse">
          <details class="raw-report">
            <summary>Валидация DB</summary>
            <pre>{{ (doc as any).validateDb }}</pre>
          </details>
          <details class="raw-report">
            <summary>Валидация Service</summary>
            <pre>{{ (doc as any).validateService }}</pre>
          </details>
        </template>
      </article>
    </section>
  </template>
</template>

<style scoped>
.diff-found {
  color: var(--danger);
}
.no-diff {
  color: var(--success);
}
</style>