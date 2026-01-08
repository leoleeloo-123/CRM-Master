
import React, { useState, useMemo } from 'react';
import { Card, Button, Modal, Badge } from '../components/Common';
import { useApp } from '../contexts/AppContext';
import { Plus, Search, MapPin, Calendar, ExternalLink, Trash2, PencilLine, ArrowRight, Activity, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Exhibition } from '../types';

const ExhibitionList: React.FC = () => {
  const { exhibitions, setExhibitions, customers, tagOptions, t } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);
  
  const [formData, setFormData] = useState<Partial<Exhibition>>({
    name: '',
    date: '',
    location: '',
    link: '',
    eventSeries: []
  });

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

  const filtered = useMemo(() => {
    return exhibitions.filter(e => {
      const name = e.name || '';
      const location = e.location || '';
      return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             location.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a, b) => {
      const countA = exhibitionStats[a.name] || 0;
      const countB = exhibitionStats[b.name] || 0;
      if (countA !== countB) return countB - countA;
      
      // Defensive date comparison
      const dateA = a.date || '';
      const dateB = b.date || '';
      return dateB.localeCompare(dateA);
    });
  }, [exhibitions, searchTerm, exhibitionStats]);

  const handleSave = () => {
    if (!formData.name) return;
    
    if (editingExhibition) {
      setExhibitions(prev => prev.map(e => e.id === editingExhibition.id ? { ...editingExhibition, ...formData } as Exhibition : e));
    } else {
      const newExh: Exhibition = {
        id: `exh_${Date.now()}`,
        name: formData.name,
        date: formData.date || 'TBD',
        location: formData.location || 'TBD',
        link: formData.link || '#',
        eventSeries: formData.eventSeries || []
      };
      setExhibitions(prev => [...prev, newExh]);
    }
    
    setIsAddModalOpen(false);
    setEditingExhibition(null);
    setFormData({ name: '', date: '', location: '', link: '', eventSeries: [] });
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
      ? `This exhibition is linked to ${count} customer(s). Are you absolutely sure you want to delete it? This will leave customer tags without metadata.`
      : `Are you sure you want to delete "${name}"?`;

    if (confirm(message)) {
      setExhibitions(prev => prev.filter(ex => ex.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{t('exhibitions')}</h2>
          <p className="text-slate-500 font-bold mt-1 tracking-tight">Managing links and info for all exhibition entries.</p>
        </div>
        <Button onClick={() => { setEditingExhibition(null); setFormData({name:'', date:'', location:'', link:'', eventSeries:[]}); setIsAddModalOpen(true); }} className="flex items-center gap-2 px-8 py-3 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
           <Plus size={20} />
           <span className="font-black uppercase tracking-widest text-sm">Add Exhibition</span>
        </Button>
      </div>

      <Card className="p-6 xl:p-8 border-2">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          <input 
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:border-blue-500 font-bold transition-all"
            placeholder="Search exhibitions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(exh => {
            const usageCount = exhibitionStats[exh.name] || 0;
            return (
              <Card 
                key={exh.id} 
                className={`p-6 hover:shadow-xl transition-all cursor-pointer group relative border-2 ${usageCount > 0 ? 'border-slate-100 dark:border-slate-800' : 'border-dashed border-slate-200 opacity-60'}`}
                onClick={() => navigate(`/exhibitions/${exh.id}`)}
              >
                <div className="flex justify-between items-start mb-6">
                   <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${usageCount > 0 ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Calendar size={24} />
                   </div>
                   <div className="flex gap-2">
                      <button onClick={(e) => handleEdit(exh, e)} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 opacity-0 group-hover:opacity-100 transition-opacity"><PencilLine size={16} /></button>
                      <button onClick={(e) => handleDelete(exh.id, exh.name, e)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                   </div>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 line-clamp-1 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{exh.name}</h3>
                
                <div className="flex flex-wrap gap-1.5 mb-4">
                   {Array.isArray(exh.eventSeries) && exh.eventSeries.map(s => (
                     <span key={s} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase rounded shadow-sm border border-indigo-100 dark:border-indigo-800">{s}</span>
                   ))}
                   {(!exh.eventSeries || exh.eventSeries.length === 0) && (
                      <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">No Series</span>
                   )}
                </div>

                <div className="space-y-2 mb-6">
                   <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                      <MapPin size={12} /> <span>{exh.location || 'TBD'}</span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                      <Calendar size={12} /> <span>{exh.date || 'TBD'}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                   {exh.link && exh.link !== '#' ? (
                     <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest">
                       <ExternalLink size={14} /> Link Ready
                     </div>
                   ) : (
                     <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No Link</span>
                   )}
                   <div className="text-slate-200 group-hover:text-blue-500 transition-colors">
                      <ArrowRight size={18} />
                   </div>
                </div>
              </Card>
            );
          })}
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
                    className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 dark:border-slate-700" 
                    placeholder="e.g. 2024-05-15"
                    value={formData.date || ''}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                  <input 
                    className="w-full p-4 border-2 rounded-2xl font-black bg-white dark:bg-slate-900 dark:border-slate-700" 
                    placeholder="e.g. Taipei"
                    value={formData.location || ''}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
               </div>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Resource Link</label>
               <input 
                 className="w-full p-4 border-2 rounded-2xl font-bold bg-white dark:bg-slate-900 dark:border-slate-700 outline-none focus:border-blue-500" 
                 placeholder="https://..."
                 value={formData.link || ''}
                 onChange={e => setFormData({...formData, link: e.target.value})}
               />
            </div>
            
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign Event Series</label>
               <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                  {tagOptions.eventSeries.map(s => (
                    <button 
                       key={s}
                       onClick={() => {
                         const current = Array.isArray(formData.eventSeries) ? formData.eventSeries : [];
                         const next = current.includes(s) ? current.filter(x => x !== s) : [...current, s];
                         setFormData({...formData, eventSeries: next});
                       }}
                       className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                         formData.eventSeries?.includes(s) 
                           ? 'bg-blue-600 text-white shadow-md' 
                           : 'bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-700'
                       }`}
                    >
                       {s}
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
               <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
               <Button onClick={handleSave} className="bg-blue-600 px-10 shadow-lg shadow-blue-600/30">Save Exhibition</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default ExhibitionList;
