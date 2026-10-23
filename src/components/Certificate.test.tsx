import { StrictMode } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Dispatch } from 'react'
import { Certificate, drawCertificate, formatCertificateDate, sanitizeFileName } from './Certificate'
import { getRank } from '../config/titles'
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
  vi.unstubAllGlobals()
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

// —— Canvas 绘制管线（补覆盖率：stub 2d 上下文验证绘制调用）——

function stub2dContext() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    drawImage: vi.fn(),
  }
}

test('drawCertificate 绘制背景边框、标题、玩家名、评级印章与头像行', async () => {
  const ctx = stub2dContext()
  const canvas = { getContext: vi.fn(() => ctx) } as unknown as HTMLCanvasElement
  // jsdom 不加载图片：stub Image 让 onload 异步触发，走头像绘制分支
  class FakeImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    src = ''
    constructor() {
      setTimeout(() => this.onload?.(), 0)
    }
  }
  vi.stubGlobal('Image', FakeImage)

  await drawCertificate(canvas, {
    playerName: '测试侠',
    dateText: '2026年10月22日',
    avgAccuracy: 0.9,
    rank: getRank(0.9),
    totalScore: 1500,
    profiles: [{ id: 'p1', name: '鼠鼠', avatarDataUrl: 'data:image/png;base64,fake' }],
  })

  const texts = ctx.fillText.mock.calls.map((call) => String(call[0]))
  expect(texts).toContain('荣 誉 证 书')
  expect(texts).toContain('侠士 测试侠')
  expect(texts.some((t) => t.includes('于 2026年10月22日') && t.includes('平均命中率 90%'))).toBe(true)
  expect(texts.some((t) => t.includes('总得分 1500 分') && t.includes('评级 S「鼠神降临」'))).toBe(true)
  // 双层边框 + 渐变背景
  expect(ctx.strokeRect).toHaveBeenCalledTimes(2)
  expect(ctx.createLinearGradient).toHaveBeenCalledTimes(1)
  // 评级印章圆弧与字母
  expect(texts).toContain('S')
  expect(ctx.arc).toHaveBeenCalled()
  // 头像行：1 个头像被裁剪并绘制
  expect(ctx.drawImage).toHaveBeenCalledTimes(1)
  expect(ctx.clip).toHaveBeenCalledTimes(1)
})

test('drawCertificate 头像加载失败时跳过绘制且不崩溃', async () => {
  const ctx = stub2dContext()
  const canvas = { getContext: vi.fn(() => ctx) } as unknown as HTMLCanvasElement
  class BrokenImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    src = ''
    constructor() {
      setTimeout(() => this.onerror?.(), 0)
    }
  }
  vi.stubGlobal('Image', BrokenImage)

  await expect(
    drawCertificate(canvas, {
      playerName: '测试侠',
      dateText: '2026年10月22日',
      avgAccuracy: 1,
      rank: getRank(1),
      totalScore: 1500,
      profiles: [{ id: 'p1', name: '鼠鼠', avatarDataUrl: 'data:image/png;base64,broken' }],
    }),
  ).resolves.toBeUndefined()
  expect(ctx.drawImage).not.toHaveBeenCalled()
})

test('drawCertificate 对 null canvas 或无 2d 上下文时静默返回', async () => {
  await expect(
    drawCertificate(null, {
      playerName: 'x',
      dateText: 'x',
      avgAccuracy: 1,
      rank: getRank(1),
      totalScore: 0,
      profiles: [],
    }),
  ).resolves.toBeUndefined()
})
