import { recipeService } from '../../services/recipe'
import { orderService } from '../../services/order'
import type { Category, Recipe } from '../../types/recipe'

const app = getApp<IAppOption>()

Page({
  data: {
    keyword: '',
    filter: 'all' as 'all' | 'mine',
    categories: [] as Category[],
    activeCategoryId: 'all',
    recipes: [] as Recipe[],
    cartCount: 0,
    loading: false,
    inited: false,
    showPartyShare: false,
    pendingPartyId: '',
  },

  onLoad() {
    this.init()
  },

  onShow() {
    if (this.data.inited) {
      this.refreshCartCount()
      this.loadRecipes()
    }
  },

  async init() {
    try {
      await app.ensureLogin()
    } catch (e) {
      console.warn('登录失败，稍后重试', e)
    }
    await this.loadCategories()
    await this.loadRecipes()
    await this.refreshCartCount()
    this.setData({ inited: true })
  },

  async loadCategories() {
    try {
      const res = await recipeService.getCategories()
      this.setData({ categories: res.list })
    } catch (e) {
      console.error('加载分类失败', e)
    }
  },

  async loadRecipes() {
    this.setData({ loading: true })
    try {
      const res = await recipeService.getList({
        categoryId: this.data.activeCategoryId === 'all' ? undefined : this.data.activeCategoryId,
        keyword: this.data.keyword || undefined,
        filter: this.data.filter,
      })
      this.setData({ recipes: res.list })
    } catch (e) {
      console.error('加载菜谱失败', e)
    } finally {
      this.setData({ loading: false })
    }
  },

  async refreshCartCount() {
    try {
      const res = await orderService.getCartList()
      this.setData({ cartCount: res.totalCount })
    } catch (e) {
      console.error('加载购物车失败', e)
    }
  },

  onCategoryTap(e: any) {
    const id = e.currentTarget.dataset.id as string
    if (id === this.data.activeCategoryId) return
    this.setData({ activeCategoryId: id })
    this.loadRecipes()
  },

  setFilter(e: any) {
    const filter = e.currentTarget.dataset.filter as 'all' | 'mine'
    if (filter === this.data.filter) return
    this.setData({ filter, activeCategoryId: 'all' })
    this.loadRecipes()
  },

  onKeywordInput(e: any) {
    this.setData({ keyword: e.detail.value as string })
  },

  onSearch() {
    this.loadRecipes()
  },

  onRecipeTap(e: any) {
    wx.navigateTo({ url: `/pages/recipe-detail/recipe-detail?id=${e.detail.id}` })
  },

  async onAddCart(e: any) {
    try {
      await orderService.addToCart({ recipeId: e.detail.id, quantity: 1 })
      wx.showToast({ title: '已加入购物车', icon: 'success' })
      this.refreshCartCount()
    } catch (err) {
      console.error('加入购物车失败', err)
    }
  },

  goRecipeEdit() {
    wx.navigateTo({ url: '/pages/recipe-edit/recipe-edit' })
  },

  goCategoryManage() {
    wx.navigateTo({ url: '/pages/category-manage/category-manage' })
  },

  goCart() {
    wx.navigateTo({ url: '/pages/cart/cart' })
  },

  goParty() {
    this.createParty()
  },

  /** 创建饭局，弹起分享 */
  async createParty() {
    wx.showLoading({ title: '创建中', mask: true })
    try {
      const res = await orderService.createParty('一起来点菜吧')
      this.setData({ pendingPartyId: res.party._id, showPartyShare: true })
    } catch (e) {
      console.error('创建饭局失败', e)
      wx.showToast({ title: '创建失败，请重试', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },

  closePartyShare() {
    this.setData({ showPartyShare: false })
  },

  onShareAppMessage() {
    const pid = this.data.pendingPartyId
    if (pid) {
      return {
        title: '一起来点菜吧',
        path: `/pages/dinner-party/dinner-party?id=${pid}`,
      }
    }
    return { title: '智味菜谱', path: '/pages/kitchen/kitchen' }
  },

  goMatch() {
    wx.navigateTo({ url: '/pages/match/match' })
  },
})
