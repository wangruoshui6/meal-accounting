import request from './request'

export interface MealRecordRequest {
  recordDate: string
  breakfast: number
  lunch: number
  dinner: number
  snack: number
  drink: number
  other: number
}

export interface MealRecordResponse {
  id: number
  recordDate: string
  breakfast: number
  lunch: number
  dinner: number
  snack: number
  drink: number
  other: number
  total: number
  createTime: string
}

// 保存餐饮记录
export const saveMealRecord = (data: MealRecordRequest) => {
  return request.post('/meal/save', data)
}

// 获取指定日期的餐饮记录
export const getMealRecord = (date: string) => {
  return request.get(`/meal/get/${date}`)
}

// 删除指定日期的餐饮记录
export const deleteMealRecord = (date: string) => {
  return request.delete(`/meal/delete/${date}`)
}

