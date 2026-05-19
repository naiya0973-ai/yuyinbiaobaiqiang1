import request from '@/utils/request.js'

// Send SMS verification code
export const sendSmsCode = (phone) => {
  return request({
    url: '/auth/send-code',
    method: 'POST',
    data: { phone }
  })
}

// Login with phone and code
export const login = (phone, code) => {
  return request({
    url: '/auth/login',
    method: 'POST',
    data: { phone, code }
  })
}

// Get current user info
export const getUserInfo = () => {
  return request({
    url: '/auth/me',
    method: 'GET'
  })
}

// Update user profile
export const updateProfile = (data) => {
  return request({
    url: '/auth/profile',
    method: 'PUT',
    data
  })
}
