
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Card, Button, Badge, RankStars } from '../components/Common';
import { ArrowLeft, MapPin, Calendar, ExternalLink, Users, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const ExhibitionProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { exhibitions, customers, t } = useApp();
  const navigate = useNavigate();

  const exhibition = exhibitions.find(e => e.id === id);
  if (!exhibition) return <div className="p-20 text-center font-black uppercase text-slate-400">Exhibition not found.</div>;

  const associatedCustomers = customers.filter(c => c.tags.includes(exhibition.name));

  const labelClass = "text-[10px] xl:text-xs font-black uppercase text-slate-400 tracking-widest";
  const contentClass = "text-xl xl:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight";

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-6">
         <button onClick={() => navigate('/exhibitions')} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 active:scale-90">
           <ArrowLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
         </button>
         <div>
            <h1 className="text-3xl xl:text-5xl font-black text-slate-900 dark:text-white tracking-tight uppercase leading-none">{exhibition.name}</h1>
            <p className="text-slate-500 font-bold mt-2 uppercase tracking-widest text-sm">Exhibition Event Details</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-1 space-y-8">
            <Card className="p-8 space-y-8 border-2 border-l-8 border-l-blue-600">
               <div className="space-y-1">
                  <span className={labelClass}>Location</span>
                  <div className="flex items-center gap-3">
                     <MapPin className="text-blue-500" />
                     <span className={contentClass}>{exhibition.location}</span>
                  </div>
               </div>
               <div className="space-y-1">
                  <span className={labelClass}>Date</span>
                  <div className="flex items-center gap-3">
                     <Calendar className="text-blue-500" />
                     <span className={contentClass}>{exhibition.date}</span>
                  </div>
               </div>
               <div className="space-y-1 pt-6 border-t dark:border-slate-800">
                  <span className={labelClass}>Resource</span>
                  <a 
                    href={exhibition.link.startsWith('http') ? exhibition.link : `https://${exhibition.link}`} 
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
            </Card>

            <Card className="p-8 border-2">
               <h3 className="font-black text-slate-900 dark:text-white mb-6 uppercase tracking-widest flex items-center gap-3">
                  <Users className="text-indigo-500" /> Stats
               </h3>
               <div className="text-4xl font-black text-slate-900 dark:text-white mb-1">{associatedCustomers.length}</div>
               <div className={labelClass}>Participating Customers</div>
            </Card>
         </div>

         <div className="lg:col-span-2">
            <Card className="p-8 border-2 h-full">
               <div className="flex justify-between items-center mb-8 pb-4 border-b dark:border-slate-800">
                  <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-3">
                     <Users size={20} className="text-blue-600" /> Associated Customers
                  </h3>
               </div>
               
               <div className="space-y-4">
                  {associatedCustomers.map(c => (
                     <div 
                        key={c.id} 
                        onClick={() => navigate(`/customers/${c.id}`)}
                        className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/40 border-2 border-slate-100 dark:border-slate-800 rounded-2xl hover:border-blue-300 dark:hover:border-blue-900 cursor-pointer group transition-all"
                     >
                        <div className="flex items-center gap-6">
                           <div className="w-12 h-12 bg-white dark:bg-slate-900 border-2 rounded-xl flex items-center justify-center font-black text-lg text-slate-700 dark:text-slate-300">
                              {c.name.charAt(0)}
                           </div>
                           <div>
                              <h4 className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight">{c.name}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                 <RankStars rank={c.rank} />
                                 <span className="text-[10px] font-black text-slate-400 uppercase">{c.region.join(', ')}</span>
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
