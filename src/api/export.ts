import request from './request'
import axios from 'axios'

// 检测是否为移动设备
const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

// 检测是否为 iOS 设备
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

// 导出 Excel
export const exportToExcel = async () => {
  const token = localStorage.getItem('token')
  // 生产环境
  const baseURL = 'http://101.201.254.71/api'
  // 开发环境（本地开发时使用）
  // const baseURL = 'http://localhost:8080/api'
  // 测试手机环境（同局域网测试时使用）
  // const baseURL = 'http://10.22.182.3:8080/api'
  
  try {
    const response = await axios.get(`${baseURL}/export/excel`, {
      responseType: 'blob', // 重要：指定响应类型为 blob
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    // 从响应头获取文件名，如果没有则使用默认名称
    const contentDisposition = response.headers['content-disposition']
    let fileName = '餐饮记账记录.xlsx'
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1].replace(/['"]/g, '')
        // 处理中文文件名编码问题
        if (fileName.startsWith('UTF-8\'\'')) {
          fileName = decodeURIComponent(fileName.replace('UTF-8\'\'', ''))
        }
      }
    }
    
    // 创建 blob 对象
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    
    // 移动端特殊处理
    if (isMobile()) {
      // iOS 设备：使用新窗口打开，让用户手动保存
      if (isIOS()) {
        const url = window.URL.createObjectURL(blob)
        const newWindow = window.open(url, '_blank')
        if (!newWindow) {
          // 如果弹窗被阻止，尝试使用 a 标签
          const link = document.createElement('a')
          link.href = url
          link.target = '_blank'
          link.style.display = 'none'
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          // 延迟释放 URL，给浏览器时间打开
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
          }, 100)
        } else {
          // 新窗口打开后，延迟释放 URL
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
          }, 1000)
        }
      } else {
        // Android 设备：先尝试自动下载，如果失败则在新窗口打开
        const url = window.URL.createObjectURL(blob)
        
        // 方法1：尝试使用 download 属性自动下载
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.style.display = 'none'
        link.setAttribute('download', fileName)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 同时在新窗口打开作为备用方案（用户可以看到文件并手动保存）
        // 这样即使自动下载失败，用户也能通过新窗口保存文件
        const newWindow = window.open(url, '_blank')
        if (newWindow) {
          // 新窗口打开成功，延迟释放 URL
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
          }, 3000)
        } else {
          // 如果弹窗被阻止，延迟释放 URL 给自动下载时间
          setTimeout(() => {
            window.URL.revokeObjectURL(url)
          }, 2000)
        }
      }
    } else {
      // 桌面端：使用标准的下载方式
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
    
    return { success: true, message: '导出成功' }
  } catch (error: any) {
    console.error('导出失败:', error)
    if (error.response?.status === 401) {
      throw new Error('未登录或登录已过期')
    }
    throw new Error(error.response?.data?.message || '导出失败，请稍后重试')
  }
}

