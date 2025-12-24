
import React, { useState, useMemo } from 'react';
import { Customer, Sample } from '../types';
import { Card, Badge, RankStars, getUrgencyLevel, Button } from '../components/Common';
import { AlertTriangle, Calendar as CalendarIcon, ArrowRight, Activity, FlaskConical, ChevronLeft, ChevronRight, Globe, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { 
  format, isBefore, addDays, 
  endOfMonth, endOfWeek, eachDayOfInterval, 
  isSameMonth, isSameDay, addMonths, addWeeks, 
  isToday 
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';

/**
 * Hardcoded Holiday Data for 2024 - 2028
 * Note: Chinese Lunar Holidays (Spring Festival, Mid-Autumn) are mapped to their specific solar dates.
 * Multi-day periods (like China's Golden Week) are fully defined for each day.
 */
const HOLIDAY_DATA: Record<string, Record<string, string>> = {
  'China': {
    // 2024
    '2024-01-01': '元旦', '2024-02-10': '春节', '2024-02-11': '春节', '2024-02-12': '春节', '2024-02-13': '春节', '2024-02-14': '春节', '2024-02-15': '春节', '2024-02-16': '春节', '2024-02-17': '春节',
    '2024-04-04': '清明节', '2024-04-05': '清明节', '2024-04-06': '清明节', '2024-05-01': '劳动节', '2024-05-02': '劳动节', '2024-05-03': '劳动节', '2024-05-04': '劳动节', '2024-05-05': '劳动节',
    '2024-06-10': '端午节', '2024-09-15': '中秋节', '2024-09-16': '中秋节', '2024-09-17': '中秋节',
    '2024-10-01': '国庆节', '2024-10-02': '国庆节', '2024-10-03': '国庆节', '2024-10-04': '国庆节', '2024-10-05': '国庆节', '2024-10-06': '国庆节', '2024-10-07': '国庆节',
    // 2025
    '2025-01-01': '元旦', '2025-01-28': '除夕', '2025-01-29': '春节', '2025-01-30': '春节', '2025-01-31': '春节', '2025-02-01': '春节', '2025-02-02': '春节', '2025-02-03': '春节', '2025-02-04': '春节',
    '2025-04-04': '清明节', '2025-05-01': '劳动节', '2025-05-02': '劳动节', '2025-05-03': '劳动节', '2025-05-04': '劳动节', '2025-05-05': '劳动节',
    '2025-10-01': '国庆节', '2025-10-02': '国庆节', '2025-10-03': '国庆节', '2025-10-04': '国庆节', '2025-10-05': '国庆节', '2025-10-06': '国庆节', '2025-10-07': '国庆节',
    // 2026 (Approximate patterns)
    '2026-01-01': '元旦', '2026-02-17': '春节', '2026-02-18': '春节', '2026-02-19': '春节', '2026-02-20': '春节', '2026-02-21': '春节', '2026-02-22': '春节', '2026-02-23': '春节',
    '2026-05-01': '劳动节', '2026-10-01': '国庆节', '2026-10-02': '国庆节', '2026-10-03': '国庆节', '2026-10-04': '国庆节', '2026-10-05': '国庆节', '2026-10-06': '国庆节', '2026-10-07': '国庆节',
    // 2027
    '2027-01-01': '元旦', '2027-02-06': '春节(初一)', '2027-05-01': '劳动节', '2027-10-01': '国庆节', '2027-10-02': '国庆节', '2027-10-03': '国庆节', '2027-10-04': '国庆节', '2027-10-05': '国庆节', '2027-10-06': '国庆节', '2027-10-07': '国庆节',
    // 2028
    '2028-01-01': '元旦', '2028-01-26': '春节(初一)', '2028-05-01': '劳动节', '2028-10-01': '国庆节', '2028-10-02': '国庆节', '2028-10-03': '国庆节', '2028-10-04': '国庆节', '2028-10-05': '国庆节', '2028-10-06': '国庆节', '2028-10-07': '国庆节',
  },
  'USA': {
    // Standard Federal Holidays
    '2024-01-01': 'New Year', '2024-01-15': 'MLK Day', '2024-02-19': 'Presidents Day', '2024-05-27': 'Memorial Day', '2024-07-04': 'Independence Day', '2024-09-02': 'Labor Day', '2024-11-28': 'Thanksgiving', '2024-12-25': 'Christmas',
    '2025-01-01': 'New Year', '2025-01-20': 'MLK Day', '2025-02-17': 'Presidents Day', '2025-05-26': 'Memorial Day', '2025-07-04': 'Independence Day', '2025-09-01': 'Labor Day', '2025-11-27': 'Thanksgiving', '2025-12-25': 'Christmas',
    '2026-01-01': 'New Year', '2026-01-19': 'MLK Day', '2026-02-16': 'Presidents Day', '2026-05-25': 'Memorial Day', '2026-07-04': 'Independence Day', '2026-09-07': 'Labor Day', '2026-11-26': 'Thanksgiving', '2026-12-25': 'Christmas',
    '2027-01-01': 'New Year', '2027-07-04': 'Independence Day', '2027-11-25': 'Thanksgiving', '2027-12-25': 'Christmas',
    '2028-01-01': 'New Year', '2028-07-04': 'Independence Day', '2028-11-23': 'Thanksgiving', '2028-12-25': 'Christmas',
  },
  'Japan': {
    '2024-01-01': 'New Year', '2024-05-03': 'Const. Day', '2024-05-04': 'Greenery Day', '2024-05-05': 'Childrens Day', '2024-08-11': 'Mountain Day', '2024-11-23': 'Labor Day',
    '2025-01-01': 'New Year', '2025-05-03': 'Const. Day', '2025-05-04': 'Greenery Day', '2025-05-05': 'Childrens Day', '2025-08-11': 'Mountain Day', '2025-11-23': 'Labor Day',
    '2026-01-01': 'New Year', '2026-05-03': 'Const. Day', '2026-05-04': 'Greenery Day', '2026-05-05': 'Childrens Day',
    '2027-01-01': 'New Year', '2027-05-03': 'Const. Day', '2027-05-04': 'Greenery Day', '2027-05-05': 'Childrens Day',
    '2028-01-01': 'New Year', '2028-05-03': 'Const. Day', '2028-05-04': 'Greenery Day', '2028-05-05': 'Childrens Day',
  },
  'Germany': {
    '2024-01-01': 'Neujahr', '2024-05-01': 'Tag der Arbeit', '2024-10-03': 'Tag d. Einheit', '2024-12-25': 'Weihnachten', '2024-12-26': 'Stephanstag',
    '2025-01-01': 'Neujahr', '2025-05-01': 'Tag der Arbeit', '2025-10-03': 'Tag d. Einheit', '2025-12-25': 'Weihnachten', '2025-12-26': 'Stephanstag',
    '2026-01-01': 'Neujahr', '2026-05-01': 'Tag der Arbeit', '2026-10-03': 'Tag d. Einheit', '2026-12-25': 'Weihnachten', '2026-12-26': 'Stephanstag',
    '2027-01-01': 'Neujahr', '2027-05-01': 'Tag der Arbeit', '2027-10-03': 'Tag d. Einheit', '2027-12-25': 'Weihnachten', '2027-12-26': 'Stephanstag',
    '2028-01-01': 'Neujahr', '2028-05-01': 'Tag der Arbeit', '2028-10-03': 'Tag d. Einheit', '2028-12-25': 'Weihnachten', '2028-12-26': 'Stephanstag',
  }
};

// Map regional strings to Holiday Data keys
const mapRegionToHolidayKey = (region: string): string | null => {
  const r = region.toLowerCase();
  if (r.includes('china') || r.includes('中国')) return 'China';
  if (r.includes('usa') || r.includes('america') || r.includes('美国')) return 'USA';
  if (r.includes('japan') || r.includes('日本')) return 'Japan';
  if (r.includes('germany') || r.includes('europe') || r.includes('德国')) return 'Germany';
  return null;
};

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
  
  // Holiday region selection state
  const availableRegions = useMemo(() => {
    const regions = new Set<string>();
    customers.forEach(c => {
      c.region.forEach(r => {
        const key = mapRegionToHolidayKey(r);
        if (key) regions.add(key);
      });
    });
    // Add default major regions if not found in customers to ensure the filter has options
    ['China', 'USA', 'Japan', 'Germany'].forEach(r => regions.add(r));
    return Array.from(regions);
  }, [customers]);

  const [selectedHolidayRegions, setSelectedHolidayRegions] = useState<string[]>(['China', 'USA', 'Japan']);
  const [isHolidayMenuOpen, setIsHolidayMenuOpen] = useState(false);

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

  const checkHolidays = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const activeHolidays: { region: string; name: string }[] = [];
    
    selectedHolidayRegions.forEach(region => {
      if (HOLIDAY_DATA[region] && HOLIDAY_DATA[region][dateStr]) {
        activeHolidays.push({ region, name: HOLIDAY_DATA[region][dateStr] });
      }
    });
    
    return activeHolidays;
  };

  const renderEventBadge = (c: any) => (
    <div 
      key={c.id} 
      onClick={(e) => { e.stopPropagation(); navigate(`/customers/${c.id}`); }}
      className={`cursor-pointer rounded px-2 py-0.5 text-[0.65rem] xl:text-[0.75rem] font-black border truncate transition-all hover:scale-[1.02] hover:shadow-sm mb-1 ${getUrgencyColor(c.nextActionDate!)}`}
      title={`${c.name} - ${c.upcomingPlan || 'No upcoming plan'}`}
    >
      {c.name}
    </div>
  );

  const renderHolidayLabel = (holiday: { region: string; name: string }) => (
    <div 
      key={holiday.region + holiday.name} 
      className="text-[8px] xl:text-[9px] font-black text-slate-500/80 dark:text-slate-400 uppercase leading-none truncate whitespace-nowrap mb-0.5 bg-slate-200/50 dark:bg-slate-700/50 px-1 rounded-sm border border-slate-300/30"
      title={`法定假期: ${holiday.region} ${holiday.name}`}
    >
      {holiday.region.substring(0, 3)}: {holiday.name}
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
               const dayHolidays = checkHolidays(day);
               const isCurrentMonth = isSameMonth(day, monthStart);
               const isDayToday = isToday(day);
               const hasHoliday = dayHolidays.length > 0;
               
               return (
                 <div 
                   key={day.toISOString()} 
                   className={`p-1.5 border rounded-lg flex flex-col gap-1 transition-all ${
                     isCurrentMonth 
                       ? hasHoliday ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700' 
                       : 'bg-slate-50 dark:bg-slate-900 border-transparent opacity-50'
                   } ${isDayToday ? 'ring-2 ring-blue-500 ring-inset z-10' : ''}`}
                 >
                    <div className="flex justify-between items-start h-8">
                      <div className="flex-1 overflow-hidden pr-1">
                        {dayHolidays.map(h => renderHolidayLabel(h))}
                      </div>
                      <span className={`text-[10px] xl:text-xs font-black px-1.5 rounded-full ${isDayToday ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400'}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                       {dayEvents.map(e => renderEventBadge(e))}
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
           const dayHolidays = checkHolidays(day);
           const isDayToday = isToday(day);
           const hasHoliday = dayHolidays.length > 0;
           
           return (
             <div key={day.toISOString()} className={`flex flex-col border rounded-lg overflow-hidden ${isDayToday ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className={`p-2 text-center border-b border-slate-100 dark:border-slate-700 h-24 flex flex-col justify-center ${isDayToday ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700' : hasHoliday ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800'}`}>
                   <div className="text-[10px] xl:text-xs font-black uppercase tracking-widest text-slate-400">{format(day, 'EEE')}</div>
                   <div className="text-xl xl:text-2xl font-black leading-none my-1">{format(day, 'd')}</div>
                   <div className="flex flex-col items-center gap-0.5 mt-1 overflow-hidden h-6">
                      {dayHolidays.map(h => (
                        <div key={h.name} className="text-[8px] font-black text-slate-500 truncate max-w-full uppercase">{h.region.substring(0,1)}: {h.name}</div>
                      ))}
                   </div>
                </div>
                <div className={`p-2 flex-1 space-y-2 min-h-[400px] ${hasHoliday ? 'bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-800'}`}>
                   {dayEvents.length > 0 ? dayEvents.map(e => renderEventBadge(e)) : <div className="text-xs text-slate-300 text-center py-4">-</div>}
                </div>
             </div>
           );
        })}
      </div>
    );
  };

  const renderDayView = () => {
     const dayEvents = events.filter(e => isSameDay(e.dateObj, currentDate)).sort((a,b) => a.rank - b.rank);
     const dayHolidays = checkHolidays(currentDate);
     
     return (
       <div className={`rounded-lg border p-6 min-h-[500px] shadow-sm transition-colors ${dayHolidays.length > 0 ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
          <div className="flex justify-between items-start mb-8">
            <h4 className="text-lg xl:text-xl font-black flex items-center gap-3">
               {format(currentDate, 'EEEE, MMMM do')}
               {isToday(currentDate) && <Badge color="blue">Today</Badge>}
            </h4>
            <div className="flex flex-col items-end gap-1.5">
               {dayHolidays.map(h => (
                 <div key={h.name} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-[10px] xl:text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                   法定假期: {h.region} {h.name}
                 </div>
               ))}
            </div>
          </div>
          {dayEvents.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <CalendarIcon className="w-12 h-12 xl:w-16 xl:h-16 opacity-10 mb-2" />
                <p className="italic text-sm xl:text-base font-medium">No critical actions scheduled for this day.</p>
             </div>
          ) : (
             <div className="space-y-4 max-w-4xl mx-auto">
               {dayEvents.map(e => (
                 <div key={e.id} onClick={() => navigate(`/customers/${e.id}`)} className="flex items-start gap-4 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-xl cursor-pointer transition-all bg-white dark:bg-slate-900/50 group">
                    <div className={`w-1.5 self-stretch rounded-full ${getUrgencyLevel(e.nextActionDate!) === 'urgent' ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                    <div className="flex-1">
                       <div className="flex justify-between items-start">
                          <h5 className="font-black text-slate-900 dark:text-white text-base xl:text-lg group-hover:text-blue-600 transition-colors tracking-tight">{e.name}</h5>
                          <div className="text-[1em]"><RankStars rank={e.rank} /></div>
                       </div>
                       <p className="text-slate-600 dark:text-slate-300 mt-2 font-bold text-sm xl:text-base leading-relaxed italic">{e.upcomingPlan || 'Check details'}</p>
                       <div className="mt-4 flex gap-2">
                          <Badge color="gray">{e.status}</Badge>
                          <Badge color="blue">{e.region.join(', ')}</Badge>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          )}
       </div>
     );
  };

  const toggleRegion = (region: string) => {
    setSelectedHolidayRegions(prev => 
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  return (
    <Card className="p-4 xl:p-8 flex flex-col shadow-sm border-2">
       <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
             <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
             <h3 className="font-black text-slate-800 dark:text-white text-base xl:text-lg uppercase tracking-wider">{t('calendar')}</h3>
             <span className="text-sm xl:text-base font-black text-slate-400 ml-2">
                {format(currentDate, 'MMMM yyyy')}
             </span>
             
             {/* Holiday Region Dropdown */}
             <div className="relative ml-4">
                <button 
                  onClick={() => setIsHolidayMenuOpen(!isHolidayMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 text-[10px] font-black transition-all ${isHolidayMenuOpen ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md scale-105' : 'border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-slate-50'}`}
                >
                   <Globe size={14} />
                   假期过滤 ({selectedHolidayRegions.length})
                </button>
                {isHolidayMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsHolidayMenuOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in zoom-in-95 duration-200">
                       <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-2 flex justify-between items-center">
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">选择地区</span>
                          <button className="text-[10px] text-blue-600 font-black hover:underline" onClick={() => setSelectedHolidayRegions(selectedHolidayRegions.length === availableRegions.length ? [] : availableRegions)}>
                            {selectedHolidayRegions.length === availableRegions.length ? '取消' : '全选'}
                          </button>
                       </div>
                       <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                          {availableRegions.map(region => (
                            <button 
                              key={region} 
                              onClick={() => toggleRegion(region)}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black transition-all ${selectedHolidayRegions.includes(region) ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            >
                               {region}
                               {selectedHolidayRegions.includes(region) && <Check size={14} className="text-blue-600" />}
                            </button>
                          ))}
                       </div>
                    </div>
                  </>
                )}
             </div>
          </div>
          
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl shadow-inner">
             <button onClick={() => setView('day')} className={`px-5 py-2 text-[10px] xl:text-xs font-black rounded-xl transition-all ${view === 'day' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('viewDay')}</button>
             <button onClick={() => setView('week')} className={`px-5 py-2 text-[10px] xl:text-xs font-black rounded-xl transition-all ${view === 'week' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>{t('viewWeek')}</button>
             <button onClick={() => setView('month')} className={`px-5 py-2 text-[10px] xl:text-xs font-black rounded-xl transition-all ${view === 'month' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>{t('viewMonth')}</button>
          </div>

          <div className="flex items-center gap-2">
             <button onClick={handlePrev} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 transition-all active:scale-90"><ChevronLeft className="w-5 h-5 xl:w-6 xl:h-6"/></button>
             <button onClick={handleToday} className="px-5 py-2 text-[10px] xl:text-xs font-black bg-white border-2 border-slate-100 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 rounded-xl shadow-sm transition-all active:scale-95">{t('today')}</button>
             <button onClick={handleNext} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-slate-400 transition-all active:scale-90"><ChevronRight className="w-5 h-5 xl:w-6 xl:h-6"/></button>
          </div>
       </div>
       
       <div className="flex-1 animate-in fade-in duration-500">
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
    <div className="space-y-8 xl:space-y-12 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl xl:text-4xl font-black text-slate-800 dark:text-white mb-1 tracking-tight">CRM Master</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm xl:text-lg font-bold tracking-tight">Welcome back</p>
        </div>
        <div className="text-sm xl:text-lg text-slate-400 font-black">
          Today: <span className="text-slate-900 dark:text-white">{format(new Date(), 'MMMM do, yyyy')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 xl:gap-8">
        <Card className="p-5 xl:p-8 flex items-center gap-5 xl:gap-8 border-l-4 border-l-blue-500 shadow-sm border-2">
          <div className="p-3 xl:p-5 bg-blue-50 dark:bg-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100">
            <Activity className={iconClass} />
          </div>
          <div>
            <p className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('totalCustomers')}</p>
            <p className="text-3xl xl:text-5xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{customers.length}</p>
          </div>
        </Card>
        <Card className="p-5 xl:p-8 flex items-center gap-5 xl:gap-8 border-l-4 border-l-amber-500 shadow-sm border-2">
          <div className="p-3 xl:p-5 bg-amber-50 dark:bg-amber-900/50 rounded-2xl text-amber-600 dark:text-amber-400 shadow-sm border border-amber-100">
            <FlaskConical className={iconClass} />
          </div>
          <div>
            <p className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">{t('activeSamples')}</p>
            <p className="text-3xl xl:text-5xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{activeSamples}</p>
          </div>
        </Card>
        <Card className="p-5 xl:p-8 flex items-center gap-5 xl:gap-8 border-l-4 border-l-purple-500 shadow-sm border-2">
          <div className="p-3 xl:p-5 bg-purple-50 dark:bg-purple-900/50 rounded-2xl text-purple-600 dark:text-purple-400 shadow-sm border border-purple-100">
            <CalendarIcon className={iconClass} />
          </div>
          <div>
            <p className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Pending Feedback</p>
            <p className="text-3xl xl:text-5xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">{pendingFeedback}</p>
          </div>
        </Card>
        <Card className="p-5 xl:p-8 flex items-center gap-5 xl:gap-8 border-l-4 border-l-red-500 shadow-sm border-2">
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
              <Card className="p-12 text-center text-slate-400 italic font-medium border-2">
                <p>No critical actions pending. Great job!</p>
              </Card>
            ) : (
              criticalCustomers.map(c => { 
                const urgency = getUrgencyLevel(c.nextActionDate);
                let dateColor = "text-slate-400";
                if (urgency === 'urgent') dateColor = "text-red-600 dark:text-red-500 font-black";
                if (urgency === 'warning') dateColor = "text-amber-600 dark:text-amber-500 font-black";

                return (
                  <Card key={c.id} className="p-5 hover:shadow-xl transition-all cursor-pointer border-2 border-slate-100 dark:border-slate-800 group" onClick={() => navigate(`/customers/${c.id}`)}>
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

        <Card className="p-8 xl:p-10 shadow-sm flex flex-col border-2">
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

        <Card className="p-8 xl:p-10 shadow-sm flex flex-col border-2">
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
