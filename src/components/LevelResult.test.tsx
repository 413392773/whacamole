import { render, screen, fireEvent } from '@testing-library/react'
import type { Dispatch } from 'react'
import { LevelResult } from './LevelResult'
import { createInitialState } from '../core/gameReducer'
import { playSound } from '../hooks/useSound'
import type { Action, GameConfig, GameState, LevelStats } from '../core/types'

const CONFIG: GameConfig = { playerName: '测试侠', baseMoleCount: 2, profiles: [] }
const STATS: LevelStats = { hits: 8, spawned: 10, misses: 2, score: 80, maxCombo: 5, accuracy: 0.8 }

function resultState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(CONFIG),
    screen: 'result',
    stats: STATS,
    ...overrides,
  }
}

vi.mock('../hooks/useSound', () => ({ playSound: vi.fn() }))

beforeEach(() => vi.clearAllMocks())

test('达标：显示庆祝与下一关按钮，点击派发 NEXT_LEVEL', () => {
  const dispatch = vi.fn()
  render(<LevelResult state={resultState({ lastLevelPassed: true })} dispatch={dispatch as unknown as Dispatch<Action>} />)
  expect(screen.getByText('🎉 过关！')).toBeInTheDocument()
  expect(screen.getByText(/命中率 80%/)).toBeInTheDocument()
  expect(screen.getByText(/最高 Combo ×5/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '下一关' }))
  expect(dispatch).toHaveBeenCalledWith({ type: 'NEXT_LEVEL' })
})

test('未达标且有剩余机会：显示差距与重试按钮，点击派发 RETRY_LEVEL', () => {
  const dispatch = vi.fn()
  const stats: LevelStats = { ...STATS, hits: 4, accuracy: 0.4 }
  // levelIndex=2（狂乱时刻，达标线 60%）：命中率 40% → 还差 20%
  render(
    <LevelResult
      state={resultState({ lastLevelPassed: false, stats, attemptsLeft: 2, levelIndex: 2 })}
      dispatch={dispatch as unknown as Dispatch<Action>}
    />,
  )
  expect(screen.getByText(/还差 20%/)).toBeInTheDocument()
  // 实现为「剩余机会 ❤️❤️🖤」整段文本，用子串匹配钉住心形渲染
  expect(screen.getByText(/❤️❤️🖤/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '重试本关' }))
  expect(dispatch).toHaveBeenCalledWith({ type: 'RETRY_LEVEL' })
})

test('未达标不出现「闯关失败」字样', () => {
  render(<LevelResult state={resultState({ lastLevelPassed: false, attemptsLeft: 2 })} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  expect(screen.queryByText(/闯关失败/)).not.toBeInTheDocument()
})

test('第 5 关命中 7/10：浮点差 (0.8-0.7) 精确显示还差 10%', () => {
  const stats: LevelStats = { ...STATS, hits: 7, accuracy: 0.7 }
  render(
    <LevelResult
      state={resultState({ lastLevelPassed: false, stats, attemptsLeft: 2, levelIndex: 4 })}
      dispatch={vi.fn() as unknown as Dispatch<Action>}
    />,
  )
  expect(screen.getByText(/还差 10%/)).toBeInTheDocument()
})

test('极小差距（0.795 vs 达标线 0.8）至少显示还差 1%', () => {
  const stats: LevelStats = { ...STATS, accuracy: 0.795 }
  render(
    <LevelResult
      state={resultState({ lastLevelPassed: false, stats, attemptsLeft: 2, levelIndex: 4 })}
      dispatch={vi.fn() as unknown as Dispatch<Action>}
    />,
  )
  expect(screen.getByText(/还差 1%/)).toBeInTheDocument()
})

test('达标渲染播放 pass 音效恰一次', () => {
  render(<LevelResult state={resultState({ lastLevelPassed: true })} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  expect(playSound).toHaveBeenCalledTimes(1)
  expect(playSound).toHaveBeenCalledWith('pass')
})

test('未达标渲染播放 fail 音效恰一次', () => {
  render(<LevelResult state={resultState({ lastLevelPassed: false, attemptsLeft: 2 })} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  expect(playSound).toHaveBeenCalledTimes(1)
  expect(playSound).toHaveBeenCalledWith('fail')
})
