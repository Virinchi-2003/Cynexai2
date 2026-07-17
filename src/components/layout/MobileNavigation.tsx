import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, DollarSign, CheckSquare, User, LayoutDashboard, Sun, Moon, Menu, X } from 'lucide-react';
import { getCurrentUser } from '../../lib/auth';
import { useTheme } from '../../lib/ThemeContext';
import { Sidebar } from './Sidebar';

export const MobileNavigation: React.FC = () => {
  const user = getCurrentUser();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  let navItems = [
    { to: '/sales/dashboard', icon: LayoutDashboard, label: 'Dash' },
    { to: '/sales/pipeline', icon: Users, label: 'Leads' },
    { to: '/sales/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/profile', icon: User, label: 'Profile' }
  ];

  if (user.role === 'Manager') {
    navItems = [
      { to: '/manager', icon: LayoutDashboard, label: 'Hub' },
      { to: '/sales/pipeline', icon: Users, label: 'Leads' },
      { to: '/manager/tasks', icon: CheckSquare, label: 'Tasks' },
      { to: '/profile', icon: User, label: 'Profile' },
    ];
  } else if (user.role === 'CEO') {
    navItems = [
      { to: '/ceo/dashboard', icon: LayoutDashboard, label: 'CEO' },
      { to: '/ceo/sales-pipeline', icon: Users, label: 'CRM' },
      { to: '/ceo/tasks', icon: CheckSquare, label: 'Tasks' },
      { to: '/profile', icon: User, label: 'Profile' },
    ];
  } else if (user.role === 'DM') {
    navItems = [
      { to: '/dm/dashboard', icon: LayoutDashboard, label: 'Hub' },
      { to: '/dm/tasks', icon: CheckSquare, label: 'Tasks' },
      { to: '/profile', icon: User, label: 'Profile' },
    ];
  } else if (user.role === 'Teacher') {
    navItems = [
      { to: '/teacher', icon: LayoutDashboard, label: 'Hub' },
      { to: '/teacher/tasks', icon: CheckSquare, label: 'Tasks' },
      { to: '/profile', icon: User, label: 'Profile' },
    ];
  }

  return (
    <>
      {/* Bottom nav bar */}
      <div className="fixed bottom-0 left-0 w-full z-50 md:hidden">
        {/* Safe area background */}
        <div className="bg-erp-surface/95 backdrop-blur-xl border-t border-erp-border shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div
            className="flex items-center h-16 px-1"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full py-2 gap-0.5 transition-all duration-200 rounded-xl mx-0.5
                  ${isActive
                    ? 'text-erp-primary'
                    : 'text-erp-text/40 hover:text-erp-text/70'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`
                      w-10 h-7 flex items-center justify-center rounded-lg transition-all duration-200
                      ${isActive ? 'bg-erp-primary/15' : ''}
                    `}>
                      <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="text-[10px] font-bold leading-none">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex flex-col items-center justify-center flex-1 h-full py-2 gap-0.5 text-erp-text/40 hover:text-erp-text/70 transition-all"
            >
              <div className="w-10 h-7 flex items-center justify-center rounded-lg">
                <Menu className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold leading-none">Menu</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (Sidebar) */}
      <div 
        className={`fixed inset-0 z-[100] md:hidden transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
        
        {/* Drawer */}
        <div 
          className={`absolute top-0 left-0 bottom-0 w-[80%] max-w-sm bg-erp-surface transform transition-transform duration-300 ease-in-out ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Close button overlay inside drawer */}
          <button 
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-4 p-2 bg-erp-background border border-erp-border rounded-xl text-erp-text/60 z-50 hover:bg-erp-surface"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="h-full w-full overflow-hidden">
            <Sidebar onNavClick={() => setMenuOpen(false)} />
          </div>
        </div>
      </div>

      {/* Spacer to prevent content being hidden behind fixed nav */}
      <div className="h-20 md:hidden" aria-hidden="true" />
    </>
  );
};
