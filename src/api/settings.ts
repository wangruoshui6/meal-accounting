import request from './request'

// 获取用户默认餐饮项目
export const getDefaultMealItems = async () => {
  try {
    const response = await request.get('/settings/default-meal-items')
    // 后端返回的格式是 { success: true, data: [...] }
    if (response.data && response.data.success) {
      return { success: true, data: response.data.data }
    }
    return { success: true, data: response.data || [] }
  } catch (error: any) {
    return { success: false, message: error.message, data: [] }
  }
}

// 保存用户默认餐饮项目
export const saveDefaultMealItems = async (mealItems: string[]) => {
  try {
    const response = await request.post('/settings/default-meal-items', {
      mealItems: mealItems
    })
    return { success: true, data: response.data }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}

// 获取用户设置
export const getUserSetting = (userId: string, settingKey: string) => {
  return request.get(`/settings/${userId}/${settingKey}`)
}

// 保存用户设置
export const saveUserSetting = (userId: string, settingKey: string, settingValue: string) => {
  return request.post('/settings/save', {
    userId,
    settingKey,
    settingValue
  })
}
