
import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/Common';
import { useApp } from '../contexts/AppContext';
import { Moon, Sun, Monitor, Languages, Building2, Save, Type, Tags, Plus, Trash2, Presentation, Activity, ClipboardList, Coffee, CloudMoon, Leaf } from 'lucide-react';
import { TagOptions } from '../types';
import { getCanonicalTag } from '../utils/i18n';

const Settings: React.FC = () => {
  const { theme, toggleTheme, language, setLanguage, fontSize, setFontSize, companyName, setCompanyName, userName, setUserName, t, tagOptions, setTagOptions } = useApp();
  
  const [localCompanyName, setLocalCompanyName] = useState(companyName);
  const [localUserName, setLocalUserName] = useState(userName);
  const [isSaved, setIsSaved] = useState(false);
  
  const [newTagInput, setNewTagInput] = useState<{[key: string]: string}>({});

  useEffect(() => {
    setLocalCompanyName(companyName);
    setLocalUserName(userName);
  }, [companyName, userName]);

  const handleSaveProfile = () => {
    setCompanyName(localCompanyName);
    setUserName(localUserName);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };
  
  const handleAddTag = (category: keyof TagOptions) => {
    const val = newTagInput[category]?.trim();
    if (!val) return;
    const canonical = getCanonicalTag(val);
    setTagOptions(prev => ({
      ...prev,
      [category]: [...prev[category], canonical]
    }));
    setNewTagInput(prev => ({...prev, [category]: ''}));
  };
  
  const handleDeleteTag = (category: keyof TagOptions, tagToDelete: string) => {
    if (confirm(`Delete "${tagToDelete}" from options?`)) {
      setTagOptions(prev => ({
        ...prev,
        [category]: prev[category].filter(t => t !== tagToDelete)
      }));
    }
  };

  const renderTagEditor = (labelKey: keyof typeof import('../utils/i18n').translations['en'], category: keyof TagOptions) => (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-inner">
       <h4 className="font-black text-slate-400 dark:text-slate-500 mb-5 text-[10px] xl:text-xs uppercase tracking-[0.2em] ml-1">{t(labelKey)}</h4>
       <div className="flex flex-wrap gap-2.5 mb-5">
         {tagOptions[category].map(tag => (
           <div key={tag} className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs xl:text-sm font-black shadow-sm group hover:border-blue-300 transition-all">
              <span className="text-slate-800 dark:text-slate-200">{tag}</span>
              <button 
                onClick={() => handleDeleteTag(category, tag)}
                className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
           </div>
         ))}
       </div>
       <div className="flex gap-2">
         <input 
           type="text" 
           className="flex-1 text-sm xl:text-base font-bold px-4 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
           placeholder={t('addTagPlaceholder')}
           value={newTagInput[category] || ''}
           onChange={(e) => setNewTagInput(prev => ({...prev, [category]: e.target.value}))}
           onKeyDown={(e) => e.key === 'Enter' && handleAddTag(category)}
         />
         <button onClick={() => handleAddTag(category)} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm active:scale-90">
           <Plus className="w-5 h-5" />
         </button>
       </div>
    </div>
  );

  return (
    <div className="space-y-10 xl:space-y-16 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl xl:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('settings')}</h2>
        <p className="text-sm xl:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">{t('settingsDesc')}</p>
      </div>

      <div className="space-y-12">
        <Card className="p-8 xl:p-12 shadow-sm border-2">
          <h3 className="text-lg xl:text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 mb-8 pb-5 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
            <Building2 className="text-blue-600 w-7 h-7 xl:w-8 xl:h-8" /> {t('orgProfile')}
          </h3>
          <div className="max-w-4xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('orgName')}</label>
                <input type="text" value={localCompanyName} onChange={(e) => setLocalCompanyName(localCompanyName)} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-base xl:text-xl transition-all" placeholder={t('orgName')} />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{t('uName')}</label>
                <input type="text" value={localUserName} onChange={(e) => setLocalUserName(e.target.value)} className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-base xl:text-xl transition-all" placeholder={t('uName')} />
              </div>
            </div>
            <div className="pt-2 flex items-center gap-6">
              <Button onClick={handleSaveProfile} className="px-10 py-3.5 shadow-xl bg-blue-600 hover:bg-blue-700">
                <Save className="w-5 h-5 xl:w-6 xl:h-6" /> {isSaved ? t('profileUpdated') : t('saveProfile')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Unified Tag Management Card */}
        <Card className="p-8 xl:p-12 shadow-sm border-2">
          <h3 className="text-lg xl:text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 mb-8 pb-5 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
            <Tags className="text-indigo-600 w-7 h-7 xl:w-8 xl:h-8" /> {t('tagManagement')}
          </h3>
          
          <div className="space-y-12">
            {/* Interaction Tags Section */}
            <div className="space-y-6">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-widest opacity-70">
                <Activity size={18} className="text-amber-500" /> {t('interactionTagManagement')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderTagEditor("interactionType", 'interactionTypes')}
                {renderTagEditor("interactionEffect", 'interactionEffects')}
              </div>
            </div>

            {/* Sample Tags Section */}
            <div className="space-y-6 pt-10 border-t dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-widest opacity-70">
                <ClipboardList size={18} className="text-blue-600" /> {t('sampleTracking')}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {renderTagEditor("tagsSampleStatus", 'sampleStatus')}
                {renderTagEditor("tagsCrystalType", 'crystalType')}
                {renderTagEditor("tagsProductCategory", 'productCategory')}
                {renderTagEditor("tagsProductForm", 'productForm')}
              </div>
            </div>

            {/* Exhibition Tags Section */}
            <div className="space-y-6 pt-10 border-t dark:border-slate-800">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-widest opacity-70">
                <Presentation size={18} className="text-indigo-500" /> {t('exhibitionMetadata')}
              </h4>
              <div className="grid grid-cols-1 gap-8">
                {renderTagEditor('eventSeries', 'eventSeries')}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Card className="p-8 xl:p-12 shadow-sm border-2">
            <h3 className="text-lg xl:text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 mb-8 pb-5 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
              <Monitor className="text-blue-600 w-7 h-7 xl:w-8 xl:h-8" /> {t('appearance')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
               <button onClick={() => toggleTheme('light')} className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all active:scale-95 ${theme === 'light' ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-lg' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                  <Sun className="w-6 h-6 xl:w-8 xl:h-8" />
                  <span className="font-black text-[10px] xl:text-xs uppercase tracking-widest">{t('lightMode')}</span>
               </button>
               <button onClick={() => toggleTheme('warm')} className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all active:scale-95 ${theme === 'warm' ? 'border-amber-600 bg-amber-50 text-amber-800 shadow-lg' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                  <Coffee className="w-6 h-6 xl:w-8 xl:h-8" />
                  <span className="font-black text-[10px] xl:text-xs uppercase tracking-widest">Warm Light</span>
               </button>
               <button onClick={() => toggleTheme('dark')} className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all active:scale-95 ${theme === 'dark' ? 'border-blue-500 bg-slate-800 text-blue-400 shadow-lg' : 'border-slate-800 text-slate-500 hover:bg-slate-800/50'}`}>
                  <Moon className="w-6 h-6 xl:w-8 xl:h-8" />
                  <span className="font-black text-[10px] xl:text-xs uppercase tracking-widest">{t('darkMode')}</span>
               </button>
               <button onClick={() => toggleTheme('dark-green')} className={`p-4 rounded-3xl border-2 flex flex-col items-center gap-3 transition-all active:scale-95 ${theme === 'dark-green' ? 'border-emerald-600 bg-[#e8efeb] text-emerald-700 shadow-lg' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>
                  <Leaf className="w-6 h-6 xl:w-8 xl:h-8" />
                  <span className="font-black text-[10px] xl:text-xs uppercase tracking-widest">Soft Green</span>
               </button>
            </div>
          </Card>

          <Card className="p-8 xl:p-12 shadow-sm border-2">
            <h3 className="text-lg xl:text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 mb-8 pb-5 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
              <Languages className="text-purple-600 w-7 h-7 xl:w-8 xl:h-8" /> {t('languageSettings')}
            </h3>
            <div className="space-y-4">
              <button onClick={() => setLanguage('en')} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${language === 'en' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-lg' : 'border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                 <span className="font-black text-xs xl:text-sm uppercase tracking-[0.1em]">{t('english')}</span>
              </button>
              <button onClick={() => setLanguage('zh')} className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${language === 'zh' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-lg' : 'border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                 <span className="font-black text-xs xl:text-sm uppercase tracking-[0.1em]">{t('chinese')}</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
