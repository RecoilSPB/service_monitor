<script setup lang="ts">
import type { RequestHistoryItem } from '~/types/monitoring-ui'
import { formatDurationMs, formatHistoryDate, formatHistoryExpireDate } from '~/composables/useMonitoringUtils'
import type { MonitoringJobRecordAsync } from '~/types/monitoring-async';

const props = defineProps<{
  items: MonitoringJobRecordAsync[]
  collapsed: boolean
}>()

const emit = defineEmits<{
  toggle: []
  clear: []
  apply: [item: MonitoringJobRecordAsync]
  open: [item: MonitoringJobRecordAsync]
  remove: [id: string]
}>()
</script>

<template>
  <section v-if="props.items.length" class="card history-card">
    <div class="section-header">
      <h2>Последние запросы ({{ props.items.length }})</h2>

      <div class="history-toolbar">
        <button class="secondary small-button" type="button" @click="emit('toggle')">
          {{ props.collapsed ? 'Развернуть' : 'Свернуть' }}
        </button>

        <!-- <button class="secondary small-button" type="button" @click="emit('clear')">
          Очистить историю
        </button> -->
      </div>
    </div>

    <div v-show="!props.collapsed" class="history-list">
      <article v-for="item in props.items" :key="item.jobId" class="history-item">
        <div class="history-main">
          <div class="history-title-row">
            <strong>{{ item.request.stand }}</strong>
          </div>

          <p class="muted small">
            Создан: {{ formatHistoryDate(item.createdAt) }}
            <br>
            Длительность: {{ formatDurationMs(item.durationMs!) }}
          </p>

          <div class="history-meta">
            <span v-if="item.result?.documentsCount">
              count: <strong>{{ item.result?.documentsCount ?? '—' }}</strong>
            </span>
            <span v-if="item.result?.error" class="history-error-text">
              {{ item.result?.error }}
            </span>
          </div>
        </div>

        <div class="history-actions">

          <span v-if="item.result?.documentError! > 0" class="badge history-diff-badge">
            Ошибки: {{ item.result?.documentError }}
          </span>

          <span class="badge"
            :class="item.status !== 'failed' ? '' : item.result?.documentError !== 0 ? 'history-error-badge' : ''">
            {{
              item.status === 'failed'
                ? `Ошибка${item.result?.documentError ? `: ${item.result.documentError} документов` : ''}`
                : 'Успешно'
            }}
          </span>
          <button class="secondary small-button" type="button" @click="emit('apply', item)">
            Заполнить форму
          </button>

          <button class="secondary small-button" type="button" @click="emit('open', item)">
            Открыть результат
          </button>

          <button class="secondary small-button danger-button" type="button" @click="emit('remove', item.jobId)">
            Удалить
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
