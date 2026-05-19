// API request utility
const BASE_URL = 'http://localhost:3000/api'

// Request interceptor
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    uni.request({
      url: `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.header
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = res.data
          if (data.code === 0) {
            resolve(data.data)
          } else if (data.code === 401) {
            // Token expired or invalid
            uni.removeStorageSync('token')
            uni.removeStorageSync('userInfo')
            uni.showToast({
              title: data.message || '登录已过期',
              icon: 'none'
            })
            setTimeout(() => {
              uni.navigateTo({
                url: '/pages/login/login'
              })
            }, 1500)
            reject(new Error(data.message))
          } else {
            uni.showToast({
              title: data.message || '请求失败',
              icon: 'none'
            })
            reject(new Error(data.message))
          }
        } else {
          uni.showToast({
            title: '网络错误',
            icon: 'none'
          })
          reject(new Error('Network error'))
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '网络请求失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

// Upload file
const uploadFile = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    uni.uploadFile({
      url: `${BASE_URL}${options.url}`,
      filePath: options.filePath,
      name: options.name || 'file',
      formData: options.formData || {},
      header: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            resolve(data.data)
          } else {
            uni.showToast({
              title: data.message || '上传失败',
              icon: 'none'
            })
            reject(new Error(data.message))
          }
        } else {
          uni.showToast({
            title: '上传失败',
            icon: 'none'
          })
          reject(new Error('Upload failed'))
        }
      },
      fail: (err) => {
        uni.showToast({
          title: '上传失败',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

export { request, uploadFile }
export default request
