import axios from 'axios'
import { showToast } from 'vant'

const request = axios.create({
  // 生产环境
  baseURL: 'http://101.201.254.71/api',
  // 开发环境（本地开发时使用）
  // baseURL: 'http://localhost:8080/api',
  // 测试手机环境（同局域网测试时使用）
  // baseURL: 'http://10.22.182.3:8080/api',
  // ICP备案完成后，可以切换到域名
  // baseURL: 'http://www.mealaccounting.online/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加 JWT token 到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response
    // 如果后端返回 success: false，显示错误信息并 reject
    if (data && data.success === false) {
      const errorMessage = data.message || '请求失败'
      showToast(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }
    // 成功响应，直接返回
    return response
  },
  (error) => {
    // HTTP 错误（401, 500 等）
    let errorMessage = '网络错误'
    
    if (error.response) {
      // 服务器返回了错误响应
      const { status, data } = error.response
      
      // 从响应数据中提取错误信息
      if (data && data.message) {
        errorMessage = data.message
      } else if (status === 401) {
        errorMessage = '未授权，请重新登录'
        // 401 错误时清除 token，跳转到登录页
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // 延迟跳转，避免在拦截器中直接操作路由
        setTimeout(() => {
          window.location.href = '/auth'
        }, 1000)
      } else if (status === 404) {
        // 针对聊天历史接口(/chat/history)的 404，不弹错误提示（表示暂无历史记录）
        const url = error.config?.url || ''
        if (url.includes('/chat/history')) {
          // 直接返回，不影响页面使用
          return Promise.reject(error)
        }
        errorMessage = '请求的资源不存在'
      } else if (status === 500) {
        errorMessage = data?.message || '服务器内部错误'
      } else {
        errorMessage = `请求失败 (${status})`
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorMessage = '网络连接失败，请检查网络'
    } else {
      // 其他错误
      errorMessage = error.message || '请求失败'
    }
    
    showToast(errorMessage)
    return Promise.reject(error)
  }
)

export default request

