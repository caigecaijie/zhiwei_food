import { orderService } from '../../services/order'
import { formatTime } from '../../utils/format'
import { ORDER_STATUS_COLOR, ORDER_STATUS_TEXT } from '../../utils/constants'
import type { Order, OrderStatus } from '../../types/order'

/** 订单视图模型 */
interface OrderVM extends Order {
  statusText: string
  statusColor: string
  timeText: string
}

Page({
  data: {
    id: '',
    order: null as OrderVM | null,
    loading: true,
    isCreator: false,
    updating: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    if (options && options.id) {
      this.setData({ id: options.id })
    }
  },

  onShow() {
    if (this.data.id) {
      this.loadDetail()
    }
  },

  async loadDetail() {
    this.setData({ loading: true })
    try {
      const res = await orderService.getOrderDetail(this.data.id)
      const app = getApp<IAppOption>()
      const o = res.order
      this.setData({
        order: {
          ...o,
          statusText: ORDER_STATUS_TEXT[o.status] || o.status,
          statusColor: ORDER_STATUS_COLOR[o.status] || '#999999',
          timeText: formatTime(o.createdAt),
        },
        isCreator: !!app.globalData.openid && o._openid === app.globalData.openid,
        loading: false,
      })
    } catch (e) {
      console.warn('加载订单详情失败', e)
      this.setData({ loading: false })
    }
  },

  // ---------- 状态操作（仅创建者） ----------

  startCooking() {
    wx.showModal({
      title: '开始制作',
      content: '确认开始制作这单菜品吗？',
      success: (res) => {
        if (res.confirm) this.setStatus('cooking')
      },
    })
  },

  finish() {
    wx.showModal({
      title: '完成订单',
      content: '确认这单菜品已全部完成吗？',
      success: (res) => {
        if (res.confirm) this.setStatus('done')
      },
    })
  },

  cancelOrder() {
    wx.showModal({
      title: '取消订单',
      content: '取消后不可恢复，确定取消吗？',
      confirmColor: '#E64340',
      success: (res) => {
        if (res.confirm) this.setStatus('cancelled')
      },
    })
  },

  async setStatus(status: OrderStatus) {
    if (this.data.updating) return
    this.setData({ updating: true })
    try {
      await orderService.updateOrderStatus(this.data.id, status)
      wx.showToast({ title: '操作成功', icon: 'success' })
      this.loadDetail()
    } catch (e) {
      console.warn('更新订单状态失败', e)
    } finally {
      this.setData({ updating: false })
    }
  },
})
