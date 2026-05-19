import request, { uploadFile } from '@/utils/request.js'

// Get confession list
export const getConfessionList = (params = {}) => {
  return request({
    url: '/confession/list',
    method: 'GET',
    data: params
  })
}

// Get confession detail
export const getConfessionDetail = (id) => {
  return request({
    url: `/confession/${id}`,
    method: 'GET'
  })
}

// Create confession
export const createConfession = (data) => {
  return request({
    url: '/confession',
    method: 'POST',
    data
  })
}

// Delete confession
export const deleteConfession = (id) => {
  return request({
    url: `/confession/${id}`,
    method: 'DELETE'
  })
}

// Like/unlike confession
export const toggleLike = (id) => {
  return request({
    url: `/confession/${id}/like`,
    method: 'POST'
  })
}

// Upload audio
export const uploadAudio = (filePath, formData = {}) => {
  return uploadFile({
    url: '/upload/audio',
    filePath,
    name: 'audio',
    formData
  })
}

// Get my confessions
export const getMyConfessions = (params = {}) => {
  return request({
    url: '/confession/user/my',
    method: 'GET',
    data: params
  })
}
