
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

  const iconClass = "w-4 h-4 xl:w-5 xl:h-5";
  const regions = Array.isArray(customer.region) ? customer.region.join(' | ') : customer.region;

  return (
    <div className="space-y-6 xl:space-y-10">
       {/* Header */}
       <div className="flex items-center gap-4 xl:gap-6">
         <button onClick={() => navigate('/customers')} className="p-2 xl:p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
           <ArrowLeft className="w-5 h-5 xl:w-8 xl:h-8 text-slate-600 dark:text-slate-400" />
         </button>
         <div className="flex-1">
           <div className="flex items-center gap-3 xl:gap-5">
             <h1 className="text-3xl xl:text-5xl font-bold text-slate-900 dark:text-white">{customer.name}</h1>
             <RankStars rank={customer.rank} />
           </div>
           <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-2 text-sm xl:text-lg">
             <MapPin className={iconClass} /> {regions} 
             <span className="text-slate-300 dark:text-slate-600 mx-1">|</span>
             {customer.tags.map(t => <span key={t} className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs xl:text-sm text-slate-600 dark:text-slate-300">{t}</span>)}
           </p>
         </div>
       </div>

       {/* Top Metrics Bar: Tracking Timers */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 xl:gap-8">
          <Card className="p-4 xl:p-6 border-l-4 border-l-blue-500">
             <span className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase mb-1 block">{t('status')}</span>
             <div className="flex items-center gap-2 mb-2 xl:mb-4">
                <StatusIcon status={customer.followUpStatus} />
                <span className="font-bold text-slate-800 dark:text-white text-base xl:text-xl">{customer.followUpStatus || 'Unknown'}</span>
             </div>
             <div className="flex gap-2">
               {['My Turn', 'Waiting for Customer', 'No Action'].map(status => (
                 <button 
                   key={status}
                   onClick={() => updateFollowUpStatus(status as FollowUpStatus)}
                   className={`w-3 h-3 xl:w-5 xl:h-5 rounded-full border border-slate-300 dark:border-slate-600 ${customer.followUpStatus === status ? 'bg-blue-600 ring-2 ring-blue-200' : 'bg-white dark:bg-slate-700'}`}
                   title={`Set to ${status}`}
                 />
               ))}
             </div>
          </Card>

          <DaysCounter date={customer.lastStatusUpdate} label={t('daysSinceUpdate')} type="elapsed" />
          <DaysCounter date={customer.nextActionDate} label={t('daysUntilDDL')} type="remaining" />
          
          <div className="flex gap-2 xl:gap-4">
             <div className="flex-1"><DaysCounter date={customer.lastCustomerReplyDate} label={t('unrepliedDays')} type="elapsed" /></div>
             <div className="flex-1"><DaysCounter date={customer.lastMyReplyDate} label={t('unfollowedDays')} type="elapsed" /></div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-10">
         {/* Left Sidebar Info */}
         <div className="space-y-6 xl:space-y-8">
           <Card className="p-6 xl:p-8 space-y-4 xl:space-y-6">
             <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2 text-base xl:text-xl">
                {t('keyContacts')}
             </h3>
             <div className="space-y-4 xl:space-y-6">
               {customer.contacts.map((contact, idx) => (
                 <div key={idx} className="flex gap-3 xl:gap-4 items-start border-b border-slate-50 dark:border-slate-700/50 last:border-0 pb-3 xl:pb-4 last:pb-0">
                   <div className="w-8 h-8 xl:w-10 xl:h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs xl:text-sm shrink-0">
                     {contact.name.charAt(0)}
                   </div>
                   <div className="overflow-hidden">
                     <p className="font-bold text-slate-800 dark:text-white text-sm xl:text-lg truncate">{contact.name}</p>
                     <p className="text-xs xl:text-base text-slate-500 dark:text-slate-400 truncate">{contact.title}</p>
                     <div className="space-y-1 mt-2">
                       {contact.email && (
                         <div className="flex items-center gap-2 text-xs xl:text-sm text-slate-600 dark:text-slate-300 group cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                           <Mail className={iconClass} /> <span className="truncate">{contact.email}</span>
                         </div>
                       )}
                       {contact.phone && (
                          <div className="flex items-center gap-2 text-xs xl:text-sm text-slate-600 dark:text-slate-300 group cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                            <Phone className={iconClass} /> <span>{contact.phone}</span>
                          </div>
                       )}
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </Card>
           
           <Card className="p-6 xl:p-8 space-y-4 xl:space-y-6">
             <h3 className="font-bold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2 text-base xl:text-xl">
                <LinkIcon className={iconClass} /> {t('docLinks')}
             </h3>
             <div className="space-y-2 xl:space-y-3">
               {customer.docLinks && customer.docLinks.length > 0 ? (
                 customer.docLinks.map((link, i) => (
                   <a key={i} href={link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm xl:text-base text-blue-600 dark:text-blue-400 hover:underline p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded">
                     <ExternalLink className={iconClass} />
                     <span className="truncate">Document {i + 1}</span>
                   </a>
                 ))
               ) : (
                 <p className="text-xs xl:text-sm text-slate-400 italic">No documents linked.</p>
               )}
               <Button variant="ghost" className="w-full text-xs xl:text-sm flex items-center justify-center gap-1 mt-2">
                  <Plus className={iconClass} /> Add Link
               </Button>
             </div>
           </Card>
         </div>

         {/* Main Content Area */}
         <div className="lg:col-span-2">
            {/* Status & Product Summary Box - IMPORTANT */}
            <Card className="mb-6 xl:mb-10 border-l-4 border-l-emerald-500">
               <div className="p-4 xl:p-6 bg-emerald-50/50 dark:bg-emerald-900/20 flex justify-between items-start border-b border-emerald-100 dark:border-emerald-800">
                  <h3 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-2 text-base xl:text-xl">
                    <Box className="w-5 h-5 xl:w-6 xl:h-6" /> {t('productSummary')}
                  </h3>
                  {!isEditingSummary ? (
                    <button onClick={startEdit} className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900">
                      <Edit className="w-5 h-5 xl:w-6 xl:h-6" />
                    </button>
                  ) : (
                    <div className="flex gap-2">
                       <button onClick={handleSaveSummary} className="text-emerald-700 bg-white dark:bg-slate-700 p-1.5 rounded shadow-sm"><Save className="w-5 h-5" /></button>
                       <button onClick={() => setIsEditingSummary(false)} className="text-red-500 bg-white dark:bg-slate-700 p-1.5 rounded shadow-sm"><X className="w-5 h-5" /></button>
                    </div>
                  )}
               </div>
               <div className="p-5 xl:p-8">
                  {isEditingSummary ? (
                    <textarea 
                      className="w-full border border-emerald-200 dark:border-emerald-700 rounded-lg p-3 text-base xl:text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[150px] bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      value={editSummaryText}
                      onChange={(e) => setEditSummaryText(e.target.value)}
                    />
                  ) : (
                    <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed text-sm xl:text-xl">
                      {customer.productSummary || "No summary provided."}
                    </p>
                  )}
                  <div className="mt-4 text-xs xl:text-sm text-slate-400 text-right">
                    {t('lastUpdated')}: {customer.lastStatusUpdate || 'Never'}
                  </div>
               </div>
            </Card>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6 xl:mb-8 bg-white dark:bg-slate-800 rounded-t-lg">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 xl:px-8 xl:py-4 font-medium text-sm xl:text-lg border-b-2 transition-colors ${activeTab === 'overview' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              >
                {t('overview')}
              </button>
              <button 
                onClick={() => setActiveTab('samples')}
                className={`px-6 py-3 xl:px-8 xl:py-4 font-medium text-sm xl:text-lg border-b-2 transition-colors ${activeTab === 'samples' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              >
                {t('samples')} ({customerSamples.length})
              </button>
            </div>

            {/* Overview Tab (Merged History) */}
            {activeTab === 'overview' && (
              <div className="space-y-6 xl:space-y-8">
                
                {/* Next Steps Highlight */}
                {customer.interactions.length > 0 && customer.interactions[0].nextSteps && (
                   <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40 p-4 xl:p-6 rounded-lg flex gap-3 xl:gap-5 mb-6 xl:mb-8">
                      <Clock className="text-amber-500 shrink-0 w-5 h-5 xl:w-8 xl:h-8" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                           <p className="text-slate-800 dark:text-white font-bold text-sm xl:text-lg">Next Step</p>
                           <p className="text-xs xl:text-base font-bold text-red-500">DDL: {customer.nextActionDate}</p>
                        </div>
                        <p className="text-sm xl:text-lg text-slate-700 dark:text-slate-300 mt-1">{customer.interactions[0].nextSteps}</p>
                      </div>
                   </div>
                )}

                <div className="flex justify-between items-center mb-4 xl:mb-6">
                   <h3 className="font-bold text-slate-800 dark:text-white text-base xl:text-xl">{t('interactionHistory')}</h3>
                   <Button variant="secondary" className="text-xs xl:text-sm py-1 xl:py-2"><Plus className="w-3.5 h-3.5 xl:w-5 xl:h-5 mr-1"/> {t('logInteraction')}</Button>
                </div>

                <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 xl:ml-6 space-y-8 xl:space-y-12 pl-8 xl:pl-10 py-2">
                  {customer.interactions.map((interaction, idx) => (
                    <div key={interaction.id} className="relative">
                       {/* Timeline Dot */}
                       <div className="absolute -left-[41px] xl:-left-[50px] top-0 w-5 h-5 xl:w-6 xl:h-6 rounded-full bg-white dark:bg-slate-900 border-4 border-blue-600 shadow-sm"></div>
                       
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 xl:mb-3">
                         <span className="text-sm xl:text-lg font-bold text-slate-800 dark:text-slate-200">{interaction.date}</span>
                         <div className="flex gap-2 mt-1 sm:mt-0">
                           {interaction.tags?.map(t => <Badge key={t} color="purple">{t}</Badge>)}
                         </div>
                       </div>
                       
                       <Card className="p-4 xl:p-6 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
                         <p className="text-slate-700 dark:text-slate-300 text-sm xl:text-lg whitespace-pre-wrap">{interaction.summary}</p>
                         
                         {interaction.docLinks && interaction.docLinks.length > 0 && (
                           <div className="mt-3 xl:mt-4 flex flex-wrap gap-2">
                             {interaction.docLinks.map((link, li) => (
                               <a key={li} href={link} target="_blank" className="flex items-center gap-1 text-xs xl:text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 xl:px-3 xl:py-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50">
                                 <LinkIcon className="w-3 h-3 xl:w-4 xl:h-4" /> Link {li+1}
                               </a>
                             ))}
                           </div>
                         )}

                         {interaction.nextSteps && (
                           <div className="mt-3 pt-3 xl:mt-4 xl:pt-4 border-t border-slate-100 dark:border-slate-700 text-xs xl:text-base text-slate-500 flex gap-2">
                             <span className="font-bold text-amber-600 dark:text-amber-500">Next:</span> {interaction.nextSteps}
                           </div>
                         )}
                       </Card>
                    </div>
                  ))}
                  {customer.interactions.length === 0 && <p className="text-slate-500 dark:text-slate-400 text-sm xl:text-lg italic">No interactions recorded yet.</p>}
                </div>
              </div>
            )}

            {/* Samples Tab */}
            {activeTab === 'samples' && (
              <div className="space-y-4 xl:space-y-6">
                 <div className="flex justify-end">
                   <Button className="flex items-center gap-2 text-sm xl:text-base"><Plus className={iconClass} /> {t('newRequest')}</Button>
                 </div>
                 {customerSamples.length === 0 ? (
                   <div className="text-center p-8 xl:p-12 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-slate-400">
                     <Box className="mx-auto mb-2 opacity-50 w-10 h-10 xl:w-16 xl:h-16" />
                     <p className="text-sm xl:text-lg">{t('noSamples')}</p>
                   </div>
                 ) : (
                   customerSamples.map(sample => (
                     <Card key={sample.id} className="p-4 xl:p-6 hover:shadow-md transition-all">
                       <div className="flex justify-between items-start">
                         <div className="flex gap-4 xl:gap-6">
                            <div className="p-3 xl:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg h-fit">
                              <Box className="text-blue-600 dark:text-blue-400 w-5 h-5 xl:w-7 xl:h-7" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 xl:gap-3">
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm xl:text-xl">{sample.productType}</h4>
                                <Badge color="gray">{sample.quantity}</Badge>
                              </div>
                              <p className="text-sm xl:text-lg text-slate-600 dark:text-slate-300 mt-1">{t('specs')}: {sample.specs}</p>
                              <div className="mt-2 text-xs xl:text-base text-slate-500 dark:text-slate-400 flex items-center gap-4">
                                <span>Requested: {sample.requestDate}</span>
                                {sample.trackingNumber && (
                                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><ExternalLink className="w-3 h-3 xl:w-4 xl:h-4" /> {sample.trackingNumber}</span>
                                )}
                              </div>
                            </div>
                         </div>
                         <div className="text-right">
                           <div className="flex items-center justify-end gap-1 mb-2">
                              <StatusIcon status={sample.status} />
                              <span className="font-medium text-sm xl:text-lg text-slate-700 dark:text-slate-300">{sample.status}</span>
                           </div>
                           {sample.feedback && (
                             <div className="text-xs xl:text-sm bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-2 py-1 xl:px-3 xl:py-2 rounded max-w-[200px] xl:max-w-[300px] truncate">
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
