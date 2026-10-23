const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const DEFAULT_AVATAR =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

/** 新用户默认分类 */
const DEFAULT_CATEGORIES = [
  { name: '荤菜', icon: '🥩' },
  { name: '素菜', icon: '🥬' },
  { name: '鱼虾海鲜', icon: '🦐' },
  { name: '汤羹', icon: '🍲' },
  { name: '凉菜', icon: '🥗' },
  { name: '主食', icon: '🍚' },
  { name: '甜品', icon: '🍰' },
]

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
      case 'login':
        return await login(OPENID)
      case 'updateProfile':
        return await updateProfile(OPENID, event)
      case 'getProfile':
        return await getProfile(OPENID)
      default:
        return fail('未知操作')
    }
  } catch (e) {
    console.error('userManage error', e)
    return fail('服务异常，请稍后重试')
  }
}

/** 登录：不存在则注册新用户并初始化默认分类 */
async function login(OPENID) {
  const res = await db.collection('users').where({ _openid: OPENID }).get()
  if (res.data.length > 0) {
    return pack({ openid: OPENID, userInfo: res.data[0] })
  }

  const now = db.serverDate()
  const addRes = await db.collection('users').add({
    data: {
      _openid: OPENID,
      nickName: '美食爱好者',
      avatarUrl: DEFAULT_AVATAR,
      bio: '',
      stats: { recipeCount: 0 },
      createdAt: now,
      updatedAt: now,
    },
  })

  // 初始化默认分类
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const c = DEFAULT_CATEGORIES[i]
    try {
      await db.collection('categories').add({
        data: {
          _openid: OPENID,
          name: c.name,
          icon: c.icon,
          sort: i,
          recipeCount: 0,
          createdAt: now,
        },
      })
    } catch (e) {
      console.warn('创建默认分类失败', e)
    }
  }

  const userInfo = {
    _id: addRes._id,
    _openid: OPENID,
    nickName: '美食爱好者',
    avatarUrl: DEFAULT_AVATAR,
    bio: '',
    stats: { recipeCount: 0 },
  }
  return pack({ openid: OPENID, userInfo })
}

/** 更新资料 */
async function updateProfile(OPENID, event) {
  const data = { updatedAt: db.serverDate() }
  if (event.nickName) data.nickName = event.nickName
  if (event.avatarUrl) data.avatarUrl = event.avatarUrl
  if (typeof event.bio === 'string') data.bio = event.bio
  await db.collection('users').where({ _openid: OPENID }).update({ data })
  return pack({ ok: true })
}

/** 获取资料 */
async function getProfile(OPENID) {
  const res = await db.collection('users').where({ _openid: OPENID }).get()
  return pack({ userInfo: res.data.length > 0 ? res.data[0] : null })
}
