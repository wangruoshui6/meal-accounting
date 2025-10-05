import request from './request'

export interface AuthResult {
  success: boolean
  message?: string
  token?: string
  user?: {
    id?: number
    username: string
    nickname?: string
  }
}

export const register = async (payload: { username: string; password: string }): Promise<AuthResult> => {
  try {
    const res = await request.post('/api/auth/register', payload)
    return { success: true, ...(res.data || {}) }
  } catch (e: any) {
    return { success: false, message: e?.message || '注册失败' }
  }
}

export const login = async (payload: { username: string; password: string }): Promise<AuthResult> => {
  try {
    const res = await request.post('/api/auth/login', payload)
    return { success: true, ...(res.data || {}) }
  } catch (e: any) {
    return { success: false, message: e?.message || '登录失败' }
  }
}

