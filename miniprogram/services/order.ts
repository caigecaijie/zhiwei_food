import { callFunction } from '../utils/request'
import type { CartItem, Order, OrderStatus, Party } from '../types/order'
import type { Recipe } from '../types/recipe'

export const orderService = {
  addToCart(data: { recipeId: string; quantity: number; remark?: string; partyId?: string }): Promise<{ cartId: string }> {
    return callFunction('orderManage', { action: 'addToCart', ...data })
  },

  updateCart(data: { cartId: string; quantity?: number; remark?: string }): Promise<{ ok: boolean }> {
    return callFunction('orderManage', { action: 'updateCart', ...data })
  },

  removeFromCart(cartId: string): Promise<{ ok: boolean }> {
    return callFunction('orderManage', { action: 'removeFromCart', cartId })
  },

  getCartList(partyId?: string): Promise<{ list: CartItem[]; totalCount: number }> {
    return callFunction('orderManage', { action: 'getCartList', partyId: partyId || '' })
  },

  createOrder(data: { partyId?: string; remark?: string; onlyMine?: boolean }): Promise<{ orderId: string; orderNo: string }> {
    return callFunction('orderManage', { action: 'createOrder', ...data })
  },

  getOrderList(params: { status?: string; page?: number; pageSize?: number; partyId?: string }): Promise<{ list: Order[]; total: number }> {
    return callFunction('orderManage', { action: 'getOrderList', ...params })
  },

  getOrderDetail(orderId: string): Promise<{ order: Order }> {
    return callFunction('orderManage', { action: 'getOrderDetail', orderId })
  },

  updateOrderStatus(orderId: string, status: OrderStatus): Promise<{ ok: boolean }> {
    return callFunction('orderManage', { action: 'updateOrderStatus', orderId, status })
  },

  createParty(title: string): Promise<{ party: Party }> {
    return callFunction('orderManage', { action: 'createParty', title })
  },

  enterParty(partyId: string): Promise<{ party: Party }> {
    return callFunction('orderManage', { action: 'enterParty', partyId })
  },

  getPartyDetail(partyId: string): Promise<{ party: Party; cartItems: CartItem[]; hostRecipes: Recipe[] }> {
    return callFunction('orderManage', { action: 'getPartyDetail', partyId })
  },

  getMyParties(): Promise<{ list: Party[] }> {
    return callFunction('orderManage', { action: 'getMyParties' })
  },

  closeParty(partyId: string): Promise<{ ok: boolean }> {
    return callFunction('orderManage', { action: 'closeParty', partyId })
  },
}
