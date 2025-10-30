import request from './request'

export interface MealRecordRequest {
  recordDate: string
  breakfast: number
  lunch: number
  dinner: number
  snack: number
  drink: number
  customItems?: Record<string, number>
}

export interface MealRecordResponse {
  id: number
  recordDate: string
  breakfast: number
  lunch: number
  dinner: number
  snack: number
  drink: number
  customItems?: string
  total: number
  createTime: string
}

// 保存餐饮记录
export const saveMealRecord = (data: MealRecordRequest) => {
  return request.post('/meal/save', data)
}

// 获取指定日期的餐饮记录
export const getMealRecord = async (date: string): Promise<MealRecordResponse | null> => {
  try {
    const response = await request.get(`/meal/get/${date}`)
    return response.data?.data || null
  } catch (error) {
    console.error('获取餐饮记录失败:', error)
    return null
  }
}

// 删除指定日期的餐饮记录
export const deleteMealRecord = (date: string) => {
  return request.delete(`/meal/delete/${date}`)
}

// 删除指定日期的动态项目
export const deleteCustomItems = (date: string, itemNames: string[]) => {
  return request.post(`/meal/delete-items/${date}`, { itemNames })
}

// 完全清空指定日期的所有数据
export const clearAllData = (date: string) => {
  return request.post(`/meal/clear-all/${date}`)
}

// 获取指定月份有记录的日期列表
export const getRecordDates = (year: number, month: number) => {
  return request.get(`/meal/record-dates/${year}/${month}`)
}

// 获取统计数据
export const getMealRecordsByDateRange = (startDate: string, endDate: string) => {
  return request.get(`/meal/statistics?startDate=${startDate}&endDate=${endDate}`)
}

// 获取用户统计概览
export const getUserStatistics = () => {
  return request.get('/meal/user-statistics')
}

// 获取年度账单统计（可选参数 year）
export const getYearStatistics = (year?: number) => {
  const url = year ? `/meal/year-statistics?year=${year}` : '/meal/year-statistics'
  return request.get(url)
}

