<template>
  <view class="welcome-page">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>

    <!-- 主要内容区域 -->
    <view class="content">
      <!-- 品牌名称 - 页面1/3处 -->
      <view class="brand-section">
        <text class="brand-name">Taking</text>
        <text class="brand-slogan">说出你的心声</text>
      </view>

      <!-- 中间留白区域 -->
      <view class="middle-space"></view>

      <!-- 底部插画区域 -->
      <view class="illustration-section">
        <!-- 地面 -->
        <view class="ground"></view>

        <!-- 坐着抱怨的小人 -->
        <view class="character">
          <!-- 身体 -->
          <view class="body">
            <!-- 头 -->
            <view class="head">
              <view class="face">
                <view class="eyes">
                  <view class="eye left"></view>
                  <view class="eye right"></view>
                </view>
                <view class="mouth"></view>
              </view>
            </view>
            <!-- 身体 -->
            <view class="torso"></view>
            <!-- 手臂（抱着膝盖） -->
            <view class="arms">
              <view class="arm left"></view>
              <view class="arm right"></view>
            </view>
            <!-- 腿 -->
            <view class="legs">
              <view class="leg left"></view>
              <view class="leg right"></view>
            </view>
          </view>

          <!-- 抱怨的气泡 -->
          <view class="complaint-bubbles">
            <view class="bubble bubble-1">
              <text>唉...</text>
            </view>
            <view class="bubble bubble-2">
              <text>好烦啊</text>
            </view>
            <view class="bubble bubble-3">
              <text>💭</text>
            </view>
          </view>
        </view>

        <!-- 装饰元素 -->
        <view class="decorations">
          <view class="star star-1">✨</view>
          <view class="star star-2">⭐</view>
          <view class="cloud cloud-1">☁️</view>
          <view class="cloud cloud-2">☁️</view>
        </view>
      </view>
    </view>

    <!-- 进入按钮 -->
    <view class="enter-section" @click="enterApp">
      <view class="enter-btn">
        <text class="btn-text">进入</text>
        <text class="btn-icon">→</text>
      </view>
    </view>
  </view>
</template>

<script setup>
const enterApp = () => {
  uni.navigateTo({
    url: '/pages/login/login'
  })
}

// 自动跳转（可选）
setTimeout(() => {
  enterApp()
}, 3000)
</script>

<style scoped>
.welcome-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFE4EC 0%, #FFD6E0 30%, #FFC4D4 70%, #FFB8C9 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
}

.circle-1 {
  width: 300rpx;
  height: 300rpx;
  top: -100rpx;
  right: -50rpx;
}

.circle-2 {
  width: 200rpx;
  height: 200rpx;
  top: 200rpx;
  left: -50rpx;
}

.circle-3 {
  width: 150rpx;
  height: 150rpx;
  top: 400rpx;
  right: 50rpx;
}

/* 内容区域 */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

/* 品牌区域 - 页面1/3处 */
.brand-section {
  margin-top: 33vh;
  text-align: center;
  padding: 0 40rpx;
}

.brand-name {
  display: block;
  font-size: 80rpx;
  font-weight: bold;
  color: #FF6B9D;
  letter-spacing: 8rpx;
  text-shadow: 4rpx 4rpx 0 rgba(255, 107, 157, 0.2);
  margin-bottom: 20rpx;
}

.brand-slogan {
  display: block;
  font-size: 32rpx;
  color: #FF8FB3;
  letter-spacing: 4rpx;
}

/* 中间留白 */
.middle-space {
  flex: 1;
}

/* 插画区域 */
.illustration-section {
  height: 35vh;
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 40rpx;
}

/* 地面 */
.ground {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80rpx;
  background: linear-gradient(180deg, rgba(255, 200, 210, 0.5) 0%, rgba(255, 180, 195, 0.8) 100%);
  border-radius: 50% 50% 0 0 / 100% 100% 0 0;
}

/* 小人 */
.character {
  position: relative;
  z-index: 2;
  margin-bottom: 20rpx;
}

.body {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* 头 */
.head {
  width: 100rpx;
  height: 100rpx;
  background: #FFE4C4;
  border-radius: 50%;
  position: relative;
  z-index: 3;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
}

.face {
  position: relative;
  width: 100%;
  height: 100%;
}

.eyes {
  position: absolute;
  top: 40rpx;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20rpx;
}

.eye {
  width: 12rpx;
  height: 16rpx;
  background: #333;
  border-radius: 50%;
  position: relative;
}

.eye::after {
  content: '';
  position: absolute;
  top: 2rpx;
  right: 2rpx;
  width: 4rpx;
  height: 4rpx;
  background: #fff;
  border-radius: 50%;
}

/* 委屈的眉毛 */
.eye.left::before {
  content: '';
  position: absolute;
  top: -10rpx;
  left: -4rpx;
  width: 20rpx;
  height: 3rpx;
  background: #333;
  border-radius: 3rpx;
  transform: rotate(15deg);
}

.eye.right::before {
  content: '';
  position: absolute;
  top: -10rpx;
  right: -4rpx;
  width: 20rpx;
  height: 3rpx;
  background: #333;
  border-radius: 3rpx;
  transform: rotate(-15deg);
}

.mouth {
  position: absolute;
  bottom: 25rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 30rpx;
  height: 15rpx;
  border: 4rpx solid #333;
  border-top: none;
  border-radius: 0 0 30rpx 30rpx;
}

/* 身体 */
.torso {
  width: 80rpx;
  height: 100rpx;
  background: linear-gradient(180deg, #FFB6C1 0%, #FF69B4 100%);
  border-radius: 40rpx 40rpx 20rpx 20rpx;
  margin-top: -20rpx;
  position: relative;
  z-index: 2;
}

/* 手臂 */
.arms {
  position: absolute;
  top: 80rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 120rpx;
  display: flex;
  justify-content: space-between;
}

.arm {
  width: 25rpx;
  height: 70rpx;
  background: #FFE4C4;
  border-radius: 12rpx;
}

.arm.left {
  transform: rotate(-30deg);
  transform-origin: top center;
}

.arm.right {
  transform: rotate(30deg);
  transform-origin: top center;
}

/* 腿 */
.legs {
  display: flex;
  gap: 10rpx;
  margin-top: -10rpx;
}

.leg {
  width: 30rpx;
  height: 60rpx;
  background: #333;
  border-radius: 0 0 15rpx 15rpx;
}

/* 抱怨气泡 */
.complaint-bubbles {
  position: absolute;
  top: -80rpx;
  right: -100rpx;
}

.bubble {
  background: rgba(255, 255, 255, 0.95);
  padding: 16rpx 24rpx;
  border-radius: 30rpx;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
  position: absolute;
  animation: float 3s ease-in-out infinite;
}

.bubble text {
  font-size: 24rpx;
  color: #666;
}

.bubble-1 {
  top: 0;
  right: 0;
  animation-delay: 0s;
}

.bubble-2 {
  top: 60rpx;
  right: 60rpx;
  animation-delay: 0.5s;
}

.bubble-3 {
  top: 120rpx;
  right: 20rpx;
  font-size: 32rpx;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10rpx);
  }
}

/* 装饰元素 */
.decorations {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.star {
  position: absolute;
  font-size: 40rpx;
  animation: twinkle 2s ease-in-out infinite;
}

.star-1 {
  top: 100rpx;
  left: 50rpx;
  animation-delay: 0s;
}

.star-2 {
  top: 150rpx;
  right: 80rpx;
  animation-delay: 1s;
}

.cloud {
  position: absolute;
  font-size: 60rpx;
  opacity: 0.6;
  animation: drift 8s ease-in-out infinite;
}

.cloud-1 {
  top: 200rpx;
  left: 30rpx;
  animation-delay: 0s;
}

.cloud-2 {
  top: 80rpx;
  right: 100rpx;
  animation-delay: 4s;
}

@keyframes twinkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.8);
  }
}

@keyframes drift {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(30rpx);
  }
}

/* 进入按钮 */
.enter-section {
  padding: 40rpx 60rpx 60rpx;
  display: flex;
  justify-content: center;
}

.enter-btn {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 30rpx 80rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 60rpx;
  box-shadow: 0 8rpx 30rpx rgba(255, 107, 157, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

.btn-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

.btn-icon {
  font-size: 32rpx;
  color: #fff;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 8rpx 30rpx rgba(255, 107, 157, 0.4);
  }
  50% {
    transform: scale(1.02);
    box-shadow: 0 12rpx 40rpx rgba(255, 107, 157, 0.5);
  }
}
</style>
