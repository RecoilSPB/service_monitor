<script setup lang="ts">
import type { MonitoringStand } from '~/types/monitoring'

const props = defineProps<{
  stands: MonitoringStand[]
  standsPending: boolean
  standsError: string
  form: {
    stand: string
    val: number | null
    template_id: number | null
    document_id: string | null
    dateFromLocal: string
    dateToLocal: string
  }
  runningRequestsCount: number
}>()

const emit = defineEmits<{
  submit: []
  reset: []
}>()
</script>

<template>
  <form class="card form-card" @submit.prevent="emit('submit')">
    <div class="section-header">
      <h2>Параметры запроса</h2>
      <span v-if="props.standsPending" class="badge">Загрузка стендов…</span>
    </div>

    <div v-if="props.standsError" class="alert error">{{ props.standsError }}</div>

    <div class="field-grid">
      <label class="field">
        <span>Стенд</span>
        <select v-model="props.form.stand" :disabled="props.standsPending || !props.stands.length">
          <option v-for="stand in props.stands" :key="stand.key" :value="stand.key">
            {{ stand.name }} ({{ stand.baseURL }})
          </option>
        </select>
      </label>

      <label class="field">
        <span>Количество документов</span>
        <input v-model.number="props.form.val" type="number" placeholder="необязательно">
      </label>

      <label class="field">
        <span>ID Типа документа</span>
        <input v-model.number="props.form.template_id" type="number" placeholder="необязательно">
      </label>

      <label class="field">
        <span>ID Документа</span>
        <input v-model.number="props.form.document_id" type="number" placeholder="необязательно">
      </label>

      <label class="field">
        <span>Дата с</span>
        <input v-model="props.form.dateFromLocal" step="1" type="date">
      </label>

      <label class="field">
        <span>Дата по</span>
        <input v-model="props.form.dateToLocal" step="1" type="date">
      </label>
    </div>

    <div class="actions">
      <button class="primary" type="submit" :disabled="props.standsPending || !props.stands.length">
        Запустить запрос
      </button>

      <button class="secondary" type="button" @click="emit('reset')">
        Очистить
      </button>
    </div>

    <p v-if="props.runningRequestsCount > 0" class="muted small request-multi-note">
      Сейчас выполняется {{ props.runningRequestsCount }} запрос(ов).
    </p>
  </form>
</template>
