import { orderService } from '../../services/order'
import { formatTime } from '../../utils/format'
import { ORDER_STATUS_COLOR, ORDER_STATUS_TEXT } from '../../utils/constants'
import type { Order, OrderStatus } from '../../types/order'

const PAGE_SIZE = 10

/** 订单视图模型 */
interface OrderVM extends Order {
  statusText: string
  statusColor: string
  timeText: string
  previewCovers: string[]
}

/** 状态筛选 tab，'' 表示全部 */
const TABS: { key: '' | OrderStatus; label: string }[] = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待确认' },
  { key: 'cooking', label: '制作中' },
  { key: 'done', label: '已完成' },
]

function toVM(o: Order): OrderVM {
  return {
    ...o,
    statusText: ORDER_STATUS_TEXT[o.status] || o.status,
    statusColor: ORDER_STATUS_COLOR[o.status] || '#999999',
    timeText: formatTime(o.createdAt),
    previewCovers: (o.items || [])
      .slice(0, 3)
      .map((it) => it.cover)
      .filter((c) => !!c),
  }
}

Page({
  data: {
    tabs: TABS,
    activeTab: '' as '' | OrderStatus,
    orders: [] as OrderVM[],
    loading: false,
    hasMore: true,
    page: 1,
    partyId: '' as string,
    isPartyMode: false,
  },

  onLoad(options: Record<string, string | undefined>) {
    if (options && options.partyId) {
      this.setData({ partyId: options.partyId, isPartyMode: true })
      wx.setNavigationBarTitle({ title: '饭局订单' })
    }
  },

  onShow() {
    this.reload()
  },

  /** 重置到第一页 */
  reload() {
    this.setData({ orders: [], page: 1, hasMore: true })
    this.loadPage()
  },

  async loadPage() {
    if (this.data.loading || !this.data.hasMore) return
    this.setData({ loading: true })
    try {
      const res = await orderService.getOrderList({
        status: this.data.activeTab || undefined,
        page: this.data.page,
        pageSize: PAGE_SIZE,
        partyId: this.data.partyId || undefined,
      })
      const vms = res.list.map(toVM)
      this.setData({
        orders: this.data.orders.concat(vms),
        page: this.data.page + 1,
        hasMore: this.data.orders.length + vms.length < res.total,
        loading: false,
      })
    } catch (e) {
      console.warn('加载订单失败', e)
      this.setData({ loading: false })
    }
  },

  onTabTap(e: any) {
    const key = e.currentTarget.dataset.key as '' | OrderStatus
    if (key === this.data.activeTab) return
    this.setData({ activeTab: key })
    this.reload()
  },

  onReachBottom() {
    this.loadPage()
  },

  onOrderTap(e: any) {
    wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${e.currentTarget.dataset.id}` })
  },

  goKitchen() {
    wx.switchTab({ url: '/pages/kitchen/kitchen' })
  },
})
