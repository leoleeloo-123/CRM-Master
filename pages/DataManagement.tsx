
import React, { useState } from 'react';
import { Customer, Sample, Rank, SampleStatus, CustomerStatus, FollowUpStatus, ProductCategory, ProductForm, Interaction, CrystalType, GradingStatus } from '../types';
import { Card, Button, Badge, Modal } from '../components/Common';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, Users, FlaskConical, Search, X, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { differenceInDays, parseISO, isValid } from 'date-fns';

interface DataManagementProps {
  onImportCustomers: (newCustomers: Customer[]) => void;
  onImportSamples: (newSamples: Sample[]) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
  onImportCustomers, 
  onImportSamples
}) => {
  const { t, clearDatabase, customers, samples } = useApp();
  const [activeTab, setActiveTab] = useState<'customers' | 'samples'>('customers');
  const [importData, setImportData] = useState('');
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob(["\uFEFF" + content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper to map Internal English Status -> Chinese Export Status
  const mapStatusToExport = (status: FollowUpStatus | string): string => {
    switch (status) {
      case 'My Turn': return '我方跟进';
      case 'Waiting for Customer': return '等待对方';
      case 'No Action': return '暂无';
      default: return '暂无';
    }
  };

  // Helper to map Import Status (Chinese or English) -> Internal English Status
  const mapStatusFromImport = (status: string): FollowUpStatus => {
    const s = status ? status.trim() : '';
    if (s === '我方跟进' || s === 'My Turn') return 'My Turn';
    if (s === '等待对方' || s === 'Waiting for Customer') return 'Waiting for Customer';
    if (s === '暂无' || s === 'No Action') return 'No Action';
    return 'No Action'; // Default fallback
  };

  const handleExportCustomers = () => {
    const headers = [
      "客户", "地区", "展会", "展会官网", "等级", "状态与产品总结", "状态更新", "未更新", 
      "对接人员", "状态", "下一步", "关键日期", "DDL", "对接流程总结", "对方回复", 
      "未回复", "我方跟进", "未跟进", "文档超链接", "联系方式"
    ];
    
    const rows = customers.map(c => {
      const tags = c.tags.map((tag, i) => `${i + 1}. ${tag}`).join(' ||| ');
      const regions = Array.isArray(c.region) ? c.region.join(' ||| ') : c.region;
      
      const contactNames = c.contacts.map((contact, i) => {
        let str = `${i + 1}. ${contact.name}`;
        if (contact.title) str += ` (${contact.title})`;
        if (contact.isPrimary) str += ` 【主要联系人】`;
        return str;
      }).join(' ||| ');

      const contactInfos = c.contacts.map(contact => contact.email || contact.phone || '').join(' ||| ');
      const interactionText = [...c.interactions].reverse().map(i => `【${i.date}】 ${i.summary}`).join(' ||| ');
      const nextStep = c.interactions.length > 0 ? (c.interactions[0].nextSteps || '') : '';
      const docLinks = c.docLinks ? c.docLinks.join(' ||| ') : '';
      const productSummaryExport = (c.productSummary || '').replace(/\n/g, ' ||| ');
      const statusExport = mapStatusToExport(c.followUpStatus);

      return [
        c.name, regions, tags, "", c.rank, productSummaryExport, c.lastStatusUpdate, "", contactNames,
        statusExport, nextStep, c.nextActionDate, "", interactionText, c.lastCustomerReplyDate, "",
        c.lastMyReplyDate, "", docLinks, contactInfos
      ].map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(",");
    });
    
    const csvContent = [headers.join(","), ...rows].join("\n");
    downloadCSV(csvContent, "navi_customers_master_export.csv");
  };

  const handleExportSamples = () => {
    // Columns strictly following the requirement (19 Columns)
    const headers = [
      "1.Customer", 
      "2.Sample Index", 
      "3.Status", 
      "4.Test Finished", 
      "5.Crystal Type", 
      "6.Sample Category", 
      "7.Form", 
      "8.Original Size", 
      "9.Processed Size", 
      "10.Is Graded", 
      "11.Sample SKU", 
      "12.Label Hyperlink", 
      "13.Details", 
      "14.Quantity", 
      "15.Customer Application", 
      "16.Status Date", 
      "17.Days Since Update", 
      "18.Status Details", 
      "19.Tracking #"
    ];

    const rows = samples.map(s => {
       // Ensure status details use ||| delimiter for newlines
       const safeDetails = (s.statusDetails || '').replace(/\n/g, ' ||| ');
       
       // Calculate Days Since Update
       let daysSince = "";
       if (s.lastStatusDate && isValid(parseISO(s.lastStatusDate))) {
         daysSince = String(differenceInDays(new Date(), parseISO(s.lastStatusDate)));
       }

       return [
         s.customerName,
         s.sampleIndex || 1,
         s.status,
         s.isTestFinished ? 'Yes' : 'No',
         s.crystalType,
         s.productCategory?.join(', '),
         s.productForm,
         s.originalSize,
         s.processedSize,
         s.isGraded,
         s.sampleSKU,
         s.labelHyperlink,
         s.sampleDetails,
         s.quantity,
         s.application,
         s.lastStatusDate,
         daysSince, // Export Calculated Field
         safeDetails,
         s.trackingNumber
       ].map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    downloadCSV(csvContent, "navi_samples_master_export.csv");
  };

  const splitByDelimiter = (str: string | undefined): string[] => {
    if (!str) return [];
    return str.split('|||').map(s => s.trim()).filter(s => s.length > 0);
  };

  const normalizeDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const trimmed = dateStr.trim();
    if (!trimmed) return '';
    // Try to extract date from 【YYYY-MM-DD】 format if present
    const bracketMatch = trimmed.match(/【(.*?)】/);
    if (bracketMatch) {
       return normalizeDate(bracketMatch[1]);
    }

    const yearFirstMatch = trimmed.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
    if (yearFirstMatch) return `${yearFirstMatch[1]}-${yearFirstMatch[2].padStart(2, '0')}-${yearFirstMatch[3].padStart(2, '0')}`;
    
    const yearLastMatch = trimmed.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
    if (yearLastMatch) return `${yearLastMatch[3]}-${yearLastMatch[1].padStart(2, '0')}-${yearLastMatch[2].padStart(2, '0')}`;
    
    const dateObj = new Date(trimmed);
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const d = dateObj.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return trimmed;
  };

  const clearPreview = () => {
    setParsedPreview(null);
    setImportStatus(null);
  };

  const parsePasteData = () => {
    if (!importData.trim()) {
      setImportStatus({ type: 'error', message: 'Please paste data into the text area.' });
      return;
    }

    try {
      const rows = importData.trim().split('\n').filter(r => r.trim() !== '');
      const parsed = rows.map((row, index) => {
        const cols = row.split('\t').map(c => c.trim());
        const tempId = Math.random().toString(36).substr(2, 9);
        
        if (activeTab === 'customers') {
          // ... (Existing Customer Import Logic)
          const name = cols[0] || 'Unknown';
          const regions = splitByDelimiter(cols[1]);
          const finalRegions = regions.length > 0 ? regions : ['Unknown'];
          const rawTags = splitByDelimiter(cols[2]);
          const cleanTags = rawTags.map(t => t.replace(/^\d+[\.\、\s]*\s*/, ''));
          const rank = (parseInt(cols[4]) || 3) as Rank;
          const productSummary = (cols[5] || '').replace(/\|\|\|/g, '\n');
          const lastStatusUpdate = normalizeDate(cols[6]);
          const followUpStatus = mapStatusFromImport(cols[9]);
          const nextSteps = cols[10] || '';
          const nextActionDate = normalizeDate(cols[11]);
          const lastCustomerReplyDate = normalizeDate(cols[14]);
          const lastMyReplyDate = normalizeDate(cols[16]);
          const docLinks = splitByDelimiter(cols[18]);
          const contactNames = splitByDelimiter(cols[8]);
          const contactInfos = splitByDelimiter(cols[19]);
          
          const contacts = contactNames.map((cName, i) => {
             const info = contactInfos[i] || '';
             const isEmail = info.includes('@');
             let cleanName = cName.replace(/^\d+[\.\s]*\s*/, '');
             let isPrimary = false;
             if (cleanName.includes('【主要联系人】')) {
                 isPrimary = true;
                 cleanName = cleanName.replace('【主要联系人】', '');
             }
             let title = '';
             const titleMatch = cleanName.match(/\((.*?)\)/);
             if (titleMatch) {
                 title = titleMatch[1].trim();
                 cleanName = cleanName.replace(titleMatch[0], '');
             }
             return {
               name: cleanName.trim(),
               title: title,
               isPrimary: isPrimary,
               email: isEmail ? info : '',
               phone: !isEmail ? info : ''
             };
          });

          if (contacts.length === 0 && contactNames.length === 0 && contactInfos.length > 0) {
             contacts.push({ name: 'Primary Contact', title: '', isPrimary: false, email: contactInfos[0].includes('@') ? contactInfos[0] : '', phone: ''});
          }

          const rawInteractions = splitByDelimiter(cols[13]);
          const interactions: Interaction[] = rawInteractions.map((raw, i) => {
             const dateMatch = raw.match(/【(.*?)】/);
             let date = lastMyReplyDate || new Date().toISOString().split('T')[0];
             let summary = raw;
             if (dateMatch) {
               date = normalizeDate(dateMatch[1]);
               summary = raw.replace(/^[\s\-\.\*]*【.*?】/, '').trim();
             } else {
               summary = raw.replace(/^[\s\-\.\*]+/, '').trim();
             }
             return {
               id: `int_${tempId}_${i}`,
               date: date,
               summary: summary,
               tags: []
             };
          }).reverse();
          
           if (interactions.length === 0 && nextSteps) {
             interactions.push({
               id: `int_${tempId}_next`,
               date: new Date().toISOString().split('T')[0],
               summary: 'Pending Next Step',
               nextSteps: nextSteps
             });
          } else if (interactions.length > 0 && nextSteps) {
             interactions[0].nextSteps = nextSteps;
          }

          return {
            id: `new_c_${tempId}`,
            name: name,
            region: finalRegions,
            tags: cleanTags,
            rank: rank,
            productSummary: productSummary,
            lastStatusUpdate: lastStatusUpdate,
            followUpStatus: followUpStatus,
            nextActionDate: nextActionDate,
            lastCustomerReplyDate: lastCustomerReplyDate,
            lastMyReplyDate: lastMyReplyDate,
            lastContactDate: lastMyReplyDate,
            contacts: contacts,
            docLinks: docLinks,
            status: 'Active' as CustomerStatus,
            interactions: interactions
          } as Customer;

        } else {
          // --- SAMPLE IMPORT LOGIC (19 Columns) ---
          // 0:Customer, 1:Index, 2:Status, 3:TestFinished, 4:Crystal, 5:Category, 6:Form, 
          // 7:OrigSize, 8:ProcSize, 9:Graded, 10:SKU, 11:LabelLink, 12:Details, 
          // 13:Qty, 14:App, 15:Date, 16:DaysSince(Ignore), 17:StatusDetails, 18:Tracking

          const custName = cols[0] || 'Unknown';
          const matchedCustomer = customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
          
          const sampleIndex = parseInt(cols[1]) || 1;
          const statusDetails = cols[17] || ''; // Col 18 in 1-base is index 17

          // Auto-generate sampleName since it's removed from columns
          // Logic: Category + OriginalSize
          const category = cols[5] || '';
          const origSize = cols[7] || '';
          const generatedName = category ? `${category} ${origSize}`.trim() : (cols[12] || 'New Sample');

          return {
            id: `new_s_${tempId}`,
            customerId: matchedCustomer ? matchedCustomer.id : 'unknown',
            customerName: custName,
            sampleIndex: sampleIndex,
            
            status: (cols[2] as SampleStatus) || 'Requested',
            isTestFinished: (cols[3] || '').toLowerCase() === 'yes' || (cols[3] || '').toLowerCase() === 'true',
            crystalType: (cols[4] as CrystalType) || 'Polycrystalline',
            productCategory: cols[5] ? cols[5].split(',').map(c => c.trim() as ProductCategory) : [],
            productForm: (cols[6] as ProductForm) || 'Powder',
            originalSize: cols[7] || '',
            processedSize: cols[8] || '',
            isGraded: (cols[9] as GradingStatus) || 'Graded',
            sampleSKU: cols[10] || '',
            labelHyperlink: cols[11] || '',
            sampleDetails: cols[12] || '', // Mapping Details to sampleDetails
            quantity: cols[13] || '',
            application: cols[14] || '',
            lastStatusDate: normalizeDate(cols[15]) || new Date().toISOString().split('T')[0],
            // Col 16 is Days Since (Ignored)
            statusDetails: statusDetails,
            trackingNumber: cols[18] || '',
            
            sampleName: generatedName, // Core field for UI
            
            // Legacy/Mapping
            productType: generatedName,
            specs: cols[7] ? `${cols[7]} -> ${cols[8]}` : '',
            requestDate: new Date().toISOString().split('T')[0],
          } as Sample;
        }
      });

      setParsedPreview(parsed);
      setImportStatus({ 
        type: 'info', 
        message: `Previewing ${parsed.length} rows. Please review below and click "Confirm Import".` 
      });
    } catch (e) {
      console.error(e);
      setImportStatus({ type: 'error', message: 'Failed to parse data. Please check column format.' });
    }
  };

  const confirmImport = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;
    
    if (activeTab === 'customers') {
      onImportCustomers(parsedPreview as Customer[]);
    } else {
      // Upsert Logic for Samples: Merge based on CustomerID + SampleIndex
      // Handled by onImportSamples or upstream in a real app, 
      // here passing raw parsed list for App.tsx to handle (or simple append in this demo context)
      onImportSamples(parsedPreview as Sample[]);
    }

    setImportStatus({ type: 'success', message: `Successfully imported ${parsedPreview.length} records!` });
    setParsedPreview(null);
    setImportData('');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('dataManagement')}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t('bulkImport')} / {t('export')}</p>
        </div>
        <Button variant="danger" className="flex items-center gap-2" onClick={() => setIsClearModalOpen(true)}>
           <Trash2 size={16} /> Clear Database
        </Button>
      </div>

      {/* IMPORT SECTION */}
      <Card className="p-0 border-l-0 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
           <button 
             onClick={() => { setActiveTab('customers'); clearPreview(); setImportData(''); }}
             className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'customers' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-t-4 border-t-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             <Users size={20} /> Import Customers
           </button>
           <button 
             onClick={() => { setActiveTab('samples'); clearPreview(); setImportData(''); }}
             className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'samples' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-t-4 border-t-amber-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             <FlaskConical size={20} /> Import Samples
           </button>
        </div>

        <div className="p-6">
          <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
             <div className="flex justify-between items-start">
               <div>
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                    <AlertCircle size={16} className="text-blue-500" /> Instructions & Required Columns (Tab Separated)
                  </h4>
                  <p className="font-mono text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                    {activeTab === 'customers' 
                      ? "1.客户 | 2.地区 | 3.展会 | 4.官网(Ignore) | 5.等级 | 6.产品总结 | 7.更新日期 | 8.Ignore | 9.对接人员 | 10.状态 | 11.下一步 | 12.关键日期 | 13.Ignore | 14.流程总结 | 15.对方回复 | 16.Ignore | 17.我方跟进 | 18.Ignore | 19.文档 | 20.联系方式"
                      : "1.Customer | 2.Index | 3.Status | 4.Finished(Yes/No) | 5.Crystal | 6.Category | 7.Form | 8.OrigSize | 9.ProcSize | 10.Graded | 11.SKU | 12.LabelLink | 13.Details | 14.Qty | 15.App | 16.Date | 17.DaysSince(Ignore) | 18.History | 19.Tracking"
                    }
                  </p>
                  <p className="mt-2 text-xs text-slate-500 italic">
                    Samples Note: Use 'Customer Name' + 'Sample Index' to update existing records.<br/>
                    Status Details (History): Use "|||" to separate history entries. Use "【YYYY-MM-DD】" at start of entry for date parsing.
                  </p>
               </div>
               
               <div className="flex gap-2">
                 {!parsedPreview ? (
                   <div className="flex gap-2">
                    {activeTab === 'customers' ? (
                       <Button onClick={handleExportCustomers} variant="secondary" className="flex items-center gap-2"><Download size={14}/> Export CSV</Button>
                    ) : (
                       <Button onClick={handleExportSamples} variant="secondary" className="flex items-center gap-2"><Download size={14}/> Export CSV</Button>
                    )}
                     <Button onClick={parsePasteData} className={activeTab === 'customers' ? 'bg-blue-600' : 'bg-amber-600 hover:bg-amber-700'}>
                       {t('parseImport')} (Preview)
                     </Button>
                   </div>
                 ) : (
                   <>
                     <Button onClick={clearPreview} variant="secondary">Cancel</Button>
                     <Button onClick={confirmImport} className="bg-emerald-600 hover:bg-emerald-700 text-white flex gap-2">
                       <CheckCircle2 size={16} /> Confirm Import ({parsedPreview.length})
                     </Button>
                   </>
                 )}
               </div>
             </div>
             
             {importStatus && (
                <div className={`mt-3 pt-3 border-t border-blue-200 dark:border-blue-800/50 flex items-center gap-2 text-sm font-medium ${
                  importStatus.type === 'success' ? 'text-emerald-600' : importStatus.type === 'error' ? 'text-red-600' : 'text-blue-600'
                }`}>
                   {importStatus.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                   {importStatus.message}
                </div>
             )}
          </div>
          
          {!parsedPreview && (
            <textarea 
              className="w-full h-64 border border-slate-300 dark:border-slate-700 rounded-lg p-3 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              placeholder={`Paste ${activeTab === 'customers' ? 'Customer' : 'Sample'} Excel data here...`}
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
            />
          )}

          {parsedPreview && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
               <div className="bg-slate-100 dark:bg-slate-800 p-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700">
                 Data Preview
               </div>
               <div className="max-h-[500px] overflow-auto">
                 <table className="w-full text-left text-xs">
                   <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold sticky top-0 z-10">
                     <tr className="border-b border-slate-200 dark:border-slate-700">
                       {activeTab === 'customers' ? (
                         <>
                           <th className="p-3 whitespace-nowrap">Name</th>
                           <th className="p-3 whitespace-nowrap">Region</th>
                           <th className="p-3 whitespace-nowrap">Status</th>
                           <th className="p-3 whitespace-nowrap">Last Update</th>
                         </>
                       ) : (
                         <>
                           <th className="p-3 whitespace-nowrap">Customer</th>
                           <th className="p-3 whitespace-nowrap">Idx</th>
                           <th className="p-3 whitespace-nowrap">Category</th>
                           <th className="p-3 whitespace-nowrap">Details</th>
                           <th className="p-3 whitespace-nowrap">Status</th>
                           <th className="p-3 whitespace-nowrap">Date</th>
                         </>
                       )}
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {parsedPreview.map((row, idx) => (
                       <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                         {activeTab === 'customers' ? (
                           <>
                             <td className="p-3 font-medium align-top">{row.name}</td>
                             <td className="p-3 align-top">{Array.isArray(row.region) ? row.region.join(', ') : row.region}</td>
                             <td className="p-3 align-top"><Badge color="blue">{row.followUpStatus}</Badge></td>
                             <td className="p-3 align-top">{row.lastStatusUpdate}</td>
                           </>
                         ) : (
                           <>
                             <td className="p-3 font-medium align-top">{row.customerName}</td>
                             <td className="p-3 align-top">{row.sampleIndex}</td>
                             <td className="p-3 align-top">{row.productCategory?.join(', ')}</td>
                             <td className="p-3 align-top truncate max-w-[200px]">{row.sampleDetails}</td>
                             <td className="p-3 align-top"><Badge color="blue">{row.status}</Badge></td>
                             <td className="p-3 align-top">{row.lastStatusDate}</td>
                           </>
                         )}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>
      </Card>
      
      <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Clear Database">
        <div className="space-y-4">
           <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-800 dark:text-red-200">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-bold">Warning: Irreversible Action</h4>
                <p className="text-sm mt-1">This will permanently delete all customers, samples, and interaction records. This cannot be undone.</p>
              </div>
           </div>
           <p className="text-slate-700 dark:text-slate-300">Are you sure you want to completely wipe the database?</p>
           <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => { clearDatabase(); setIsClearModalOpen(false); }}>Yes, Clear Everything</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataManagement;
