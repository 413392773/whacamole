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
