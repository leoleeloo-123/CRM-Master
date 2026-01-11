
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
import DataManagement from './pages/DataManagement';
import Settings from './pages/Settings';
import { Customer, Sample } from './types';
import { AppProvider, useApp } from './contexts/AppContext';

// Inner component to use the context hooks
const AppContent: React.FC = () => {
  const { customers, samples, setCustomers, setSamples, isDemoData, setIsDemoData, refreshAllCustomerDates } = useApp();
  const [loading, setLoading] = useState(true);
  const [showDemoBanner, setShowDemoBanner] = useState(true);
  
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

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers((prev: Customer[]) => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  const handleImportCustomers = (importedCustomers: Customer[], override: boolean = false) => {
    // If override is true or using demo data, we replace the list
    if (override || isDemoData) {
      setCustomers(importedCustomers);
      if (isDemoData) {
        setIsDemoData(false); 
        setShowDemoBanner(false);
      }
      return;
    }

    // Otherwise Merge Logic
    const customerMap = new Map<string, Customer>();
    customers.forEach(c => {
      customerMap.set(c.name.toLowerCase().trim(), c);
    });

    importedCustomers.forEach(newCust => {
      const normalizedName = newCust.name.toLowerCase().trim();
      const existing = customerMap.get(normalizedName);

      if (existing) {
        // Update existing but keep ID
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
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
        
        {/* Adjusted left margin based on Sidebar state */}
        <div className={`flex-1 overflow-y-auto relative transition-all duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-80 xl:ml-96'}`}>
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
              <Route path="/exhibitions" element={<ExhibitionList />} />
              <Route path="/exhibitions/:id" element={<ExhibitionProfile />} />
              <Route path="/data-management" element={
                <DataManagement 
                  onImportCustomers={handleImportCustomers}
                  onImportSamples={handleImportSamples}
                />
              } />
              <Route path="/settings" element={<Settings />} />
              <Route path="/reports" element={<Navigate to="/data-management" replace />} />
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
