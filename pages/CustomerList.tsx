import React, { useState } from 'react';
import { Customer } from '../types';
import { Card, Button, RankStars, StatusIcon } from '../components/Common';
import { Search, Plus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

interface CustomerListProps {
  customers: Customer[];
}

const CustomerList: React.FC<CustomerListProps> = ({ customers }) => {
  const navigate = useNavigate();
  const { t } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState<number | null>(null);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRank = filterRank ? c.rank === filterRank : true;
    return matchesSearch && matchesRank;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('customerDatabase')}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t('manageClients')}</p>
        </div>
        <div className="flex gap-2">
           <Button className="flex items-center gap-2" onClick={() => navigate('/data-management')}>
             <Plus size={16} /> {t('import')}
           </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder={t('search')}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <select 
               className="border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <tr className="border-b border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm uppercase tracking-wider">
                <th className="p-4 font-semibold w-1/4">Customer</th>
                <th className="p-4 font-semibold w-1/12">{t('rank')}</th>
                <th className="p-4 font-semibold w-1/12">{t('status')}</th>
                <th className="p-4 font-semibold w-1/3">{t('productSummary')}</th>
                <th className="p-4 font-semibold w-1/6">Next Action</th>
                <th className="p-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300 text-sm">
              {filteredCustomers.map(customer => (
                <tr 
                  key={customer.id} 
                  className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/customers/${customer.id}`)}
                >
                  <td className="p-4 align-top">
                    <div className="font-bold text-slate-900 dark:text-white text-lg">{customer.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{customer.region}</div>
                    <div className="flex gap-1 flex-wrap">
                      {customer.tags.slice(0, 3).map(t => (
                        <span key={t} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-xs">{t}</span>
                      ))}
                      {customer.tags.length > 3 && <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded text-xs">+{customer.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <RankStars rank={customer.rank} />
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={customer.followUpStatus || customer.status} />
                      <span className="font-medium text-xs">
                        {customer.followUpStatus || customer.status}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="text-slate-600 dark:text-slate-300 line-clamp-3 text-sm leading-relaxed">
                      {customer.productSummary || "No summary available."}
                    </div>
                    {customer.lastStatusUpdate && (
                      <div className="text-xs text-slate-400 mt-2">
                        Updated: {customer.lastStatusUpdate}
                      </div>
                    )}
                  </td>
                  <td className="p-4 align-top font-medium">
                     <div className="text-slate-800 dark:text-white">{customer.nextActionDate || "-"}</div>
                     {customer.interactions[0]?.nextSteps && (
                       <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                         Next: {customer.interactions[0].nextSteps}
                       </div>
                     )}
                  </td>
                  <td className="p-4 align-top text-right">
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500" />
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                 <tr>
                   <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                     {t('noCustomersFound')}
                   </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default CustomerList;