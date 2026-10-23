const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

const SCAN_LIMIT = 500
const RESULT_LIMIT = 50

function pack(data) {
  return { code: 0, data, msg: 'ok' }
}

function fail(msg) {
  return { code: 1, data: null, msg }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  if (event.action !== 'matchByIngredients') {
    return fail('未知操作')
  }
  const ingredients = Array.isArray(event.ingredients) ? event.ingredients : []
  if (ingredients.length === 0) return fail('请先添加食材')

  try {
    // 用户输入规范化：小写去重
    const userIngs = Array.from(
      new Set(ingredients.map((s) => String(s).trim().toLowerCase()).filter(Boolean))
    )
    if (userIngs.length === 0) return fail('请先添加食材')

    // 扫描可见菜谱（公开 + 自己的）
    const res = await db
      .collection('recipes')
      .where(_.or([{ isPublic: true }, { _openid: OPENID }]))
      .limit(SCAN_LIMIT)
      .get()

    const results = []
    res.data.forEach((recipe) => {
      const ings = Array.isArray(recipe.ingredients) ? recipe.ingredients : []
      const names = []
      ings.forEach((it) => {
        if (it && it.name) names.push(String(it.name).trim().toLowerCase())
      })
      const unique = Array.from(new Set(names.filter(Boolean)))
      if (unique.length === 0) return

      const matched = unique.filter((n) => userIngs.indexOf(n) >= 0)
      if (matched.length === 0) return
      const missing = unique.filter((n) => userIngs.indexOf(n) < 0)

      results.push({
        recipe,
        matchCount: matched.length,
        totalCount: unique.length,
        missing,
      })
    })

    // 匹配度优先，其次匹配数量
    results.sort(
      (a, b) =>
        b.matchCount / b.totalCount - a.matchCount / a.totalCount ||
        b.matchCount - a.matchCount
    )

    return pack({ list: results.slice(0, RESULT_LIMIT) })
  } catch (e) {
    console.error('matchRecipe error', e)
    return fail('匹配失败，请稍后重试')
  }
}
