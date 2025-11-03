import axios from 'axios'
import { showToast } from 'vant'

const request = axios.create({
  // 暂时使用IP访问（等待ICP备案完成后再切换到域名）
  baseURL: 'http://101.201.254.71/api',
  // ICP备案完成后，可以切换到域名
  // baseURL: 'http://www.mealaccounting.online/api',
  // 开发环境
  // baseURL: 'http://localhost:8080/api',
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
    if (data.success) {
      return response // 返回完整响应对象
    } else {
      showToast(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    showToast(error.message || '网络错误')
    return Promise.reject(error)
  }
)

export default request

