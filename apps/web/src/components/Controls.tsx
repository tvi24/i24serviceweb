import { Moon, Sun } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import type { Lang } from '../i18n/I18nContext';
import { useTheme } from '../theme/ThemeContext';
import './Controls.css';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const label = theme === 'dark' ? t('shell.theme.toLight') : t('shell.theme.toDark');
  return (
    <button
      type="button"
      className="ctl-icon-btn"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
    >
      {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}

export function LanguageSwitch() {
  const { lang, setLang, t } = useI18n();
  const options: Lang[] = ['th', 'en'];
  return (
    <div className="lang-switch" role="group" aria-label={t('shell.lang.label')}>
      {options.map((l) => (
        <button
          key={l}
          type="button"
          className={`lang-switch__opt${lang === l ? ' is-active' : ''}`}
          aria-pressed={lang === l}
          onClick={() => setLang(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
