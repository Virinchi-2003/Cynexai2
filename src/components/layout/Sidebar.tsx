import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Users, DollarSign, CheckSquare, MessageCircle, User, LogOut, LayoutDashboard, Settings, BookOpen, Calendar, Video, Zap, Bot, Loader2, BarChart2, History } from 'lucide-react';
import { getCurrentUser, logout } from '../../lib/auth';
import { checkTeacherAssignment } from '../../lib/api/manager';
import { computeAccessiblePortals } from '../../lib/authUtils';
import { ThemeToggle } from '../ui/ThemeToggle';

export const Sidebar: React.FC<{ onNavClick?: () => void }> = ({ onNavClick }) => {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [accessLevels, setAccessLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const fetchAccess = async () => {
      const isTeacher = await checkTeacherAssignment(user.id);
      setAccessLevels(computeAccessiblePortals(user.role, isTeacher));
      setLoading(false);
    };
    fetchAccess();
  }, [user?.id, user?.role]);

  if (!user) return null;

  type NavItem = {to: string, icon: any, label: string, section: string};
  let allNavItems: NavItem[] = [];

  if (accessLevels.includes('Manager') && !accessLevels.includes('CEO')) {
    allNavItems.push(
      { to: '/manager', icon: LayoutDashboard, label: 'Manager Hub', section: 'Manager' },
      { to: '/manager/courses', icon: BookOpen, label: 'Course CMS', section: 'Manager' },
      { to: '/sales/pitch', icon: BookOpen, label: 'Sales Pitch', section: 'Manager' },
      { to: '/sales/pipeline', icon: Users, label: 'CRM Pipeline', section: 'Manager' },
      { to: '/sales/history', icon: DollarSign, label: 'Sales History', section: 'Manager' },
      { to: '/manager/timetable', icon: Calendar, label: 'Timetable', section: 'Manager' },
      { to: '/manager/users', icon: Users, label: 'Staff Mgmt', section: 'Manager' },
      { to: '/manager/gamification', icon: Zap, label: 'Game Config', section: 'Manager' },
      { to: '/manager/reports', icon: BarChart2, label: 'Reports', section: 'Manager' },
      { to: '/manager/tasks', icon: CheckSquare, label: 'Assign Tasks', section: 'Manager' }
    );
  }
  
  if (accessLevels.includes('Teacher') && !accessLevels.includes('CEO')) {
    allNavItems.push(
      { to: '/teacher', icon: LayoutDashboard, label: 'Teacher Hub', section: 'Teacher' },
      { to: '/teacher/timetable', icon: Calendar, label: 'Timetable', section: 'Teacher' },
      { to: '/teacher/live', icon: Video, label: 'Live Stream', section: 'Teacher' },
      { to: '/teacher/cms', icon: BookOpen, label: 'Course CMS', section: 'Teacher' },
      { to: '/teacher/attendance', icon: Users, label: 'Attendance', section: 'Teacher' },
      { to: '/teacher/tasks', icon: CheckSquare, label: 'Tasks', section: 'Teacher' },
      { to: '/teacher/settings', icon: Settings, label: 'AI Settings', section: 'Teacher' }
    );
  }
  
  if (accessLevels.includes('DM') && !accessLevels.includes('CEO')) {
    allNavItems.push(
      { to: '/dm/dashboard', icon: LayoutDashboard, label: 'DM Hub', section: 'Marketing' },
      { to: '/dm/planner', icon: Calendar, label: 'Content Planner', section: 'Marketing' },
      { to: '/dm/tasks', icon: CheckSquare, label: 'Tasks', section: 'Marketing' }
    );
  }
  
  if (accessLevels.includes('Sales/HR') && !accessLevels.includes('CEO')) {
    allNavItems.push(
      { to: '/sales/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'Sales & HR' },
      { to: '/sales/pitch', icon: BookOpen, label: 'Sales Pitch', section: 'Sales & HR' },
      { to: '/sales/pipeline', icon: Users, label: 'Pipeline', section: 'Sales & HR' },
      { to: '/sales/tasks', icon: CheckSquare, label: 'Tasks', section: 'Sales & HR' }
    );
  }
  
  if (accessLevels.includes('CEO')) {
    allNavItems.push(
      { to: '/ceo/dashboard', icon: LayoutDashboard, label: 'Master View', section: 'CEO' },
      { to: '/ceo/tasks', icon: CheckSquare, label: 'Tasks', section: 'CEO' },
      { to: '/ceo/users', icon: Users, label: 'User Admin', section: 'CEO' },
      { to: '/ceo/courses', icon: BookOpen, label: 'Course CMS', section: 'CEO' },
      { to: '/ceo/timetable', icon: Calendar, label: 'Timetable', section: 'CEO' },
      { to: '/ceo/sales-dashboard', icon: DollarSign, label: 'Sales Hub', section: 'CEO' },
      { to: '/ceo/sales-pipeline', icon: Users, label: 'CRM Pipeline', section: 'CEO' },
      { to: '/ceo/history', icon: History, label: 'Master History', section: 'CEO' },
      { to: '/sales/pitch', icon: BookOpen, label: 'Sales Pitch', section: 'CEO' },
      { to: '/ceo/dm-dashboard', icon: LayoutDashboard, label: 'Marketing Hub', section: 'CEO' },
      { to: '/ceo/ai-voice', icon: Bot, label: 'AI Voice Gen', section: 'CEO' },
      { to: '/teacher/settings', icon: Settings, label: 'AI Settings', section: 'CEO' },
      { to: '/manager/gamification', icon: Zap, label: 'Game Config', section: 'CEO' },
      { to: '/ceo/reports', icon: BarChart2, label: 'Reports', section: 'CEO' },
      { to: '/ceo/settings', icon: Settings, label: 'ERP Config', section: 'CEO' }
    );
  }

  // Common elements for internal staff
  if (user.role !== 'Student') {
     allNavItems.push({ to: '/chat', icon: MessageCircle, label: 'Chat Center', section: 'Shared' });
  }

  let portalName = "CynexAI CRM";
  if (accessLevels.includes('CEO')) portalName = "CEO Portal";
  else if (accessLevels.includes('Manager')) portalName = "Manager Hub";
  else if (accessLevels.includes('Teacher') && accessLevels.length === 1) portalName = "Teacher Portal";
  else if (accessLevels.includes('Student')) portalName = "Student Portal";
  else if (accessLevels.length > 1) portalName = "Staff Portal";

  // Group items by section
  const groupedNavs = allNavItems.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  return (
    <div className="h-full flex flex-col bg-erp-surface">
      <div className="p-6 border-b-2 border-erp-border flex items-center justify-between">
        <h2 className="font-display font-bold text-2xl text-erp-text truncate">{portalName}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
        {loading ? (
          <div className="flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-erp-primary" /></div>
        ) : (
          Object.entries(groupedNavs).map(([section, items]) => (
            <div key={section} className="space-y-2">
              <div className="text-xs font-bold text-erp-text/50 uppercase mb-2 px-2 tracking-wider">
                {section}
              </div>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavClick}
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
          ))
        )}
      </div>

      <div className="p-4 border-t-2 border-erp-border space-y-1">
        {/* Theme Toggle */}
        <ThemeToggle variant="sidebar" />

        <NavLink
          to="/profile"
          onClick={onNavClick}
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
          onClick={() => { logout(); onNavClick?.(); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <LogOut className="w-5 h-5" strokeWidth={2.5} />
          Log Out
        </button>
      </div>
    </div>
  );
};
