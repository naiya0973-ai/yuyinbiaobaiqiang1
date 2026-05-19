import request from '@/utils/request.js'

// Get user profile
export const getUserProfile = () => {
  return request({
    url: '/user/profile',
    method: 'GET'
  })
}

// Update user profile
export const updateUserProfile = (data) => {
  return request({
    url: '/user/profile',
    method: 'PUT',
    data
  })
}

// Get my confessions
export const getMyConfessions = (params = {}) => {
  return request({
    url: '/user/confessions',
    method: 'GET',
    data: params
  })
}

// Get my comments
export const getMyComments = (params = {}) => {
  return request({
    url: '/user/comments',
    method: 'GET',
    data: params
  })
}
