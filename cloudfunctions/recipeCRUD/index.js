const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const MAX_PAGE_SIZE = 50

function pack(data) {
  return { code: 0, data, msg: 'ok' }
}

function fail(msg) {
  return { code: 1, data: null, msg }
}

/** 转义正则特殊字符 */
function escapeReg(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * 内容安全检查：命中风险内容返回 false，接口异常宽松放行
 */
async function safeContent(content, openid) {
  if (!content || !content.trim()) return true
  try {
    await cloud.openapi.security.msgSecCheck({
      version: 2,
      openid,
      scene: 2,
      content,
    })
    return true
  } catch (e) {
    const msg = (e && (e.errMsg || e.message)) || ''
    if ((e && e.errCode === 87014) || msg.indexOf('87014') >= 0) {
      return false
    }
    console.warn('msgSecCheck 异常，宽松放行', e)
    return true
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  try {
    switch (event.action) {
      case 'getCategories':
        return await getCategories(OPENID)
      case 'saveCategory':
        return await saveCategory(OPENID, event)
      case 'deleteCategory':
        return await deleteCategory(OPENID, event)
      case 'createRecipe':
        return await createRecipe(OPENID, event)
      case 'updateRecipe':
        return await updateRecipe(OPENID, event)
      case 'deleteRecipe':
        return await deleteRecipe(OPENID, event)
      case 'getRecipeList':
        return await getRecipeList(OPENID, event)
      case 'getRecipeDetail':
        return await getRecipeDetail(OPENID, event)
      default:
        return fail('未知操作')
    }
  } catch (e) {
    console.error('recipeCRUD error', e)
    return fail('服务异常，请稍后重试')
  }
}

// ==================== 分类 ====================

async function getCategories(OPENID) {
  const res = await db
    .collection('categories')
    .where({ _openid: OPENID })
    .orderBy('sort', 'asc')
    .orderBy('createdAt', 'asc')
    .get()
  return pack({ list: res.data })
}

async function saveCategory(OPENID, event) {
  const name = (event.name || '').trim()
  if (!name) return fail('请输入分类名称')
  const sort = typeof event.sort === 'number' ? event.sort : 0

  if (event._id) {
    const q = await db.collection('categories').where({ _id: event._id, _openid: OPENID }).get()
    if (q.data.length === 0) return fail('分类不存在')
    await db.collection('categories').doc(event._id).update({
      data: { name, sort, updatedAt: db.serverDate() },
    })
    return pack({ _id: event._id })
  }

  const addRes = await db.collection('categories').add({
    data: {
      _openid: OPENID,
      name,
      icon: event.icon || '',
      sort,
      recipeCount: 0,
      createdAt: db.serverDate(),
    },
  })
  return pack({ _id: addRes._id })
}

async function deleteCategory(OPENID, event) {
  const q = await db.collection('categories').where({ _id: event._id, _openid: OPENID }).get()
  if (q.data.length === 0) return fail('分类不存在')
  await db.collection('categories').doc(event._id).remove()
  // 该分类下的菜谱 categoryId 置空
  try {
    await db
      .collection('recipes')
      .where({ _openid: OPENID, categoryId: event._id })
      .update({ data: { categoryId: '' } })
  } catch (e) {
    console.warn('清空分类下菜谱失败', e)
  }
  return pack({ ok: true })
}

// ==================== 菜谱 ====================

async function createRecipe(OPENID, event) {
  const title = (event.title || '').trim()
  if (!title) return fail('请输入菜名')
  if (!event.categoryId) return fail('请选择分类')
  if (!Array.isArray(event.ingredients) || event.ingredients.length === 0) {
    return fail('请至少添加一种食材')
  }

  // 校验分类归属，防止写入无效分类
  const cat = await db
    .collection('categories')
    .where({ _id: event.categoryId, _openid: OPENID })
    .count()
  if (cat.total === 0) return fail('分类不存在，请重新选择')

  const safe = await safeContent(`${title} ${event.description || ''}`, OPENID)
  if (!safe) return fail('内容包含敏感信息，请修改后再发布')

  const now = db.serverDate()
  const addRes = await db.collection('recipes').add({
    data: {
      _openid: OPENID,
      title,
      coverImage: event.coverImage || '',
      description: event.description || '',
      categoryId: event.categoryId || '',
      difficulty: event.difficulty || 3,
      cookTime: event.cookTime || 0,
      servings: event.servings || 1,
      ingredients: event.ingredients || [],
      steps: event.steps || [],
      tips: event.tips || '',
      tags: event.tags || [],
      isPublic: event.isPublic !== false,
      viewCount: 0,
      likeCount: 0,
      favoriteCount: 0,
      createdAt: now,
      updatedAt: now,
    },
  })

  // 分类计数 +1
  if (event.categoryId) {
    try {
      await db
        .collection('categories')
        .where({ _id: event.categoryId })
        .update({ data: { recipeCount: _.inc(1) } })
    } catch (e) {
      console.warn('分类计数失败', e)
    }
  }
  // 用户菜谱数 +1
  try {
    await db
      .collection('users')
      .where({ _openid: OPENID })
      .update({ data: { 'stats.recipeCount': _.inc(1) } })
  } catch (e) {
    console.warn('用户统计失败', e)
  }
  return pack({ _id: addRes._id })
}

async function updateRecipe(OPENID, event) {
  const q = await db.collection('recipes').where({ _id: event._id, _openid: OPENID }).get()
  if (q.data.length === 0) return fail('菜谱不存在或无权修改')
  const old = q.data[0]

  const data = { updatedAt: db.serverDate() }
  const fields = [
    'title', 'coverImage', 'description', 'categoryId', 'difficulty',
    'cookTime', 'servings', 'ingredients', 'steps', 'tips', 'tags', 'isPublic',
  ]
  fields.forEach((f) => {
    if (event[f] !== undefined) data[f] = event[f]
  })

  // 修改了分类时校验新分类归属
  if (data.categoryId) {
    const cat = await db
      .collection('categories')
      .where({ _id: data.categoryId, _openid: OPENID })
      .count()
    if (cat.total === 0) return fail('分类不存在，请重新选择')
  }

  await db.collection('recipes').doc(event._id).update({ data })

  // 分类变更时修正计数
  const oldCat = old.categoryId || ''
  const newCat = data.categoryId !== undefined ? data.categoryId || '' : oldCat
  if (oldCat !== newCat) {
    if (oldCat) {
      try {
        await db.collection('categories').where({ _id: oldCat }).update({ data: { recipeCount: _.inc(-1) } })
      } catch (e) {
        console.warn(e)
      }
    }
    if (newCat) {
      try {
        await db.collection('categories').where({ _id: newCat }).update({ data: { recipeCount: _.inc(1) } })
      } catch (e) {
        console.warn(e)
      }
    }
  }
  return pack({ ok: true })
}

async function deleteRecipe(OPENID, event) {
  const q = await db.collection('recipes').where({ _id: event._id, _openid: OPENID }).get()
  if (q.data.length === 0) return fail('菜谱不存在或无权删除')
  const old = q.data[0]
  await db.collection('recipes').doc(event._id).remove()

  if (old.categoryId) {
    try {
      await db.collection('categories').where({ _id: old.categoryId }).update({ data: { recipeCount: _.inc(-1) } })
    } catch (e) {
      console.warn(e)
    }
  }
  try {
    await db
      .collection('users')
      .where({ _openid: OPENID })
      .update({ data: { 'stats.recipeCount': _.inc(-1) } })
  } catch (e) {
    console.warn(e)
  }
  return pack({ ok: true })
}

async function getRecipeList(OPENID, event) {
  const conditions = []
  if (event.filter === 'mine') {
    conditions.push({ _openid: OPENID })
  } else {
    conditions.push(_.or([{ isPublic: true }, { _openid: OPENID }]))
  }
  if (event.categoryId && event.categoryId !== 'all') {
    conditions.push({ categoryId: event.categoryId })
  }
  if (event.keyword) {
    conditions.push({ title: db.RegExp({ regexp: escapeReg(event.keyword), options: 'i' }) })
  }
  const where = conditions.length === 1 ? conditions[0] : _.and(conditions)

  const page = Math.max(1, parseInt(event.page, 10) || 1)
  const pageSize = Math.min(MAX_PAGE_SIZE, parseInt(event.pageSize, 10) || 10)

  const countRes = await db.collection('recipes').where(where).count()
  const listRes = await db
    .collection('recipes')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()
  return pack({ list: listRes.data, total: countRes.total })
}

async function getRecipeDetail(OPENID, event) {
  const q = await db.collection('recipes').where({ _id: event._id }).get()
  if (q.data.length === 0) return fail('菜谱不存在或已删除')
  const recipe = q.data[0]
  if (!recipe.isPublic && recipe._openid !== OPENID) {
    return fail('菜谱不存在或已删除')
  }

  // 浏览数 +1（失败忽略）
  try {
    await db.collection('recipes').doc(event._id).update({ data: { viewCount: _.inc(1) } })
  } catch (e) {
    console.warn(e)
  }

  // 联查作者信息
  try {
    const u = await db.collection('users').where({ _openid: recipe._openid }).get()
    if (u.data.length > 0) {
      recipe.author = {
        nickName: u.data[0].nickName,
        avatarUrl: u.data[0].avatarUrl,
      }
    }
  } catch (e) {
    console.warn('联查作者失败', e)
  }
  return pack({ recipe })
}
