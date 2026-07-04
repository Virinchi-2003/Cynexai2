import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'info' | 'ghost';
  fullWidth?: boolean;
};

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = 'relative inline-flex items-center justify-center font-bold text-center rounded-2xl transition-all duration-150 active:translate-y-1 active:shadow-none uppercase tracking-wide px-6 py-3';
  
  const variants = {
    primary: 'bg-erp-primary text-white shadow-erp-btn-primary hover:bg-[#60DF02]',
    secondary: 'bg-erp-secondary text-white shadow-erp-btn-secondary hover:bg-[#DA94FF]',
    danger: 'bg-erp-danger text-white shadow-erp-btn-danger hover:bg-[#FF6666]',
    info: 'bg-erp-info text-white shadow-erp-btn-info hover:bg-[#20BEFF]',
    ghost: 'bg-transparent text-erp-text hover:bg-erp-border shadow-none active:translate-y-0 active:shadow-none'
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed active:translate-y-0 active:shadow-current';

  return (
    <button
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${props.disabled ? disabledStyles : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};
