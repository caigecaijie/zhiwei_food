// app.ts
import { userService } from './services/user'
import { CLOUD_ENV } from './config'
import type { LoginResult } from './types/user'

let loginPromise: Promise<LoginResult> | null = null

App<IAppOption>({
  globalData: {
    userInfo: null,
    openid: '',
    cartCount: 0,
  },

  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      // 环境 ID 配置在 miniprogram/config.ts（本地文件，不入库）
      // 首次使用请复制 config.example.ts 为 config.ts 并填入你的环境 ID
      env: CLOUD_ENV || undefined,
      traceUser: true,
    })
    this.ensureLogin()
  },

  ensureLogin(): Promise<LoginResult> {
    if (!loginPromise) {
      loginPromise = userService
        .login()
        .then((res) => {
          this.globalData.openid = res.openid
          this.globalData.userInfo = res.userInfo
          return res
        })
        .catch((err) => {
          // 失败后允许重试
          loginPromise = null
          throw err
        })
    }
    return loginPromise
  },
})
