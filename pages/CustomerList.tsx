
import React, { useState } from 'react';
import { Customer, Rank, CustomerStatus } from '../types';
import { Card, Button, RankStars, StatusIcon, Modal, Badge } from '../components/Common';
import { Search, Plus, ChevronRight, Filter, Star, RefreshCcw, ExternalLink, User, Activity, Clock, X, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { differenceInDays, isValid } from 'date-fns';

interface CustomerListProps {
  customers: Customer[];
}

const CustomerList: React.FC<CustomerListProps> = ({ customers }) => {
  const navigate = useNavigate();
  const { t, setCustomers, refreshAllCustomerDates } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // New Filter States
  const [selectedRanks, setSelectedRanks] = useState<number[]>([1, 2]); // Default 5 and 4 stars
  const [unrepliedFilter, setUnrepliedFilter] = useState<string>('all');
  const [unfollowedFilter, setUnfollowedFilter] = useState<string>('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New Customer State
  const [newCustomer, setNewCustomer] = useState<{name: string, region: string, rank: Rank, contactName: string, contactEmail: string}>({
    name: '',
    region: '',
    rank: 3,
    contactName: '',
    contactEmail: ''
  });

  // Helper to detect Chinese characters
  const hasChinese = (str: string) => /[\u4e00-\u9fa5]/.test(str);

  const getAgingDays = (dateStr: string | undefined) => {
    if (!dateStr || !isValid(new Date(dateStr))) return null;
    return differenceInDays(new Date(), new Date(dateStr));
  };

  const matchesAgingFilter = (days: number | null, filter: string) => {
    if (filter === 'all') return true;
    if (days === null) return false;
    if (filter === 'under7') return days < 7;
    if (filter === '7to21') return days >= 7 && days <= 21;
    if (filter === 'over21') return days > 21;
    return true;
  };

  // Define resetFilters to clear all search and filter criteria
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedRanks([1, 2, 3, 4, 5]);
    setUnrepliedFilter('all');
    setUnfollowedFilter('all');
  };

  // Sorting and Filtering Logic
  const filteredCustomers = customers
    .filter(c => {
      const regionString = Array.isArray(c.region) ? c.region.join(' ') : c.region;
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            regionString.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRank = selectedRanks.length === 0 || selectedRanks.includes(c.rank);
      
      const unrepliedDays = getAgingDays(c.lastCustomerReplyDate);
      const unfollowedDays = getAgingDays(c.lastMyReplyDate);
      
      const matchesUnreplied = matchesAgingFilter(unrepliedDays, unrepliedFilter);
      const matchesUnfollowed = matchesAgingFilter(unfollowedDays, unfollowedFilter);

      return matchesSearch && matchesRank && matchesUnreplied && matchesUnfollowed;
    })
    .sort((a, b) => {
      // 1. Primary sort: Rank (1 is highest priority, 5 is lowest)
      if (a.rank !== b.rank) {
        return a.rank - b.rank;
      }

      // 2. Secondary sort: Next Action Date (Soonest first)
      const dateA = a.nextActionDate || '9999-12-31';
      const dateB = b.nextActionDate || '9999-12-31';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }

      // 3. Quaternary sort: Alphabetical (Pure English first, then Chinese)
      const aIsZh = hasChinese(a.name);
      const bIsZh = hasChinese(b.name);

      if (!aIsZh && bIsZh) return -1;
      if (aIsZh && !bIsZh) return 1;
      
      return a.name.localeCompare(b.name, 'zh-Hans-CN', { sensitivity: 'accent' });
    });

  const getDaysSinceColor = (dateStr: string | undefined) => {
    if (!dateStr || !isValid(new Date(dateStr))) return "text-slate-400";
    const diff = differenceInDays(new Date(), new Date(dateStr));
    if (diff < 7) return "text-emerald-600 font-black";
    if (diff <= 21) return "text-amber-500 font-black";
    return "text-red-500 font-black";
  };

  const handleCreateCustomer = () => {
    if (!newCustomer.name) {
      alert('Customer Name is required');
      return;
    }

    const newId = `c_${Date.now()}`;
    const now = new Date().toISOString().split('T')[0];

    const customer: Customer = {
       id: newId,
       name: newCustomer.name,
       region: [newCustomer.region || 'Unknown'],
       rank: newCustomer.rank,
       status: 'Active',
       productSummary: '',
       lastStatusUpdate: now,
       followUpStatus: 'No Action',
       contacts: newCustomer.contactName ? [{
         name: newCustomer.contactName,
         title: '',
         email: newCustomer.contactEmail,
         isPrimary: true
       }] : [],
       lastContactDate: now,
       tags: [],
       interactions: []
    };

    setCustomers(prev => [...prev, customer]);
    setIsAddModalOpen(false);
    navigate(`/customers/${newId}`);
  };

  const handleGlobalRefresh = () => {
    setIsRefreshing(true);
    refreshAllCustomerDates();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const toggleRank = (rank: number) => {
    setSelectedRanks(prev => 
      prev.includes(rank) ? prev.filter(r => r !== rank) : [...prev, rank]
    );
  };

  const parseLogContent = (summary: string) => {
    return summary
      .replace(/\(标星记录\)|\(一般记录\)/g, '')
      .replace(/<.*?>/g, '')
      .replace(/{.*?}/g, '')
      .trim();
  };

  const hasActiveFilters = searchTerm !== '' || selectedRanks.length !== 5 || unrepliedFilter !== 'all' || unfollowedFilter !== 'all';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl xl:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('customerDatabase')}</h2>
          <p className="text-sm xl:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">{t('manageClients')}</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={handleGlobalRefresh}
             title="Refresh All Dates"
             className={`p-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all active:scale-90 bg-white dark:bg-slate-900 shadow-sm ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
           >
             <RefreshCcw size={20} />
           </button>
           <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-8 py-3 rounded-2xl shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
             <Plus size={20} />
             <span className="font-black uppercase tracking-widest text-sm">{t('add')}</span>
           </Button>
           <Button variant="secondary" onClick={() => navigate('/data-management')} className="flex items-center gap-2 px-8 py-3 rounded-2xl shadow-sm active:scale-95 transition-all">
             <span className="font-black uppercase tracking-widest text-sm">{t('import')}</span>
           </Button>
        </div>
      </div>

      <Card className="p-6 xl:p-8 border-2 rounded-2xl">
        <div className="space-y-6">
          {/* Main Search */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input 
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:border-blue-500 font-bold transition-all shadow-sm"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-4">
             {/* Multi-Rank Filter */}
             <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Rank:</span>
                {[1, 2, 3, 4, 5].map(r => {
                  const stars = 6 - r;
                  const isActive = selectedRanks.includes(r);
                  return (
                    <button 
                      key={r}
                      onClick={() => toggleRank(r)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}
                      title={`${stars} Stars`}
                    >
                      <span className="text-xs font-black">{stars}</span>
                      <Star size={12} fill={isActive ? "currentColor" : "none"} />
                    </button>
                  );
                })}
             </div>

             {/* Unreplied Filter */}
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <Activity size={18} className="text-slate-400" />
                <select 
                  className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300"
                  value={unrepliedFilter}
                  onChange={(e) => setUnrepliedFilter(e.target.value)}
                >
                  <option value="all">Unreplied: All</option>
                  <option value="under7">&lt; 7 Days</option>
                  <option value="7to21">7-21 Days</option>
                  <option value="over21">&gt; 21 Days</option>
                </select>
             </div>

             {/* Unfollowed Filter */}
             <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-slate-100 dark:border-slate-700">
                <Clock size={18} className="text-slate-400" />
                <select 
                  className="bg-transparent text-sm font-black uppercase tracking-widest outline-none dark:text-slate-300"
                  value={unfollowedFilter}
                  onChange={(e) => setUnfollowedFilter(e.target.value)}
                >
                  <option value="all">Unfollowed: All</option>
                  <option value="under7">&lt; 7 Days</option>
                  <option value="7to21">7-21 Days</option>
                  <option value="over21">&gt; 21 Days</option>
                </select>
             </div>

             {hasActiveFilters && (
               <button 
                onClick={resetFilters}
                className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors ml-2"
               >
                 <X size={16} /> {t('cancel')}
               </button>
             )}

             <div className="ml-auto">
               <span className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">
                 {t('results')}: {filteredCustomers.length}
               </span>
             </div>
          </div>

          {/* List View */}
          <div className="overflow-hidden border-2 rounded-2xl border-slate-100 dark:border-slate-800">
            <table className="w-full text-left">
              <thead className="bg-slate-100 dark:bg-slate-800/80 border-b-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white uppercase text-sm font-black tracking-widest">
                <tr>
                  <th className="p-6 pl-8">{t('customer')}</th>
                  <th className="p-6 text-center">{t('rank')}</th>
                  <th className="p-6">{t('docLinks')}</th>
                  <th className="p-6 text-center">Aging</th>
                  <th className="p-6 text-center">Unreplied</th>
                  <th className="p-6 text-center">Unfollowed</th>
                  <th className="p-6">{t('status')}</th>
                  <th className="p-6">Next Action</th>
                  <th className="p-6">Latest Log</th>
                  <th className="p-6 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredCustomers.map(customer => {
                  const agingDays = getAgingDays(customer.lastStatusUpdate);
                  const unrepliedDays = getAgingDays(customer.lastCustomerReplyDate);
                  const unfollowedDays = getAgingDays(customer.lastMyReplyDate);
                  const latestLog = customer.interactions && customer.interactions.length > 0 
                    ? customer.interactions[0] 
                    : null;

                  return (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-blue-50/20 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                    >
                      <td className="p-6 pl-8">
                        <div className="font-black text-blue-600 dark:text-blue-400 text-base xl:text-lg group-hover:underline transition-all leading-tight uppercase tracking-tight">
                          {customer.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black mt-1.5 uppercase tracking-widest">
                           <MapPin size={10} />
                           {Array.isArray(customer.region) ? customer.region.join(', ') : customer.region}
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex justify-center scale-90">
                          <RankStars rank={customer.rank} editable={false} />
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col gap-1.5 max-w-[140px]">
                          {(customer.docLinks || []).slice(0, 2).map((link, lIdx) => (
                            <a 
                              key={lIdx}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-[10px] truncate flex items-center gap-1.5 font-bold uppercase tracking-tight"
                            >
                              <ExternalLink size={12} className="shrink-0" />
                              {link.title}
                            </a>
                          ))}
                          {(customer.docLinks || []).length > 2 && (
                            <span className="text-[9px] text-slate-400 font-black">+{customer.docLinks!.length - 2} more</span>
                          )}
                          {(!customer.docLinks || customer.docLinks.length === 0) && <span className="text-slate-300 font-bold text-[10px] uppercase">-</span>}
                        </div>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`text-sm ${getDaysSinceColor(customer.lastStatusUpdate)}`}>
                          {agingDays !== null ? `${agingDays}d` : '-'}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`text-sm ${getDaysSinceColor(customer.lastCustomerReplyDate)}`}>
                          {unrepliedDays !== null ? `${unrepliedDays}d` : '-'}
                        </span>
                      </td>
                      <td className="p-6 text-center">
                        <span className={`text-sm ${getDaysSinceColor(customer.lastMyReplyDate)}`}>
                          {unfollowedDays !== null ? `${unfollowedDays}d` : '-'}
                        </span>
                      </td>
                      <td className="p-6">
                        <Badge color="blue">
                          <span className="text-[10px] font-black uppercase tracking-tight whitespace-nowrap">
                            {t(customer.followUpStatus as any) || customer.followUpStatus}
                          </span>
                        </Badge>
                      </td>
                      <td className="p-6 font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                         {customer.nextActionDate || "-"}
                      </td>
                      <td className="p-6">
                        <div className="text-xs text-slate-600 dark:text-slate-300 font-bold line-clamp-2 italic max-w-[200px]">
                          {latestLog ? (
                            <>
                              <span className="font-black text-[9px] text-slate-400 mr-2 not-italic bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase">{latestLog.date}</span>
                              {parseLogContent(latestLog.summary)}
                            </>
                          ) : (
                            <span className="text-slate-300 uppercase tracking-widest">{t('statusNoAction')}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <ChevronRight className="w-6 h-6 text-slate-200 group-hover:text-blue-600 transition-all group-hover:translate-x-1" />
                      </td>
                    </tr>
                  );
                })}
                {filteredCustomers.length === 0 && (
                   <tr>
                     <td colSpan={10} className="p-24 text-center">
                       <User className="w-16 h-16 mx-auto mb-6 opacity-10" />
                       <p className="text-sm xl:text-lg font-black uppercase tracking-[0.2em] text-slate-300">{t('noCustomersFound')}</p>
                       <button onClick={resetFilters} className="mt-4 text-blue-500 font-bold uppercase text-xs tracking-widest hover:underline">Clear all filters</button>
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Customer">
         <div className="space-y-6">
            <div className="space-y-1.5">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name *</label>
               <input 
                  className="w-full border-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-black uppercase outline-none focus:border-blue-500 transition-all"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  autoFocus
               />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Region</label>
                 <input 
                    className="w-full border-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-black outline-none focus:border-blue-500 transition-all"
                    value={newCustomer.region}
                    onChange={(e) => setNewCustomer({...newCustomer, region: e.target.value})}
                    placeholder="e.g. Asia"
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rank</label>
                 <select 
                    className="w-full border-2 rounded-2xl p-4 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-black outline-none focus:border-blue-500 transition-all"
                    value={newCustomer.rank}
                    onChange={(e) => setNewCustomer({...newCustomer, rank: Number(e.target.value) as Rank})}
                 >
                    <option value={1}>1 - Highest (5 Stars)</option>
                    <option value={2}>2 - High (4 Stars)</option>
                    <option value={3}>3 - Medium (3 Stars)</option>
                    <option value={4}>4 - Low (2 Stars)</option>
                    <option value={5}>5 - Lowest (1 Star)</option>
                 </select>
              </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl border-2 border-slate-100 dark:border-slate-700 space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Primary Contact (Optional)</h4>
               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                     <input 
                        className="w-full border-2 border-white dark:border-slate-900 rounded-xl p-3 text-sm font-bold bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                        value={newCustomer.contactName}
                        onChange={(e) => setNewCustomer({...newCustomer, contactName: e.target.value})}
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                     <input 
                        className="w-full border-2 border-white dark:border-slate-900 rounded-xl p-3 text-sm font-bold bg-white dark:bg-slate-900 outline-none focus:border-blue-500"
                        value={newCustomer.contactEmail}
                        onChange={(e) => setNewCustomer({...newCustomer, contactEmail: e.target.value})}
                     />
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t dark:border-slate-800">
               <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>{t('cancel')}</Button>
               <Button onClick={handleCreateCustomer} className="bg-blue-600 px-10 shadow-lg shadow-blue-600/20 font-black uppercase text-sm tracking-widest">Create Customer</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default CustomerList;
