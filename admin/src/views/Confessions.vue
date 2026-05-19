<template>
  <div>
    <h2>待审内容</h2>
    <table v-if="list.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>昵称</th>
          <th>文字</th>
          <th>举报数</th>
          <th>时间</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in list" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.nickname }}</td>
          <td>{{ item.content || item.title || '-' }}</td>
          <td>{{ item.reportedCount }}</td>
          <td>{{ formatTime(item.createdAt) }}</td>
          <td class="actions">
            <button class="primary" @click="updateStatus(item.id, 'published')">通过</button>
            <button class="ghost" @click="updateStatus(item.id, 'hidden')">隐藏</button>
            <button class="danger" @click="updateStatus(item.id, 'deleted')">删除</button>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else style="color: #999">暂无待审核内容</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { adminRequest } from '../utils/request.js'

const list = ref([])

function formatTime(value) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-'
}

async function load() {
  const data = await adminRequest('/confessions?status=pending_review')
  list.value = data.list || []
}

async function updateStatus(id, status) {
  await adminRequest(`/confessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  })
  await load()
}

onMounted(load)
</script>
