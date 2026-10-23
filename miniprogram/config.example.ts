/**
 * 云开发环境配置
 *
 * 本地开发用：复制本文件为同目录下的 config.ts，填入你自己的云环境 ID。
 * config.ts 已在 .gitignore 中忽略，不会被提交到仓库。
 *
 * 获取方式：微信开发者工具 → 云开发 → 控制台左上角「环境 ID」
 */
export const CLOUD_ENV = ''

/** 云开发环境 ID（未配置时为空字符串） */
export function hasCloudEnv(): boolean {
  return !!CLOUD_ENV
}
