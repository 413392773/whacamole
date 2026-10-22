import { render, screen, fireEvent, act } from '@testing-library/react'
import type { Dispatch } from 'react'
import userEvent from '@testing-library/user-event'
import { SetupScreen } from './SetupScreen'
import { compressImage, defaultConfig } from '../storage/profileStorage'
import { MAX_BASE_MOLE_COUNT } from '../config/levels'
import type { Action, GameConfig } from '../core/types'

vi.mock('../storage/profileStorage', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../storage/profileStorage')>()
  return { ...actual, compressImage: vi.fn() }
})

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

// 注：添加/删除按钮带 aria-label（添加档案/删除档案 …），可访问名以 aria-label 为准，
// 故按 aria-label 前缀查询而非按钮文本 ＋/✕。
test('可添加与删除地鼠档案（名字可编辑）', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: '添加档案' }))
  const nameInput = screen.getByPlaceholderText('名字(≤6字)')
  await userEvent.type(nameInput, '王五')
  expect(nameInput).toHaveValue('王五')
  await userEvent.click(screen.getByRole('button', { name: /^删除档案/ }))
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

const AVATAR_DATA_URL = 'data:image/png;base64,TEFTVA=='

test('头像压缩期间改名，压缩完成后改名保留且头像写入（异步竞态）', async () => {
  // Arrange：已有一组档案，compressImage 返回受控延迟 Promise
  setup({ ...defaultConfig(), profiles: [{ id: 'p1', name: '张三' }] })
  let resolveCompress!: (value: string) => void
  vi.mocked(compressImage).mockImplementation(
    () => new Promise<string>((resolve) => { resolveCompress = resolve }),
  )
  const fileInput = document.querySelector('input[type="file"]')
  if (fileInput === null) throw new Error('未找到头像上传 input')
  const file = new File(['x'], 'avatar.png', { type: 'image/png' })

  // Act：触发上传后、压缩完成前先改名，再让压缩 resolve
  fireEvent.change(fileInput, { target: { files: [file] } })
  expect(compressImage).toHaveBeenCalledWith(file)
  const nameInput = screen.getByPlaceholderText('名字(≤6字)')
  await userEvent.clear(nameInput)
  await userEvent.type(nameInput, '李四')
  await act(async () => {
    resolveCompress(AVATAR_DATA_URL)
  })

  // Assert：改名未被闭包旧档案回滚，头像按 id 合成写入
  expect(screen.getByPlaceholderText('名字(≤6字)')).toHaveValue('李四')
  expect(screen.getByRole('img', { name: '李四' })).toHaveAttribute('src', AVATAR_DATA_URL)
})
