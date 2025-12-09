
import React, { useState } from 'react';
import { Sample, SampleStatus, Customer, ProductCategory, CrystalType, ProductForm } from '../types';
import { Card, Badge, Button, Modal, DaysCounter } from '../components/Common';
import { Search, Plus, Truck, CheckCircle2, FlaskConical, ClipboardList, ExternalLink, Filter } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { MOCK_CUSTOMERS } from '../services/dataService';
import { format } from 'date-fns';

interface SampleTrackerProps {
  samples: Sample[];
}

const SampleTracker: React.FC<SampleTrackerProps> = ({ samples }) => {
  const { t } = useApp();
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Filter States
  const [filterTestFinished, setFilterTestFinished] = useState<string>('all'); // all, finished, ongoing
  const [filterCrystalType, setFilterCrystalType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterForm, setFilterForm] = useState<string>('');

  // New Sample State
  const [newSample, setNewSample] = useState<Partial<Sample>>({
    customerId: '',
    status: 'Requested',
    isTestFinished: false,
    quantity: '',
    lastStatusDate: format(new Date(), 'yyyy-MM-dd'),
    productCategory: []
  });

  const filteredSamples = samples.filter(s => {
    const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.sampleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.productType.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTest = true;
    if (filterTestFinished === 'finished') matchesTest = s.isTestFinished === true;
    if (filterTestFinished === 'ongoing') matchesTest = s.isTestFinished === false;

    const matchesCrystal = filterCrystalType ? s.crystalType === filterCrystalType : true;
    const matchesCategory = filterCategory ? s.productCategory?.includes(filterCategory as ProductCategory) : true;
    const matchesForm = filterForm ? s.productForm === filterForm : true;

    return matchesSearch && matchesTest && matchesCrystal && matchesCategory && matchesForm;
  });

  const columns: { id: SampleStatus | string; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'Requested', label: 'Requested', icon: <ClipboardList size={16} />, color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
    { id: 'Processing', label: 'Processing', icon: <FlaskConical size={16} />, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400' },
    { id: 'Sent', label: 'Sent / Testing', icon: <Truck size={16} />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' },
    { id: 'Feedback Received', label: 'Feedback', icon: <CheckCircle2 size={16} />, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' }
  ];

  const getColumnId = (status: string) => {
    if (['Sent', 'Delivered', 'Testing'].includes(status)) return 'Sent';
    if (['Feedback Received', 'Closed'].includes(status)) return 'Feedback Received';
    return status;
  };

  const productCategories: ProductCategory[] = ['Agglomerated Diamond', 'Nano Diamond', 'Spherical Diamond', 'Diamond Ball', 'Micron', 'CVD'];
  const crystalTypes: CrystalType[] = ['Single Crystal', 'Polycrystalline'];
  const productForms: ProductForm[] = ['Powder', 'Suspension'];

  const toggleCategory = (cat: ProductCategory) => {
    const current = newSample.productCategory || [];
    if (current.includes(cat)) {
      setNewSample({ ...newSample, productCategory: current.filter(c => c !== cat) });
    } else {
      setNewSample({ ...newSample, productCategory: [...current, cat] });
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('sampleTracking')}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t('monitorSamples')}</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex">
             <button 
               onClick={() => setViewMode('board')}
               className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
             >
               {t('board')}
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
             >
               {t('list')}
             </button>
          </div>
          <Button className="flex items-center gap-2" onClick={() => setIsAddModalOpen(true)}><Plus size={16} /> {t('newSample')}</Button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <Card className="p-4 mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
         <div className="relative w-full max-w-xs">
           <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
           <input 
             type="text" 
             placeholder={t('search')}
             className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
         </div>
         
         <div className="flex flex-wrap gap-2 items-center text-sm">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mr-2">
              <Filter size={16} /> Filters:
            </div>
            
            <select 
              className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
              value={filterTestFinished}
              onChange={(e) => setFilterTestFinished(e.target.value)}
            >
              <option value="all">Test Status: All</option>
              <option value="finished">Test Finished</option>
              <option value="ongoing">Test Ongoing</option>
            </select>

            <select 
              className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
              value={filterCrystalType}
              onChange={(e) => setFilterCrystalType(e.target.value)}
            >
              <option value="">Crystal Type: All</option>
              {crystalTypes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Category: All</option>
              {productCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
              className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
              value={filterForm}
              onChange={(e) => setFilterForm(e.target.value)}
            >
              <option value="">Form: All</option>
              {productForms.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
         </div>
      </Card>

      {viewMode === 'board' && (
        <div className="flex-1 overflow-x-auto">
           <div className="flex gap-6 min-w-[1200px] h-full pb-4">
             {columns.map(col => {
               const colSamples = filteredSamples.filter(s => getColumnId(s.status) === col.id);
               
               return (
                 <div key={col.id} className="flex-1 min-w-[300px] bg-slate-50 dark:bg-slate-900 rounded-xl p-4 flex flex-col h-full border border-slate-200 dark:border-slate-800">
                   <div className={`flex items-center gap-2 mb-4 px-2 py-1 rounded-lg w-fit ${col.color}`}>
                     {col.icon}
                     <span className="font-bold text-sm uppercase">{col.label}</span>
                     <span className="ml-1 bg-white dark:bg-slate-800 bg-opacity-50 px-1.5 rounded-full text-xs">{colSamples.length}</span>
                   </div>

                   <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                     {colSamples.map(sample => (
                       <Card key={sample.id} className="p-3 hover:shadow-md cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500">
                         <div className="flex justify-between items-start mb-1">
                           <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{sample.serialNumber ? `#${sample.serialNumber}` : sample.id.toUpperCase()}</span>
                           <span className="text-xs text-slate-400 dark:text-slate-500">{sample.requestDate}</span>
                         </div>
                         <h4 className="font-bold text-slate-800 dark:text-white">{sample.customerName}</h4>
                         <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mt-1">{sample.sampleName || sample.productType}</p>
                         
                         <div className="flex flex-wrap gap-1 mt-2">
                            {sample.productCategory?.map(c => <Badge key={c} color="purple">{c}</Badge>)}
                            <Badge color="blue">{sample.productForm}</Badge>
                         </div>

                         <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                           {sample.statusDetails || sample.sampleDetails}
                         </div>
                         
                         {sample.trackingNumber && (
                           <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                             <Truck size={12} /> {sample.trackingNumber}
                           </div>
                         )}

                         <div className="mt-2 flex justify-between items-center">
                            <span className={`text-xs px-2 py-0.5 rounded ${sample.isTestFinished ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                               {sample.isTestFinished ? 'Test Finished' : 'Test Ongoing'}
                            </span>
                         </div>
                       </Card>
                     ))}
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      )}

      {viewMode === 'list' && (
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="overflow-auto">
             <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
               <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                 <tr>
                   <th className="p-4 whitespace-nowrap">ID / Serial</th>
                   <th className="p-4">Customer</th>
                   <th className="p-4">Sample Name</th>
                   <th className="p-4">Category</th>
                   <th className="p-4">Status Info</th>
                   <th className="p-4 whitespace-nowrap">Status Date</th>
                   <th className="p-4">Tracking</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredSamples.map(s => (
                   <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                     <td className="p-4 align-top font-mono text-xs">
                       <div>{s.id}</div>
                       {s.serialNumber && <div className="text-slate-500">SN: {s.serialNumber}</div>}
                       {s.sampleLabelLink && <a href={s.sampleLabelLink} target="_blank" className="text-blue-500 underline mt-1 block">Label PDF</a>}
                     </td>
                     <td className="p-4 align-top font-bold">{s.customerName}</td>
                     <td className="p-4 align-top">
                       <div className="font-medium text-blue-600 dark:text-blue-400">{s.sampleName}</div>
                       <div className="text-xs text-slate-500 mt-1">{s.quantity} | {s.crystalType} | {s.productForm}</div>
                     </td>
                     <td className="p-4 align-top">
                       <div className="flex flex-wrap gap-1">
                          {s.productCategory?.map(c => <span key={c} className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-xs">{c}</span>)}
                       </div>
                     </td>
                     <td className="p-4 align-top">
                       <Badge color={['Sent', 'Delivered'].includes(s.status) ? 'blue' : s.status === 'Feedback Received' ? 'green' : 'yellow'}>
                         {s.status}
                       </Badge>
                       <div className="text-xs mt-1 text-slate-500 dark:text-slate-400 line-clamp-2">{s.statusDetails}</div>
                     </td>
                     <td className="p-4 align-top whitespace-nowrap">
                       <div>{s.lastStatusDate}</div>
                       <div className="text-xs text-slate-400 mt-1">{s.isTestFinished ? 'Finished' : 'Ongoing'}</div>
                     </td>
                     <td className="p-4 align-top font-mono text-xs">
                        {s.trackingNumber ? (
                          <div className="flex items-center gap-1">
                            {s.trackingNumber}
                            {s.trackingLink && <a href={s.trackingLink} target="_blank" className="text-blue-500"><ExternalLink size={10}/></a>}
                          </div>
                        ) : '-'}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </Card>
      )}

      {/* New Sample Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Sample Record">
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer *</label>
              <select 
                className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                value={newSample.customerId}
                onChange={(e) => {
                  const customer = MOCK_CUSTOMERS.find(c => c.id === e.target.value);
                  setNewSample({...newSample, customerId: e.target.value, customerName: customer?.name || ''});
                }}
              >
                <option value="">Select Customer</option>
                {MOCK_CUSTOMERS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status *</label>
              <select 
                className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                value={newSample.status}
                onChange={(e) => setNewSample({...newSample, status: e.target.value as SampleStatus})}
              >
                <option value="Requested">Requested</option>
                <option value="Processing">Processing</option>
                <option value="Sent">Sent</option>
                <option value="Delivered">Delivered</option>
                <option value="Testing">Testing</option>
                <option value="Feedback Received">Feedback Received</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Serial Number</label>
               <input 
                 type="text"
                 className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                 placeholder="e.g. S-2025-001"
                 value={newSample.serialNumber || ''}
                 onChange={e => setNewSample({...newSample, serialNumber: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity *</label>
               <input 
                 type="text"
                 className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                 placeholder="e.g. 50g, 100ct, 1L"
                 value={newSample.quantity || ''}
                 onChange={e => setNewSample({...newSample, quantity: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Date</label>
               <input 
                 type="date"
                 className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                 value={newSample.lastStatusDate || ''}
                 onChange={e => setNewSample({...newSample, lastStatusDate: e.target.value})}
               />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sample Name *</label>
               <input 
                 type="text"
                 className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                 placeholder="Main Description"
                 value={newSample.sampleName || ''}
                 onChange={e => setNewSample({...newSample, sampleName: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Application</label>
               <input 
                 type="text"
                 className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                 placeholder="e.g. CMP, Lapping"
                 value={newSample.application || ''}
                 onChange={e => setNewSample({...newSample, application: e.target.value})}
               />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
             <div>
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Category (Multi-select)</label>
               <div className="grid grid-cols-2 gap-2">
                 {productCategories.map(cat => (
                   <label key={cat} className="flex items-center gap-2 text-sm cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={newSample.productCategory?.includes(cat)}
                       onChange={() => toggleCategory(cat)}
                       className="rounded text-blue-600"
                     />
                     <span className="text-slate-600 dark:text-slate-300">{cat}</span>
                   </label>
                 ))}
               </div>
             </div>
             <div className="space-y-4">
               <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Crystal Type</label>
                  <div className="flex gap-4">
                    {crystalTypes.map(c => (
                      <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
                         <input 
                           type="radio" 
                           name="crystalType"
                           checked={newSample.crystalType === c}
                           onChange={() => setNewSample({...newSample, crystalType: c})}
                           className="text-blue-600"
                         />
                         <span className="text-slate-600 dark:text-slate-300">{c}</span>
                      </label>
                    ))}
                  </div>
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Form</label>
                  <div className="flex gap-4">
                    {productForms.map(f => (
                      <label key={f} className="flex items-center gap-2 text-sm cursor-pointer">
                         <input 
                           type="radio" 
                           name="productForm"
                           checked={newSample.productForm === f}
                           onChange={() => setNewSample({...newSample, productForm: f})}
                           className="text-blue-600"
                         />
                         <span className="text-slate-600 dark:text-slate-300">{f}</span>
                      </label>
                    ))}
                  </div>
               </div>
             </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status Details / Summary</label>
             <textarea 
               className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 h-20"
               placeholder="Current status summary from me or customer..."
               value={newSample.statusDetails || ''}
               onChange={e => setNewSample({...newSample, statusDetails: e.target.value})}
             />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tracking Number</label>
               <input 
                 type="text"
                 className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                 value={newSample.trackingNumber || ''}
                 onChange={e => setNewSample({...newSample, trackingNumber: e.target.value})}
               />
            </div>
            <div>
               <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tracking Link</label>
               <input 
                 type="text"
                 className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                 placeholder="https://..."
                 value={newSample.trackingLink || ''}
                 onChange={e => setNewSample({...newSample, trackingLink: e.target.value})}
               />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
             <input 
                type="checkbox"
                id="testFinished"
                checked={newSample.isTestFinished}
                onChange={e => setNewSample({...newSample, isTestFinished: e.target.checked})}
                className="w-4 h-4 rounded text-blue-600"
             />
             <label htmlFor="testFinished" className="text-sm font-bold text-slate-700 dark:text-slate-300">Test Finished</label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              alert("In a real app, this would save to database.");
              setIsAddModalOpen(false);
            }}>Create Sample Record</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SampleTracker;
