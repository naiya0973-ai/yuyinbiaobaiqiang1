<template>
  <view class="login-page">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="gradient-bg"></view>
      <view class="pattern pattern-1">🌸</view>
      <view class="pattern pattern-2">💕</view>
      <view class="pattern pattern-3">✨</view>
    </view>

    <!-- 返回按钮 -->
    <view class="back-btn" @click="goBack">
      <text>←</text>
    </view>

    <!-- Logo区域 -->
    <view class="logo-section">
      <view class="logo">
        <text class="logo-icon">💭</text>
      </view>
      <text class="app-name">Taking</text>
      <text class="app-slogan">让每一次倾诉都被温柔以待</text>
    </view>

    <!-- 登录表单 -->
    <view class="form-section">
      <!-- 昵称输入 -->
      <view class="input-group">
        <view class="input-label">
          <text class="label-text">昵称</text>
          <text class="label-hint">给自己起个温暖的名字</text>
        </view>
        <view class="input-wrapper">
          <text class="input-icon">👤</text>
          <input
            v-model="form.nickname"
            type="text"
            placeholder="例如：温柔的小猫"
            class="input"
            maxlength="20"
          />
        </view>
      </view>

      <!-- 手机号输入 -->
      <view class="input-group">
        <view class="input-label">
          <text class="label-text">手机号</text>
        </view>
        <view class="input-wrapper">
          <text class="input-icon">📱</text>
          <input
            v-model="form.phone"
            type="number"
            placeholder="请输入手机号"
            class="input"
            maxlength="11"
          />
        </view>
      </view>

      <!-- 验证码输入 -->
      <view class="input-group">
        <view class="input-label">
          <text class="label-text">验证码</text>
        </view>
        <view class="code-wrapper">
          <view class="input-wrapper code-input">
            <text class="input-icon">🔐</text>
            <input
              v-model="form.code"
              type="number"
              placeholder="请输入验证码"
              class="input"
              maxlength="6"
            />
          </view>
          <button
            class="code-btn"
            :class="{ disabled: countdown > 0 }"
            :disabled="countdown > 0 || !isPhoneValid"
            @click="sendCode"
          >
            <text>{{ countdown > 0 ? `${countdown}s` : '获取验证码' }}</text>
          </button>
        </view>
      </view>
    </view>

    <!-- 登录按钮 -->
    <button
      class="login-btn"
      :disabled="!isFormValid || loading"
      :loading="loading"
      @click="handleLogin"
    >
      <text class="btn-text">{{ loading ? '登录中...' : '开始倾诉' }}</text>
    </button>

    <!-- 协议 -->
    <view class="agreement">
      <view class="checkbox" @click="agreed = !agreed">
        <view class="check-inner" :class="{ checked: agreed }">
          <text v-if="agreed">✓</text>
        </view>
      </view>
      <text class="agreement-text">
        我已阅读并同意
        <text class="link" @click.stop="showAgreement">《用户协议》</text>
        和
        <text class="link" @click.stop="showPrivacy">《隐私政策》</text>
      </text>
    </view>

    <!-- 底部装饰 -->
    <view class="bottom-decoration">
      <view class="wave">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="#FFB8C9" fill-opacity="0.3" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useUserStore } from '@/store/index.js'
import { sendSmsCode, login } from '@/api/auth.js'

const userStore = useUserStore()

const form = ref({
  nickname: '',
  phone: '',
  code: ''
})

const loading = ref(false)
const countdown = ref(0)
const agreed = ref(false)

const isPhoneValid = computed(() => /^1[3-9]\d{9}$/.test(form.value.phone))

const isFormValid = computed(() => {
  return form.value.nickname.trim().length >= 2 &&
         isPhoneValid.value &&
         form.value.code.length === 6 &&
         agreed.value
})

let timer = null

const sendCode = async () => {
  if (countdown.value > 0 || !isPhoneValid.value) return

  try {
    uni.showLoading({ title: '发送中...' })
    await sendSmsCode(form.value.phone)
    uni.hideLoading()
    uni.showToast({ title: '验证码已发送', icon: 'success' })

    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) clearInterval(timer)
    }, 1000)
  } catch (err) {
    uni.hideLoading()
  }
}

const handleLogin = async () => {
  if (!isFormValid.value) return

  loading.value = true
  try {
    const data = await login(form.value.phone, form.value.code)

    // 更新昵称
    if (form.value.nickname) {
      // 这里可以调用更新昵称的API
    }

    userStore.login(data)
    uni.showToast({ title: '欢迎回来~', icon: 'success' })

    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)
  } catch (err) {
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  uni.navigateBack()
}

const showAgreement = () => {
  uni.showModal({
    title: '用户协议',
    content: '这里是用户协议内容...',
    showCancel: false
  })
}

const showPrivacy = () => {
  uni.showModal({
    title: '隐私政策',
    content: '这里是隐私政策内容...',
    showCancel: false
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF0F3 0%, #FFE4EC 50%, #FFD6E0 100%);
  position: relative;
  padding: 40rpx;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.gradient-bg {
  position: absolute;
  top: -50%;
  left: -50%;
  right: -50%;
  bottom: -50%;
  background: radial-gradient(ellipse at 30% 20%, rgba(255, 182, 193, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, rgba(255, 218, 225, 0.4) 0%, transparent 50%);
}

.pattern {
  position: absolute;
  font-size: 60rpx;
  opacity: 0.3;
  animation: float 6s ease-in-out infinite;
}

.pattern-1 {
  top: 100rpx;
  right: 60rpx;
  animation-delay: 0s;
}

.pattern-2 {
  top: 300rpx;
  left: 40rpx;
  animation-delay: 2s;
}

.pattern-3 {
  top: 500rpx;
  right: 80rpx;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20rpx) rotate(10deg); }
}

/* 返回按钮 */
.back-btn {
  position: absolute;
  top: 60rpx;
  left: 40rpx;
  width: 80rpx;
  height: 80rpx;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 15rpx rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.back-btn text {
  font-size: 40rpx;
  color: #FF6B9D;
}

/* Logo区域 */
.logo-section {
  margin-top: 120rpx;
  text-align: center;
  margin-bottom: 60rpx;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 30rpx;
  box-shadow: 0 10rpx 40rpx rgba(255, 107, 157, 0.3);
  animation: gentle-bounce 3s ease-in-out infinite;
}

.logo-icon {
  font-size: 80rpx;
}

@keyframes gentle-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}

.app-name {
  display: block;
  font-size: 56rpx;
  font-weight: bold;
  color: #FF6B9D;
  margin-bottom: 16rpx;
}

.app-slogan {
  display: block;
  font-size: 28rpx;
  color: #999;
}

/* 表单区域 */
.form-section {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 40rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 8rpx 30rpx rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
}

.input-group {
  margin-bottom: 32rpx;
}

.input-group:last-child {
  margin-bottom: 0;
}

.input-label {
  margin-bottom: 16rpx;
}

.label-text {
  font-size: 30rpx;
  color: #333;
  font-weight: bold;
  margin-right: 16rpx;
}

.label-hint {
  font-size: 24rpx;
  color: #999;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #F8F8F8;
  border-radius: 20rpx;
  padding: 0 24rpx;
  height: 100rpx;
  border: 2rpx solid transparent;
  transition: all 0.3s;
}

.input-wrapper:focus-within {
  border-color: #FF6B9D;
  background: #FFF0F3;
}

.input-icon {
  font-size: 36rpx;
  margin-right: 20rpx;
}

.input {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: #333;
  background: transparent;
}

.code-wrapper {
  display: flex;
  gap: 20rpx;
}

.code-input {
  flex: 1;
}

.code-btn {
  width: 200rpx;
  height: 100rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.code-btn.disabled {
  background: #DDD;
}

.code-btn text {
  font-size: 26rpx;
  color: #fff;
  font-weight: bold;
}

/* 登录按钮 */
.login-btn {
  height: 100rpx;
  background: linear-gradient(135deg, #FF6B9D 0%, #FF8FB3 100%);
  border-radius: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 30rpx rgba(255, 107, 157, 0.4);
  margin-bottom: 30rpx;
}

.login-btn[disabled] {
  background: #DDD;
  box-shadow: none;
}

.btn-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: bold;
}

/* 协议 */
.agreement {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20rpx;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #FF6B9D;
  border-radius: 8rpx;
  margin-right: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6rpx;
}

.check-inner.checked {
  background: #FF6B9D;
}

.check-inner text {
  color: #fff;
  font-size: 24rpx;
  font-weight: bold;
}

.agreement-text {
  font-size: 24rpx;
  color: #666;
}

.link {
  color: #FF6B9D;
  font-weight: bold;
}

/* 底部装饰 */
.bottom-decoration {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 200rpx;
  pointer-events: none;
  z-index: -1;
}

.wave {
  width: 100%;
  height: 100%;
}

.wave svg {
  width: 100%;
  height: 100%;
}
</style>
