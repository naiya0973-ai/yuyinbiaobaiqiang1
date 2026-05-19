import request from '@/utils/request.js'

// Get hot ranking
export const getHotRanking = (params = {}) => {
  return request({
    url: '/ranking/hot',
    method: 'GET',
    data: params
  })
}

// Get categories
export const getCategories = () => {
  return request({
    url: '/ranking/categories',
    method: 'GET'
  })
}
