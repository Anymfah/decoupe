import { Moon, Sun } from 'lucide-react'

import { useTheme } from '../hooks/useTheme'
import type { Theme } from '../hooks/useTheme'
import { Button } from './ui'

function getNextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = getNextTheme(theme)

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={toggleTheme}
      className="h-10 w-10 p-0 rounded-full border-white/10"
      aria-label={`Basculer en mode ${nextTheme}`}
      title={`Basculer en mode ${nextTheme}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Sun className="h-4 w-4 text-accent transition-all duration-500 ease-apple-out dark:scale-0 dark:rotate-90 dark:opacity-0" />
        <Moon className="absolute h-4 w-4 scale-0 rotate-90 opacity-0 text-accent transition-all duration-500 ease-apple-out dark:scale-100 dark:rotate-0 dark:opacity-100" />
      </div>
    </Button>
  )
}
