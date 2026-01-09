import { Moon, Sun } from 'lucide-react'

import { useTheme } from '../hooks/useTheme'
import type { Theme } from '../hooks/useTheme'

function getNextTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark'
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = getNextTheme(theme)

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="group inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-surface px-3 text-sm font-medium shadow-soft transition duration-300 ease-out hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={`Basculer en mode ${nextTheme}`}
      title={`Basculer en mode ${nextTheme}`}
    >
      <span className="relative grid h-5 w-5 place-items-center">
        <Sun className="h-4 w-4 text-muted transition-all duration-300 ease-out group-hover:text-text dark:scale-0 dark:opacity-0" />
        <Moon className="absolute h-4 w-4 scale-0 opacity-0 text-muted transition-all duration-300 ease-out group-hover:text-text dark:scale-100 dark:opacity-100" />
      </span>
      <span className="hidden sm:inline">{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  )
}

