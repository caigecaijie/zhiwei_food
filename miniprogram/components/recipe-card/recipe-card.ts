import { DIFFICULTY_LABELS } from '../../utils/constants'

Component({
  properties: {
    recipe: { type: Object, value: {} as Record<string, unknown> },
    showAdd: { type: Boolean, value: false },
  },

  data: {
    difficultyLabel: '',
  },

  observers: {
    recipe(recipe: { difficulty?: number }) {
      const level = recipe && recipe.difficulty ? recipe.difficulty : 0
      this.setData({ difficultyLabel: DIFFICULTY_LABELS[level] || '' })
    },
  },

  methods: {
    onTap() {
      this.triggerEvent('cardtap', { id: (this.data.recipe as { _id?: string })._id })
    },
    onAdd() {
      this.triggerEvent('add', { id: (this.data.recipe as { _id?: string })._id })
    },
  },
})
