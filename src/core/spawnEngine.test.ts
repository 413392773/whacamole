import { tickSpawns, emptySnapshot, RISE_DURATION_MS, RESOLVE_DELAY_MS } from './spawnEngine'
import type { SpawnSnapshot } from './spawnEngine'
import type { LevelConfig, MoleProfile } from './types'

const LEVEL: LevelConfig = {
  level: 1, title: 'T', multiplier: 1, durationMs: 30_000,
  stayMs: 1000, spawnIntervalMs: 500, accuracyTarget: 0.5,
}
const PROFILES: MoleProfile[] = [
  { id: 'p1', name: '阿鼠', emoji: '🐹' },
  { id: 'p2', name: '阿猫', emoji: '😈' },
]
const random = () => 0.5

function tick(snapshot: SpawnSnapshot, now: number, maxSimultaneous = 2): SpawnSnapshot {
  return tickSpawns(snapshot, now, LEVEL, maxSimultaneous, 12, PROFILES, random)
}

test('到达冒出间隔时冒出一只地鼠，占用空洞并计入 spawned', () => {
  const s0 = tick(emptySnapshot(0), 0)
  expect(s0.moles).toHaveLength(1)
  expect(s0.moles[0].state).toBe('rising')
  expect(s0.spawned).toBe(1)
  expect(s0.nextSpawnAt).toBe(500)
})

test('rising 超过 150ms 变为 up', () => {
  const s0 = tick(emptySnapshot(0), 0)
  const s1 = tick(s0, RISE_DURATION_MS + 1)
  const mole = s1.moles.find((m) => m.id === s0.moles[0].id)
  expect(mole?.state).toBe('up')
})

test('同屏数量达到上限时不再冒出新地鼠，但时间继续推进', () => {
  let s = emptySnapshot(0)
  for (let t = 0; t <= 5000; t += 100) s = tick(s, t, 2)
  const active = s.moles.filter((m) => m.state === 'rising' || m.state === 'up')
  expect(active.length).toBeLessThanOrEqual(2)
  expect(s.spawned).toBeGreaterThan(2)
})

test('停留超时自动 escaped 并计入 misses', () => {
  const s0 = tick(emptySnapshot(0), 0)
  const s1 = tick(s0, LEVEL.stayMs + 1)
  const escaped = s1.moles.find((m) => m.id === s0.moles[0].id)
  expect(escaped?.state).toBe('escaped')
  expect(s1.misses).toBe(1)
})

test('已解决的地鼠在动画延迟后从数组移除', () => {
  const s0 = tick(emptySnapshot(0), 0)
  const s1 = tick(s0, LEVEL.stayMs + 1)
  const s2 = tick(s1, LEVEL.stayMs + 1 + RESOLVE_DELAY_MS + 1)
  expect(s2.moles.find((m) => m.id === s0.moles[0].id)).toBeUndefined()
})

test('随机函数决定洞位与档案，可复现', () => {
  const a = tick(emptySnapshot(0), 0)
  const b = tick(emptySnapshot(0), 0)
  expect(a.moles[0].holeIndex).toBe(b.moles[0].holeIndex)
  expect(a.moles[0].profileId).toBe(b.moles[0].profileId)
  expect(a.moles[0].holeIndex).toBeGreaterThanOrEqual(0)
  expect(a.moles[0].holeIndex).toBeLessThan(12)
})

test('单 tick 时间跨度大时补冒出有上限，不会死循环', () => {
  const s = tick(emptySnapshot(0), 60_000, 2)
  expect(s.moles.length).toBeLessThanOrEqual(12)
  expect(s.spawned).toBeLessThanOrEqual(2)
  expect(s.nextSpawnAt).toBeGreaterThan(60_000)
})

test('触顶丢弃积压后，后续 tick 不再补冒洪水', () => {
  const s = tick(emptySnapshot(0), 60_000, 2)
  expect(s.nextSpawnAt).toBe(60_000 + LEVEL.spawnIntervalMs)
  const s2 = tick(s, 60_100, 2)
  expect(s2.spawned).toBe(s.spawned)
  expect(s2.moles).toHaveLength(s.moles.length)
})

test('elapsed 恰好等于 RISE_DURATION_MS 时转为 up', () => {
  const s0 = tick(emptySnapshot(0), 0)
  const s1 = tick(s0, RISE_DURATION_MS)
  expect(s1.moles.find((m) => m.id === s0.moles[0].id)?.state).toBe('up')
})

test('elapsed 恰好等于 stayMs 时转为 escaped 并计入 misses', () => {
  const s0 = tick(emptySnapshot(0), 0)
  const s1 = tick(s0, LEVEL.stayMs)
  expect(s1.moles.find((m) => m.id === s0.moles[0].id)?.state).toBe('escaped')
  expect(s1.misses).toBe(1)
})

test('now - resolvedAt 恰好等于 RESOLVE_DELAY_MS 时被移除', () => {
  const s0 = tick(emptySnapshot(0), 0)
  const s1 = tick(s0, LEVEL.stayMs)
  const s2 = tick(s1, LEVEL.stayMs + RESOLVE_DELAY_MS)
  expect(s2.moles.find((m) => m.id === s0.moles[0].id)).toBeUndefined()
})

test('profiles 为空时不冒头也不崩溃', () => {
  const s = tickSpawns(emptySnapshot(0), 0, LEVEL, 2, 12, [], random)
  expect(s.moles).toHaveLength(0)
  expect(s.spawned).toBe(0)
  expect(s.nextSpawnAt).toBe(500)
})

test('random 返回 1 时索引 clamp 不越界', () => {
  const s = tickSpawns(emptySnapshot(0), 0, LEVEL, 2, 12, PROFILES, () => 1)
  expect(s.moles).toHaveLength(1)
  expect(s.moles[0].holeIndex).toBe(11)
  expect(s.moles[0].profileId).toBe('p2')
})
