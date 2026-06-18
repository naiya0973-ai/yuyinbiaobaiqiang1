<template>
  <view class="home-page">
    <!-- 顶部标题栏 -->
    <view class="header">
      <text class="header-title">💭 Taking</text>
      <view class="header-right">
        <text class="icon" @click="showSearch">🔍</text>
        <text class="icon" @click="showNotice">🔔</text>
      </view>
    </view>

    <!-- 分类标签 -->
    <scroll-view scroll-x class="category-tabs" show-scrollbar="false">
      <view
        v-for="cat in categories"
        :key="cat.id"
        class="category-tab"
        :class="{ active: currentCategory === cat.id }"
        @click="selectCategory(cat.id)"
      >
        <text>{{ cat.icon }}</text>
        <text class="tab-text">{{ cat.name }}</text>
      </view>
    </scroll-view>

    <!-- 内容列表 -->
    <scroll-view
      scroll-y
      class="content-list"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
      @scrolltolower="onLoadMore"
    >
      <!-- 空状态 -->
      <view v-if="confessions.length === 0 && !loading" class="empty-state">
        <text class="empty-icon">🌸</text>
        <text class="empty-title">还没有语音哦</text>
        <text class="empty-desc">来做第一个倾诉的人吧~</text>
      </view>

      <!-- 语音卡片列表 -->
      <view
        v-for="item in confessions"
        :key="item.id"
        class="voice-card"
        @click="goToDetail(item.id)"
      >
        <!-- 卡片头部 -->
        <view class="card-header">
          <view class="user-avatar" :style="{ background: getAvatarColor(item.nickname) }">
            <text>{{ item.nickname[0] }}</text>
          </view>
          <view class="user-info">
            <text class="nickname">{{ item.nickname }}</text>
            <text class="time">{{ formatTime(item.createdAt) }}</text>
          </view>
          <view class="category-tag" :style="{ background: getCategoryBg(item.categoryName) }">
            <text :style="{ color: getCategoryColor(item.categoryName) }">{{ item.categoryName }}</text>
          </view>
        </view>

        <!-- 文字内容 -->
        <view v-if="item.title" class="card-content">
          <text>{{ item.title }}</text>
        </view>

        <!-- 语音播放器 -->
        <view class="voice-player" @click.stop="togglePlay(item)">
          <view class="play-btn" :class="{ playing: currentPlayingId === item.id }">
            <text>{{ currentPlayingId === item.id ? '⏸' : '▶' }}</text>
          </view>
          <view class="player-wave">
            <view
              v-for="i in 20"
              :key="i"
              class="wave-bar"
              :class="{ active: currentPlayingId === item.id }"
              :style="{
                height: getWaveHeight(i) + 'rpx',
                animationDelay: (i * 0.05) + 's'
              }"
            />
          </view>
          <text class="duration">{{ formatDuration(item.audioDuration) }}</text>
        </view>

        <!-- 卡片底部 -->
        <view class="card-footer">
          <view class="action-item" @click.stop="toggleLike(item)">
            <text :class="{ liked: item.isLiked }">❤️</text>
            <text :class="{ liked: item.isLiked }">{{ item.likeCount }}</text>
          </view>
          <view class="action-item">
            <text>💬</text>
            <text>{{ item.commentCount }}</text>
          </view>
          <view class="action-item">
            <text>👁️</text>
            <text>{{ item.playCount }}</text>
          </view>
          <view class="action-item" @click.stop="showMore(item)">
            <text>⋯</text>
          </view>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="confessions.length > 0" class="load-more">
        <text v-if="loading">正在加载...</text>
        <text v-else-if="noMore">没有更多啦~</text>
        <text v-else>下拉加载更多</text>
      </view>
    </scroll-view>

    <!-- 底部导航 -->
    <view class="tab-bar">
      <view class="tab-item active">
        <text class="tab-icon">🏠</text>
        <text class="tab-text">广场</text>
      </view>
      <view class="tab-item" @click="goToCategory">
        <text class="tab-icon">📂</text>
        <text class="tab-text">分类</text>
      </view>
      <view class="tab-item center" @click="goToPost">
        <view class="post-btn">
          <text>＋</text>
        </view>
      </view>
      <view class="tab-item" @click="goToRank">
        <text class="tab-icon">🏆</text>
        <text class="tab-text">榜单</text>
      </view>
      <view class="tab-item" @click="goToProfile">
        <text class="tab-icon">👤</text>
        <text class="tab-text">我的</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/index.js'
import { getConfessionList, toggleLike as toggleLikeApi } from '@/api/confession.js'
import { getCategories } from '@/api/ranking.js'

const userStore = useUserStore()

const confessions = ref([])
const categories = ref([
  { id: 0, name: '全部', icon: '🌈' },
  { id: 1, name: '暗恋', icon: '💕' },
  { id: 2, name: '失恋', icon: '💔' },
  { id: 3, name: '感谢', icon: '🙏' },
  { id: 4, name: '道歉', icon: '😔' },
  { id: 5, name: '其他', icon: '💭' }
])
const currentCategory = ref(0)
const page = ref(1)
const limit = 10
const loading = ref(false)
const noMore = ref(false)
const refreshing = ref(false)
const currentPlayingId = ref(null)

const innerAudioContext = uni.createInnerAudioContext()

const getAvatarColor = (name) => {
  const colors = ['#FFB6C1', '#FFA0C0', '#FF8FB3', '#FF7EA8', '#FF6B9D', '#FF9AA2']
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const getCategoryBg = (name) => {
  const bgs = {
    '暗恋': '#FFE4EC',
    '失恋': '#F0E4FF',
    '感谢': '#E4F8FF',
    '道歉': '#FFF4E4',
    '其他': '#F0F0F0'
  }
  return bgs[name] || '#F5F5F5'
}

const getCategoryColor = (name) => {
  const colors = {
    '暗恋': '#FF6B9D',
    '失恋': '#9B7FD4',
    '感谢': '#4AB8D8',
    '道歉': '#F4A460',
    '其他': '#999'
  }
  return colors[name] || '#666'
}

const getWaveHeight = (index) => {
  return 10 + Math.random() * 25
}

const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const fetchConfessions = async (isRefresh = false) => {
  if (loading.value) return
  loading.value = true

  try {
    if (isRefresh) {
      page.value = 1
      noMore.value = false
    }

    const params = { page: page.value, limit, sort: 'newest' }
    if (currentCategory.value > 0) params.category = currentCategory.value

    const data = await getConfessionList(params)
    const normalized = (data.list || []).map((item) => ({
      ...item,
      title: item.title || item.content || ''
    }))
    if (isRefresh) confessions.value = normalized
    else confessions.value.push(...normalized)

    if (data.list.length < limit) noMore.value = true
  } catch (err) {
    console.error('Fetch error:', err)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const selectCategory = (id) => {
  currentCategory.value = id
  fetchConfessions(true)
}

const onRefresh = () => {
  refreshing.value = true
  fetchConfessions(true)
}

const onLoadMore = () => {
  if (noMore.value || loading.value) return
  page.value++
  fetchConfessions()
}

const togglePlay = (item) => {
  if (currentPlayingId.value === item.id) {
    innerAudioContext.paused ? innerAudioContext.play() : innerAudioContext.pause()
  } else {
    currentPlayingId.value = item.id
    innerAudioContext.src = item.audioUrl
    innerAudioContext.play()
  }
}

const toggleLike = async (item) => {
  if (!userStore.checkLogin()) return
  try {
    const data = await toggleLikeApi(item.id)
    item.isLiked = data.isLiked
    item.likeCount = data.likeCount
  } catch (err) {
    console.error('Like error:', err)
  }
}

const goToDetail = (id) => {
  uni.navigateTo({ url: `/pages/detail/detail?id=${id}` })
}

const goToPost = () => {
  uni.switchTab({ url: '/pages/post/post' })
}

const goToCategory = () => {
  uni.switchTab({ url: '/pages/category/category' })
}

const goToRank = () => {
  uni.switchTab({ url: '/pages/ranking/ranking' })
}

const goToProfile = () => {
  uni.switchTab({ url: '/pages/profile/profile' })
}

const showSearch = () => {
  uni.showToast({ title: '搜索功能开发中', icon: 'none' })
}

const showNotice = () => {
  uni.showToast({ title: '暂无新消息', icon: 'none' })
}

const showMore = (item) => {
  uni.showActionSheet({
    itemList: ['举报', '分享'],
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.showToast({ title: '已举报', icon: 'success' })
      }
    }
  })
}

onMounted(() => {
  fetchConfessions()
  innerAudioContext.onEnded(() => { currentPlayingId.value = null })
})

onShow(() => {
  const globalData = getApp().globalData || {}
  if (globalData.selectedCategory) {
    currentCategory.value = globalData.selectedCategory
    fetchConfessions(true)
    delete globalData.selectedCategory
  }
})

onUnmounted(() => {
  innerAudioContext.destroy()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF0F3 0%, #FFF5F7 100%);
  padding-bottom: 120rpx;
}

/* 顶部标题栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.header-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #FF6B9D;
}

.header-right {
  display: flex;
  gap: 30rpx;
}

.icon {
  font-size: 40rpx;
}

/* 分类标签 */
.category-tabs {
  background: rgba(255, 255, 255, 0.9);
  padding: 20rpx 30rpx;
  white-space: nowrap;
}

.category-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 32rpx;
  margin-right: 20rpx;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 24rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s;
}

.category-tab.active {
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-color: #FF6B9D;
}

.category-tab text {
  font-size: 36rpx;
  margin-bottom: 4rpx;
}

.category-tab .tab-text {
  font-size: 24rpx;
  color: #666;
}

.category-tab.active .tab-text {
  color: #fff;
  font-weight: bold;
}

/* 内容列表 */
.content-list {
  height: calc(100vh - 280rpx);
  padding: 20rpx;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 150rpx 40rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 30rpx;
}

.empty-title {
  display: block;
  font-size: 32rpx;
  color: #666;
  margin-bottom: 16rpx;
}

.empty-desc {
  display: block;
  font-size: 26rpx;
  color: #999;
}

/* 语音卡片 */
.voice-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.user-avatar text {
  font-size: 36rpx;
  color: #fff;
  font-weight: bold;
}

.user-info {
  flex: 1;
}

.nickname {
  display: block;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 6rpx;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.category-tag {
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.category-tag text {
  font-size: 24rpx;
}

.card-content {
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
  margin-bottom: 20rpx;
}

/* 语音播放器 */
.voice-player {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #FFF0F3 0%, #FFE4EC 100%);
  border-radius: 20rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.play-btn {
  width: 70rpx;
  height: 70rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.play-btn.playing {
  animation: pulse 1.5s ease-in-out infinite;
}

.play-btn text {
  color: #fff;
  font-size: 28rpx;
  margin-left: 4rpx;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.95); }
}

.player-wave {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6rpx;
  height: 40rpx;
  overflow: hidden;
}

.wave-bar {
  width: 4rpx;
  background: #FFB8C9;
  border-radius: 2rpx;
  transition: height 0.3s;
}

.wave-bar.active {
  background: #FF6B9D;
  animation: wave 0.5s ease-in-out infinite alternate;
}

@keyframes wave {
  0% { transform: scaleY(0.5); }
  100% { transform: scaleY(1); }
}

.duration {
  font-size: 24rpx;
  color: #999;
  margin-left: 16rpx;
}

/* 卡片底部 */
.card-footer {
  display: flex;
  align-items: center;
  gap: 40rpx;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 26rpx;
  color: #999;
}

.action-item .liked {
  color: #FF6B9D;
}

.action-item:last-child {
  flex: 1;
  justify-content: flex-end;
  font-size: 40rpx;
}

/* 加载更多 */
.load-more {
  text-align: center;
  padding: 40rpx;
  font-size: 26rpx;
  color: #999;
}

/* 底部导航 */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  justify-content: space-around;
  align-items: center;
  border-top: 1rpx solid rgba(0, 0, 0, 0.05);
  padding-bottom: env(safe-area-inset-bottom);
  backdrop-filter: blur(10px);
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.tab-item.center {
  position: relative;
  top: -30rpx;
}

.tab-icon {
  font-size: 40rpx;
  margin-bottom: 4rpx;
}

.tab-text {
  font-size: 20rpx;
  color: #999;
}

.tab-item.active .tab-text {
  color: #FF6B9D;
}

.post-btn {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 30rpx rgba(255, 107, 157, 0.4);
}

.post-btn text {
  font-size: 48rpx;
  color: #fff;
  font-weight: bold;
}
</style>
