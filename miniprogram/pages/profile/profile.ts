import { userService } from '../../services/user'
import { recipeService } from '../../services/recipe'
import { uploadImage } from '../../utils/request'
import { DEFAULT_AVATAR } from '../../utils/constants'

const app = getApp<IAppOption>()

interface ProfileForm {
  nickName: string
  avatarUrl: string
  bio: string
}

Page({
  data: {
    form: { nickName: '', avatarUrl: DEFAULT_AVATAR, bio: '' } as ProfileForm,
    recipeCount: 0,
    saving: false,
  },

  onShow() {
    this.loadProfile()
  },

  /** 加载用户资料与统计 */
  async loadProfile() {
    try {
      await app.ensureLogin()
    } catch (e) {
      console.warn('登录失败', e)
    }
    try {
      const res = await userService.getProfile()
      const u = res.userInfo
      if (u) {
        app.globalData.userInfo = u
        this.setData({
          form: {
            nickName: u.nickName || '',
            avatarUrl: u.avatarUrl || DEFAULT_AVATAR,
            bio: u.bio || '',
          },
        })
      }
    } catch (e) {
      console.warn('获取资料失败', e)
    }
    this.loadStats()
  },

  /** 查询我的菜谱数量 */
  async loadStats() {
    try {
      const res = await recipeService.getList({ filter: 'mine', page: 1, pageSize: 1 })
      this.setData({ recipeCount: res.total })
    } catch (e) {
      console.warn('统计菜谱失败', e)
    }
  },

  /** 微信头像快速填写后上传云存储 */
  async onChooseAvatar(e: any) {
    const tempPath = e.detail && e.detail.avatarUrl
    if (!tempPath) return
    try {
      wx.showLoading({ title: '上传中', mask: true })
      const fileID = await uploadImage(tempPath)
      wx.hideLoading()
      this.setData({ 'form.avatarUrl': fileID })
    } catch (err) {
      wx.hideLoading()
      console.warn('上传头像失败', err)
    }
  },

  onNicknameInput(e: any) {
    this.setData({ 'form.nickName': e.detail.value })
  },

  onBioInput(e: any) {
    this.setData({ 'form.bio': e.detail.value })
  },

  /** 保存资料并同步全局 */
  async onSave() {
    const nickName = this.data.form.nickName.trim()
    if (!nickName) {
      wx.showToast({ title: '请填写昵称', icon: 'none' })
      return
    }
    if (this.data.saving) return
    this.setData({ saving: true })
    try {
      wx.showLoading({ title: '保存中', mask: true })
      await userService.updateProfile({
        nickName,
        avatarUrl: this.data.form.avatarUrl,
        bio: this.data.form.bio.trim(),
      })
      const res = await userService.getProfile()
      if (res.userInfo) {
        app.globalData.userInfo = res.userInfo
      }
      wx.hideLoading()
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (e) {
      wx.hideLoading()
      console.warn('保存资料失败', e)
    } finally {
      this.setData({ saving: false })
    }
  },

  goCategories() {
    wx.navigateTo({ url: '/pages/category-manage/category-manage' })
  },

  goMatch() {
    wx.navigateTo({ url: '/pages/match/match' })
  },

  /** 清除本地缓存（不影响云端数据） */
  onClearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '将清除小程序本地缓存，不影响云端数据。确定继续吗？',
      success: (res) => {
        if (!res.confirm) return
        wx.clearStorageSync()
        wx.showToast({ title: '已清除', icon: 'success' })
      },
    })
  },

  onAbout() {
    wx.showModal({
      title: '智味菜谱',
      content: 'v1.0.0 MVP\n记录家常菜谱，邀请好友一起点菜',
      showCancel: false,
    })
  },
})
