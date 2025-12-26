import request from './request'

export interface ChatRequest {
  message: string
  includeContext?: boolean
  history?: ChatMessage[]
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: string
}

export interface ChatResponse {
  success: boolean
  message: string
  data: {
    success: boolean
    content: string
    error?: string
  }
}

/**
 * 发送聊天消息
 */
export const sendChatMessage = (data: ChatRequest) => {
  return request.post<ChatResponse>('/chat/message', data)
}

/**
 * 清空对话历史
 */
export const clearChatHistory = () => {
  return request.post('/chat/clear-history')
}

/**
 * 获取对话历史
 */
export const getChatHistory = () => {
  return request.get<{ success: boolean; data: ChatMessage[] }>('/chat/history')
}

/**
 * 测试聊天服务
 */
export const testChatService = () => {
  return request.get('/chat/test')
}

