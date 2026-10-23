/** 云函数统一返回结构 */
interface CloudResult<T> {
  code: number
  data: T
  msg: string
}

/**
 * 调用云函数的统一封装
 * 云函数返回 { code, data, msg }，code !== 0 时 toast 错误并抛异常
 */
export async function callFunction<T>(
  name: string,
  data: Record<string, unknown> = {}
): Promise<T> {
  let result: CloudResult<T>
  try {
    const res = await wx.cloud.callFunction({ name, data })
    result = res.result as CloudResult<T>
  } catch (err) {
    console.error(`[cloud] ${name} 调用失败`, err)
    wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' })
    throw err
  }
  if (result.code !== 0) {
    const msg = result.msg || '请求失败'
    wx.showToast({ title: msg, icon: 'none' })
    throw new Error(msg)
  }
  return result.data
}

/** 上传图片到云存储，返回 fileID */
export function uploadImage(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const app = getApp<IAppOption>()
    const cloudPath = `uploads/${app.globalData.openid || 'anon'}/${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}.jpg`
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res) => resolve(res.fileID),
      fail: (err) => {
        wx.showToast({ title: '图片上传失败', icon: 'none' })
        reject(err)
      },
    })
  })
}

/** 选择图片，返回临时路径列表（取消选择时返回空数组） */
export function chooseImage(count = 1): Promise<string[]> {
  return new Promise((resolve, reject) => {
    wx.chooseMedia({
      count,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: (res) => resolve(res.tempFiles.map((f) => f.tempFilePath)),
      fail: (err) => {
        // 用户取消选择不算错误
        if (err && err.errMsg && err.errMsg.indexOf('cancel') >= 0) {
          resolve([])
        } else {
          reject(err)
        }
      },
    })
  })
}
