import request from './request'

// 保存或更新日记
export const saveDiary = (data: {
  itemName: string
  content: string
  date: string
}) => {
  return request.post('/api/diary/save', data)
}

// 获取指定日期和项目的日记内容
export const getDiaryContent = (itemName: string, date: string) => {
  return request.get('/api/diary/content', {
    params: { itemName, date }
  })
}

// 获取指定日期的所有日记
export const getDiariesByDate = (date: string) => {
  return request.get('/api/diary/list', {
    params: { date }
  })
}

// 删除日记
export const deleteDiary = (itemName: string, date: string) => {
  return request.delete('/api/diary/delete', {
    params: { itemName, date }
  })
}
