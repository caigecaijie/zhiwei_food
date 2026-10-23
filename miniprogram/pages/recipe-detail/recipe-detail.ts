import { recipeService } from '../../services/recipe'
import { orderService } from '../../services/order'
import { DIFFICULTY_LABELS } from '../../utils/constants'
import type { Recipe } from '../../types/recipe'

const app = getApp<IAppOption>()

Page({
  data: {
    id: '',
    recipe: null as Recipe | null,
    loading: true,
    isCreator: false,
    difficultyLabel: '',
  },

  onLoad(options: Record<string, string | undefined>) {
    if (options && options.id) {
      this.setData({ id: options.id })
      this.loadDetail(options.id)
    } else {
      this.setData({ loading: false })
    }
  },

  async loadDetail(id: string) {
    this.setData({ loading: true })
    try {
      const res = await recipeService.getDetail(id)
      const recipe = res.recipe
      const isCreator = !!app.globalData.openid && recipe._openid === app.globalData.openid
      this.setData({
        recipe,
        isCreator,
        difficultyLabel: DIFFICULTY_LABELS[recipe.difficulty] || '',
        loading: false,
      })
    } catch (e) {
      console.warn('加载菜谱详情失败', e)
      this.setData({ loading: false })
    }
  },

  onRetry() {
    if (this.data.id) {
      this.loadDetail(this.data.id)
    }
  },

  async onAddCart() {
    const r = this.data.recipe
    if (!r) return
    try {
      await orderService.addToCart({ recipeId: r._id, quantity: 1 })
      wx.showToast({ title: '已加入购物车', icon: 'success' })
    } catch (e) {
      console.warn('加入购物车失败', e)
    }
  },

  onEdit() {
    wx.navigateTo({ url: `/pages/recipe-edit/recipe-edit?id=${this.data.id}` })
  },

  onDelete() {
    wx.showModal({
      title: '删除菜谱',
      content: '删除后不可恢复，确定删除吗？',
      confirmColor: '#E64340',
      success: (res) => {
        if (!res.confirm) return
        recipeService
          .remove(this.data.id)
          .then(() => {
            wx.showToast({ title: '已删除', icon: 'success' })
            setTimeout(() => wx.navigateBack(), 800)
          })
          .catch((e) => {
            console.warn('删除菜谱失败', e)
          })
      },
    })
  },

  onShareAppMessage() {
    const r = this.data.recipe
    const base = {
      title: r ? `「${r.title}」的做法，快来看看` : '智味菜谱',
      path: `/pages/recipe-detail/recipe-detail?id=${this.data.id}`,
    }
    if (r && r.coverImage) {
      return { ...base, imageUrl: r.coverImage }
    }
    return base
  },
})
