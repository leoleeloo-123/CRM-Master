
import React, { useState } from 'react';
import { Customer, Rank, CustomerStatus } from '../types';
import { Card, Button, RankStars, StatusIcon, Modal } from '../components/Common';
import { Search, Plus, ChevronRight, Filter, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { differenceInDays, isValid } from 'date-fns';

interface CustomerListProps {
  customers: Customer[];
}

const CustomerList: React.FC<CustomerListProps> = ({ customers }) => {
  const navigate = useNavigate();
  const { t, setCustomers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  
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

      // 3. Tertiary sort: Days Since Update (Near to far / Most recent first)
      const daysA = a.lastStatusUpdate ? differenceInDays(new Date(), new Date(a.lastStatusUpdate)) : 9999;
      const daysB = b.lastStatusUpdate ? differenceInDays(new Date(), new Date(b.lastStatusUpdate)) : 9999;
      if (daysA !== daysB) {
        return daysA - daysB;
      }

      // 4. Quaternary sort: Alphabetical (Pure English first, then Chinese)
      const aIsZh = hasChinese(a.name);
      const bIsZh = hasChinese(b.name);

      if (!aIsZh && bIsZh) return -1; // a is English, b has Chinese -> a first
      if (aIsZh && !bIsZh) return 1;  // a has Chinese, b is English -> b first
      
      return a.name.localeCompare(b.name, 'zh-Hans-CN', { sensitivity: 'accent' });
    });

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return '';
    const s = status.trim();
    if (s === 'My Turn' || s === '我方跟进') return t('statusMyTurn');
    if (s === 'Waiting for Customer' || s === '等待对方') return t('statusWaiting');
    if (s === 'No Action' || s === '暂无') return t('statusNoAction');
    return s;
  };

  const getDaysSinceColor = (dateStr: string | undefined) => {
    if (!dateStr || !isValid(new Date(dateStr))) return 'text-slate-400';
    const diff = differenceInDays(new Date(), new Date(dateStr));
    if (diff < 7) return 'text-emerald-500 font-black';
    if (diff <= 21) return 'text-amber-500 font-black';
    return 'text-red-500 font-black';
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

  const toggleRank = (rank: number) => {
    setSelectedRanks(prev => 
      prev.includes(rank) ? prev.filter(r => r !== rank) : [...prev, rank]
    );
  };

  const parseLogContent = (summary: string) => {
    // Remove (标星记录), <Type>, {Effect} tags for clean preview
    return summary
      .replace(/\(标星记录\)|\(一般记录\)/g, '')
      .replace(/<.*?>/g, '')
      .replace(/{.*?}/g, '')
      .trim();
  };

  return (
    <div className="space-y-6 xl:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl xl:text-4xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">{t('customerDatabase')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm xl:text-lg">{t('manageClients')}</p>
        </div>
        <div className="flex gap-2">
           <Button className="flex items-center gap-2" onClick={() => setIsAddModalOpen(true)}>
             <Plus className="w-4 h-4 xl:w-5 xl:h-5" /> {t('add')}
           </Button>
           <Button variant="secondary" className="flex items-center gap-2" onClick={() => navigate('/data-management')}>
             <Plus className="w-4 h-4 xl:w-5 xl:h-5" /> {t('import')}
           </Button>
        </div>
      </div>

      <Card className="p-4 xl:p-8">
        <div className="flex flex-col space-y-4 mb-6 xl:mb-8">
          {/* Top Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 xl:top-3.5 text-slate-400 w-5 h-5 xl:w-6 xl:h-6" />
            <input 
              type="text" 
              placeholder={t('search')}
              className="w-full pl-10 xl:pl-12 pr-4 py-2 xl:py-3 text-sm xl:text-lg border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-4">
             {/* Multi-Rank Toggle */}
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-black uppercase text-slate-400 px-2">Rank Filter:</span>
                {[1, 2, 3, 4, 5].map(r => {
                  const stars = 6 - r;
                  const isActive = selectedRanks.includes(r);
                  return (
                    <button 
                      key={r}
                      onClick={() => toggleRank(r)}
                      className={`flex items-center gap-1 px-2 py-1 rounded transition-all ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                      title={`${stars} Stars`}
                    >
                      <span className="text-xs font-black">{stars}</span>
                      <Star size={12} fill={isActive ? "currentColor" : "none"} />
                    </button>
                  );
                })}
             </div>

             {/* Unreplied Filter */}
             <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select 
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-black uppercase text-slate-600 dark:text-slate-300 outline-none"
                  value={unrepliedFilter}
                  onChange={(e) => setUnrepliedFilter(e.target.value)}
                >
                  <option value="all">Unreplied: All</option>
                  <option value="under7">Unreplied: &lt; 7 Days</option>
                  <option value="7to21">Unreplied: 7-21 Days</option>
                  <option value="over21">Unreplied: &gt; 21 Days</option>
                </select>
             </div>

             {/* Unfollowed Filter */}
             <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400" />
                <select 
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-black uppercase text-slate-600 dark:text-slate-300 outline-none"
                  value={unfollowedFilter}
                  onChange={(e) => setUnfollowedFilter(e.target.value)}
                >
                  <option value="all">Unfollowed: All</option>
                  <option value="under7">Unfollowed: &lt; 7 Days</option>
                  <option value="7to21">Unfollowed: 7-21 Days</option>
                  <option value="over21">Unfollowed: &gt; 21 Days</option>
                </select>
             </div>

             <Button variant="ghost" size="sm" onClick={() => { setSelectedRanks([1,2]); setUnrepliedFilter('all'); setUnfollowedFilter('all'); setSearchTerm(''); }} className="text-[10px] uppercase font-black text-slate-400">Reset Filters</Button>
          </div>
        </div>

        <div className="overflow-x-auto text-[0.88rem] xl:text-[0.92rem]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-[10px] xl:text-[11px] uppercase tracking-widest font-black">
                <th className="p-4 xl:p-5 font-black w-1/5">Customer</th>
                <th className="p-4 xl:p-5 font-black w-[80px] text-center">{t('rank')}</th>
                <th className="p-4 xl:p-5 font-black w-[70px] text-center">Aging</th>
                <th className="p-4 xl:p-5 font-black w-[90px] text-center">Unreplied</th>
                <th className="p-4 xl:p-5 font-black w-[90px] text-center">Unfollowed</th>
                <th className="p-4 xl:p-5 font-black w-[100px]">{t('status')}</th>
                <th className="p-4 xl:p-5 font-black w-[140px]">Next Action</th>
                <th className="p-4 xl:p-5 font-black">Latest Log</th>
                <th className="p-4 xl:p-5 font-black w-[40px]"></th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
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
                    className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/customers/${customer.id}`)}
                  >
                    <td className="p-4 xl:p-5 align-top">
                      <div className="font-black text-slate-900 dark:text-white text-base xl:text-lg mb-0.5 tracking-tight">{customer.name}</div>
                      <div className="text-[10px] xl:text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                         {Array.isArray(customer.region) ? customer.region.join(', ') : customer.region}
                      </div>
                    </td>
                    <td className="p-4 xl:p-5 align-top text-center">
                      <div className="flex justify-center scale-90 origin-center">
                        <RankStars rank={customer.rank} editable={false} />
                      </div>
                    </td>
                    <td className="p-4 xl:p-5 align-top text-center">
                      <div className={`font-black ${getDaysSinceColor(customer.lastStatusUpdate)}`}>
                        {agingDays !== null ? `${agingDays}d` : '-'}
                      </div>
                    </td>
                    <td className="p-4 xl:p-5 align-top text-center">
                      <div className={`font-black ${getDaysSinceColor(customer.lastCustomerReplyDate)}`}>
                        {unrepliedDays !== null ? `${unrepliedDays}d` : '-'}
                      </div>
                    </td>
                    <td className="p-4 xl:p-5 align-top text-center">
                      <div className={`font-black ${getDaysSinceColor(customer.lastMyReplyDate)}`}>
                        {unfollowedDays !== null ? `${unfollowedDays}d` : '-'}
                      </div>
                    </td>
                    <td className="p-4 xl:p-5 align-top">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={customer.followUpStatus || customer.status} />
                        <span className="font-black text-[10px] xl:text-[11px] uppercase tracking-wider whitespace-nowrap">
                          {getStatusLabel(customer.followUpStatus || customer.status)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 xl:p-5 align-top font-black">
                       <div className="text-slate-800 dark:text-white text-xs xl:text-sm whitespace-nowrap">{customer.nextActionDate || "-"}</div>
                    </td>
                    <td className="p-4 xl:p-5 align-top">
                      <div className="text-slate-600 dark:text-slate-400 line-clamp-2 text-xs xl:text-sm leading-relaxed italic">
                        {latestLog ? (
                          <>
                            <span className="font-black text-[10px] text-slate-400 mr-1 not-italic">{latestLog.date}</span>
                            {parseLogContent(latestLog.summary)}
                          </>
                        ) : (
                          <span className="text-slate-300 italic">No interaction history.</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 xl:p-5 align-top text-right">
                      <ChevronRight className="w-5 h-5 xl:w-6 xl:h-6 text-slate-300 group-hover:text-blue-500" />
                    </td>
                  </tr>
                );
              })}
              {filteredCustomers.length === 0 && (
                 <tr>
                   <td colSpan={9} className="p-16 xl:p-24 text-center">
                     <div className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.2em] italic">
                       {t('noCustomersFound')}
                     </div>
                     <Button variant="ghost" onClick={() => { setSelectedRanks([1,2]); setUnrepliedFilter('all'); setUnfollowedFilter('all'); setSearchTerm(''); }} className="mt-4 text-blue-500 underline text-xs">Reset all filters</Button>
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Customer">
         <div className="space-y-4">
            <div>
               <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Company Name *</label>
               <input 
                  className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 outline-none focus:border-blue-500"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  autoFocus
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Region</label>
                 <input 
                    className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 outline-none focus:border-blue-500"
                    value={newCustomer.region}
                    onChange={(e) => setNewCustomer({...newCustomer, region: e.target.value})}
                    placeholder="e.g. Asia"
                 />
              </div>
              <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Rank</label>
                 <select 
                    className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 outline-none focus:border-blue-500"
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
            
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
               <h4 className="text-sm font-black text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-widest">Primary Contact (Optional)</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                     <input 
                        className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-sm outline-none focus:border-blue-500"
                        value={newCustomer.contactName}
                        onChange={(e) => setNewCustomer({...newCustomer, contactName: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                     <input 
                        className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-sm outline-none focus:border-blue-500"
                        value={newCustomer.contactEmail}
                        onChange={(e) => setNewCustomer({...newCustomer, contactEmail: e.target.value})}
                     />
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
               <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
               <Button onClick={handleCreateCustomer}>Create Customer</Button>
            </div>
         </div>
      </Modal>
    </div>
  );
};

export default CustomerList;
