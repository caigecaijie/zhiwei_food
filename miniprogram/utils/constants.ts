/** 全局常量 */
export const DEFAULT_AVATAR =
  'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'

/** 难度标签，index 1-5 */
export const DIFFICULTY_LABELS = ['', '简单', '容易', '一般', '较难', '大师']

/** 口味标签 */
export const TASTE_TAGS = ['清淡', '微辣', '重辣', '酸甜', '咸鲜', '香辣', '蒜香', '酱香', '原味']

/** 场景/人群标签 */
export const SCENE_TAGS = ['早餐', '午餐', '晚餐', '夜宵', '便当', '宴客', '减脂', '儿童', '老人']

/** 常用食材（配菜页快捷选择） */
export const COMMON_INGREDIENTS = [
  '鸡蛋', '番茄', '土豆', '青椒', '洋葱', '猪肉', '鸡肉', '牛肉',
  '豆腐', '白菜', '萝卜', '蘑菇', '虾', '鱼', '米饭', '面条',
]

/** 常用食材单位 */
export const COMMON_UNITS = ['个', '只', '根', '片', '颗', '勺', '克', '毫升', '适量', '少许']

/** 订单状态文案 */
export const ORDER_STATUS_TEXT: Record<string, string> = {
  pending: '待确认',
  cooking: '制作中',
  done: '已完成',
  cancelled: '已取消',
}

/** 订单状态颜色 */
export const ORDER_STATUS_COLOR: Record<string, string> = {
  pending: '#FF9900',
  cooking: '#1E80FF',
  done: '#07C160',
  cancelled: '#999999',
}

/** 新用户默认分类 */
export const DEFAULT_CATEGORIES = [
  { name: '荤菜', icon: '🥩' },
  { name: '素菜', icon: '🥬' },
  { name: '鱼虾海鲜', icon: '🦐' },
  { name: '汤羹', icon: '🍲' },
  { name: '凉菜', icon: '🥗' },
  { name: '主食', icon: '🍚' },
  { name: '甜品', icon: '🍰' },
]
