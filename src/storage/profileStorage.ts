import {
  DEFAULT_BASE_MOLE_COUNT,
  DEFAULT_PLAYER_NAME,
  MAX_BASE_MOLE_COUNT,
  MAX_NAME_LENGTH,
  MAX_PLAYER_NAME_LENGTH,
  MAX_PROFILES,
  MIN_BASE_MOLE_COUNT,
} from '../config/levels'
import type { GameConfig, MoleProfile } from '../core/types'

const STORAGE_KEY = 'whacamole.config.v1'
// 光栅图片 dataURL 白名单（阻断 svg+xml 等可执行内容），compressImage 输出 200px JPEG 远小于长度上限
const AVATAR_DATA_URL_PATTERN = /^data:image\/(png|jpeg|webp|gif);base64,/i
export const MAX_AVATAR_DATA_URL_LENGTH = 200_000
export const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024

let memoryFallback: GameConfig | null = null

// 仅供测试重置模块级兜底状态，消除测试顺序依赖
export function __resetMemoryFallbackForTest(): void {
  memoryFallback = null
}

function cloneConfig(config: GameConfig): GameConfig {
  return {
    ...config,
    profiles: config.profiles.map((profile) => ({ ...profile })),
  }
}

export function defaultConfig(): GameConfig {
  return {
    playerName: DEFAULT_PLAYER_NAME,
    baseMoleCount: DEFAULT_BASE_MOLE_COUNT,
    profiles: [],
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function sanitizeProfile(raw: unknown): MoleProfile | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>
  if (!isString(record.id) || !isString(record.name)) return null
  const avatar = record.avatarDataUrl
  const hasAvatar = avatar !== undefined
  const avatarOk =
    isString(avatar) &&
    AVATAR_DATA_URL_PATTERN.test(avatar) &&
    avatar.length <= MAX_AVATAR_DATA_URL_LENGTH
  // 存在 avatarDataUrl 但不合法（外链 / 非白名单 MIME / 超长）时整条丢弃，防止注入与存储膨胀
  if (hasAvatar && !avatarOk) return null
  return {
    id: record.id,
    name: record.name.slice(0, MAX_NAME_LENGTH),
    ...(avatarOk ? { avatarDataUrl: avatar } : {}),
  }
}

export function sanitizeConfig(raw: unknown): GameConfig | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>
  if (!isString(record.playerName)) return null
  const base = record.baseMoleCount
  if (typeof base !== 'number' || Number.isNaN(base)) return null
  const profiles = Array.isArray(record.profiles) ? record.profiles : []
  const cleaned = profiles
    .map(sanitizeProfile)
    .filter((profile): profile is MoleProfile => profile !== null)
    .slice(0, MAX_PROFILES)
  return {
    playerName: record.playerName.trim().slice(0, MAX_PLAYER_NAME_LENGTH) || DEFAULT_PLAYER_NAME,
    baseMoleCount: Math.min(MAX_BASE_MOLE_COUNT, Math.max(MIN_BASE_MOLE_COUNT, Math.round(base))),
    profiles: cleaned,
  }
}

export function loadConfig(): GameConfig {
  if (memoryFallback !== null) {
    // 兜底数据由应用内 saveConfig 构造（非外部输入），绕过 sanitizeConfig 风险可接受；
    // 返回深拷贝，防止调用方 mutation 污染模块状态
    return cloneConfig(memoryFallback)
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return defaultConfig()
    return sanitizeConfig(JSON.parse(raw)) ?? defaultConfig()
  } catch {
    return defaultConfig()
  }
}

export function saveConfig(config: GameConfig): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    memoryFallback = null
    return true
  } catch {
    // 存入拷贝，杜绝调用方后续 mutation 篡改兜底状态
    memoryFallback = cloneConfig(config)
    return false
  }
}

export function compressImage(file: File, size = 200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('仅支持图片文件'))
      return
    }
    if (file.size > MAX_IMAGE_FILE_BYTES) {
      reject(new Error('图片文件超过大小上限'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (ctx === null) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas 不可用'))
        return
      }
      const side = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }
    img.src = url
  })
}
