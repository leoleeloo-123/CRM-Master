
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, Sample, FollowUpStatus, Interaction, Contact, Rank } from '../types';
import { Card, Button, RankStars, Badge, StatusIcon, DaysCounter, getUrgencyLevel, Modal } from '../components/Common';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Clock, Plus, Box, Save, X, Trash2, List, Calendar, UserCheck, Star, Edit3, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { useApp } from '../contexts/AppContext';

interface CustomerProfileProps {
  customers: Customer[];
  samples: Sample[];
  onUpdateCustomer: (updated: Customer) => void;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ customers, samples, onUpdateCustomer }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useApp();
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'samples'>('overview');
  
  // Modals State
  const [isEditSummaryOpen, setIsEditSummaryOpen] = useState(false);
  const [isEditContactsOpen, setIsEditContactsOpen] = useState(false);
  const [isEditTagsOpen, setIsEditTagsOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);

  // Local Edit States
  const [tempSummary, setTempSummary] = useState('');
  const [tempTags, setTempTags] = useState('');

  const customer = customers.find(c => c.id === id);
  const customerSamples = samples.filter(s => s.customerId === id);

  if (!customer) {
    return <div className="p-8 text-center text-slate-500">Customer not found. <Button onClick={() => navigate('/customers')}>{t('back')}</Button></div>;
  }

  // --- Handlers ---

  const saveUpdate = (updatedFields: Partial<Customer>) => {
    onUpdateCustomer({ ...customer, ...updatedFields });
  };

  const handleUpdateSummary = () => {
    saveUpdate({ productSummary: tempSummary, lastStatusUpdate: format(new Date(), 'yyyy-MM-dd') });
    setIsEditSummaryOpen(false);
  };

  const handleUpdateTags = () => {
    const tagsArr = tempTags.split(',').map(t => t.trim()).filter(t => t);
    saveUpdate({ tags: tagsArr });
    setIsEditTagsOpen(false);
  };

  const togglePrimaryContact = (index: number) => {
    const newContacts = customer.contacts.map((c, i) => ({ ...c, isPrimary: i === index }));
    saveUpdate({ contacts: newContacts });
  };

  const deleteContact = (index: number) => {
    if (confirm('Delete this contact?')) {
      const newContacts = customer.contacts.filter((_, i) => i !== index);
      saveUpdate({ contacts: newContacts });
    }
  };

  const addContact = () => {
    const newContacts = [...customer.contacts, { name: 'New Contact', title: 'Position', isPrimary: false }];
    saveUpdate({ contacts: newContacts });
  };

  const updateContact = (index: number, fields: Partial<Contact>) => {
    const newContacts = customer.contacts.map((c, i) => i === index ? { ...c, ...fields } : c);
    saveUpdate({ contacts: newContacts });
  };

  const saveInteraction = (updated: Interaction) => {
    const newInteractions = customer.interactions.some(i => i.id === updated.id)
      ? customer.interactions.map(i => i.id === updated.id ? updated : i)
      : [updated, ...customer.interactions];
    
    // Sort interactions by date descending
    newInteractions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    saveUpdate({ 
      interactions: newInteractions,
      lastMyReplyDate: updated.date,
      lastContactDate: updated.date
    });
    setEditingInteraction(null);
  };

  const deleteInteraction = (intId: string) => {
    if (confirm('Delete this interaction log?')) {
      const newInteractions = customer.interactions.filter(i => i.id !== intId);
      saveUpdate({ interactions: newInteractions });
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'My Turn' || status === '我方跟进') return t('statusMyTurn');
    if (status === 'Waiting for Customer' || status === '等待对方') return t('statusWaiting');
    if (status === 'No Action' || status === '暂无') return t('statusNoAction');
    return status;
  };

  const urgency = getUrgencyLevel(customer.nextActionDate);
  const urgencyClass = urgency === 'urgent' ? "bg-red-50 border-red-200" : urgency === 'warning' ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200";

  return (
    <div className="space-y-6 pb-12">
       {/* Header */}
       <div className="flex items-center gap-6">
         <button onClick={() => navigate('/customers')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shadow-sm bg-white dark:bg-slate-900">
           <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
         </button>
         <div className="flex-1">
           <div className="flex items-center gap-5">
             <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{customer.name}</h1>
             <RankStars rank={customer.rank} editable onRankChange={(r) => saveUpdate({ rank: r })} />
           </div>
           <div className="flex items-center gap-3 mt-2 text-slate-500">
             <MapPin size={16} /> 
             <input 
               className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none font-medium px-1" 
               value={customer.region.join(', ')} 
               onChange={(e) => saveUpdate({ region: e.target.value.split(',').map(r => r.trim()) })}
             />
           </div>
         </div>
       </div>

       {/* Interactive Metrics */}
       <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-600 flex flex-col justify-between h-40">
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('status')}</span>
             <div className="flex items-center gap-2 mb-2">
                 <StatusIcon status={customer.followUpStatus} />
                 <span className="font-black text-xl text-slate-800 dark:text-white truncate">
                   {getStatusLabel(customer.followUpStatus)}
                 </span>
             </div>
             <div className="flex gap-1.5 mt-auto">
               {['My Turn', 'Waiting for Customer', 'No Action'].map(opt => (
                 <button 
                  key={opt} 
                  onClick={() => saveUpdate({ followUpStatus: opt as FollowUpStatus })} 
                  className={`w-4 h-4 rounded-full border-2 transition-all ${customer.followUpStatus === opt ? 'bg-blue-600 border-blue-200 scale-110' : 'bg-slate-100 border-transparent hover:bg-slate-200'}`} 
                  title={opt} 
                 />
               ))}
             </div>
          </Card>
          
          <DaysCounter date={customer.nextActionDate} label={t('daysUntilDDL')} type="remaining" onDateChange={(d) => saveUpdate({ nextActionDate: d })} />
          <DaysCounter date={customer.lastStatusUpdate} label={t('daysSinceUpdate')} type="elapsed" onDateChange={(d) => saveUpdate({ lastStatusUpdate: d })} />
          <DaysCounter date={customer.lastCustomerReplyDate} label={t('unrepliedDays')} type="elapsed" onDateChange={(d) => saveUpdate({ lastCustomerReplyDate: d })} />
          <DaysCounter date={customer.lastMyReplyDate} label={t('unfollowedDays')} type="elapsed" onDateChange={(d) => saveUpdate({ lastMyReplyDate: d })} />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Sidebar */}
         <div className="space-y-6">
           {/* Contacts Card */}
           <Card className="p-6">
             <div className="flex justify-between items-center mb-6 pb-2 border-b">
               <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                 <UserCheck size={20} className="text-blue-600" /> {t('keyContacts')}
               </h3>
               <button onClick={() => setIsEditContactsOpen(true)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-slate-400 hover:text-blue-500 transition-colors">
                  <Edit3 size={18} />
               </button>
             </div>
             <div className="space-y-4">
               {customer.contacts.map((contact, idx) => (
                 <div key={idx} className={`p-4 rounded-xl border-2 ${contact.isPrimary ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                       <span className="font-bold text-slate-900">{contact.name}</span>
                       {contact.isPrimary && <Star size={14} className="fill-blue-500 text-blue-500" />}
                    </div>
                    <p className="text-xs font-bold text-blue-600 mb-2">{contact.title}</p>
                    <div className="text-[10px] space-y-1 text-slate-500 font-medium">
                       <div className="flex items-center gap-1.5"><Mail size={10}/> {contact.email || '-'}</div>
                       <div className="flex items-center gap-1.5"><Phone size={10}/> {contact.phone || '-'}</div>
                    </div>
                 </div>
               ))}
               <Button variant="ghost" className="w-full text-xs py-2 border-2 border-dashed border-slate-200" onClick={() => { setIsEditContactsOpen(true); addContact(); }}>
                 <Plus size={14} /> Add Contact
               </Button>
             </div>
           </Card>
           
           {/* Exhibitions Card */}
           <Card className="p-6">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                 <List size={20} className="text-indigo-600" /> {t('exhibitions')}
               </h3>
               <button onClick={() => { setTempTags(customer.tags.join(', ')); setIsEditTagsOpen(true); }} className="text-slate-400 hover:text-blue-500">
                 <Edit3 size={18} />
               </button>
             </div>
             <div className="flex flex-wrap gap-2">
               {customer.tags.length > 0 ? customer.tags.map((tag, i) => (
                 <Badge key={i} color="gray">{tag}</Badge>
               )) : <span className="text-xs text-slate-400 italic">No tags added.</span>}
             </div>
           </Card>
         </div>

         {/* Main Content */}
         <div className="lg:col-span-2 space-y-6">
            {/* Summary Card */}
            <Card className="overflow-hidden border-0 shadow-lg">
               <div className="px-6 py-4 bg-emerald-600 flex justify-between items-center">
                  <h3 className="font-black text-lg text-white flex items-center gap-2"><Box size={20}/> {t('productSummary')}</h3>
                  <button onClick={() => { setTempSummary(customer.productSummary); setIsEditSummaryOpen(true); }} className="p-1.5 rounded-md hover:bg-emerald-700 text-white transition-colors">
                    <Edit size={18}/>
                  </button>
               </div>
               <div className="p-8">
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-medium text-base">{customer.productSummary || "No summary provided."}</p>
                  <div className="mt-6 pt-4 border-t flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                     <span>{t('lastUpdated')}: {customer.lastStatusUpdate}</span>
                     <Badge color="green">{customer.status}</Badge>
                  </div>
               </div>
            </Card>

            {/* Tabs Navigation */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
              <button onClick={() => setActiveTab('overview')} className={`px-6 py-2 rounded-lg font-black text-xs transition-all ${activeTab === 'overview' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>{t('overview')}</button>
              <button onClick={() => setActiveTab('samples')} className={`px-6 py-2 rounded-lg font-black text-xs transition-all ${activeTab === 'samples' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`}>{t('samples')} ({customerSamples.length})</button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* Urgent Plan Section */}
                <div className={`p-6 rounded-2xl border-l-8 shadow-sm group relative ${urgencyClass}`}>
                  <button 
                    onClick={() => {
                      const latest = customer.interactions[0];
                      setEditingInteraction(latest || { id: `int_${Date.now()}`, date: format(new Date(), 'yyyy-MM-dd'), summary: '', nextSteps: '' });
                    }}
                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/50 rounded-lg hover:bg-white text-slate-600"
                  >
                    <Edit size={16} />
                  </button>
                  <div className="flex items-center gap-4 mb-3">
                     <Clock size={28} className="text-slate-900" />
                     <div>
                        <h4 className="font-black text-[10px] text-slate-500 tracking-widest uppercase">UPCOMING PLAN</h4>
                        <span className="text-xs font-black text-slate-900">DDL: {customer.nextActionDate || 'TBD'}</span>
                     </div>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{customer.interactions[0]?.nextSteps || "No upcoming plan logged."}</p>
                </div>

                {/* History Section */}
                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                     <h3 className="font-black text-xl text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar size={20} className="text-blue-600"/> {t('interactionHistory')}
                     </h3>
                     <Button variant="primary" className="text-xs py-1.5" onClick={() => setEditingInteraction({ id: `int_${Date.now()}`, date: format(new Date(), 'yyyy-MM-dd'), summary: '', nextSteps: '' })}>
                       <Plus size={14} /> Log Progress
                     </Button>
                   </div>
                   
                   <div className="relative border-l-4 border-slate-200 dark:border-slate-700 ml-4 pl-8 py-2 space-y-8">
                     {customer.interactions.length > 0 ? customer.interactions.map((int, i) => (
                       <div key={int.id} className="relative group">
                          <div className="absolute -left-[42px] top-0 w-6 h-6 rounded-full bg-white dark:bg-slate-900 border-4 border-blue-600 shadow-sm flex items-center justify-center font-black text-[8px]">{customer.interactions.length - i}</div>
                          <div className="flex items-center justify-between mb-2">
                             <span className="font-black text-sm text-slate-900 dark:text-white">{int.date}</span>
                             <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingInteraction(int)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500"><Edit size={14}/></button>
                                <button onClick={() => deleteInteraction(int.id)} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500"><Trash size={14}/></button>
                             </div>
                          </div>
                          <Card className="p-4 border-2 border-slate-100 dark:border-slate-800">
                             <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{int.summary}</p>
                             {int.nextSteps && (
                                <div className="mt-3 pt-3 border-t border-dashed border-slate-200">
                                   <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">Target Action:</span>
                                   <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{int.nextSteps}</p>
                                </div>
                             )}
                          </Card>
                       </div>
                     )) : (
                       <div className="text-slate-400 text-sm italic">No interactions logged yet.</div>
                     )}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'samples' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-right-4 duration-300">
                 {customerSamples.map(sample => (
                   <Card key={sample.id} className="p-5 hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-500 group" onClick={() => navigate(`/samples/${sample.id}`)}>
                      <div className="flex justify-between items-start mb-3">
                         <div className="p-2 bg-blue-50 dark:bg-blue-900/40 rounded-lg"><Box className="text-blue-600" size={18}/></div>
                         <Badge color="blue">{sample.status}</Badge>
                      </div>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1 group-hover:text-blue-600">{sample.sampleName}</h4>
                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-3 uppercase tracking-tighter">
                         <span>SKU: {sample.sampleSKU || '-'}</span>
                         <span>QTY: {sample.quantity}</span>
                      </div>
                   </Card>
                 ))}
                 {customerSamples.length === 0 && (
                   <div className="col-span-2 py-16 text-center border-2 border-dashed rounded-2xl text-slate-400">
                      <Box size={48} className="mx-auto mb-3 opacity-10" />
                      <p className="text-sm font-bold">No Samples Tracked</p>
                   </div>
                 )}
              </div>
            )}
         </div>
       </div>

       {/* --- Modals --- */}

       {/* Edit Summary Modal */}
       <Modal isOpen={isEditSummaryOpen} onClose={() => setIsEditSummaryOpen(false)} title={t('productSummary')}>
          <div className="space-y-4">
             <textarea 
               className="w-full h-64 p-4 border rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800"
               value={tempSummary}
               onChange={(e) => setTempSummary(e.target.value)}
             />
             <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setIsEditSummaryOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateSummary}><Save size={18} /> Save Summary</Button>
             </div>
          </div>
       </Modal>

       {/* Edit Contacts Modal */}
       <Modal isOpen={isEditContactsOpen} onClose={() => setIsEditContactsOpen(false)} title={t('keyContacts')}>
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
             {customer.contacts.map((contact, idx) => (
               <div key={idx} className="p-5 border-2 rounded-xl space-y-4 relative bg-slate-50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact #{idx + 1}</span>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => togglePrimaryContact(idx)}
                         className={`p-1.5 rounded-md ${contact.isPrimary ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400'}`}
                         title="Set as Primary"
                       >
                         <Star size={18} fill={contact.isPrimary ? 'currentColor' : 'none'} />
                       </button>
                       <button onClick={() => deleteContact(idx)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash size={18}/></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      placeholder="Name" 
                      className="p-2 border rounded-lg text-sm font-bold" 
                      value={contact.name} 
                      onChange={(e) => updateContact(idx, { name: e.target.value })} 
                    />
                    <input 
                      placeholder="Title" 
                      className="p-2 border rounded-lg text-sm" 
                      value={contact.title} 
                      onChange={(e) => updateContact(idx, { title: e.target.value })} 
                    />
                    <input 
                      placeholder="Email" 
                      className="p-2 border rounded-lg text-sm" 
                      value={contact.email} 
                      onChange={(e) => updateContact(idx, { email: e.target.value })} 
                    />
                    <input 
                      placeholder="Phone" 
                      className="p-2 border rounded-lg text-sm" 
                      value={contact.phone} 
                      onChange={(e) => updateContact(idx, { phone: e.target.value })} 
                    />
                  </div>
               </div>
             ))}
             <Button variant="secondary" className="w-full py-4 border-dashed border-2" onClick={addContact}>
               <Plus size={18} /> Add Another Contact
             </Button>
          </div>
          <div className="mt-8 flex justify-end">
             <Button onClick={() => setIsEditContactsOpen(false)}>Done</Button>
          </div>
       </Modal>

       {/* Edit Tags Modal */}
       <Modal isOpen={isEditTagsOpen} onClose={() => setIsEditTagsOpen(false)} title={t('exhibitions')}>
          <div className="space-y-4">
             <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Separate tags with commas</label>
             <input 
               className="w-full p-4 border rounded-xl font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
               value={tempTags}
               onChange={(e) => setTempTags(e.target.value)}
               placeholder="e.g. CES 2024, Industry Fair"
             />
             <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setIsEditTagsOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdateTags}>Save Tags</Button>
             </div>
          </div>
       </Modal>

       {/* Interaction Modal */}
       {editingInteraction && (
         <Modal isOpen={!!editingInteraction} onClose={() => setEditingInteraction(null)} title="Update Progress Log">
            <div className="space-y-5">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-black text-slate-400">DATE</label>
                    <input type="date" className="w-full p-2 border rounded-lg font-bold" value={editingInteraction.date} onChange={(e) => setEditingInteraction({...editingInteraction, date: e.target.value})} />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-black text-slate-400 uppercase">SUMMARY OF PROGRESS</label>
                  <textarea className="w-full h-32 p-3 border rounded-xl font-medium" placeholder="What happened in this interaction?" value={editingInteraction.summary} onChange={(e) => setEditingInteraction({...editingInteraction, summary: e.target.value})} />
               </div>
               <div className="space-y-1">
                  <label className="text-xs font-black text-blue-600 uppercase tracking-widest">NEXT STEP TARGET</label>
                  <input className="w-full p-3 border-2 border-blue-100 rounded-xl font-bold" placeholder="What is the next objective?" value={editingInteraction.nextSteps} onChange={(e) => setEditingInteraction({...editingInteraction, nextSteps: e.target.value})} />
               </div>
               <div className="flex justify-end gap-3 pt-4">
                  <Button variant="secondary" onClick={() => setEditingInteraction(null)}>Cancel</Button>
                  <Button onClick={() => saveInteraction(editingInteraction)}><Save size={18}/> Update Database</Button>
               </div>
            </div>
         </Modal>
       )}
    </div>
  );
};

export default CustomerProfile;
