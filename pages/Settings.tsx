
import React, { useState, useEffect } from 'react';
import { Card, Button } from '../components/Common';
import { useApp } from '../contexts/AppContext';
import { Moon, Sun, Monitor, Languages, Building2, Save, Type } from 'lucide-react';

const Settings: React.FC = () => {
  const { theme, toggleTheme, language, setLanguage, fontSize, setFontSize, companyName, setCompanyName, t } = useApp();
  
  const [localCompanyName, setLocalCompanyName] = useState(companyName);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setLocalCompanyName(companyName);
  }, [companyName]);

  const handleSaveCompany = () => {
    setCompanyName(localCompanyName);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{t('settings')}</h2>
        <p className="text-lg text-slate-500 dark:text-slate-400">{t('settingsDesc')}</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Company Settings */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
            <Building2 className="text-blue-600" size={28} /> Company Profile
          </h3>
          
          <div className="max-w-xl">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Organization Name
            </label>
            <div className="flex gap-4">
              <input 
                type="text" 
                value={localCompanyName}
                onChange={(e) => setLocalCompanyName(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                placeholder="Enter company name..."
              />
              <Button onClick={handleSaveCompany} className="flex items-center gap-2 px-6">
                <Save size={20} /> {isSaved ? 'Saved!' : t('save')}
              </Button>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              This name will be displayed in the sidebar and used for document headers.
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Theme Settings */}
          <Card className="p-8">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-6">
              <Monitor className="text-blue-600" size={28} /> {t('appearance')}
            </h3>
            
            <div className="flex gap-4">
               <button
                  onClick={() => toggleTheme('light')}
                  className={`flex-1 p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                    theme === 'light' 
                      ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-slate-800' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
               >
                  <Sun size={32} />
                  <span className="font-bold text-lg">{t('lightMode')}</span>
               </button>

               <button
                  onClick={() => toggleTheme('dark')}
                  className={`flex-1 p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                    theme === 'dark' 
                      ? 'border-blue-600 bg-slate-800 text-blue-400' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
               >
                  <Moon size={32} />
                  <span className="font-bold text-lg">{t('darkMode')}</span>
               </button>
            </div>
          </Card>

          {/* Language Settings */}
          <Card className="p-8">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-6">
              <Languages className="text-purple-600" size={28} /> {t('languageSettings')}
            </h3>
            
            <div className="space-y-4">
              <button
                 onClick={() => setLanguage('en')}
                 className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                   language === 'en'
                     ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                     : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                 }`}
              >
                 <span className="font-bold text-lg">{t('english')}</span>
                 {language === 'en' && <div className="w-3 h-3 rounded-full bg-blue-600 shadow-sm"></div>}
              </button>

              <button
                 onClick={() => setLanguage('zh')}
                 className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                   language === 'zh'
                     ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                     : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                 }`}
              >
                 <span className="font-bold text-lg">{t('chinese')}</span>
                 {language === 'zh' && <div className="w-3 h-3 rounded-full bg-blue-600 shadow-sm"></div>}
              </button>
            </div>
          </Card>
          
          {/* Font Size Settings */}
          <Card className="p-8 md:col-span-2">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3 mb-6">
              <Type className="text-emerald-600" size={28} /> {t('fontSize')}
            </h3>
            
            <div className="flex flex-col md:flex-row gap-4">
               <button
                  onClick={() => setFontSize('small')}
                  className={`flex-1 p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                    fontSize === 'small' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
               >
                  <span className="text-lg font-medium">{t('fontSmall')}</span>
                  <div className="space-y-1 w-full opacity-60">
                    <div className="h-2 bg-current rounded w-3/4 mx-auto"></div>
                    <div className="h-2 bg-current rounded w-1/2 mx-auto"></div>
                  </div>
               </button>

               <button
                  onClick={() => setFontSize('medium')}
                  className={`flex-1 p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                    fontSize === 'medium' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
               >
                  <span className="text-xl font-bold">{t('fontMedium')}</span>
                  <div className="space-y-1.5 w-full opacity-60">
                    <div className="h-2.5 bg-current rounded w-3/4 mx-auto"></div>
                    <div className="h-2.5 bg-current rounded w-1/2 mx-auto"></div>
                  </div>
               </button>

               <button
                  onClick={() => setFontSize('large')}
                  className={`flex-1 p-6 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${
                    fontSize === 'large' 
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
               >
                  <span className="text-2xl font-extrabold">{t('fontLarge')}</span>
                  <div className="space-y-2 w-full opacity-60">
                    <div className="h-3 bg-current rounded w-3/4 mx-auto"></div>
                    <div className="h-3 bg-current rounded w-1/2 mx-auto"></div>
                  </div>
               </button>
            </div>
            <p className="mt-4 text-sm text-slate-500 text-center">
               "Large" matches the original design size. Select "Medium" or "Small" to reduce scale.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
