
import React, { useState } from 'react';
import { Customer, Sample } from '../types';
import { Card, Badge, RankStars, getUrgencyLevel } from '../components/Common';
import { AlertTriangle, Calendar as CalendarIcon, ArrowRight, Activity, FlaskConical, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  format, isBefore, parseISO, addDays, 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks, 
  addDays as dateAddDays, subDays, isToday 
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

  // Filter for Tier 1 & 2 customers with valid next action dates
  const events = customers.filter(c => c.rank <= 2 && c.nextActionDate).map(c => ({
    ...c,
    dateObj: parseISO(c.nextActionDate!)
  }));

  const handlePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    if (view === 'day') setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (view === 'day') setCurrentDate(dateAddDays(currentDate, 1));
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
      className={`cursor-pointer rounded px-2 py-1 text-xs xl:text-sm font-medium border truncate transition-all hover:scale-105 hover:shadow-sm mb-1 ${getUrgencyColor(c.nextActionDate!)}`}
      title={`${c.name} - ${c.interactions[0]?.nextSteps || 'No next step'}`}
    >
      {/* Show full name but truncated with CSS, instead of hard substring */}
      {c.name}
    </div>
  );

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="w-full">
         <div className="grid grid-cols-7 mb-2">
            {weekDays.map(d => (
              <div key={d} className="text-center text-sm xl:text-base font-bold text-slate-500 uppercase">{d}</div>
            ))}
         </div>
         {/* Increased min-height for cells to 120px to allow more content */}
         <div className="grid grid-cols-7 gap-1 auto-rows-[minmax(120px,auto)]">
            {days.map(day => {
               const dayEvents = events.filter(e => isSameDay(e.dateObj, day));
               const isCurrentMonth = isSameMonth(day, monthStart);
               const isDayToday = isToday(day);
               
               return (
                 <div 
                   key={day.toISOString()} 
                   className={`p-2 border rounded-lg flex flex-col gap-1 min-h-[120px] transition-colors ${isCurrentMonth ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-50'} ${isDayToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                 >
                    <span className={`text-sm xl:text-lg font-bold self-end px-2 rounded-full ${isDayToday ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>
                      {format(day, 'd')}
                    </span>
                    {/* Removed max-height so cell grows with content */}
                    <div className="flex-1 flex flex-col gap-1">
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
    const startDate = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }).map((_, i) => dateAddDays(startDate, i));

    return (
      <div className="grid grid-cols-7 gap-2 h-auto">
        {days.map(day => {
           const dayEvents = events.filter(e => isSameDay(e.dateObj, day));
           const isDayToday = isToday(day);
           
           return (
             <div key={day.toISOString()} className={`flex flex-col border rounded-lg overflow-hidden ${isDayToday ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className={`p-2 text-center text-sm font-bold border-b border-slate-100 dark:border-slate-700 ${isDayToday ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700' : 'bg-slate-50 dark:bg-slate-800'}`}>
                   <div className="text-sm xl:text-base font-bold uppercase">{format(day, 'EEE')}</div>
                   <div className="text-xl xl:text-2xl font-extrabold">{format(day, 'd')}</div>
                </div>
                <div className="p-2 flex-1 bg-white dark:bg-slate-800 space-y-2 min-h-[150px]">
                   {dayEvents.length > 0 ? dayEvents.map(e => renderEventBadge(e, false)) : <div className="text-xs text-slate-300 text-center py-4">-</div>}
                </div>
             </div>
           );
        })}
      </div>
    );
  };

  const renderDayView = () => {
     const dayEvents = events.filter(e => isSameDay(e.dateObj, currentDate));
     
     return (
       <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 h-auto">
          <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
             {format(currentDate, 'EEEE, MMMM do')}
             {isToday(currentDate) && <Badge color="blue">Today</Badge>}
          </h4>
          {dayEvents.length === 0 ? (
             <p className="text-slate-400 italic py-4">No critical actions scheduled for this day.</p>
          ) : (
             <div className="space-y-3">
               {dayEvents.map(e => (
                 <div key={e.id} onClick={() => navigate(`/customers/${e.id}`)} className="flex items-start gap-4 p-3 rounded-lg border border-slate-100 dark:border-slate-700 hover:shadow-md cursor-pointer transition-all bg-slate-50 dark:bg-slate-900/50">
                    <div className={`w-1 self-stretch rounded-full ${getUrgencyLevel(e.nextActionDate!) === 'urgent' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                    <div className="flex-1">
                       <div className="flex justify-between">
                          <h5 className="font-bold text-slate-800 dark:text-white text-lg">{e.name}</h5>
                          <RankStars rank={e.rank} />
                       </div>
                       <p className="text-slate-600 dark:text-slate-300 mt-1">{e.interactions[0]?.nextSteps || 'Check details'}</p>
                       <div className="mt-2 flex gap-2">
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
    // Removed h-full to allow calendar to shrink to fit content (reducing whitespace)
    <Card className="p-4 xl:p-6 flex flex-col">
       <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
          <div className="flex items-center gap-2">
             <CalendarIcon className="w-5 h-5 xl:w-6 xl:h-6 text-blue-600 dark:text-blue-400" />
             <h3 className="font-bold text-slate-800 dark:text-white text-lg xl:text-xl">{t('calendar')}</h3>
             <span className="text-sm xl:text-base font-medium text-slate-500 dark:text-slate-400 ml-2 hidden md:inline">
                {format(currentDate, 'MMMM yyyy')}
             </span>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
             <button onClick={() => setView('day')} className={`px-3 py-1 text-xs xl:text-sm font-bold rounded ${view === 'day' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}>{t('viewDay')}</button>
             <button onClick={() => setView('week')} className={`px-3 py-1 text-xs xl:text-sm font-bold rounded ${view === 'week' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}>{t('viewWeek')}</button>
             <button onClick={() => setView('month')} className={`px-3 py-1 text-xs xl:text-sm font-bold rounded ${view === 'month' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500'}`}>{t('viewMonth')}</button>
          </div>

          <div className="flex items-center gap-1">
             <button onClick={handlePrev} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronLeft size={20}/></button>
             <button onClick={handleToday} className="px-2 py-1 text-xs xl:text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded">{t('today')}</button>
             <button onClick={handleNext} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronRight size={20}/></button>
          </div>
       </div>
       
       <div className="flex-1">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
       </div>
       <div className="mt-4 flex gap-4 text-xs text-slate-500 justify-end">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Urgent (&lt;7d)</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Warning (&lt;14d)</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Safe</div>
       </div>
    </Card>
  );
};


const Dashboard: React.FC<DashboardProps> = ({ customers, samples }) => {
  const navigate = useNavigate();
  const { t, tagOptions } = useApp();
  
  // State for Priority Attention Filter: '1' (Tier 1 Only) or '1-2' (Tier 1 & 2)
  const [priorityFilter, setPriorityFilter] = useState<'1' | '1-2'>('1');

  const criticalCustomers = customers.filter(c => {
    // 1. Filter by Rank based on state
    const rankCondition = priorityFilter === '1' ? c.rank === 1 : c.rank <= 2;
    if (!rankCondition) return false;

    // 2. Filter by Date urgency
    const now = new Date();
    const actionDate = c.nextActionDate ? parseISO(c.nextActionDate) : null;
    const isOverdue = actionDate && isBefore(actionDate, now);
    const isUpcoming = actionDate && isBefore(actionDate, addDays(now, 7)) && !isOverdue; // 7 day lookahead
    
    return isOverdue || isUpcoming;
  }).sort((a, b) => {
    // 1. Sort by Rank (Ascending: 1 before 2)
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    
    // 2. Sort by Date (Ascending: Earliest date first)
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
            <CalendarIcon className={iconClass} />
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
        
        {/* Left Column: Priority Attention */}
        <div className="lg:col-span-1 space-y-4 xl:space-y-6 flex flex-col h-full">
          <div className="flex flex-col gap-2">
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
            
            {/* Filter Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
               <button 
                 onClick={() => setPriorityFilter('1')}
                 className={`px-3 py-1 text-xs font-bold rounded ${priorityFilter === '1' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}
               >
                 {t('filterTier1Only')}
               </button>
               <button 
                 onClick={() => setPriorityFilter('1-2')}
                 className={`px-3 py-1 text-xs font-bold rounded ${priorityFilter === '1-2' ? 'bg-white dark:bg-slate-700 shadow text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}
               >
                 {t('filterTier1And2')}
               </button>
            </div>
          </div>
          
          <div className="space-y-3 xl:space-y-4 overflow-y-auto max-h-[800px] pr-2 scrollbar-thin">
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
                  <Card key={c.id} className="p-3 xl:p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/customers/${c.id}`)}>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                         <div className="flex gap-2">
                             <div className={`w-1.5 self-stretch rounded-full ${urgency === 'urgent' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                             <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm xl:text-base">{c.name}</h4>
                                <div className="mt-1">
                                   <RankStars rank={c.rank} />
                                </div>
                             </div>
                         </div>
                         <div className={`flex items-center gap-1 text-xs xl:text-sm font-medium ${dateColor}`}>
                           <CalendarIcon className="w-3 h-3 xl:w-4 xl:h-4" />
                           <span>
                             {c.nextActionDate ? format(parseISO(c.nextActionDate), 'MMM d') : 'N/A'}
                           </span>
                         </div>
                      </div>
                      <p className="text-xs xl:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 pl-3.5">
                         {c.interactions[0]?.nextSteps || "Update required"}
                      </p>
                      <div className="flex justify-between items-center pl-3.5 mt-1">
                         <Badge color={c.status === 'Active' ? 'green' : 'gray'}>{c.status}</Badge>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Calendar & Charts */}
        <div className="lg:col-span-2 space-y-6 xl:space-y-10">
           
           {/* NEW CALENDAR COMPONENT */}
           <DashboardCalendar customers={customers} />

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5 xl:p-8">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 xl:mb-6 text-base xl:text-xl">{t('samplePipeline')}</h3>
                {sampleStatusData.length > 0 ? (
                  <>
                    <div className="h-48 xl:h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={sampleStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={75}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {sampleStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', fontSize: '14px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {sampleStatusData.map(d => (
                        <div key={d.name} className="flex items-center gap-2 text-xs xl:text-sm text-slate-600 dark:text-slate-300">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                          <span className="truncate">{d.name}: {d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="h-48 flex items-center justify-center text-slate-400 italic">No sample data available.</div>
                )}
              </Card>

              <Card className="p-5 xl:p-8">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 xl:mb-6 text-base xl:text-xl">{t('customersByRegion')}</h3>
                <div className="h-48 xl:h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={regionData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                       <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} interval={0} angle={-30} textAnchor="end" height={50} />
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
    </div>
  );
};

export default Dashboard;
