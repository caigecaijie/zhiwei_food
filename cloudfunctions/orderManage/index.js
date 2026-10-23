const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const MAX_PAGE_SIZE = 50
const DEFAULT_AVATAR =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

function pack(data) {
  return { code: 0, data, msg: 'ok' }
}

function fail(msg) {
  return { code: 1, data: null, msg }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  try {
    switch (event.action) {
      case 'addToCart':
        return await addToCart(OPENID, event)
      case 'updateCart':
        return await updateCart(OPENID, event)
      case 'removeFromCart':
        return await removeFromCart(OPENID, event)
      case 'getCartList':
        return await getCartList(OPENID, event)
      case 'createOrder':
        return await createOrder(OPENID, event)
      case 'getOrderList':
        return await getOrderList(OPENID, event)
      case 'getOrderDetail':
        return await getOrderDetail(OPENID, event)
      case 'updateOrderStatus':
        return await updateOrderStatus(OPENID, event)
      case 'createParty':
        return await createParty(OPENID, event)
      case 'enterParty':
        return await enterParty(OPENID, event)
      case 'getPartyDetail':
        return await getPartyDetail(event)
      case 'getMyParties':
        return await getMyParties(OPENID)
      case 'closeParty':
        return await closeParty(OPENID, event)
      default:
        return fail('未知操作')
    }
  } catch (e) {
    console.error('orderManage error', e)
    return fail('服务异常，请稍后重试')
  }
}

// ==================== 购物车 ====================

async function addToCart(OPENID, event) {
  const quantity = Math.max(1, parseInt(event.quantity, 10) || 1)
  const r = await db.collection('recipes').where({ _id: event.recipeId }).get()
  if (r.data.length === 0) return fail('菜谱不存在')
  const recipe = r.data[0]

  let addedByName = '美食爱好者'
  try {
    const u = await db.collection('users').where({ _openid: OPENID }).get()
    if (u.data.length > 0 && u.data[0].nickName) addedByName = u.data[0].nickName
  } catch (e) {
    console.warn(e)
  }

  const addRes = await db.collection('carts').add({
    data: {
      _openid: OPENID,
      recipeId: event.recipeId,
      recipeTitle: recipe.title,
      recipeCover: recipe.coverImage || '',
      quantity,
      remark: event.remark || '',
      partyId: event.partyId || '',
      addedBy: OPENID,
      addedByName,
      createdAt: db.serverDate(),
    },
  })
  return pack({ cartId: addRes._id })
}

async function updateCart(OPENID, event) {
  const q = await db.collection('carts').where({ _id: event.cartId, _openid: OPENID }).get()
  if (q.data.length === 0) return fail('该菜品不在你的购物车')
  const data = {}
  if (event.quantity !== undefined) {
    data.quantity = Math.max(1, parseInt(event.quantity, 10) || 1)
  }
  if (event.remark !== undefined) {
    data.remark = event.remark
  }
  await db.collection('carts').doc(event.cartId).update({ data })
  return pack({ ok: true })
}

async function removeFromCart(OPENID, event) {
  const q = await db.collection('carts').where({ _id: event.cartId, _openid: OPENID }).get()
  if (q.data.length === 0) return fail('该菜品不在你的购物车')
  await db.collection('carts').doc(event.cartId).remove()
  return pack({ ok: true })
}

async function getCartList(OPENID, event) {
  const partyId = event.partyId || ''
  const res = await db
    .collection('carts')
    .where({ _openid: OPENID, partyId })
    .orderBy('createdAt', 'asc')
    .limit(100)
    .get()
  let totalCount = 0
  res.data.forEach((it) => {
    totalCount += it.quantity || 0
  })
  return pack({ list: res.data, totalCount })
}

// ==================== 订单 ====================

async function createOrder(OPENID, event) {
  const partyId = event.partyId || ''
  const onlyMine = event.onlyMine === true

  // 购物车查询条件
  let cartWhere = partyId ? { partyId } : { _openid: OPENID, partyId: '' }
  if (partyId && onlyMine) {
    cartWhere = { partyId, addedBy: OPENID }
  }

  const cartRes = await db
    .collection('carts')
    .where(cartWhere)
    .orderBy('createdAt', 'asc')
    .limit(200)
    .get()
  const carts = cartRes.data
  if (carts.length === 0) return fail('购物车是空的')

  const items = carts.map((c) => ({
    recipeId: c.recipeId,
    title: c.recipeTitle,
    cover: c.recipeCover,
    quantity: c.quantity,
    remark: c.remark || '',
    addedBy: c.addedBy,
    addedByName: c.addedByName,
  }))
  let totalCount = 0
  items.forEach((it) => {
    totalCount += it.quantity || 0
  })

  // 参与人
  let participants = [OPENID]
  if (partyId) {
    const p = await db.collection('dinner_parties').where({ _id: partyId }).get()
    if (p.data.length === 0) return fail('饭局不存在')
    const list = p.data[0].participants || []
    if (list.length > 0) participants = list.map((x) => x.openid)
  }

  const orderNo = 'D' + Date.now() + Math.floor(1000 + Math.random() * 9000)
  const now = db.serverDate()
  const addRes = await db.collection('orders').add({
    data: {
      _openid: OPENID,
      orderNo,
      partyId,
      items,
      totalCount,
      remark: event.remark || '',
      participants,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    },
  })

  // 清空对应购物车
  await db.collection('carts').where(cartWhere).remove()
  return pack({ orderId: addRes._id, orderNo })
}

async function getOrderList(OPENID, event) {
  let where
  if (event.partyId) {
    // 按饭局查询：返回该饭局的所有订单
    where = { partyId: event.partyId }
    if (event.status) {
      where = _.and([where, { status: event.status }])
    }
  } else {
    where = _.or([{ _openid: OPENID }, { participants: OPENID }])
    if (event.status) {
      where = _.and([where, { status: event.status }])
    }
  }
  const page = Math.max(1, parseInt(event.page, 10) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, parseInt(event.pageSize, 10) || 10)

  const countRes = await db.collection('orders').where(where).count()
  const listRes = await db
    .collection('orders')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  return pack({ list: listRes.data, total: countRes.total })
}

async function getOrderDetail(OPENID, event) {
  const q = await db.collection('orders').where({ _id: event.orderId }).get()
  if (q.data.length === 0) return fail('订单不存在')
  const order = q.data[0]
  if (order._openid !== OPENID && (order.participants || []).indexOf(OPENID) < 0) {
    return fail('无权查看该订单')
  }
  return pack({ order })
}

async function updateOrderStatus(OPENID, event) {
  const q = await db.collection('orders').where({ _id: event.orderId, _openid: OPENID }).get()
  if (q.data.length === 0) return fail('订单不存在或无权操作')
  const cur = q.data[0].status
  const next = event.status
  const allowed =
    (cur === 'pending' && (next === 'cooking' || next === 'cancelled')) ||
    (cur === 'cooking' && next === 'done')
  if (!allowed) return fail('当前状态不允许该操作')
  await db.collection('orders').doc(event.orderId).update({
    data: { status: next, updatedAt: db.serverDate() },
  })
  return pack({ ok: true })
}

// ==================== 饭局 ====================

async function createParty(OPENID, event) {
  let title = (event.title || '').trim()
  if (!title) title = '一起来点菜吧'

  let nickName = '美食爱好者'
  let avatarUrl = DEFAULT_AVATAR
  try {
    const u = await db.collection('users').where({ _openid: OPENID }).get()
    if (u.data.length > 0) {
      nickName = u.data[0].nickName || nickName
      avatarUrl = u.data[0].avatarUrl || avatarUrl
    }
  } catch (e) {
    console.warn(e)
  }

  const partyNo = 'P' + Date.now()
  const now = db.serverDate()
  const participants = [{ openid: OPENID, nickName, avatarUrl }]
  const addRes = await db.collection('dinner_parties').add({
    data: {
      _openid: OPENID,
      partyNo,
      title,
      inviteCode: '',
      participants,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    },
  })
  const party = {
    _id: addRes._id,
    _openid: OPENID,
    partyNo,
    title,
    inviteCode: '',
    participants,
    status: 'active',
  }
  return pack({ party })
}

/** 通过 partyId 进入饭局：不在参与者列表则自动加入 */
async function enterParty(OPENID, event) {
  const partyId = event.partyId
  if (!partyId) return fail('参数错误')
  const p = await db.collection('dinner_parties').where({ _id: partyId }).get()
  if (p.data.length === 0) return fail('饭局不存在')
  const party = p.data[0]
  if (party.status !== 'active') return fail('饭局已结束')

  const exists = (party.participants || []).some((x) => x.openid === OPENID)
  if (!exists) {
    let nickName = '美食爱好者'
    let avatarUrl = DEFAULT_AVATAR
    try {
      const u = await db.collection('users').where({ _openid: OPENID }).get()
      if (u.data.length > 0) {
        nickName = u.data[0].nickName || nickName
        avatarUrl = u.data[0].avatarUrl || avatarUrl
      }
    } catch (e) {
      console.warn(e)
    }
    await db.collection('dinner_parties').doc(party._id).update({
      data: {
        participants: _.push([{ openid: OPENID, nickName, avatarUrl }]),
        updatedAt: db.serverDate(),
      },
    })
    party.participants = (party.participants || []).concat([
      { openid: OPENID, nickName, avatarUrl },
    ])
  }
  return pack({ party })
}

async function getPartyDetail(event) {
  const p = await db.collection('dinner_parties').where({ _id: event.partyId }).get()
  if (p.data.length === 0) return fail('饭局不存在')
  const party = p.data[0]

  // 购物车（所有人可见）
  const cartRes = await db
    .collection('carts')
    .where({ partyId: event.partyId })
    .orderBy('createdAt', 'asc')
    .limit(200)
    .get()

  // 发起人的菜谱（作为饭局菜单池，含私有菜谱）
  let hostRecipes = []
  try {
    const hostRes = await db
      .collection('recipes')
      .where({ _openid: party._openid })
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()
    hostRecipes = hostRes.data
  } catch (e) {
    console.warn('获取发起人菜谱失败', e)
  }

  return pack({ party, cartItems: cartRes.data, hostRecipes })
}

async function getMyParties(OPENID) {
  const res = await db
    .collection('dinner_parties')
    .where({ _openid: OPENID, status: _.neq('closed') })
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get()
  return pack({ list: res.data })
}

async function closeParty(OPENID, event) {
  const q = await db.collection('dinner_parties').where({ _id: event.partyId, _openid: OPENID }).get()
  if (q.data.length === 0) return fail('饭局不存在或无权操作')
  await db.collection('dinner_parties').doc(event.partyId).update({
    data: { status: 'closed', updatedAt: db.serverDate() },
  })
  return pack({ ok: true })
}
