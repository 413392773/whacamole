# 乐趣版打地鼠游戏 · 产品与交互设计规格

- 日期：2026-10-22
- 状态：已与需求方逐节确认
- 技术栈：React + Vite + TypeScript（Web H5，桌面 + 手机浏览器）

## 1. 产品定位

朋友聚会 / 团建整活场景的轻量闯关小游戏：把朋友、同事的头像和名字设置为地鼠，
5 关闯关，敲完颁发荣誉称号与荣誉证书。核心体验：简单、有趣、可个性化、可传播。

## 2. 核心玩法共识

| 维度 | 决定 |
|---|---|
| 平台 | Web H5 响应式，鼠标点击 + 触屏敲击均支持 |
| 场景 | 朋友聚会 / 团建整活 |
| 定制项 | 玩家昵称；同屏地鼠数基础值（1~4）；地鼠档案组 0~10 组（头像 + 名字） |
| 关卡 | 5 关，同屏地鼠数 = round(基础值 × 关卡倍数)，上限 12（3×4 网格） |
| 通关规则 | 每关限时 30s，倒计时结束命中率达标即过关 |
| 失败处理 | 每关共 3 次机会（含首次尝试，HUD 显示 ❤❤❤）；用尽则本局结束，按最高通过关卡授衔 |
| 通关奖励 | 荣誉证书页（可导出 PNG）+ S/A/B/C 评级 |
| 反馈 | Web Audio 合成音效 + 粒子动效 + Combo 连击 + 手机震动 |

## 3. 页面流程

```
①首页/定制 ──开始──▶ ②关卡引导(3-2-1) ──▶ ③游戏中 ──倒计时结束──▶ ④关卡结算
                                                    ▲                    │
                                                    │ 重试(剩余机会>0) ◀──┤未达标
                                                    │                    │达标
                                     3次机会用尽 ◀──┘                    ▼
                                          │                        第5关通过？
                                          ▼                            │是
                                     ⑤授衔仪式页 ──再来一局──▶ ①        ▼
                                                                 ⑥荣誉证书页
```

### ① 首页 / 定制面板（单页竖排，移动优先）

- 玩家昵称：必填文本输入，默认「无名勇士」，用于证书与授衔
- 同屏地鼠数基础值：滑块 1~4；基础值 = 4 时第 5 关满屏 12 只，设置页显示「⚠️ 硬核模式」提示
- 地鼠档案组（0~10 组）：每组 = 圆形头像上传 + 名字（≤6 字）；卡片列表可增删改；
  未添加时使用内置趣味头像库（😈🐹👻🤡 等 emoji 卡通）
- 玩法说明折叠面板 + 「开始游戏」大按钮
- 昵称、档案组、基础值自动持久化到 localStorage，下次打开自动恢复

### ② 关卡引导页（每关开始前，约 3 秒）

展示：第 N 关称号、本关参数（同屏地鼠 X 只 / 限时 30 秒 / 命中率 ≥ Z%）、
剩余机会 ❤❤❤；大字倒计时 3-2-1 后自动进入战斗。

### ③ 游戏主界面

- 顶部 HUD：倒计时环 | 得分 | 实时命中率（达标线以上变绿）| 剩余机会
- 地鼠网格：3 行 × 4 列洞口；地鼠随机冒头，头像下方带名字牌
- 敲中判定：地鼠处于 rising（冒头中）或 up（完全露出）状态时点击均算敲中
- 敲中反馈：地鼠「眼冒金星」缩回 + 粒子星星 + 音效 + 震动；桌面端鼠标显示锤子光标 🔨
- 漏敲：地鼠自行缩回，洞口闪红光，Combo 中断；不扣分
- 敲空白洞口：不扣分，仅 Combo 中断
- Combo 连击：连续敲中 ≥3 触发「Combo ×N」飘字，音效音调递增

### ④ 关卡结算页

- 达标：🎉 撒花动画 + 本关数据（命中/冒出数、命中率、得分、最高 Combo）+「下一关」按钮
- 未达标（还有剩余机会）：显示差距（如「命中率 42%，还差 8%」）+「重试本关」按钮；
  无「闯关失败」字样
- 未达标（3 次机会用尽）：直接进入 ⑤ 授衔仪式页，不提供重试
- 机会规则：每关共 3 次机会，含首次尝试；每失败一次 ❤ 减 1，重试本关不重置

### ⑤ 授衔仪式页（替代「闯关失败」）

任何一局结束都按「最高通过关卡数」颁发称号，氛围是授勋而非失败：

| 通过关卡数 | 称号 | 授衔文案 |
|---|---|---|
| 0 | 🐣 初入江湖 | 江湖路远，地鼠只是第一关！ |
| 1 | 🏹 小有名气 | 牛刀小试，侠名初显！ |
| 2 | ⚡ 身手敏捷 | 加速来袭，难敌你身形如电！ |
| 3 | 🎯 弹无虚发 | 狂乱时刻的传说，锤出必中！ |
| 4 | 👑 一代宗师 | 幻影只差半步，宗师之名已立！ |
| 5 | 🌟 武林鼠神 | 触发完整荣誉证书 + S/A/B/C 评级 |

交互：金色聚光灯 + 称号徽章「盖章」砸落动画 + 专属文案 + 本局数据
（闯到第 N 关 / 总得分 / 最高 Combo）+「再来一局」回首页。

### ⑥ 荣誉证书页（5 关全通）

- 全屏证书动画入场（卷轴展开 + 金光 + 胜利音效）
- 证书内容：装饰边框、「荣誉证书」标题、玩家昵称、通关日期、
  「以平均命中率 XX% 完成打地鼠五关挑战」、总得分、评级印章、地鼠档案头像环绕装饰
- 评级（按 5 关命中率的算术平均值）：S 鼠神降临（≥90%）/ A 猎鼠大师（≥80%）/
  B 眼疾手快（≥70%）/ C 险胜通关（<70%，兜底评级——达标线组合下平均命中率最低约 58%）
- 「保存证书 PNG」按钮：Canvas 导出下载；手机端提示长按保存
- 「再来一局」回首页

## 4. 难度设计

### 4.1 关卡参数表（集中于 `config/levels.ts`，唯一调优点）

洞位固定 3×4=12；同屏只数 = round(基础值 × 倍数)，上限 12；默认基础值 2。

| 关卡 | 称号 | 同屏倍数 | 同屏只数(基础=2) | 限时 | 地鼠停留 | 冒出间隔 | 达标命中率 |
|---|---|---|---|---|---|---|---|
| 1 | 小试牛刀 | ×1.0 | 2 | 30s | 1600ms | 900ms | ≥30% |
| 2 | 加速来袭 | ×1.5 | 3 | 30s | 1400ms | 800ms | ≥50% |
| 3 | 狂乱时刻 | ×2.0 | 4 | 30s | 1200ms | 700ms | ≥60% |
| 4 | 幻影闪现 | ×2.5 | 5 | 30s | 1000ms | 600ms | ≥70% |
| 5 | 鼠神决战 | ×3.0 | 6 | 30s | 850ms | 500ms | ≥80% |

难度递增三杠杆（由缓到急）：

1. 停留时间 1600→850ms：主要压力源，第 4、5 关敲击窗口 <1s
2. 同屏只数 ×1→×3：视觉搜索负担上升
3. 达标线 30%→80%：容错逐关收紧

达标线经需求方下调后，预计整体通关率约 75~80%（原 60% 目标不再作硬约束），
符合「简单有趣、聚会整活」定位。

### 4.2 计分与命中率

- 命中：+10 × 关卡数 分；Combo ≥3 时额外 +5 × (Combo − 2)
- 命中率 = 敲中数 ÷ 冒出总数；敲空白洞不计入分母
- 漏敲只断 Combo，不扣分

### 4.3 调优保障

- 所有参数（停留 / 间隔 / 达标线 / 时长 / 倍数）收敛在单一配置表
- 开发模式调试面板（URL 加 `?debug` 开启）：跳关、上帝模式（自动命中）、实时命中率

## 5. 技术架构

### 5.1 项目结构

```
whacamole/
├── index.html
├── src/
│   ├── main.tsx / App.tsx          # 入口 + 状态机路由
│   ├── config/
│   │   ├── levels.ts               # 5 关难度参数表
│   │   └── titles.ts               # 称号表 + 证书评级线
│   ├── core/                       # 纯逻辑，无 React 依赖，100% 可单测
│   │   ├── gameReducer.ts          # 状态机：setup→intro→playing→result→gameover→certificate
│   │   ├── spawnEngine.ts          # 冒头调度：随机选空洞、同屏上限、停留计时
│   │   ├── scoring.ts              # 得分/命中率/Combo 计算
│   │   └── types.ts                # GameState、Level、MoleProfile 等类型
│   ├── hooks/
│   │   ├── useGameLoop.ts          # rAF 驱动主循环，dispatch tick
│   │   ├── useSound.ts             # Web Audio 合成音效
│   │   └── useHaptics.ts           # 震动反馈（navigator.vibrate，能力检测降级）
│   ├── components/
│   │   ├── SetupScreen.tsx         # 首页/定制面板
│   │   ├── ProfileEditor.tsx       # 档案组编辑（头像上传压缩为 DataURL）
│   │   ├── LevelIntro.tsx          # 关卡引导 + 3-2-1
│   │   ├── GameBoard.tsx / MoleHole.tsx / Mole.tsx
│   │   ├── Hud.tsx                 # 倒计时环/得分/命中率/机会
│   │   ├── ComboFx.tsx / Particles.tsx
│   │   ├── LevelResult.tsx         # 结算（达标/重试）
│   │   ├── TitleCeremony.tsx       # 授衔仪式页
│   │   └── Certificate.tsx         # 荣誉证书 + Canvas 导出 PNG
│   ├── storage/profileStorage.ts   # localStorage 读写（昵称/档案/基础值）
│   └── debug/DebugPanel.tsx        # ?debug 调试面板
└── tests: src/core/**/*.test.ts + 组件测试（Vitest + Testing Library）
```

架构原则：

- `core/` 全部纯函数 + 不可变更新（reducer 返回新状态，绝不原地修改）
- React 组件只做渲染与事件派发
- 随机性通过注入的 `random` 函数传入 core，保证测试可复现

### 5.2 关键数据结构

```ts
MoleProfile   { id: string; name: string /* ≤6字 */; avatarDataUrl?: string }
GameConfig    { playerName: string; baseMoleCount: number /* 1~4 */; profiles: MoleProfile[] }
LevelConfig   { level: number; title: string; multiplier: number; durationMs: number;
                stayMs: number; spawnIntervalMs: number; accuracyTarget: number }
Mole          { id: string; holeIndex: number; profileId: string;
                state: 'rising' | 'up' | 'hit' | 'escaped'; appearedAt: number }
LevelStats    { hits: number; spawned: number; misses: number;
                score: number; maxCombo: number; accuracy: number }
GameState     { screen: Screen; config: GameConfig; levelIndex: number; retriesLeft: number;
                stats: LevelStats; totalScore: number; earnedTitle: Title }
```

### 5.3 交互技术要点

- 主循环：`requestAnimationFrame` + 时间戳 tick；冒头/缩回由 spawnEngine 按毫秒计时，
  不使用 `setInterval`（后台切页不漂移）
- 头像上传：Canvas 压缩到 200×200 JPEG（约 <15KB/张）再存 localStorage，避免超出 5MB 配额
- 证书导出：离屏 Canvas 绘制证书（边框/称号/数据/印章），`toBlob` 下载 PNG
- 音效：Web Audio 振荡器合成（无素材文件）；首次用户交互后解锁 AudioContext（移动端限制）

## 6. 错误处理

- localStorage 不可用（隐私模式）：降级为内存存储，游戏可玩但不持久化，Toast 提示一次
- 头像上传失败 / 非图片文件：Toast 报错，保留原档案不写入
- localStorage 超配额：写入前压缩，写入失败时提示减少档案组数量
- AudioContext / vibrate 不支持：静默降级，无音效 / 无震动，不影响玩法

## 7. 测试策略（TDD，目标覆盖率 80%+）

- core 单测（Vitest）：
  - spawnEngine：同屏上限、随机空洞选择（注入伪随机）、停留到期自动 escaped
  - scoring：Combo 累计与中断、命中率边界（0 冒出、全命中、恰好达标）
  - gameReducer：全状态流转——达标过关、未达标扣机会、3 次用尽→授衔页、
    5 关全通→证书页、各通过关卡数对应称号正确
- 组件测试（Testing Library）：
  - 定制面板：增删档案组、昵称/基础值持久化
  - 结算页：按剩余机会显示「重试本关」或直接进入授衔
- 手动验收清单：手机触屏敲击、震动、音效解锁、证书 PNG 保存、localStorage 恢复
