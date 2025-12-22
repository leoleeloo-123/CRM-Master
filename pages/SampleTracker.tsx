
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

  const filteredSamples = samples.filter(s => {
    const matchesSearch = (s.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.sampleName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.sampleSKU || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesTest = true;
    if (filterTestFinished === 'finished') {
       matchesTest = s.testStatus === 'Finished' || s.testStatus === 'Terminated';
    } else if (filterTestFinished === 'ongoing') {
       matchesTest = s.testStatus === 'Ongoing';
    }

    const matchesStatus = filterStatus ? s.status === filterStatus : true;

    return matchesSearch && matchesTest && matchesStatus;
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
          <Button className="flex items-center gap-2"><Plus size={18} /> {t('newSample')}</Button>
        </div>
      </div>

      <Card className="p-4 flex flex-col md:flex-row gap-4 bg-slate-50 dark:bg-slate-800/50">
         <div className="flex-1 relative">
           <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
           <input className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-900" placeholder={t('searchSample')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
         <div className="flex gap-2">
            <select className="border rounded-lg px-3 py-2 dark:bg-slate-900" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
               <option value="">All Statuses</option>
               {tagOptions.sampleStatus.map(s => <option key={s} value={s}>{t(s as any)}</option>)}
            </select>
            <select className="border rounded-lg px-3 py-2 dark:bg-slate-900" value={filterTestFinished} onChange={e => setFilterTestFinished(e.target.value)}>
               <option value="ongoing">Ongoing</option>
               <option value="finished">Finished</option>
               <option value="all">All</option>
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
                         <div className="text-[10px] text-slate-400 font-mono mt-0.5">{s.sampleSKU || 'NOSKU'} · {s.quantity}</div>
                      </td>
                      <td className="p-4"><Badge color="blue">{t(s.status as any)}</Badge></td>
                      <td className="p-4 text-center">{renderDaysSinceUpdate(s.lastStatusDate)}</td>
                      <td className="p-4">
                         <Badge color={s.testStatus === 'Ongoing' ? 'yellow' : 'green'}>{s.testStatus}</Badge>
                      </td>
                    </tr>
                  ))}
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
                             <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                <span className="text-[10px] font-mono text-slate-500">{s.sampleSKU || 'N/A'}</span>
                                <Badge color="gray">{s.quantity}</Badge>
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
