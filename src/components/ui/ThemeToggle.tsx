import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../lib/ThemeContext';

interface ThemeToggleProps {
  /** compact: just the icon button | full: icon + label | sidebar: special sidebar style */
  variant?: 'compact' | 'full' | 'sidebar';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'compact', className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();
  const [animating, setAnimating] = useState(false);

  const handleToggle = () => {
    setAnimating(true);
    toggleTheme();
    setTimeout(() => setAnimating(false), 350);
  };

  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleToggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
          text-erp-text/60 hover:text-erp-text
          transition-all duration-200
          group
          ${isDark
            ? 'hover:bg-white/5'
            : 'hover:bg-[rgba(88,204,2,0.06)]'
          }
          ${className}
        `}
      >
        {/* Toggle Track */}
        <div className={`
          relative w-9 h-5 rounded-full transition-all duration-300 flex-shrink-0
          ${isDark ? 'bg-erp-primary' : 'bg-erp-border'}
        `}>
          <div className={`
            absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 shadow-sm
            ${isDark
              ? 'translate-x-[18px] bg-white'
              : 'translate-x-0.5 bg-white'
            }
          `} />
        </div>
        <span className="text-xs font-bold">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
        <div className={`ml-auto ${animating ? 'animate-theme-in' : ''}`}>
          {isDark
            ? <Moon className="w-3.5 h-3.5 text-erp-primary" />
            : <Sun className="w-3.5 h-3.5 text-amber-500" />
          }
        </div>
      </button>
    );
  }

  if (variant === 'full') {
    return (
      <button
        onClick={handleToggle}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-xl border-2 font-bold text-sm
          transition-all duration-200 select-none
          ${isDark
            ? 'bg-erp-surface border-erp-border text-erp-text hover:border-erp-primary/40'
            : 'bg-white border-erp-border text-erp-text hover:border-erp-primary/40'
          }
          ${className}
        `}
      >
        <span className={`transition-all duration-300 ${animating ? 'animate-theme-in' : ''}`}>
          {isDark ? <Moon className="w-4 h-4 text-erp-primary" /> : <Sun className="w-4 h-4 text-amber-500" />}
        </span>
        <span className="hidden sm:block">{isDark ? 'Dark' : 'Light'}</span>
      </button>
    );
  }

  // compact (default)
  return (
    <button
      onClick={handleToggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        w-9 h-9 rounded-xl flex items-center justify-center
        border-2 transition-all duration-200
        ${isDark
          ? 'bg-erp-surface border-erp-border text-erp-text/70 hover:text-erp-primary hover:border-erp-primary/40'
          : 'bg-white border-erp-border text-erp-text/70 hover:text-amber-500 hover:border-amber-200'
        }
        ${className}
      `}
    >
      <span className={`${animating ? 'animate-theme-in' : ''}`}>
        {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
      </span>
    </button>
  );
};
