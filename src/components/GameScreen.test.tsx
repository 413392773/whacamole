import { render, screen, fireEvent } from '@testing-library/react'
import type { Dispatch } from 'react'
import { GameScreen } from './GameScreen'
import { createInitialState } from '../core/gameReducer'
import { playSound } from '../hooks/useSound'
import { buzz } from '../hooks/useHaptics'
import type { Action, GameConfig, GameState, LevelStats, Mole } from '../core/types'

const CONFIG: GameConfig = { playerName: '测试侠', baseMoleCount: 2, profiles: [] }

function playingState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(CONFIG),
    screen: 'playing',
    levelStartAt: 0,
    ...overrides,
  }
}

function statsWith(overrides: Partial<LevelStats> = {}): LevelStats {
  return { hits: 0, spawned: 0, misses: 0, score: 0, maxCombo: 0, accuracy: 0, ...overrides }
}

function fakeMole(id: number, holeIndex: number, state: Mole['state'] = 'up'): Mole {
  return { id, holeIndex, profileId: 'builtin-0', state, spawnedAt: 0 }
}

vi.mock('../hooks/useGameLoop', () => ({ useGameLoop: vi.fn() }))
vi.mock('../hooks/useSound', () => ({ playSound: vi.fn() }))
vi.mock('../hooks/useHaptics', () => ({ buzz: vi.fn() }))

beforeEach(() => vi.clearAllMocks())

test('渲染 12 个洞口与 HUD 信息', () => {
  const dispatch = vi.fn()
  render(<GameScreen state={playingState({ moles: [fakeMole(1, 3)] })} dispatch={dispatch as unknown as Dispatch<Action>} />)
  expect(screen.getAllByTestId(/^hole-/)).toHaveLength(12)
  expect(screen.getByText('得分 0')).toBeInTheDocument()
  expect(screen.getByText('❤️❤️❤️')).toBeInTheDocument()
})

test('点击活跃地鼠派发 WHACK', () => {
  const dispatch = vi.fn()
  render(<GameScreen state={playingState({ moles: [fakeMole(7, 3)] })} dispatch={dispatch as unknown as Dispatch<Action>} />)
  fireEvent.pointerDown(screen.getByTestId('hole-3'))
  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'WHACK', moleId: 7 }))
})

test('点击空洞派发 WHIFF', () => {
  const dispatch = vi.fn()
  render(<GameScreen state={playingState({ moles: [] })} dispatch={dispatch as unknown as Dispatch<Action>} />)
  fireEvent.pointerDown(screen.getByTestId('hole-5'))
  expect(dispatch).toHaveBeenCalledWith({ type: 'WHIFF' })
})

test('显示地鼠名字牌与内置 emoji 头像', () => {
  const config: GameConfig = { ...CONFIG, profiles: [{ id: 'p1', name: '阿鼠', avatarDataUrl: 'data:image/jpeg;base64,AAA' }] }
  const mole: Mole = { ...fakeMole(1, 0), profileId: 'p1' }
  render(<GameScreen state={playingState({ config, moles: [mole] })} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  expect(screen.getByText('阿鼠')).toBeInTheDocument()
  expect(screen.getByAltText('阿鼠')).toBeInTheDocument()
})

test('combo≥3 显示连击飘字', () => {
  render(<GameScreen state={playingState({ combo: 4, moles: [] })} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  expect(screen.getByText('Combo ×4')).toBeInTheDocument()
})

test('hits 增量触发 whack 音效与震动恰一次，hits 不变不重复触发', () => {
  const dispatch = vi.fn() as unknown as Dispatch<Action>
  const before = playingState({ combo: 3, stats: statsWith({ hits: 3, spawned: 5, score: 30 }) })
  const { rerender } = render(<GameScreen state={before} dispatch={dispatch} />)
  // 挂载时 prevHits 已初始化为当前 hits，不应触发
  expect(playSound).not.toHaveBeenCalled()
  expect(buzz).not.toHaveBeenCalled()

  const after = playingState({ combo: 4, stats: statsWith({ hits: 4, spawned: 5, score: 45, maxCombo: 4 }) })
  rerender(<GameScreen state={after} dispatch={dispatch} />)
  expect(playSound).toHaveBeenCalledTimes(1)
  expect(playSound).toHaveBeenCalledWith('whack', 4)
  expect(buzz).toHaveBeenCalledTimes(1)
  expect(buzz).toHaveBeenCalledWith(30)

  // hits 不变（WHIFF 清零 combo 触发 effect 重跑）也不重复播放
  const whiffed = playingState({ combo: 0, stats: statsWith({ hits: 4, spawned: 5, score: 45, maxCombo: 4 }) })
  rerender(<GameScreen state={whiffed} dispatch={dispatch} />)
  expect(playSound).toHaveBeenCalledTimes(1)
  expect(buzz).toHaveBeenCalledTimes(1)
})

test('misses 增量触发 escape 音效恰一次，misses 不变不重复触发', () => {
  const dispatch = vi.fn() as unknown as Dispatch<Action>
  const before = playingState({ stats: statsWith({ misses: 1, spawned: 3 }) })
  const { rerender } = render(<GameScreen state={before} dispatch={dispatch} />)
  expect(playSound).not.toHaveBeenCalled()

  const after = playingState({ stats: statsWith({ misses: 2, spawned: 4 }) })
  rerender(<GameScreen state={after} dispatch={dispatch} />)
  expect(playSound).toHaveBeenCalledTimes(1)
  expect(playSound).toHaveBeenCalledWith('escape')

  // misses 不变（hits 变化的其他状态更新）不重复播放 escape
  const sameMisses = playingState({ combo: 1, stats: statsWith({ hits: 1, misses: 2, spawned: 4, score: 10 }) })
  rerender(<GameScreen state={sameMisses} dispatch={dispatch} />)
  expect(playSound).toHaveBeenCalledWith('escape')
  expect(playSound).toHaveBeenCalledTimes(2) // 仅新增 whack，escape 仍为 1 次
  expect(playSound).toHaveBeenNthCalledWith(2, 'whack', 1)
})
