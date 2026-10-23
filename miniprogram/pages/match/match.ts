import { recipeService } from '../../services/recipe'
import { COMMON_INGREDIENTS, DIFFICULTY_LABELS } from '../../utils/constants'
import type { MatchResult } from '../../types/recipe'

/** 常用食材 chip */
interface CommonChip {
  name: string
  selected: boolean
}

/** 匹配结果视图模型 */
interface MatchVM {
  id: string
  cover: string
  title: string
  matchCount: number
  totalCount: number
  missingText: string
  metaText: string
}

/** 用常用食材列表生成 chip 状态 */
function buildChips(selected: string[]): CommonChip[] {
  return COMMON_INGREDIENTS.map((name) => ({ name, selected: selected.indexOf(name) >= 0 }))
}

Page({
  data: {
    inputValue: '',
    selected: [] as string[],
    commonIngredients: buildChips([]),
    searched: false,
    loading: false,
    results: [] as MatchVM[],
  },

  onInput(e: any) {
    this.setData({ inputValue: e.detail.value })
  },

  /** 点击"添加"按钮 */
  onAdd() {
    this.addIngredient(this.data.inputValue)
  },

  /** 点击常用食材 chip：已选则移除，未选则添加 */
  onQuickTap(e: any) {
    const name = e.currentTarget.dataset.name as string
    if (this.data.selected.indexOf(name) >= 0) {
      this.removeIngredient(name)
    } else {
      this.addIngredient(name)
    }
  },

  /** 点击已选 chip 上的 ✕ 移除 */
  onRemoveIngredient(e: any) {
    this.removeIngredient(e.currentTarget.dataset.name as string)
  },

  /** 清空全部已选食材 */
  onClear() {
    this.setData({ selected: [], commonIngredients: buildChips([]) })
  },

  addIngredient(raw: string) {
    const name = (raw || '').trim()
    if (!name) return
    if (this.data.selected.indexOf(name) >= 0) {
      wx.showToast({ title: '已添加过啦', icon: 'none' })
      this.setData({ inputValue: '' })
      return
    }
    const selected = this.data.selected.concat(name)
    this.setData({ selected, inputValue: '', commonIngredients: buildChips(selected) })
  },

  removeIngredient(name: string) {
    const selected = this.data.selected.filter((s) => s !== name)
    this.setData({ selected, commonIngredients: buildChips(selected) })
  },

  /** 开始按食材匹配菜谱 */
  async onMatch() {
    if (this.data.selected.length === 0) {
      wx.showToast({ title: '先添加食材哦', icon: 'none' })
      return
    }
    if (this.data.loading) return
    this.setData({ loading: true })
    try {
      const res = await recipeService.matchByIngredients(this.data.selected)
      const results: MatchVM[] = res.list.map((m: MatchResult) => {
        const difficulty = DIFFICULTY_LABELS[m.recipe.difficulty] || ''
        const cookTime = m.recipe.cookTime ? `${m.recipe.cookTime}分钟` : ''
        const meta = [difficulty, cookTime].filter((s) => s).join(' · ')
        return {
          id: m.recipe._id,
          cover: m.recipe.coverImage,
          title: m.recipe.title,
          matchCount: m.matchCount,
          totalCount: m.totalCount,
          missingText: (m.missing || []).slice(0, 5).join('、'),
          metaText: meta,
        }
      })
      this.setData({ results, searched: true, loading: false })
    } catch (e) {
      console.warn('匹配菜谱失败', e)
      this.setData({ loading: false })
    }
  },

  /** 点击结果跳转菜谱详情 */
  onResultTap(e: any) {
    const id = e.currentTarget.dataset.id as string
    wx.navigateTo({ url: `/pages/recipe-detail/recipe-detail?id=${id}` })
  },
})
