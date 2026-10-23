import { render, screen, fireEvent } from '@testing-library/react'
import type { Dispatch } from 'react'
import type { Mock } from 'vitest'
import { DebugPanel } from './DebugPanel'
import { createInitialState } from '../core/gameReducer'
import type { Action, GameConfig, GameState, Mole } from '../core/types'

const CONFIG: GameConfig = { playerName: '测试侠', baseMoleCount: 2, profiles: [] }

const MOLE_UP: Mole = { id: 7, holeIndex: 0, profileId: 'builtin-0', state: 'up', spawnedAt: 0 }

// 模拟真实对局：useGameLoop 每 rAF 帧 dispatch TICK，reducer 返回新 moles 数组引用
const FRAME_MS = 16
const GOD_MODE_INTERVAL_MS = 200
const FRAMES = Math.ceil(GOD_MODE_INTERVAL_MS / FRAME_MS) + 2

function playingState(moles: Mole[]): GameState {
  return { ...createInitialState(CONFIG), screen: 'playing', moles }
}

function panel(moles: Mole[], dispatch: Mock) {
  return <DebugPanel state={playingState(moles)} dispatch={dispatch as unknown as Dispatch<Action>} />
}

/** 开启上帝模式后逐帧推进：每帧 advance 16ms 并用全新 moles 引用 rerender */
function runFrameLoop(dispatch: Mock, makeMoles: (frame: number) => Mole[]): void {
  const view = render(panel(makeMoles(0), dispatch))
  fireEvent.click(screen.getByRole('button', { name: '上帝:关' }))
  for (let frame = 1; frame <= FRAMES; frame++) {
    vi.advanceTimersByTime(FRAME_MS)
    view.rerender(panel(makeMoles(frame), dispatch))
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

test('上帝模式在逐帧重渲染（每帧新 moles 引用）下仍派发 WHACK', () => {
  vi.useFakeTimers()
  const dispatch = vi.fn()
  runFrameLoop(dispatch, () => [{ ...MOLE_UP }])
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'WHACK', moleId: MOLE_UP.id }),
  )
})

test('上帝模式 interval 回调读取最新 moles：后出现的目标也会被敲', () => {
  vi.useFakeTimers()
  const dispatch = vi.fn()
  // 前 5 帧场上无活跃地鼠，之后出现 id=9 的 up 地鼠
  runFrameLoop(dispatch, (frame) => (frame < 5 ? [] : [{ ...MOLE_UP, id: 9 }]))
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'WHACK', moleId: 9 }),
  )
})

test('上帝模式关闭后不再自动派发 WHACK', () => {
  vi.useFakeTimers()
  const dispatch = vi.fn()
  const view = render(panel([{ ...MOLE_UP }], dispatch))
  fireEvent.click(screen.getByRole('button', { name: '上帝:关' }))
  fireEvent.click(screen.getByRole('button', { name: '上帝:开' }))
  vi.advanceTimersByTime(FRAMES * FRAME_MS)
  view.rerender(panel([{ ...MOLE_UP }], dispatch))
  vi.advanceTimersByTime(FRAMES * FRAME_MS)
  expect(dispatch).not.toHaveBeenCalledWith(
    expect.objectContaining({ type: 'WHACK' }),
  )
})
