
import React, { useState, useMemo, useEffect } from 'react';
import { Card, Button, Modal, Badge } from '../components/Common';
import { useApp } from '../contexts/AppContext';
import { Plus, Search, MapPin, Calendar, ExternalLink, Trash2, PencilLine, ArrowRight, Tag, X, Filter, User, ChevronDown, ChevronRight, Globe, Maximize2, Minimize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Exhibition } from '../types';

const ExhibitionList: React.FC = () => {
  const { exhibitions, setExhibitions, customers, tagOptions, setTagOptions, t } = useApp();
  const navigate = useNavigate();
  
  // State for Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeries, setFilterSeries] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');
  
  // Combined Filtering Logic (needed for grouping)
  const filteredExhibitions = useMemo(() => {
    return exhibitions.filter(e => {
      const matchesSearch = (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (e.location || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeries = filterSeries === '' || (e.eventSeries && e.eventSeries.includes(filterSeries));
      const matchesYear = filterYear === '' || (e.date && e.date.startsWith(filterYear));
      let matchesCustomer = true;
      if (filterCustomer !== '') {
        const targetCustomer = customers.find(c => c.id === filterCustomer);
        matchesCustomer = targetCustomer ? (targetCustomer.tags || []).includes(e.name) : false;
      }
      return matchesSearch && matchesSeries && matchesYear && matchesCustomer;
    });
  }, [exhibitions, searchTerm, filterSeries, filterYear, filterCustomer, customers]);

  // Grouping Logic
  const groupedExhibitions = useMemo(() => {
    const groups: { series: string; items: Exhibition[] }[] = [];
    tagOptions.eventSeries.forEach(s => {
      const items = filteredExhibitions.filter(e => Array.isArray(e.eventSeries) && e.eventSeries.includes(s));
      if (items.length > 0) {
        groups.push({ series: s, items: items.sort((a, b) => (b.date || '').localeCompare(a.date || '')) });
      }
    });
    const naItems = filteredExhibitions.filter(e => !e.eventSeries || e.eventSeries.length === 0);
    if (naItems.length > 0) {
      groups.push({ series: 'NA', items: naItems.sort((a, b) => (b.date || '').localeCompare(a.date || '')) });
    }
    return groups;
  }, [filteredExhibitions, tagOptions.eventSeries]);

  // Folding state - default to expanded (all visible groups)
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());

  // Default expand all on mount once grouping is available
  useEffect(() => {
    if (groupedExhibitions.length > 0) {
      setExpandedSeries(new Set(groupedExhibitions.map(g => g.series)));
    }
  }, [groupedExhibitions.length]);

  // Derived: Are all currently visible groups expanded?
  const isAllExpanded = useMemo(() => {
    if (groupedExhibitions.length === 0) return false;
    return groupedExhibitions.every(g => expandedSeries.has(g.series));
  }, [groupedExhibitions, expandedSeries]);

  const toggleAllExpansion = () => {
    if (isAllExpanded) {
      setExpandedSeries(new Set());
    } else {
      setExpandedSeries(new Set(groupedExhibitions.map(g => g.series)));
    }
  };

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);
  const [newSeriesInput, setNewSeriesInput] = useState('');
  const [formData, setFormData] = useState<Partial<Exhibition>>({
    name: '',
    date: '',
    location: '',
    link: '',
    eventSeries: [],
    summary: ''
  });

  // Derived: Unique Years from exhibitions for filter
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    exhibitions.forEach(exh => {
      if (exh.date && exh.date.length >= 4) {
        years.add(exh.date.substring(0, 4));
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [exhibitions]);

  // Count active usages of exhibitions
  const exhibitionStats = useMemo(() => {
    const stats: Record<string, number> = {};
    customers.forEach(c => {
      if (Array.isArray(c.tags)) {
        c.tags.forEach(tag => {
          stats[tag] = (stats[tag] || 0) + 1;
        });
      }
    });
    return stats;
  }, [customers]);

  const toggleSeriesExpansion = (s: string) => {
    const next = new Set(expandedSeries);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setExpandedSeries(next);
  };

  const handleSave = () => {
    if (!formData.name) return;
    if (editingExhibition) {
      setExhibitions(prev => prev.map(e => e.id === editingExhibition.id ? { ...editingExhibition, ...formData } as Exhibition : e));
    } else {
      const newExh: Exhibition = {
        id: `exh_${Date.now()}`,
        name: formData.name,
        date: formData.date || '',
        location: formData.location || 'TBD',
        link: formData.link || '#',
        eventSeries: formData.eventSeries || [],
        summary: formData.summary || ''
      };
      setExhibitions(prev => [...prev, newExh]);
    }
    setIsAddModalOpen(false);
    setEditingExhibition(null);
    setFormData({ name: '', date: '', location: '', link: '', eventSeries: [], summary: '' });
  };

  const handleEdit = (exh: Exhibition, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExhibition(exh);
    setFormData({
      ...exh,
      eventSeries: Array.isArray(exh.eventSeries) ? exh.eventSeries : []
    });
    setIsAddModalOpen(true);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const count = exhibitionStats[name] || 0;
    const message = count > 0 
      ? `This exhibition is linked to ${count} customer(s). Are you absolutely sure you want to delete it?`
      : `Are you sure you want to delete "${name}"?`;
    if (confirm(message)) {
      setExhibitions(prev => prev.filter(ex => ex.id !== id));
    }
  };

  const handleAddNewSeries = () => {
    const val = newSeriesInput.trim();
    if (!val) return;
    if (!tagOptions.eventSeries.includes(val)) {
      setTagOptions(prev => ({
        ...prev,
        eventSeries: [...prev.eventSeries, val]
      }));
    }
    const current = Array.isArray(formData.eventSeries) ? formData.eventSeries : [];
    if (!current.includes(val)) {
      setFormData({ ...formData, eventSeries: [...current, val] });
    }
    setNewSeriesInput('');
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterSeries('');
    setFilterYear('');
    setFilterCustomer('');
    // Expand all on filter reset
    setExpandedSeries(new Set(groupedExhibitions.map(g => g.series)));
  };

  const hasActiveFilters = searchTerm !== '' || filterSeries !== '' || filterYear !== '' || filterCustomer !== '';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl xl:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('exhibitions')}</h2>
          <p className="text-sm xl:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">{t('exhibitionDesc')}</p>
        </div>
        <Button onClick={() => { setEditingExhibition(null); setFormData({name:'', date:'', location:'', link:'', eventSeries:[], summary: ''}); setIsAddModalOpen(true); }} className="flex items-center gap-2 px-8 py-3 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
           <Plus size={20} />
           <span className="font-black uppercase tracking-widest text-sm">{t('addExhibition')}</span>
        </Button>
      </div>

      <Card className="p-6 xl:p-8 border-2">
        <div className="space-y-6">
          {/* Main Search */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input 
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:border-blue-500 font-bold transition-all shadow-sm"
              placeholder={t('exhibitionSearchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <Tag size={16} className="text-slate-400" />
                <select 
                  className="bg-transparent text-xs font-black uppercase tracking-widest outline-none dark:text-slate-300"
                  value={filterSeries}
                  onChange={e => setFilterSeries(e.target.value)}
                >
                  <option value="">{t('allSeries')}</option>
                  {tagOptions.eventSeries.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>

             <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <Calendar size={16} className="text-slate-400" />
                <select 
                  className="bg-transparent text-xs font-black uppercase tracking-widest outline-none dark:text-slate-300"
                  value={filterYear}
                  onChange={e => setFilterYear(e.target.value)}
                >
                  <option value="">{t('allYears')}</option>
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
             </div>

             <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <User size={16} className="text-slate-400" />
                <select 
                  className="bg-transparent text-xs font-black uppercase tracking-widest outline-none dark:text-slate-300 max-w-[150px]"
                  value={filterCustomer}
                  onChange={e => setFilterCustomer(e.target.value)}
                >
                  <option value="">{t('allCustomers')}</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
             </div>

             <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

             {/* Global Collapse/Expand Toggle Button */}
             <button 
              onClick={toggleAllExpansion}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                isAllExpanded 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300'
              }`}
             >
               {isAllExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
               {isAllExpanded ? t('collapseAll') : t('expandAll')}
             </button>

             {hasActiveFilters && (
               <button 
                onClick={resetFilters}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors ml-2"
               >
                 <X size={14} /> {t('cancel')}
               </button>
             )}

             <div className="ml-auto">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                 {t('results')}: {filteredExhibitions.length}
               </span>
             </div>
          </div>
        </div>

        {/* Grouped List View */}
        <div className="mt-10 overflow-hidden border-2 rounded-[2rem] border-slate-100 dark:border-slate-800">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-100 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="p-6">{t('colExhibitionSeries')}</th>
                <th className="p-6">{t('colLocation')}</th>
                <th className="p-6">{t('colDate')}</th>
                <th className="p-6">{t('colOfficialLink')}</th>
                <th className="p-6 text-center">{t('colLinkedCustomers')}</th>
                <th className="p-6">{t('colEventSummary')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {groupedExhibitions.map(group => {
                const isExpanded = expandedSeries.has(group.series);
                return (
                  <React.Fragment key={group.series}>
                    {/* Series Header Row */}
                    <tr 
                      onClick={() => toggleSeriesExpansion(group.series)}
                      className="bg-slate-50/50 dark:bg-slate-800/30 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td colSpan={6} className="p-5 border-y-2 border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                            <span className={`font-black uppercase tracking-[0.1em] text-sm ${group.series === 'NA' ? 'text-slate-400 italic' : 'text-blue-600'}`}>
                              {group.series === 'NA' ? t('untaggedEvents') : group.series}
                            </span>
                            <Badge color={group.series === 'NA' ? 'gray' : 'blue'}>{group.items.length}</Badge>
                          </div>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Exhibition Items under this series */}
                    {isExpanded && group.items.map(exh => {
                      const usageCount = exhibitionStats[exh.name] || 0;
                      return (
                        <tr 
                          key={`${group.series}-${exh.id}`}
                          onClick={() => navigate(`/exhibitions/${exh.id}`)}
                          className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                        >
                          <td className="p-6 pl-14">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-base group-hover:text-blue-600 transition-colors leading-tight">
                                {exh.name}
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {exh.eventSeries?.filter(s => s !== group.series).map(s => (
                                  <span key={s} className="text-[8px] font-black uppercase px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded">{s}</span>
                                ))}
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                              <MapPin size={14} className="text-slate-400" />
                              {exh.location || 'TBD'}
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm whitespace-nowrap">
                              <Calendar size={14} className="text-slate-400" />
                              {exh.date || 'TBD'}
                            </div>
                          </td>
                          <td className="p-6">
                            {exh.link && exh.link !== '#' ? (
                              <div className="flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-widest">
                                <ExternalLink size={14} /> Link Ready
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">{t('noLink')}</span>
                            )}
                          </td>
                          <td className="p-6 text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
                              <User size={12} className="text-slate-400" />
                              <span className="text-xs font-black text-slate-600 dark:text-slate-400">{usageCount}</span>
                            </div>
                          </td>
                          <td className="p-6 relative">
                            <div className="text-xs text-slate-600 dark:text-slate-300 font-bold line-clamp-2 max-w-[200px]">
                               {exh.summary || <span className="text-slate-300 italic">{t('noSummary')}</span>}
                            </div>
                            <div className="absolute inset-y-0 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-white dark:from-slate-900 pl-4" onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={(e) => handleEdit(exh, e)} 
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all active:scale-90"
                              >
                                <PencilLine size={16} />
                              </button>
                              <button 
                                onClick={(e) => handleDelete(exh.id, exh.name, e)} 
                                className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all active:scale-90"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              
              {groupedExhibitions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-20 text-center">
                    <Filter className="w-16 h-16 mx-auto mb-6 opacity-10" />
                    <p className="text-sm xl:text-lg font-black uppercase tracking-[0.2em] text-slate-300">No Exhibitions Found</p>
                    <button onClick={resetFilters} className="mt-4 text-blue-500 font-bold uppercase text-xs tracking-widest hover:underline">Clear all filters</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingExhibition ? "Edit Exhibition Entry" : "Register New Exhibition"}>
         <div className="space-y-6">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Exhibition Name *</label>
               <input 
                 className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-500 transition-all uppercase" 
                 value={formData.name || ''}
                 onChange={e => setFormData({...formData, name: e.target.value})}
                 placeholder="e.g. SEMICON TAIWAN 2024"
               />
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Date</label>
                  <input 
                    type="date"
                    className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-500 transition-all" 
                    value={formData.date || ''}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                  <input 
                    className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-500 transition-all" 
                    placeholder="e.g. Taipei"
                    value={formData.location || ''}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
               </div>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resource Link</label>
               <input 
                 className="w-full p-4 border-2 rounded-2xl font-bold bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-500 transition-all" 
                 placeholder="https://..."
                 value={formData.link || ''}
                 onChange={e => setFormData({...formData, link: e.target.value})}
               />
            </div>

            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Summary</label>
               <textarea 
                 className="w-full p-4 border-2 rounded-2xl font-bold bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-500 transition-all min-h-[100px]" 
                 placeholder="Enter event notes or summary..."
                 value={formData.summary || ''}
                 onChange={e => setFormData({...formData, summary: e.target.value})}
               />
            </div>
            
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Event Series</label>
               <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {tagOptions.eventSeries.map(s => (
                      <button 
                         key={s}
                         type="button"
                         onClick={() => {
                           const current = Array.isArray(formData.eventSeries) ? formData.eventSeries : [];
                           const next = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
                           setFormData({...formData, eventSeries: next});
                         }}
                         className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                           formData.eventSeries?.includes(s) 
                             ? 'bg-blue-600 text-white shadow-md' 
                             : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-blue-300'
                         }`}
                      >
                         {s}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 border-t dark:border-slate-700 pt-4">
                    <input 
                      className="flex-1 p-2.5 border-2 rounded-xl text-xs font-bold dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-500" 
                      placeholder="Add new series tag..."
                      value={newSeriesInput}
                      onChange={e => setNewSeriesInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddNewSeries())}
                    />
                    <button 
                      type="button"
                      onClick={handleAddNewSeries}
                      className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 active:scale-90 transition-all"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
               <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>{t('cancel')}</Button>
               <Button onClick={handleSave} className="bg-blue-600 px-10 shadow-lg shadow-blue-600/30">Save Exhibition</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default ExhibitionList;
