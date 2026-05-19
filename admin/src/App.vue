<template>
  <div v-if="isLoginPage" class="login-page">
    <router-view />
  </div>
  <div v-else class="layout">
    <aside class="sidebar">
      <h1>Taking 管理</h1>
      <nav>
        <router-link to="/">概览</router-link>
        <router-link to="/confessions">待审内容</router-link>
        <router-link to="/reports">举报处理</router-link>
      </nav>
      <button class="ghost" style="margin-top: 24px; width: 100%" @click="logout">退出登录</button>
    </aside>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const isLoginPage = computed(() => route.name === 'login')

function logout() {
  localStorage.removeItem('adminToken')
  router.push({ name: 'login' })
}
</script>
