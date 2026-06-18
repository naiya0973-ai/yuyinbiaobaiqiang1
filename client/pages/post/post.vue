<template>
  <view class="post-page">
    <!-- 顶部导航 -->
    <view class="header">
      <text class="back-btn" @click="goBack">✕</text>
      <text class="title">倾诉心声</text>
      <button
        class="publish-btn"
        :disabled="!canPublish || publishing"
        :loading="publishing"
        @click="publish"
      >
        <text>{{ publishing ? '发布中' : '发布' }}</text>
      </button>
    </view>

    <!-- 分类选择 -->
    <view class="section">
      <text class="section-title">选择心情</text>
      <view class="category-grid">
        <view
          v-for="cat in categories"
          :key="cat.id"
          class="category-item"
          :class="{ active: selectedCategory === cat.id }"
          @click="selectCategory(cat.id)"
        >
          <text class="category-icon">{{ cat.icon }}</text>
          <text class="category-name">{{ cat.name }}</text>
        </view>
      </view>
    </view>

    <!-- 文字内容 -->
    <view class="section">
      <text class="section-title">想说的话</text>
      <textarea
        v-model="content"
        placeholder="在这里写下你的心声，让大家听见..."
        class="content-input"
        maxlength="500"
        :show-confirm-bar="false"
      />
      <text class="word-count">{{ content.length }}/500</text>
    </view>

    <!-- 语音录制 -->
    <view class="section">
      <text class="section-title">录制语音</text>

      <!-- 未录制状态 -->
      <view v-if="!audioFile" class="recorder-area">
        <view
          class="record-btn"
          :class="{ recording: isRecording }"
          @touchstart="startRecording"
          @touchend="stopRecording"
        >
          <view class="btn-inner">
            <text class="mic-icon">🎤</text>
          </view>
          <view v-if="isRecording" class="recording-ring"></view>
        </view>

        <text class="record-hint">{{ isRecording ? '松开结束' : '按住录制' }}</text>
        <text class="record-tip">最长可录制10分钟</text>

        <!-- 录制中波纹效果 -->
        <view v-if="isRecording" class="sound-waves">
          <view
            v-for="i in 5"
            :key="i"
            class="wave"
            :style="{ animationDelay: i * 0.1 + 's' }"
          />
        </view>

        <view v-if="isRecording" class="recording-time">
          <text>{{ formatTime(recordingTime) }}</text>
        </view>
      </view>

      <!-- 已录制状态 -->
      <view v-else class="audio-preview">
        <view class="preview-header">
          <text class="preview-title">已录制语音</text>
          <text class="delete-btn" @click="deleteAudio">删除</text>
        </view>

        <view class="audio-player">
          <view class="play-btn" @click="togglePlay"
          >
            <text>{{ isPlaying ? '⏸' : '▶' }}</text>
          </view>

          <view class="progress-bar" @click="seekTo"
          >
            <view class="progress-bg"
            >
              <view class="progress-fill" :style="{ width: progress + '%' }"
            >
                <view class="progress-thumb"
            ></view>
            </view>
            </view>
            <view class="time-display"
          >
              <text>{{ formatTime(currentTime) }}</text>
              <text>{{ formatTime(audioDuration) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部提示 -->
    <view class="footer-tips">
      <text class="tip-icon">💡</text>
      <text class="tip-text">请文明发言，禁止发布违规内容</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useUserStore } from '@/store/index.js'
import { createConfession, uploadAudio } from '@/api/confession.js'

const userStore = useUserStore()

const categories = ref([
  { id: 1, name: '暗恋', icon: '💕' },
  { id: 2, name: '失恋', icon: '💔' },
  { id: 3, name: '感谢', icon: '🙏' },
  { id: 4, name: '道歉', icon: '😔' },
  { id: 5, name: '吐槽', icon: '😤' },
  { id: 6, name: '其他', icon: '💭' }
])

const selectedCategory = ref(null)
const content = ref('')
const audioFile = ref(null)
const audioDuration = ref(0)
const isRecording = ref(false)
const recordingTime = ref(0)
const isPlaying = ref(false)
const currentTime = ref(0)
const progress = ref(0)
const publishing = ref(false)

let recordManager = null
let recordingTimer = null
let innerAudioContext = null
let mediaRecorder = null
let mediaStream = null
let audioChunks = []

const canPublish = computed(() => {
  const hasContent = content.value.trim().length > 0 || audioFile.value
  const hasValidCategory = selectedCategory.value && categories.value.some(c => c.id === selectedCategory.value)
  return hasValidCategory && hasContent
})

// 清理用户输入，防止 XSS
const sanitizeContent = (text) => {
  if (!text) return ''
  return text
    .replace(/[<>\"'\/&]/g, '')
    .trim()
    .substring(0, 500)
}

const formatTime = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const selectCategory = (id) => {
  selectedCategory.value = id
}

// #ifdef APP-PLUS || MP-WEIXIN
const initRecorder = () => {
  recordManager = uni.getRecorderManager()
  recordManager.onStart(() => {
    recordingTime.value = 0
    recordingTimer = setInterval(() => {
      recordingTime.value++
    }, 1000)
  })
  recordManager.onStop((res) => {
    clearInterval(recordingTimer)
    audioFile.value = res.tempFilePath
    audioDuration.value = recordingTime.value
  })
}
// #endif

const startRecording = async () => {
  // #ifdef APP-PLUS || MP-WEIXIN
  if (!recordManager) initRecorder()
  isRecording.value = true
  recordManager.start({
    duration: 600000,
    sampleRate: 44100,
    numberOfChannels: 1,
    encodeBitRate: 192000,
    format: 'mp3'
  })
  // #endif
  // #ifdef H5
  if (!navigator.mediaDevices?.getUserMedia) {
    uni.showToast({ title: '当前浏览器不支持录音', icon: 'none' })
    return
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : (MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4')
    mediaRecorder = new MediaRecorder(mediaStream, { mimeType })
    audioChunks = []
    mediaRecorder.ondataavailable = (event) => {
      if (event.data?.size) audioChunks.push(event.data)
    }
    mediaRecorder.onstop = () => {
      clearInterval(recordingTimer)
      const blob = new Blob(audioChunks, { type: mimeType })
      audioFile.value = URL.createObjectURL(blob)
      audioDuration.value = Math.max(recordingTime.value, 1)
      mediaStream?.getTracks().forEach((track) => track.stop())
      mediaStream = null
      mediaRecorder = null
    }
    mediaRecorder.start()
    isRecording.value = true
    recordingTime.value = 0
    recordingTimer = setInterval(() => {
      recordingTime.value++
      if (recordingTime.value >= 600) stopRecording()
    }, 1000)
  } catch (err) {
    console.error('H5 recording error:', err)
    uni.showToast({ title: '无法访问麦克风，请授权后重试', icon: 'none' })
  }
  // #endif
}

const stopRecording = () => {
  if (!isRecording.value) return
  // #ifdef APP-PLUS || MP-WEIXIN
  isRecording.value = false
  recordManager.stop()
  // #endif
  // #ifdef H5
  isRecording.value = false
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop()
  }
  // #endif
}

const deleteAudio = () => {
  if (innerAudioContext) {
    innerAudioContext.stop()
    innerAudioContext.destroy()
  }
  audioFile.value = null
  audioDuration.value = 0
  currentTime.value = 0
  progress.value = 0
}

const togglePlay = () => {
  if (!audioFile.value) return
  if (!innerAudioContext) {
    innerAudioContext = uni.createInnerAudioContext()
    innerAudioContext.src = audioFile.value
    innerAudioContext.onPlay(() => { isPlaying.value = true })
    innerAudioContext.onPause(() => { isPlaying.value = false })
    innerAudioContext.onStop(() => { isPlaying.value = false })
    innerAudioContext.onEnded(() => {
      isPlaying.value = false
      currentTime.value = 0
      progress.value = 0
    })
    innerAudioContext.onTimeUpdate(() => {
      currentTime.value = innerAudioContext.currentTime
      progress.value = (currentTime.value / audioDuration.value) * 100
    })
  }
  if (isPlaying.value) {
    innerAudioContext.pause()
  } else {
    innerAudioContext.play()
  }
}

const seekTo = (e) => {
  // 处理进度条点击
}

const publish = async () => {
  if (!canPublish.value || publishing.value) return

  // 再次验证内容长度
  if (content.value.length > 500) {
    uni.showToast({ title: '内容过长，请控制在500字以内', icon: 'none' })
    return
  }

  publishing.value = true

  try {
    uni.showLoading({ title: '上传中...' })

    let uploadData = null
    if (audioFile.value) {
      uploadData = await uploadAudio(audioFile.value, {
        duration: audioDuration.value
      })
    }

    // 清理内容
    const cleanContent = sanitizeContent(content.value)

    await createConfession({
      categoryId: selectedCategory.value,
      content: cleanContent,
      audioUrl: uploadData?.url,
      audioDuration: uploadData?.duration || audioDuration.value,
      audioSize: uploadData?.size
    })

    uni.hideLoading()
    uni.showToast({ title: '发布成功', icon: 'success' })

    // 重置表单
    content.value = ''
    audioFile.value = null
    audioDuration.value = 0
    selectedCategory.value = null

    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)
  } catch (err) {
    uni.hideLoading()
    console.error('Publish error:', err)
    uni.showToast({ title: err.message || '发布失败', icon: 'none' })
  } finally {
    publishing.value = false
  }
}

const goBack = () => {
  uni.navigateBack()
}

onUnmounted(() => {
  if (innerAudioContext) innerAudioContext.destroy()
  clearInterval(recordingTimer)
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
  }
})
</script>

<style scoped>
.post-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF0F3 0%, #FFF5F7 100%);
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
  font-size: 40rpx;
  color: #666;
  width: 60rpx;
}

.title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
  text-align: center;
}

.publish-btn {
  padding: 16rpx 32rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 30rpx;
}

.publish-btn[disabled] {
  background: #DDD;
}

.publish-btn text {
  font-size: 28rpx;
  color: #fff;
  font-weight: bold;
}

/* 内容区块 */
.section {
  background: rgba(255, 255, 255, 0.9);
  margin: 20rpx 30rpx;
  padding: 30rpx;
  border-radius: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 24rpx;
}

/* 分类网格 */
.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0;
  background: #F8F8F8;
  border-radius: 24rpx;
  border: 3rpx solid transparent;
  transition: all 0.3s;
}

.category-item.active {
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-color: #FF6B9D;
}

.category-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
}

.category-name {
  font-size: 26rpx;
  color: #666;
}

.category-item.active .category-name {
  color: #fff;
  font-weight: bold;
}

/* 文字输入 */
.content-input {
  width: 100%;
  height: 200rpx;
  background: #F8F8F8;
  border-radius: 20rpx;
  padding: 24rpx;
  font-size: 30rpx;
  color: #333;
}

.word-count {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 16rpx;
}

/* 录制区域 */
.recorder-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
}

.record-btn {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-inner {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 40rpx rgba(255, 107, 157, 0.3);
  z-index: 2;
}

.mic-icon {
  font-size: 72rpx;
}

.recording-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 4rpx solid #FF6B9D;
  border-radius: 50%;
  animation: ring-pulse 1.5s ease-out infinite;
}

@keyframes ring-pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.3); opacity: 0; }
}

.record-hint {
  margin-top: 24rpx;
  font-size: 32rpx;
  color: #FF6B9D;
  font-weight: bold;
}

.record-tip {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #999;
}

/* 声波效果 */
.sound-waves {
  display: flex;
  gap: 12rpx;
  margin-top: 30rpx;
}

.wave {
  width: 16rpx;
  height: 16rpx;
  background: #FF6B9D;
  border-radius: 50%;
  animation: sound-wave 0.5s ease-in-out infinite alternate;
}

@keyframes sound-wave {
  0% { transform: scale(1); }
  100% { transform: scale(1.5); }
}

.recording-time {
  margin-top: 20rpx;
}

.recording-time text {
  font-size: 48rpx;
  color: #FF6B9D;
  font-weight: bold;
  font-family: monospace;
}

/* 音频预览 */
.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.preview-title {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
}

.delete-btn {
  font-size: 28rpx;
  color: #FF4757;
}

.audio-player {
  display: flex;
  align-items: center;
  gap: 20rpx;
  background: #F8F8F8;
  padding: 20rpx;
  border-radius: 20rpx;
}

.audio-player .play-btn {
  width: 70rpx;
  height: 70rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.audio-player .play-btn text {
  color: #fff;
  font-size: 28rpx;
}

.progress-bar {
  flex: 1;
}

.progress-bg {
  height: 8rpx;
  background: #E0E0E0;
  border-radius: 4rpx;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 4rpx;
  position: relative;
}

.progress-thumb {
  position: absolute;
  right: -12rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 24rpx;
  height: 24rpx;
  background: #FF6B9D;
  border-radius: 50%;
  box-shadow: 0 2rpx 8rpx rgba(255, 107, 157, 0.4);
}

.time-display {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
}

.time-display text {
  font-size: 24rpx;
  color: #999;
}

/* 底部提示 */
.footer-tips {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  gap: 12rpx;
}

.tip-icon {
  font-size: 32rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #999;
}
</style>
