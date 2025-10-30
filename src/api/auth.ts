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
    const message = e?.response?.data?.message || e?.message || '注册失败'
    return { success: false, message }
  }
}

export const login = async (payload: { username: string; password: string }): Promise<AuthResult> => {
  try {
    const res = await request.post('/api/auth/login', payload)
    return { success: true, ...(res.data || {}) }
  } catch (e: any) {
    const message = e?.response?.data?.message || e?.message || '登录失败'
    return { success: false, message }
  }
}

export const logout = async (): Promise<AuthResult> => {
  try {
    const res = await request.post('/api/auth/logout', {})
    return { success: true, ...(res.data || {}) }
  } catch (e: any) {
    return { success: false, message: e?.message || '登出失败' }
  }
}

