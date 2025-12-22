
import React, { useState } from 'react';
import { Sample, SampleStatus, Customer, ProductCategory, CrystalType, ProductForm, GradingStatus, TestStatus } from '../types';
import { Card, Badge, Button, Modal } from '../components/Common';
import { Search, Plus, Truck, CheckCircle2, FlaskConical, ClipboardList, Filter, MoreHorizontal, GripVertical, Trash2, ArrowLeft, ArrowRight, CalendarDays, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format, differenceInDays, isValid } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface SampleTrackerProps {
  samples: Sample[];
  customers: Customer[];
}

const SampleTracker: React.FC<SampleTrackerProps> = ({ samples, customers }) => {
  const navigate = useNavigate();
  const { t, setSamples, masterProducts, syncSampleToCatalog, tagOptions, setTagOptions } = useApp();
  
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterTestFinished, setFilterTestFinished] = useState<string>('ongoing'); 
  
  // New Filters
  const [filterCrystal, setFilterCrystal] = useState<string>('');
  const [filterForm, setFilterForm] = useState<string>('');
  const [filterCustomer, setFilterCustomer] = useState<string>('');
  const [filterGrading, setFilterGrading] = useState<string>('');

  const filteredSamples = samples.filter(s => {
    const matchesSearch = (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.sampleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.sampleSKU || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTest = true;
    if (filterTestFinished === 'finished') {
       matchesTest = s.testStatus === 'Finished';
    } else if (filterTestFinished === 'ongoing') {
       matchesTest = s.testStatus === 'Ongoing';
    } else if (filterTestFinished === 'terminated') {
       matchesTest = s.testStatus === 'Terminated';
    }

    const matchesStatus = filterStatus ? s.status === filterStatus : true;
    const matchesCrystal = filterCrystal ? s.crystalType === filterCrystal : true;
    const matchesForm = filterForm ? s.productForm === filterForm : true;
    const matchesCustomer = filterCustomer ? s.customerId === filterCustomer : true;
    const matchesGrading = filterGrading ? s.isGraded === filterGrading : true;

    return matchesSearch && matchesTest && matchesStatus && matchesCrystal && matchesForm && matchesCustomer && matchesGrading;
  });

  const getUrgencyColor = (dateStr: string) => {
    if (!dateStr || !isValid(new Date(dateStr))) return "bg-white dark:bg-slate-800";
    const diff = differenceInDays(new Date(), new Date(dateStr));
    
    // Strict Protocol: <7 Green, 7-30 Yellow, >30 Red
    if (diff < 7) return "bg-emerald-50/40 border-l-emerald-500 dark:bg-emerald-900/10";
    if (diff < 30) return "bg-amber-50/40 border-l-amber-500 dark:bg-amber-900/10";
    return "bg-red-50/40 border-l-red-500 dark:bg-red-900/10";
  };

  const renderDaysSinceUpdate = (dateStr: string) => {
    if (!dateStr || !isValid(new Date(dateStr))) return <span className="text-slate-400">-</span>;
    const diff = differenceInDays(new Date(), new Date(dateStr));
    let colorClass = diff < 7 ? "text-emerald-600" : diff < 30 ? "text-amber-500" : "text-red-500";
    return <span className={`font-bold ${colorClass}`}>{diff}d</span>;
  };

  const getTestStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'Finished': return <Badge color="green">{t('projectFinished')}</Badge>;
      case 'Terminated': return <Badge color="red">{t('projectTerminated')}</Badge>;
      default: return <Badge color="yellow">{t('projectOngoing')}</Badge>;
    }
  };

  const getGradingBadge = (status: GradingStatus | string | undefined) => {
    if (status === 'Graded') return <Badge color="green">{t('graded')}</Badge>;
    return <Badge color="gray">{t('ungraded')}</Badge>;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterTestFinished('all');
    setFilterCrystal('');
    setFilterForm('');
    setFilterCustomer('');
    setFilterGrading('');
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{t('sampleTracking')}</h2>
          <p className="text-slate-500">Real-time status monitor with strict aging protocol.</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex dark:bg-slate-800">
             <Button variant={viewMode === 'list' ? 'primary' : 'ghost'} onClick={() => setViewMode('list')} className="py-1 px-4">{t('list')}</Button>
             <Button variant={viewMode === 'board' ? 'primary' : 'ghost'} onClick={() => setViewMode('board')} className="py-1 px-4">{t('board')}</Button>
          </div>
          <Button className="flex items-center gap-2" onClick={() => navigate('/data-management')}><Plus size={18} /> {t('newSample')}</Button>
        </div>
      </div>

      <Card className="p-4 flex flex-col gap-4 bg-slate-50 dark:bg-slate-800/50">
         <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900" placeholder={t('searchSample')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2">
               <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900" value={filterCustomer} onChange={e => setFilterCustomer(e.target.value)}>
                  <option value="">{t('customer')}: All</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
               </select>
               <Button variant="ghost" className="text-xs text-slate-500" onClick={resetFilters}>Reset</Button>
            </div>
         </div>
         
         <div className="flex flex-wrap gap-2">
            <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900 bg-white" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
               <option value="">Status: All</option>
               {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{t(s as any)}</option>)}
            </select>
            
            <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900 bg-white" value={filterTestFinished} onChange={e => setFilterTestFinished(e.target.value)}>
               <option value="all">{t('test')}: All</option>
               <option value="ongoing">{t('filterTestOngoing')}</option>
               <option value="finished">{t('filterTestFinished')}</option>
               <option value="terminated">{t('filterTestTerminated')}</option>
            </select>

            <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900 bg-white" value={filterCrystal} onChange={e => setFilterCrystal(e.target.value)}>
               <option value="">{t('crystal')}: All</option>
               {tagOptions.crystalType.map(c => <option key={c} value={c}>{t(c as any)}</option>)}
            </select>

            <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900 bg-white" value={filterForm} onChange={e => setFilterForm(e.target.value)}>
               <option value="">{t('form')}: All</option>
               {tagOptions.productForm.map(f => <option key={f} value={f}>{t(f as any)}</option>)}
            </select>

            <select className="border rounded-lg px-3 py-2 text-xs font-bold dark:bg-slate-900 bg-white" value={filterGrading} onChange={e => setFilterGrading(e.target.value)}>
               <option value="">{t('grading')}: All</option>
               <option value="Graded">{t('graded')}</option>
               <option value="Ungraded">{t('ungraded')}</option>
            </select>
         </div>
      </Card>

      <div className="flex-1 overflow-auto">
        {viewMode === 'list' ? (
          <Card className="border-0 shadow-xl overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-xs font-bold">
                  <tr>
                     <th className="p-4">Customer</th>
                     <th className="p-4">Generated Product Spec</th>
                     <th className="p-4">{t('grading')}</th>
                     <th className="p-4">{t('qtyAbbr')}</th>
                     <th className="p-4">Status</th>
                     <th className="p-4 text-center">Aging</th>
                     <th className="p-4">Test</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredSamples.map(s => (
                    <tr key={s.id} onClick={() => navigate(`/samples/${s.id}`)} className={`cursor-pointer hover:bg-slate-100/50 border-l-4 transition-colors ${getUrgencyColor(s.lastStatusDate)}`}>
                      <td className="p-4 font-bold text-slate-900 dark:text-white">{s.customerName}</td>
                      <td className="p-4">
                         <div className="font-bold text-blue-600 dark:text-blue-400">{s.sampleName}</div>
                         <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.sampleSKU || 'NOSKU'}</div>
                      </td>
                      <td className="p-4">
                        {getGradingBadge(s.isGraded)}
                      </td>
                      <td className="p-4 font-bold text-slate-700 dark:text-slate-300">{s.quantity}</td>
                      <td className="p-4"><Badge color="blue">{t(s.status as any)}</Badge></td>
                      <td className="p-4 text-center">{renderDaysSinceUpdate(s.lastStatusDate)}</td>
                      <td className="p-4">
                         {getTestStatusBadge(s.testStatus)}
                      </td>
                    </tr>
                  ))}
                  {filteredSamples.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest italic">No samples match your filters</td>
                    </tr>
                  )}
                </tbody>
             </table>
          </Card>
        ) : (
          <div className="flex h-full gap-6 overflow-x-auto pb-4">
             {tagOptions.sampleStatus.map((status) => {
                const colSamples = filteredSamples.filter(s => s.status === status);
                return (
                  <div key={status} className="w-80 shrink-0 bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-4 flex flex-col shadow-inner">
                     <div className="flex justify-between items-center mb-4 px-1">
                        <h4 className="font-extrabold uppercase text-xs text-slate-500 flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                           {t(status as any)} ({colSamples.length})
                        </h4>
                     </div>
                     <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                        {colSamples.map(s => (
                          <Card key={s.id} onClick={() => navigate(`/samples/${s.id}`)} className={`p-4 cursor-pointer hover:shadow-lg border-l-4 transition-all hover:-translate-y-1 ${getUrgencyColor(s.lastStatusDate)}`}>
                             <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-slate-400">#{s.sampleIndex}</span>
                                {renderDaysSinceUpdate(s.lastStatusDate)}
                             </div>
                             <p className="font-bold text-slate-900 dark:text-white mb-0.5">{s.customerName}</p>
                             <p className="text-sm font-bold text-blue-600 truncate">{s.sampleName}</p>
                             
                             <div className="mt-2 flex gap-1.5 flex-wrap">
                               {getGradingBadge(s.isGraded)}
                               {getTestStatusBadge(s.testStatus)}
                             </div>

                             <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                <span className="text-[10px] font-mono text-slate-500">{s.sampleSKU || 'N/A'}</span>
                                <span className="text-[10px] font-bold text-slate-700">{s.quantity}</span>
                             </div>
                          </Card>
                        ))}
                     </div>
                  </div>
                );
             })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SampleTracker;
