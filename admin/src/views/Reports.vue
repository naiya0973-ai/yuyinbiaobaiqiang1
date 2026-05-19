<template>
  <div>
    <h2>举报处理</h2>
    <div class="actions" style="margin-bottom: 16px">
      <button :class="status === 'pending' ? 'primary' : 'ghost'" @click="load('pending')">待处理</button>
      <button :class="status === 'handled' ? 'primary' : 'ghost'" @click="load('handled')">已处理</button>
      <button :class="status === 'rejected' ? 'primary' : 'ghost'" @click="load('rejected')">已驳回</button>
    </div>
    <table v-if="list.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>类型</th>
          <th>对象ID</th>
          <th>原因</th>
          <th>时间</th>
          <th v-if="status === 'pending'">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.target_type }}</td>
          <td>{{ item.target_id }}</td>
          <td>{{ item.reason }}</td>
          <td>{{ formatTime(item.created_at) }}</td>
          <td v-if="status === 'pending'" class="actions">
            <button class="primary" @click="handle(item.id, 'handled')">通过</button>
            <button class="ghost" @click="handle(item.id, 'rejected')">驳回</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else style="color: #999">暂无数据</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { adminRequest } from '../utils/request.js'

const status = ref('pending')
const list = ref([])

function formatTime(value) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

async function load(nextStatus = status.value) {
  status.value = nextStatus
  const data = await adminRequest(`/reports?status=${nextStatus}`)
  list.value = data.list || []
}

async function handle(id, action) {
  await adminRequest(`/reports/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ action })
  })
  await load('pending')
}

onMounted(() => load())
</script>
