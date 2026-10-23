import { useEffect, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState, MoleProfile } from '../core/types'
import { getRank } from '../config/titles'
import type { Rank } from '../config/titles'
import { averageAccuracy } from '../core/scoring'
import { playSound } from '../hooks/useSound'

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 850
const REVOKE_OBJECT_URL_DELAY_MS = 1000
const FILE_NAME_FALLBACK = '证书'
// Windows/Unix 文件名非法字符 + C0/C1 控制字符
const UNSAFE_FILE_NAME_CHARS = /[/\\:*?"<>|\u0000-\u001f\u007f]/g

export function sanitizeFileName(name: string): string {
  const cleaned = name.replace(UNSAFE_FILE_NAME_CHARS, '').trim()
  return cleaned === '' ? FILE_NAME_FALLBACK : cleaned
}

export interface CertificateData {
  playerName: string
  dateText: string
  avgAccuracy: number
  rank: Rank
  totalScore: number
  profiles: readonly MoleProfile[]
}

export function formatCertificateDate(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function drawCertificateBackground(ctx: CanvasRenderingContext2D): void {
  const background = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
  background.addColorStop(0, '#fffdf5')
  background.addColorStop(1, '#fdf3d7')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.strokeStyle = '#c9a227'
  ctx.lineWidth = 14
  ctx.strokeRect(24, 24, CANVAS_WIDTH - 48, CANVAS_HEIGHT - 48)
  ctx.lineWidth = 4
  ctx.strokeRect(48, 48, CANVAS_WIDTH - 96, CANVAS_HEIGHT - 96)
}

function drawCertificateTexts(ctx: CanvasRenderingContext2D, data: CertificateData): void {
  const { playerName, dateText, avgAccuracy, rank, totalScore } = data

  ctx.textAlign = 'center'
  ctx.fillStyle = '#8a6d1a'
  ctx.font = 'bold 72px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText('荣 誉 证 书', CANVAS_WIDTH / 2, 170)

  ctx.fillStyle = '#3b2f1e'
  ctx.font = 'bold 40px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(`侠士 ${playerName}`, CANVAS_WIDTH / 2, 290)

  ctx.font = '30px "PingFang SC", "Microsoft YaHei", sans-serif'
  ctx.fillText(
    `于 ${dateText} 以平均命中率 ${Math.round(avgAccuracy * 100)}%`,
    CANVAS_WIDTH / 2,
    370,
  )
  ctx.fillText('完成欢乐打地鼠五关挑战，特发此证', CANVAS_WIDTH / 2, 420)
  ctx.fillText(`总得分 ${totalScore} 分 · 评级 ${rank.grade}「${rank.name}」`, CANVAS_WIDTH / 2, 480)
}

function drawRankSeal(ctx: CanvasRenderingContext2D, rank: Rank): void {
  ctx.beginPath()
  ctx.arc(CANVAS_WIDTH / 2, 620, 90, 0, Math.PI * 2)
  ctx.strokeStyle = '#e63946'
  ctx.lineWidth = 8
  ctx.stroke()
  ctx.fillStyle = '#e63946'
  ctx.font = 'bold 90px serif'
  ctx.fillText(rank.grade, CANVAS_WIDTH / 2, 655)
}

async function drawAvatarRow(ctx: CanvasRenderingContext2D, profiles: readonly MoleProfile[]): Promise<void> {
  const avatars = profiles.filter((profile) => profile.avatarDataUrl !== undefined)
  const images = (await Promise.all(avatars.map((p) => loadImage(p.avatarDataUrl!))))
    .filter((img): img is HTMLImageElement => img !== null)
  const avatarSize = 72
  const totalWidth = images.length * (avatarSize + 16)
  let x = (CANVAS_WIDTH - totalWidth) / 2
  for (const img of images) {
    ctx.save()
    ctx.beginPath()
    ctx.arc(x + avatarSize / 2, 770, avatarSize / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, x, 770 - avatarSize / 2, avatarSize, avatarSize)
    ctx.restore()
    x += avatarSize + 16
  }
}

export async function drawCertificate(
  canvas: HTMLCanvasElement | null,
  data: CertificateData,
): Promise<void> {
  if (canvas === null) return
  const ctx = canvas.getContext('2d')
  if (ctx === null) return

  drawCertificateBackground(ctx)
  drawCertificateTexts(ctx, data)
  drawRankSeal(ctx, data.rank)
  await drawAvatarRow(ctx, data.profiles)
}

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export function Certificate({ state, dispatch }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hint, setHint] = useState<string | null>(null)

  const avgAccuracy = averageAccuracy(state.levelAccuracies)
  const rank = getRank(avgAccuracy)
  const dateText = formatCertificateDate(new Date())

  // StrictMode dev 下 effect 双执行会重复播放，用 ref 守卫确保每次挂载至多一次
  const hasPlayedRef = useRef(false)

  useEffect(() => {
    if (hasPlayedRef.current) return
    hasPlayedRef.current = true
    playSound('victory')
  }, [])

  // deps 用原始值：rank/dateText 每轮渲染都是新对象/新字符串来源，
  // 依赖对象身份会导致 setHint 等无关渲染触发全量重绘与头像重载
  useEffect(() => {
    void drawCertificate(canvasRef.current, {
      playerName: state.config.playerName,
      dateText,
      avgAccuracy,
      rank,
      totalScore: state.totalScore,
      profiles: state.config.profiles,
    })
  }, [
    state.config.playerName,
    state.config.profiles,
    state.totalScore,
    dateText,
    avgAccuracy,
    rank.grade,
    rank.name,
  ])

  const savePng = () => {
    const canvas = canvasRef.current
    if (canvas === null || typeof canvas.toBlob !== 'function') {
      setHint('当前浏览器不支持导出，请截屏保存')
      return
    }
    canvas.toBlob((blob) => {
      if (blob === null) {
        setHint('导出失败，请截屏保存')
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `荣誉证书-${sanitizeFileName(state.config.playerName)}.png`
      // Firefox 要求 anchor 在文档内才能触发下载
      document.body.appendChild(link)
      link.click()
      link.remove()
      // iOS Safari 下同步 revoke 可能导致下载失败，延迟释放
      window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_OBJECT_URL_DELAY_MS)
      setHint('已保存！手机若未弹出下载，可截屏保存证书')
    }, 'image/png')
  }

  return (
    <div className="certificate-screen">
      <h1 className="title">🏆 恭喜通关！</h1>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
      <div className="panel">
        <p>
          <strong>{state.config.playerName}</strong> · 评级 {rank.grade}「{rank.name}」 ·
          平均命中率 {Math.round(avgAccuracy * 100)}% · 总得分 {state.totalScore}
        </p>
        <button onClick={savePng}>保存证书 PNG</button>{' '}
        <button className="secondary" onClick={() => dispatch({ type: 'RESTART' })}>再来一局</button>
        {hint !== null && <p className="save-hint">{hint}</p>}
      </div>
    </div>
  )
}
