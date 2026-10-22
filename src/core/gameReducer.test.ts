import { createGameReducer, createInitialState } from './gameReducer'
import { LEVELS, ATTEMPTS_PER_LEVEL } from '../config/levels'
import type { GameConfig, GameState } from './types'

const CONFIG: GameConfig = { playerName: '测试侠', baseMoleCount: 2, profiles: [] }
const reduce = createGameReducer(() => 0.5)

function playing(levelIndex = 0, now = 0, attemptsLeft = ATTEMPTS_PER_LEVEL): GameState {
  const intro = reduce(createInitialState(CONFIG), { type: 'START_GAME', config: CONFIG })
  const started = reduce({ ...intro, levelIndex, attemptsLeft }, { type: 'BEGIN_LEVEL', now })
  return started
}

function tickTo(state: GameState, from: number, to: number, step = 100): GameState {
  let s = state
  for (let t = from; t <= to; t += step) s = reduce(s, { type: 'TICK', now: t })
  return s
}

test('START_GAME 进入关卡引导页并重置进度', () => {
  const s = reduce(createInitialState(CONFIG), { type: 'START_GAME', config: CONFIG })
  expect(s.screen).toBe('intro')
  expect(s.levelIndex).toBe(0)
  expect(s.clearedLevels).toBe(0)
  expect(s.attemptsLeft).toBe(ATTEMPTS_PER_LEVEL)
})

test('BEGIN_LEVEL 进入战斗并初始化计时与统计', () => {
  const s = playing(0, 1000)
  expect(s.screen).toBe('playing')
  expect(s.levelStartAt).toBe(1000)
  expect(s.nextSpawnAt).toBe(1000)
  expect(s.stats.hits).toBe(0)
  expect(s.moles).toEqual([])
})

test('TICK 驱动冒头并累计 spawned', () => {
  const s = tickTo(playing(0, 0), 0, 2000)
  expect(s.stats.spawned).toBeGreaterThan(0)
  expect(s.moles.length).toBeGreaterThan(0)
})

test('WHACK 命中活跃地鼠：hits/combo/score 增加', () => {
  let s = tickTo(playing(0, 0), 0, 100)
  const mole = s.moles.find((m) => m.state === 'rising' || m.state === 'up')
  expect(mole).toBeDefined()
  s = reduce(s, { type: 'WHACK', moleId: mole!.id, now: 200 })
  expect(s.stats.hits).toBe(1)
  expect(s.combo).toBe(1)
  expect(s.stats.score).toBe(10)
  expect(s.moles.find((m) => m.id === mole!.id)?.state).toBe('hit')
})

test('WHACK 已解决的地鼠无效', () => {
  let s = tickTo(playing(0, 0), 0, 100)
  const mole = s.moles[0]
  s = reduce(s, { type: 'WHACK', moleId: mole.id, now: 200 })
  const again = reduce(s, { type: 'WHACK', moleId: mole.id, now: 210 })
  expect(again.stats.hits).toBe(1)
})

test('WHIFF 清空 combo，不影响分数', () => {
  let s = tickTo(playing(0, 0), 0, 100)
  const mole = s.moles[0]
  s = reduce(s, { type: 'WHACK', moleId: mole.id, now: 200 })
  s = reduce(s, { type: 'WHIFF' })
  expect(s.combo).toBe(0)
  expect(s.stats.score).toBe(10)
})

test('倒计时结束达标：进入结算页，clearedLevels+1，总分累计', () => {
  let s = playing(0, 0)
  // 构造确定性残局：预置 5 中/5 冒；nextSpawnAt 在护栏 deadline（durationMs-300）之前，
  // 终局 tick 正常再冒 1 只不敲（有 ≥300ms 反应窗口）→ 命中率 5/6 ≥ 30%
  s = {
    ...s,
    nextSpawnAt: LEVELS[0].durationMs - 500,
    stats: { ...s.stats, hits: 5, spawned: 5, score: 50 },
  }
  s = reduce(s, { type: 'TICK', now: LEVELS[0].durationMs })
  expect(s.screen).toBe('result')
  expect(s.lastLevelPassed).toBe(true)
  expect(s.clearedLevels).toBe(1)
  expect(s.totalScore).toBe(50)
  expect(s.levelAccuracies).toHaveLength(1)
  expect(s.levelAccuracies[0]).toBeCloseTo(5 / 6)
  // 钉住 finishLevel 漏计逻辑：终局未解决地鼠计入 misses，accuracy 精确为 hits/spawned
  expect(s.stats.misses).toBe(1)
  expect(s.stats.accuracy).toBe(5 / 6)
})

test('终局幽灵冒出护栏：deadline 内的 nextSpawnAt 不再冒出稀释命中率', () => {
  let s = playing(0, 0)
  // nextSpawnAt=durationMs-50 晚于护栏 deadline（durationMs-MIN_REACTION_MS）→ 被拦截：
  // 该地鼠若冒出玩家零反应时间必漏，不应计入 spawned/misses
  s = {
    ...s,
    nextSpawnAt: LEVELS[0].durationMs - 50,
    stats: { ...s.stats, hits: 5, spawned: 5, score: 50 },
  }
  s = reduce(s, { type: 'TICK', now: LEVELS[0].durationMs })
  expect(s.screen).toBe('result')
  expect(s.lastLevelPassed).toBe(true)
  expect(s.stats.spawned).toBe(5)
  expect(s.stats.misses).toBe(0)
  expect(s.stats.accuracy).toBe(1)
})

test('倒计时结束未达标且有剩余机会：结算页可重试，机会−1', () => {
  let s = playing(0, 0)
  // nextSpawnAt 推到关卡结束之后 → 全程无冒出，命中率 0 必然未达标
  s = { ...s, nextSpawnAt: LEVELS[0].durationMs + 1000 }
  s = reduce(s, { type: 'TICK', now: LEVELS[0].durationMs })
  expect(s.screen).toBe('result')
  expect(s.lastLevelPassed).toBe(false)
  expect(s.attemptsLeft).toBe(ATTEMPTS_PER_LEVEL - 1)
  const retried = reduce(s, { type: 'RETRY_LEVEL' })
  expect(retried.screen).toBe('intro')
})

test('第 3 次失败：直接进入授衔页，称号按通过关卡数', () => {
  let s = playing(0, 0, 1)
  s = { ...s, nextSpawnAt: LEVELS[0].durationMs + 1000 }
  s = reduce(s, { type: 'TICK', now: LEVELS[0].durationMs })
  expect(s.screen).toBe('gameover')
  expect(s.attemptsLeft).toBe(0)
  expect(s.clearedLevels).toBe(0)
})

test('NEXT_LEVEL：非末关进入下一关引导并重置机会；末关进入证书页', () => {
  let s = playing(0, 0)
  s = {
    ...s,
    nextSpawnAt: LEVELS[0].durationMs - 50,
    stats: { ...s.stats, hits: 5, spawned: 5, score: 50 },
  }
  s = reduce(s, { type: 'TICK', now: LEVELS[0].durationMs })
  const next = reduce(s, { type: 'NEXT_LEVEL' })
  expect(next.screen).toBe('intro')
  expect(next.levelIndex).toBe(1)
  expect(next.attemptsLeft).toBe(ATTEMPTS_PER_LEVEL)

  const lastResult: GameState = { ...s, levelIndex: 4, clearedLevels: 4, screen: 'result', lastLevelPassed: true }
  const cert = reduce(lastResult, { type: 'NEXT_LEVEL' })
  expect(cert.screen).toBe('certificate')
})

test('NEXT_LEVEL 在失败结算页无效', () => {
  let s = playing(0, 0)
  s = { ...s, nextSpawnAt: LEVELS[0].durationMs + 1000 }
  s = reduce(s, { type: 'TICK', now: LEVELS[0].durationMs })
  expect(s.lastLevelPassed).toBe(false)
  expect(reduce(s, { type: 'NEXT_LEVEL' }).screen).toBe('result')
})

test('RESTART 回到设置页并保留配置', () => {
  const s = reduce(playing(2, 0), { type: 'RESTART' })
  expect(s.screen).toBe('setup')
  expect(s.config).toEqual(CONFIG)
  expect(s.levelIndex).toBe(0)
  expect(s.clearedLevels).toBe(0)
})

test('非 playing 状态下 TICK/WHACK 被忽略', () => {
  const intro = reduce(createInitialState(CONFIG), { type: 'START_GAME', config: CONFIG })
  expect(reduce(intro, { type: 'TICK', now: 99999 })).toBe(intro)
  expect(reduce(intro, { type: 'WHACK', moleId: 1, now: 1 })).toBe(intro)
})
