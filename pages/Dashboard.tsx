
import React, { useState } from 'react';
import { Customer, Sample } from '../types';
import { Card, Badge, RankStars, getUrgencyLevel } from '../components/Common';
import { AlertTriangle, Calendar as CalendarIcon, ArrowRight, Activity, FlaskConical, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  format, isBefore, addDays, 
  endOfMonth, endOfWeek, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, addWeeks, 
  isToday 
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

interface DashboardProps {
  customers: Customer[];
  samples: Sample[];
}

type CalendarView = 'day' | 'week' | 'month';

const DashboardCalendar: React.FC<{ customers: Customer[] }> = ({ customers }) => {
  const { t } = useApp();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');

  const events = customers.filter(c => c.rank <= 2 && c.nextActionDate).map(c => ({
    ...c,
    dateObj: new Date(c.nextActionDate!)
  }));

  const handlePrev = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, -1));
    if (view === 'week') setCurrentDate(addWeeks(currentDate, -1));
    if (view === 'day') setCurrentDate(addDays(currentDate, -1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (view === 'day') setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const getUrgencyColor = (dateStr: string) => {
    const urgency = getUrgencyLevel(dateStr);
    if (urgency === 'urgent') return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200";
    if (urgency === 'warning') return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-200";
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-200";
  };

  const renderEventBadge = (c: any, compact = true) => (
    <div 
      key={c.id} 
      onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}
      className={`cursor-pointer rounded px-2 py-1 text-[0.65rem] xl:text-xs font-bold border truncate transition-all hover:scale-105 hover:shadow-sm mb-1 ${getUrgencyColor(c.nextActionDate!)}`}
      title={`${c.name} - ${c.upcomingPlan || 'No upcoming plan'}`}
    >
      {c.name}
    </div>
  );

  const renderMonthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const monthEnd = endOfMonth(monthStart);
    const startDate = addDays(monthStart, -monthStart.getDay());
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="w-full">
         <div className="grid grid-cols-7 mb-2">
            {weekDays.map(d => (
              <div key={d} className="text-center text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest">{d}</div>
            ))}
         </div>
         <div className="grid grid-cols-7 gap-1 auto-rows-[minmax(120px,auto)]">
            {days.map(day => {
               const dayEvents = events.filter(e => isSameDay(e.dateObj, day));
               const isCurrentMonth = isSameMonth(day, monthStart);
               const isDayToday = isToday(day);
               
               return (
                 <div 
                   key={day.toISOString()} 
                   className={`p-1.5 border rounded-lg flex flex-col gap-1 transition-colors ${isCurrentMonth ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-50'} ${isDayToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                 >
                    <span className={`text-xs xl:text-sm font-black self-end px-1.5 rounded-full ${isDayToday ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                      {format(day, 'd')}
                    </span>
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                       {dayEvents.map(e => renderEventBadge(e, false))}
                    </div>
                 </div>
               );
            })}
         </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = addDays(currentDate, -currentDate.getDay());
    const days = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    return (
      <div className="grid grid-cols-7 gap-2 h-auto">
        {days.map(day => {
           const dayEvents = events.filter(e => isSameDay(e.dateObj, day));
           const isDayToday = isToday(day);
           
           return (
             <div key={day.toISOString()} className={`flex flex-col border rounded-lg overflow-hidden ${isDayToday ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className={`p-2 text-center border-b border-slate-100 dark:border-slate-700 ${isDayToday ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700' : 'bg-slate-50 dark:bg-slate-800'}`}>
                   <div className="text-[10px] xl:text-xs font-black uppercase tracking-widest text-slate-400">{format(day, 'EEE')}</div>
                   <div className="text-xl xl:text-2xl font-black">{format(day, 'd')}</div>
                </div>
                <div className="p-2 flex-1 bg-white dark:bg-slate-800 space-y-2 min-h-[250px]">
                   {dayEvents.length > 0 ? dayEvents.map(e => renderEventBadge(e, false)) : <div className="text-xs text-slate-300 text-center py-4">-</div>}
                </div>
             </div>
           );
        })}
      </div>
    );
  };

  const renderDayView = () => {
     const dayEvents = events.filter(e => isSameDay(e.dateObj, currentDate)).sort((a,b) => a.rank - b.rank);
     
     return (
       <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 min-h-[400px] shadow-sm">
          <h4 className="text-lg xl:text-xl font-black mb-8 flex items-center gap-3">
             {format(currentDate, 'EEEE, MMMM do')}
             {isToday(currentDate) && <Badge color="blue">Today</Badge>}
          </h4>
          {dayEvents.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <CalendarIcon className="w-12 h-12 xl:w-16 xl:h-16 opacity-10 mb-2" />
                <p className="italic text-sm xl:text-base font-medium">No critical actions scheduled for this day.</p>
             </div>
          ) : (
             <div className="space-y-4">
               {dayEvents.map(e => (
                 <div key={e.id} onClick={() => navigate(`/customers/${e.id}`)} className="flex items-start gap-4 p-5 rounded-xl border border-slate-100 dark:border-slate-700 hover:shadow-lg cursor-pointer transition-all bg-white dark:bg-slate-900/50 group">
                    <div className={`w-1.5 self-stretch rounded-full ${getUrgencyLevel(e.nextActionDate!) === 'urgent' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                    <div className="flex-1">
                       <div className="flex justify-between items-start">
                          <h5 className="font-black text-slate-900 dark:text-white text-base xl:text-lg group-hover:text-blue-600 transition-colors tracking-tight">{e.name}</h5>
                          <div className="text-[1em]"><RankStars rank={e.rank} /></div>
                       </div>
                       <p className="text-slate-600 dark:text-slate-300 mt-1.5 font-medium text-sm xl:text-base leading-relaxed">{e.upcomingPlan || 'Check details'}</p>
                       <div className="mt-4">
                          <Badge color="gray">{e.status}</Badge>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          )}
       </div>
     );
  };

  return (
    <Card className="p-4 xl:p-8 flex flex-col shadow-sm">
       <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
             <CalendarIcon className="w-5 h-5 xl:w-6 xl:h-6 text-blue-600 dark:text-blue-400" />
             <h3 className="font-black text-slate-800 dark:text-white text-base xl:text-lg uppercase tracking-wider">{t('calendar')}</h3>
             <span className="text-sm xl:text-base font-bold text-slate-400 ml-2">
                {format(currentDate, 'MMMM yyyy')}
             </span>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
             <button onClick={() => setView('day')} className={`px-4 py-1.5 text-xs xl:text-sm font-black rounded-lg transition-all ${view === 'day' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>{t('viewDay')}</button>
             <button onClick={() => setView('week')} className={`px-4 py-1.5 text-xs xl:text-sm font-black rounded-lg transition-all ${view === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>{t('viewWeek')}</button>
             <button onClick={() => setView('month')} className={`px-4 py-1.5 text-xs xl:text-sm font-black rounded-lg transition-all ${view === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>{t('viewMonth')}</button>
          </div>

          <div className="flex items-center gap-2">
             <button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"><ChevronLeft className="w-5 h-5 xl:w-6 xl:h-6"/></button>
             <button onClick={handleToday} className="px-4 py-1.5 text-xs xl:text-sm font-black bg-white border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 rounded-lg shadow-sm transition-all">{t('today')}</button>
             <button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-colors"><ChevronRight className="w-5 h-5 xl:w-6 xl:h-6"/></button>
          </div>
       </div>
       
       <div className="flex-1">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
       </div>
    </Card>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ customers, samples }) => {
  const navigate = useNavigate();
  const { t, tagOptions } = useApp();
  const [priorityFilter, setPriorityFilter] = useState<'1' | '1-2'>('1');

  const criticalCustomers = customers.filter(c => {
    const rankCondition = priorityFilter === '1' ? c.rank === 1 : c.rank <= 2;
    if (!rankCondition) return false;
    const now = new Date();
    const actionDate = c.nextActionDate ? new Date(c.nextActionDate) : null;
    const isOverdue = actionDate && isBefore(actionDate, now);
    const isUpcoming = actionDate && isBefore(actionDate, addDays(now, 7)) && !isOverdue;
    return isOverdue || isUpcoming;
  }).sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    const dateA = a.nextActionDate ? new Date(a.nextActionDate).getTime() : Number.MAX_SAFE_INTEGER;
    const dateB = b.nextActionDate ? new Date(b.nextActionDate).getTime() : Number.MAX_SAFE_INTEGER;
    return dateA - dateB;
  });

  const activeSamples = samples.filter(s => !['Delivered', 'Closed', 'Feedback Received', '已送达', '已关闭', '已反馈'].includes(s.status)).length;
  const pendingFeedback = samples.filter(s => ['Sent', 'Delivered', '已寄出', '已送达'].includes(s.status)).length;
  
  const COLORS = ['#94a3b8', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];
  const sampleStatusData = tagOptions.sampleStatus.map((status, index) => {
    return {
      name: t(status as any) || status,
      value: samples.filter(s => s.status === status).length,
      color: COLORS[index % COLORS.length]
    };
  }).filter(item => item.value > 0);

  const regionDataRaw = customers.reduce((acc, curr) => {
    const regions = Array.isArray(curr.region) ? curr.region : [curr.region];
    regions.forEach(r => { acc[r] = (acc[r] || 0) + 1; });
    return acc;
  }, {} as Record<string, number>);
  
  const regionData = Object.keys(regionDataRaw).map(key => ({
    name: key,
    count: regionDataRaw[key]
  }));

  const iconClass = "w-6 h-6 xl:w-8 xl:h-8 shrink-0";

  return (
    <div className="space-y-8 xl:space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl xl:text-4xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">CRM Master</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm xl:text-lg font-bold tracking-tight">Welcome back</p>
        </div>
        <div className="text-sm xl:text-lg text-slate-400 font-bold">
          Today: <span className="text-slate-900 dark:text-white">{format(new Date(), 'MMMM do, yyyy')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 xl:gap-8">
        <Card className="p-5 xl:p-8 flex items-center gap-5 xl:gap-8 border-l-4 border-l-blue-500 shadow-sm">
          <div className="p-3 xl:p-5 bg-blue-50 dark:bg-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100">
            <Activity className={iconClass} />
          </div>
          <div>
            <p className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('totalCustomers')}</p>
            <p className="text-3xl xl:text-5xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{customers.length}</p>
          </div>
        </Card>
        <Card className="p-5 xl:p-8 flex items-center gap-5 xl:gap-8 border-l-4 border-l-amber-500 shadow-sm">
          <div className="p-3 xl:p-5 bg-amber-50 dark:bg-amber-900/50 rounded-2xl text-amber-600 dark:text-amber-400 shadow-sm border border-amber-100">
            <FlaskConical className={iconClass} />
          </div>
          <div>
            <p className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('activeSamples')}</p>
            <p className="text-3xl xl:text-5xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{activeSamples}</p>
          </div>
        </Card>
        <Card className="p-5 xl:p-8 flex items-center gap-5 xl:gap-8 border-l-4 border-l-purple-500 shadow-sm">
          <div className="p-3 xl:p-5 bg-purple-50 dark:bg-purple-900/50 rounded-2xl text-purple-600 dark:text-purple-400 shadow-sm border border-purple-100">
            <CalendarIcon className={iconClass} />
          </div>
          <div>
            <p className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Pending Feedback</p>
            <p className="text-3xl xl:text-5xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{pendingFeedback}</p>
          </div>
        </Card>
        <Card className="p-5 xl:p-8 flex items-center gap-5 xl:gap-8 border-l-4 border-l-red-500 shadow-sm">
          <div className="p-3 xl:p-5 bg-red-50 dark:bg-red-900/50 rounded-2xl text-red-600 dark:text-red-400 shadow-sm border border-red-100">
            <AlertTriangle className={iconClass} />
          </div>
          <div>
            <p className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Critical Actions</p>
            <p className="text-3xl xl:text-5xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{criticalCustomers.length}</p>
          </div>
        </Card>
      </div>

      <div className="w-full">
         <DashboardCalendar customers={customers} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
        <div className="flex flex-col h-full space-y-6 xl:space-y-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg xl:text-xl font-black text-slate-800 dark:text-white flex items-center gap-3 tracking-wider uppercase">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                {t('priorityAttention')}
              </h3>
              <button onClick={() => navigate('/customers')} className="text-xs xl:text-sm font-black text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1.5 group transition-colors">
                View All <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl self-start shadow-inner">
               <button onClick={() => setPriorityFilter('1')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${priorityFilter === '1' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>Tier 1 Only</button>
               <button onClick={() => setPriorityFilter('1-2')} className={`px-5 py-2 text-xs font-black rounded-lg transition-all ${priorityFilter === '1-2' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>Tier 1 & 2</button>
            </div>
          </div>
          
          <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 scrollbar-hide">
            {criticalCustomers.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 italic font-medium">
                <p>No critical actions pending. Great job!</p>
              </Card>
            ) : (
              criticalCustomers.map(c => { 
                const urgency = getUrgencyLevel(c.nextActionDate);
                let dateColor = "text-slate-400";
                if (urgency === 'urgent') dateColor = "text-red-600 dark:text-red-500 font-black";
                if (urgency === 'warning') dateColor = "text-amber-600 dark:text-amber-500 font-black";

                return (
                  <Card key={c.id} className="p-5 hover:shadow-xl transition-all cursor-pointer border border-slate-100 dark:border-slate-800 group" onClick={() => navigate(`/customers/${c.id}`)}>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-start">
                         <div className="flex gap-4">
                             <div className={`w-1.5 self-stretch rounded-full ${urgency === 'urgent' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                             <div>
                                <h4 className="font-black text-slate-900 dark:text-white text-base group-hover:text-blue-600 transition-colors tracking-tight leading-tight">{c.name}</h4>
                                <div className="mt-2 text-[0.85em]"><RankStars rank={c.rank} /></div>
                             </div>
                         </div>
                         <div className={`flex items-center gap-1.5 text-[10px] xl:text-xs font-black uppercase tracking-widest ${dateColor}`}>
                           <CalendarIcon className="w-3.5 h-3.5" />
                           <span>{c.nextActionDate ? format(new Date(c.nextActionDate), 'MMM d') : 'N/A'}</span>
                         </div>
                      </div>
                      <p className="text-xs xl:text-sm font-bold text-slate-500 dark:text-slate-400 line-clamp-2 pl-5 leading-relaxed italic">
                         {c.upcomingPlan || "Update required"}
                      </p>
                      <div className="flex justify-between items-center pl-5">
                         <Badge color={c.status === 'Active' ? 'green' : 'gray'}>{c.status}</Badge>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        <Card className="p-8 xl:p-10 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-800 dark:text-white mb-8 text-base xl:text-lg uppercase tracking-wider">{t('samplePipeline')}</h3>
          {sampleStatusData.length > 0 ? (
            <>
              <div className="h-64 xl:h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sampleStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sampleStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-1 gap-3 mt-6">
                {sampleStatusData.map(d => (
                  <div key={d.name} className="flex items-center gap-3 text-xs xl:text-sm font-black text-slate-500 uppercase tracking-tight">
                    <div className="w-3.5 h-3.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: d.color }}></div>
                    <span className="truncate">{d.name}: {d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-slate-400 italic font-medium">No sample data available.</div>
          )}
        </Card>

        <Card className="p-8 xl:p-10 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-800 dark:text-white mb-8 text-base xl:text-lg uppercase tracking-wider">Customers by Region</h3>
          <div className="h-64 xl:h-80 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={regionData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                 <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: '900', fill: '#94a3b8'}} interval={0} angle={-30} textAnchor="end" height={60} />
                 <YAxis allowDecimals={false} tick={{fontSize: 10, fontWeight: '900', fill: '#94a3b8'}} />
                 <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 'bold' }} />
                 <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </div>
          <div className="mt-6 flex-1 overflow-y-auto space-y-2">
             {regionData.sort((a,b) => b.count - a.count).map(r => (
               <div key={r.name} className="flex justify-between items-center text-xs xl:text-sm font-black text-slate-500 uppercase">
                  <span>{r.name}</span>
                  <Badge color="blue">{r.count}</Badge>
               </div>
             ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
