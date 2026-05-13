<script setup lang="ts">
const props = defineProps<{
  requestPreview: string
  copyState: 'idle' | 'done' | 'error'
}>()

const emit = defineEmits<{
  copy: []
}>()
</script>

<template>
  <div class="card preview-card">
    <div class="section-header">
      <h2>Итоговый URL</h2>
      <button class="secondary small-button" type="button" @click="emit('copy')" :disabled="!props.requestPreview">
        <template v-if="props.copyState === 'done'">Скопировано</template>
        <template v-else-if="props.copyState === 'error'">Ошибка копирования</template>
        <template v-else>Скопировать URL</template>
      </button>
    </div>
    <pre class="url-preview">{{ props.requestPreview }}</pre>
    <p class="muted small">
      Запрос с клиента идет в <code>/api/monitoring/docs</code>, а Nuxt-сервер уже проксирует его в выбранный backend.
    </p>
  </div>
</template>
