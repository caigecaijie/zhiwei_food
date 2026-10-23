import { recipeService } from '../../services/recipe'
import type { Category } from '../../types/recipe'

Page({
  data: {
    categories: [] as Category[],
    newName: '',
  },

  onLoad() {
    this.load()
  },

  async load() {
    try {
      const res = await recipeService.getCategories()
      this.setData({ categories: res.list })
    } catch (e) {
      console.error('加载分类失败', e)
    }
  },

  onNameInput(e: any) {
    this.setData({ newName: e.detail.value as string })
  },

  async onAdd() {
    const name = this.data.newName.trim()
    if (!name) {
      wx.showToast({ title: '请输入分类名', icon: 'none' })
      return
    }
    await recipeService.saveCategory({ name, sort: this.data.categories.length })
    this.setData({ newName: '' })
    this.load()
  },

  onRename(e: any) {
    const { id, name } = e.currentTarget.dataset as { id: string; name: string }
    wx.showModal({
      title: '修改分类名',
      editable: true,
      placeholderText: name,
      success: (res) => {
        if (res.confirm && res.content) {
          recipeService
            .saveCategory({ _id: id, name: res.content.trim() })
            .then(() => this.load())
        }
      },
    })
  },

  onDelete(e: any) {
    const { id, name } = e.currentTarget.dataset as { id: string; name: string }
    wx.showModal({
      title: '删除分类',
      content: `确定删除「${name}」吗？分类下的菜谱会保留，但会变为未分类。`,
      success: (res) => {
        if (res.confirm) {
          recipeService.deleteCategory(id).then(() => this.load())
        }
      },
    })
  },

  async onMove(e: any) {
    const { index, dir } = e.currentTarget.dataset as { index: number; dir: 'up' | 'down' }
    const list = [...this.data.categories]
    const target = dir === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= list.length) return
    const tmp = list[index]
    list[index] = list[target]
    list[target] = tmp
    try {
      await Promise.all(
        list.map((c, i) => recipeService.saveCategory({ _id: c._id, name: c.name, icon: c.icon, sort: i }))
      )
      this.load()
    } catch (err) {
      console.error('排序失败', err)
    }
  },
})
