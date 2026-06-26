const BASE_URL = import.meta.env.VITE_API_BASE || '/api/admin'

export async function adminRequest(url, options = {}) {
  const token = localStorage.getItem('adminToken')
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'X-Admin-Token': token }),
      ...options.headers
    }
  })

  const data = await res.json()
  if (!res.ok || data.code !== 0) {
    throw new Error(data.message || '请求失败')
  }
  return data.data
}
