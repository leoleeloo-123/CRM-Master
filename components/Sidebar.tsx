
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FlaskConical, Database, Settings, ChevronLeft, ChevronRight, Presentation } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CrmLogo } from './Logo';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const { t, companyName } = useApp();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 py-4 xl:py-5 font-medium rounded-xl transition-all whitespace-nowrap group relative ${
      isCollapsed ? 'justify-center px-2' : 'px-6 text-base xl:text-xl'
    } ${
      isActive
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
    }`;

  // Icon sizing class for responsive scaling
  const iconClass = "w-6 h-6 xl:w-7 xl:h-7 shrink-0";

  return (
    <div 
      className={`${
        isCollapsed ? 'w-20' : 'w-80 xl:w-96'
      } bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 h-screen flex flex-col fixed left-0 top-0 z-10 transition-all duration-300 shadow-xl`}
    >
      {/* Toggle Button - Adjusted size and icon proportion */}
      <button
        onClick={toggleSidebar}
        className={`absolute -right-4 top-24 w-8 h-8 xl:w-9 xl:h-9 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all z-20 hover:scale-110 active:scale-90`}
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* App Brand Header */}
      <div className={`border-b border-slate-100 dark:border-slate-800 ${isCollapsed ? 'p-4 flex flex-col items-center gap-4' : 'p-8 pb-4 xl:p-10 xl:pb-6'}`}>
        <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <CrmLogo className={`${isCollapsed ? 'w-10 h-10' : 'w-10 h-10 xl:w-12 xl:h-12'} shadow-lg rounded-full shrink-0`} />
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-2xl xl:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">CRM Master</h1>
              <p className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest mt-1">Enterprise Edition</p>
            </div>
          )}
        </div>
      </div>

      <nav className={`flex-1 space-y-2 xl:space-y-3 ${isCollapsed ? 'px-3 py-6' : 'px-4 py-6 xl:px-6 xl:py-8'}`}>
        <NavLink to="/" className={linkClass} title={isCollapsed ? t('dashboard') : ''}>
          <LayoutDashboard className={iconClass} />
          {!isCollapsed && <span>{t('dashboard')}</span>}
        </NavLink>
        <NavLink to="/customers" className={linkClass} title={isCollapsed ? t('customers') : ''}>
          <Users className={iconClass} />
          {!isCollapsed && <span>{t('customers')}</span>}
        </NavLink>
        <NavLink to="/samples" className={linkClass} title={isCollapsed ? t('sampleTracking') : ''}>
          <FlaskConical className={iconClass} />
          {!isCollapsed && <span>{t('sampleTracking')}</span>}
        </NavLink>
        <NavLink to="/exhibitions" className={linkClass} title={isCollapsed ? t('exhibitions') : ''}>
          <Presentation className={iconClass} />
          {!isCollapsed && <span>{t('exhibitions')}</span>}
        </NavLink>
        <NavLink to="/data-management" className={linkClass} title={isCollapsed ? t('dataManagement') : ''}>
          <Database className={iconClass} />
          {!isCollapsed && <span>{t('dataManagement')}</span>}
        </NavLink>
      </nav>

      <div className={`border-t border-slate-100 dark:border-slate-800 ${isCollapsed ? 'p-3' : 'p-6 xl:p-8'}`}>
        <NavLink to="/settings" className={linkClass} title={isCollapsed ? t('settings') : ''}>
          <Settings className={iconClass} />
          {!isCollapsed && <span>{t('settings')}</span>}
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
