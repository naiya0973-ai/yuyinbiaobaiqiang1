import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfo } from '@/api/auth.js'

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(uni.getStorageSync('token') || '')
  const userInfo = ref(uni.getStorageSync('userInfo') || null)
  const isLoggedIn = computed(() => !!token.value)

  // Actions
  const setToken = (newToken) => {
    token.value = newToken
    uni.setStorageSync('token', newToken)
  }

  const setUserInfo = (info) => {
    userInfo.value = info
    uni.setStorageSync('userInfo', info)
  }

  const login = (data) => {
    setToken(data.token)
    setUserInfo(data.user)
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    uni.removeStorageSync('token')
    uni.removeStorageSync('userInfo')
  }

  const fetchUserInfo = async () => {
    try {
      const data = await getUserInfo()
      setUserInfo(data)
      return data
    } catch (err) {
      console.error('Failed to fetch user info:', err)
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
