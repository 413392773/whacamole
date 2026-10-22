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

let memoryFallback: GameConfig | null = null

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
  const avatarOk = isString(avatar) && avatar.startsWith('data:image/')
  // 存在 avatarDataUrl 但不是合法 data:image/ URL（如外部 http 链接）时整条丢弃，防止注入外链
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
  if (memoryFallback !== null) return memoryFallback
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
    memoryFallback = config
    return false
  }
}

export function compressImage(file: File, size = 200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('仅支持图片文件'))
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
