/// <reference path="./types/index.d.ts" />

interface IUserInfo {
  _id: string
  _openid?: string
  nickName: string
  avatarUrl: string
  bio?: string
  stats?: {
    recipeCount: number
  }
  createdAt?: string
  updatedAt?: string
}

interface ILoginResult {
  openid: string
  userInfo: IUserInfo | null
}

interface IAppOption {
  globalData: {
    userInfo: IUserInfo | null
    openid: string
    cartCount: number
  }
  ensureLogin(): Promise<ILoginResult>
}
