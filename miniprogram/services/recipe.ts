import { callFunction } from '../utils/request'
import type { Category, Ingredient, MatchResult, Recipe, RecipeListResult, RecipeStep } from '../types/recipe'

/** 菜谱表单数据（新增/编辑） */
export interface RecipeFormData {
  title: string
  coverImage: string
  description: string
  categoryId: string
  difficulty: number
  cookTime: number
  servings: number
  ingredients: Ingredient[]
  steps: RecipeStep[]
  tips: string
  tags: string[]
  isPublic: boolean
}

export const recipeService = {
  getCategories(): Promise<{ list: Category[] }> {
    return callFunction('recipeCRUD', { action: 'getCategories' })
  },

  saveCategory(data: { _id?: string; name: string; icon?: string; sort?: number }): Promise<{ _id: string }> {
    return callFunction('recipeCRUD', { action: 'saveCategory', ...data })
  },

  deleteCategory(_id: string): Promise<{ ok: boolean }> {
    return callFunction('recipeCRUD', { action: 'deleteCategory', _id })
  },

  getList(params: {
    categoryId?: string
    keyword?: string
    filter?: 'all' | 'mine'
    page?: number
    pageSize?: number
  }): Promise<RecipeListResult> {
    return callFunction('recipeCRUD', { action: 'getRecipeList', ...params })
  },

  getDetail(_id: string): Promise<{ recipe: Recipe }> {
    return callFunction('recipeCRUD', { action: 'getRecipeDetail', _id })
  },

  create(data: RecipeFormData): Promise<{ _id: string }> {
    return callFunction('recipeCRUD', { action: 'createRecipe', ...data })
  },

  update(_id: string, data: Partial<RecipeFormData>): Promise<{ ok: boolean }> {
    return callFunction('recipeCRUD', { action: 'updateRecipe', _id, ...data })
  },

  remove(_id: string): Promise<{ ok: boolean }> {
    return callFunction('recipeCRUD', { action: 'deleteRecipe', _id })
  },

  /** 按食材匹配菜谱 */
  matchByIngredients(ingredients: string[]): Promise<{ list: MatchResult[] }> {
    return callFunction('matchRecipe', { action: 'matchByIngredients', ingredients })
  },
}
