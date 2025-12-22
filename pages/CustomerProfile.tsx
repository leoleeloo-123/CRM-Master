
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, Sample, FollowUpStatus, Interaction, Contact, Rank } from '../types';
import { Card, Button, RankStars, Badge, StatusIcon, DaysCounter, getUrgencyLevel } from '../components/Common';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Clock, Plus, Box, Save, X, Trash2, List, Calendar, UserCheck, Star } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'samples'>('overview');
  
  const customer = customers.find(c => c.id === id);
  const customerSamples = samples.filter(s => s.customerId === id);

  if (!customer) {
    return <div className="p-8 text-center text-slate-500">Customer not found. <Button onClick={() => navigate('/customers')}>{t('back')}</Button></div>;
  }

  const handleRankChange = (newRank: Rank) => {
    onUpdateCustomer({ ...customer, rank: newRank });
  };

  const updateFollowUpStatus = (newStatus: FollowUpStatus) => {
    onUpdateCustomer({ ...customer, followUpStatus: newStatus });
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
    <div className="space-y-6 xl:space-y-10 pb-12">
       {/* Header */}
       <div className="flex items-center gap-6">
         <button onClick={() => navigate('/customers')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors shadow-sm bg-white dark:bg-slate-900">
           <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
         </button>
         <div className="flex-1">
           <div className="flex items-center gap-5">
             <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{customer.name}</h1>
             <RankStars rank={customer.rank} editable onRankChange={handleRankChange} />
           </div>
           <p className="text-slate-500 flex items-center gap-3 mt-2 text-lg">
             <MapPin size={18} /> {customer.region.join(' | ')} 
             <span className="text-slate-300">|</span>
             {customer.tags.map(t => <Badge key={t} color={t === 'Actively Connecting' ? 'blue' : 'gray'}>{t}</Badge>)}
           </p>
         </div>
       </div>

       {/* Metrics Bar */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 border-l-4 border-l-blue-600 flex flex-col justify-between h-40">
             <span className="text-xs font-black uppercase text-slate-400 mb-1">{t('status')}</span>
             <div className="flex items-center gap-2 mb-4">
                 <StatusIcon status={customer.followUpStatus} />
                 <span className="font-black text-2xl text-slate-800 dark:text-white">
                   {getStatusLabel(customer.followUpStatus)}
                 </span>
             </div>
             <div className="flex gap-2">
               {['My Turn', 'Waiting for Customer', 'No Action'].map(opt => (
                 <button key={opt} onClick={() => updateFollowUpStatus(opt as FollowUpStatus)} className={`w-5 h-5 rounded-full border-2 transition-all ${customer.followUpStatus === opt ? 'bg-blue-600 border-blue-200 scale-125' : 'bg-slate-200 border-transparent'}`} title={opt} />
               ))}
             </div>
          </Card>
          <DaysCounter date={customer.nextActionDate} label={t('daysUntilDDL')} type="remaining" />
          <DaysCounter date={customer.lastStatusUpdate} label={t('daysSinceUpdate')} type="elapsed" />
          <DaysCounter date={customer.lastCustomerReplyDate} label={t('unrepliedDays')} type="elapsed" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Sidebar: Key Contacts & exhibitions */}
         <div className="space-y-8">
           <Card className="p-8">
             <h3 className="font-black text-xl text-slate-900 dark:text-white border-b pb-4 mb-6 flex items-center gap-2">
               <UserCheck size={24} className="text-blue-600" /> {t('keyContacts')}
             </h3>
             <div className="space-y-6">
               {customer.contacts.map((contact, idx) => (
                 <div key={idx} className={`p-4 rounded-xl border-2 transition-all ${contact.isPrimary ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                       <span className="font-black text-lg text-slate-900">{contact.name}</span>
                       {contact.isPrimary && <Star size={18} className="fill-blue-500 text-blue-500" />}
                    </div>
                    <p className="text-sm font-bold text-blue-600 mb-3">{contact.title}</p>
                    <div className="space-y-1.5 text-xs text-slate-500">
                       <div className="flex items-center gap-2"><Mail size={12}/> {contact.email || '-'}</div>
                       <div className="flex items-center gap-2"><Phone size={12}/> {contact.phone || '-'}</div>
                    </div>
                 </div>
               ))}
               <Button variant="ghost" className="w-full text-xs py-2 border-2 border-dashed border-slate-200"><Plus size={14} className="mr-1" /> Add Contact</Button>
             </div>
           </Card>
           
           <Card className="p-8">
             <h3 className="font-black text-xl text-slate-900 dark:text-white border-b pb-4 mb-6 flex items-center gap-2">
               <List size={24} className="text-indigo-600" /> {t('exhibitions')}
             </h3>
             <div className="flex flex-wrap gap-2">
               {customer.tags.filter(t => t !== 'Actively Connecting').map((tag, i) => (
                 <Badge key={i} color="gray">{tag}</Badge>
               ))}
             </div>
           </Card>
         </div>

         {/* Main Content */}
         <div className="lg:col-span-2 space-y-8">
            <Card className="overflow-hidden border-0 shadow-xl">
               <div className="p-6 bg-emerald-600 flex justify-between items-center">
                  <h3 className="font-black text-xl text-white flex items-center gap-2"><Box size={24}/> {t('productSummary')}</h3>
                  <Button variant="ghost" className="text-white hover:bg-emerald-700 p-2"><Edit size={20}/></Button>
               </div>
               <div className="p-10">
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-lg font-medium">{customer.productSummary || "No summary provided."}</p>
                  <div className="mt-8 pt-6 border-t flex justify-between items-center text-sm text-slate-400">
                     <span>{t('lastUpdated')}: {customer.lastStatusUpdate}</span>
                     <Badge color="green">Active Prospect</Badge>
                  </div>
               </div>
            </Card>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-fit">
              <button onClick={() => setActiveTab('overview')} className={`px-8 py-3 rounded-lg font-black text-sm transition-all ${activeTab === 'overview' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t('overview')}</button>
              <button onClick={() => setActiveTab('samples')} className={`px-8 py-3 rounded-lg font-black text-sm transition-all ${activeTab === 'samples' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t('samples')} ({customerSamples.length})</button>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-10">
                <div className={`p-8 rounded-2xl border-4 ${urgencyClass}`}>
                  <div className="flex items-center gap-4 mb-4">
                     <Clock size={32} className="text-slate-900" />
                     <div>
                        <h4 className="font-black text-slate-900">NEXT STEP</h4>
                        <span className="text-sm font-black text-slate-500 uppercase">DDL: {customer.nextActionDate || 'TBD'}</span>
                     </div>
                  </div>
                  <p className="text-xl font-black text-slate-800">{customer.interactions[0]?.nextSteps || "Review recent communications for next plan."}</p>
                </div>

                <div className="space-y-6">
                   <h3 className="font-black text-2xl text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar size={24} className="text-blue-600"/> {t('interactionHistory')}
                   </h3>
                   <div className="relative border-l-4 border-slate-200 dark:border-slate-700 ml-6 pl-10 py-4 space-y-10">
                     {customer.interactions.map((int, i) => (
                       <div key={int.id} className="relative group">
                          <div className="absolute -left-[54px] top-0 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border-4 border-blue-600 shadow-sm flex items-center justify-center font-black text-[10px]">{customer.interactions.length - i}</div>
                          <div className="flex items-center gap-4 mb-3">
                             <span className="font-black text-lg text-slate-900 dark:text-white">{int.date}</span>
                          </div>
                          <Card className="p-6 hover:shadow-2xl transition-all border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                             <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">{int.summary}</p>
                             {int.nextSteps && (
                                <div className="mt-4 pt-4 border-t border-dashed">
                                   <span className="text-xs font-black text-blue-600 uppercase tracking-widest block mb-1">Follow-up Plan:</span>
                                   <p className="text-sm font-bold text-slate-800">{int.nextSteps}</p>
                                </div>
                             )}
                          </Card>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'samples' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {customerSamples.map(sample => (
                   <Card key={sample.id} className="p-6 hover:shadow-2xl transition-all cursor-pointer border-2 hover:border-blue-500" onClick={() => navigate(`/samples/${sample.id}`)}>
                      <div className="flex justify-between items-start mb-4">
                         <div className="p-3 bg-blue-50 rounded-xl"><Box className="text-blue-600" size={24}/></div>
                         <Badge color="blue">{sample.status}</Badge>
                      </div>
                      <h4 className="font-black text-xl text-slate-900 mb-1">{sample.sampleName}</h4>
                      <div className="text-xs font-bold text-slate-400 mb-4 flex items-center gap-3">
                         <span>SKU: {sample.sampleSKU || '-'}</span>
                         <span>QTY: {sample.quantity}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-black">
                         <span className="text-slate-400">Sent: {sample.requestDate}</span>
                         <span className="text-blue-600">Track: {sample.trackingNumber || 'N/A'}</span>
                      </div>
                   </Card>
                 ))}
                 {customerSamples.length === 0 && (
                   <div className="col-span-2 py-20 text-center border-4 border-dashed rounded-3xl text-slate-400">
                      <Box size={64} className="mx-auto mb-4 opacity-20" />
                      <p className="text-xl font-black">No Samples Found</p>
                      <Button className="mt-6" variant="secondary"><Plus size={18} className="mr-2"/> Request Sample</Button>
                   </div>
                 )}
              </div>
            )}
         </div>
       </div>
    </div>
  );
};

export default CustomerProfile;
