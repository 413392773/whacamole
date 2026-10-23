import { StrictMode } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Dispatch } from 'react'
import { TitleCeremony } from './TitleCeremony'
import { createInitialState } from '../core/gameReducer'
import { playSound } from '../hooks/useSound'
import type { Action, GameConfig, GameState } from '../core/types'

const CONFIG: GameConfig = { playerName: '测试侠', baseMoleCount: 2, profiles: [] }

function gameoverState(clearedLevels: number): GameState {
  return { ...createInitialState(CONFIG), screen: 'gameover', clearedLevels, totalScore: 320 }
}

vi.mock('../hooks/useSound', () => ({ playSound: vi.fn() }))

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

test('通过 0 关显示「初入江湖」与玩家昵称', () => {
  render(<TitleCeremony state={gameoverState(0)} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  expect(screen.getByText('初入江湖')).toBeInTheDocument()
  expect(screen.getByText(/测试侠/)).toBeInTheDocument()
  expect(screen.getByText(/总得分 320/)).toBeInTheDocument()
})

test('通过 4 关显示「一代宗师」', () => {
  render(<TitleCeremony state={gameoverState(4)} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  expect(screen.getByText('一代宗师')).toBeInTheDocument()
})

test('不出现「闯关失败」字样', () => {
  render(<TitleCeremony state={gameoverState(0)} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  expect(screen.queryByText(/闯关失败/)).not.toBeInTheDocument()
})

test('再来一局派发 RESTART', () => {
  const dispatch = vi.fn()
  render(<TitleCeremony state={gameoverState(2)} dispatch={dispatch as unknown as Dispatch<Action>} />)
  fireEvent.click(screen.getByRole('button', { name: '再来一局' }))
  expect(dispatch).toHaveBeenCalledWith({ type: 'RESTART' })
})

test('盖章音效延迟 300ms 播放且 StrictMode 下至多一次', () => {
  vi.useFakeTimers()
  render(
    <StrictMode>
      <TitleCeremony state={gameoverState(2)} dispatch={vi.fn() as unknown as Dispatch<Action>} />
    </StrictMode>,
  )
  expect(playSound).not.toHaveBeenCalled()
  vi.advanceTimersByTime(300)
  expect(playSound).toHaveBeenCalledTimes(1)
  expect(playSound).toHaveBeenCalledWith('stamp')
})
