import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

test('默认进入设置页，点击开始进入关卡引导', async () => {
  render(<App />)
  await userEvent.click(screen.getByRole('button', { name: '开始游戏' }))
  expect(screen.getByText(/第 1 关/)).toBeInTheDocument()
})
