<template>
  <view class="detail-page" v-if="voiceData">
    <!-- 顶部导航 -->
    <view class="header">
      <text class="back-btn" @click="goBack">←</text>
      <text class="title">语音详情</text>
      <text class="more-btn" @click="showMore">⋯</text>
    </view>

    <!-- 发布者信息 -->
    <view class="publisher-section">
      <view class="publisher-info">
        <view class="avatar" :style="{ background: avatarColor }">
          <text>{{ voiceData.nickname[0] }}</text>
        </view>
        <view class="info">
          <text class="nickname">{{ voiceData.nickname }}</text>
          <text class="time">{{ voiceData.time }}</text>
        </view>
      </view>
      <button
        class="follow-btn"
        :class="{ following: isFollowing }"
        @click="toggleFollow"
      >
        <text>{{ isFollowing ? '已关注' : '关注' }}</text>
      </button>
    </view>

    <!-- 语音内容 -->
    <view class="voice-section">
      <!-- 文字描述 -->
      <view v-if="voiceData.content" class="voice-text">
        <text>{{ voiceData.content }}</text>
      </view>

      <!-- 语音播放器 -->
      <view class="voice-player">
        <view class="player-card">
          <view class="play-btn" :class="{ playing: isPlaying }" @click="togglePlay">
            <text>{{ isPlaying ? '⏸' : '▶' }}</text>
          </view>

          <view class="player-info">
            <view class="wave-container">
              <view
                v-for="i in 25"
                :key="i"
                class="wave-bar"
                :class="{ active: isPlaying }"
                :style="{ height: getWaveHeight(i) + 'rpx' }"
              />
            </view>
            <view class="progress-line">
              <view class="progress-fill" :style="{ width: progress + '%' }" />
            </view>
          </view>

          <view class="duration">
            <text>{{ currentTime }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 互动数据 -->
    <view class="interaction-bar">
      <view class="action-item" @click="toggleLike">
        <text :class="{ liked: isLiked }">❤️</text>
        <text :class="{ liked: isLiked }">{{ likeCount }}</text>
      </view>
      <view class="action-item" @click="focusComment">
        <text>💬</text>
        <text>{{ commentCount }}</text>
      </view>
      <view class="action-item" @click="shareVoice">
        <text>↗️</text>
        <text>分享</text>
      </view>
      <view class="action-item" @click="startChat">
        <text>💌</text>
        <text>私信</text>
      </view>
    </view>

    <!-- 评论区 -->
    <view class="comments-section">
      <view class="section-header">
        <text class="section-title">评论 ({{ comments.length }})</text>
        <view class="sort-tabs">
          <text
            class="sort-tab"
            :class="{ active: sortType === 'hot' }"
            @click="sortType = 'hot'"
          >热门</text>
          <text
            class="sort-tab"
            :class="{ active: sortType === 'new' }"
            @click="sortType = 'new'"
          >最新</text>
        </view>
      </view>

      <!-- 评论列表 -->
      <view v-if="comments.length > 0" class="comments-list">
        <view
          v-for="(comment, index) in comments"
          :key="index"
          class="comment-item"
        >
          <view class="comment-avatar" :style="{ background: comment.color }">
            <text>{{ comment.nickname[0] }}</text>
          </view>
          <view class="comment-content">
            <view class="comment-header">
              <text class="comment-nickname">{{ comment.nickname }}</text>
              <text class="comment-time">{{ comment.time }}</text>
            </view>
            <text class="comment-text">{{ comment.content }}</text>
            <view class="comment-actions">
              <text @click="likeComment(index)">
                {{ comment.isLiked ? '❤️' : '🤍' }} {{ comment.likes }}
              </text>
              <text @click="replyComment(comment)">回复</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空评论 -->
      <view v-else class="empty-comments">
        <text class="empty-icon">💭</text>
        <text class="empty-text">暂无评论，来说点什么吧~</text>
      </view>
    </view>

    <!-- 底部评论输入 -->
    <view class="comment-input-bar">
      <view class="input-wrapper">
        <input
          v-model="newComment"
          type="text"
          placeholder="写下你的评论..."
          confirm-type="send"
          @confirm="submitComment"
        />
      </view>
      <button
        class="send-btn"
        :disabled="!newComment.trim()"
        @click="submitComment"
      >
        <text>发送</text>
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getConfessionDetail, toggleLike as toggleLikeApi } from '@/api/confession.js'
import { getComments, createComment } from '@/api/comment.js'
import { submitReport, getReportReasons } from '@/api/report.js'

const voiceData = ref(null)
const avatarColor = ref('#FFB6C1')
const isFollowing = ref(false)
const isPlaying = ref(false)
const isLiked = ref(false)
const likeCount = ref(0)
const commentCount = ref(0)
const currentTime = ref('00:00')
const progress = ref(0)
const sortType = ref('new')
const newComment = ref('')
const comments = ref([])
const confessionId = ref(0)

const getWaveHeight = () => 15 + Math.random() * 35

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

const loadDetail = async () => {
  const data = await getConfessionDetail(confessionId.value)
  voiceData.value = {
    ...data,
    time: formatTime(data.createdAt)
  }
  isLiked.value = !!data.isLiked
  likeCount.value = data.likeCount || 0
  commentCount.value = data.commentCount || 0
}

const loadComments = async () => {
  const data = await getComments(confessionId.value, { page: 1, limit: 50 })
  comments.value = (data.list || []).map((item) => ({
    ...item,
    time: formatTime(item.createdAt),
    likes: 0,
    isLiked: false,
    color: '#FFB6C1'
  }))
}

onLoad(async (options) => {
  confessionId.value = Number(options.id || 0)
  if (!confessionId.value) {
    uni.showToast({ title: '内容不存在', icon: 'none' })
    return
  }
  try {
    await Promise.all([loadDetail(), loadComments()])
  } catch (err) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
})

const togglePlay = () => {
  isPlaying.value = !isPlaying.value
}

const toggleFollow = () => {
  isFollowing.value = !isFollowing.value
  uni.showToast({
    title: isFollowing.value ? '关注成功' : '已取消关注',
    icon: 'success'
  })
}

const toggleLike = async () => {
  if (!confessionId.value) return
  try {
    const data = await toggleLikeApi(confessionId.value)
    isLiked.value = data.isLiked
    likeCount.value = data.likeCount
  } catch (err) {}
}

const startChat = () => {
  if (!voiceData.value) return
  uni.navigateTo({
    url: `/pages/chat/chat?nickname=${voiceData.value.nickname}`
  })
}

const shareVoice = () => {
  uni.showToast({ title: '分享功能开发中', icon: 'none' })
}

const showMore = async () => {
  try {
    const reasonData = await getReportReasons()
    const reasonLabels = reasonData.map((r) => r.label)
    uni.showActionSheet({
      itemList: reasonLabels,
      success: async (res) => {
        const selected = reasonData[res.tapIndex]
        await submitReport({
          targetType: 'confession',
          targetId: confessionId.value,
          reason: selected.value
        })
        uni.showToast({ title: '举报成功', icon: 'success' })
      }
    })
  } catch (err) {}
}

const submitCommentHandler = async () => {
  const content = newComment.value.trim()
  if (!content) return
  try {
    await createComment({
      confessionId: confessionId.value,
      content
    })
    newComment.value = ''
    await loadComments()
    commentCount.value += 1
    uni.showToast({ title: '评论成功', icon: 'success' })
  } catch (err) {}
}

const likeComment = (index) => {
  const comment = comments.value[index]
  comment.isLiked = !comment.isLiked
  comment.likes += comment.isLiked ? 1 : -1
}

const replyComment = (comment) => {
  newComment.value = `回复 ${comment.nickname}: `
}

const focusComment = () => {}

const goBack = () => {
  uni.navigateBack()
}

const submitComment = submitCommentHandler
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF0F3 0%, #FFF5F7 100%);
  padding-bottom: 120rpx;
}

/* 顶部导航 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(20rpx + env(safe-area-inset-top));
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.back-btn {
  font-size: 44rpx;
  color: #666;
  width: 60rpx;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 34rpx;
  font-weight: bold;
  color: #333;
}

.more-btn {
  font-size: 44rpx;
  color: #666;
  width: 60rpx;
  text-align: right;
}

/* 发布者信息 */
.publisher-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  background: rgba(255, 255, 255, 0.9);
}

.publisher-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.avatar text {
  font-size: 40rpx;
  color: #fff;
  font-weight: bold;
}

.info {
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.follow-btn {
  padding: 16rpx 40rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 32rpx;
}

.follow-btn.following {
  background: #F0F0F0;
}

.follow-btn text {
  font-size: 26rpx;
  color: #fff;
  font-weight: bold;
}

.follow-btn.following text {
  color: #999;
}

/* 语音内容 */
.voice-section {
  padding: 30rpx;
}

.voice-text {
  background: rgba(255, 255, 255, 0.9);
  padding: 30rpx;
  border-radius: 24rpx;
  margin-bottom: 30rpx;
  font-size: 32rpx;
  color: #333;
  line-height: 1.6;
}

/* 语音播放器 */
.voice-player {
  background: linear-gradient(135deg, #FFE4EC 0%, #FFF0F3 100%);
  border-radius: 32rpx;
  padding: 40rpx;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.play-btn {
  width: 100rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 8rpx 30rpx rgba(255, 107, 157, 0.3);
}

.play-btn.playing {
  animation: pulse 1.5s ease-in-out infinite;
}

.play-btn text {
  color: #fff;
  font-size: 40rpx;
  margin-left: 6rpx;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.95); }
}

.player-info {
  flex: 1;
}

.wave-container {
  display: flex;
  align-items: flex-end;
  gap: 6rpx;
  height: 60rpx;
  margin-bottom: 16rpx;
}

.wave-bar {
  width: 6rpx;
  background: rgba(255, 107, 157, 0.3);
  border-radius: 3rpx;
  transition: height 0.3s;
}

.wave-bar.active {
  background: linear-gradient(to top, #FF6B9D, #FF8FB3);
  animation: wave 0.5s ease-in-out infinite alternate;
}

@keyframes wave {
  0% { transform: scaleY(0.6); }
  100% { transform: scaleY(1); }
}

.progress-line {
  height: 6rpx;
  background: rgba(255, 107, 157, 0.2);
  border-radius: 3rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B9D, #FF8FB3);
  border-radius: 3rpx;
}

.duration {
  flex-shrink: 0;
}

.duration text {
  font-size: 28rpx;
  color: #666;
  font-family: monospace;
}

/* 互动栏 */
.interaction-bar {
  display: flex;
  justify-content: space-around;
  padding: 30rpx;
  background: rgba(255, 255, 255, 0.9);
  margin: 0 30rpx 20rpx;
  border-radius: 24rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.action-item text {
  font-size: 40rpx;
}

.action-item text:last-child {
  font-size: 24rpx;
  color: #666;
}

.action-item .liked {
  color: #FF6B9D;
}

/* 评论区 */
.comments-section {
  background: rgba(255, 255, 255, 0.9);
  margin: 0 30rpx;
  border-radius: 32rpx;
  padding: 30rpx;
  min-height: 400rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.sort-tabs {
  display: flex;
  gap: 30rpx;
}

.sort-tab {
  font-size: 26rpx;
  color: #999;
}

.sort-tab.active {
  color: #FF6B9D;
  font-weight: bold;
}

/* 评论列表 */
.comment-item {
  display: flex;
  margin-bottom: 30rpx;
}

.comment-avatar {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.comment-avatar text {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.comment-nickname {
  font-size: 28rpx;
  font-weight: bold;
  color: #FF6B9D;
}

.comment-time {
  font-size: 22rpx;
  color: #999;
}

.comment-text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.5;
  margin-bottom: 12rpx;
}

.comment-actions {
  display: flex;
  gap: 30rpx;
}

.comment-actions text {
  font-size: 24rpx;
  color: #999;
}

/* 空评论 */
.empty-comments {
  text-align: center;
  padding: 80rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 底部评论输入 */
.comment-input-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1rpx solid #F0F0F0;
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

.send-btn {
  padding: 20rpx 40rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 40rpx;
}

.send-btn[disabled] {
  background: #DDD;
}

.send-btn text {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}
</style>
