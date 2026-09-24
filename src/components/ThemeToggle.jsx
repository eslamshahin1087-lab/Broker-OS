import AppIcon from './AppIcon'
import { useTheme } from '../services/ThemeContext'

export default function ThemeToggle({ compact = false, className = '' }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      className={'theme-toggle-v2' + (compact ? ' compact' : '') + (className ? ' ' + className : '')}
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
      title={isDark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
    >
      <span className="theme-toggle-v2-icon">
        <AppIcon name={isDark ? 'sun' : 'moon'} size={16} stroke={1.9} />
      </span>
      <span className="theme-toggle-v2-copy">
        <small>المظهر</small>
        <strong>{isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}</strong>
      </span>
      <span className="theme-toggle-v2-state">{isDark ? 'LIGHT' : 'DARK'}</span>
    </button>
  )
}
