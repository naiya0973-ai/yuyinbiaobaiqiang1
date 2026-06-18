<template>
  <view class="category-page">
    <!-- Header -->
    <view class="header">
      <text class="title">探索分类</text>
      <text class="subtitle">选择你感兴趣的类型</text>
    </view>

    <!-- Category Grid -->
    <view class="category-grid">
      <view
        v-for="cat in categories"
        :key="cat.id"
        class="category-card"
        :style="{ background: getCategoryGradient(cat.name) }"
        @click="goToCategory(cat)"
      >
        <view class="card-icon">{{ getCategoryIcon(cat.name) }}</view>
        <text class="card-name">{{ cat.name }}</text>
        <text class="card-count">{{ cat.count }} 条表白</text>
      </view>
    </view>

    <!-- Random Discovery -->
    <view class="discovery-section">
      <view class="section-title">🎲 随机发现</view>
      <text class="section-desc">不知道看什么？让命运带你发现精彩内容</text>
      <button class="random-btn" @click="randomConfession">
        随机听一条
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCategories } from '@/api/ranking.js'
import { getConfessionList } from '@/api/confession.js'

const categories = ref([])

const getCategoryGradient = (name) => {
  const gradients = {
    '暗恋': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    '失恋': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    '感谢': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
    '道歉': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    '其他': 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)'
  }
  return gradients[name] || 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)'
}

const getCategoryIcon = (name) => {
  const icons = {
    '暗恋': '💕',
    '失恋': '💔',
    '感谢': '🙏',
    '道歉': '😔',
    '其他': '📝'
  }
  return icons[name] || '📌'
}

const fetchCategories = async () => {
  try {
    const data = await getCategories()
    categories.value = data
  } catch (err) {
    console.error('Fetch categories error:', err)
  }
}

const goToCategory = (cat) => {
  uni.switchTab({
    url: '/pages/index/index'
  })

  // Store selected category in global state
  getApp().globalData = {
    ...getApp().globalData,
    selectedCategory: cat.id
  }
}

const randomConfession = async () => {
  try {
    uni.showLoading({ title: '寻找中...' })

    const data = await getConfessionList({
      sort: 'hot',
      limit: 50
    })

    uni.hideLoading()

    if (data.list.length > 0) {
      const randomIndex = Math.floor(Math.random() * data.list.length)
      const confession = data.list[randomIndex]

      uni.navigateTo({
        url: `/pages/detail/detail?id=${confession.id}`
      })
    } else {
      uni.showToast({
        title: '暂无内容',
        icon: 'none'
      })
    }
  } catch (err) {
    uni.hideLoading()
    console.error('Random confession error:', err)
  }
}

onShow(() => {
  fetchCategories()
})
</script>

<style scoped>
.category-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 40rpx;
}

.header {
  margin-bottom: 40rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.subtitle {
  font-size: 28rpx;
  color: #999;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 60rpx;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48rpx 32rpx;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.08);
}

.card-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}

.card-name {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.card-count {
  font-size: 24rpx;
  color: #666;
}

.discovery-section {
  background: #fff;
  border-radius: 24rpx;
  padding: 48rpx 40rpx;
  text-align: center;
}

.section-title {
  display: block;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
}

.section-desc {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 32rpx;
}

.random-btn {
  display: inline-block;
  padding: 28rpx 80rpx;
  background: linear-gradient(135deg, #ff6b9d 0%, #ff8fb3 100%);
  border-radius: 48rpx;
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
  box-shadow: 0 8rpx 30rpx rgba(255, 107, 157, 0.4);
}
</style>
