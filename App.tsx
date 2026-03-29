
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import CustomerProfile from './pages/CustomerProfile';
import SampleTracker from './pages/SampleTracker';
import SampleProfile from './pages/SampleProfile';
import ExhibitionList from './pages/ExhibitionList';
import ExhibitionProfile from './pages/ExhibitionProfile';
import FinanceTracker from './pages/FinanceTracker';
import DataManagement from './pages/DataManagement';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';
import { Customer, Sample } from './types';
import { AppProvider, useApp } from './contexts/AppContext';
import { customersApi } from './services/apiClient';

// Inner component to use the context hooks
const AppContent: React.FC = () => {
  const { customers, samples, setCustomers, setSamples, isDemoData, setIsDemoData, refreshAllCustomerDates } = useApp();
  const [loading, setLoading] = useState(true);
  const [showDemoBanner, setShowDemoBanner] = useState(true);
  
  // Auth State
  const [authMode, setAuthMode] = useState<'auth' | 'app'>('auth');
  const [storageMode, setStorageMode] = useState<'team' | 'local'>('local');
  const [user, setUser] = useState<any>(null);
  const [hasSeenAuth, setHasSeenAuth] = useState(false);
  
  useEffect(() => {
    // Check if user has made a choice before
    const savedUser = localStorage.getItem('crm_user');
    const savedMode = localStorage.getItem('crm_storage_mode');
    const savedDefaultMode = localStorage.getItem('crm_default_mode');
    
    if (savedDefaultMode) {
      // User has a default preference, use it
      setStorageMode(savedDefaultMode as 'team' | 'local');
      if (savedUser && savedDefaultMode === 'team') {
        setUser(JSON.parse(savedUser));
      }
      setAuthMode('app');
    }
    // Otherwise show auth page for them to choose
  }, []);
  
  const handleLogin = (loggedInUser: any, mode: 'team' | 'local', setAsDefault: boolean = false) => {
    setUser(loggedInUser);
    setStorageMode(mode);
    setAuthMode('app');
    
    if (mode === 'team' && loggedInUser) {
      localStorage.setItem('crm_user', JSON.stringify(loggedInUser));
    }
    localStorage.setItem('crm_storage_mode', mode);
    
    if (setAsDefault) {
      localStorage.setItem('crm_default_mode', mode);
    }
  };
  
  const handleLogout = () => {
    setUser(null);
    setStorageMode('local');
    setAuthMode('auth');
    localStorage.removeItem('crm_user');
    // Keep crm_storage_mode and crm_default_mode for next time
  };
  
  const handleSwitchMode = () => {
    setAuthMode('auth');
  };
  
  // Polling for data updates (every 60 seconds)
  const [lastUpdateInfo, setLastUpdateInfo] = useState<{user: string, time: string} | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  
  useEffect(() => {
    if (storageMode !== 'team') return;
    
    const checkUpdates = async () => {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          import.meta.env.VITE_SUPABASE_URL || 'https://cnptexlyzhfkqtlorxjt.supabase.co',
          import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bq1-NO6E0uAoDLWviGtgfA_tnCwC245'
        );
        
        const { data } = await supabase
          .from('customers')
          .select('last_updated_by, updated_at')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();
        
        if (data && data.last_updated_by) {
          setLastUpdateInfo({ user: data.last_updated_by, time: data.updated_at });
          // Check if update is newer than 2 minutes
          const updateTime = new Date(data.updated_at).getTime();
          const now = new Date().getTime();
          if (now - updateTime < 120000) {
            setHasUpdate(true);
          }
        }
      } catch (e) {
        // Silent fail
      }
    };
    
    checkUpdates();
    const interval = setInterval(checkUpdates, 60000); // 1 minute
    return () => clearInterval(interval);
  }, [storageMode]);
  
  // Sidebar State with persistence
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  useEffect(() => {
    // Simulate initial load check
    const timer = setTimeout(() => {
      setLoading(false);
      // Auto-trigger global date refresh on app load
      refreshAllCustomerDates();
    }, 500);
    return () => clearTimeout(timer);
  }, [refreshAllCustomerDates]);

  const handleUpdateCustomer = async (updatedCustomer: Customer) => {
    const storageMode = localStorage.getItem('crm_storage_mode') as 'team' | 'local' || 'local';
    
    // If in team mode, save to Supabase first
    if (storageMode === 'team') {
      try {
        await customersApi.update(updatedCustomer.id, updatedCustomer);
      } catch (err: any) {
        console.error('Failed to update customer:', err);
        alert('Failed to save changes: ' + err.message);
        return; // Don't update local state if API call failed
      }
    }
    
    // Update local state
    setCustomers((prev: Customer[]) => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    
    // Sync DDL to Starred Samples
    setSamples((prev: Sample[]) => prev.map(s => {
      if (s.customerId === updatedCustomer.id && s.isStarredSample) {
        return { ...s, nextActionDate: updatedCustomer.nextActionDate };
      }
      return s;
    }));
  };

  const handleImportCustomers = (importedCustomers: Customer[], override: boolean = false) => {
    if (override || isDemoData) {
      setCustomers(importedCustomers);
      if (isDemoData) {
        setIsDemoData(false); 
        setShowDemoBanner(false);
      }
      return;
    }

    const customerMap = new Map<string, Customer>();
    customers.forEach(c => {
      customerMap.set(c.name.toLowerCase().trim(), c);
    });

    importedCustomers.forEach(newCust => {
      const normalizedName = newCust.name.toLowerCase().trim();
      const existing = customerMap.get(normalizedName);

      if (existing) {
        newCust.id = existing.id;
        customerMap.set(normalizedName, newCust);
      } else {
        customerMap.set(normalizedName, newCust);
      }
    });

    setCustomers(Array.from(customerMap.values()));
  };

  const handleImportSamples = (newSamples: Sample[], override: boolean = false) => {
    if (isDemoData || override) {
      setSamples(newSamples);
      if (isDemoData) setIsDemoData(false);
    } else {
      setSamples((prev: Sample[]) => [...prev, ...newSamples]);
    }
  };

  if (authMode === 'auth') {
    return (
      <AuthPage 
        onLogin={handleLogin} 
        onSkip={(setAsDefault = false) => handleLogin(null, 'local', setAsDefault)} 
      />
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          toggleSidebar={toggleSidebar}
          user={user}
          storageMode={storageMode}
          onLogout={user ? handleLogout : undefined}
          onSwitchMode={handleSwitchMode}
        />
        
        <div className={`flex-1 overflow-y-auto relative transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-80 xl:ml-96'}`}>
            {storageMode === 'team' && lastUpdateInfo && (
              <div className={`text-xs xl:text-sm font-bold text-center py-2 px-4 sticky top-0 z-50 flex justify-between items-center shadow-md transition-colors ${hasUpdate ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'}`}>
                <span>
                  {hasUpdate ? '⚠ ' : '✓ '}
                  最后更新: {lastUpdateInfo.user} @ {new Date(lastUpdateInfo.time).toLocaleTimeString()}
                  {hasUpdate && ' (有新数据)'}
                </span>
                {hasUpdate && (
                  <button 
                    onClick={() => window.location.reload()} 
                    className="text-white hover:text-amber-100 bg-amber-700 px-2 py-0.5 rounded"
                  >
                    刷新
                  </button>
                )}
              </div>
            )}
            {isDemoData && showDemoBanner && (
              <div className="bg-blue-600 text-white text-xs xl:text-sm font-bold text-center py-2 px-4 sticky top-0 z-50 flex justify-between items-center shadow-md">
                <span>⚠ DEMO MODE: Showing generated sample data. Real client data is hidden. Import your data in Data Management.</span>
                <button onClick={() => setShowDemoBanner(false)} className="text-white hover:text-blue-200 bg-blue-700 px-2 py-0.5 rounded">Dismiss</button>
              </div>
            )}
          <main className="max-max-w-[2560px] mx-auto p-8 xl:p-12 2xl:p-16">
            <Routes>
              <Route path="/" element={<Dashboard customers={customers} samples={samples} />} />
              <Route path="/customers" element={<CustomerList customers={customers} />} />
              <Route path="/customers/:id" element={
                <CustomerProfile 
                  customers={customers} 
                  samples={samples} 
                  onUpdateCustomer={handleUpdateCustomer} 
                />
              } />
              <Route path="/samples" element={<SampleTracker samples={samples} customers={customers} />} />
              <Route path="/samples/:id" element={<SampleProfile />} />
              <Route path="/finance" element={<FinanceTracker />} />
              <Route path="/exhibitions" element={<ExhibitionList />} />
              <Route path="/exhibitions/:id" element={<ExhibitionProfile />} />
              <Route path="/data-management" element={
                <DataManagement 
                  onImportCustomers={handleImportCustomers}
                  onImportSamples={handleImportSamples}
                />
              } />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
