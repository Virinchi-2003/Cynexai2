import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, LogOut, Loader2, MessageCircle } from 'lucide-react';
import { getCurrentUser, logout } from '../../lib/auth';
import { checkTeacherAssignment } from '../../lib/api/manager';
import { computeAccessiblePortals } from '../../lib/authUtils';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ALL_PAGES, PageDef } from '../../lib/pageRegistry';
import { getRolePages } from '../../lib/api/rolePageAccess';

export const Sidebar: React.FC<{ onNavClick?: () => void, isMobile?: boolean }> = ({ onNavClick, isMobile }) => {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [accessLevels, setAccessLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [navPages, setNavPages] = useState<PageDef[]>([]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchAccess = async () => {
      const isTeacher = await checkTeacherAssignment(user.id);
      const levels = computeAccessiblePortals(user.role, isTeacher);
      setAccessLevels(levels);

      // Build nav from dynamic page registry
      const enabledKeys = new Set<string>();
      for (const role of levels) {
        getRolePages(role).forEach(k => enabledKeys.add(k));
      }

      // Always include chat if not student
      if (user.role !== 'Student') enabledKeys.add('shared/chat');

      const pages = ALL_PAGES.filter(p => enabledKeys.has(p.key));
      setNavPages(pages);
      setLoading(false);
    };
    fetchAccess();
  }, [user?.id, user?.role]);

  if (!user) return null;

  let portalName = "CynexAI CRM";
  if (accessLevels.includes('CEO')) portalName = "CEO Portal";
  else if (accessLevels.includes('Manager')) portalName = "Manager Hub";
  else if (accessLevels.includes('Teacher') && accessLevels.length === 1) portalName = "Teacher Portal";
  else if (accessLevels.includes('Student')) portalName = "Student Portal";
  else if (accessLevels.length > 1) portalName = "Staff Portal";

  // Group by section
  const groupedNavs = navPages.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, PageDef[]>);

  return (
    <div className={`h-full flex flex-col ${isMobile ? '' : 'bg-erp-surface'}`}>
      {!isMobile && (
        <div className="p-6 border-b-2 border-erp-border flex items-center justify-between">
          <h2 className="font-display font-bold text-2xl text-erp-text truncate">{portalName}</h2>
        </div>
      )}
      
      <div className={isMobile ? '' : 'flex-1 overflow-y-auto py-6 px-4 space-y-6'}>
        {loading ? (
          <div className="flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-erp-primary" /></div>
        ) : (
          Object.entries(groupedNavs).map(([section, items]) => (
            <div key={section} className="space-y-2 mb-6">
              <div className="text-xs font-bold text-erp-text/50 uppercase mb-2 px-2 tracking-wider">
                {section}
              </div>
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavClick}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-black min-h-[44px] ${
                      isActive 
                        ? 'candy-btn-blue shadow-md' 
                        : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white hover:bg-black/5 active:scale-95'
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

      <div className={`${isMobile ? 'mt-4 pt-4 border-t border-slate-200 dark:border-white/10' : 'p-4 border-t-2 border-erp-border'} space-y-1`}>
        {/* Theme Toggle */}
        <ThemeToggle variant="sidebar" />

        <NavLink
          to="/profile"
          onClick={onNavClick}
          className={({ isActive }) => 
            `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-black min-h-[44px] ${
              isActive 
                ? 'candy-btn-blue shadow-md' 
                : 'text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white hover:bg-black/5 active:scale-95'
            }`
          }
        >
          <User className="w-5 h-5" strokeWidth={2.5} />
          Profile
        </NavLink>
        <button
          onClick={() => { logout(); onNavClick?.(); }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-95 min-h-[44px]"
        >
          <LogOut className="w-5 h-5" strokeWidth={2.5} />
          Log Out
        </button>
      </div>
    </div>
  );
};
