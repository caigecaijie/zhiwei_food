export interface Ingredient {
  name: string
  amount: string
  unit: string
}

export interface RecipeStep {
  order: number
  text: string
  image?: string
}

export interface Recipe {
  _id: string
  _openid?: string
  title: string
  coverImage: string
  description: string
  categoryId: string
  categoryName?: string
  difficulty: number
  cookTime: number
  servings: number
  ingredients: Ingredient[]
  steps: RecipeStep[]
  tips: string
  tags: string[]
  isPublic: boolean
  viewCount?: number
  likeCount?: number
  favoriteCount?: number
  createdAt?: string
  updatedAt?: string
  author?: {
    nickName: string
    avatarUrl: string
  }
}

export interface Category {
  _id: string
  name: string
  icon: string
  sort: number
  recipeCount: number
}

export interface RecipeListResult {
  list: Recipe[]
  total: number
}

export interface MatchResult {
  recipe: Recipe
  matchCount: number
  totalCount: number
  missing: string[]
}
