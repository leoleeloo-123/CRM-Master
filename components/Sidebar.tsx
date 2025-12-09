
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, FlaskConical, Database, Settings } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { CrmLogo } from './Logo';

const Sidebar: React.FC = () => {
  const { t, companyName } = useApp();

  // Get first letter for the logo box
  const initial = companyName.charAt(0).toUpperCase() || 'N';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-4 px-6 py-4 xl:py-5 text-base xl:text-xl font-medium rounded-xl transition-all ${
      isActive
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
    }`;

  // Icon sizing class for responsive scaling
  const iconClass = "w-6 h-6 xl:w-7 xl:h-7";

  return (
    <div className="w-80 xl:w-96 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 h-screen flex flex-col fixed left-0 top-0 z-10 transition-all duration-300 shadow-xl">
      {/* App Brand Header */}
      <div className="p-8 pb-4 xl:p-10 xl:pb-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-6 xl:mb-8">
          <CrmLogo className="w-10 h-10 xl:w-12 xl:h-12 shadow-lg rounded-full" />
          <div>
            <h1 className="text-2xl xl:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">CRM Master</h1>
            <p className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 font-medium uppercase tracking-widest mt-1">Enterprise Edition</p>
          </div>
        </div>

        {/* Company Context Box */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 xl:p-5 flex items-center gap-4 border border-slate-100 dark:border-slate-700">
          <div className="w-12 h-12 xl:w-14 xl:h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center text-white text-xl xl:text-2xl font-bold shadow-md">
            {initial}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">Workspace</p>
            <p className="font-bold text-slate-800 dark:text-white truncate text-base xl:text-lg" title={companyName}>{companyName}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 xl:px-6 xl:py-8 space-y-2 xl:space-y-3">
        <NavLink to="/" className={linkClass}>
          <LayoutDashboard className={iconClass} />
          {t('dashboard')}
        </NavLink>
        <NavLink to="/customers" className={linkClass}>
          <Users className={iconClass} />
          {t('customers')}
        </NavLink>
        <NavLink to="/samples" className={linkClass}>
          <FlaskConical className={iconClass} />
          {t('sampleTracking')}
        </NavLink>
        <NavLink to="/data-management" className={linkClass}>
          <Database className={iconClass} />
          {t('dataManagement')}
        </NavLink>
      </nav>

      <div className="p-6 xl:p-8 border-t border-slate-100 dark:border-slate-800">
        <NavLink to="/settings" className={linkClass}>
          <Settings className={iconClass} />
          {t('settings')}
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
