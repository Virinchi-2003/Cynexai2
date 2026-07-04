import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Users, DollarSign, CheckSquare, MessageCircle, User, LogOut, LayoutDashboard, Settings, BookOpen, Calendar, Video } from 'lucide-react';
import { getCurrentUser, logout } from '../../lib/auth';

export const Sidebar: React.FC = () => {
  const user = getCurrentUser();
  const navigate = useNavigate();

  if (!user) return null;

  let navItems: {to: string, icon: any, label: string}[] = [];

  if (user.role === 'Manager') {
    navItems = [
      { to: '/manager', icon: LayoutDashboard, label: 'Manager Hub' },
      { to: '/manager/courses', icon: BookOpen, label: 'Course CMS' },
      { to: '/manager/timetable', icon: Calendar, label: 'Timetable' },
      { to: '/manager/users', icon: Users, label: 'Staff Mgmt' },
      { to: '/manager/tasks', icon: CheckSquare, label: 'Assign Tasks' },
    ];
  } else if (user.role === 'Teacher') {
    navItems = [
      { to: '/teacher', icon: LayoutDashboard, label: 'Teacher Hub' },
      { to: '/teacher/live', icon: Video, label: 'Live Stream' },
      { to: '/teacher/cms', icon: BookOpen, label: 'Course CMS' },
      { to: '/teacher/attendance', icon: Users, label: 'Attendance' },
    ];
  } else if (user.role === 'DM') {
    navItems = [
      { to: '/dm/dashboard', icon: LayoutDashboard, label: 'DM Hub' },
      { to: '/dm/planner', icon: Calendar, label: 'Content Planner' },
    ];
  } else if (user.role === 'Sales/HR') {
    navItems = [
      { to: '/sales/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/sales/pipeline', icon: Users, label: 'Pipeline' },
      { to: '/sales/history', icon: DollarSign, label: 'Sales' },
      { to: '/sales/tasks', icon: CheckSquare, label: 'Tasks' },
      { to: '/sales/chat', icon: MessageCircle, label: 'Chat' },
    ];
  } else if (user.role === 'CEO') {
    navItems = [
      { to: '/ceo/dashboard', icon: LayoutDashboard, label: 'CEO Hub' },
      { to: '/ceo/courses', icon: BookOpen, label: 'Course CMS' },
      { to: '/ceo/settings', icon: Settings, label: 'Dev Settings' },
      { to: '/manager', icon: Users, label: 'Manager View' },
    ];
  }

  return (
    <div className="h-full flex flex-col bg-erp-surface">
      <div className="p-6 border-b-2 border-erp-border flex items-center justify-between">
        <h2 className="font-display font-bold text-2xl text-erp-text truncate">CynexAI CRM</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        <div className="text-xs font-bold text-erp-text/50 uppercase mb-4 px-2 tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
                isActive 
                  ? 'bg-erp-primary text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]' 
                  : 'text-erp-text/70 hover:bg-erp-background hover:text-erp-text'
              }`
            }
          >
            <item.icon className="w-5 h-5" strokeWidth={2.5} />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t-2 border-erp-border space-y-2">
        <NavLink
          to="/profile"
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
              isActive 
                ? 'bg-erp-primary text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]' 
                : 'text-erp-text/70 hover:bg-erp-background hover:text-erp-text'
            }`
          }
        >
          <User className="w-5 h-5" strokeWidth={2.5} />
          Profile
        </NavLink>
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-red-500 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5" strokeWidth={2.5} />
          Log Out
        </button>
      </div>
    </div>
  );
};
