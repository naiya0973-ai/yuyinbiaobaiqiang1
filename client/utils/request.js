// API request utility
// 使用环境变量或根据当前环境动态设置
const BASE_URL = process.env.VUE_APP_API_URL || process.env.API_BASE_URL || 'http://localhost:3000/api'

// 请求超时时间 (毫秒)
const REQUEST_TIMEOUT = 30000

// 最大重试次数
const MAX_RETRIES = 2

// Request interceptor
const request = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    // 防止请求 URL 被篡改
    if (options.url && (options.url.startsWith('http://') || options.url.startsWith('https://'))) {
      // 如果传入完整 URL，需要验证是否在白名单中
      const allowedDomains = getAllowedDomains()
      const url = new URL(options.url)
      if (!allowedDomains.some(domain => url.hostname.includes(domain))) {
        reject(new Error('请求的域名不在白名单中'))
        return
      }
    }

    uni.request({
      url: options.url?.startsWith('http') ? options.url : `${BASE_URL}${options.url}`,
      method: options.method || 'GET',
      data: options.data || {},
      timeout: REQUEST_TIMEOUT,
      header: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
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
            handleAuthError(data.message)
            reject(new Error(data.message))
          } else if (data.code === 429) {
            // 速率限制
            uni.showToast({
              title: data.message || '请求过于频繁，请稍后再试',
              icon: 'none',
              duration: 2000
            })
            reject(new Error(data.message))
          } else {
            uni.showToast({
              title: data.message || '请求失败',
              icon: 'none'
            })
            reject(new Error(data.message))
          }
        } else {
          // 不暴露详细的错误信息给用户
          console.error('Request failed:', res.statusCode, res.data)
          uni.showToast({
            title: '网络错误，请稍后重试',
            icon: 'none'
          })
          reject(new Error('Network error'))
        }
      },
      fail: (err) => {
        console.error('Request error:', err)
        uni.showToast({
          title: '网络请求失败，请检查网络连接',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

// 处理认证错误
const handleAuthError = (message) => {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userInfo')
  uni.showToast({
    title: message || '登录已过期，请重新登录',
    icon: 'none'
  })
  setTimeout(() => {
    uni.navigateTo({
      url: '/pages/login/login'
    })
  }, 1500)
}

// 获取允许的域名白名单
const getAllowedDomains = () => {
  const domains = ['localhost', '127.0.0.1', 'github.io', 'onrender.com', 'supabase.co']
  try {
    const apiUrl = process.env.VUE_APP_API_URL || process.env.API_BASE_URL || ''
    if (apiUrl) {
      const hostname = new URL(apiUrl).hostname
      if (hostname && !domains.includes(hostname)) {
        domains.push(hostname)
      }
    }
  } catch {
    // ignore invalid API URL during local dev
  }
  return domains
}

// Upload file with security checks
const uploadFile = (options) => {
  return new Promise((resolve, reject) => {
    const token = uni.getStorageSync('token')

    // 验证文件路径安全性
    if (!options.filePath || typeof options.filePath !== 'string') {
      reject(new Error('无效的文件路径'))
      return
    }

    // 验证文件类型
    const allowedExtensions = ['.mp3', '.wav', '.aac', '.ogg', '.webm', '.m4a']
    const fileExt = options.filePath.toLowerCase().substring(options.filePath.lastIndexOf('.'))
    if (!allowedExtensions.includes(fileExt)) {
      uni.showToast({
        title: '不支持的文件格式',
        icon: 'none'
      })
      reject(new Error('Unsupported file type'))
      return
    }

    uni.uploadFile({
      url: `${BASE_URL}${options.url}`,
      filePath: options.filePath,
      name: options.name || 'file',
      formData: {
        ...options.formData,
        // 添加时间戳防止重放攻击
        _t: Date.now()
      },
      header: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(res.data)
            if (data.code === 0) {
              resolve(data.data)
            } else if (data.code === 401) {
              handleAuthError(data.message)
              reject(new Error(data.message))
            } else {
              uni.showToast({
                title: data.message || '上传失败',
                icon: 'none'
              })
              reject(new Error(data.message))
            }
          } catch (e) {
            uni.showToast({
              title: '上传响应解析失败',
              icon: 'none'
            })
            reject(new Error('Invalid response'))
          }
        } else {
          console.error('Upload failed:', res.statusCode)
          uni.showToast({
            title: '上传失败，请稍后重试',
            icon: 'none'
          })
          reject(new Error('Upload failed'))
        }
      },
      fail: (err) => {
        console.error('Upload error:', err)
        uni.showToast({
          title: '上传失败，请检查网络',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

export { request, uploadFile }
export default request
