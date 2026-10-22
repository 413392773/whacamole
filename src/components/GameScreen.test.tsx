import { render, screen, fireEvent } from '@testing-library/react'
import type { Dispatch } from 'react'
import { GameScreen } from './GameScreen'
import { createInitialState } from '../core/gameReducer'
import type { Action, GameConfig, GameState, Mole } from '../core/types'

const CONFIG: GameConfig = { playerName: '测试侠', baseMoleCount: 2, profiles: [] }

function playingState(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(CONFIG),
    screen: 'playing',
    levelStartAt: 0,
    ...overrides,
  }
}

function fakeMole(id: number, holeIndex: number, state: Mole['state'] = 'up'): Mole {
  return { id, holeIndex, profileId: 'builtin-0', state, spawnedAt: 0 }
}

vi.mock('../hooks/useGameLoop', () => ({ useGameLoop: vi.fn() }))
vi.mock('../hooks/useSound', () => ({ playSound: vi.fn() }))
vi.mock('../hooks/useHaptics', () => ({ buzz: vi.fn() }))

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
