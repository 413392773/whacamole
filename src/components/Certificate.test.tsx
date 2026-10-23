import { StrictMode } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Dispatch } from 'react'
import { Certificate, formatCertificateDate, sanitizeFileName } from './Certificate'
import { createInitialState } from '../core/gameReducer'
import { playSound } from '../hooks/useSound'
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

// jsdom 未实现 canvas 2d，显式返回 null 消除 "Not implemented" stderr 噪音
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

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

test('jsdom 无 canvas 2d 时优雅降级，仍渲染 DOM 文本摘要且不崩溃', () => {
  expect(() =>
    render(<Certificate state={clearState([0.9, 0.9, 0.9, 0.9, 0.9])} dispatch={vi.fn() as unknown as Dispatch<Action>} />),
  ).not.toThrow()
  expect(screen.getByText(/测试侠/)).toBeInTheDocument()
  expect(screen.getByText(/鼠神降临/)).toBeInTheDocument()
  expect(screen.getByText(/平均命中率 90%/)).toBeInTheDocument()
})

test('victory 音效每次挂载至多播一次（StrictMode 双执行）', () => {
  vi.mocked(playSound).mockClear()
  render(
    <StrictMode>
      <Certificate state={clearState([1, 1, 1, 1, 1])} dispatch={vi.fn() as unknown as Dispatch<Action>} />
    </StrictMode>,
  )
  expect(playSound).toHaveBeenCalledTimes(1)
  expect(playSound).toHaveBeenCalledWith('victory')
})

test('保存 PNG：挂载到文档内点击下载，延迟释放 URL，提示诚实文案', () => {
  vi.useFakeTimers()
  const createObjectURL = vi.fn(() => 'blob:mock')
  const revokeObjectURL = vi.fn()
  URL.createObjectURL = createObjectURL
  URL.revokeObjectURL = revokeObjectURL
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb) {
    cb(new Blob(['fake'], { type: 'image/png' }))
  })
  const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

  render(<Certificate state={clearState([1, 1, 1, 1, 1])} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  fireEvent.click(screen.getByRole('button', { name: '保存证书 PNG' }))

  expect(createObjectURL).toHaveBeenCalledTimes(1)
  expect(anchorClick).toHaveBeenCalledTimes(1)
  const anchor = anchorClick.mock.instances[0] as unknown as HTMLAnchorElement
  expect(anchor.download).toBe('荣誉证书-测试侠.png')
  // 点击后 anchor 已从文档移除（Firefox 要求先在文档内）
  expect(document.body.contains(anchor)).toBe(false)
  // iOS Safari 兼容：不得同步释放 ObjectURL
  expect(revokeObjectURL).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1000)
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')
  // 诚实提示：不承诺移动端不存在的长按存储能力
  expect(screen.getByText(/已保存！手机若未弹出下载，可截屏保存证书/)).toBeInTheDocument()
  expect(screen.queryByText(/长按/)).not.toBeInTheDocument()
})

test('toBlob 返回 null 时提示导出失败', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb) {
    cb(null)
  })
  render(<Certificate state={clearState([1, 1, 1, 1, 1])} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  fireEvent.click(screen.getByRole('button', { name: '保存证书 PNG' }))
  expect(screen.getByText(/导出失败，请截屏保存/)).toBeInTheDocument()
})

// —— 下载文件名清洗（M-6）——

function mockPngExport() {
  vi.useFakeTimers()
  URL.createObjectURL = vi.fn(() => 'blob:mock')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (this: HTMLCanvasElement, cb) {
    cb(new Blob(['fake'], { type: 'image/png' }))
  })
  return vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
}

function clickSaveAndGetDownloadName(state: GameState): string {
  const anchorClick = mockPngExport()
  render(<Certificate state={state} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  fireEvent.click(screen.getByRole('button', { name: '保存证书 PNG' }))
  const anchor = anchorClick.mock.instances[0] as unknown as HTMLAnchorElement
  return anchor.download
}

test('sanitizeFileName 去除非法字符与控制字符并 trim', () => {
  expect(sanitizeFileName('  测试侠:a/b\\c*d?e"f<g>h|i\u0000\u001f  ')).toBe('测试侠abcdefghi')
  expect(sanitizeFileName('正常昵称')).toBe('正常昵称')
})

test('sanitizeFileName 对空串、纯空白、纯非法字符回退为「证书」', () => {
  expect(sanitizeFileName('')).toBe('证书')
  expect(sanitizeFileName('   ')).toBe('证书')
  expect(sanitizeFileName('///')).toBe('证书')
})

test('下载文件名清洗特殊字符昵称', () => {
  const state: GameState = {
    ...clearState([1, 1, 1, 1, 1]),
    config: { ...CONFIG, playerName: ' 张/三:*?"<>| ' },
  }
  expect(clickSaveAndGetDownloadName(state)).toBe('荣誉证书-张三.png')
})

test('下载文件名对纯空白昵称回退为「证书」', () => {
  const state: GameState = {
    ...clearState([1, 1, 1, 1, 1]),
    config: { ...CONFIG, playerName: '   ' },
  }
  expect(clickSaveAndGetDownloadName(state)).toBe('荣誉证书-证书.png')
})

test('再来一局派发 RESTART', () => {
  const dispatch = vi.fn()
  render(<Certificate state={clearState([1, 1, 1, 1, 1])} dispatch={dispatch as unknown as Dispatch<Action>} />)
  fireEvent.click(screen.getByRole('button', { name: '再来一局' }))
  expect(dispatch).toHaveBeenCalledWith({ type: 'RESTART' })
})
