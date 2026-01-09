
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Card, Button, Badge, RankStars, Modal } from '../components/Common';
import { ArrowLeft, MapPin, Calendar, ExternalLink, Users, ArrowRight, PencilLine, Save, Tag, Plus, Trash2, Link as LinkIcon, X, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Exhibition } from '../types';

const ExhibitionProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { exhibitions, setExhibitions, customers, tagOptions, setTagOptions, t } = useApp();
  const navigate = useNavigate();

  const exhibition = exhibitions.find(e => e.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editFields, setEditFields] = useState<Partial<Exhibition>>({});
  const [newSeriesInput, setNewSeriesInput] = useState('');

  useEffect(() => {
    if (exhibition) {
      setEditFields({
        ...exhibition,
        eventSeries: Array.isArray(exhibition.eventSeries) ? exhibition.eventSeries : []
      });
    }
  }, [exhibition]);

  const associatedCustomers = useMemo(() => {
    if (!exhibition) return [];
    return customers.filter(c => Array.isArray(c.tags) && c.tags.includes(exhibition.name));
  }, [customers, exhibition]);

  if (!exhibition) return <div className="p-20 text-center font-black uppercase text-slate-400">Exhibition not found.</div>;

  const handleSave = () => {
    setExhibitions(prev => prev.map(e => e.id === id ? { ...exhibition, ...editFields } as Exhibition : e));
    setIsEditing(false);
    setIsEditingSummary(false);
  };

  const toggleSeries = (seriesName: string) => {
    const current = Array.isArray(editFields.eventSeries) ? editFields.eventSeries : [];
    const next = current.includes(seriesName) 
      ? current.filter(s => s !== seriesName) 
      : [...current, seriesName];
    setEditFields({ ...editFields, eventSeries: next });
  };

  const handleAddNewSeries = () => {
    const val = newSeriesInput.trim();
    if (!val) return;
    
    // Add to global tag options
    if (!tagOptions.eventSeries.includes(val)) {
      setTagOptions(prev => ({
        ...prev,
        eventSeries: [...prev.eventSeries, val]
      }));
    }
    
    // Select it for the current profile
    const current = Array.isArray(editFields.eventSeries) ? editFields.eventSeries : [];
    if (!current.includes(val)) {
      setEditFields({ ...editFields, eventSeries: [...current, val] });
    }
    
    setNewSeriesInput('');
  };

  const labelClass = "text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest";
  const contentClass = "text-xl xl:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight";
  const inputClass = "w-full p-4 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:border-blue-500 transition-all";

  const hasValidLink = exhibition.link && exhibition.link !== '#' && exhibition.link.trim() !== '';

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/exhibitions')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 active:scale-90">
            <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
              <h1 className="text-3xl xl:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{exhibition.name}</h1>
              <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-sm">Centralized Event Management</p>
          </div>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 px-8 py-3 rounded-2xl shadow-xl shadow-emerald-600/20 active:scale-95 transition-all">
             <PencilLine size={20} />
             <span className="font-black uppercase tracking-widest text-sm">Edit Event Info</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-1 space-y-8">
            <Card className="p-8 space-y-8 border-2 border-l-8 border-l-blue-600 relative overflow-hidden">
               {isEditing ? (
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <label className={labelClass}>Location</label>
                       <div className="relative">
                          <MapPin className="absolute left-4 top-4 text-slate-400" size={18} />
                          <input className={inputClass + " pl-12"} value={editFields.location || ''} onChange={e => setEditFields({...editFields, location: e.target.value})} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className={labelClass}>Date</label>
                       <div className="relative">
                          <Calendar className="absolute left-4 top-4 text-slate-400" size={18} />
                          <input type="date" className={inputClass + " pl-12"} value={editFields.date || ''} onChange={e => setEditFields({...editFields, date: e.target.value})} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className={labelClass}>Official Link</label>
                       <div className="relative">
                          <LinkIcon className="absolute left-4 top-4 text-slate-400" size={18} />
                          <input className={inputClass + " pl-12 font-bold lowercase"} value={editFields.link || ''} onChange={e => setEditFields({...editFields, link: e.target.value})} />
                       </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                       <Button variant="secondary" className="flex-1 rounded-xl" onClick={() => setIsEditing(false)}>Cancel</Button>
                       <Button className="flex-1 rounded-xl bg-blue-600" onClick={handleSave}>Save</Button>
                    </div>
                 </div>
               ) : (
                 <>
                   <div className="space-y-1">
                      <span className={labelClass}>Location</span>
                      <div className="flex items-center gap-3">
                         <MapPin className="text-blue-500" />
                         <span className={contentClass}>{exhibition.location || 'TBD'}</span>
                      </div>
                   </div>
                   <div className="space-y-1">
                      <span className={labelClass}>Date</span>
                      <div className="flex items-center gap-3">
                         <Calendar className="text-blue-500" />
                         <span className={contentClass}>{exhibition.date || 'TBD'}</span>
                      </div>
                   </div>
                   {hasValidLink && (
                    <div className="space-y-1 pt-6 border-t dark:border-slate-800">
                        <span className={labelClass}>Resource</span>
                        <a 
                          href={exhibition.link!.startsWith('http') ? exhibition.link : `https://${exhibition.link}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 group mt-2"
                        >
                           <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg group-hover:scale-105 transition-transform">
                              <ExternalLink size={24} />
                           </div>
                           <span className="text-lg font-black text-blue-600 hover:underline">Official Documentation</span>
                        </a>
                    </div>
                   )}
                 </>
               )}
            </Card>

            <Card className="p-8 border-2 relative">
               <h3 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                  <Tag className="text-indigo-500" /> Event Series
               </h3>
               {isEditing ? (
                  <div className="space-y-4">
                     <p className={labelClass + " normal-case"}>Available Series Tags:</p>
                     <div className="flex flex-wrap gap-2">
                        {tagOptions.eventSeries.map(s => (
                           <button 
                              key={s}
                              onClick={() => toggleSeries(s)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border ${
                                 (editFields.eventSeries || []).includes(s) 
                                 ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' 
                                 : 'bg-white dark:bg-slate-900 text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-50 hover:border-blue-300'
                              }`}
                           >
                              {s}
                           </button>
                        ))}
                     </div>
                     
                     <div className="flex gap-2 border-t dark:border-slate-800 pt-4 mt-4">
                        <input 
                          className="flex-1 p-2.5 border-2 rounded-xl text-xs font-bold dark:bg-slate-900 dark:border-slate-800 outline-none focus:border-blue-500" 
                          placeholder="New tag..."
                          value={newSeriesInput}
                          onChange={e => setNewSeriesInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddNewSeries())}
                        />
                        <button 
                          onClick={handleAddNewSeries}
                          className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 active:scale-90 transition-all"
                        >
                          <Plus size={18} />
                        </button>
                     </div>
                  </div>
               ) : (
                  <div className="flex flex-wrap gap-2">
                     {Array.isArray(exhibition.eventSeries) && exhibition.eventSeries.length > 0 ? exhibition.eventSeries.map(s => (
                        <Badge key={s} color="purple">{s}</Badge>
                     )) : (
                        <span className="text-slate-400 italic font-medium">No series assigned.</span>
                     )}
                  </div>
               )}
            </Card>
         </div>

         <div className="lg:col-span-2 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <Card className="p-8 border-2 text-center flex flex-col items-center justify-center">
                  <div className="text-5xl font-black text-blue-600 mb-2">{associatedCustomers.length}</div>
                  <div className={labelClass}>Participating Customers</div>
               </Card>
               
               <Card className="p-8 border-2 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-4">
                     <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3">
                        <FileText className="text-amber-500" size={20} /> Event Summary
                     </h3>
                     {!isEditingSummary && (
                        <button onClick={() => setIsEditingSummary(true)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 active:scale-90 transition-all">
                           <PencilLine size={18} />
                        </button>
                     )}
                  </div>
                  {isEditingSummary ? (
                     <div className="space-y-4">
                        <textarea 
                           className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-white dark:bg-slate-800 text-sm outline-none focus:border-blue-500 min-h-[120px]"
                           value={editFields.summary || ''}
                           onChange={e => setEditFields({...editFields, summary: e.target.value})}
                           placeholder="Type event summary here..."
                        />
                        <div className="flex gap-2">
                           <Button variant="secondary" size="sm" className="flex-1" onClick={() => { setIsEditingSummary(false); setEditFields({...editFields, summary: exhibition.summary}); }}>Cancel</Button>
                           <Button size="sm" className="flex-1 bg-blue-600" onClick={handleSave}>Save Summary</Button>
                        </div>
                     </div>
                  ) : (
                     <div className="text-slate-600 dark:text-slate-300 font-bold italic leading-relaxed text-sm xl:text-base pr-8">
                        {exhibition.summary || <span className="text-slate-300">No summary information provided for this event. Click edit to add notes.</span>}
                     </div>
                  )}
               </Card>
            </div>

            <Card className="p-8 border-2">
               <div className="flex justify-between items-center mb-8 pb-4 border-b dark:border-slate-800">
                  <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
                     <Users size={20} className="text-blue-600" /> Associated Customers
                  </h3>
               </div>
               
               <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                  {associatedCustomers.map(c => (
                     <div 
                        key={c.id} 
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/40 border-2 border-slate-100 dark:border-slate-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-900 cursor-pointer group transition-all"
                     >
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 bg-white dark:bg-slate-900 border-2 rounded-xl flex items-center justify-center font-black text-lg text-slate-700 dark:text-slate-300">
                              {(c.name || '?').charAt(0)}
                           </div>
                           <div>
                              <h4 className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{c.name}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                 <RankStars rank={c.rank} />
                                 <span className="text-[10px] font-black text-slate-400 uppercase">{(c.region || []).join(', ')}</span>
                              </div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <Badge color="blue">{c.status}</Badge>
                           <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
                        </div>
                     </div>
                  ))}
                  {associatedCustomers.length === 0 && (
                     <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest italic opacity-40">
                        No customers linked to this event yet.
                     </div>
                  )}
               </div>
            </Card>
         </div>
      </div>
    </div>
  );
};

export default ExhibitionProfile;
