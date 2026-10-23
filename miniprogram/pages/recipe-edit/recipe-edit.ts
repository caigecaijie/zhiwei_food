import { recipeService } from '../../services/recipe'
import type { RecipeFormData } from '../../services/recipe'
import { chooseImage, uploadImage } from '../../utils/request'
import { COMMON_UNITS, DIFFICULTY_LABELS, SCENE_TAGS, TASTE_TAGS } from '../../utils/constants'
import type { Category } from '../../types/recipe'

/** 食材行（_k 为渲染 key） */
interface IngRow {
  _k: number
  name: string
  amount: string
  unit: string
}

/** 步骤行 */
interface StepRow {
  _k: number
  order: number
  text: string
  image: string
}

let rowKey = 1

Page({
  data: {
    isEdit: false,
    recipeId: '',
    saving: false,
    categories: [] as Category[],
    categoryNames: [] as string[],
    selectedCategoryName: '',
    selectedCategoryIndex: -1,
    difficultyLabels: DIFFICULTY_LABELS,
    tasteTags: TASTE_TAGS,
    sceneTags: SCENE_TAGS,
    units: COMMON_UNITS,
    tagMap: {} as Record<string, boolean>,
    form: {
      title: '',
      coverImage: '',
      description: '',
      categoryId: '',
      difficulty: 1,
      cookTime: 30,
      servings: 2,
      ingredients: [] as IngRow[],
      steps: [] as StepRow[],
      tips: '',
      tags: [] as string[],
      isPublic: true,
    },
  },

  onLoad(options: Record<string, string | undefined>) {
    this.initDefaultRows()
    this.loadCategories()
    if (options && options.id) {
      this.setData({ isEdit: true, recipeId: options.id })
      wx.setNavigationBarTitle({ title: '编辑菜谱' })
      this.loadRecipe(options.id)
    }
  },

  /** 默认一行食材 + 一步 */
  initDefaultRows() {
    this.setData({
      'form.ingredients': [{ _k: rowKey++, name: '', amount: '', unit: '' }],
      'form.steps': [{ _k: rowKey++, order: 1, text: '', image: '' }],
    })
  },

  async loadCategories() {
    try {
      const res = await recipeService.getCategories()
      this.setData({ categories: res.list, categoryNames: res.list.map((c) => c.name) })
      if (this.data.form.categoryId) {
        this.updateSelectedCategoryName(this.data.form.categoryId)
      }
    } catch (e) {
      console.warn('加载分类失败', e)
    }
  },

  updateSelectedCategoryName(categoryId: string) {
    const idx = this.data.categories.findIndex((c) => c._id === categoryId)
    this.setData({
      selectedCategoryIndex: idx,
      selectedCategoryName: idx >= 0 ? this.data.categories[idx].name : '',
    })
  },

  async loadRecipe(id: string) {
    try {
      const res = await recipeService.getDetail(id)
      const r = res.recipe
      const ingredients: IngRow[] = (r.ingredients || []).map((it) => ({
        _k: rowKey++,
        name: it.name || '',
        amount: it.amount || '',
        unit: it.unit || '',
      }))
      const steps: StepRow[] = (r.steps || []).map((s, i) => ({
        _k: rowKey++,
        order: i + 1,
        text: s.text || '',
        image: s.image || '',
      }))
      if (ingredients.length === 0) ingredients.push({ _k: rowKey++, name: '', amount: '', unit: '' })
      if (steps.length === 0) steps.push({ _k: rowKey++, order: 1, text: '', image: '' })
      this.setData({
        form: {
          title: r.title || '',
          coverImage: r.coverImage || '',
          description: r.description || '',
          categoryId: r.categoryId || '',
          difficulty: r.difficulty || 1,
          cookTime: r.cookTime || 30,
          servings: r.servings || 2,
          ingredients,
          steps,
          tips: r.tips || '',
          tags: r.tags || [],
          isPublic: r.isPublic !== false,
        },
      })
      this.rebuildTagMap(r.tags || [])
      this.updateSelectedCategoryName(r.categoryId || '')
    } catch (e) {
      console.warn('加载菜谱失败', e)
    }
  },

  // ---------- 基本信息 ----------

  onTitleInput(e: any) {
    this.setData({ 'form.title': e.detail.value as string })
  },

  onDescInput(e: any) {
    this.setData({ 'form.description': e.detail.value as string })
  },

  onTipsInput(e: any) {
    this.setData({ 'form.tips': e.detail.value as string })
  },

  onCookTimeInput(e: any) {
    this.setData({ 'form.cookTime': parseInt(e.detail.value, 10) || 0 })
  },

  onServingsInput(e: any) {
    this.setData({ 'form.servings': parseInt(e.detail.value, 10) || 0 })
  },

  onDifficultyTap(e: any) {
    this.setData({ 'form.difficulty': Number(e.currentTarget.dataset.v) })
  },

  onCategoryChange(e: any) {
    const idx = Number(e.detail.value)
    const cat = this.data.categories[idx]
    if (cat) {
      this.setData({
        'form.categoryId': cat._id,
        selectedCategoryName: cat.name,
        selectedCategoryIndex: idx,
      })
    }
  },

  onPublicChange(e: any) {
    this.setData({ 'form.isPublic': !!e.detail.value })
  },

  // ---------- 封面 ----------

  async chooseCover() {
    const paths = await chooseImage(1)
    if (paths.length === 0) return
    try {
      wx.showLoading({ title: '上传中', mask: true })
      const fileID = await uploadImage(paths[0])
      this.setData({ 'form.coverImage': fileID })
    } catch (e) {
      console.warn('封面上传失败', e)
    } finally {
      wx.hideLoading()
    }
  },

  removeCover() {
    this.setData({ 'form.coverImage': '' })
  },

  // ---------- 食材 ----------

  addIngredient() {
    const len = this.data.form.ingredients.length
    this.setData({ [`form.ingredients[${len}]`]: { _k: rowKey++, name: '', amount: '', unit: '' } })
  },

  removeIngredient(e: any) {
    const idx = Number(e.currentTarget.dataset.idx)
    const list = this.data.form.ingredients.slice()
    if (list.length <= 1) return
    list.splice(idx, 1)
    this.setData({ 'form.ingredients': list })
  },

  onIngredientInput(e: any) {
    const idx = Number(e.currentTarget.dataset.idx)
    const field = e.currentTarget.dataset.field as 'name' | 'amount'
    this.setData({ [`form.ingredients[${idx}].${field}`]: e.detail.value as string })
  },

  onUnitChange(e: any) {
    const idx = Number(e.currentTarget.dataset.idx)
    const unit = this.data.units[Number(e.detail.value)] || ''
    this.setData({ [`form.ingredients[${idx}].unit`]: unit })
  },

  // ---------- 步骤 ----------

  addStep() {
    const list = this.data.form.steps
    this.setData({ [`form.steps[${list.length}]`]: { _k: rowKey++, order: list.length + 1, text: '', image: '' } })
  },

  removeStep(e: any) {
    const idx = Number(e.currentTarget.dataset.idx)
    const list = this.data.form.steps.slice()
    if (list.length <= 1) return
    list.splice(idx, 1)
    this.setData({ 'form.steps': list })
  },

  onStepInput(e: any) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({ [`form.steps[${idx}].text`]: e.detail.value as string })
  },

  async chooseStepImage(e: any) {
    const idx = Number(e.currentTarget.dataset.idx)
    const paths = await chooseImage(1)
    if (paths.length === 0) return
    try {
      wx.showLoading({ title: '上传中', mask: true })
      const fileID = await uploadImage(paths[0])
      this.setData({ [`form.steps[${idx}].image`]: fileID })
    } catch (err) {
      console.warn('步骤图上传失败', err)
    } finally {
      wx.hideLoading()
    }
  },

  removeStepImage(e: any) {
    const idx = Number(e.currentTarget.dataset.idx)
    this.setData({ [`form.steps[${idx}].image`]: '' })
  },

  // ---------- 标签 ----------

  /** 根据 form.tags 重建 tagMap */
  rebuildTagMap(tags: string[]) {
    const map: Record<string, boolean> = {}
    tags.forEach((t) => {
      map[t] = true
    })
    this.setData({ tagMap: map })
  },

  onTagToggle(e: any) {
    const tag = e.currentTarget.dataset.tag as string
    const tags = this.data.form.tags.slice()
    const i = tags.indexOf(tag)
    if (i > -1) {
      tags.splice(i, 1)
    } else {
      tags.push(tag)
    }
    this.setData({ 'form.tags': tags })
    this.rebuildTagMap(tags)
  },

  // ---------- 提交 ----------

  async submit() {
    const { form, isEdit, recipeId, saving } = this.data
    if (saving) return

    const title = (form.title || '').trim()
    if (!title) {
      wx.showToast({ title: '请填写菜名', icon: 'none' })
      return
    }

    if (!form.categoryId) {
      wx.showToast({ title: '请选择分类', icon: 'none' })
      return
    }

    const ingredients = form.ingredients
      .map((it) => ({ name: (it.name || '').trim(), amount: (it.amount || '').trim(), unit: (it.unit || '').trim() }))
      .filter((it) => it.name)
    if (ingredients.length === 0) {
      wx.showToast({ title: '至少填写一种食材', icon: 'none' })
      return
    }

    const steps = form.steps
      .filter((s) => (s.text || '').trim())
      .map((s, i) => ({ order: i + 1, text: (s.text || '').trim(), image: s.image || '' }))
    if (steps.length === 0) {
      wx.showToast({ title: '至少填写一个步骤', icon: 'none' })
      return
    }

    const payload: RecipeFormData = {
      title,
      coverImage: form.coverImage || '',
      description: (form.description || '').trim(),
      categoryId: form.categoryId || '',
      difficulty: form.difficulty || 1,
      cookTime: form.cookTime || 0,
      servings: form.servings || 1,
      ingredients,
      steps,
      tips: (form.tips || '').trim(),
      tags: form.tags,
      isPublic: form.isPublic,
    }

    this.setData({ saving: true })
    try {
      if (isEdit && recipeId) {
        await recipeService.update(recipeId, payload)
        wx.showToast({ title: '保存成功', icon: 'success' })
      } else {
        await recipeService.create(payload)
        wx.showToast({ title: '发布成功', icon: 'success' })
      }
      setTimeout(() => wx.navigateBack(), 800)
    } catch (e) {
      console.warn('保存菜谱失败', e)
    } finally {
      this.setData({ saving: false })
    }
  },
})
