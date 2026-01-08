
import React, { useState, useMemo } from 'react';
import { Card, Button, Modal, Badge } from '../components/Common';
import { useApp } from '../contexts/AppContext';
import { Plus, Search, MapPin, Calendar, ExternalLink, Trash2, PencilLine, ArrowRight, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Exhibition } from '../types';

const ExhibitionList: React.FC = () => {
  const { exhibitions, setExhibitions, customers, t } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const [editFields, setEditFields] = useState<Partial<Exhibition>>({});

  // Count active usages of exhibitions
  const exhibitionStats = useMemo(() => {
    const stats: Record<string, number> = {};
    customers.forEach(c => {
      c.tags.forEach(tag => {
        stats[tag] = (stats[tag] || 0) + 1;
      });
    });
    return stats;
  }, [customers]);

  const filtered = exhibitions.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.location.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    // Sort by usage count first, then by date
    const countA = exhibitionStats[a.name] || 0;
    const countB = exhibitionStats[b.name] || 0;
    if (countA !== countB) return countB - countA;
    return b.date.localeCompare(a.date);
  });

  const handleSave = () => {
    if (!editingExhibition) return;
    setExhibitions(prev => prev.map(e => e.id === editingExhibition.id ? { ...editingExhibition, ...editFields } as Exhibition : e));
    setIsEditModalOpen(false);
    setEditingExhibition(null);
  };

  const handleEdit = (exh: Exhibition, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingExhibition(exh);
    setEditFields(exh);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const count = exhibitionStats[name] || 0;
    if (count > 0) {
      alert(`Cannot delete "${name}" because it is currently linked to ${count} customer(s). Remove the tag from customers first.`);
      return;
    }
    if (confirm('Are you sure you want to delete this exhibition entry?')) {
      setExhibitions(prev => prev.filter(ex => ex.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl xl:text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{t('exhibitions')}</h2>
          <p className="text-slate-500 font-bold mt-1 tracking-tight">Managing links and info for all unique customer exhibition tags.</p>
        </div>
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
                      {usageCount === 0 && (
                        <button onClick={(e) => handleDelete(exh.id, exh.name, e)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                      )}
                   </div>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 line-clamp-1 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{exh.name}</h3>
                
                <div className="flex items-center gap-2 mb-4">
                   <Activity size={14} className="text-slate-400" />
                   <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{usageCount} Customers Linked</span>
                </div>

                <div className="space-y-2 mb-6">
                   <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                      <MapPin size={12} /> <span>{exh.location}</span>
                   </div>
                   <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase">
                      <Calendar size={12} /> <span>{exh.date}</span>
                   </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                   {exh.link && exh.link !== '#' ? (
                     <a 
                       href={exh.link.startsWith('http') ? exh.link : `https://${exh.link}`} 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       onClick={(e) => e.stopPropagation()}
                       className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-xs font-black uppercase tracking-widest"
                     >
                       <ExternalLink size={14} /> Official Link
                     </a>
                   ) : (
                     <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No Link Provided</span>
                   )}
                   <div className="text-slate-200 group-hover:text-blue-500 transition-colors">
                      <ArrowRight size={18} />
                   </div>
                </div>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-[0.2em] opacity-30">
               No exhibitions registered. Tags from customers appear here automatically.
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Exhibition Info">
         <div className="space-y-6">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Exhibition Name (Derived from Tag)</label>
               <input 
                 className="w-full p-4 border-2 rounded-2xl font-black bg-slate-50 dark:bg-slate-800 text-slate-400 cursor-not-allowed" 
                 value={editingExhibition?.name}
                 readOnly
               />
               <p className="text-[10px] text-slate-400 font-bold italic ml-1">* Rename exhibition tags in individual customer profiles to update this name.</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Event Date</label>
                  <input 
                    className="w-full p-4 border-2 rounded-2xl font-black dark:bg-slate-900" 
                    placeholder="e.g. 2024-05-15"
                    value={editFields.date}
                    onChange={e => setEditFields({...editFields, date: e.target.value})}
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</label>
                  <input 
                    className="w-full p-4 border-2 rounded-2xl font-black dark:bg-slate-900" 
                    placeholder="e.g. Las Vegas, NV"
                    value={editFields.location}
                    onChange={e => setEditFields({...editFields, location: e.target.value})}
                  />
               </div>
            </div>
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">External Link (Official Resource)</label>
               <input 
                 className="w-full p-4 border-2 rounded-2xl font-bold dark:bg-slate-900 outline-none focus:border-blue-500" 
                 placeholder="https://..."
                 value={editFields.link}
                 onChange={e => setEditFields({...editFields, link: e.target.value})}
               />
            </div>
            <div className="flex justify-end gap-3 pt-6">
               <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
               <Button onClick={handleSave} className="bg-blue-600 px-10">Save Changes</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default ExhibitionList;
