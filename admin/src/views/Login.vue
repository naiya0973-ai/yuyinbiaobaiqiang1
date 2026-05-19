<template>
  <div class="card login-card">
    <h2>Taking 管理后台</h2>
    <p style="color: #999; font-size: 14px">请输入服务端配置的 ADMIN_TOKEN</p>
    <label>管理密钥</label>
    <input v-model="token" type="password" placeholder="ADMIN_TOKEN" @keyup.enter="submit" />
    <button class="primary" style="width: 100%" :disabled="loading" @click="submit">
      {{ loading ? '验证中...' : '登录' }}
    </button>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { adminRequest } from '../utils/request.js'

const router = useRouter()
const token = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  if (!token.value.trim()) {
    error.value = '请输入管理密钥'
    return
  }

  loading.value = true
  error.value = ''
  localStorage.setItem('adminToken', token.value.trim())

  try {
    await adminRequest('/stats')
    router.push({ name: 'dashboard' })
  } catch (e) {
    localStorage.removeItem('adminToken')
    error.value = e.message || '密钥无效'
  } finally {
    loading.value = false
  }
}
</script>
