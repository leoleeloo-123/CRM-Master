
import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/Common';
import { useApp } from '../contexts/AppContext';
import { Moon, Sun, Monitor, Languages, Building2, Save, Type, Tags, Plus, Trash2 } from 'lucide-react';
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

  const renderTagEditor = (label: string, category: keyof TagOptions) => (
    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border-2 border-slate-100 dark:border-slate-800 shadow-inner">
       <h4 className="font-black text-slate-400 dark:text-slate-500 mb-5 text-[10px] xl:text-xs uppercase tracking-[0.2em] ml-1">{label}</h4>
       <div className="flex flex-wrap gap-2.5 mb-5">
         {tagOptions[category].map(tag => (
           <div key={tag} className="flex items-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs xl:text-sm font-black shadow-sm group hover:border-blue-300 transition-all">
              <span className="text-slate-800 dark:text-slate-200">{t(tag as any)}</span>
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
      <div>
        <h2 className="text-2xl xl:text-4xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase tracking-wider">{t('settings')}</h2>
        <p className="text-sm xl:text-xl text-slate-500 dark:text-slate-400 font-bold tracking-tight">{t('settingsDesc')}</p>
      </div>

      <div className="space-y-12">
        <Card className="p-8 xl:p-12 shadow-sm border-2">
          <h3 className="text-lg xl:text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 mb-8 pb-5 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
            <Building2 className="text-blue-600 w-7 h-7 xl:w-9 xl:h-9" /> Organization & Profile
          </h3>
          
          <div className="max-w-4xl space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  Organization Name
                </label>
                <input 
                  type="text" 
                  value={localCompanyName}
                  onChange={(e) => setLocalCompanyName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-base xl:text-xl transition-all"
                  placeholder="Enter company name..."
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                  User Name
                </label>
                <input 
                  type="text" 
                  value={localUserName}
                  onChange={(e) => setLocalUserName(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none font-black text-base xl:text-xl transition-all"
                  placeholder="Enter your name..."
                />
              </div>
            </div>
            
            <div className="pt-2 flex items-center gap-6">
              <Button onClick={handleSaveProfile} className="px-10 py-3.5 shadow-xl bg-blue-600 hover:bg-blue-700">
                <Save className="w-5 h-5 xl:w-6 xl:h-6" /> {isSaved ? 'Updated Successfully!' : t('save')}
              </Button>
              <span className="text-xs xl:text-sm text-slate-400 font-bold italic">
                Names are used for sidebar display and report filenames.
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-8 xl:p-12 shadow-sm border-2">
          <h3 className="text-lg xl:text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 mb-8 pb-5 border-b border-slate-100 dark:border-slate-800 uppercase tracking-wider">
            <Tags className="text-indigo-600 w-7 h-7 xl:w-9 xl:h-9" /> {t('tagManagement')}
          </h3>
          <p className="text-sm xl:text-lg text-slate-500 dark:text-slate-400 mb-10 font-bold tracking-tight">{t('tagDesc')}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {renderTagEditor(t('tagsSampleStatus'), 'sampleStatus')}
            {renderTagEditor(t('tagsCrystalType'), 'crystalType')}
            {renderTagEditor(t('tagsProductCategory'), 'productCategory')}
            {renderTagEditor(t('tagsProductForm'), 'productForm')}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <Card className="p-8 xl:p-12 shadow-sm border-2">
            <h3 className="text-lg xl:text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 mb-10 uppercase tracking-wider">
              <Monitor className="text-blue-600 w-7 h-7 xl:w-9 xl:h-9" /> {t('appearance')}
            </h3>
            
            <div className="flex gap-6">
               <button
                  onClick={() => toggleTheme('light')}
                  className={`flex-1 p-8 rounded-3xl border-4 flex flex-col items-center gap-5 transition-all active:scale-95 ${
                    theme === 'light' 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-slate-800 shadow-xl' 
                      : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
               >
                  <Sun className="w-10 h-10 xl:w-14 xl:h-14" />
                  <span className="font-black text-lg xl:text-xl uppercase tracking-widest">{t('lightMode')}</span>
               </button>

               <button
                  onClick={() => toggleTheme('dark')}
                  className={`flex-1 p-8 rounded-3xl border-4 flex flex-col items-center gap-5 transition-all active:scale-95 ${
                    theme === 'dark' 
                      ? 'border-blue-600 bg-slate-800 text-blue-400 shadow-xl' 
                      : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
               >
                  <Moon className="w-10 h-10 xl:w-14 xl:h-14" />
                  <span className="font-black text-lg xl:text-xl uppercase tracking-widest">{t('darkMode')}</span>
               </button>
            </div>
          </Card>

          <Card className="p-8 xl:p-12 shadow-sm border-2">
            <h3 className="text-lg xl:text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 mb-10 uppercase tracking-wider">
              <Languages className="text-purple-600 w-7 h-7 xl:w-9 xl:h-9" /> {t('languageSettings')}
            </h3>
            
            <div className="space-y-4">
              <button
                 onClick={() => setLanguage('en')}
                 className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                   language === 'en'
                     ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-lg'
                     : 'border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800'
                 }`}
              >
                 <span className="font-black text-base xl:text-xl uppercase tracking-[0.1em]">{t('english')}</span>
                 {language === 'en' && <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-sm animate-pulse"></div>}
              </button>

              <button
                 onClick={() => setLanguage('zh')}
                 className={`w-full flex items-center justify-between p-6 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                   language === 'zh'
                     ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-lg'
                     : 'border-slate-100 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800'
                 }`}
              >
                 <span className="font-black text-base xl:text-xl uppercase tracking-[0.1em]">{t('chinese')}</span>
                 {language === 'zh' && <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-sm animate-pulse"></div>}
              </button>
            </div>
          </Card>
          
          <Card className="p-8 xl:p-12 md:col-span-2 shadow-sm border-2">
            <h3 className="text-lg xl:text-xl font-black text-slate-900 dark:text-white flex items-center gap-4 mb-10 uppercase tracking-wider">
              <Type className="text-emerald-600 w-7 h-7 xl:w-9 xl:h-9" /> {t('fontSize')}
            </h3>
            
            <div className="flex flex-col md:flex-row gap-6">
               <button
                  onClick={() => setFontSize('small')}
                  className={`flex-1 p-8 rounded-3xl border-4 flex flex-col items-center gap-5 transition-all active:scale-95 ${
                    fontSize === 'small' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-xl' 
                      : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
               >
                  <span className="text-sm xl:text-base font-black uppercase tracking-widest">{t('fontSmall')}</span>
                  <div className="space-y-1.5 w-full opacity-60">
                    <div className="h-2 bg-current rounded-full w-3/4 mx-auto"></div>
                    <div className="h-2 bg-current rounded-full w-1/2 mx-auto"></div>
                  </div>
               </button>

               <button
                  onClick={() => setFontSize('medium')}
                  className={`flex-1 p-8 rounded-3xl border-4 flex flex-col items-center gap-5 transition-all active:scale-95 ${
                    fontSize === 'medium' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-xl' 
                      : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
               >
                  <span className="text-lg xl:text-xl font-black uppercase tracking-widest">{t('fontMedium')}</span>
                  <div className="space-y-2 w-full opacity-60">
                    <div className="h-2.5 bg-current rounded-full w-3/4 mx-auto"></div>
                    <div className="h-2.5 bg-current rounded-full w-1/2 mx-auto"></div>
                  </div>
               </button>

               <button
                  onClick={() => setFontSize('large')}
                  className={`flex-1 p-8 rounded-3xl border-4 flex flex-col items-center gap-5 transition-all active:scale-95 ${
                    fontSize === 'large' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-xl' 
                      : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
               >
                  <span className="text-2xl xl:text-3xl font-black uppercase tracking-widest">{t('fontLarge')}</span>
                  <div className="space-y-2.5 w-full opacity-60">
                    <div className="h-3.5 bg-current rounded-full w-3/4 mx-auto"></div>
                    <div className="h-3.5 bg-current rounded-full w-1/2 mx-auto"></div>
                  </div>
               </button>
            </div>
            <p className="mt-10 text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-[0.3em] text-center bg-slate-50 dark:bg-slate-800/50 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800">
               Scaling factor: {fontSize === 'small' ? '80%' : fontSize === 'medium' ? '90%' : '100%'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
