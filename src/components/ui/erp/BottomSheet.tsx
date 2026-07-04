import React from 'react';

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
};

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end bg-black/40 backdrop-blur-sm">
      {/* Click away layer */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Sheet Content */}
      <div className="relative w-full max-w-md bg-erp-background rounded-t-3xl p-6 pb-10 shadow-2xl transform transition-transform animate-slide-up border-t-2 border-erp-border">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-1.5 bg-erp-border rounded-full"></div>
        </div>
        
        {title && (
          <h3 className="text-xl font-display font-bold text-erp-text mb-4 text-center">{title}</h3>
        )}
        
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  );
};
