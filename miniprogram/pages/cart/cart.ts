import { orderService } from '../../services/order'
import type { CartItem } from '../../types/order'

Page({
  data: {
    items: [] as CartItem[],
    totalCount: 0,
    loading: true,
    submitting: false,
  },

  onShow() {
    this.loadCart()
  },

  async loadCart() {
    this.setData({ loading: true })
    try {
      const res = await orderService.getCartList()
      this.setData({ items: res.list, totalCount: res.totalCount, loading: false })
    } catch (e) {
      console.warn('加载购物车失败', e)
      this.setData({ loading: false })
    }
  },

  /** 数量步进，先本地更新再同步云端 */
  async changeQuantity(e: any) {
    const idx = Number(e.currentTarget.dataset.idx)
    const delta = Number(e.currentTarget.dataset.delta)
    const item = this.data.items[idx]
    if (!item) return
    const quantity = item.quantity + delta
    if (quantity < 1) return
    this.setData({
      [`items[${idx}].quantity`]: quantity,
      totalCount: Math.max(0, this.data.totalCount + delta),
    })
    try {
      await orderService.updateCart({ cartId: item._id, quantity })
    } catch (err) {
      console.warn('更新数量失败', err)
      this.loadCart()
    }
  },

  /** 备注失焦时保存 */
  onRemarkBlur(e: any) {
    const idx = Number(e.currentTarget.dataset.idx)
    const item = this.data.items[idx]
    if (!item) return
    const remark = (e.detail.value || '').trim()
    if (remark === item.remark) return
    this.setData({ [`items[${idx}].remark`]: remark })
    orderService.updateCart({ cartId: item._id, remark }).catch((err) => {
      console.warn('保存备注失败', err)
    })
  },

  async onRemove(e: any) {
    const idx = Number(e.currentTarget.dataset.idx)
    const item = this.data.items[idx]
    if (!item) return
    try {
      await orderService.removeFromCart(item._id)
      wx.showToast({ title: '已移除', icon: 'none' })
      this.loadCart()
    } catch (err) {
      console.warn('移除失败', err)
    }
  },

  async onSubmit() {
    if (this.data.submitting || this.data.items.length === 0) return
    this.setData({ submitting: true })
    try {
      const res = await orderService.createOrder({})
      wx.redirectTo({ url: `/pages/order-detail/order-detail?id=${res.orderId}` })
    } catch (e) {
      console.warn('提交订单失败', e)
    } finally {
      this.setData({ submitting: false })
    }
  },

  goBack() {
    wx.navigateBack()
  },
})
