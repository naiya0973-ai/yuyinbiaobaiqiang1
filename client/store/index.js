import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfo } from '@/api/auth.js'

// Token 存储键名
const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'userInfo'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref('')
  const userInfo = ref(null)
  const isLoggedIn = computed(() => !!token.value)

  // 初始化时从存储中读取
  const initFromStorage = () => {
    try {
      const storedToken = uni.getStorageSync(TOKEN_KEY)
      const storedUserInfo = uni.getStorageSync(USER_INFO_KEY)

      // 验证 token 格式（简单的 JWT 格式验证）
      if (storedToken && isValidTokenFormat(storedToken)) {
        token.value = storedToken
      }

      if (storedUserInfo) {
        userInfo.value = sanitizeUserInfo(storedUserInfo)
      }
    } catch (err) {
      console.error('Failed to init from storage:', err)
      // 清除可能损坏的数据
      clearStorage()
    }
  }

  // 验证 Token 格式（简单检查 JWT 结构）
  const isValidTokenFormat = (tok) => {
    if (typeof tok !== 'string') return false
    // JWT 格式: header.payload.signature
    const parts = tok.split('.')
    return parts.length === 3 && parts.every(p => p.length > 0)
  }

  // 清理用户信息，防止 XSS
  const sanitizeUserInfo = (info) => {
    if (!info || typeof info !== 'object') return null

    return {
      id: String(info.id || ''),
      nickname: sanitizeString(info.nickname),
      phone: sanitizeString(info.phone),
      avatarUrl: sanitizeUrl(info.avatarUrl),
      anonymousId: sanitizeString(info.anonymousId),
      createdAt: info.createdAt
    }
  }

  // 清理字符串，防止 XSS
  const sanitizeString = (str) => {
    if (!str || typeof str !== 'string') return ''
    // 移除危险字符
    return str
      .replace(/[<>\"'\/&]/g, '')
      .trim()
      .substring(0, 100) // 限制长度
  }

  // 验证 URL 安全性
  const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string') return ''
    const lowerUrl = url.toLowerCase().trim()
    // 拒绝危险协议
    if (lowerUrl.startsWith('javascript:') ||
        lowerUrl.startsWith('data:') ||
        lowerUrl.startsWith('vbscript:')) {
      return ''
    }
    return url.substring(0, 500) // 限制长度
  }

  // 清除存储
  const clearStorage = () => {
    try {
      uni.removeStorageSync(TOKEN_KEY)
      uni.removeStorageSync(USER_INFO_KEY)
    } catch (err) {
      console.error('Failed to clear storage:', err)
    }
  }

  // Actions
  const setToken = (newToken) => {
    if (!isValidTokenFormat(newToken)) {
      console.error('Invalid token format')
      return
    }
    token.value = newToken
    try {
      uni.setStorageSync(TOKEN_KEY, newToken)
    } catch (err) {
      console.error('Failed to save token:', err)
    }
  }

  const setUserInfo = (info) => {
    const sanitized = sanitizeUserInfo(info)
    userInfo.value = sanitized
    try {
      uni.setStorageSync(USER_INFO_KEY, sanitized)
    } catch (err) {
      console.error('Failed to save user info:', err)
    }
  }

  const login = (data) => {
    if (data.token) {
      setToken(data.token)
    }
    if (data.user) {
      setUserInfo(data.user)
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    clearStorage()
  }

  const fetchUserInfo = async () => {
    try {
      const data = await getUserInfo()
      setUserInfo(data)
      return data
    } catch (err) {
      console.error('Failed to fetch user info:', err)
      // 如果是 401 错误，自动登出
      if (err.message?.includes('登录') || err.message?.includes('401')) {
        logout()
      }
      throw err
    }
  }

  const checkLogin = () => {
    if (!isLoggedIn.value) {
      uni.navigateTo({
        url: '/pages/login/login'
      })
      return false
    }
    return true
  }

  // 初始化
  initFromStorage()

  return {
    token,
    userInfo,
    isLoggedIn,
    setToken,
    setUserInfo,
    login,
    logout,
    fetchUserInfo,
    checkLogin
  }
})
