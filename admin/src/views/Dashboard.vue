<template>
  <div>
    <h2>数据概览</h2>
    <div v-if="loading">加载中...</div>
    <div v-else class="stats">
      <div class="stat-item">
        <strong>{{ stats.userTotal }}</strong>
        <span>用户总数</span>
      </div>
      <div class="stat-item">
        <strong>{{ stats.confessionTotal }}</strong>
        <span>语音总数</span>
      </div>
      <div class="stat-item">
        <strong>{{ stats.pendingReview }}</strong>
        <span>待审核</span>
      </div>
      <div class="stat-item">
        <strong>{{ stats.pendingReports }}</strong>
        <span>待处理举报</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { adminRequest } from '../utils/request.js'

const loading = ref(true)
const stats = ref({
  userTotal: 0,
  confessionTotal: 0,
  pendingReview: 0,
  pendingReports: 0
})

onMounted(async () => {
  try {
    stats.value = await adminRequest('/stats')
  } finally {
    loading.value = false
  }
})
</script>
