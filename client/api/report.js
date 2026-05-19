import request from '@/utils/request.js'

// Report a confession or comment
export const submitReport = (data) => {
  return request({
    url: '/report',
    method: 'POST',
    data
  })
}

// Get report reasons
export const getReportReasons = () => {
  return request({
    url: '/report/reasons',
    method: 'GET'
  })
}
