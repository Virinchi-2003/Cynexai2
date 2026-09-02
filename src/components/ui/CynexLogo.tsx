import React from 'react';

interface CynexLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  badge?: string;
  className?: string;
}

export const CynexLogo: React.FC<CynexLogoProps> = ({ size = 'md', badge, className = '' }) => {
  let textClass = 'text-xl';
  if (size === 'sm') textClass = 'text-lg';
  if (size === 'lg') textClass = 'text-2xl';
  if (size === 'xl') textClass = 'text-3xl sm:text-4xl';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`${textClass} font-black tracking-tight flex items-center select-none`}>
        {/* Cynex: Black in Light Mode, White in Dark Mode */}
        <span className="text-slate-900 dark:text-white font-extrabold">Cynex</span>
        
        {/* 'A': 1st half White, 2nd half Black in all modes */}
        <span 
          className="inline-block font-black relative px-[0.5px]"
          style={{
            background: 'linear-gradient(90deg, #ffffff 50%, #000000 50%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.8)) drop-shadow(0px 0px 1px rgba(255, 255, 255, 0.6))',
          }}
        >
          A
        </span>
        
        {/* I: Black in Light Mode, White in Dark Mode */}
        <span className="text-slate-900 dark:text-white font-extrabold">I</span>
      </span>

      {badge && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
          {badge}
        </span>
      )}
    </div>
  );
};
