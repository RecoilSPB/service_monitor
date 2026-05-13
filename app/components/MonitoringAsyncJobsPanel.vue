<script setup lang="ts">
import type { MonitoringJobRecord } from '~/types/monitoring-jobs'

const props = defineProps<{
  jobs: MonitoringJobRecord[]
  clientId: string
}>()

const emit = defineEmits<{
  openResult: [jobId: string]
  retry: [jobId: string]
  cancel: [jobId: string]
}>()

function canCancel(job: MonitoringJobRecord) {
  return (
    (job.status === 'running' || job.status === 'queued') &&
    !!props.clientId &&
    job.request.clientId === props.clientId
  )
}
</script>

<template>
  <section class="card history-card">
    <div class="section-header">
      <h2>Асинхронные задачи ({{ props.jobs.length }})</h2>
    </div>

    <div class="history-list">
      <article v-for="job in props.jobs" :key="job.jobId" class="history-item">
        <div class="history-main">
          <div class="history-title-row">
            <strong>{{ job.request.stand }}</strong>
            <span class="badge">{{ job.status }}</span>
            <span v-if="(job.result as any)?.with_differences > 0" class="badge history-diff-badge">
              Ошибки: {{ (job.result as any).with_differences }}
            </span>
          </div>

          <p class="muted small">
            Создан: {{ job.createdAt }}<br>
            Фаза: {{ job.progress.phase }} · {{ job.progress.percent }}%<br>
            {{ job.progress.message }}<br>
            <template v-if="job.durationMs != null">Длительность: {{ Math.floor(job.durationMs / 1000) }} сек</template>
          </p>
        </div>

        <div class="history-actions">
          <button
            v-if="job.status === 'completed'"
            class="secondary small-button"
            type="button"
            @click="emit('openResult', job.jobId)"
          >
            Открыть результат
          </button>

          <button
            v-if="canCancel(job)"
            class="secondary small-button danger-button"
            type="button"
            @click="emit('cancel', job.jobId)"
          >
            Отменить
          </button>

          <button
            v-if="job.status === 'failed' || job.status === 'cancelled'"
            class="secondary small-button"
            type="button"
            @click="emit('retry', job.jobId)"
          >
            Повторить
          </button>
        </div>
      </article>
    </div>
  </section>
</template>