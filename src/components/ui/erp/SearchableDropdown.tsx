import React, { useState } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

type Option = {
  value: string;
  label: string;
};

type SearchableDropdownProps = {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select option...' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find(o => o.value === value);
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative w-full">
      <div 
        className="w-full bg-erp-surface border-2 border-erp-border rounded-2xl p-4 flex items-center justify-between cursor-pointer font-bold text-erp-text active:translate-y-1 active:shadow-none shadow-erp-btn"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown className="w-5 h-5 text-erp-text" />
      </div>

      {isOpen && (
        <div className="absolute z-10 top-full left-0 w-full mt-2 bg-erp-surface border-2 border-erp-border rounded-2xl shadow-xl overflow-hidden animate-slide-up">
          <div className="p-3 border-b-2 border-erp-border flex items-center">
            <Search className="w-5 h-5 text-erp-text mr-2" />
            <input 
              type="text"
              placeholder="Search..."
              className="w-full bg-transparent outline-none font-bold text-erp-text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div 
                  key={opt.value}
                  className="p-4 border-b border-erp-border/50 hover:bg-erp-border cursor-pointer flex items-center justify-between font-bold text-erp-text"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <span>{opt.label}</span>
                  {value === opt.value && <Check className="w-5 h-5 text-erp-primary" />}
                </div>
              ))
            ) : (
              <div className="p-4 text-center font-bold text-erp-text/50">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
