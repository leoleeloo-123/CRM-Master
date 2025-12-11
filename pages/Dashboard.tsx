

import React from 'react';
import { Customer, Sample } from '../types';
import { Card, Badge, RankStars, getUrgencyLevel } from '../components/Common';
import { AlertTriangle, Calendar, ArrowRight, Activity, FlaskConical } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { format, isBefore, parseISO, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

interface DashboardProps {
  customers: Customer[];
  samples: Sample[];
}

const Dashboard: React.FC<DashboardProps> = ({ customers, samples }) => {
  const navigate = useNavigate();
  const { t, tagOptions } = useApp();

  const criticalCustomers = customers.filter(c => {
    if (c.rank > 2) return false;
    const now = new Date();
    const actionDate = c.nextActionDate ? parseISO(c.nextActionDate) : null;
    const isOverdue = actionDate && isBefore(actionDate, now);
    const isUpcoming = actionDate && isBefore(actionDate, addDays(now, 7)) && !isOverdue;
    return isOverdue || isUpcoming;
  }).sort((a, b) => {
    // 1. Sort by Rank (Ascending: 1 before 2)
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    
    // 2. Sort by Date (Ascending: Earliest date first)
    // Use a large number for missing dates to push them to the bottom, though critical filter implies dates exist
    const dateA = a.nextActionDate ? parseISO(a.nextActionDate).getTime() : Number.MAX_SAFE_INTEGER;
    const dateB = b.nextActionDate ? parseISO(b.nextActionDate).getTime() : Number.MAX_SAFE_INTEGER;
    
    return dateA - dateB;
  });

  const activeSamples = samples.filter(s => !['Delivered', 'Closed', 'Feedback Received', '已送达', '已关闭', '已反馈'].includes(s.status)).length;
  // Broadly define pending feedback as Sent or Delivered but not Closed
  const pendingFeedback = samples.filter(s => ['Sent', 'Delivered', '已寄出', '已送达'].includes(s.status)).length;
  
  // --- Dynamic Sample Pipeline Data ---
  // Generate colors cyclically
  const COLORS = ['#94a3b8', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
  
  // 1. Aggregate counts based on tagOptions.sampleStatus to preserve order
  const sampleStatusData = tagOptions.sampleStatus.map((status, index) => {
    return {
      name: t(status as any) || status,
      value: samples.filter(s => s.status === status).length,
      color: COLORS[index % COLORS.length]
    };
  }).filter(item => item.value > 0); // Only show non-zero statuses

  // 2. Catch any samples with statuses NOT in the configured list
  const knownStatuses = new Set(tagOptions.sampleStatus);
  const otherCount = samples.filter(s => !knownStatuses.has(s.status)).length;
  
  if (otherCount > 0) {
    sampleStatusData.push({
      name: 'Other',
      value: otherCount,
      color: '#64748b' // Slate-500
    });
  }

  const regionDataRaw = customers.reduce((acc, curr) => {
    // Check if region is an array (it should be now), but fallback to string handling just in case of old data
    const regions = Array.isArray(curr.region) ? curr.region : [curr.region];
    regions.forEach(r => {
      acc[r] = (acc[r] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);
  
  const regionData = Object.keys(regionDataRaw).map(key => ({
    name: key,
    count: regionDataRaw[key]
  }));

  const iconClass = "w-6 h-6 xl:w-8 xl:h-8";

  return (
    <div className="space-y-6 xl:space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl xl:text-4xl font-bold text-slate-800 dark:text-white mb-1">{t('dashboard')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm xl:text-lg">{t('welcome')}</p>
        </div>
        <div className="text-sm xl:text-lg text-slate-500 dark:text-slate-400">
          {t('today')}: <span className="font-medium text-slate-900 dark:text-white">{format(new Date(), 'MMMM do, yyyy')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 xl:gap-8">
        <Card className="p-4 xl:p-6 flex items-center gap-4 xl:gap-6 border-l-4 border-l-blue-500">
          <div className="p-3 xl:p-4 bg-blue-50 dark:bg-blue-900/50 rounded-full text-blue-600 dark:text-blue-400">
            <Activity className={iconClass} />
          </div>
          <div>
            <p className="text-sm xl:text-base text-slate-500 dark:text-slate-400">{t('totalCustomers')}</p>
            <p className="text-2xl xl:text-4xl font-bold text-slate-800 dark:text-white">{customers.length}</p>
          </div>
        </Card>
        <Card className="p-4 xl:p-6 flex items-center gap-4 xl:gap-6 border-l-4 border-l-amber-500">
          <div className="p-3 xl:p-4 bg-amber-50 dark:bg-amber-900/50 rounded-full text-amber-600 dark:text-amber-400">
            <FlaskConical className={iconClass} />
          </div>
          <div>
            <p className="text-sm xl:text-base text-slate-500 dark:text-slate-400">{t('activeSamples')}</p>
            <p className="text-2xl xl:text-4xl font-bold text-slate-800 dark:text-white">{activeSamples}</p>
          </div>
        </Card>
        <Card className="p-4 xl:p-6 flex items-center gap-4 xl:gap-6 border-l-4 border-l-purple-500">
          <div className="p-3 xl:p-4 bg-purple-50 dark:bg-purple-900/50 rounded-full text-purple-600 dark:text-purple-400">
            <Calendar className={iconClass} />
          </div>
          <div>
            <p className="text-sm xl:text-base text-slate-500 dark:text-slate-400">{t('pendingFeedback')}</p>
            <p className="text-2xl xl:text-4xl font-bold text-slate-800 dark:text-white">{pendingFeedback}</p>
          </div>
        </Card>
        <Card className="p-4 xl:p-6 flex items-center gap-4 xl:gap-6 border-l-4 border-l-red-500">
          <div className="p-3 xl:p-4 bg-red-50 dark:bg-red-900/50 rounded-full text-red-600 dark:text-red-400">
            <AlertTriangle className={iconClass} />
          </div>
          <div>
            <p className="text-sm xl:text-base text-slate-500 dark:text-slate-400">{t('criticalActions')}</p>
            <p className="text-2xl xl:text-4xl font-bold text-slate-800 dark:text-white">{criticalCustomers.length}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 xl:gap-10">
        <div className="lg:col-span-2 space-y-4 xl:space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg xl:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 xl:w-7 xl:h-7 text-amber-500" />
              {t('priorityAttention')}
            </h3>
            <button 
              onClick={() => navigate('/customers')}
              className="text-sm xl:text-lg text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              {t('viewAll')} <ArrowRight className="w-3.5 h-3.5 xl:w-5 xl:h-5" />
            </button>
          </div>
          
          <div className="space-y-3 xl:space-y-4">
            {criticalCustomers.length === 0 ? (
              <Card className="p-8 xl:p-12 text-center text-slate-500 dark:text-slate-400 text-lg xl:text-xl">
                <p>{t('noCriticalActions')}</p>
              </Card>
            ) : (
              criticalCustomers.map(c => {
                const urgency = getUrgencyLevel(c.nextActionDate);
                let dateColor = "text-slate-500 dark:text-slate-400";
                if (urgency === 'urgent') dateColor = "text-red-600 dark:text-red-500 font-bold";
                if (urgency === 'warning') dateColor = "text-amber-600 dark:text-amber-500 font-bold";
                if (urgency === 'safe') dateColor = "text-emerald-600 dark:text-emerald-500 font-bold";

                return (
                  <Card key={c.id} className="p-4 xl:p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 xl:gap-5">
                        <div className={`w-1 xl:w-2 self-stretch rounded-full ${urgency === 'urgent' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                        <div>
                          <div className="flex items-center gap-2 xl:gap-4">
                            <h4 className="font-bold text-slate-800 dark:text-white text-base xl:text-xl">{c.name}</h4>
                            <RankStars rank={c.rank} />
                          </div>
                          <p className="text-sm xl:text-base text-slate-600 dark:text-slate-300 mt-1">{c.interactions[0]?.nextSteps || "Update required"}</p>
                          <div className="flex gap-2 mt-2">
                            {c.tags.slice(0, 2).map(t => <Badge key={t} color="gray">{t}</Badge>)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center justify-end gap-1 text-sm xl:text-base font-medium ${dateColor}`}>
                          <Calendar className="w-3.5 h-3.5 xl:w-5 xl:h-5" />
                          <span>
                            {c.nextActionDate ? format(parseISO(c.nextActionDate), 'MMM d') : 'N/A'}
                          </span>
                        </div>
                        <div className="mt-1 xl:mt-2">
                            <Badge color={c.status === 'Active' ? 'green' : 'gray'}>{c.status}</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6 xl:space-y-10">
           <Card className="p-5 xl:p-8">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4 xl:mb-6 text-base xl:text-xl">{t('samplePipeline')}</h3>
             {sampleStatusData.length > 0 ? (
               <>
                 <div className="h-64 xl:h-80 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={sampleStatusData}
                         cx="50%"
                         cy="50%"
                         innerRadius={70}
                         outerRadius={95}
                         paddingAngle={5}
                         dataKey="value"
                       >
                         {sampleStatusData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Pie>
                       <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', fontSize: '14px' }} />
                       <legend />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
                 <div className="grid grid-cols-2 gap-2 mt-2 xl:mt-4">
                   {sampleStatusData.map(d => (
                     <div key={d.name} className="flex items-center gap-2 text-xs xl:text-sm text-slate-600 dark:text-slate-300">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                       <span>{d.name}: {d.value}</span>
                     </div>
                   ))}
                 </div>
               </>
             ) : (
               <div className="h-64 flex items-center justify-center text-slate-400 italic">No sample data available.</div>
             )}
           </Card>

           <Card className="p-5 xl:p-8">
             <h3 className="font-bold text-slate-800 dark:text-white mb-4 xl:mb-6 text-base xl:text-xl">{t('customersByRegion')}</h3>
             <div className="h-40 xl:h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} />
                    <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#64748b'}} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }} />
                    <Bar dataKey="count" fill="#475569" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;