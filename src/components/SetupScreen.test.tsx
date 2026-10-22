import { render, screen, fireEvent } from '@testing-library/react'
import type { Dispatch } from 'react'
import userEvent from '@testing-library/user-event'
import { SetupScreen } from './SetupScreen'
import { defaultConfig } from '../storage/profileStorage'
import { MAX_BASE_MOLE_COUNT } from '../config/levels'
import type { Action, GameConfig } from '../core/types'

function setup(config: GameConfig = defaultConfig()) {
  const dispatch = vi.fn()
  render(<SetupScreen initialConfig={config} dispatch={dispatch as unknown as Dispatch<Action>} />)
  return dispatch
}

test('修改昵称后开始游戏，START_GAME 携带新昵称', async () => {
  const dispatch = setup()
  await userEvent.clear(screen.getByLabelText('你的昵称'))
  await userEvent.type(screen.getByLabelText('你的昵称'), '李四')
  await userEvent.click(screen.getByRole('button', { name: '开始游戏' }))
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'START_GAME', config: expect.objectContaining({ playerName: '李四' }) }),
  )
})

test('昵称留空时开始游戏回退默认名', async () => {
  const dispatch = setup()
  await userEvent.clear(screen.getByLabelText('你的昵称'))
  await userEvent.click(screen.getByRole('button', { name: '开始游戏' }))
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({ config: expect.objectContaining({ playerName: '无名勇士' }) }),
  )
})

test('基础值调到 4 时显示硬核模式警告', async () => {
  setup()
  const slider = screen.getByLabelText(/同屏地鼠数基础值/)
  fireEvent.change(slider, { target: { value: String(MAX_BASE_MOLE_COUNT) } })
  expect(screen.getByText(/硬核模式/)).toBeInTheDocument()
})

// 注：添加/删除按钮带 aria-label（添加档案/删除档案），可访问名以 aria-label 为准，
// 故按 aria-label 查询而非按钮文本 ＋/✕。
test('可添加与删除地鼠档案（名字可编辑）', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: '添加档案' }))
  const nameInput = screen.getByPlaceholderText('名字(≤6字)')
  await userEvent.type(nameInput, '王五')
  expect(nameInput).toHaveValue('王五')
  await userEvent.click(screen.getByRole('button', { name: '删除档案' }))
  expect(screen.queryByPlaceholderText('名字(≤6字)')).not.toBeInTheDocument()
})

test('最多添加 10 组档案', async () => {
  setup()
  for (let i = 0; i < 12; i++) {
    const add = screen.queryByRole('button', { name: '添加档案' })
    if (add === null) break
    await userEvent.click(add)
  }
  expect(screen.getAllByPlaceholderText('名字(≤6字)')).toHaveLength(10)
})
