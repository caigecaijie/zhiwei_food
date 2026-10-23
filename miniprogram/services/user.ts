import { callFunction } from '../utils/request'
import type { LoginResult, UserInfo } from '../types/user'

export const userService = {
  login(): Promise<LoginResult> {
    return callFunction<LoginResult>('userManage', { action: 'login' })
  },

  updateProfile(data: { nickName: string; avatarUrl: string; bio?: string }): Promise<{ ok: boolean }> {
    return callFunction('userManage', { action: 'updateProfile', ...data })
  },

  getProfile(): Promise<{ userInfo: UserInfo | null }> {
    return callFunction('userManage', { action: 'getProfile' })
  },
}
