const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

/** 全部业务集合（含后期预留） */
const COLLECTIONS = [
  'users',
  'recipes',
  'categories',
  'carts',
  'orders',
  'dinner_parties',
  'favorites',
  'posts',
  'comments',
  'fridge_items',
]

/**
 * 初始化数据库：批量创建集合，已存在的忽略
 */
exports.main = async () => {
  const db = cloud.database()
  const created = []
  const existed = []
  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name)
      created.push(name)
    } catch (e) {
      // 集合已存在等异常直接忽略
      existed.push(name)
    }
  }
  return { code: 0, data: { created, existed }, msg: 'ok' }
}
