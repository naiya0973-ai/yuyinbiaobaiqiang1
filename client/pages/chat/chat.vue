<template>
  <view class="chat-page">
    <!-- 顶部信息 -->
    <view class="header">
      <text class="back-btn" @click="goBack">←</text>
      <view class="user-info">
        <view class="avatar" :style="{ background: avatarColor }">
          <text>{{ nickname[0] }}</text>
        </view>
        <text class="nickname">{{ nickname }}</text>
      </view>
      <text class="more-btn" @click="showMore">⋯</text>
    </view>

    <!-- 关注提示 -->
    <view v-if="!isFollowing" class="follow-banner">
      <text>💕 关注TA，及时获取新动态</text>
      <button class="follow-btn" @click="followUser">关注</button>
    </view>
    <view v-else class="follow-banner followed">
      <text>✓ 已关注，可以私信互动啦</text>
    </view>
    <view class="follow-banner followed">
      <text>当前为试运行版私信页，实时聊天能力后续开放</text>
    </view>

    <!-- 聊天记录 -->
    <scroll-view
      scroll-y
      class="chat-content"
      :scroll-top="scrollTop"
      :scroll-with-animation="true"
    >
      <!-- 时间提示 -->
      <view class="time-divider">
        <text>昨天 14:30</text>
      </view>

      <!-- 对方消息 -->
      <view class="message-item received">
        <view class="avatar" :style="{ background: avatarColor }">
          <text>{{ nickname[0] }}</text>
        </view>
        <view class="message-content">
          <view class="message-bubble voice" @click="playVoice">
            <text class="voice-icon">🎵</text>
            <view class="voice-wave">
              <view v-for="i in 8" :key="i" class="wave-bar"></view>
            </view>
            <text class="voice-duration">12"</text>
          </view>
        </view>
      </view>

      <!-- 我的消息 -->
      <view class="message-item sent">
        <view class="message-content">
          <view class="message-bubble">
            <text>你的声音好温柔呀~</text>
          </view>
        </view>
        <view class="avatar" style="background: #FF6B9D;">
          <text>我</text>
        </view>
      </view>

      <!-- 对方消息 -->
      <view class="message-item received">
        <view class="avatar" :style="{ background: avatarColor }">
          <text>{{ nickname[0] }}</text>
        </view>
        <view class="message-content">
          <view class="message-bubble">
            <text>谢谢你的喜欢！最近心情不太好，想找人聊聊天</text>
          </view>
        </view>
      </view>

      <!-- 我的消息 -->
      <view class="message-item sent">
        <view class="message-content">
          <view class="message-bubble">
            <text>可以的呀，有什么想说的都可以跟我说 💕</text>
          </view>
        </view>
        <view class="avatar" style="background: #FF6B9D;">
          <text>我</text>
        </view>
      </view>

      <!-- 加载更多 -->
      <view class="load-more">
        <text>加载更多消息</text>
      </view>
    </scroll-view>

    <!-- 输入区域 -->
    <view class="input-area">
      <view class="input-toolbar">
        <text class="toolbar-icon" @click="toggleVoice">🎤</text>
        <view class="input-wrapper">
          <input
            v-model="message"
            type="text"
            placeholder="说点什么..."
            confirm-type="send"
            @confirm="sendMessage"
          />
        </view>
        <text class="toolbar-icon" @click="showEmoji">😊</text>
        <text class="toolbar-icon add" @click="showMoreActions">+</text>
      </view>

      <!-- 语音录制按钮 -->
      <view v-if="isVoiceMode" class="voice-panel">
        <view
          class="voice-btn"
          @touchstart="startRecord"
          @touchend="stopRecord"
        >
          <text>按住 说话</text>
        </view>
        <text class="voice-tip">松开发送，上滑取消</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onLoad } from '@dcloudio/uni-app'

const nickname = ref('温柔的小猫')
const avatarColor = ref('#FFB6C1')
const isFollowing = ref(false)
const message = ref('')
const isVoiceMode = ref(false)
const scrollTop = ref(99999)

onLoad((options) => {
  if (options.nickname) {
    nickname.value = options.nickname
  }
})

const followUser = () => {
  isFollowing.value = true
  uni.showToast({ title: '关注成功', icon: 'success' })
}

const goBack = () => {
  uni.navigateBack()
}

const showMore = () => {
  uni.showActionSheet({
    itemList: ['查看主页', '举报', '拉黑'],
    success: (res) => {
      console.log(res.tapIndex)
    }
  })
}

const sendMessage = () => {
  if (!message.value.trim()) return
  uni.showToast({ title: '试运行版暂不支持发送', icon: 'none' })
  message.value = ''
}

const toggleVoice = () => {
  isVoiceMode.value = !isVoiceMode.value
}

const showEmoji = () => {
  uni.showToast({ title: '表情功能开发中', icon: 'none' })
}

const showMoreActions = () => {
  uni.showActionSheet({
    itemList: ['图片', '语音通话'],
    success: (res) => {
      console.log(res.tapIndex)
    }
  })
}

const playVoice = () => {
  uni.showToast({ title: '播放语音', icon: 'none' })
}

const startRecord = () => {
  uni.showToast({ title: '语音私信规划中', icon: 'none' })
}

const stopRecord = () => {
  return
}
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF0F3 0%, #FFF5F7 100%);
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}

.back-btn {
  font-size: 40rpx;
  color: #666;
  width: 60rpx;
}

.user-info {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
}

.user-info .avatar {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info .avatar text {
  color: #fff;
  font-size: 28rpx;
  font-weight: bold;
}

.nickname {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.more-btn {
  font-size: 40rpx;
  color: #666;
  width: 60rpx;
  text-align: right;
}

/* 关注提示 */
.follow-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  padding: 20rpx;
  background: linear-gradient(90deg, #FFE4EC 0%, #FFF0F3 100%);
}

.follow-banner text {
  font-size: 26rpx;
  color: #FF6B9D;
}

.follow-btn {
  padding: 10rpx 30rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 30rpx;
}

.follow-btn text {
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
}

.followed {
  background: #F0F0F0;
}

.followed text {
  color: #999;
}

/* 聊天内容 */
.chat-content {
  flex: 1;
  padding: 30rpx;
  overflow-y: auto;
}

.time-divider {
  text-align: center;
  margin: 30rpx 0;
}

.time-divider text {
  font-size: 24rpx;
  color: #999;
  background: rgba(0, 0, 0, 0.05);
  padding: 8rpx 24rpx;
  border-radius: 20rpx;
}

/* 消息项 */
.message-item {
  display: flex;
  margin-bottom: 30rpx;
  align-items: flex-start;
}

.message-item.sent {
  flex-direction: row-reverse;
}

.message-item .avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.message-item .avatar text {
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
}

.message-content {
  max-width: 60%;
  margin: 0 20rpx;
}

.message-bubble {
  background: #fff;
  padding: 24rpx;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.message-item.sent .message-bubble {
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
}

.message-bubble text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.5;
}

.message-item.sent .message-bubble text {
  color: #fff;
}

/* 语音消息 */
.message-bubble.voice {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-width: 200rpx;
}

.voice-icon {
  font-size: 36rpx;
}

.voice-wave {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4rpx;
  height: 30rpx;
}

.voice-wave .wave-bar {
  width: 4rpx;
  background: #FF6B9D;
  border-radius: 2rpx;
  animation: wave 0.5s ease-in-out infinite alternate;
}

.voice-wave .wave-bar:nth-child(1) { height: 10rpx; animation-delay: 0s; }
.voice-wave .wave-bar:nth-child(2) { height: 20rpx; animation-delay: 0.1s; }
.voice-wave .wave-bar:nth-child(3) { height: 15rpx; animation-delay: 0.2s; }
.voice-wave .wave-bar:nth-child(4) { height: 25rpx; animation-delay: 0.3s; }
.voice-wave .wave-bar:nth-child(5) { height: 12rpx; animation-delay: 0.4s; }
.voice-wave .wave-bar:nth-child(6) { height: 22rpx; animation-delay: 0.5s; }
.voice-wave .wave-bar:nth-child(7) { height: 18rpx; animation-delay: 0.6s; }
.voice-wave .wave-bar:nth-child(8) { height: 14rpx; animation-delay: 0.7s; }

@keyframes wave {
  0% { transform: scaleY(0.5); }
  100% { transform: scaleY(1); }
}

.voice-duration {
  font-size: 24rpx;
  color: #999;
}

.load-more {
  text-align: center;
  padding: 20rpx;
}

.load-more text {
  font-size: 24rpx;
  color: #999;
}

/* 输入区域 */
.input-area {
  background: #fff;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
}

.input-toolbar {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.toolbar-icon {
  font-size: 48rpx;
}

.toolbar-icon.add {
  width: 60rpx;
  height: 60rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 36rpx;
}

.input-wrapper {
  flex: 1;
  background: #F5F5F5;
  border-radius: 40rpx;
  padding: 0 30rpx;
}

.input-wrapper input {
  height: 80rpx;
  font-size: 30rpx;
}

/* 语音面板 */
.voice-panel {
  padding: 30rpx 0;
  text-align: center;
}

.voice-btn {
  display: inline-block;
  padding: 30rpx 100rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 50rpx;
  box-shadow: 0 8rpx 30rpx rgba(255, 107, 157, 0.3);
}

.voice-btn text {
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
}

.voice-tip {
  display: block;
  margin-top: 20rpx;
  font-size: 24rpx;
  color: #999;
}
</style>
