import request from '@/utils/request.js'

// Get comments for a confession
export const getComments = (confessionId, params = {}) => {
  return request({
    url: `/comment/${confessionId}`,
    method: 'GET',
    data: params
  })
}

// Create comment
export const createComment = (data) => {
  return request({
    url: '/comment',
    method: 'POST',
    data
  })
}

// Delete comment
export const deleteComment = (id) => {
  return request({
    url: `/comment/${id}`,
    method: 'DELETE'
  })
}
