import { loadConfig, saveConfig, sanitizeConfig, defaultConfig, compressImage } from './profileStorage'
import type { GameConfig } from '../core/types'

const CONFIG: GameConfig = {
  playerName: '张三',
  baseMoleCount: 3,
  profiles: [{ id: 'p1', name: '阿鼠', avatarDataUrl: 'data:image/jpeg;base64,AAA' }],
}

beforeEach(() => localStorage.clear())

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

test('compressImage 对非图片文件 reject（jsdom 下可测的失败路径）', async () => {
  const textFile = new File(['hello'], 'note.txt', { type: 'text/plain' })
  await expect(compressImage(textFile)).rejects.toThrow('仅支持图片文件')
})
