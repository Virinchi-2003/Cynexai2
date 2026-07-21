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
        {/* Safe area background with candy-panel style */}
        <div className="candy-panel !rounded-t-3xl !rounded-b-none !border-b-0 !border-x-0 !shadow-[0_-10px_25px_rgba(0,0,0,0.15)] bg-white dark:bg-black">
          <div
            className="flex items-center h-20 px-2"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
          >
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center flex-1 h-full py-2 gap-1 transition-all duration-300 rounded-xl mx-0.5 min-h-[44px]
                  ${isActive
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-white/50 dark:hover:text-white/80 active:scale-95'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`
                      w-12 h-10 flex items-center justify-center rounded-2xl transition-all duration-300
                      ${isActive ? 'candy-btn-blue shadow-lg !min-h-[40px] !border' : ''}
                    `}>
                      <item.icon className="w-5 h-5" strokeWidth={isActive ? 3 : 2} />
                    </div>
                    <span className={`text-[10px] font-black leading-none ${isActive ? 'text-[#0096ff] dark:text-[#01cdfe]' : ''}`}>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Menu Button */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="flex flex-col items-center justify-center flex-1 h-full py-2 gap-1 text-slate-500 hover:text-slate-700 dark:text-white/50 dark:hover:text-white/80 transition-all active:scale-95 min-h-[44px]"
            >
              <div className="w-12 h-10 flex items-center justify-center rounded-2xl">
                <Menu className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black leading-none">Menu</span>
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
          className={`absolute top-0 left-0 bottom-0 w-[80%] max-w-sm candy-panel !rounded-l-none !border-y-0 !border-l-0 transform transition-transform duration-300 ease-in-out ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Close button overlay inside drawer */}
          <button 
            onClick={() => setMenuOpen(false)}
            className="absolute top-4 right-4 p-2 candy-btn !min-h-[40px] z-50 flex items-center justify-center rounded-xl"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="h-full w-full overflow-hidden">
            <Sidebar onNavClick={() => setMenuOpen(false)} />
          </div>
        </div>
      </div>

      {/* Spacer to prevent content being hidden behind fixed nav */}
      <div className="h-28 md:hidden" aria-hidden="true" />
    </>
  );
};
