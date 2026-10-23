import { orderService } from '../../services/order'
import { formatTime } from '../../utils/format'
import { DEFAULT_AVATAR, DIFFICULTY_LABELS } from '../../utils/constants'
import type { CartItem, Party } from '../../types/order'
import type { Recipe } from '../../types/recipe'

const app = getApp<IAppOption>()

/** 饭局视图模型 */
interface PartyVM extends Party {
  timeText: string
  statusText: string
}

/** 按加菜人分组的菜品 */
interface DishGroup {
  openid: string
  name: string
  avatarUrl: string
  items: CartItem[]
  count: number
}

function statusTextOf(status: string): string {
  if (status === 'active') return '点菜中'
  if (status === 'ordered') return '已下单'
  return '已结束'
}

Page({
  data: {
    mode: 'hub' as 'hub' | 'room',
    loading: true,
    // hub
    parties: [] as PartyVM[],
    // room
    partyId: '',
    party: null as PartyVM | null,
    groups: [] as DishGroup[],
    totalCount: 0,
    isHost: false,
    canEdit: false,
    myOpenid: '',
    myCount: 0,
    hostName: '',
    difficultyLabels: DIFFICULTY_LABELS,
    // 加菜弹层（使用缓存的 hostRecipes）
    showPicker: false,
    pickerList: [] as Recipe[],
    pickerLoading: false,
    // 创建饭局后引导分享弹窗
    showShareGuide: false,
  },

  /** 轮询定时器（仅房间模式） */
  pollTimer: null as ReturnType<typeof setInterval> | null,
  /** hub 是否已初始化过，用于 onShow 区分首次加载 */
  hubInited: false,

  onLoad(options: Record<string, string | undefined>) {
    if (options && options.id) {
      this.setData({ mode: 'room', partyId: options.id })
      this.enterRoom()
      // 创建饭局后跳转过来，自动拉起分享面板
      if (options.needShare === '1') {
        setTimeout(() => {
          this.setData({ showShareGuide: true })
        }, 800)
      }
    } else {
      this.setData({ mode: 'hub' })
      this.loadParties()
    }
  },

  onShow() {
    if (this.data.mode === 'room') {
      if (this.data.partyId && !this.pollTimer) {
        this.refreshRoom()
        this.startPolling()
      }
    } else if (this.hubInited) {
      this.loadParties()
    }
  },

  onHide() {
    this.stopPolling()
  },

  onUnload() {
    this.stopPolling()
  },

  onShareAppMessage() {
    const p = this.data.party
    if (p) {
      return {
        title: `来参加「${p.title}」，一起点菜吧`,
        path: `/pages/dinner-party/dinner-party?id=${p._id}`,
      }
    }
    return { title: '智味菜谱 · 饭局点菜', path: '/pages/dinner-party/dinner-party' }
  },

  // ==================== hub 模式 ====================

  async loadParties() {
    this.setData({ loading: true })
    try {
      await app.ensureLogin().catch((e) => console.warn('登录失败', e))
      const res = await orderService.getMyParties()
      const parties: PartyVM[] = res.list.map((p) => ({
        ...p,
        timeText: formatTime(p.createdAt),
        statusText: statusTextOf(p.status),
      }))
      this.setData({ parties, loading: false })
      this.hubInited = true
    } catch (e) {
      console.warn('加载饭局列表失败', e)
      this.setData({ loading: false })
    }
  },

  /** 发起饭局：创建后跳转到房间页并自动拉起分享 */
  async createParty() {
    try {
      wx.showLoading({ title: '创建中', mask: true })
      const res = await orderService.createParty('')
      wx.hideLoading()
      this.hubInited = false
      // 跳转到房间页，房间页 onShow 会检测 needShare 并拉起分享
      wx.redirectTo({
        url: `/pages/dinner-party/dinner-party?id=${res.party._id}&needShare=1`,
      })
    } catch (e) {
      wx.hideLoading()
      console.warn('创建饭局失败', e)
    }
  },

  onPartyTap(e: any) {
    const id = e.currentTarget.dataset.id as string
    wx.redirectTo({ url: `/pages/dinner-party/dinner-party?id=${id}` })
  },

  // ==================== room 模式 ====================

  async enterRoom() {
    this.setData({ loading: true })
    try {
      await app.ensureLogin().catch((e) => console.warn('登录失败', e))
    } catch (e) {
      console.warn(e)
    }
    // 通过分享链接进入：自动加入饭局
    try {
      await orderService.enterParty(this.data.partyId)
    } catch (e) {
      console.warn('进入饭局失败', e)
    }
    await this.refreshRoom()
    this.startPolling()
  },

  async refreshRoom() {
    if (!this.data.partyId) return
    try {
      const res = await orderService.getPartyDetail(this.data.partyId)
      const party: PartyVM = {
        ...res.party,
        timeText: formatTime(res.party.createdAt),
        statusText: statusTextOf(res.party.status),
      }
      const me = app.globalData.openid
      const isHost = !!me && res.party._openid === me

      // 参与者头像索引
      const memberMap = new Map<string, { nickName: string; avatarUrl: string }>()
      ;(party.participants || []).forEach((m) => memberMap.set(m.openid, m))

      // 按加菜人分组
      const groups: DishGroup[] = []
      const groupMap = new Map<string, DishGroup>()
      res.cartItems.forEach((it) => {
        let g = groupMap.get(it.addedBy)
        if (!g) {
          const member = memberMap.get(it.addedBy)
          g = {
            openid: it.addedBy,
            name: it.addedByName || (member ? member.nickName : '神秘食客'),
            avatarUrl: member ? member.avatarUrl : DEFAULT_AVATAR,
            items: [],
            count: 0,
          }
          groupMap.set(it.addedBy, g)
          groups.push(g)
        }
        g.items.push(it)
        g.count += it.quantity || 0
      })

      const totalCount = res.cartItems.reduce((sum, it) => sum + (it.quantity || 0), 0)
      const myGroup = groupMap.get(me)
      const myCount = myGroup ? myGroup.count : 0

      // 发起人昵称（用于弹层标题）
      const hostMember = res.party._openid ? memberMap.get(res.party._openid) : undefined
      const hostName = hostMember ? hostMember.nickName : 'TA'

      this.setData({
        party,
        groups,
        myOpenid: me,
        totalCount,
        myCount,
        isHost,
        canEdit: res.party.status === 'active',
        hostName,
        pickerList: res.hostRecipes || [],
        loading: false,
      })
    } catch (e) {
      console.warn('加载饭局详情失败', e)
      this.setData({ loading: false, pickerList: [] })
    }
  },

  startPolling() {
    this.stopPolling()
    this.pollTimer = setInterval(() => {
      this.refreshRoom()
    }, 3000)
  },

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }
  },

  /** 关闭分享引导弹窗 */
  closeShareGuide() {
    this.setData({ showShareGuide: false })
  },

  // ---------- 加菜弹层 ----------

  openPicker() {
    this.setData({ showPicker: true })
    this.loadPickerList()
  },

  closePicker() {
    this.setData({ showPicker: false })
  },

  noop() {},

  /** 加载菜单（从 refreshRoom 缓存中读取，不再重复请求） */
  loadPickerList() {
    const cached = this.data.pickerList
    if (cached.length > 0) {
      return
    }
    // 缓存为空时从 refreshRoom 的数据中取
    // refreshRoom 已经把 hostRecipes 存到 pickerList 了
    if (this.data.pickerList.length === 0) {
      this.refreshRoom().then(() => {
        // refreshRoom 会更新 pickerList
      })
    }
  },

  async onPickRecipe(e: any) {
    const recipeId = e.currentTarget.dataset.id as string
    try {
      await orderService.addToCart({ recipeId, quantity: 1, partyId: this.data.partyId })
      wx.showToast({ title: '已加菜', icon: 'success' })
      this.refreshRoom()
    } catch (err) {
      console.warn('加菜失败', err)
    }
  },

  async onRemoveCartItem(e: any) {
    const gidx = Number(e.currentTarget.dataset.gidx)
    const didx = Number(e.currentTarget.dataset.didx)
    const group = this.data.groups[gidx]
    if (!group) return
    const dish = group.items[didx]
    if (!dish) return
    // 只能删自己的菜
    if (dish.addedBy !== this.data.myOpenid) {
      wx.showToast({ title: '只能删除自己点的菜', icon: 'none' })
      return
    }
    try {
      await orderService.removeFromCart(dish._id)
      this.refreshRoom()
    } catch (err) {
      console.warn('删除菜品失败', err)
    }
  },

  // ---------- 提交订单 ----------

  submitOrder() {
    if (!this.data.canEdit) return
    if (this.data.myCount === 0) {
      wx.showToast({ title: '你还没有点菜', icon: 'none' })
      return
    }
    wx.showModal({
      title: '确认下单',
      content: `提交你点的 ${this.data.myCount} 份菜品？`,
      success: (res) => {
        if (res.confirm) this.doSubmitOrder()
      },
    })
  },

  async doSubmitOrder() {
    try {
      wx.showLoading({ title: '提交中', mask: true })
      const res = await orderService.createOrder({ partyId: this.data.partyId, onlyMine: true })
      wx.hideLoading()
      this.stopPolling()
      wx.navigateTo({ url: `/pages/order-detail/order-detail?id=${res.orderId}` })
    } catch (e) {
      wx.hideLoading()
      console.warn('提交订单失败', e)
    }
  },

  /** 发起人查看饭局的所有订单 */
  viewOrders() {
    wx.navigateTo({ url: `/pages/order-list/order-list?partyId=${this.data.partyId}` })
  },

  closeParty() {
    if (!this.data.isHost) return
    wx.showModal({
      title: '结束饭局',
      content: '结束后所有人不能再点菜，确定吗？',
      success: (res) => {
        if (!res.confirm) return
        orderService
          .closeParty(this.data.partyId)
          .then(() => {
            wx.showToast({ title: '饭局已结束', icon: 'none' })
            this.refreshRoom()
          })
          .catch((e) => console.warn('结束饭局失败', e))
      },
    })
  },
})
