<template>
  <view class="profile-page">
    <!-- 顶部背景 -->
    <view class="header-bg">
      <view class="gradient-overlay"></view>
      <view class="decoration-circle circle-1"></view>
      <view class="decoration-circle circle-2"></view>
      <view class="decoration-pattern">💕</view>
    </view>

    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="avatar-section">
        <view class="avatar" :style="{ background: avatarColor }">
          <text>{{ displayInitial }}</text>
        </view>
        <view class="edit-avatar" @click="editAvatar">
          <text>📷</text>
        </view>
      </view>

      <text class="nickname">{{ displayNickname }}</text>
      <text class="user-id">{{ displayAnonymousId }}</text>

      <!-- 统计数据 -->
      <view class="stats-row">
        <view class="stat-item" @click="goToMyVoices">
          <text class="stat-num">{{ stats.voiceCount }}</text>
          <text class="stat-label">发布的语音</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goToFollows">
          <text class="stat-num">{{ stats.followingCount }}</text>
          <text class="stat-label">关注</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item" @click="goToFollows">
          <text class="stat-num">{{ stats.followerCount }}</text>
          <text class="stat-label">粉丝</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-num">{{ stats.likeCount }}</text>
          <text class="stat-label">获赞</text>
        </view>
      </view>
    </view>

    <!-- 快捷入口 -->
    <view class="quick-actions">
      <view class="action-item" @click="goToMyVoices">
        <view class="action-icon" style="background: #FFE4EC;">
          <text>🎵</text>
        </view>
        <text class="action-name">我的语音</text>
      </view>
      <view class="action-item" @click="goToCollections">
        <view class="action-icon" style="background: #FFF4E4;">
          <text>⭐</text>
        </view>
        <text class="action-name">收藏</text>
      </view>
      <view class="action-item" @click="goToFollows">
        <view class="action-icon" style="background: #E4F8FF;">
          <text>💕</text>
        </view>
        <text class="action-name">关注的人</text>
      </view>
      <view class="action-item" @click="goToHistory">
        <view class="action-icon" style="background: #F0E4FF;">
          <text>🕐</text>
        </view>
        <text class="action-name">收听历史</text>
      </view>
    </view>

    <!-- 功能列表 -->
    <view class="menu-list">
      <view class="menu-group">
        <view class="menu-item" @click="goToNotifications">
          <view class="menu-icon" style="background: #FFE4EC;">
            <text>🔔</text>
          </view>
          <text class="menu-text">消息通知</text>
          <view v-if="unreadCount > 0" class="badge">{{ unreadCount }}</view>
          <text class="menu-arrow">›</text>
        </view>

        <view class="menu-item" @click="goToSettings">
          <view class="menu-icon" style="background: #E4F8FF;">
            <text>⚙️</text>
          </view>
          <text class="menu-text">设置</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @click="showPrivacy">
          <view class="menu-icon" style="background: #F0E4FF;">
            <text>🔒</text>
          </view>
          <text class="menu-text">隐私政策</text>
          <text class="menu-arrow">›</text>
        </view>

        <view class="menu-item" @click="showAgreement">
          <view class="menu-icon" style="background: #FFF4E4;">
            <text>📋</text>
          </view>
          <text class="menu-text">用户协议</text>
          <text class="menu-arrow">›</text>
        </view>

        <view class="menu-item" @click="showAbout">
          <view class="menu-icon" style="background: #E8F5E9;">
            <text>ℹ️</text>
          </view>
          <text class="menu-text">关于我们</text>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view v-if="isLoggedIn" class="logout-section">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>

    <!-- 底部安全区域 -->
    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup>
import { ref, computed, onShow } from 'vue'
import { useUserStore } from '@/store/index.js'
import { getUserProfile } from '@/api/user.js'

const userStore = useUserStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const userInfo = computed(() => userStore.userInfo || {})

// 安全显示计算属性
const displayNickname = computed(() => {
  const nickname = userInfo.value?.nickname
  if (!nickname) return '未登录'
  // 限制长度并清理
  return String(nickname).substring(0, 20)
})

const displayInitial = computed(() => {
  const nickname = userInfo.value?.nickname
  if (!nickname) return '?'
  // 安全获取首字符
  const str = String(nickname).trim()
  return str.charAt(0) || '?'
})

const displayAnonymousId = computed(() => {
  return userInfo.value?.anonymousId || ''
})

const avatarColor = ref('#FF6B9D')
const unreadCount = ref(0)  // 初始化为0而不是硬编码3

const stats = ref({
  voiceCount: 0,
  followingCount: 0,
  followerCount: 0,
  likeCount: 0
})

onShow(() => {
  if (!isLoggedIn.value) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }
  fetchProfile()
})

const goToMyVoices = () => {
  uni.showToast({ title: '请在发布列表查看', icon: 'none' })
}

const goToCollections = () => {
  uni.showToast({ title: '收藏功能规划中', icon: 'none' })
}

const goToFollows = () => {
  uni.showToast({ title: '关注功能规划中', icon: 'none' })
}

const goToHistory = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

const goToNotifications = () => {
  uni.showToast({ title: '消息功能规划中', icon: 'none' })
}

const goToSettings = () => {
  uni.showToast({ title: '设置功能规划中', icon: 'none' })
}

const editAvatar = () => {
  uni.showActionSheet({
    itemList: ['拍照', '从相册选择'],
    success: (res) => {
      console.log(res.tapIndex)
    }
  })
}

const showPrivacy = () => {
  uni.showModal({
    title: '隐私政策',
    content: '我们使用手机号用于身份认证，不向其他用户展示手机号，IP仅做哈希存储用于风控。',
    showCancel: false
  })
}

const showAgreement = () => {
  uni.showModal({
    title: '用户协议',
    content: '请勿发布违法违规内容，平台有权对违规内容进行下架和处理。',
    showCancel: false
  })
}

const showAbout = () => {
  uni.showModal({
    title: '关于 Taking',
    content: 'Taking v1.0.0\n\n一个温暖的声音社区\n让每一个心声都被听见',
    showCancel: false
  })
}

const handleLogout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        uni.showToast({ title: '已退出', icon: 'success' })
        setTimeout(() => {
          uni.navigateTo({ url: '/pages/login/login' })
        }, 1000)
      }
    }
  })
}

const fetchProfile = async () => {
  try {
    const profile = await getUserProfile()
    userStore.setUserInfo({
      id: profile.id,
      nickname: profile.nickname,
      anonymousId: profile.anonymousId,
      avatarUrl: profile.avatarUrl
    })
    stats.value.voiceCount = profile.confessionCount || 0
    stats.value.likeCount = profile.totalLikes || 0
  } catch (err) {}
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #F8F8F8;
  padding-bottom: 40rpx;
}

/* 顶部背景 */
.header-bg {
  height: 350rpx;
  background: linear-gradient(180deg, #FF8FB3 0%, #FFB8C9 50%, #FFD6E0 100%);
  position: relative;
  overflow: hidden;
}

.gradient-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(ellipse at 30% 0%, rgba(255, 255, 255, 0.3) 0%, transparent 50%);
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.circle-1 {
  width: 300rpx;
  height: 300rpx;
  top: -100rpx;
  right: -100rpx;
}

.circle-2 {
  width: 200rpx;
  height: 200rpx;
  bottom: -50rpx;
  left: -50rpx;
}

.decoration-pattern {
  position: absolute;
  top: 60rpx;
  right: 60rpx;
  font-size: 80rpx;
  opacity: 0.3;
}

/* 用户卡片 */
.user-card {
  background: #fff;
  margin: -100rpx 30rpx 0;
  border-radius: 32rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 10;
  text-align: center;
}

.avatar-section {
  position: relative;
  display: inline-block;
  margin-bottom: 20rpx;
}

.avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 6rpx solid #fff;
  box-shadow: 0 8rpx 30rpx rgba(255, 107, 157, 0.3);
}

.avatar text {
  font-size: 60rpx;
  color: #fff;
  font-weight: bold;
}

.edit-avatar {
  position: absolute;
  bottom: 10rpx;
  right: 10rpx;
  width: 50rpx;
  height: 50rpx;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.edit-avatar text {
  font-size: 24rpx;
}

.nickname {
  display: block;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.user-id {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-bottom: 30rpx;
}

/* 统计数据 */
.stats-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding-top: 30rpx;
  border-top: 1rpx solid #F0F0F0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 40rpx;
  font-weight: bold;
  color: #FF6B9D;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
}

.stat-divider {
  width: 2rpx;
  height: 60rpx;
  background: #F0F0F0;
}

/* 快捷入口 */
.quick-actions {
  display: flex;
  justify-content: space-around;
  background: #fff;
  margin: 20rpx 30rpx;
  padding: 30rpx 0;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-icon {
  width: 90rpx;
  height: 90rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}

.action-icon text {
  font-size: 44rpx;
}

.action-name {
  font-size: 26rpx;
  color: #666;
}

/* 功能列表 */
.menu-list {
  padding: 0 30rpx;
}

.menu-group {
  background: #fff;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #F8F8F8;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  width: 60rpx;
  height: 60rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.menu-icon text {
  font-size: 32rpx;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333;
}

.badge {
  background: #FF4757;
  color: #fff;
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  margin-right: 16rpx;
}

.menu-arrow {
  font-size: 36rpx;
  color: #CCC;
}

/* 退出登录 */
.logout-section {
  padding: 40rpx 30rpx;
}

.logout-btn {
  width: 100%;
  height: 90rpx;
  background: #fff;
  border-radius: 45rpx;
  font-size: 30rpx;
  color: #FF4757;
  font-weight: bold;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}
</style>
