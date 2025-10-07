import request from './request'

export interface MealRecordRequest {
  date: string
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
  return request.post('/api/meal/save', data)
}

// 获取指定日期的餐饮记录
export const getMealRecord = async (date: string): Promise<MealRecordResponse | null> => {
  try {
    const response = await request.get(`/api/meal/get/${date}`)
    return response.data?.data || null
  } catch (error) {
    console.error('获取餐饮记录失败:', error)
    return null
  }
}

// 删除指定日期的餐饮记录
export const deleteMealRecord = (date: string) => {
  return request.delete(`/api/meal/delete/${date}`)
}

// 删除指定日期的动态项目
export const deleteCustomItems = (date: string, itemNames: string[]) => {
  return request.post(`/api/meal/delete-items/${date}`, { itemNames })
}

// 完全清空指定日期的所有数据
export const clearAllData = (date: string) => {
  return request.post(`/api/meal/clear-all/${date}`)
}

// 获取指定月份有记录的日期列表
export const getRecordDates = (year: number, month: number) => {
  return request.get(`/api/meal/record-dates/${year}/${month}`)
}

