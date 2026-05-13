<script setup lang="ts">
import type { ActiveRequestItem, RequestHistoryItem } from '~/types/monitoring-ui'
import { formatDurationMs, formatElapsedSeconds, formatHistoryDate } from '~/composables/useMonitoringUtils'

const props = defineProps<{
  items: ActiveRequestItem[]
  longRequestSeconds: number
}>()

const emit = defineEmits<{
  cancel: [id: string]
  open: [item: ActiveRequestItem]
  remove: [id: string]
  apply: [item: RequestHistoryItem]
}>()
</script>

<template>
  <section v-if="props.items.length" class="card history-card">
    <div class="section-header">
      <h2>Запросы в работе и завершенные в текущей сессии ({{ props.items.length }})</h2>
    </div>

    <div class="history-list">
      <article v-for="item in props.items" :key="item.id" class="history-item">
        <div class="history-main">
          <div class="history-title-row">
            <strong>{{ item.stand }}</strong>

            <span
              v-if="item.resultMeta?.success && (item.resultMeta?.with_differences ?? 0) > 0"
              class="badge history-diff-badge"
            >
              Ошибки: {{ item.resultMeta?.with_differences }}
            </span>

            <span
              class="badge"
              :class="{
                'history-running-badge': item.status === 'running',
                'history-error-badge': item.status === 'error' || item.status === 'cancelled'
              }"
            >
              {{
                item.status === 'running'
                  ? 'В работе'
                  : item.status === 'success'
                    ? 'Успешно'
                    : item.status === 'cancelled'
                      ? 'Отменен'
                      : 'Ошибка'
              }}
            </span>
          </div>

          <p class="muted small">
            Создан: {{ formatHistoryDate(item.createdAt) }}
            <br>
            <template v-if="item.status === 'running'">
              Выполняется: {{ formatElapsedSeconds(item.elapsedSeconds) }}
              <br>
              <span v-if="item.elapsedSeconds >= props.longRequestSeconds" class="request-warning">
                Запрос выполняется дольше обычного
              </span>
            </template>
            <template v-else>
              Длительность: {{ formatDurationMs(item.durationMs) }}
            </template>
          </p>

          <div class="history-meta">
            <span v-if="item.resultMeta?.success">
              count: <strong>{{ item.resultMeta.count ?? '—' }}</strong>
            </span>
            <span v-if="item.resultMeta?.success">
              documents_processed: <strong>{{ item.resultMeta.documents_processed ?? '—' }}</strong>
            </span>
            <span v-if="item.resultMeta?.success">
              with_differences: <strong>{{ item.resultMeta.with_differences ?? '—' }}</strong>
            </span>
            <span v-if="!item.resultMeta?.success && item.resultMeta?.errorMessage" class="history-error-text">
              {{ item.resultMeta.errorMessage }}
            </span>
          </div>

          <pre class="history-url">{{ item.previewUrl }}</pre>
        </div>

        <div class="history-actions">
		  <button
		    v-if="item.canCancel"
		    class="secondary small-button danger-button"
		    type="button"
		    @click="emit('cancel', item.id)"
		  >
		    Отменить
		  </button>

          <button
            v-if="item.status !== 'running'"
            class="secondary small-button"
            type="button"
            @click="emit('open', item)"
          >
            Открыть результат
          </button>

          <button
            class="secondary small-button"
            type="button"
            @click="emit('apply', {
              id: item.id,
              createdAt: item.createdAt,
              expireAt: item.createdAt,
              stand: item.stand,
              params: item.params,
              previewUrl: item.previewUrl,
              durationMs: item.durationMs,
              result: item.result,
              resultMeta: item.resultMeta || { success: false }
            })"
          >
            Заполнить форму
          </button>

          <button class="secondary small-button danger-button" type="button" @click="emit('remove', item.id)">
            Удалить
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
