import {
  loadConfig,
  saveConfig,
  sanitizeConfig,
  defaultConfig,
  compressImage,
  __resetMemoryFallbackForTest,
  MAX_AVATAR_DATA_URL_LENGTH,
  MAX_IMAGE_FILE_BYTES,
} from './profileStorage'
import type { GameConfig } from '../core/types'

const CONFIG: GameConfig = {
  playerName: '张三',
  baseMoleCount: 3,
  profiles: [{ id: 'p1', name: '阿鼠', avatarDataUrl: 'data:image/jpeg;base64,AAA' }],
}

beforeEach(() => {
  localStorage.clear()
  __resetMemoryFallbackForTest()
})

test('save 后 load 还原配置', () => {
  expect(saveConfig(CONFIG)).toBe(true)
  expect(loadConfig()).toEqual(CONFIG)
})

test('无存档时返回默认配置', () => {
  expect(loadConfig()).toEqual(defaultConfig())
})

test('sanitizeConfig 过滤脏数据并夹紧数值', () => {
  expect(sanitizeConfig(null)).toBeNull()
  expect(sanitizeConfig({ playerName: 123 })).toBeNull()
  const fixed = sanitizeConfig({
    playerName: '  超长名字的玩家昵称  ',
    baseMoleCount: 99,
    profiles: [
      { id: 'ok', name: '合法' },
      { name: '缺 id' },
      { id: 'x', name: '超长名字超长了', avatarDataUrl: 'http://evil.com/a.png' },
    ],
  })
  expect(fixed).not.toBeNull()
  expect(fixed!.playerName.length).toBeLessThanOrEqual(12)
  expect(fixed!.baseMoleCount).toBe(4)
  expect(fixed!.profiles).toHaveLength(1)
  expect(fixed!.profiles[0].id).toBe('ok')
})

test('avatarDataUrl 白名单：svg+xml 整条过滤，合法 jpeg base64 保留', () => {
  const fixed = sanitizeConfig({
    playerName: '玩家',
    baseMoleCount: 2,
    profiles: [
      { id: 'svg', name: '矢量', avatarDataUrl: 'data:image/svg+xml;base64,PHN2Zz4=' },
      { id: 'jpg', name: '合法', avatarDataUrl: 'data:image/jpeg;base64,AAAA' },
    ],
  })
  expect(fixed).not.toBeNull()
  expect(fixed!.profiles).toHaveLength(1)
  expect(fixed!.profiles[0].id).toBe('jpg')
})

test('avatarDataUrl 超过长度上限整条过滤', () => {
  const oversized = `data:image/png;base64,${'A'.repeat(MAX_AVATAR_DATA_URL_LENGTH)}`
  const fixed = sanitizeConfig({
    playerName: '玩家',
    baseMoleCount: 2,
    profiles: [{ id: 'big', name: '超大', avatarDataUrl: oversized }],
  })
  expect(fixed!.profiles).toHaveLength(0)
})

test('存档损坏时回退默认配置', () => {
  localStorage.setItem('whacamole.config.v1', '{broken json')
  expect(loadConfig()).toEqual(defaultConfig())
})

test('localStorage 写入异常时 save 返回 false 且 load 走内存兜底', () => {
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceeded')
  })
  expect(saveConfig(CONFIG)).toBe(false)
  expect(loadConfig()).toEqual(CONFIG)
  spy.mockRestore()
})

test('内存兜底数据不被调用方 mutation 篡改（存入与返回均为拷贝）', () => {
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceeded')
  })
  const original: GameConfig = {
    playerName: '原名',
    baseMoleCount: 2,
    profiles: [{ id: 'p', name: '档案' }],
  }
  expect(saveConfig(original)).toBe(false)
  // 篡改调用方持有的对象，不应影响模块内兜底状态
  original.playerName = '篡改'
  original.profiles[0].name = '篡改档案'
  expect(loadConfig()).toEqual({
    playerName: '原名',
    baseMoleCount: 2,
    profiles: [{ id: 'p', name: '档案' }],
  })
  // 篡改 loadConfig 的返回值，也不应影响后续读取
  const loaded = loadConfig()
  loaded.playerName = '再篡改'
  loaded.profiles[0].id = '再篡改id'
  expect(loadConfig()).toEqual({
    playerName: '原名',
    baseMoleCount: 2,
    profiles: [{ id: 'p', name: '档案' }],
  })
  spy.mockRestore()
})

test('compressImage 对非图片文件 reject（jsdom 下可测的失败路径）', async () => {
  const textFile = new File(['hello'], 'note.txt', { type: 'text/plain' })
  await expect(compressImage(textFile)).rejects.toThrow('仅支持图片文件')
})

test('compressImage 拒绝超过大小上限的文件', async () => {
  // 用类型断言桩构造超大 size，避免真实占用内存
  const hugeFile = { type: 'image/png', size: MAX_IMAGE_FILE_BYTES + 1 } as File
  await expect(compressImage(hugeFile)).rejects.toThrow('图片文件超过大小上限')
})
