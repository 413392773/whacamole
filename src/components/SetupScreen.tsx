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
