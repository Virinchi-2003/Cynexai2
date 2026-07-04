import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div 
      className={`bg-erp-surface border-2 border-erp-border rounded-3xl p-5 shadow-erp-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
