# 乐趣版打地鼠游戏实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现规格 `docs/superpowers/specs/2026-10-22-whack-a-mole-design.md` 中的 5 关闯关打地鼠 H5 游戏（定制头像/名字/同屏数、授衔仪式、荣誉证书 PNG）。

**Architecture:** `src/core/` 为纯函数游戏引擎（状态机 reducer + 冒头调度 + 计分），随机性注入、100% 可单测；React 组件只做渲染与事件派发；rAF 主循环按时间戳驱动。所有难度参数收敛在 `src/config/`。

**Tech Stack:** React 18 + Vite 5 + TypeScript（strict）、Vitest + Testing Library（jsdom）、Web Audio、Canvas、localStorage。

---

## 文件结构总览

| 文件 | 职责 |
|---|---|
| `src/config/levels.ts` | 5 关参数表、网格/机会/基础值常量、`simultaneousMoles` |
| `src/config/titles.ts` | 6 档称号表、`getTitle`、证书评级 `getRank` |
| `src/config/avatars.ts` | 内置头像 emoji 库 |
| `src/core/types.ts` | 全部类型与 Action 联合 |
| `src/core/scoring.ts` | 得分/命中率/达标判定/平均命中率 |
| `src/core/profiles.ts` | 有效档案（无上传时用内置头像） |
| `src/core/spawnEngine.ts` | 冒头/缩回/漏敲纯函数调度 |
| `src/core/gameReducer.ts` | 状态机 reducer 工厂 + 初始状态 |
| `src/core/uid.ts` | id 生成 |
| `src/storage/profileStorage.ts` | 配置持久化 + 头像压缩 + 校验 |
| `src/hooks/useGameLoop.ts` | rAF 主循环 |
| `src/hooks/useSound.ts` | Web Audio 合成音效 |
| `src/hooks/useHaptics.ts` | 震动反馈 |
| `src/components/*.tsx` | 六个页面 + 游戏面板子组件 |
| `src/debug/DebugPanel.tsx` | ?debug 调试面板 |
| `src/styles.css` | 全部样式与动画 |
| 测试与源码同目录：`src/core/scoring.test.ts` 等 | |

---

### Task 1: 项目脚手架与测试环境

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/test/setup.ts`, `src/test/sanity.test.ts`

- [ ] **Step 1: 写 `package.json`**

```json
{
  "name": "whacamole",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "@vitest/coverage-v8": "^2.1.8",
    "jsdom": "^25.0.1",
    "typescript": "~5.6.2",
    "vite": "^5.4.11",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: 写 `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "vite.config.ts"]
}
```

- [ ] **Step 3: 写 `vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**'],
      exclude: ['src/test/**', 'src/main.tsx', 'src/debug/**', '**/*.test.*'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
```

- [ ] **Step 4: 写 `index.html`**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>欢乐打地鼠</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 写 `src/main.tsx`、占位 `src/App.tsx`、`src/test/setup.ts`**

`src/main.tsx`：

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

`src/App.tsx`（占位，Task 9 替换）：

```tsx
export default function App() {
  return <div className="app">打地鼠</div>
}
```

`src/test/setup.ts`：

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: 写冒烟测试 `src/test/sanity.test.ts`**

```tsx
import { render, screen } from '@testing-library/react'
import App from '../App'

test('renders placeholder app', () => {
  render(<App />)
  expect(screen.getByText('打地鼠')).toBeInTheDocument()
})
```

- [ ] **Step 7: 安装依赖并跑测试**

Run: `npm install && npm test`
Expected: 1 passed

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: 脚手架 React+Vite+TS+Vitest 测试环境"
```

---

### Task 2: 类型定义 `src/core/types.ts`

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: 写类型文件（无逻辑，无需测试）**

```ts
export type Screen = 'setup' | 'intro' | 'playing' | 'result' | 'gameover' | 'certificate'

export interface MoleProfile {
  id: string
  name: string
  avatarDataUrl?: string
  emoji?: string
}

export interface GameConfig {
  playerName: string
  baseMoleCount: number
  profiles: MoleProfile[]
}

export interface LevelConfig {
  level: number
  title: string
  multiplier: number
  durationMs: number
  stayMs: number
  spawnIntervalMs: number
  accuracyTarget: number
}

export type MoleState = 'rising' | 'up' | 'hit' | 'escaped'

export interface Mole {
  id: number
  holeIndex: number
  profileId: string
  state: MoleState
  spawnedAt: number
  resolvedAt?: number
}

export interface LevelStats {
  hits: number
  spawned: number
  misses: number
  score: number
  maxCombo: number
  accuracy: number
}

export interface GameState {
  screen: Screen
  config: GameConfig
  levelIndex: number
  attemptsLeft: number
  clearedLevels: number
  levelAccuracies: number[]
  levelStartAt: number
  nextSpawnAt: number
  moleIdSeq: number
  moles: Mole[]
  stats: LevelStats
  combo: number
  totalScore: number
  lastLevelPassed: boolean
}

export type Action =
  | { type: 'START_GAME'; config: GameConfig }
  | { type: 'BEGIN_LEVEL'; now: number }
  | { type: 'TICK'; now: number }
  | { type: 'WHACK'; moleId: number; now: number }
  | { type: 'WHIFF' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'RETRY_LEVEL' }
  | { type: 'RESTART' }
  | { type: 'DEBUG_JUMP_LEVEL'; levelIndex: number }
  | { type: 'DEBUG_CLEAR_ALL' }
```

- [ ] **Step 2: 类型检查**

Run: `npx tsc --noEmit`
Expected: 无错误

- [ ] **Step 3: Commit**

```bash
git add src/core/types.ts && git commit -m "feat: 游戏核心类型定义"
```

---

### Task 3: 配置表 `levels.ts` / `titles.ts` / `avatars.ts`

**Files:**
- Create: `src/config/levels.ts`, `src/config/titles.ts`, `src/config/avatars.ts`
- Test: `src/config/levels.test.ts`, `src/config/titles.test.ts`

- [ ] **Step 1: 写失败测试 `src/config/levels.test.ts`**

```ts
import { LEVELS, simultaneousMoles, ATTEMPTS_PER_LEVEL, HOLE_COUNT } from './levels'

test('共 5 关且达标线递增、停留时间递减', () => {
  expect(LEVELS).toHaveLength(5)
  for (let i = 1; i < LEVELS.length; i++) {
    expect(LEVELS[i].accuracyTarget).toBeGreaterThan(LEVELS[i - 1].accuracyTarget)
    expect(LEVELS[i].stayMs).toBeLessThan(LEVELS[i - 1].stayMs)
  }
})

test('同屏只数 = round(基础值×倍数)，且 1~12 封顶', () => {
  expect(simultaneousMoles(2, LEVELS[0])).toBe(2)
  expect(simultaneousMoles(2, LEVELS[1])).toBe(3)
  expect(simultaneousMoles(2, LEVELS[4])).toBe(6)
  expect(simultaneousMoles(4, LEVELS[4])).toBe(HOLE_COUNT)
  expect(simultaneousMoles(1, LEVELS[1])).toBeGreaterThanOrEqual(1)
})

test('每关 3 次机会（含首次）', () => {
  expect(ATTEMPTS_PER_LEVEL).toBe(3)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/config/levels.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写 `src/config/levels.ts`**

```ts
import type { LevelConfig } from '../core/types'

export const GRID_ROWS = 3
export const GRID_COLS = 4
export const HOLE_COUNT = GRID_ROWS * GRID_COLS
export const ATTEMPTS_PER_LEVEL = 3
export const LEVEL_COUNT = 5
export const MIN_BASE_MOLE_COUNT = 1
export const MAX_BASE_MOLE_COUNT = 4
export const DEFAULT_BASE_MOLE_COUNT = 2
export const MAX_PROFILES = 10
export const MAX_NAME_LENGTH = 6
export const MAX_PLAYER_NAME_LENGTH = 12
export const DEFAULT_PLAYER_NAME = '无名勇士'

export const LEVELS: readonly LevelConfig[] = [
  { level: 1, title: '小试牛刀', multiplier: 1.0, durationMs: 30_000, stayMs: 1600, spawnIntervalMs: 900, accuracyTarget: 0.3 },
  { level: 2, title: '加速来袭', multiplier: 1.5, durationMs: 30_000, stayMs: 1400, spawnIntervalMs: 800, accuracyTarget: 0.5 },
  { level: 3, title: '狂乱时刻', multiplier: 2.0, durationMs: 30_000, stayMs: 1200, spawnIntervalMs: 700, accuracyTarget: 0.6 },
  { level: 4, title: '幻影闪现', multiplier: 2.5, durationMs: 30_000, stayMs: 1000, spawnIntervalMs: 600, accuracyTarget: 0.7 },
  { level: 5, title: '鼠神决战', multiplier: 3.0, durationMs: 30_000, stayMs: 850, spawnIntervalMs: 500, accuracyTarget: 0.8 },
]

export function simultaneousMoles(baseMoleCount: number, level: LevelConfig): number {
  const count = Math.round(baseMoleCount * level.multiplier)
  return Math.min(HOLE_COUNT, Math.max(1, count))
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/config/levels.test.ts`
Expected: 3 passed

- [ ] **Step 5: 写失败测试 `src/config/titles.test.ts`**

```ts
import { getTitle, getRank } from './titles'

test('通过 0~5 关对应六档称号', () => {
  expect(getTitle(0).name).toBe('初入江湖')
  expect(getTitle(1).name).toBe('小有名气')
  expect(getTitle(2).name).toBe('身手敏捷')
  expect(getTitle(3).name).toBe('弹无虚发')
  expect(getTitle(4).name).toBe('一代宗师')
  expect(getTitle(5).name).toBe('武林鼠神')
})

test('越界值收敛到合法档位', () => {
  expect(getTitle(-1).name).toBe('初入江湖')
  expect(getTitle(99).name).toBe('武林鼠神')
})

test('证书评级阈值与兜底', () => {
  expect(getRank(0.95).grade).toBe('S')
  expect(getRank(0.9).grade).toBe('S')
  expect(getRank(0.85).grade).toBe('A')
  expect(getRank(0.75).grade).toBe('B')
  expect(getRank(0.58).grade).toBe('C')
  expect(getRank(0).grade).toBe('C')
})
```

- [ ] **Step 6: 跑测试确认失败**

Run: `npx vitest run src/config/titles.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 7: 写 `src/config/titles.ts` 与 `src/config/avatars.ts`**

`src/config/titles.ts`：

```ts
export interface Title {
  emoji: string
  name: string
  quote: string
}

export const TITLES: readonly Title[] = [
  { emoji: '🐣', name: '初入江湖', quote: '江湖路远，地鼠只是第一关！' },
  { emoji: '🏹', name: '小有名气', quote: '牛刀小试，侠名初显！' },
  { emoji: '⚡', name: '身手敏捷', quote: '加速来袭，难敌你身形如电！' },
  { emoji: '🎯', name: '弹无虚发', quote: '狂乱时刻的传说，锤出必中！' },
  { emoji: '👑', name: '一代宗师', quote: '幻影只差半步，宗师之名已立！' },
  { emoji: '🌟', name: '武林鼠神', quote: '五关尽破，天下无双！' },
]

export function getTitle(clearedLevels: number): Title {
  const index = Math.min(TITLES.length - 1, Math.max(0, clearedLevels))
  return TITLES[index]
}

export type Grade = 'S' | 'A' | 'B' | 'C'

export interface Rank {
  grade: Grade
  name: string
}

export function getRank(avgAccuracy: number): Rank {
  if (avgAccuracy >= 0.9) return { grade: 'S', name: '鼠神降临' }
  if (avgAccuracy >= 0.8) return { grade: 'A', name: '猎鼠大师' }
  if (avgAccuracy >= 0.7) return { grade: 'B', name: '眼疾手快' }
  return { grade: 'C', name: '险胜通关' }
}
```

`src/config/avatars.ts`：

```ts
export const BUILTIN_AVATARS: readonly string[] = ['😈', '🐹', '👻', '🤡', '🐷', '👽', '🤖', '🐸', '🎃', '💩']
```

- [ ] **Step 8: 跑测试确认通过**

Run: `npx vitest run src/config`
Expected: 6 passed

- [ ] **Step 9: Commit**

```bash
git add src/config && git commit -m "feat: 关卡参数表、称号与评级、内置头像库"
```

---

### Task 4: 计分模块 `src/core/scoring.ts`

**Files:**
- Create: `src/core/scoring.ts`
- Test: `src/core/scoring.test.ts`

- [ ] **Step 1: 写失败测试 `src/core/scoring.test.ts`**

```ts
import { hitScore, accuracy, hasPassed, averageAccuracy } from './scoring'

test('命中基础分 = 10×关卡数', () => {
  expect(hitScore(1, 1)).toBe(10)
  expect(hitScore(3, 2)).toBe(30)
})

test('Combo≥3 额外加分 5×(combo−2)', () => {
  expect(hitScore(1, 3)).toBe(10 + 5)
  expect(hitScore(2, 5)).toBe(20 + 15)
})

test('命中率 = 命中÷冒出，0 冒出记 0', () => {
  expect(accuracy(3, 4)).toBeCloseTo(0.75)
  expect(accuracy(0, 0)).toBe(0)
  expect(accuracy(5, 5)).toBe(1)
})

test('达标判定含等于', () => {
  expect(hasPassed(0.5, 0.5)).toBe(true)
  expect(hasPassed(0.4999, 0.5)).toBe(false)
})

test('平均命中率为算术平均，空数组记 0', () => {
  expect(averageAccuracy([0.8, 0.6])).toBeCloseTo(0.7)
  expect(averageAccuracy([])).toBe(0)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/core/scoring.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写 `src/core/scoring.ts`**

```ts
export function comboBonus(combo: number): number {
  return combo >= 3 ? 5 * (combo - 2) : 0
}

export function hitScore(level: number, combo: number): number {
  return 10 * level + comboBonus(combo)
}

export function accuracy(hits: number, spawned: number): number {
  return spawned === 0 ? 0 : hits / spawned
}

export function hasPassed(accuracyValue: number, target: number): boolean {
  return accuracyValue >= target
}

export function averageAccuracy(perLevelAccuracies: readonly number[]): number {
  if (perLevelAccuracies.length === 0) return 0
  const sum = perLevelAccuracies.reduce((total, value) => total + value, 0)
  return sum / perLevelAccuracies.length
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/core/scoring.test.ts`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add src/core/scoring.ts src/core/scoring.test.ts && git commit -m "feat: 计分与命中率纯函数"
```

---

### Task 5: 冒头调度 `src/core/spawnEngine.ts`

**Files:**
- Create: `src/core/spawnEngine.ts`, `src/core/profiles.ts`, `src/core/uid.ts`
- Test: `src/core/spawnEngine.test.ts`

- [ ] **Step 1: 写辅助模块 `src/core/uid.ts` 与 `src/core/profiles.ts`**

`src/core/uid.ts`：

```ts
let counter = 0

export function uid(prefix = 'id'): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter}`
}
```

`src/core/profiles.ts`：

```ts
import { BUILTIN_AVATARS } from '../config/avatars'
import type { GameConfig, MoleProfile } from './types'

export function getEffectiveProfiles(config: GameConfig): MoleProfile[] {
  if (config.profiles.length > 0) return config.profiles
  return BUILTIN_AVATARS.map((emoji, index) => ({
    id: `builtin-${index}`,
    name: '',
    emoji,
  }))
}
```

- [ ] **Step 2: 写失败测试 `src/core/spawnEngine.test.ts`**

```ts
import { tickSpawns, emptySnapshot, RISE_DURATION_MS, RESOLVE_DELAY_MS } from './spawnEngine'
import type { SpawnSnapshot } from './spawnEngine'
import type { LevelConfig, MoleProfile } from './types'

const LEVEL: LevelConfig = {
  level: 1, title: 'T', multiplier: 1, durationMs: 30_000,
  stayMs: 1000, spawnIntervalMs: 500, accuracyTarget: 0.5,
}
const PROFILES: MoleProfile[] = [
  { id: 'p1', name: '阿鼠', emoji: '🐹' },
  { id: 'p2', name: '阿猫', emoji: '😈' },
]
const random = () => 0.5

function tick(snapshot: SpawnSnapshot, now: number, maxSimultaneous = 2): SpawnSnapshot {
  return tickSpawns(snapshot, now, LEVEL, maxSimultaneous, 12, PROFILES, random)
}

test('到达冒出间隔时冒出一只地鼠，占用空洞并计入 spawned', () => {
  const s0 = tick(emptySnapshot(0), 0)
  expect(s0.moles).toHaveLength(1)
  expect(s0.moles[0].state).toBe('rising')
  expect(s0.spawned).toBe(1)
  expect(s0.nextSpawnAt).toBe(500)
})

test('rising 超过 150ms 变为 up', () => {
  const s0 = tick(emptySnapshot(0), 0)
  const s1 = tick(s0, RISE_DURATION_MS + 1)
  const mole = s1.moles.find((m) => m.id === s0.moles[0].id)
  expect(mole?.state).toBe('up')
})

test('同屏数量达到上限时不再冒出新地鼠，但时间继续推进', () => {
  let s = emptySnapshot(0)
  for (let t = 0; t <= 5000; t += 100) s = tick(s, t, 2)
  const active = s.moles.filter((m) => m.state === 'rising' || m.state === 'up')
  expect(active.length).toBeLessThanOrEqual(2)
  expect(s.spawned).toBeGreaterThan(2)
})

test('停留超时自动 escaped 并计入 misses', () => {
  const s0 = tick(emptySnapshot(0), 0)
  const s1 = tick(s0, LEVEL.stayMs + 1)
  const escaped = s1.moles.find((m) => m.id === s0.moles[0].id)
  expect(escaped?.state).toBe('escaped')
  expect(s1.misses).toBe(1)
})

test('已解决的地鼠在动画延迟后从数组移除', () => {
  const s0 = tick(emptySnapshot(0), 0)
  const s1 = tick(s0, LEVEL.stayMs + 1)
  const s2 = tick(s1, LEVEL.stayMs + 1 + RESOLVE_DELAY_MS + 1)
  expect(s2.moles.find((m) => m.id === s0.moles[0].id)).toBeUndefined()
})

test('随机函数决定洞位与档案，可复现', () => {
  const a = tick(emptySnapshot(0), 0)
  const b = tick(emptySnapshot(0), 0)
  expect(a.moles[0].holeIndex).toBe(b.moles[0].holeIndex)
  expect(a.moles[0].profileId).toBe(b.moles[0].profileId)
  expect(a.moles[0].holeIndex).toBeGreaterThanOrEqual(0)
  expect(a.moles[0].holeIndex).toBeLessThan(12)
})

test('单 tick 时间跨度大时补冒出有上限，不会死循环', () => {
  const s = tick(emptySnapshot(0), 60_000, 2)
  expect(s.moles.length).toBeLessThanOrEqual(12)
})
```

- [ ] **Step 3: 跑测试确认失败**

Run: `npx vitest run src/core/spawnEngine.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 4: 写 `src/core/spawnEngine.ts`**

```ts
import type { LevelConfig, Mole, MoleProfile } from './types'

export const RISE_DURATION_MS = 150
export const RESOLVE_DELAY_MS = 300
const MAX_SPAWN_STEPS_PER_TICK = 50

export interface SpawnSnapshot {
  moles: Mole[]
  nextSpawnAt: number
  moleIdSeq: number
  spawned: number
  misses: number
}

export function emptySnapshot(now: number): SpawnSnapshot {
  return { moles: [], nextSpawnAt: now, moleIdSeq: 1, spawned: 0, misses: 0 }
}

function advanceMole(mole: Mole, now: number, stayMs: number): Mole {
  if (mole.resolvedAt !== undefined) return mole
  const elapsed = now - mole.spawnedAt
  if (elapsed >= stayMs) return { ...mole, state: 'escaped', resolvedAt: now }
  if (mole.state === 'rising' && elapsed >= RISE_DURATION_MS) return { ...mole, state: 'up' }
  return mole
}

function pickFreeHole(moles: readonly Mole[], holeCount: number, random: () => number): number | null {
  const occupied = new Set(moles.map((mole) => mole.holeIndex))
  const free: number[] = []
  for (let index = 0; index < holeCount; index++) {
    if (!occupied.has(index)) free.push(index)
  }
  if (free.length === 0) return null
  return free[Math.floor(random() * free.length)]
}

export function tickSpawns(
  snapshot: SpawnSnapshot,
  now: number,
  level: LevelConfig,
  maxSimultaneous: number,
  holeCount: number,
  profiles: readonly MoleProfile[],
  random: () => number,
): SpawnSnapshot {
  let newEscapes = 0
  const advanced = snapshot.moles.map((mole) => {
    const next = advanceMole(mole, now, level.stayMs)
    if (next.state === 'escaped' && mole.state !== 'escaped') newEscapes += 1
    return next
  })
  const current: Mole[] = advanced.filter(
    (mole) => mole.resolvedAt === undefined || now - mole.resolvedAt < RESOLVE_DELAY_MS,
  )

  let { nextSpawnAt, moleIdSeq } = snapshot
  let spawned = snapshot.spawned
  let moles = current
  let steps = 0
  while (nextSpawnAt <= now && steps < MAX_SPAWN_STEPS_PER_TICK) {
    steps += 1
    const activeCount = moles.filter(
      (mole) => mole.state === 'rising' || mole.state === 'up',
    ).length
    if (activeCount < maxSimultaneous && profiles.length > 0) {
      const holeIndex = pickFreeHole(moles, holeCount, random)
      if (holeIndex !== null) {
        const profile = profiles[Math.floor(random() * profiles.length)]
        moles = [
          ...moles,
          { id: moleIdSeq, holeIndex, profileId: profile.id, state: 'rising', spawnedAt: now },
        ]
        moleIdSeq += 1
        spawned += 1
      }
    }
    nextSpawnAt += level.spawnIntervalMs
  }

  return {
    moles,
    nextSpawnAt,
    moleIdSeq,
    spawned,
    misses: snapshot.misses + newEscapes,
  }
}
```

- [ ] **Step 5: 跑测试确认通过**

Run: `npx vitest run src/core/spawnEngine.test.ts`
Expected: 7 passed

- [ ] **Step 6: Commit**

```bash
git add src/core/spawnEngine.ts src/core/spawnEngine.test.ts src/core/profiles.ts src/core/uid.ts && git commit -m "feat: 地鼠冒头调度纯函数引擎"
```

---

### Task 6: 状态机 `src/core/gameReducer.ts`

**Files:**
- Create: `src/core/gameReducer.ts`
- Test: `src/core/gameReducer.test.ts`

- [ ] **Step 1: 写失败测试 `src/core/gameReducer.test.ts`**

```ts
import { createGameReducer, createInitialState } from './gameReducer'
import { LEVELS, ATTEMPTS_PER_LEVEL } from '../config/levels'
import type { GameConfig, GameState } from './types'

const CONFIG: GameConfig = { playerName: '测试侠', baseMoleCount: 2, profiles: [] }
const reduce = createGameReducer(() => 0.5)

function playing(levelIndex = 0, now = 0, attemptsLeft = ATTEMPTS_PER_LEVEL): GameState {
  const intro = reduce(createInitialState(CONFIG), { type: 'START_GAME', config: CONFIG })
  const started = reduce({ ...intro, levelIndex, attemptsLeft }, { type: 'BEGIN_LEVEL', now })
  return started
}

function tickTo(state: GameState, from: number, to: number, step = 100): GameState {
  let s = state
  for (let t = from; t <= to; t += step) s = reduce(s, { type: 'TICK', now: t })
  return s
}

test('START_GAME 进入关卡引导页并重置进度', () => {
  const s = reduce(createInitialState(CONFIG), { type: 'START_GAME', config: CONFIG })
  expect(s.screen).toBe('intro')
  expect(s.levelIndex).toBe(0)
  expect(s.clearedLevels).toBe(0)
  expect(s.attemptsLeft).toBe(ATTEMPTS_PER_LEVEL)
})

test('BEGIN_LEVEL 进入战斗并初始化计时与统计', () => {
  const s = playing(0, 1000)
  expect(s.screen).toBe('playing')
  expect(s.levelStartAt).toBe(1000)
  expect(s.nextSpawnAt).toBe(1000)
  expect(s.stats.hits).toBe(0)
  expect(s.moles).toEqual([])
})

test('TICK 驱动冒头并累计 spawned', () => {
  const s = tickTo(playing(0, 0), 0, 2000)
  expect(s.stats.spawned).toBeGreaterThan(0)
  expect(s.moles.length).toBeGreaterThan(0)
})

test('WHACK 命中活跃地鼠：hits/combo/score 增加', () => {
  let s = tickTo(playing(0, 0), 0, 100)
  const mole = s.moles.find((m) => m.state === 'rising' || m.state === 'up')
  expect(mole).toBeDefined()
  s = reduce(s, { type: 'WHACK', moleId: mole!.id, now: 200 })
  expect(s.stats.hits).toBe(1)
  expect(s.combo).toBe(1)
  expect(s.stats.score).toBe(10)
  expect(s.moles.find((m) => m.id === mole!.id)?.state).toBe('hit')
})

test('WHACK 已解决的地鼠无效', () => {
  let s = tickTo(playing(0, 0), 0, 100)
  const mole = s.moles[0]
  s = reduce(s, { type: 'WHACK', moleId: mole.id, now: 200 })
  const again = reduce(s, { type: 'WHACK', moleId: mole.id, now: 210 })
  expect(again.stats.hits).toBe(1)
})

test('WHIFF 清空 combo，不影响分数', () => {
  let s = tickTo(playing(0, 0), 0, 100)
  const mole = s.moles[0]
  s = reduce(s, { type: 'WHACK', moleId: mole.id, now: 200 })
  s = reduce(s, { type: 'WHIFF' })
  expect(s.combo).toBe(0)
  expect(s.stats.score).toBe(10)
})

test('倒计时结束达标：进入结算页，clearedLevels+1，总分累计', () => {
  let s = playing(0, 0)
  // 构造确定性残局：预置 5 中/5 冒，末刻再冒 1 只不敲 → 命中率 5/6 ≥ 30%
  s = {
    ...s,
    nextSpawnAt: LEVELS[0].durationMs - 50,
    stats: { ...s.stats, hits: 5, spawned: 5, score: 50 },
  }
  s = reduce(s, { type: 'TICK', now: LEVELS[0].durationMs })
  expect(s.screen).toBe('result')
  expect(s.lastLevelPassed).toBe(true)
  expect(s.clearedLevels).toBe(1)
  expect(s.totalScore).toBe(50)
  expect(s.levelAccuracies).toHaveLength(1)
  expect(s.levelAccuracies[0]).toBeCloseTo(5 / 6)
})

test('倒计时结束未达标且有剩余机会：结算页可重试，机会−1', () => {
  let s = playing(0, 0)
  // nextSpawnAt 推到关卡结束之后 → 全程无冒出，命中率 0 必然未达标
  s = { ...s, nextSpawnAt: LEVELS[0].durationMs + 1000 }
  s = reduce(s, { type: 'TICK', now: LEVELS[0].durationMs })
  expect(s.screen).toBe('result')
  expect(s.lastLevelPassed).toBe(false)
  expect(s.attemptsLeft).toBe(ATTEMPTS_PER_LEVEL - 1)
  const retried = reduce(s, { type: 'RETRY_LEVEL' })
  expect(retried.screen).toBe('intro')
})

test('第 3 次失败：直接进入授衔页，称号按通过关卡数', () => {
  let s = playing(0, 0, 1)
  s = { ...s, nextSpawnAt: LEVELS[0].durationMs + 1000 }
  s = reduce(s, { type: 'TICK', now: LEVELS[0].durationMs })
  expect(s.screen).toBe('gameover')
  expect(s.attemptsLeft).toBe(0)
  expect(s.clearedLevels).toBe(0)
})

test('NEXT_LEVEL：非末关进入下一关引导并重置机会；末关进入证书页', () => {
  let s = playing(0, 0)
  s = {
    ...s,
    nextSpawnAt: LEVELS[0].durationMs - 50,
    stats: { ...s.stats, hits: 5, spawned: 5, score: 50 },
  }
  s = reduce(s, { type: 'TICK', now: LEVELS[0].durationMs })
  const next = reduce(s, { type: 'NEXT_LEVEL' })
  expect(next.screen).toBe('intro')
  expect(next.levelIndex).toBe(1)
  expect(next.attemptsLeft).toBe(ATTEMPTS_PER_LEVEL)

  const lastResult: GameState = { ...s, levelIndex: 4, clearedLevels: 4, screen: 'result', lastLevelPassed: true }
  const cert = reduce(lastResult, { type: 'NEXT_LEVEL' })
  expect(cert.screen).toBe('certificate')
})

test('NEXT_LEVEL 在失败结算页无效', () => {
  let s = playing(0, 0)
  s = { ...s, nextSpawnAt: LEVELS[0].durationMs + 1000 }
  s = reduce(s, { type: 'TICK', now: LEVELS[0].durationMs })
  expect(s.lastLevelPassed).toBe(false)
  expect(reduce(s, { type: 'NEXT_LEVEL' }).screen).toBe('result')
})

test('RESTART 回到设置页并保留配置', () => {
  const s = reduce(playing(2, 0), { type: 'RESTART' })
  expect(s.screen).toBe('setup')
  expect(s.config).toEqual(CONFIG)
  expect(s.levelIndex).toBe(0)
  expect(s.clearedLevels).toBe(0)
})

test('非 playing 状态下 TICK/WHACK 被忽略', () => {
  const intro = reduce(createInitialState(CONFIG), { type: 'START_GAME', config: CONFIG })
  expect(reduce(intro, { type: 'TICK', now: 99999 })).toBe(intro)
  expect(reduce(intro, { type: 'WHACK', moleId: 1, now: 1 })).toBe(intro)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/core/gameReducer.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写 `src/core/gameReducer.ts`**

```ts
import { ATTEMPTS_PER_LEVEL, HOLE_COUNT, LEVELS, simultaneousMoles } from '../config/levels'
import { getEffectiveProfiles } from './profiles'
import { accuracy, hasPassed, hitScore } from './scoring'
import { tickSpawns } from './spawnEngine'
import type { Action, GameConfig, GameState, LevelConfig, LevelStats } from './types'

export function emptyStats(): LevelStats {
  return { hits: 0, spawned: 0, misses: 0, score: 0, maxCombo: 0, accuracy: 0 }
}

export function createInitialState(config: GameConfig): GameState {
  return {
    screen: 'setup',
    config,
    levelIndex: 0,
    attemptsLeft: ATTEMPTS_PER_LEVEL,
    clearedLevels: 0,
    levelAccuracies: [],
    levelStartAt: 0,
    nextSpawnAt: 0,
    moleIdSeq: 1,
    moles: [],
    stats: emptyStats(),
    combo: 0,
    totalScore: 0,
    lastLevelPassed: false,
  }
}

function finishLevel(state: GameState, level: LevelConfig): GameState {
  const stillActive = state.moles.filter((mole) => mole.resolvedAt === undefined)
  const stats: LevelStats = {
    ...state.stats,
    misses: state.stats.misses + stillActive.length,
  }
  const acc = accuracy(stats.hits, stats.spawned)
  const withAccuracy: LevelStats = { ...stats, accuracy: acc }
  const passed = hasPassed(acc, level.accuracyTarget)
  const base: GameState = { ...state, stats: withAccuracy, combo: 0, moles: [] }

  if (passed) {
    return {
      ...base,
      screen: 'result',
      lastLevelPassed: true,
      clearedLevels: state.clearedLevels + 1,
      levelAccuracies: [...state.levelAccuracies, acc],
      totalScore: state.totalScore + withAccuracy.score,
    }
  }
  const attemptsLeft = state.attemptsLeft - 1
  if (attemptsLeft > 0) {
    return { ...base, screen: 'result', lastLevelPassed: false, attemptsLeft }
  }
  return { ...base, screen: 'gameover', lastLevelPassed: false, attemptsLeft: 0 }
}

export function createGameReducer(random: () => number) {
  return function gameReducer(state: GameState, action: Action): GameState {
    switch (action.type) {
      case 'START_GAME':
        return { ...createInitialState(action.config), screen: 'intro' }

      case 'BEGIN_LEVEL':
        if (state.screen !== 'intro') return state
        return {
          ...state,
          screen: 'playing',
          levelStartAt: action.now,
          nextSpawnAt: action.now,
          moleIdSeq: 1,
          moles: [],
          stats: emptyStats(),
          combo: 0,
        }

      case 'TICK': {
        if (state.screen !== 'playing') return state
        const level = LEVELS[state.levelIndex]
        const snapshot = tickSpawns(
          {
            moles: state.moles,
            nextSpawnAt: state.nextSpawnAt,
            moleIdSeq: state.moleIdSeq,
            spawned: state.stats.spawned,
            misses: state.stats.misses,
          },
          action.now,
          level,
          simultaneousMoles(state.config.baseMoleCount, level),
          HOLE_COUNT,
          getEffectiveProfiles(state.config),
          random,
        )
        const nextState: GameState = {
          ...state,
          moles: snapshot.moles,
          nextSpawnAt: snapshot.nextSpawnAt,
          moleIdSeq: snapshot.moleIdSeq,
          stats: { ...state.stats, spawned: snapshot.spawned, misses: snapshot.misses },
        }
        const timedUp = action.now - state.levelStartAt >= level.durationMs
        return timedUp ? finishLevel(nextState, level) : nextState
      }

      case 'WHACK': {
        if (state.screen !== 'playing') return state
        const target = state.moles.find((mole) => mole.id === action.moleId)
        if (target === undefined || target.resolvedAt !== undefined) return state
        const level = LEVELS[state.levelIndex]
        const combo = state.combo + 1
        const gained = hitScore(level.level, combo)
        return {
          ...state,
          combo,
          moles: state.moles.map((mole) =>
            mole.id === action.moleId
              ? { ...mole, state: 'hit' as const, resolvedAt: action.now }
              : mole,
          ),
          stats: {
            ...state.stats,
            hits: state.stats.hits + 1,
            score: state.stats.score + gained,
            maxCombo: Math.max(state.stats.maxCombo, combo),
          },
        }
      }

      case 'WHIFF':
        if (state.screen !== 'playing' || state.combo === 0) return state
        return { ...state, combo: 0 }

      case 'NEXT_LEVEL': {
        if (state.screen !== 'result' || !state.lastLevelPassed) return state
        if (state.levelIndex >= LEVELS.length - 1) return { ...state, screen: 'certificate' }
        return {
          ...state,
          screen: 'intro',
          levelIndex: state.levelIndex + 1,
          attemptsLeft: ATTEMPTS_PER_LEVEL,
        }
      }

      case 'RETRY_LEVEL':
        if (state.screen !== 'result' || state.lastLevelPassed || state.attemptsLeft <= 0) return state
        return { ...state, screen: 'intro' }

      case 'RESTART':
        return createInitialState(state.config)

      case 'DEBUG_JUMP_LEVEL': {
        const index = Math.min(LEVELS.length - 1, Math.max(0, action.levelIndex))
        return { ...state, screen: 'intro', levelIndex: index, attemptsLeft: ATTEMPTS_PER_LEVEL }
      }

      case 'DEBUG_CLEAR_ALL':
        return {
          ...state,
          screen: 'certificate',
          clearedLevels: LEVELS.length,
          levelAccuracies: LEVELS.map(() => 1),
          totalScore: Math.max(state.totalScore, 1500),
        }

      default:
        return state
    }
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/core/gameReducer.test.ts`
Expected: 13 passed

- [ ] **Step 5: 全量回归**

Run: `npm test`
Expected: 全部通过

- [ ] **Step 6: Commit**

```bash
git add src/core/gameReducer.ts src/core/gameReducer.test.ts && git commit -m "feat: 游戏状态机 reducer（全流转 TDD）"
```

---

### Task 7: 持久化与头像压缩 `src/storage/profileStorage.ts`

**Files:**
- Create: `src/storage/profileStorage.ts`
- Test: `src/storage/profileStorage.test.ts`

- [ ] **Step 1: 写失败测试 `src/storage/profileStorage.test.ts`**

```ts
import { loadConfig, saveConfig, sanitizeConfig, defaultConfig } from './profileStorage'
import type { GameConfig } from '../core/types'

const CONFIG: GameConfig = {
  playerName: '张三',
  baseMoleCount: 3,
  profiles: [{ id: 'p1', name: '阿鼠', avatarDataUrl: 'data:image/jpeg;base64,AAA' }],
}

beforeEach(() => localStorage.clear())

test('save 后 load 还原配置', () => {
  expect(saveConfig(CONFIG)).toBe(true)
  expect(loadConfig()).toEqual(CONFIG)
})

test('无存档时返回默认配置', () => {
  expect(loadConfig()).toEqual(defaultConfig())
})

test('sanitizeConfig 过滤脏数据并夹紧数值', () => {
  expect(sanitizeConfig(null)).toBeNull()
  expect(sanitizeConfig({ playerName: 123 })).toBeNull()
  const fixed = sanitizeConfig({
    playerName: '  超长名字的玩家昵称  ',
    baseMoleCount: 99,
    profiles: [
      { id: 'ok', name: '合法' },
      { name: '缺 id' },
      { id: 'x', name: '超长名字超长了', avatarDataUrl: 'http://evil.com/a.png' },
    ],
  })
  expect(fixed).not.toBeNull()
  expect(fixed!.playerName.length).toBeLessThanOrEqual(12)
  expect(fixed!.baseMoleCount).toBe(4)
  expect(fixed!.profiles).toHaveLength(1)
  expect(fixed!.profiles[0].id).toBe('ok')
})

test('存档损坏时回退默认配置', () => {
  localStorage.setItem('whacamole.config.v1', '{broken json')
  expect(loadConfig()).toEqual(defaultConfig())
})

test('localStorage 写入异常时 save 返回 false 且 load 走内存兜底', () => {
  const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceeded')
  })
  expect(saveConfig(CONFIG)).toBe(false)
  expect(loadConfig()).toEqual(CONFIG)
  spy.mockRestore()
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/storage/profileStorage.test.ts`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 写 `src/storage/profileStorage.ts`**

```ts
import {
  DEFAULT_BASE_MOLE_COUNT,
  DEFAULT_PLAYER_NAME,
  MAX_BASE_MOLE_COUNT,
  MAX_NAME_LENGTH,
  MAX_PLAYER_NAME_LENGTH,
  MAX_PROFILES,
  MIN_BASE_MOLE_COUNT,
} from '../config/levels'
import type { GameConfig, MoleProfile } from '../core/types'

const STORAGE_KEY = 'whacamole.config.v1'

let memoryFallback: GameConfig | null = null

export function defaultConfig(): GameConfig {
  return {
    playerName: DEFAULT_PLAYER_NAME,
    baseMoleCount: DEFAULT_BASE_MOLE_COUNT,
    profiles: [],
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function sanitizeProfile(raw: unknown): MoleProfile | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>
  if (!isString(record.id) || !isString(record.name)) return null
  const avatar = record.avatarDataUrl
  const avatarOk = isString(avatar) && avatar.startsWith('data:image/')
  return {
    id: record.id,
    name: record.name.slice(0, MAX_NAME_LENGTH),
    ...(avatarOk ? { avatarDataUrl: avatar } : {}),
  }
}

export function sanitizeConfig(raw: unknown): GameConfig | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>
  if (!isString(record.playerName)) return null
  const base = record.baseMoleCount
  if (typeof base !== 'number' || Number.isNaN(base)) return null
  const profiles = Array.isArray(record.profiles) ? record.profiles : []
  const cleaned = profiles
    .map(sanitizeProfile)
    .filter((profile): profile is MoleProfile => profile !== null)
    .slice(0, MAX_PROFILES)
  return {
    playerName: record.playerName.trim().slice(0, MAX_PLAYER_NAME_LENGTH) || DEFAULT_PLAYER_NAME,
    baseMoleCount: Math.min(MAX_BASE_MOLE_COUNT, Math.max(MIN_BASE_MOLE_COUNT, Math.round(base))),
    profiles: cleaned,
  }
}

export function loadConfig(): GameConfig {
  if (memoryFallback !== null) return memoryFallback
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) return defaultConfig()
    return sanitizeConfig(JSON.parse(raw)) ?? defaultConfig()
  } catch {
    return defaultConfig()
  }
}

export function saveConfig(config: GameConfig): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    memoryFallback = null
    return true
  } catch {
    memoryFallback = config
    return false
  }
}

export function compressImage(file: File, size = 200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('仅支持图片文件'))
      return
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (ctx === null) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas 不可用'))
        return
      }
      const side = Math.min(img.width, img.height)
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }
    img.src = url
  })
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/storage/profileStorage.test.ts`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add src/storage && git commit -m "feat: 配置持久化、输入校验与头像压缩"
```

---

### Task 8: Hooks（主循环 / 音效 / 震动）

**Files:**
- Create: `src/hooks/useGameLoop.ts`, `src/hooks/useSound.ts`, `src/hooks/useHaptics.ts`
- Test: `src/hooks/useGameLoop.test.tsx`, `src/hooks/useHaptics.test.ts`

- [ ] **Step 1: 写 `src/hooks/useGameLoop.ts`**

```ts
import { useEffect } from 'react'
import type { Dispatch } from 'react'
import type { Action } from '../core/types'

export function useGameLoop(active: boolean, dispatch: Dispatch<Action>): void {
  useEffect(() => {
    if (!active) return
    let frame = 0
    const loop = () => {
      dispatch({ type: 'TICK', now: performance.now() })
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [active, dispatch])
}
```

- [ ] **Step 2: 写失败测试 `src/hooks/useGameLoop.test.tsx`**

```tsx
import { renderHook } from '@testing-library/react'
import type { Dispatch } from 'react'
import { useGameLoop } from './useGameLoop'
import type { Action } from '../core/types'

test('激活时按帧派发 TICK，停止后取消', () => {
  let rafCallback: FrameRequestCallback | null = null
  vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
    rafCallback = cb
    return 1
  }))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal('performance', { now: () => 42 })

  const dispatch = vi.fn()
  const { unmount } = renderHook(() => useGameLoop(true, dispatch as unknown as Dispatch<Action>))
  expect(rafCallback).not.toBeNull()
  rafCallback!(0)
  expect(dispatch).toHaveBeenCalledWith({ type: 'TICK', now: 42 })
  unmount()
  expect(cancelAnimationFrame).toHaveBeenCalled()
  vi.unstubAllGlobals()
})

test('未激活时不启动循环', () => {
  const raf = vi.fn()
  vi.stubGlobal('requestAnimationFrame', raf)
  const dispatch = vi.fn()
  renderHook(() => useGameLoop(false, dispatch as unknown as Dispatch<Action>))
  expect(raf).not.toHaveBeenCalled()
  vi.unstubAllGlobals()
})
```

- [ ] **Step 3: 跑测试**

Run: `npx vitest run src/hooks/useGameLoop.test.tsx`
Expected: 2 passed（若因实现缺失失败，核对 Step 1 代码）

- [ ] **Step 4: 写 `src/hooks/useSound.ts`**

```ts
export type SoundName = 'whack' | 'escape' | 'pass' | 'fail' | 'stamp' | 'victory'

let audioCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof AudioContext === 'undefined') return null
  try {
    if (audioCtx === null) audioCtx = new AudioContext()
    if (audioCtx.state === 'suspended') void audioCtx.resume()
    return audioCtx
  } catch {
    return null
  }
}

function tone(
  ctx: AudioContext,
  freq: number,
  startIn: number,
  duration: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.15,
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const t0 = ctx.currentTime + startIn
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

export function playSound(name: SoundName, combo = 0): void {
  const ctx = getContext()
  if (ctx === null) return
  switch (name) {
    case 'whack':
      tone(ctx, 300 + Math.min(combo, 10) * 40, 0, 0.12, 'square', 0.1)
      break
    case 'escape':
      tone(ctx, 220, 0, 0.15, 'sawtooth', 0.06)
      tone(ctx, 180, 0.08, 0.15, 'sawtooth', 0.06)
      break
    case 'pass':
      ;[523, 659, 784].forEach((f, i) => tone(ctx, f, i * 0.12, 0.25, 'triangle'))
      break
    case 'fail':
      ;[330, 262, 196].forEach((f, i) => tone(ctx, f, i * 0.15, 0.3, 'sine'))
      break
    case 'stamp':
      tone(ctx, 120, 0, 0.2, 'square', 0.2)
      break
    case 'victory':
      ;[523, 659, 784, 1047].forEach((f, i) => tone(ctx, f, i * 0.15, 0.4, 'triangle'))
      break
  }
}

export function unlockAudio(): void {
  getContext()
}
```

说明：`unlockAudio()` 由 App 在首次 pointerdown 时调用一次（Task 9），满足移动端 AudioContext 手势解锁限制。playSound 为纯副作用函数，环境不支持时静默降级，不单独测试（jsdom 无 AudioContext，走 getContext 返回 null 分支）。

- [ ] **Step 5: 写 `src/hooks/useHaptics.ts` 与测试 `src/hooks/useHaptics.test.ts`**

`src/hooks/useHaptics.ts`：

```ts
export function buzz(pattern: number | number[]): void {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return
  try {
    navigator.vibrate(pattern)
  } catch {
    // 部分浏览器在非法状态下抛错，静默降级
  }
}
```

`src/hooks/useHaptics.test.ts`：

```ts
import { buzz } from './useHaptics'

test('支持 vibrate 时按 pattern 震动', () => {
  const vibrate = vi.fn()
  vi.stubGlobal('navigator', { ...navigator, vibrate })
  buzz(30)
  expect(vibrate).toHaveBeenCalledWith(30)
  vi.unstubAllGlobals()
})

test('不支持 vibrate 时静默降级不抛错', () => {
  vi.stubGlobal('navigator', { ...navigator, vibrate: undefined })
  expect(() => buzz(30)).not.toThrow()
  vi.unstubAllGlobals()
})
```

- [ ] **Step 6: 跑全部 hooks 测试**

Run: `npx vitest run src/hooks`
Expected: 4 passed

- [ ] **Step 7: Commit**

```bash
git add src/hooks && git commit -m "feat: rAF 主循环、Web Audio 音效与震动反馈"
```

---

### Task 9: 全局样式与 App 状态机路由

**Files:**
- Create: `src/styles.css`
- Modify: `src/App.tsx`（替换占位）
- Test: `src/App.test.tsx`

- [ ] **Step 1: 写 `src/styles.css`**

```css
:root {
  --bg: #7ec850;
  --bg-dark: #5aa63a;
  --hole: #6b4a2b;
  --hole-dark: #4a3220;
  --panel: #fffdf5;
  --ink: #3b2f1e;
  --accent: #ff6b35;
  --gold: #ffd166;
  --danger: #e63946;
  --ok: #2a9d3f;
}

* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }

body {
  margin: 0;
  font-family: -apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: linear-gradient(180deg, #aee58b 0%, var(--bg) 45%, var(--bg-dark) 100%);
  color: var(--ink);
  min-height: 100vh;
  user-select: none;
}

.app {
  max-width: 560px;
  margin: 0 auto;
  padding: 16px 12px 32px;
  min-height: 100vh;
}

button {
  font: inherit;
  border: none;
  border-radius: 12px;
  padding: 12px 24px;
  cursor: pointer;
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 4px 0 #c74e22;
  transition: transform 0.08s;
}
button:active { transform: translateY(3px); box-shadow: 0 1px 0 #c74e22; }
button.secondary { background: #8d8577; box-shadow: 0 4px 0 #635c50; }

.panel {
  background: var(--panel);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

h1.title { text-align: center; font-size: 30px; margin: 8px 0 4px; text-shadow: 2px 2px 0 #fff8; }
.subtitle { text-align: center; margin: 0 0 14px; color: #7a6a4f; font-size: 14px; }

/* ── 设置页 ─────────────────────────── */
.field-label { display: block; font-weight: 700; margin-bottom: 6px; }
input[type='text'], input[type='range'] { width: 100%; }
input[type='text'] {
  padding: 10px; border: 2px solid #e0d8c3; border-radius: 10px; font: inherit; background: #fff;
}
.hardcore-warn { color: var(--danger); font-size: 13px; font-weight: 700; margin-top: 4px; }

.profile-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.profile-card {
  width: 88px; text-align: center; background: #fff; border: 2px solid #eadfc4;
  border-radius: 12px; padding: 8px 4px; position: relative;
}
.profile-card .avatar {
  width: 56px; height: 56px; border-radius: 50%; object-fit: cover;
  background: #f3ead6; display: flex; align-items: center; justify-content: center;
  font-size: 32px; margin: 0 auto 6px; overflow: hidden; cursor: pointer;
}
.profile-card input[type='text'] { text-align: center; padding: 4px; font-size: 12px; }
.profile-card .remove {
  position: absolute; top: -8px; right: -8px; width: 24px; height: 24px; padding: 0;
  border-radius: 50%; background: var(--danger); box-shadow: none; font-size: 13px; line-height: 24px;
}
.profile-add {
  width: 88px; height: 104px; border: 2px dashed #c9bb95; border-radius: 12px;
  background: transparent; color: #9a8a63; font-size: 30px; box-shadow: none;
}
.toast { position: fixed; left: 50%; bottom: 40px; transform: translateX(-50%);
  background: #000c; color: #fff; padding: 10px 18px; border-radius: 20px; font-size: 14px; z-index: 99; }

/* ── 关卡引导 ─────────────────────────── */
.intro { text-align: center; padding-top: 12vh; }
.intro .level-name { font-size: 34px; font-weight: 900; margin: 6px 0; }
.intro .params { color: #6d5d3f; line-height: 1.9; }
.hearts { letter-spacing: 4px; font-size: 20px; }
.countdown { font-size: 96px; font-weight: 900; color: var(--accent); animation: pop 0.5s ease; }
@keyframes pop { 0% { transform: scale(2); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

/* ── 游戏主界面 ─────────────────────────── */
.hud { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.hud .ring-wrap { position: relative; width: 52px; height: 52px; flex: none; }
.hud .ring-wrap svg { transform: rotate(-90deg); }
.hud .ring-bg { fill: none; stroke: #fff8; stroke-width: 5; }
.hud .ring-fg { fill: none; stroke: var(--accent); stroke-width: 5; stroke-linecap: round; }
.hud .seconds {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 15px;
}
.hud .stat { background: #fff9; border-radius: 10px; padding: 4px 10px; font-size: 13px; font-weight: 700; }
.hud .stat.accuracy.ok { color: var(--ok); }
.hud .stat.accuracy.bad { color: var(--danger); }

.board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px 8px;
  cursor: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><text y="28" font-size="28">🔨</text></svg>') 4 4, pointer;
}
.hole {
  position: relative;
  aspect-ratio: 1 / 0.86;
  display: flex; align-items: flex-end; justify-content: center;
}
.hole .dirt {
  position: absolute; bottom: 0; left: 0; right: 0; height: 34%;
  background: radial-gradient(ellipse at center, var(--hole) 0%, var(--hole-dark) 100%);
  border-radius: 50%;
}
.hole.flash-red .dirt { background: radial-gradient(ellipse at center, #e6394688 0%, var(--hole-dark) 100%); }

.mole-slot {
  position: absolute; bottom: 8%; left: 50%; transform: translateX(-50%);
  width: 78%; height: 86%; overflow: hidden; pointer-events: none;
}
.mole {
  position: absolute; bottom: -100%; left: 0; right: 0; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
  transition: bottom 0.15s ease-out;
}
.mole.rising, .mole.up { bottom: 0; }
.mole.hit { bottom: -100%; transition: bottom 0.25s ease-in; }
.mole.escaped { bottom: -100%; transition: bottom 0.25s ease-in; }
.mole .face { font-size: clamp(28px, 9vw, 44px); line-height: 1; }
.mole img.face { width: clamp(34px, 10vw, 52px); height: clamp(34px, 10vw, 52px); border-radius: 50%; object-fit: cover; border: 2px solid #fff; }
.mole.hit .face { filter: grayscale(0.6); transform: rotate(20deg); }
.mole .nameplate {
  font-size: 10px; background: #fffc; border-radius: 8px; padding: 0 6px;
  max-width: 100%; overflow: hidden; white-space: nowrap; margin-top: 2px;
}
.stars { position: absolute; top: -6px; font-size: 14px; animation: stars 0.3s ease; }
@keyframes stars { 0% { transform: scale(0.3); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }

.combo-fx {
  position: fixed; top: 18%; left: 50%; transform: translateX(-50%);
  font-size: 34px; font-weight: 900; color: var(--accent);
  text-shadow: 2px 2px 0 #fff; pointer-events: none; animation: combo-up 0.6s ease forwards; z-index: 20;
}
@keyframes combo-up { 0% { opacity: 0; transform: translate(-50%, 20px) scale(0.6); }
  30% { opacity: 1; transform: translate(-50%, 0) scale(1.15); }
  100% { opacity: 0; transform: translate(-50%, -40px) scale(1); } }

/* ── 结算 / 授衔 / 证书 ─────────────────────────── */
.result { text-align: center; padding-top: 8vh; }
.result .big { font-size: 40px; margin: 8px 0; }
.result .stats-list { line-height: 2; color: #6d5d3f; }
.gap-hint { color: var(--danger); font-weight: 700; }

.confetti-piece {
  position: fixed; top: -12px; width: 10px; height: 14px; z-index: 30;
  animation: confetti-fall 2.2s linear forwards;
}
@keyframes confetti-fall { to { transform: translateY(105vh) rotate(720deg); opacity: 0.6; } }

.ceremony { text-align: center; padding-top: 10vh; }
.spotlight {
  position: fixed; inset: 0; pointer-events: none; z-index: 10;
  background: radial-gradient(circle at 50% 30%, #ffd16633 0%, #00000055 70%);
}
.badge {
  font-size: 72px; display: inline-block; animation: stamp-in 0.5s cubic-bezier(0.2, 2, 0.4, 1) both;
}
.badge-name { font-size: 34px; font-weight: 900; margin: 6px 0; }
.badge-quote { color: #7a6a4f; margin-bottom: 16px; }
@keyframes stamp-in { 0% { transform: scale(3) rotate(-12deg); opacity: 0; }
  100% { transform: scale(1) rotate(0); opacity: 1; } }

.certificate-screen { text-align: center; padding-top: 4vh; }
.certificate-screen canvas { width: 100%; max-width: 520px; border-radius: 8px; box-shadow: 0 8px 24px #0003; animation: unroll 0.8s ease both; }
@keyframes unroll { 0% { transform: scaleY(0.02); opacity: 0; } 100% { transform: scaleY(1); opacity: 1; } }
.save-hint { font-size: 12px; color: #7a6a4f; margin-top: 6px; }

/* ── 调试面板 ─────────────────────────── */
.debug-panel {
  position: fixed; right: 8px; bottom: 8px; z-index: 50; background: #222c; color: #0f0;
  font-size: 11px; padding: 8px; border-radius: 8px; display: flex; flex-wrap: wrap; gap: 4px; max-width: 220px;
}
.debug-panel button { padding: 2px 8px; font-size: 11px; background: #444; box-shadow: none; color: #0f0; }
```

- [ ] **Step 2: 替换 `src/App.tsx`**

```tsx
import { useEffect, useReducer } from 'react'
import { createGameReducer, createInitialState } from './core/gameReducer'
import { loadConfig } from './storage/profileStorage'
import { unlockAudio } from './hooks/useSound'
import { SetupScreen } from './components/SetupScreen'
import { LevelIntro } from './components/LevelIntro'
import { GameScreen } from './components/GameScreen'
import { LevelResult } from './components/LevelResult'
import { TitleCeremony } from './components/TitleCeremony'
import { Certificate } from './components/Certificate'
import { DebugPanel } from './debug/DebugPanel'
import './styles.css'

const reducer = createGameReducer(Math.random)

function isDebugMode(): boolean {
  return new URLSearchParams(window.location.search).has('debug')
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => createInitialState(loadConfig()))

  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  return (
    <div className="app">
      {state.screen === 'setup' && <SetupScreen initialConfig={state.config} dispatch={dispatch} />}
      {state.screen === 'intro' && <LevelIntro state={state} dispatch={dispatch} />}
      {state.screen === 'playing' && <GameScreen state={state} dispatch={dispatch} />}
      {state.screen === 'result' && <LevelResult state={state} dispatch={dispatch} />}
      {state.screen === 'gameover' && <TitleCeremony state={state} dispatch={dispatch} />}
      {state.screen === 'certificate' && <Certificate state={state} dispatch={dispatch} />}
      {isDebugMode() && <DebugPanel state={state} dispatch={dispatch} />}
    </div>
  )
}
```

说明：本 Task 中各页面组件尚不存在，先创建**最小占位组件**（Task 10~16 逐个替换为完整实现）。每个占位组件一个文件，内容形如：

```tsx
// src/components/SetupScreen.tsx（占位，Task 10 替换）
import type { Dispatch } from 'react'
import type { Action, GameConfig } from '../core/types'

export function SetupScreen({ initialConfig, dispatch }: {
  initialConfig: GameConfig
  dispatch: Dispatch<Action>
}) {
  return <button onClick={() => dispatch({ type: 'START_GAME', config: initialConfig })}>开始游戏</button>
}
```

```tsx
// src/components/LevelIntro.tsx（占位，Task 11 替换）
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'

export function LevelIntro({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  return <div>第 {state.levelIndex + 1} 关</div>
}
```

```tsx
// src/components/GameScreen.tsx（占位，Task 12 替换）
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'

export function GameScreen({ state }: { state: GameState; dispatch: Dispatch<Action> }) {
  return <div>游戏中：{state.stats.spawned}</div>
}
```

```tsx
// src/components/LevelResult.tsx（占位，Task 13 替换）
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'

export function LevelResult({ state }: { state: GameState; dispatch: Dispatch<Action> }) {
  return <div>{state.lastLevelPassed ? '达标' : '未达标'}</div>
}
```

```tsx
// src/components/TitleCeremony.tsx（占位，Task 14 替换）
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'

export function TitleCeremony({ state }: { state: GameState; dispatch: Dispatch<Action> }) {
  return <div>授衔：{state.clearedLevels}</div>
}
```

```tsx
// src/components/Certificate.tsx（占位，Task 15 替换）
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'

export function Certificate({ state }: { state: GameState; dispatch: Dispatch<Action> }) {
  return <div>证书：{state.config.playerName}</div>
}
```

```tsx
// src/debug/DebugPanel.tsx（占位，Task 16 替换）
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'

export function DebugPanel({ state, dispatch }: { state: GameState; dispatch: Dispatch<Action> }) {
  return (
    <div className="debug-panel">
      <span>debug:{state.screen}</span>
      <button onClick={() => dispatch({ type: 'DEBUG_CLEAR_ALL' })}>跳证书</button>
    </div>
  )
}
```

- [ ] **Step 3: 写失败测试 `src/App.test.tsx`（替换 `src/test/sanity.test.ts`，删除旧文件）**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

test('默认进入设置页，点击开始进入关卡引导', async () => {
  render(<App />)
  await userEvent.click(screen.getByRole('button', { name: '开始游戏' }))
  expect(screen.getByText(/第 1 关/)).toBeInTheDocument()
})
```

注：用正则 `/第 1 关/`，因 Task 11 后引导页文案为「第 1 关 / 共 5 关」，该测试无需随占位组件替换而改动。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test`
Expected: 全部通过（App.test 1 passed + core/config/storage/hooks 既有测试）

- [ ] **Step 5: 浏览器冒烟**

Run: `npm run dev`
打开 http://localhost:5173 ：可见「开始游戏」按钮，点击进入「第 1 关」。确认后关闭 dev server。

- [ ] **Step 6: Commit**

```bash
rm src/test/sanity.test.ts
git add -A && git commit -m "feat: 全局样式与 App 状态机路由（占位页面）"
```

---

### Task 10: 设置页 `SetupScreen` + `ProfileEditor`

**Files:**
- Modify: `src/components/SetupScreen.tsx`（替换占位）
- Create: `src/components/ProfileEditor.tsx`
- Test: `src/components/SetupScreen.test.tsx`, `src/storage/profileStorage.compress.test.ts`

- [ ] **Step 1: 写失败测试 `src/components/SetupScreen.test.tsx`**

```tsx
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

test('可添加与删除地鼠档案（名字可编辑）', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: '＋' }))
  const nameInput = screen.getByPlaceholderText('名字(≤6字)')
  await userEvent.type(nameInput, '王五')
  expect(nameInput).toHaveValue('王五')
  await userEvent.click(screen.getByRole('button', { name: '✕' }))
  expect(screen.queryByPlaceholderText('名字(≤6字)')).not.toBeInTheDocument()
})

test('最多添加 10 组档案', async () => {
  setup()
  for (let i = 0; i < 12; i++) {
    const add = screen.queryByRole('button', { name: '＋' })
    if (add === null) break
    await userEvent.click(add)
  }
  expect(screen.getAllByPlaceholderText('名字(≤6字)')).toHaveLength(10)
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/components/SetupScreen.test.tsx`
Expected: FAIL（占位组件无对应元素）

- [ ] **Step 3: 写 `src/components/ProfileEditor.tsx`**

```tsx
import type { ChangeEvent } from 'react'
import type { MoleProfile } from '../core/types'
import { MAX_NAME_LENGTH, MAX_PROFILES } from '../config/levels'
import { compressImage } from '../storage/profileStorage'
import { uid } from '../core/uid'

interface Props {
  profiles: readonly MoleProfile[]
  onChange: (profiles: MoleProfile[]) => void
  onNotify: (message: string) => void
}

export function ProfileEditor({ profiles, onChange, onNotify }: Props) {
  const addProfile = () => {
    if (profiles.length >= MAX_PROFILES) return
    onChange([...profiles, { id: uid('profile'), name: '' }])
  }

  const removeProfile = (id: string) => {
    onChange(profiles.filter((profile) => profile.id !== id))
  }

  const renameProfile = (id: string, name: string) => {
    onChange(
      profiles.map((profile) =>
        profile.id === id ? { ...profile, name: name.slice(0, MAX_NAME_LENGTH) } : profile,
      ),
    )
  }

  const uploadAvatar = async (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file === undefined) return
    try {
      const avatarDataUrl = await compressImage(file)
      onChange(
        profiles.map((profile) =>
          profile.id === id ? { ...profile, avatarDataUrl } : profile,
        ),
      )
    } catch (error) {
      onNotify(error instanceof Error ? error.message : '头像上传失败')
    }
  }

  return (
    <div className="profile-grid">
      {profiles.map((profile) => (
        <div className="profile-card" key={profile.id}>
          <button className="remove" aria-label="删除档案" onClick={() => removeProfile(profile.id)}>✕</button>
          <label className="avatar">
            {profile.avatarDataUrl !== undefined ? (
              <img src={profile.avatarDataUrl} alt={profile.name || '头像'} />
            ) : (
              <span>📷</span>
            )}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => void uploadAvatar(profile.id, event)}
            />
          </label>
          <input
            type="text"
            value={profile.name}
            placeholder={`名字(≤${MAX_NAME_LENGTH}字)`}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) => renameProfile(profile.id, event.target.value)}
          />
        </div>
      ))}
      {profiles.length < MAX_PROFILES && (
        <button className="profile-add" aria-label="添加档案" onClick={addProfile}>＋</button>
      )}
    </div>
  )
}
```

注意：删除按钮显示文本用 `✕`，测试查询 `{ name: '✕' }` 可命中（aria-label 亦匹配）。添加按钮同理用 `＋`。

- [ ] **Step 4: 写 `src/components/SetupScreen.tsx`（替换占位）**

```tsx
import { useState } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameConfig, MoleProfile } from '../core/types'
import {
  DEFAULT_PLAYER_NAME,
  MAX_BASE_MOLE_COUNT,
  MAX_PLAYER_NAME_LENGTH,
  MIN_BASE_MOLE_COUNT,
} from '../config/levels'
import { saveConfig } from '../storage/profileStorage'
import { ProfileEditor } from './ProfileEditor'

interface Props {
  initialConfig: GameConfig
  dispatch: Dispatch<Action>
}

export function SetupScreen({ initialConfig, dispatch }: Props) {
  const [config, setConfig] = useState<GameConfig>(initialConfig)
  const [toast, setToast] = useState<string | null>(null)

  const notify = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 2500)
  }

  const update = (patch: Partial<GameConfig>) => {
    const next = { ...config, ...patch }
    setConfig(next)
    if (!saveConfig(next)) notify('本地存储不可用，本次定制不会被保存')
  }

  const startGame = () => {
    const playerName = config.playerName.trim() || DEFAULT_PLAYER_NAME
    const finalConfig: GameConfig = { ...config, playerName }
    setConfig(finalConfig)
    saveConfig(finalConfig)
    dispatch({ type: 'START_GAME', config: finalConfig })
  }

  return (
    <div>
      <h1 className="title">🔨 欢乐打地鼠</h1>
      <p className="subtitle">把朋友的头像设成地鼠，5 关闯关赢荣誉证书！</p>

      <div className="panel">
        <label className="field-label" htmlFor="player-name">你的昵称</label>
        <input
          id="player-name"
          type="text"
          value={config.playerName}
          maxLength={MAX_PLAYER_NAME_LENGTH}
          placeholder={DEFAULT_PLAYER_NAME}
          onChange={(event) => update({ playerName: event.target.value })}
        />
      </div>

      <div className="panel">
        <label className="field-label" htmlFor="base-count">
          同屏地鼠数基础值：{config.baseMoleCount}
        </label>
        <input
          id="base-count"
          type="range"
          min={MIN_BASE_MOLE_COUNT}
          max={MAX_BASE_MOLE_COUNT}
          value={config.baseMoleCount}
          onChange={(event) => update({ baseMoleCount: Number(event.target.value) })}
        />
        {config.baseMoleCount === MAX_BASE_MOLE_COUNT && (
          <div className="hardcore-warn">⚠️ 硬核模式：第 5 关将满屏 12 只地鼠！</div>
        )}
      </div>

      <div className="panel">
        <span className="field-label">地鼠档案（头像 + 名字，可不填用内置头像）</span>
        <ProfileEditor
          profiles={config.profiles}
          onChange={(profiles: MoleProfile[]) => update({ profiles })}
          onNotify={notify}
        />
      </div>

      <div className="panel">
        <details>
          <summary>玩法说明</summary>
          <p>
            每关限时 30 秒，地鼠随机冒头，敲中计命中率；倒计时结束时命中率达到目标即过关。
            每关有 3 次机会（含首次），用尽则本局结束、按通过关卡数授予称号。
            连敲 3 只以上触发 Combo 加分。五关全通颁发荣誉证书！
          </p>
        </details>
      </div>

      <button onClick={startGame}>开始游戏</button>
      {toast !== null && <div className="toast" role="alert">{toast}</div>}
    </div>
  )
}
```

- [ ] **Step 5: 写 `src/storage/profileStorage.compress.test.ts`**

```ts
import { compressImage } from './profileStorage'

test('非图片文件被拒绝', async () => {
  const file = new File(['hello'], 'a.txt', { type: 'text/plain' })
  await expect(compressImage(file)).rejects.toThrow('仅支持图片文件')
})
```

- [ ] **Step 6: 跑测试确认通过**

Run: `npx vitest run src/components src/storage`
Expected: 全部通过（SetupScreen 5 + compress 1 + 既有 storage 5）

- [ ] **Step 7: Commit**

```bash
git add src/components src/storage && git commit -m "feat: 设置页与地鼠档案编辑器"
```

---

### Task 11: 关卡引导 `LevelIntro`

**Files:**
- Modify: `src/components/LevelIntro.tsx`（替换占位）
- Test: `src/components/LevelIntro.test.tsx`

- [ ] **Step 1: 写失败测试 `src/components/LevelIntro.test.tsx`**

```tsx
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/components/LevelIntro.test.tsx`
Expected: FAIL（占位组件无这些内容）

- [ ] **Step 3: 写 `src/components/LevelIntro.tsx`（替换占位）**

```tsx
import { useEffect, useState } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'
import { ATTEMPTS_PER_LEVEL, LEVELS, simultaneousMoles } from '../config/levels'

const COUNTDOWN_SECONDS = 3
const COUNTDOWN_INTERVAL_MS = 1000

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export function LevelIntro({ state, dispatch }: Props) {
  const level = LEVELS[state.levelIndex]
  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS)

  useEffect(() => {
    if (remaining <= 0) {
      dispatch({ type: 'BEGIN_LEVEL', now: performance.now() })
      return
    }
    const timer = window.setTimeout(() => setRemaining((n) => n - 1), COUNTDOWN_INTERVAL_MS)
    return () => window.clearTimeout(timer)
  }, [remaining, dispatch])

  const hearts =
    '❤️'.repeat(state.attemptsLeft) + '🖤'.repeat(ATTEMPTS_PER_LEVEL - state.attemptsLeft)

  return (
    <div className="intro">
      <div>第 {level.level} 关 / 共 5 关</div>
      <div className="level-name">{level.title}</div>
      <div className="params">
        同屏地鼠 {simultaneousMoles(state.config.baseMoleCount, level)} 只<br />
        限时 {level.durationMs / 1000} 秒 · 命中率 ≥ {Math.round(level.accuracyTarget * 100)}%
      </div>
      <div className="hearts">{hearts}</div>
      <div className="countdown" key={remaining}>
        {remaining > 0 ? remaining : '开始!'}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/components/LevelIntro.test.tsx`
Expected: 2 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/LevelIntro.tsx src/components/LevelIntro.test.tsx && git commit -m "feat: 关卡引导页与 3-2-1 倒计时"
```

---

### Task 12: 游戏主界面 `GameScreen`（Hud / GameBoard / MoleHole / ComboFx）

**Files:**
- Modify: `src/components/GameScreen.tsx`（替换占位）
- Create: `src/components/Hud.tsx`, `src/components/GameBoard.tsx`, `src/components/MoleHole.tsx`, `src/components/ComboFx.tsx`
- Test: `src/components/GameScreen.test.tsx`

- [ ] **Step 1: 写失败测试 `src/components/GameScreen.test.tsx`**

```tsx
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/components/GameScreen.test.tsx`
Expected: FAIL（占位组件无 testid）

- [ ] **Step 3: 写 `src/components/Hud.tsx`**

```tsx
import type { GameState } from '../core/types'
import { ATTEMPTS_PER_LEVEL, LEVELS } from '../config/levels'
import { accuracy } from '../core/scoring'

const RING_RADIUS = 17
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

interface Props {
  state: GameState
  now: number
}

export function Hud({ state, now }: Props) {
  const level = LEVELS[state.levelIndex]
  const remainingMs = Math.max(0, level.durationMs - (now - state.levelStartAt))
  const seconds = Math.ceil(remainingMs / 1000)
  const fraction = remainingMs / level.durationMs
  const acc = accuracy(state.stats.hits, state.stats.spawned)
  const accOk = state.stats.spawned > 0 && acc >= level.accuracyTarget
  const hearts =
    '❤️'.repeat(state.attemptsLeft) + '🖤'.repeat(ATTEMPTS_PER_LEVEL - state.attemptsLeft)

  return (
    <div className="hud">
      <div className="ring-wrap">
        <svg width="52" height="52" viewBox="0 0 40 40">
          <circle className="ring-bg" cx="20" cy="20" r={RING_RADIUS} />
          <circle
            className="ring-fg"
            cx="20" cy="20" r={RING_RADIUS}
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - fraction)}
          />
        </svg>
        <div className="seconds">{seconds}</div>
      </div>
      <div className="stat">得分 {state.stats.score}</div>
      <div className={`stat accuracy ${accOk ? 'ok' : 'bad'}`}>
        命中率 {state.stats.spawned > 0 ? `${Math.round(acc * 100)}%` : '--'}
      </div>
      <div className="hearts">{hearts}</div>
    </div>
  )
}
```

- [ ] **Step 4: 写 `src/components/MoleHole.tsx`**

```tsx
import type { Dispatch } from 'react'
import type { Action, Mole, MoleProfile } from '../core/types'

interface Props {
  holeIndex: number
  mole: Mole | undefined
  profiles: readonly MoleProfile[]
  dispatch: Dispatch<Action>
  now: number
}

function isActive(mole: Mole | undefined): boolean {
  return mole !== undefined && (mole.state === 'rising' || mole.state === 'up')
}

export function MoleHole({ holeIndex, mole, profiles, dispatch, now }: Props) {
  const profile = mole === undefined ? undefined : profiles.find((p) => p.id === mole.profileId)

  const handlePointerDown = () => {
    if (isActive(mole)) {
      dispatch({ type: 'WHACK', moleId: mole!.id, now })
    } else {
      dispatch({ type: 'WHIFF' })
    }
  }

  const showFlashRed = mole?.state === 'escaped'

  return (
    <div
      className={`hole${showFlashRed ? ' flash-red' : ''}`}
      data-testid={`hole-${holeIndex}`}
      onPointerDown={handlePointerDown}
    >
      <div className="dirt" />
      {mole !== undefined && (
        <div className="mole-slot">
          <div className={`mole ${mole.state}`}>
            {mole.state === 'hit' && <span className="stars">⭐💫</span>}
            {profile?.avatarDataUrl !== undefined ? (
              <img className="face" src={profile.avatarDataUrl} alt={profile.name || '地鼠'} />
            ) : (
              <span className="face">{profile?.emoji ?? '🐹'}</span>
            )}
            {profile !== undefined && profile.name !== '' && (
              <span className="nameplate">{profile.name}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: 写 `src/components/GameBoard.tsx`**

```tsx
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'
import { HOLE_COUNT } from '../config/levels'
import { getEffectiveProfiles } from '../core/profiles'
import { MoleHole } from './MoleHole'

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
  now: number
}

export function GameBoard({ state, dispatch, now }: Props) {
  const profiles = getEffectiveProfiles(state.config)
  const holes = Array.from({ length: HOLE_COUNT }, (_, holeIndex) => holeIndex)

  return (
    <div className="board">
      {holes.map((holeIndex) => (
        <MoleHole
          key={holeIndex}
          holeIndex={holeIndex}
          mole={state.moles.find((mole) => mole.holeIndex === holeIndex)}
          profiles={profiles}
          dispatch={dispatch}
          now={now}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 6: 写 `src/components/ComboFx.tsx`**

```tsx
import type { GameState } from '../core/types'

const COMBO_DISPLAY_THRESHOLD = 3

export function ComboFx({ state }: { state: GameState }) {
  if (state.combo < COMBO_DISPLAY_THRESHOLD) return null
  return (
    <div className="combo-fx" key={state.stats.hits}>
      Combo ×{state.combo}
    </div>
  )
}
```

- [ ] **Step 7: 写 `src/components/GameScreen.tsx`（替换占位）**

```tsx
import { useEffect, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'
import { useGameLoop } from '../hooks/useGameLoop'
import { playSound } from '../hooks/useSound'
import { buzz } from '../hooks/useHaptics'
import { Hud } from './Hud'
import { GameBoard } from './GameBoard'
import { ComboFx } from './ComboFx'

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export function GameScreen({ state, dispatch }: Props) {
  const [now, setNow] = useState(() => performance.now())
  const prevHits = useRef(state.stats.hits)
  const prevMisses = useRef(state.stats.misses)

  useGameLoop(true, dispatch)

  useEffect(() => {
    const frame = requestAnimationFrame(function loop() {
      setNow(performance.now())
      requestAnimationFrame(loop)
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (state.stats.hits > prevHits.current) {
      playSound('whack', state.combo)
      buzz(30)
    }
    prevHits.current = state.stats.hits
  }, [state.stats.hits, state.combo])

  useEffect(() => {
    if (state.stats.misses > prevMisses.current) playSound('escape')
    prevMisses.current = state.stats.misses
  }, [state.stats.misses])

  return (
    <div>
      <Hud state={state} now={now} />
      <GameBoard state={state} dispatch={dispatch} now={now} />
      <ComboFx state={state} />
    </div>
  )
}
```

说明：`now` 仅用于 HUD 倒计时环与 WHACK 时间戳的显示层刷新；游戏逻辑时间以 reducer 收到的 TICK `now` 为准，二者互不干扰。

- [ ] **Step 8: 跑测试确认通过**

Run: `npx vitest run src/components/GameScreen.test.tsx`
Expected: 5 passed

- [ ] **Step 9: 浏览器冒烟**

Run: `npm run dev` → 开始游戏 → 3 秒后进入战斗：倒计时环走动、地鼠冒头、点击有金星缩回、敲空白洞无异常、连续敲 3 只出现 Combo 飘字。

- [ ] **Step 10: Commit**

```bash
git add src/components && git commit -m "feat: 游戏主界面（HUD/网格/地鼠/连击特效）"
```

---

### Task 13: 关卡结算 `LevelResult`

**Files:**
- Modify: `src/components/LevelResult.tsx`（替换占位）
- Test: `src/components/LevelResult.test.tsx`

- [ ] **Step 1: 写失败测试 `src/components/LevelResult.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import type { Dispatch } from 'react'
import { LevelResult } from './LevelResult'
import { createInitialState } from '../core/gameReducer'
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
  render(<LevelResult state={resultState({ lastLevelPassed: false, stats, attemptsLeft: 2 })} dispatch={dispatch as unknown as Dispatch<Action>} />)
  expect(screen.getByText(/还差 20%/)).toBeInTheDocument()
  expect(screen.getByText('❤️❤️🖤')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: '重试本关' }))
  expect(dispatch).toHaveBeenCalledWith({ type: 'RETRY_LEVEL' })
})

test('未达标不出现「闯关失败」字样', () => {
  render(<LevelResult state={resultState({ lastLevelPassed: false, attemptsLeft: 2 })} dispatch={vi.fn() as unknown as Dispatch<Action>} />)
  expect(screen.queryByText(/闯关失败/)).not.toBeInTheDocument()
})
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/components/LevelResult.test.tsx`
Expected: FAIL（占位组件）

- [ ] **Step 3: 写 `src/components/LevelResult.tsx`（替换占位）**

```tsx
import { useEffect } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'
import { ATTEMPTS_PER_LEVEL, LEVELS } from '../config/levels'
import { playSound } from '../hooks/useSound'

const CONFETTI_COUNT = 24
const CONFETTI_COLORS = ['#ff6b35', '#ffd166', '#2a9d3f', '#4d96ff', '#e63946']

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export function LevelResult({ state, dispatch }: Props) {
  const level = LEVELS[state.levelIndex]
  const passed = state.lastLevelPassed

  useEffect(() => {
    playSound(passed ? 'pass' : 'fail')
  }, [passed])

  const gapPercent = Math.max(
    0,
    Math.ceil((level.accuracyTarget - state.stats.accuracy) * 100),
  )
  const hearts =
    '❤️'.repeat(state.attemptsLeft) + '🖤'.repeat(ATTEMPTS_PER_LEVEL - state.attemptsLeft)

  return (
    <div className="result">
      {passed && (
        <>
          {Array.from({ length: CONFETTI_COUNT }, (_, index) => (
            <span
              key={index}
              className="confetti-piece"
              style={{
                left: `${(index * 97) % 100}%`,
                background: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
                animationDelay: `${(index % 8) * 0.12}s`,
              }}
            />
          ))}
          <div className="big">🎉 过关！</div>
        </>
      )}
      {!passed && <div className="big">💪 差一点点！</div>}

      <div className="panel stats-list">
        <div>{level.title} · 第 {level.level} 关</div>
        <div>
          命中率 {Math.round(state.stats.accuracy * 100)}%
          {!passed && <span className="gap-hint">（达标 {Math.round(level.accuracyTarget * 100)}%，还差 {gapPercent}%）</span>}
        </div>
        <div>敲中 {state.stats.hits} / 冒出 {state.stats.spawned}</div>
        <div>本关得分 {state.stats.score} · 最高 Combo ×{state.stats.maxCombo}</div>
        {!passed && <div className="hearts">剩余机会 {hearts}</div>}
      </div>

      {passed ? (
        <button onClick={() => dispatch({ type: 'NEXT_LEVEL' })}>
          {state.levelIndex >= LEVELS.length - 1 ? '领取荣誉证书' : '下一关'}
        </button>
      ) : (
        <button onClick={() => dispatch({ type: 'RETRY_LEVEL' })}>重试本关</button>
      )}
    </div>
  )
}
```

说明：机会用尽的失败不会进入本页（reducer 直接切 `gameover`），故本页失败态必然还有剩余机会，无需「查看成绩」按钮。第 5 关达标时按钮文案为「领取荣誉证书」（派发同一个 NEXT_LEVEL，reducer 切 certificate）。测试 1 中按钮名为「下一关」，对应 levelIndex=0，与用例一致。

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/components/LevelResult.test.tsx`
Expected: 3 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/LevelResult.tsx src/components/LevelResult.test.tsx && git commit -m "feat: 关卡结算页（撒花/差距提示/重试与下一关）"
```

---

### Task 14: 授衔仪式 `TitleCeremony`

**Files:**
- Modify: `src/components/TitleCeremony.tsx`（替换占位）
- Test: `src/components/TitleCeremony.test.tsx`

- [ ] **Step 1: 写失败测试 `src/components/TitleCeremony.test.tsx`**

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import type { Dispatch } from 'react'
import { TitleCeremony } from './TitleCeremony'
import { createInitialState } from '../core/gameReducer'
import type { Action, GameConfig, GameState } from '../core/types'

const CONFIG: GameConfig = { playerName: '测试侠', baseMoleCount: 2, profiles: [] }

function gameoverState(clearedLevels: number): GameState {
  return { ...createInitialState(CONFIG), screen: 'gameover', clearedLevels, totalScore: 320 }
}

vi.mock('../hooks/useSound', () => ({ playSound: vi.fn() }))

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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/components/TitleCeremony.test.tsx`
Expected: FAIL（占位组件）

- [ ] **Step 3: 写 `src/components/TitleCeremony.tsx`（替换占位）**

```tsx
import { useEffect } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'
import { getTitle } from '../config/titles'
import { LEVELS } from '../config/levels'
import { playSound } from '../hooks/useSound'

const STAMP_SOUND_DELAY_MS = 300

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export function TitleCeremony({ state, dispatch }: Props) {
  const title = getTitle(state.clearedLevels)

  useEffect(() => {
    const timer = window.setTimeout(() => playSound('stamp'), STAMP_SOUND_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <div className="ceremony">
      <div className="spotlight" />
      <div className="panel">
        <div>侠士 <strong>{state.config.playerName}</strong> 荣获称号</div>
        <span className="badge">{title.emoji}</span>
        <div className="badge-name">{title.name}</div>
        <div className="badge-quote">{title.quote}</div>
        <div>
          通过 {state.clearedLevels} / {LEVELS.length} 关 · 总得分 {state.totalScore}
        </div>
      </div>
      <button onClick={() => dispatch({ type: 'RESTART' })}>再来一局</button>
    </div>
  )
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/components/TitleCeremony.test.tsx`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/TitleCeremony.tsx src/components/TitleCeremony.test.tsx && git commit -m "feat: 授衔仪式页（称号徽章盖章动画）"
```

---

### Task 15: 荣誉证书 `Certificate`（Canvas + PNG 导出）

**Files:**
- Modify: `src/components/Certificate.tsx`（替换占位）
- Test: `src/components/Certificate.test.tsx`

- [ ] **Step 1: 写失败测试 `src/components/Certificate.test.tsx`**

```tsx
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx vitest run src/components/Certificate.test.tsx`
Expected: FAIL（占位组件）

- [ ] **Step 3: 写 `src/components/Certificate.tsx`（替换占位）**

```tsx
import { useEffect, useRef, useState } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState, MoleProfile } from '../core/types'
import { getRank } from '../config/titles'
import type { Rank } from '../config/titles'
import { averageAccuracy } from '../core/scoring'
import { playSound } from '../hooks/useSound'

const CANVAS_WIDTH = 1200
const CANVAS_HEIGHT = 850

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

export async function drawCertificate(
  canvas: HTMLCanvasElement | null,
  data: CertificateData,
): Promise<void> {
  if (canvas === null) return
  const ctx = canvas.getContext('2d')
  if (ctx === null) return

  const { playerName, dateText, avgAccuracy, rank, totalScore, profiles } = data

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

  ctx.beginPath()
  ctx.arc(CANVAS_WIDTH / 2, 620, 90, 0, Math.PI * 2)
  ctx.strokeStyle = '#e63946'
  ctx.lineWidth = 8
  ctx.stroke()
  ctx.fillStyle = '#e63946'
  ctx.font = 'bold 90px serif'
  ctx.fillText(rank.grade, CANVAS_WIDTH / 2, 655)

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

  useEffect(() => {
    playSound('victory')
  }, [])

  useEffect(() => {
    void drawCertificate(canvasRef.current, {
      playerName: state.config.playerName,
      dateText,
      avgAccuracy,
      rank,
      totalScore: state.totalScore,
      profiles: state.config.profiles,
    })
  }, [state, dateText, avgAccuracy, rank])

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
      link.download = `荣誉证书-${state.config.playerName}.png`
      link.click()
      URL.revokeObjectURL(url)
      setHint('已保存！手机上也可长按证书图片存储')
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
```

说明：jsdom 中 `canvas.getContext('2d')` 返回 null，`drawCertificate` 提前返回，组件仍渲染 DOM 文本摘要（玩家名/评级/命中率），因此测试可断言且不崩溃；真机浏览器走完整 Canvas 绘制。

- [ ] **Step 4: 跑测试确认通过**

Run: `npx vitest run src/components/Certificate.test.tsx`
Expected: 5 passed

- [ ] **Step 5: Commit**

```bash
git add src/components/Certificate.tsx src/components/Certificate.test.tsx && git commit -m "feat: 荣誉证书页（Canvas 绘制 + PNG 导出）"
```

---

### Task 16: 调试面板、覆盖率门禁与整体验收

**Files:**
- Modify: `src/debug/DebugPanel.tsx`（替换占位）
- Test: 全量回归

- [ ] **Step 1: 写 `src/debug/DebugPanel.tsx`（替换占位）**

```tsx
import { useEffect, useState } from 'react'
import type { Dispatch } from 'react'
import type { Action, GameState } from '../core/types'
import { LEVELS } from '../config/levels'

const GOD_MODE_INTERVAL_MS = 200

interface Props {
  state: GameState
  dispatch: Dispatch<Action>
}

export function DebugPanel({ state, dispatch }: Props) {
  const [isGodMode, setIsGodMode] = useState(false)

  useEffect(() => {
    if (!isGodMode || state.screen !== 'playing') return
    const timer = window.setInterval(() => {
      const target = state.moles.find(
        (mole) => mole.state === 'rising' || mole.state === 'up',
      )
      if (target !== undefined) {
        dispatch({ type: 'WHACK', moleId: target.id, now: performance.now() })
      }
    }, GOD_MODE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [isGodMode, state.screen, state.moles, dispatch])

  return (
    <div className="debug-panel">
      <span>
        {state.screen} · L{state.levelIndex + 1} · ❤{state.attemptsLeft} ·
        acc {state.stats.spawned > 0 ? Math.round((state.stats.hits / state.stats.spawned) * 100) : 0}%
      </span>
      {LEVELS.map((level, index) => (
        <button key={level.level} onClick={() => dispatch({ type: 'DEBUG_JUMP_LEVEL', levelIndex: index })}>
          关{level.level}
        </button>
      ))}
      <button onClick={() => dispatch({ type: 'DEBUG_CLEAR_ALL' })}>跳证书</button>
      <button onClick={() => setIsGodMode((value) => !value)}>
        {isGodMode ? '上帝:开' : '上帝:关'}
      </button>
    </div>
  )
}
```

说明：DebugPanel 属调试工具，不计入覆盖率（vite.config.ts 已 exclude `src/debug/**`），不写单测。

- [ ] **Step 2: 全量测试 + 覆盖率门禁**

Run: `npm run test:coverage`
Expected: 全部通过，且 `src/core`、`src/config`、`src/storage`、`src/hooks`、`src/components` 行覆盖率 ≥80%（阈值已在 vitest 配置强制，低于则命令失败）

- [ ] **Step 3: 类型检查与生产构建**

Run: `npm run build`
Expected: tsc 无错误，`dist/` 产出成功

- [ ] **Step 4: 手动验收清单（浏览器逐项勾选）**

Run: `npm run dev`，另开一个标签页加 `?debug`。

- [ ] 设置页：昵称、滑块、硬核警告（基础值=4）、添加/删除档案、上传头像并命名
- [ ] 刷新页面后定制数据恢复（localStorage）
- [ ] 引导页 3-2-1 进入战斗，倒计时环、得分、命中率、❤ 实时刷新
- [ ] 手机模拟器（DevTools 触屏）敲击地鼠有金星缩回；桌面显示锤子光标
- [ ] 连敲 ≥3 出现 Combo 飘字；漏敲洞口闪红、Combo 中断
- [ ] 达标：撒花 + 下一关；未达标：差距提示 + 重试；3 次用尽：授衔页出现对应称号（无"闯关失败"字样）
- [ ] debug 面板：跳关、上帝模式自动敲、跳证书
- [ ] 证书页：卷轴动画、玩家名/日期/评级/平均分正确；「保存证书 PNG」下载成功且图片内容完整
- [ ] 真机手机：音效在首次触屏后可听、敲击有震动、证书长按可存图
- [ ] 全程无 console 报错

- [ ] **Step 5: 最终提交**

```bash
git add -A && git commit -m "feat: 调试面板与整体验收完成"
```

---

## 验收标准（对齐规格）

1. 5 关参数与规格 4.1 表完全一致（`src/config/levels.ts` 单点定义）
2. 每关 3 次机会（含首次），用尽 → 授衔页按通过关卡数颁发六档称号，全程无"闯关失败"字样
3. 5 关全通 → 荣誉证书页 + S/A/B/C 评级 + PNG 导出
4. 定制（昵称/基础值/档案组）持久化 localStorage，隐私模式内存兜底
5. `npm run test:coverage` 通过且 ≥80%；`npm run build` 成功
6. 手动验收清单全绿

