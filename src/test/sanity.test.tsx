import { render, screen } from '@testing-library/react'
import App from '../App'

test('renders placeholder app', () => {
  render(<App />)
  expect(screen.getByText('打地鼠')).toBeInTheDocument()
})
