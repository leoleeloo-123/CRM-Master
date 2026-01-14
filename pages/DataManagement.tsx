import React, { useState, useRef } from 'react';
import { Customer, Sample, Rank, SampleStatus, CustomerStatus, FollowUpStatus, ProductCategory, ProductForm, Interaction, CrystalType, GradingStatus, TestStatus, SampleDocLink, Exhibition } from '../types';
import { Card, Button, Badge, Modal, RankStars } from '../components/Common';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, Users, FlaskConical, Search, X, Trash2, RefreshCcw, FileSpreadsheet, Eye, ClipboardList, Presentation } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
// Fixed: Added 'format' to imports from date-fns
import { differenceInDays, isValid, format } from 'date-fns';
import * as XLSX from 'xlsx';
import { getCanonicalTag } from '../utils/i18n';

interface DataManagementProps {
  onImportCustomers: (newCustomers: Customer[], override?: boolean) => void;
  onImportSamples: (newSamples: Sample[], override?: boolean) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
  onImportCustomers, 
  onImportSamples
}) => {
  const { t, clearDatabase, customers, samples, exhibitions, setExhibitions, syncSampleToCatalog, companyName, userName, refreshTagsFromSamples } = useApp();
  const [activeTab, setActiveTab] = useState<'customers' | 'samples' | 'exhibitions'>('customers');
  const [viewMode, setViewMode] = useState<'import' | 'review'>('import');
  
  // Text Import State
  const [importData, setImportData] = useState('');
  
  // Excel Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelPreview, setExcelPreview] = useState<{ customers: Customer[], samples: Sample[], exhibitions: Exhibition[] } | null>(null);

  // Common Preview State (Points to either text result or excel result)
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);
  
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('replace');

  // --- HELPERS ---

  const splitByDelimiter = (str: string | undefined): string[] => {
    if (!str) return [];
    return String(str).split('|||').map(s => s.trim()).filter(s => s.length > 0);
  };

  const normalizeDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const trimmed = String(dateStr).trim();
    if (!trimmed) return '';
    
    // Try to extract date from 【YYYY-MM-DD】 format
    const bracketMatch = trimmed.match(/【(.*?)】/);
    if (bracketMatch) {
       return normalizeDate(bracketMatch[1]);
    }

    // Excel dates are sometimes numbers
    if (!isNaN(Number(trimmed)) && Number(trimmed) > 20000) {
        // Simple Excel serial date conversion
        const date = new Date(Math.round((Number(trimmed) - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    }

    const yearFirstMatch = trimmed.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
    if (yearFirstMatch) return `${yearFirstMatch[1]}-${yearFirstMatch[2].padStart(2, '0')}-${yearFirstMatch[3].padStart(2, '0')}`;
    
    const yearLastMatch = trimmed.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
    if (yearLastMatch) return `${yearLastMatch[3]}-${yearLastMatch[1].padStart(2, '0')}-${yearLastMatch[2].padStart(2, '0')}`;
    
    const yearFirstSlash = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (yearFirstSlash) return `${yearFirstSlash[1]}-${yearFirstSlash[2].padStart(2, '0')}-${yearFirstSlash[3].padStart(2, '0')}`;

    const dateObj = new Date(trimmed);
    if (!isNaN(dateObj.getTime())) {
      const y = dateObj.getFullYear();
      const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const d = dateObj.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    return trimmed;
  };

  const mapStatusFromImport = (status: string): FollowUpStatus => {
    const s = status ? String(status).trim() : '';
    if (s === '我方跟进' || s === 'My Turn') return 'My Turn';
    if (s === '等待对方' || s === 'Waiting for Customer') return 'Waiting for Customer';
    if (s === '暂无' || s === 'No Action') return 'No Action';
    return 'No Action'; 
  };

  const mapStatusToExport = (status: string | undefined): string => {
    return status || 'No Action';
  };

  // --- PARSING LOGIC ---

  const rowToCustomer = (cols: any[], tempIdPrefix: string): Customer => {
    const safeCol = (i: number) => cols[i] !== undefined && cols[i] !== null ? String(cols[i]).trim() : '';
    
    const name = safeCol(0) || 'Unknown';
    const regions = splitByDelimiter(safeCol(1));
    const finalRegions = regions.length > 0 ? regions : ['Unknown'];
    const cleanTags = splitByDelimiter(safeCol(2)); // Respect user's original tag format
    
    const rank = (parseInt(safeCol(4)) || 3) as Rank;
    const productSummary = (safeCol(5) || '').replace(/\|\|\|/g, '\n');
    const lastStatusUpdate = normalizeDate(safeCol(6));
    const followUpStatus = mapStatusFromImport(safeCol(9));
    const upcomingPlan = safeCol(10) || ''; // 下一步 column
    const nextActionDate = normalizeDate(safeCol(11)); // 关键日期 column
    const lastCustomerReplyDate = normalizeDate(safeCol(14));
    const lastMyReplyDate = normalizeDate(safeCol(16));
    
    // Parse Links - handle modern format (Titles at 20, URLs at 21) if available, otherwise legacy at 18
    const titles = splitByDelimiter(safeCol(20));
    const urls = splitByDelimiter(safeCol(21));
    let docLinks: SampleDocLink[] = [];
    
    if (urls.length > 0) {
      docLinks = titles.map((t, idx) => ({ title: t || `Link ${idx + 1}`, url: urls[idx] || '#' }));
    } else {
      // Fallback to legacy string array column if modern ones are empty
      const legacyLinks = splitByDelimiter(safeCol(18));
      docLinks = legacyLinks.map((entry, idx) => {
        if (entry.includes(': ')) {
          const [t, u] = entry.split(': ');
          return { title: t, url: u };
        }
        return { title: `Link ${idx + 1}`, url: entry };
      });
    }

    const contactNames = splitByDelimiter(safeCol(8));
    const contactInfos = splitByDelimiter(safeCol(19));
    
    const contacts = contactNames.map((cName, i) => {
       const info = contactInfos[i] || '';
       const isEmail = info.includes('@');
       
       let cleanName = cName.trim();
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

    const rawInteractions = splitByDelimiter(safeCol(13));
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
         id: `int_${tempIdPrefix}_${i}`,
         date: date,
         summary: summary,
         tags: []
       };
    }).reverse();

    return {
      id: `new_c_${tempIdPrefix}`,
      name: name,
      region: finalRegions,
      tags: cleanTags,
      rank: rank,
      productSummary: productSummary,
      lastStatusUpdate: lastStatusUpdate,
      followUpStatus: followUpStatus,
      nextActionDate: nextActionDate,
      upcomingPlan: upcomingPlan, 
      lastCustomerReplyDate: lastCustomerReplyDate,
      lastMyReplyDate: lastMyReplyDate,
      lastContactDate: lastMyReplyDate,
      contacts: contacts,
      docLinks: docLinks,
      status: 'Active' as CustomerStatus,
      interactions: interactions
    } as Customer;
  };

  const rowToSample = (cols: any[], tempIdPrefix: string, indexMap: Map<string, number>, lookupCustomers: Customer[]): Sample => {
    const safeCol = (i: number) => cols[i] !== undefined && cols[i] !== null ? String(cols[i]).trim() : '';

    const custName = safeCol(0) || 'Unknown';
    const matchedCustomer = lookupCustomers.find(c => c.name.toLowerCase() === custName.toLowerCase());
    
    const lowerCustName = custName.toLowerCase();
    let nextIndex = (indexMap.get(lowerCustName) || 0) + 1;
    indexMap.set(lowerCustName, nextIndex);
    
    const statusDetails = safeCol(15) || '';

    const status = getCanonicalTag(safeCol(1)) as SampleStatus || 'Requested';
    const crystal = getCanonicalTag(safeCol(3)) || '';
    const form = getCanonicalTag(safeCol(5)) || 'Powder';
    const categories = safeCol(4) ? safeCol(4).split(',').map(c => getCanonicalTag(c.trim()) as ProductCategory) : [];
    
    const categoryStr = categories.join(', ');

    const origSize = safeCol(6) || '';
    const procSize = safeCol(7) ? ` > ${safeCol(7)}` : '';
    
    const generatedName = `${crystal} ${categoryStr} ${form} - ${origSize}${procSize}`.trim();
    
    // Improved Test Status Parsing
    const testFinishedColVal = (safeCol(2) || '').trim().toLowerCase();
    let testStatus: TestStatus = 'Ongoing';
    
    // Check for "Finished" variants
    if (['yes', 'finished', '测试完成', 'true', '1', '是', '完成'].includes(testFinishedColVal)) {
      testStatus = 'Finished';
    } else if (['terminated', '终止', '项目终止', '放弃', 'canceled'].includes(testFinishedColVal)) {
      testStatus = 'Terminated';
    } else {
      testStatus = 'Ongoing'; 
    }

    const nextStep = safeCol(17) || '';
    // Use Key Date if provided, else default to today
    const keyDate = normalizeDate(safeCol(18)) || new Date().toISOString().split('T')[0];
    
    // New Named Link Parsing (Col 20 for Titles, Col 21 for URLs if present, otherwise fallback to Col 20)
    const titles = splitByDelimiter(safeCol(19));
    const urls = splitByDelimiter(safeCol(20));
    
    let docLinks: SampleDocLink[] = [];
    if (urls.length > 0) {
      // Modern format: 2 separate columns
      docLinks = titles.map((t, idx) => ({
        title: t || `Link ${idx + 1}`,
        url: urls[idx] || '#'
      }));
    } else {
      // Legacy or fallback: parse Titles column for combined info "Title: URL" or just URL
      docLinks = titles.map((entry, idx) => {
        if (entry.includes(': ')) {
          const [t, u] = entry.split(': ');
          return { title: t, url: u };
        }
        return { title: `Link ${idx + 1}`, url: entry };
      });
    }

    return {
      id: `new_s_${tempIdPrefix}`,
      customerId: matchedCustomer ? matchedCustomer.id : 'unknown',
      customerName: custName,
      sampleIndex: nextIndex,
      
      status: status,
      testStatus: testStatus,
      crystalType: crystal as CrystalType,
      productCategory: categories,
      productForm: form as ProductForm,
      originalSize: safeCol(6) || '',
      processedSize: safeCol(7) || '',
      isGraded: (safeCol(8) as GradingStatus) || 'Graded',
      sampleSKU: safeCol(9) || '',
      sampleDetails: safeCol(10) || '',
      
      quantity: safeCol(11) || '',
      application: safeCol(12) || '',
      lastStatusDate: normalizeDate(safeCol(13)) || new Date().toISOString().split('T')[0],
      statusDetails: statusDetails,
      trackingNumber: safeCol(16) || '',
      
      sampleName: generatedName,
      productType: generatedName,
      specs: safeCol(6) ? `${safeCol(6)} -> ${safeCol(7)}` : '',
      requestDate: new Date().toISOString().split('T')[0],

      upcomingPlan: nextStep,
      nextActionDate: keyDate,
      docLinks: docLinks
    } as Sample;
  };

  const rowToExhibition = (cols: any[], tempIdPrefix: string): Exhibition => {
    const safeCol = (i: number) => cols[i] !== undefined && cols[i] !== null ? String(cols[i]).trim() : '';
    // Support series tag parsing if added manually via Excel or text
    const seriesRaw = safeCol(4);
    const series = seriesRaw ? seriesRaw.split('|||').map(s => s.trim()) : [];
    return {
      id: `new_ex_${tempIdPrefix}`,
      name: safeCol(0) || 'Unnamed Event',
      date: normalizeDate(safeCol(1)) || format(new Date(), 'yyyy-MM-dd'),
      location: safeCol(2) || 'TBD',
      link: safeCol(3) || '#',
      eventSeries: series,
      summary: safeCol(5) || ''
    };
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // 1. Customers Tab
    const custHeaders = [
      "客户", "地区", "展会", "展会官网", "等级", "状态与产品总结", "状态更新", "未更新", 
      "对接人员", "状态", "下一步", "关键日期", "DDL", "对接流程总结", "对方回复", 
      "未回复", "我方跟进", "未跟进", "文档超链接", "联系方式", "File Link Titles", "File link URLs"
    ];
    
    const custRows = customers.map(c => {
      const tags = c.tags.join(' ||| ');
      const regions = Array.isArray(c.region) ? c.region.join(' ||| ') : c.region;
      
      const contactNames = c.contacts.map((contact) => {
        let str = contact.name;
        if (contact.title) str += ` (${contact.title})`;
        if (contact.isPrimary) str += ` 【主要联系人】`;
        return str;
      }).join(' ||| ');

      const contactInfos = c.contacts.map(contact => contact.email || contact.phone || '').join(' ||| ');
      const interactionText = [...c.interactions].reverse().map(i => `【${i.date}】 ${i.summary}`).join(' ||| ');
      const nextStep = c.upcomingPlan || '';
      
      // Document links column (legacy)
      const legacyDocLinks = c.docLinks ? c.docLinks.map(l => `${l.title}: ${l.url}`).join(' ||| ') : '';
      
      const productSummaryExport = (c.productSummary || '').replace(/\n/g, ' ||| ');
      const statusExport = mapStatusToExport(c.followUpStatus);

      // Modern link columns
      const fileLinkTitlesStr = (c.docLinks || []).map(l => l.title).join(' ||| ');
      const fileLinkUrlsStr = (c.docLinks || []).map(l => l.url).join(' ||| ');

      return [
        c.name, regions, tags, "", c.rank, productSummaryExport, c.lastStatusUpdate, "", contactNames,
        statusExport, nextStep, c.nextActionDate, "", interactionText, c.lastCustomerReplyDate, "",
        c.lastMyReplyDate, "", legacyDocLinks, contactInfos, fileLinkTitlesStr, fileLinkUrlsStr
      ];
    });

    const custSheet = XLSX.utils.aoa_to_sheet([custHeaders, ...custRows]);
    XLSX.utils.book_append_sheet(wb, custSheet, "Customers");

    // 2. Samples Tab
    const sampHeaders = [
      "1.Customer", "2.Status", "3.Test Finished", "4.Crystal Type", "5.Sample Category", 
      "6.Form", "7.Original Size", "8.Processed Size", "9.Is Graded", "10.Sample SKU", 
      "11.Details", "12.Quantity", "13.Customer Application", "14.Status Date", 
      "15.Days Since Update", "16.Status Details", "17.Tracking #", "18.Next Step", "19.Key Date", "20.File Link Titles", "21.File Link URLs"
    ];

    const sampRows = samples.map(s => {
       const safeDetails = (s.statusDetails || '').replace(/\n/g, ' ||| ');
       let daysSince = "";
       if (s.lastStatusDate && isValid(new Date(s.lastStatusDate))) {
         daysSince = String(differenceInDays(new Date(), new Date(s.lastStatusDate)));
       }
       
       let exportTestVal = "No";
       if (s.testStatus === 'Finished') exportTestVal = "Yes";
       else if (s.testStatus === 'Terminated') exportTestVal = "Terminated";

       const docLinkTitlesStr = (s.docLinks || []).map(l => l.title).join(' ||| ');
       const docLinkUrlsStr = (s.docLinks || []).map(l => l.url).join(' ||| ');

       return [
         s.customerName,
         s.status,
         exportTestVal,
         s.crystalType,
         s.productCategory?.join(', '),
         s.productForm,
         s.originalSize,
         s.processedSize,
         s.isGraded,
         s.sampleSKU,
         s.sampleDetails,
         s.quantity,
         s.application,
         s.lastStatusDate,
         daysSince,
         safeDetails,
         s.trackingNumber,
         s.upcomingPlan || '',
         s.nextActionDate || '',
         docLinkTitlesStr,
         docLinkUrlsStr
       ];
    });

    const sampSheet = XLSX.utils.aoa_to_sheet([sampHeaders, ...sampRows]);
    XLSX.utils.book_append_sheet(wb, sampSheet, "Samples");

    // 3. Exhibitions Tab (Enhanced with Event Series and Summary)
    const exhHeaders = ["Name", "Date", "Location", "Link", "Event Series", "Summary"];
    const exhRows = exhibitions.map(e => [
      e.name, 
      e.date, 
      e.location, 
      e.link, 
      (e.eventSeries || []).join(' ||| '),
      e.summary || ''
    ]);
    const exhSheet = XLSX.utils.aoa_to_sheet([exhHeaders, ...exhRows]);
    XLSX.utils.book_append_sheet(wb, exhSheet, "Exhibitions");

    const now = new Date();
    const etDate = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    
    const year = etDate.getFullYear();
    const month = String(etDate.getMonth() + 1).padStart(2, '0');
    const day = String(etDate.getDate()).padStart(2, '0');
    const hour = String(etDate.getHours()).padStart(2, '0');
    const minute = String(etDate.getMinutes()).padStart(2, '0');

    const timestamp = `${year}${month}${day}_${hour}${minute}`;
    const safeOrg = companyName.replace(/[^a-z0-9]/gi, '_');
    const safeUser = userName.replace(/[^a-z0-9]/gi, '_');
    
    const fileName = `Master TB_${safeOrg}_${safeUser}_${timestamp}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  const clearPreview = () => {
    setParsedPreview(null);
    setExcelPreview(null);
    setImportStatus(null);
    setImportData('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const parsePasteData = () => {
    if (!importData.trim()) {
      setImportStatus({ type: 'error', message: 'Please paste data into the text area.' });
      return;
    }

    try {
      const rows = importData.trim().split('\n').filter(r => r.trim() !== '');
      const parsed = rows.map((row) => {
        const cols = row.split('\t').map(c => c.trim());
        const tempId = Math.random().toString(36).substr(2, 9);

        if (activeTab === 'customers') {
          return rowToCustomer(cols, tempId);
        } else if (activeTab === 'samples') {
          const indexMap = new Map<string, number>(); 
          if (importMode === 'merge') {
              samples.forEach(s => {
                 const lowerName = s.customerName.toLowerCase();
                 const currentMax = indexMap.get(lowerName) || 0;
                 if (s.sampleIndex > currentMax) indexMap.set(lowerName, s.sampleIndex);
              });
          }
          return rowToSample(cols, tempId, indexMap, customers);
        } else {
          return rowToExhibition(cols, tempId);
        }
      });

      setParsedPreview(parsed);
      setImportStatus({ type: 'info', message: `Previewing ${parsed.length} rows.` });

    } catch (e) {
      console.error(e);
      setImportStatus({ type: 'error', message: 'Failed to parse text data.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        let parsedCustomers: Customer[] = [];
        if (wb.Sheets['Customers']) {
           const rawRows = XLSX.utils.sheet_to_json(wb.Sheets['Customers'], { header: 1 });
           parsedCustomers = rawRows.slice(1).filter((r: any) => r.length > 0).map((row: any) => 
             rowToCustomer(row, Math.random().toString(36).substr(2, 9))
           );
        }

        const lookupCustomers = [...parsedCustomers, ...customers];

        let parsedSamples: Sample[] = [];
        if (wb.Sheets['Samples']) {
           const rawRows = XLSX.utils.sheet_to_json(wb.Sheets['Samples'], { header: 1 });
           const indexMap = new Map<string, number>();
           
           if (importMode === 'merge') {
              samples.forEach(s => {
                 const lowerName = s.customerName.toLowerCase();
                 const currentMax = indexMap.get(lowerName) || 0;
                 if (s.sampleIndex > currentMax) indexMap.set(lowerName, s.sampleIndex);
              });
           }

           parsedSamples = rawRows.slice(1).filter((r: any) => r.length > 0).map((row: any) => 
             rowToSample(row, Math.random().toString(36).substr(2, 9), indexMap, lookupCustomers)
           );
        }

        let parsedExhibitions: Exhibition[] = [];
        if (wb.Sheets['Exhibitions']) {
           const rawRows = XLSX.utils.sheet_to_json(wb.Sheets['Exhibitions'], { header: 1 });
           parsedExhibitions = rawRows.slice(1).filter((r: any) => r.length > 0).map((row: any) => 
             rowToExhibition(row, Math.random().toString(36).substr(2, 9))
           );
        }

        if (parsedCustomers.length === 0 && parsedSamples.length === 0 && parsedExhibitions.length === 0) {
           setImportStatus({ type: 'error', message: 'No valid data found in sheets.' });
           return;
        }

        setExcelPreview({ customers: parsedCustomers, samples: parsedSamples, exhibitions: parsedExhibitions });
        
        if (activeTab === 'customers' && parsedCustomers.length > 0) {
            setParsedPreview(parsedCustomers);
        } else if (activeTab === 'samples' && parsedSamples.length > 0) {
            setParsedPreview(parsedSamples);
        } else if (activeTab === 'exhibitions' && parsedExhibitions.length > 0) {
            setParsedPreview(parsedExhibitions);
        } else {
            setParsedPreview(parsedCustomers);
        }

        setImportStatus({ 
          type: 'info', 
          message: `File Loaded. Found: ${parsedCustomers.length} Customers, ${parsedSamples.length} Samples, ${parsedExhibitions.length} Events.` 
        });

      } catch (err) {
        console.error(err);
        setImportStatus({ type: 'error', message: 'Failed to read Excel file.' });
      }
    };
    reader.readAsBinaryString(file);
  };

  const confirmImport = () => {
    const override = importMode === 'replace';
    let importedSamples: Sample[] = [];

    if (excelPreview) {
       if (excelPreview.customers.length > 0) {
         onImportCustomers(excelPreview.customers, override);
       }
       if (excelPreview.samples.length > 0) {
         importedSamples = excelPreview.samples;
         importedSamples.forEach(s => syncSampleToCatalog(s));
         onImportSamples(importedSamples, override);
       }
       if (excelPreview.exhibitions.length > 0) {
         setExhibitions(prev => override ? excelPreview.exhibitions : [...prev, ...excelPreview.exhibitions]);
       }
       setImportStatus({ type: 'success', message: 'Excel import complete.' });
    } else if (parsedPreview) {
       if (activeTab === 'customers') {
         onImportCustomers(parsedPreview as Customer[], override);
       } else if (activeTab === 'samples') {
         importedSamples = parsedPreview as Sample[];
         importedSamples.forEach(x => syncSampleToCatalog(x));
         onImportSamples(importedSamples, override);
       } else if (activeTab === 'exhibitions') {
         setExhibitions(prev => override ? (parsedPreview as Exhibition[]) : [...prev, ...parsedPreview as Exhibition[]]);
       }
       setImportStatus({ type: 'success', message: `Imported ${parsedPreview.length} records.` });
    }
    
    if (importedSamples.length > 0) {
        refreshTagsFromSamples(importedSamples, override);
    }
    
    setParsedPreview(null);
    setExcelPreview(null);
    setImportData('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const switchTab = (tab: 'customers' | 'samples' | 'exhibitions') => {
    setActiveTab(tab);
    if (viewMode === 'import') {
      setParsedPreview(null);
      if (excelPreview) {
        if (tab === 'customers') setParsedPreview(excelPreview.customers);
        else if (tab === 'samples') setParsedPreview(excelPreview.samples);
        else setParsedPreview(excelPreview.exhibitions);
      } else {
        setImportData('');
      }
    }
  };

  const toggleReviewMode = () => {
    if (viewMode === 'import') {
      setViewMode('review');
      setImportStatus(null);
      setParsedPreview(null);
      setExcelPreview(null);
    } else {
      setViewMode('import');
    }
  };

  const renderCurrentDataTable = () => {
    const data = activeTab === 'customers' ? customers : activeTab === 'samples' ? samples : exhibitions;
    
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="bg-slate-100 dark:bg-slate-800 p-3 text-xs font-black text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <span>Live Database Review: {activeTab.toUpperCase()} ({data.length})</span>
          <Button variant="ghost" size="sm" onClick={() => setViewMode('import')} className="text-[10px] h-6 py-0 px-2 bg-slate-200 dark:bg-slate-700">Back to Import</Button>
        </div>
        <div className="max-h-[600px] overflow-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold sticky top-0 z-10">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                {activeTab === 'customers' ? (
                  <>
                    <th className="p-3 whitespace-nowrap">Name</th>
                    <th className="p-3 whitespace-nowrap">Rank</th>
                    <th className="p-3 whitespace-nowrap">Region</th>
                    <th className="p-3 whitespace-nowrap">Summary</th>
                    <th className="p-3 whitespace-nowrap">Status</th>
                    <th className="p-3 whitespace-nowrap">Next Step</th>
                    <th className="p-3 whitespace-nowrap">Contacts</th>
                    <th className="p-3 whitespace-nowrap">Last Update</th>
                  </>
                ) : activeTab === 'samples' ? (
                  <>
                    <th className="p-3 whitespace-nowrap">Customer</th>
                    <th className="p-3 whitespace-nowrap">Idx</th>
                    <th className="p-3 whitespace-nowrap">Generated Name</th>
                    <th className="p-3 whitespace-nowrap">Specs (Cry/Form/Size)</th>
                    <th className="p-3 whitespace-nowrap">Qty</th>
                    <th className="p-3 whitespace-nowrap">Status</th>
                    <th className="p-3 whitespace-nowrap">Test Finished</th>
                    <th className="p-3 whitespace-nowrap">Date</th>
                    <th className="p-3 whitespace-nowrap">Next Step</th>
                    <th className="p-3 whitespace-nowrap">Key Date</th>
                    <th className="p-3 whitespace-nowrap">History</th>
                  </>
                ) : (
                  <>
                    <th className="p-3">Name</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Location</th>
                    <th className="p-3">Link</th>
                    <th className="p-3">Series</th>
                    <th className="p-3">Summary</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data.map((row: any, idx) => (
                <tr key={row.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  {activeTab === 'customers' ? (
                    <>
                      <td className="p-3 font-medium align-top">{row.name}</td>
                      <td className="p-3 align-top"><RankStars rank={row.rank} /></td>
                      <td className="p-3 align-top">{Array.isArray(row.region) ? row.region.join(', ') : row.region}</td>
                      <td className="p-3 align-top truncate max-w-[200px]" title={row.productSummary}>{row.productSummary}</td>
                      <td className="p-3 align-top"><Badge color="blue">{row.followUpStatus || row.status}</Badge></td>
                      <td className="p-3 align-top truncate max-w-[150px]" title={row.upcomingPlan}>{row.upcomingPlan || '-'}</td>
                      <td className="p-3 align-top truncate max-w-[150px]" title={row.contacts?.map((c:any) => c.name).join(', ')}>
                        {row.contacts?.map((c:any) => c.name).join(', ')}
                      </td>
                      <td className="p-3 align-top">{row.lastStatusUpdate}</td>
                    </>
                  ) : activeTab === 'samples' ? (
                    <>
                      <td className="p-3 font-medium align-top">{row.customerName}</td>
                      <td className="p-3 align-top">{row.sampleIndex}</td>
                      <td className="p-3 align-top font-bold text-blue-600 dark:text-blue-400 max-w-[200px] truncate" title={row.sampleName}>{row.sampleName}</td>
                      <td className="p-3 align-top text-[10px] whitespace-nowrap">
                        <div>{row.crystalType} / {row.productForm}</div>
                        <div>{row.originalSize} -&gt; {row.processedSize}</div>
                      </td>
                      <td className="p-3 align-top">{row.quantity}</td>
                      <td className="p-3 align-top"><Badge color="blue">{row.status}</Badge></td>
                      <td className="p-3 align-top">
                        <Badge color={row.testStatus === 'Finished' ? 'green' : row.testStatus === 'Terminated' ? 'red' : 'yellow'}>
                          {row.testStatus}
                        </Badge>
                      </td>
                      <td className="p-3 align-top">{row.lastStatusDate}</td>
                      <td className="p-3 align-top truncate max-w-[150px]" title={row.upcomingPlan}>{row.upcomingPlan || '-'}</td>
                      <td className="p-3 align-top whitespace-nowrap">{row.nextActionDate || '-'}</td>
                      <td className="p-3 align-top truncate max-w-[150px]" title={row.statusDetails}>{row.statusDetails}</td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 font-bold">{row.name}</td>
                      <td className="p-3">{row.date}</td>
                      <td className="p-3">{row.location}</td>
                      <td className="p-3 truncate max-w-[200px] text-blue-600 underline">{row.link}</td>
                      <td className="p-3">{row.eventSeries?.join(', ')}</td>
                      <td className="p-3 truncate max-w-[200px]" title={row.summary}>{row.summary}</td>
                    </>
                  )}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={12} className="p-10 text-center text-slate-400 italic font-bold">No data found in database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl xl:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{t('dataManagement')}</h2>
          <p className="text-sm xl:text-base font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">{t('dataManagementDesc')}</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" onClick={toggleReviewMode} className={`flex items-center gap-2 ${viewMode === 'review' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : ''}`}>
              {viewMode === 'review' ? <ClipboardList size={16} /> : <Eye size={16} />}
              {viewMode === 'review' ? 'Import Data' : 'Review Data'}
           </Button>

           <input 
              type="file" 
              accept=".xlsx, .xls" 
              ref={fileInputRef} 
              onChange={handleFileUpload}
              className="hidden"
           />
           <Button onClick={() => { setViewMode('import'); fileInputRef.current?.click(); }} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
              <Upload size={16} /> Upload Excel
           </Button>

           <Button variant="secondary" onClick={handleExportExcel} className="flex items-center gap-2 border-emerald-600 text-emerald-700 hover:bg-emerald-50">
              <FileSpreadsheet size={16} /> Export Excel
           </Button>
           <Button variant="danger" className="flex items-center gap-2" onClick={() => setIsClearModalOpen(true)}>
             <Trash2 size={16} /> Clear DB
           </Button>
        </div>
      </div>

      <Card className="p-0 border-l-0 overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
           <button 
             onClick={() => switchTab('customers')}
             className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'customers' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-t-4 border-t-blue-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             <Users size={20} /> 
             {viewMode === 'review' ? 'Review Customers' : `Import Customers ${excelPreview ? `(${excelPreview.customers.length})` : ''}`}
           </button>
           <button 
             onClick={() => switchTab('samples')}
             className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'samples' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border-t-4 border-t-amber-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             <FlaskConical size={20} /> 
             {viewMode === 'review' ? 'Review Samples' : `Import Samples ${excelPreview ? `(${excelPreview.samples.length})` : ''}`}
           </button>
           <button 
             onClick={() => switchTab('exhibitions')}
             className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold transition-colors ${activeTab === 'exhibitions' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-t-4 border-t-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
           >
             <Presentation size={20} /> 
             {viewMode === 'review' ? 'Review Exhibitions' : `Import Exhibitions ${excelPreview ? `(${excelPreview.exhibitions.length})` : ''}`}
           </button>
        </div>

        <div className="p-6">
          {viewMode === 'review' ? (
            renderCurrentDataTable()
          ) : (
            <>
              <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                 <div className="flex justify-between items-start">
                   <div>
                      <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                        <AlertCircle size={16} className="text-blue-500" /> Instructions & Required Columns
                      </h4>
                      <p className="font-mono text-xs text-slate-600 dark:text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                        {activeTab === 'customers' 
                          ? "1.客户 | 2.地区 | 3.展会 | 4.官网(Ignore) | 5.等级 | 6.产品总结 | 7.更新日期 | 8.Ignore | 9.对接人员 | 10.状态 | 11.下一步 | 12.关键日期 | 13.Ignore | 14.流程总结 | 15.对方回复 | 16.Ignore | 17.我方跟进 | 18.Ignore | 19.Ignore | 20.联系方式 | 21.Titles | 22.URLs"
                          : activeTab === 'samples'
                          ? "1.Customer | 2.Status | 3.Test Finished | 4.Crystal | 5.Category | 6.Form | 7.OrigSize | 8.ProcSize | 9.Graded | 10.SKU | 11.Details | 12.Qty | 13.App | 14.Date | 15.DaysSince(Ignore) | 16.History | 17.Tracking | 18.Next Step | 19.Key Date | 20.Titles | 21.URLs"
                          : "1.Name | 2.Date | 3.Location | 4.Link | 5.Event Series | 6.Summary"
                        }
                      </p>
                   </div>
                   
                   <div className="flex flex-col gap-3 items-end">
                     {!parsedPreview && !excelPreview && (
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          <button 
                            onClick={() => setImportMode('merge')}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${importMode === 'merge' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                          >
                            Merge / Append
                          </button>
                          <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
                          <button 
                             onClick={() => setImportMode('replace')}
                             className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${importMode === 'replace' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                          >
                            Replace All
                          </button>
                        </div>
                     )}

                     {!parsedPreview ? (
                       <div className="flex gap-2">
                         <Button onClick={parsePasteData} className={activeTab === 'customers' ? 'bg-blue-600' : activeTab === 'samples' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}>
                           {t('parseImport')} (Text Paste)
                         </Button>
                       </div>
                     ) : (
                       <>
                         <div className="flex gap-2">
                            <Button onClick={clearPreview} variant="secondary">Cancel</Button>
                            <Button onClick={confirmImport} className="bg-emerald-600 hover:bg-emerald-700 text-white flex gap-2">
                               <CheckCircle2 size={16} /> Confirm Import 
                               {excelPreview ? `(All)` : `(${parsedPreview.length})`}
                            </Button>
                         </div>
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
                  placeholder={`Optionally paste ${activeTab === 'customers' ? 'Customer' : activeTab === 'samples' ? 'Sample' : 'Exhibition'} Excel data here...`}
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                />
              )}

              {parsedPreview && (
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                   <div className="bg-slate-100 dark:bg-slate-800 p-2 text-xs font-bold text-slate-500 uppercase border-b border-slate-200 dark:border-slate-700 flex justify-between">
                     <span>Data Preview: {activeTab.toUpperCase()}</span>
                     {excelPreview && <span className="text-emerald-600">Excel File Loaded</span>}
                   </div>
                   <div className="max-h-[500px] overflow-auto">
                     <table className="w-full text-left text-xs">
                       <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 font-semibold sticky top-0 z-10">
                         <tr className="border-b border-slate-200 dark:border-slate-700">
                           {activeTab === 'customers' ? (
                             <>
                               <th className="p-3 whitespace-nowrap">Name</th>
                               <th className="p-3 whitespace-nowrap">Rank</th>
                               <th className="p-3 whitespace-nowrap">Region</th>
                               <th className="p-3 whitespace-nowrap">Summary</th>
                               <th className="p-3 whitespace-nowrap">Status</th>
                               <th className="p-3 whitespace-nowrap">Next Step</th>
                               <th className="p-3 whitespace-nowrap">Contacts</th>
                               <th className="p-3 whitespace-nowrap">Last Update</th>
                             </>
                           ) : activeTab === 'samples' ? (
                             <>
                               <th className="p-3 whitespace-nowrap">Customer</th>
                               <th className="p-3 whitespace-nowrap">Idx</th>
                               <th className="p-3 whitespace-nowrap">Generated Name</th>
                               <th className="p-3 whitespace-nowrap">Specs (Cry/Form/Size)</th>
                               <th className="p-3 whitespace-nowrap">Qty</th>
                               <th className="p-3 whitespace-nowrap">Status</th>
                               <th className="p-3 whitespace-nowrap">Test Finished</th>
                               <th className="p-3 whitespace-nowrap">Date</th>
                               <th className="p-3 whitespace-nowrap">History</th>
                             </>
                           ) : (
                              <>
                                <th className="p-3">Name</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Location</th>
                                <th className="p-3">Link</th>
                                <th className="p-3">Series</th>
                                <th className="p-3">Summary</th>
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
                                 <td className="p-3 align-top"><RankStars rank={row.rank} /></td>
                                 <td className="p-3 align-top">{Array.isArray(row.region) ? row.region.join(', ') : row.region}</td>
                                 <td className="p-3 align-top truncate max-w-[200px]" title={row.productSummary}>{row.productSummary}</td>
                                 <td className="p-3 align-top"><Badge color="blue">{row.followUpStatus}</Badge></td>
                                 <td className="p-3 align-top truncate max-w-[150px]" title={row.upcomingPlan}>{row.upcomingPlan || '-'}</td>
                                 <td className="p-3 align-top truncate max-w-[150px]" title={row.contacts?.map((c:any) => c.name).join(', ')}>
                                   {row.contacts?.map((c:any) => c.name).join(', ')}
                                 </td>
                                 <td className="p-3 align-top">{row.lastStatusUpdate}</td>
                               </>
                             ) : activeTab === 'samples' ? (
                               <>
                                 <td className="p-3 font-medium align-top">{row.customerName}</td>
                                 <td className="p-3 align-top">{row.sampleIndex}</td>
                                 <td className="p-3 align-top font-bold text-blue-600 dark:text-blue-400 max-w-[200px] truncate" title={row.sampleName}>{row.sampleName}</td>
                                 <td className="p-3 align-top text-[10px] whitespace-nowrap">
                                   <div>{row.crystalType} / {row.productForm}</div>
                                   <div>{row.originalSize} -&gt; {row.processedSize}</div>
                                 </td>
                                 <td className="p-3 align-top">{row.quantity}</td>
                                 <td className="p-3 align-top"><Badge color="blue">{row.status}</Badge></td>
                                 <td className="p-3 align-top">
                                   <Badge color={row.testStatus === 'Finished' ? 'green' : row.testStatus === 'Terminated' ? 'red' : 'yellow'}>
                                     {row.testStatus}
                                   </Badge>
                                 </td>
                                 <td className="p-3 align-top">{row.lastStatusDate}</td>
                                 <td className="p-3 align-top truncate max-w-[150px]" title={row.statusDetails}>{row.statusDetails}</td>
                               </>
                             ) : (
                               <>
                                 <td className="p-3 font-bold">{row.name}</td>
                                 <td className="p-3">{row.date}</td>
                                 <td className="p-3">{row.location}</td>
                                 <td className="p-3">{row.link}</td>
                                 <td className="p-3">{row.eventSeries?.join(', ')}</td>
                                 <td className="p-3 truncate max-w-[150px]" title={row.summary}>{row.summary}</td>
                               </>
                             )}
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
      
      <Modal isOpen={isClearModalOpen} onClose={() => setIsClearModalOpen(false)} title="Clear Database">
        <div className="space-y-4">
           <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-red-800 dark:text-red-200">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h4 className="font-bold">Warning: Irreversible Action</h4>
                <p className="text-sm mt-1">This will permanently delete all customers, samples, exhibitions and interaction records. This cannot be undone.</p>
              </div>
           </div>
           <p className="text-slate-700 dark:text-slate-300">Are you sure you want to completely wipe the database?</p>
           <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={async () => { await clearDatabase(); setIsClearModalOpen(false); }}>Yes, Clear Everything</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataManagement;