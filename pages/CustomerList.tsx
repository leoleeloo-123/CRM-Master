
import React, { useState } from 'react';
import { Customer, Rank, CustomerStatus } from '../types';
import { Card, Button, RankStars, StatusIcon, Modal } from '../components/Common';
import { Search, Plus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

interface CustomerListProps {
  customers: Customer[];
}

const CustomerList: React.FC<CustomerListProps> = ({ customers }) => {
  const navigate = useNavigate();
  const { t, setCustomers } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New Customer State
  const [newCustomer, setNewCustomer] = useState<{name: string, region: string, rank: Rank, contactName: string, contactEmail: string}>({
    name: '',
    region: '',
    rank: 3,
    contactName: '',
    contactEmail: ''
  });

  const filteredCustomers = customers.filter(c => {
    const regionString = Array.isArray(c.region) ? c.region.join(' ') : c.region;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          regionString.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRank = filterRank ? c.rank === filterRank : true;
    return matchesSearch && matchesRank;
  });

  const getStatusLabel = (status: string | undefined) => {
    if (!status) return '';
    const s = status.trim();
    if (s === 'My Turn' || s === '我方跟进') return t('statusMyTurn');
    if (s === 'Waiting for Customer' || s === '等待对方') return t('statusWaiting');
    if (s === 'No Action' || s === '暂无') return t('statusNoAction');
    return s;
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

  return (
    <div className="space-y-6 xl:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl xl:text-4xl font-bold text-slate-800 dark:text-white mb-1">{t('customerDatabase')}</h2>
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
        <div className="flex flex-col md:flex-row gap-4 mb-6 xl:mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 xl:top-3.5 text-slate-400 w-5 h-5 xl:w-6 xl:h-6" />
            <input 
              type="text" 
              placeholder={t('search')}
              className="w-full pl-10 xl:pl-12 pr-4 py-2 xl:py-3 text-sm xl:text-lg border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <select 
               className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 xl:px-4 xl:py-3 text-sm xl:text-lg text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
               onChange={(e) => setFilterRank(e.target.value ? Number(e.target.value) : null)}
             >
               <option value="">{t('filterRank')}</option>
               <option value="1">Rank 1</option>
               <option value="2">Rank 2</option>
               <option value="3">Rank 3</option>
               <option value="4">Rank 4</option>
               <option value="5">Rank 5</option>
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm xl:text-base uppercase tracking-wider">
                <th className="p-4 xl:p-6 font-semibold w-1/4">Customer</th>
                <th className="p-4 xl:p-6 font-semibold w-1/12">{t('rank')}</th>
                <th className="p-4 xl:p-6 font-semibold w-1/12">{t('status')}</th>
                <th className="p-4 xl:p-6 font-semibold w-1/3">{t('productSummary')}</th>
                <th className="p-4 xl:p-6 font-semibold w-1/6">Next Action</th>
                <th className="p-4 xl:p-6 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300 text-sm xl:text-base">
              {filteredCustomers.map(customer => (
                <tr 
                  key={customer.id} 
                  className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <td className="p-4 xl:p-6 align-top">
                    <div className="font-bold text-slate-900 dark:text-white text-lg xl:text-2xl mb-1">{customer.name}</div>
                    <div className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 mb-2">
                       {Array.isArray(customer.region) ? customer.region.join(', ') : customer.region}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {customer.tags.slice(0, 3).map(t => (
                        <span key={t} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-xs xl:text-sm">{t}</span>
                      ))}
                      {customer.tags.length > 3 && <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-xs xl:text-sm">+{customer.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td className="p-4 xl:p-6 align-top">
                    <RankStars rank={customer.rank} />
                  </td>
                  <td className="p-4 xl:p-6 align-top">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={customer.followUpStatus || customer.status} />
                      <span className="font-medium text-xs xl:text-sm whitespace-nowrap">
                        {getStatusLabel(customer.followUpStatus || customer.status)}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 xl:p-6 align-top">
                    <div className="text-slate-600 dark:text-slate-300 line-clamp-3 text-sm xl:text-lg leading-relaxed">
                      {customer.productSummary || "No summary available."}
                    </div>
                    {customer.lastStatusUpdate && (
                      <div className="text-xs xl:text-sm text-slate-400 mt-2">
                        Updated: {customer.lastStatusUpdate}
                      </div>
                    )}
                  </td>
                  <td className="p-4 xl:p-6 align-top font-medium">
                     <div className="text-slate-800 dark:text-white text-sm xl:text-lg">{customer.nextActionDate || "-"}</div>
                     {customer.interactions[0]?.nextSteps && (
                       <div className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                         Next: {customer.interactions[0].nextSteps}
                       </div>
                     )}
                  </td>
                  <td className="p-4 xl:p-6 align-top text-right">
                    <ChevronRight className="w-5 h-5 xl:w-7 xl:h-7 text-slate-300 group-hover:text-blue-500" />
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                 <tr>
                   <td colSpan={6} className="p-8 xl:p-12 text-center text-slate-500 dark:text-slate-400 text-lg">
                     {t('noCustomersFound')}
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
                  className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  autoFocus
               />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Region</label>
                 <input 
                    className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    value={newCustomer.region}
                    onChange={(e) => setNewCustomer({...newCustomer, region: e.target.value})}
                    placeholder="e.g. Asia"
                 />
              </div>
              <div>
                 <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Rank</label>
                 <select 
                    className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600"
                    value={newCustomer.rank}
                    onChange={(e) => setNewCustomer({...newCustomer, rank: Number(e.target.value) as Rank})}
                 >
                    <option value={1}>1 - Highest</option>
                    <option value={2}>2 - High</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - Low</option>
                    <option value={5}>5 - Lowest</option>
                 </select>
              </div>
            </div>
            
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
               <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Primary Contact (Optional)</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                     <input 
                        className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-sm"
                        value={newCustomer.contactName}
                        onChange={(e) => setNewCustomer({...newCustomer, contactName: e.target.value})}
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                     <input 
                        className="w-full border rounded-lg p-2 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-sm"
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
