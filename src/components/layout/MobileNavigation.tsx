import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, DollarSign, CheckSquare, MessageCircle, User, LayoutDashboard } from 'lucide-react';
import { getCurrentUser } from '../../lib/auth';

export const MobileNavigation: React.FC = () => {
  const user = getCurrentUser();
  if (!user) return null;

  let navItems = [
    { to: '/sales/dashboard', icon: LayoutDashboard, label: 'Dash' },
    { to: '/sales/pipeline', icon: Users, label: 'Leads' },
    { to: '/sales/history', icon: DollarSign, label: 'Sales' },
    { to: '/sales/tasks', icon: CheckSquare, label: 'Tasks' },
    { to: '/profile', icon: User, label: 'Profile' }
  ];

  if (user.role === 'Manager') {
    navItems.unshift({ to: '/manager', icon: LayoutDashboard, label: 'Hub' });
  } else if (user.role === 'CEO') {
    navItems = [
      { to: '/ceo/dashboard', icon: LayoutDashboard, label: 'CEO' },
      { to: '/manager', icon: Users, label: 'Manager' },
      { to: '/dm/dashboard', icon: DollarSign, label: 'Marketing' },
      { to: '/teacher', icon: CheckSquare, label: 'Teacher' },
      { to: '/student', icon: User, label: 'Student' }
    ];
  } else if (user.role === 'DM') {
    navItems.unshift({ to: '/dm/dashboard', icon: LayoutDashboard, label: 'DM' });
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-erp-background border-t-2 border-erp-border pb-safe z-40">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${isActive ? 'text-erp-primary' : 'text-erp-text/50'}`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-erp-primary/10 scale-110' : ''}`}>
                  <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};
