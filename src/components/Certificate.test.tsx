import { render, screen, fireEvent } from '@testing-library/react'
import type { Dispatch } from 'react'
import { Certificate, formatCertificateDate } from './Certificate'
import { createInitialState } from '../core/gameReducer'
import type { Action, GameConfig, GameState } from '../core/types'

const CONFIG: GameConfig = { playerName: '测试侠', baseMoleCount: 2, profiles: [] }

function clearState(levelAccuracies: number[]): GameState {
  return {
    ...createInitialState(CONFIG),
    screen: 'certificate',
    clearedLevels: 5,
    levelAccuracies,
    totalScore: 1500,
  }
}

vi.mock('../hooks/useSound', () => ({ playSound: vi.fn() }))

test('日期格式化为 YYYY年M月D日', () => {
  expect(formatCertificateDate(new Date(2026, 9, 22))).toBe('2026年10月22日')
})

test('满分通关显示玩家名、S 级与平均命中率', () => {
  render(<Certificate state={clearState([1, 1, 1, 1, 1])} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  expect(screen.getByText(/测试侠/)).toBeInTheDocument()
  expect(screen.getByText(/鼠神降临/)).toBeInTheDocument()
  expect(screen.getByText(/平均命中率 100%/)).toBeInTheDocument()
})

test('平均命中率 75% 评级 B', () => {
  render(<Certificate state={clearState([0.75, 0.75, 0.75, 0.75, 0.75])} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  expect(screen.getByText(/眼疾手快/)).toBeInTheDocument()
})

test('jsdom 无 canvas 2d 时优雅降级，仍渲染 DOM 文本且不崩溃', () => {
  expect(() =>
    render(<Certificate state={clearState([0.9, 0.9, 0.9, 0.9, 0.9])} dispatch={vi.fn() as unknown as Dispatch<Action>} />),
  ).not.toThrow()
})

test('再来一局派发 RESTART', () => {
  const dispatch = vi.fn()
  render(<Certificate state={clearState([1, 1, 1, 1, 1])} dispatch={dispatch as unknown as Dispatch<Action>} />)
  fireEvent.click(screen.getByRole('button', { name: '再来一局' }))
  expect(dispatch).toHaveBeenCalledWith({ type: 'RESTART' })
})
