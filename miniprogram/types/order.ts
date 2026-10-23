export interface CartItem {
  _id: string
  recipeId: string
  recipeTitle: string
  recipeCover: string
  quantity: number
  remark: string
  partyId: string
  addedBy: string
  addedByName?: string
}

export interface OrderItem {
  recipeId: string
  title: string
  cover: string
  quantity: number
  remark: string
  addedBy: string
  addedByName?: string
}

export type OrderStatus = 'pending' | 'cooking' | 'done' | 'cancelled'

export interface Order {
  _id: string
  orderNo: string
  _openid?: string
  partyId: string
  items: OrderItem[]
  totalCount: number
  status: OrderStatus
  remark: string
  participants: string[]
  createdAt?: string
  updatedAt?: string
}

export interface PartyParticipant {
  openid: string
  nickName: string
  avatarUrl: string
  joinedAt?: string
}

export type PartyStatus = 'active' | 'ordered' | 'closed'

export interface Party {
  _id: string
  partyNo: string
  _openid?: string
  title: string
  inviteCode?: string
  participants: PartyParticipant[]
  status: PartyStatus
  createdAt?: string
}
