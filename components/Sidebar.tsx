
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FlaskConical, Database, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CrmLogo } from './Logo';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const { t, companyName } = useApp();

  // Get first letter for the logo box
  const initial = companyName.charAt(0).toUpperCase() || 'N';

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
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1.5 shadow-md text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors z-20"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* App Brand Header */}
      <div className={`border-b border-slate-100 dark:border-slate-800 ${isCollapsed ? 'p-4 flex flex-col items-center gap-4' : 'p-8 pb-4 xl:p-10 xl:pb-6'}`}>
        <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center mb-4' : 'gap-3 mb-6 xl:mb-8'}`}>
          <CrmLogo className={`${isCollapsed ? 'w-10 h-10' : 'w-10 h-10 xl:w-12 xl:h-12'} shadow-lg rounded-full shrink-0`} />
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-2xl xl:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">CRM Master</h1>
              <p className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest mt-1">Enterprise Edition</p>
            </div>
          )}
        </div>

        {/* Company Context Box */}
        <div 
          className={`bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 transition-all duration-300 ${
            isCollapsed ? 'p-2 flex justify-center w-full' : 'p-4 xl:p-5 flex items-center gap-4'
          }`}
        >
          <div className={`${isCollapsed ? 'w-10 h-10 text-lg' : 'w-12 h-12 xl:w-14 xl:h-14 text-xl xl:text-2xl'} bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white font-bold shadow-md shrink-0 transition-all`}>
            {initial}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <p className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Workspace</p>
              <p className="font-bold text-slate-800 dark:text-white truncate text-base xl:text-lg" title={companyName}>{companyName}</p>
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
