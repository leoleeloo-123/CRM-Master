import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, Sample, FollowUpStatus } from '../types';
import { Card, Button, RankStars, Badge, StatusIcon, DaysCounter } from '../components/Common';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Clock, Plus, Box, ExternalLink, Link as LinkIcon, Save, X } from 'lucide-react';
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
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editSummaryText, setEditSummaryText] = useState('');

  const customer = customers.find(c => c.id === id);
  const customerSamples = samples.filter(s => s.customerId === id);

  if (!customer) {
    return <div className="p-8 text-center text-slate-500 dark:text-slate-400">Customer not found. <Button onClick={() => navigate('/customers')}>{t('back')}</Button></div>;
  }

  const handleSaveSummary = () => {
    onUpdateCustomer({
      ...customer,
      productSummary: editSummaryText,
      lastStatusUpdate: format(new Date(), 'yyyy-MM-dd')
    });
    setIsEditingSummary(false);
  };

  const startEdit = () => {
    setEditSummaryText(customer.productSummary || '');
    setIsEditingSummary(true);
  };

  const updateFollowUpStatus = (newStatus: FollowUpStatus) => {
    onUpdateCustomer({ ...customer, followUpStatus: newStatus });
  };

  return (
    <div className="space-y-6">
       {/* Header */}
       <div className="flex items-center gap-4">
         <button onClick={() => navigate('/customers')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
           <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
         </button>
         <div className="flex-1">
           <div className="flex items-center gap-3">
             <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
             <RankStars rank={customer.rank} />
           </div>
           <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
             <MapPin size={14} /> {customer.region} 
             <span className="text-slate-300 dark:text-slate-600">|</span>
             {customer.tags.map(t => <span key={t} className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs text-slate-600 dark:text-slate-300">{t}</span>)}
           </p>
         </div>
       </div>

       {/* Top Metrics Bar: Tracking Timers */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-500">
             <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase mb-1 block">{t('status')}</span>
             <div className="flex items-center gap-2 mb-2">
                <StatusIcon status={customer.followUpStatus} />
                <span className="font-bold text-slate-800 dark:text-white">{customer.followUpStatus || 'Unknown'}</span>
             </div>
             <div className="flex gap-1">
               {['My Turn', 'Waiting for Customer', 'No Action'].map(status => (
                 <button 
                   key={status}
                   onClick={() => updateFollowUpStatus(status as FollowUpStatus)}
                   className={`w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 ${customer.followUpStatus === status ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-white dark:bg-slate-700'}`}
                   title={`Set to ${status}`}
                 />
               ))}
             </div>
          </Card>

          <DaysCounter date={customer.lastStatusUpdate} label={t('daysSinceUpdate')} type="elapsed" />
          <DaysCounter date={customer.nextActionDate} label={t('daysUntilDDL')} type="remaining" />
          
          <div className="flex gap-2">
             <DaysCounter date={customer.lastCustomerReplyDate} label={t('unrepliedDays')} type="elapsed" />
             <DaysCounter date={customer.lastMyReplyDate} label={t('unfollowedDays')} type="elapsed" />
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left Sidebar Info */}
         <div className="space-y-6">
           <Card className="p-6 space-y-4">
             <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                {t('keyContacts')}
             </h3>
             <div className="space-y-4">
               {customer.contacts.map((contact, idx) => (
                 <div key={idx} className="flex gap-3 items-start border-b border-slate-50 dark:border-slate-700/50 last:border-0 pb-3 last:pb-0">
                   <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs shrink-0">
                     {contact.name.charAt(0)}
                   </div>
                   <div className="overflow-hidden">
                     <p className="font-bold text-slate-800 dark:text-white text-sm truncate">{contact.name}</p>
                     <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{contact.title}</p>
                     <div className="space-y-1 mt-2">
                       {contact.email && (
                         <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 group cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                           <Mail size={12} /> <span className="truncate">{contact.email}</span>
                         </div>
                       )}
                       {contact.phone && (
                          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 group cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                            <Phone size={12} /> <span>{contact.phone}</span>
                          </div>
                       )}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </Card>
           
           <Card className="p-6 space-y-4">
             <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                <LinkIcon size={16} /> {t('docLinks')}
             </h3>
             <div className="space-y-2">
               {customer.docLinks && customer.docLinks.length > 0 ? (
                 customer.docLinks.map((link, i) => (
                   <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded">
                     <ExternalLink size={14} />
                     <span className="truncate">Document {i + 1}</span>
                   </a>
                 ))
               ) : (
                 <p className="text-xs text-slate-400 italic">No documents linked.</p>
               )}
               <Button variant="ghost" className="w-full text-xs flex items-center justify-center gap-1 mt-2">
                  <Plus size={12} /> Add Link
               </Button>
             </div>
           </Card>
         </div>

         {/* Main Content Area */}
         <div className="lg:col-span-2">
            {/* Status & Product Summary Box - IMPORTANT */}
            <Card className="mb-6 border-l-4 border-l-emerald-500">
               <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/20 flex justify-between items-start border-b border-emerald-100 dark:border-emerald-800">
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
                    <Box size={18} /> {t('productSummary')}
                  </h3>
                  {!isEditingSummary ? (
                    <button onClick={startEdit} className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900">
                      <Edit size={16} />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                       <button onClick={handleSaveSummary} className="text-emerald-700 bg-white dark:bg-slate-700 p-1 rounded shadow-sm"><Save size={16} /></button>
                       <button onClick={() => setIsEditingSummary(false)} className="text-red-500 bg-white dark:bg-slate-700 p-1 rounded shadow-sm"><X size={16} /></button>
                    </div>
                  )}
               </div>
               <div className="p-5">
                  {isEditingSummary ? (
                    <textarea 
                      className="w-full border border-emerald-200 dark:border-emerald-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[120px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      value={editSummaryText}
                      onChange={(e) => setEditSummaryText(e.target.value)}
                    />
                  ) : (
                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-sm">
                      {customer.productSummary || "No summary provided."}
                    </p>
                  )}
                  <div className="mt-3 text-xs text-slate-400 text-right">
                    {t('lastUpdated')}: {customer.lastStatusUpdate || 'Never'}
                  </div>
               </div>
            </Card>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 bg-white dark:bg-slate-800 rounded-t-lg">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              >
                {t('overview')}
              </button>
              <button 
                onClick={() => setActiveTab('samples')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${activeTab === 'samples' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              >
                {t('samples')} ({customerSamples.length})
              </button>
            </div>

            {/* Overview Tab (Merged History) */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* Next Steps Highlight */}
                {customer.interactions.length > 0 && customer.interactions[0].nextSteps && (
                   <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 p-4 rounded-lg flex gap-3 mb-6">
                      <Clock className="text-amber-500 shrink-0" size={20} />
                      <div className="flex-1">
                        <div className="flex justify-between">
                           <p className="text-slate-800 dark:text-white font-bold text-sm">Next Step</p>
                           <p className="text-xs font-bold text-red-500">DDL: {customer.nextActionDate}</p>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{customer.interactions[0].nextSteps}</p>
                      </div>
                   </div>
                )}

                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-800 dark:text-white">{t('interactionHistory')}</h3>
                   <Button variant="secondary" className="text-xs py-1"><Plus size={14} className="mr-1"/> {t('logInteraction')}</Button>
                </div>

                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-8 pl-8 py-2">
                  {customer.interactions.map((interaction, idx) => (
                    <div key={interaction.id} className="relative">
                       {/* Timeline Dot */}
                       <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-4 border-blue-600 shadow-sm"></div>
                       
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                         <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{interaction.date}</span>
                         <div className="flex gap-2 mt-1 sm:mt-0">
                           {interaction.tags?.map(t => <Badge key={t} color="purple">{t}</Badge>)}
                         </div>
                       </div>
                       
                       <Card className="p-4 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
                         <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">{interaction.summary}</p>
                         
                         {interaction.docLinks && interaction.docLinks.length > 0 && (
                           <div className="mt-3 flex flex-wrap gap-2">
                             {interaction.docLinks.map((link, li) => (
                               <a key={li} href={link} target="_blank" className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                 <LinkIcon size={10} /> Link {li+1}
                               </a>
                             ))}
                           </div>
                         )}

                         {interaction.nextSteps && (
                           <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 flex gap-2">
                             <span className="font-bold text-amber-600 dark:text-amber-500">Next:</span> {interaction.nextSteps}
                           </div>
                         )}
                       </Card>
                    </div>
                  ))}
                  {customer.interactions.length === 0 && <p className="text-slate-500 dark:text-slate-400 text-sm italic">No interactions recorded yet.</p>}
                </div>
              </div>
            )}

            {/* Samples Tab */}
            {activeTab === 'samples' && (
              <div className="space-y-4">
                 <div className="flex justify-end">
                   <Button className="flex items-center gap-2 text-sm"><Plus size={14} /> {t('newRequest')}</Button>
                 </div>
                 {customerSamples.length === 0 ? (
                   <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400">
                     <Box size={40} className="mx-auto mb-2 opacity-50" />
                     <p>{t('noSamples')}</p>
                   </div>
                 ) : (
                   customerSamples.map(sample => (
                     <Card key={sample.id} className="p-4 hover:shadow-md transition-all">
                       <div className="flex justify-between items-start">
                         <div className="flex gap-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg h-fit">
                              <Box className="text-blue-600 dark:text-blue-400" size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-slate-800 dark:text-white">{sample.productType}</h4>
                                <Badge color="gray">{sample.quantity}</Badge>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{t('specs')}: {sample.specs}</p>
                              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-4">
                                <span>Requested: {sample.requestDate}</span>
                                {sample.trackingNumber && (
                                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><ExternalLink size={10} /> {sample.trackingNumber}</span>
                                )}
                              </div>
                            </div>
                         </div>
                         <div className="text-right">
                           <div className="flex items-center justify-end gap-1 mb-2">
                              <StatusIcon status={sample.status} />
                              <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{sample.status}</span>
                           </div>
                           {sample.feedback && (
                             <div className="text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-2 py-1 rounded max-w-[200px] truncate">
                               Feedback: {sample.feedback}
                             </div>
                           )}
                         </div>
                       </div>
                     </Card>
                   ))
                 )}
              </div>
            )}
         </div>
       </div>
    </div>
  );
};

export default CustomerProfile;