
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import CustomerProfile from './pages/CustomerProfile';
import SampleTracker from './pages/SampleTracker';
import DataManagement from './pages/DataManagement';
import Settings from './pages/Settings';
import { MOCK_CUSTOMERS, MOCK_SAMPLES } from './services/dataService';
import { Customer, Sample } from './types';
import { AppProvider } from './contexts/AppContext';

const App: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [samples, setSamples] = useState<Sample[]>(MOCK_SAMPLES);
  const [loading, setLoading] = useState(true);
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdateCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
  };

  const handleImportCustomers = (importedCustomers: Customer[]) => {
    setCustomers(prevCustomers => {
      // Create a map of existing customers by normalized name (lowercase, trimmed)
      // Explicitly define the Map type to prevent 'unknown' inference
      const customerMap = new Map<string, Customer>();
      prevCustomers.forEach(c => {
        customerMap.set(c.name.toLowerCase().trim(), c);
      });

      // Iterate through imported customers
      importedCustomers.forEach(newCust => {
        const normalizedName = newCust.name.toLowerCase().trim();
        const existing = customerMap.get(normalizedName);

        if (existing) {
          // UPDATE (Overwrite):
          // Preserve the existing ID to maintain Sample relationships
          newCust.id = existing.id;
          // Update the map with the new data, effectively replacing the old object
          customerMap.set(normalizedName, newCust);
        } else {
          // INSERT:
          // Add the new customer to the map
          customerMap.set(normalizedName, newCust);
        }
      });

      // Convert map values back to array
      return Array.from(customerMap.values());
    });
  };

  const handleImportSamples = (newSamples: Sample[]) => {
    setSamples(prev => [...prev, ...newSamples]);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AppProvider>
      <HashRouter>
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
          <Sidebar />
          <div className="flex-1 ml-80 overflow-y-auto relative">
             {showDemoBanner && (
               <div className="bg-blue-600 text-white text-xs font-bold text-center py-2 px-4 sticky top-0 z-50 flex justify-between items-center shadow-md">
                 <span>⚠ DEMO MODE: Showing generated sample data. Real client data is hidden. Import your data in Data Management.</span>
                 <button onClick={() => setShowDemoBanner(false)} className="text-white hover:text-blue-200 bg-blue-700 px-2 py-0.5 rounded">Dismiss</button>
               </div>
             )}
            <main className="max-w-[1920px] mx-auto p-10">
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
                <Route path="/samples" element={<SampleTracker samples={samples} />} />
                <Route path="/data-management" element={
                  <DataManagement 
                    customers={customers} 
                    samples={samples} 
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
    </AppProvider>
  );
};

export default App;
