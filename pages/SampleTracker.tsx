
import React, { useState } from 'react';
import { Sample, SampleStatus, Customer, ProductCategory, CrystalType, ProductForm, GradingStatus } from '../types';
import { Card, Badge, Button, Modal } from '../components/Common';
import { Search, Plus, Truck, CheckCircle2, FlaskConical, ClipboardList, ExternalLink, Filter, CalendarDays } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, differenceInDays, parseISO, isValid } from 'date-fns';

interface SampleTrackerProps {
  samples: Sample[];
  customers: Customer[];
}

const SampleTracker: React.FC<SampleTrackerProps> = ({ samples, customers }) => {
  const { t, setSamples, masterProducts, syncSampleToCatalog } = useApp();
  const [viewMode, setViewMode] = useState<'list' | 'board'>('board');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Filter States
  const [filterTestFinished, setFilterTestFinished] = useState<string>('all'); 
  const [filterCrystalType, setFilterCrystalType] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterForm, setFilterForm] = useState<string>('');

  // Sample State for Form
  const [currentSample, setCurrentSample] = useState<Partial<Sample>>({
    customerId: '',
    status: 'Requested',
    isTestFinished: false,
    quantity: '',
    lastStatusDate: format(new Date(), 'yyyy-MM-dd'),
    productCategory: [],
    sampleIndex: 1,
    isGraded: 'Graded',
    crystalType: 'Single Crystal',
    productForm: 'Powder'
  });

  const filteredSamples = samples.filter(s => {
    const matchesSearch = s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.sampleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.sampleSKU || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTest = true;
    if (filterTestFinished === 'finished') matchesTest = s.isTestFinished === true;
    if (filterTestFinished === 'ongoing') matchesTest = s.isTestFinished === false;

    const matchesCrystal = filterCrystalType ? s.crystalType === filterCrystalType : true;
    const matchesCategory = filterCategory ? s.productCategory?.includes(filterCategory as ProductCategory) : true;
    const matchesForm = filterForm ? s.productForm === filterForm : true;

    return matchesSearch && matchesTest && matchesCrystal && matchesCategory && matchesForm;
  });

  const columns: { id: SampleStatus | string; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'Requested', label: 'Requested', icon: <ClipboardList className="w-4 h-4 xl:w-6 xl:h-6" />, color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
    { id: 'Processing', label: 'Processing', icon: <FlaskConical className="w-4 h-4 xl:w-6 xl:h-6" />, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400' },
    { id: 'Sent', label: 'Sent / Testing', icon: <Truck className="w-4 h-4 xl:w-6 xl:h-6" />, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' },
    { id: 'Feedback Received', label: 'Feedback', icon: <CheckCircle2 className="w-4 h-4 xl:w-6 xl:h-6" />, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400' }
  ];

  const getColumnId = (status: string) => {
    if (['Sent', 'Delivered', 'Testing'].includes(status)) return 'Sent';
    if (['Feedback Received', 'Closed'].includes(status)) return 'Feedback Received';
    return status;
  };

  const handleOpenEdit = (sample: Sample) => {
     setCurrentSample({
       ...sample,
       // Force update date to today on edit open, as per requirement
       lastStatusDate: format(new Date(), 'yyyy-MM-dd')
     });
     setIsAddModalOpen(true);
  };

  const handleOpenNew = () => {
    setCurrentSample({
      customerId: '',
      customerName: '',
      status: 'Requested',
      isTestFinished: false,
      quantity: '',
      lastStatusDate: format(new Date(), 'yyyy-MM-dd'),
      productCategory: [],
      sampleIndex: 1,
      isGraded: 'Graded',
      crystalType: 'Single Crystal',
      productForm: 'Powder',
      statusDetails: '',
      sampleName: '' // Will be populated by catalog selection
    });
    setIsAddModalOpen(true);
  };

  const handleProductSelect = (productName: string) => {
    const product = masterProducts.find(p => p.productName === productName);
    if (product) {
      // Reverse Sync: Catalog -> Sample Form
      setCurrentSample(prev => ({
        ...prev,
        sampleName: product.productName,
        crystalType: product.crystalType,
        productCategory: product.productCategory,
        productForm: product.productForm,
        originalSize: product.originalSize,
        processedSize: product.processedSize || ''
      }));
    } else {
       // Manual mode if "Custom" or cleared
       setCurrentSample(prev => ({
         ...prev,
         sampleName: productName // Use raw text if not in catalog yet
       }));
    }
  };

  const saveSample = () => {
     if (!currentSample.customerId || !currentSample.sampleName) {
       alert('Please fill required fields (Customer, Product)');
       return;
     }
     
     // Forward Sync: Ensure this product exists in Catalog
     syncSampleToCatalog(currentSample);

     // Update existing or add new
     setSamples(prev => {
       const exists = prev.find(s => s.id === currentSample.id);
       if (exists) {
         return prev.map(s => s.id === currentSample.id ? { ...s, ...currentSample } as Sample : s);
       } else {
         const newId = `s_${Date.now()}`;
         return [...prev, { ...currentSample, id: newId } as Sample];
       }
     });
     
     setIsAddModalOpen(false);
  };

  // Helper to calculate days since update with color
  const renderDaysSinceUpdate = (dateStr: string) => {
    if (!dateStr || !isValid(parseISO(dateStr))) return <span className="text-slate-400">-</span>;
    const diff = differenceInDays(new Date(), parseISO(dateStr));
    
    let colorClass = "text-slate-600 dark:text-slate-300";
    if (diff <= 7) colorClass = "text-emerald-600 font-bold";
    else if (diff <= 30) colorClass = "text-amber-500 font-bold";
    else colorClass = "text-red-500 font-bold";

    return (
      <div className={`flex flex-col items-center leading-tight ${colorClass}`}>
        <span className="text-lg">{diff}</span>
        <span className="text-[10px] uppercase font-normal text-slate-400">Days Ago</span>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-2rem)] xl:h-[calc(100vh-3rem)] flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl xl:text-4xl font-bold text-slate-800 dark:text-white mb-1">{t('sampleTracking')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm xl:text-lg">{t('monitorSamples')}</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex">
             <button 
               onClick={() => setViewMode('board')}
               className={`px-3 py-1 xl:px-5 xl:py-2 text-sm xl:text-base font-medium rounded-md transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
             >
               {t('board')}
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={`px-3 py-1 xl:px-5 xl:py-2 text-sm xl:text-base font-medium rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
             >
               {t('list')}
             </button>
          </div>
          <Button className="flex items-center gap-2" onClick={handleOpenNew}><Plus className="w-4 h-4 xl:w-5 xl:h-5" /> {t('newSample')}</Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4 xl:p-6 mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
         <div className="relative w-full max-w-xs xl:max-w-md">
           <Search className="absolute left-3 top-2.5 xl:top-3.5 text-slate-400 w-4 h-4 xl:w-6 xl:h-6" />
           <input 
             type="text" 
             placeholder="Search Name, SKU..."
             className="w-full pl-9 xl:pl-12 pr-4 py-2 xl:py-3 text-sm xl:text-lg border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
         </div>
         
         <div className="flex flex-wrap gap-2 items-center text-sm xl:text-base">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 mr-2">
              <Filter className="w-4 h-4 xl:w-5 xl:h-5" /> Filters:
            </div>
            
            <select 
              className="border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 xl:px-3 xl:py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
              value={filterTestFinished}
              onChange={(e) => setFilterTestFinished(e.target.value)}
            >
              <option value="all">Test Status: All</option>
              <option value="finished">Test Finished</option>
              <option value="ongoing">Test Ongoing</option>
            </select>
            {/* ... other filters ... */}
         </div>
      </Card>

      {viewMode === 'board' && (
        <div className="flex-1 overflow-x-auto">
           <div className="flex gap-6 min-w-[1200px] xl:min-w-[1600px] h-full pb-4">
             {columns.map(col => {
               const colSamples = filteredSamples.filter(s => getColumnId(s.status) === col.id);
               return (
                 <div key={col.id} className="flex-1 min-w-[300px] xl:min-w-[400px] bg-slate-50 dark:bg-slate-900 rounded-xl p-4 xl:p-6 flex flex-col h-full border border-slate-200 dark:border-slate-800">
                   <div className={`flex items-center gap-2 mb-4 px-2 py-1 xl:px-3 xl:py-2 rounded-lg w-fit ${col.color}`}>
                     {col.icon}
                     <span className="font-bold text-sm xl:text-lg uppercase">{col.label}</span>
                     <span className="ml-1 bg-white dark:bg-slate-800 bg-opacity-50 px-1.5 py-0.5 rounded-full text-xs xl:text-sm">{colSamples.length}</span>
                   </div>

                   <div className="space-y-3 xl:space-y-5 overflow-y-auto flex-1 pr-2">
                     {colSamples.map(sample => (
                       <Card key={sample.id} className="p-3 xl:p-5 hover:shadow-md cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500" onClick={() => handleOpenEdit(sample)}>
                         <div className="flex justify-between items-start mb-1">
                           <span className="text-xs xl:text-sm font-bold text-slate-500 dark:text-slate-400">
                             {sample.sampleIndex ? `#${sample.sampleIndex}` : ''} {sample.sampleSKU ? `(${sample.sampleSKU})` : ''}
                           </span>
                           <span className="text-xs xl:text-sm text-slate-400 dark:text-slate-500">{sample.requestDate}</span>
                         </div>
                         <h4 className="font-bold text-slate-800 dark:text-white text-base xl:text-xl">{sample.customerName}</h4>
                         <p className="text-sm xl:text-lg text-blue-600 dark:text-blue-400 font-bold mt-1">{sample.sampleName}</p>
                         
                         <div className="flex flex-wrap gap-1 mt-2 xl:mt-3">
                            <Badge color="blue">{sample.productForm}</Badge>
                            <Badge color="purple">{sample.crystalType}</Badge>
                         </div>

                         <div className="mt-2 text-xs xl:text-base text-slate-600 dark:text-slate-300 line-clamp-2">
                           {sample.statusDetails}
                         </div>
                         
                         <div className="mt-2 xl:mt-3 flex justify-between items-center">
                            <span className={`text-xs xl:text-sm px-2 py-0.5 rounded ${sample.isTestFinished ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                               {sample.isTestFinished ? 'Finished' : 'Ongoing'}
                            </span>
                            {/* Days Since Update Metric on Card */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                               <CalendarDays size={12} className="text-slate-400"/>
                               {renderDaysSinceUpdate(sample.lastStatusDate)}
                            </div>
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
             <table className="w-full text-left text-sm xl:text-base text-slate-700 dark:text-slate-300">
               <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                 <tr>
                   <th className="p-4 xl:p-6">Idx</th>
                   <th className="p-4 xl:p-6">Customer</th>
                   <th className="p-4 xl:p-6">Sample Info</th>
                   <th className="p-4 xl:p-6">Specs</th>
                   <th className="p-4 xl:p-6">Status Info</th>
                   <th className="p-4 xl:p-6 whitespace-nowrap text-center">Since Update</th>
                   <th className="p-4 xl:p-6">Test</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredSamples.map(s => (
                   <tr key={s.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" onClick={() => handleOpenEdit(s)}>
                     <td className="p-4 xl:p-6 align-top font-mono font-bold text-slate-500">{s.sampleIndex}</td>
                     <td className="p-4 xl:p-6 align-top font-bold text-base xl:text-lg">{s.customerName}</td>
                     <td className="p-4 xl:p-6 align-top">
                       <div className="font-medium text-blue-600 dark:text-blue-400 text-base xl:text-lg">{s.sampleName}</div>
                       <div className="text-xs xl:text-sm text-slate-500 mt-1">{s.sampleSKU ? `SKU: ${s.sampleSKU}` : ''}</div>
                     </td>
                     <td className="p-4 xl:p-6 align-top text-xs xl:text-sm">
                        <div>{s.productForm} | {s.crystalType}</div>
                        <div>{s.originalSize} -&gt; {s.processedSize}</div>
                        <div>{s.isGraded}</div>
                        <div className="font-semibold">{s.quantity}</div>
                     </td>
                     <td className="p-4 xl:p-6 align-top max-w-xs">
                       <Badge color={['Sent', 'Delivered'].includes(s.status) ? 'blue' : s.status === 'Feedback Received' ? 'green' : 'yellow'}>
                         {s.status}
                       </Badge>
                       <div className="text-xs xl:text-sm mt-1 text-slate-500 dark:text-slate-400 line-clamp-3 whitespace-pre-wrap">
                          {s.statusDetails}
                       </div>
                     </td>
                     <td className="p-4 xl:p-6 align-top text-center">
                       {renderDaysSinceUpdate(s.lastStatusDate)}
                     </td>
                     <td className="p-4 xl:p-6 align-top">
                       {s.isTestFinished ? <Badge color="green">Yes</Badge> : <Badge color="gray">No</Badge>}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </Card>
      )}

      {/* New/Edit Sample Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={currentSample.id ? "Edit Sample" : "Create New Sample"}>
        <div className="space-y-6">
          
          {/* Customer & Index Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Customer *</label>
              <select 
                className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                value={currentSample.customerId}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value);
                  setCurrentSample({...currentSample, customerId: e.target.value, customerName: customer?.name || ''});
                }}
                disabled={!!currentSample.id} // Disable changing customer on edit
              >
                <option value="">Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Index (序号) *</label>
               <input 
                 type="number"
                 className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                 value={currentSample.sampleIndex || 1}
                 onChange={e => setCurrentSample({...currentSample, sampleIndex: parseInt(e.target.value)})}
               />
            </div>
          </div>

          {/* Master Product Selection / Name */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
             <div className="flex flex-col md:flex-row gap-4">
               <div className="flex-1">
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Product Catalog *</label>
                 <select 
                    className="w-full border rounded-lg p-2 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                    value={masterProducts.find(p => p.productName === currentSample.sampleName) ? currentSample.sampleName : ''}
                    onChange={(e) => handleProductSelect(e.target.value)}
                 >
                   <option value="">Select or Custom...</option>
                   {masterProducts.map(p => (
                     <option key={p.id} value={p.productName}>{p.productName}</option>
                   ))}
                 </select>
               </div>
               <div className="flex-1">
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Generated Product Name</label>
                 <input 
                   type="text"
                   className="w-full border rounded-lg p-2 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500"
                   value={currentSample.sampleName || ''}
                   readOnly
                   placeholder="Auto-generated based on specs below..."
                 />
                 <p className="text-xs text-slate-400 mt-1">
                   Logic: Crystal + Category + Form - Orig {'>'} Processed
                 </p>
               </div>
             </div>
             
             {/* Read-Only Spec Preview (To Confirm Fill) */}
             <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4 text-xs text-slate-500">
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <span className="block font-bold">Crystal</span> {currentSample.crystalType || '-'}
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <span className="block font-bold">Category</span> {currentSample.productCategory?.join(',') || '-'}
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <span className="block font-bold">Form</span> {currentSample.productForm || '-'}
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <span className="block font-bold">Original</span> {currentSample.originalSize || '-'}
                </div>
                <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <span className="block font-bold">Processed</span> {currentSample.processedSize || '-'}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Sample SKU</label>
               <input 
                 type="text"
                 className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                 value={currentSample.sampleSKU || ''}
                 onChange={e => setCurrentSample({...currentSample, sampleSKU: e.target.value})}
               />
             </div>
             <div>
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Grading</label>
                  <select 
                      className="w-full text-sm border rounded p-2 dark:bg-slate-900 dark:border-slate-600"
                      value={currentSample.isGraded}
                      onChange={(e) => setCurrentSample({...currentSample, isGraded: e.target.value as GradingStatus})}
                   >
                     <option value="Graded">Graded</option>
                     <option value="Ungraded">Ungraded</option>
                   </select>
             </div>
          </div>

          {/* Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Quantity</label>
                <input className="w-full text-sm border rounded p-2 dark:bg-slate-900 dark:border-slate-600" value={currentSample.quantity || ''} onChange={e => setCurrentSample({...currentSample, quantity: e.target.value})} placeholder="e.g. 50g"/>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Application</label>
                <input className="w-full text-sm border rounded p-2 dark:bg-slate-900 dark:border-slate-600" value={currentSample.application || ''} onChange={e => setCurrentSample({...currentSample, application: e.target.value})} />
             </div>
          </div>

          {/* Status & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
             <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Current Status</label>
                <select 
                  className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                  value={currentSample.status}
                  onChange={(e) => setCurrentSample({...currentSample, status: e.target.value as SampleStatus})}
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
             <div>
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Status Date (Auto-updates)</label>
               <input 
                 type="date"
                 className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                 value={currentSample.lastStatusDate || ''}
                 onChange={e => setCurrentSample({...currentSample, lastStatusDate: e.target.value})}
               />
             </div>
             <div className="flex items-center gap-2 h-full pt-6">
                <input 
                  type="checkbox"
                  id="testFinished"
                  checked={currentSample.isTestFinished}
                  onChange={e => setCurrentSample({...currentSample, isTestFinished: e.target.checked})}
                  className="w-5 h-5 rounded text-blue-600"
                />
                <label htmlFor="testFinished" className="font-bold text-slate-700 dark:text-slate-300">Test Finished</label>
             </div>
          </div>
          
          <div>
             <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Status Details / History</label>
             <p className="text-xs text-slate-400 mb-2">Use '|||' to separate multiple entries. Add date in 【】.</p>
             <textarea 
               className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 h-24 font-mono text-sm"
               value={currentSample.statusDetails || ''}
               onChange={e => setCurrentSample({...currentSample, statusDetails: e.target.value})}
               placeholder="【2025-01-01】Details..."
             />
          </div>

          {/* Links - Removed Label PDF Link input here */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tracking #</label>
                <input className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600" value={currentSample.trackingNumber || ''} onChange={e => setCurrentSample({...currentSample, trackingNumber: e.target.value})} />
             </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
            <Button onClick={saveSample}>Save Sample Record</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SampleTracker;
