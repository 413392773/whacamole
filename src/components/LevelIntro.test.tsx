import { render, screen, act } from '@testing-library/react'
import type { Dispatch } from 'react'
import { LevelIntro } from './LevelIntro'
import { createInitialState } from '../core/gameReducer'
import type { Action, GameConfig } from '../core/types'

const CONFIG: GameConfig = { playerName: '测试侠', baseMoleCount: 2, profiles: [] }

function introState(levelIndex: number, attemptsLeft: number) {
  return { ...createInitialState(CONFIG), screen: 'intro' as const, levelIndex, attemptsLeft }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

test('展示第 3 关名称、参数与剩余机会', () => {
  const dispatch = vi.fn()
  render(<LevelIntro state={introState(2, 2)} dispatch={dispatch as unknown as Dispatch<Action>} />)
  expect(screen.getByText('狂乱时刻')).toBeInTheDocument()
  expect(screen.getByText(/同屏地鼠 4 只/)).toBeInTheDocument()
  expect(screen.getByText(/命中率 ≥ 60%/)).toBeInTheDocument()
  expect(screen.getByText('❤️❤️🖤')).toBeInTheDocument()
})

test('3 秒倒计时后派发 BEGIN_LEVEL', () => {
  const dispatch = vi.fn()
  render(<LevelIntro state={introState(0, 3)} dispatch={dispatch as unknown as Dispatch<Action>} />)
  expect(screen.getByText('3')).toBeInTheDocument()
  act(() => { vi.advanceTimersByTime(1000) })
  expect(screen.getByText('2')).toBeInTheDocument()
  act(() => { vi.advanceTimersByTime(1000) })
  expect(screen.getByText('1')).toBeInTheDocument()
  act(() => { vi.advanceTimersByTime(1000) })
  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'BEGIN_LEVEL' }))
})
