
import React, { useState, useRef } from 'react';
import { Customer, Sample, Rank, SampleStatus, CustomerStatus, FollowUpStatus, ProductCategory, ProductForm, Interaction, CrystalType, GradingStatus, TestStatus } from '../types';
import { Card, Button, Badge, Modal, RankStars, StatusIcon } from '../components/Common';
import { Download, Upload, FileText, AlertCircle, CheckCircle2, Users, FlaskConical, Search, X, Trash2, RefreshCcw, FileSpreadsheet, Eye, Database } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { getCanonicalTag } from '../utils/i18n';

interface DataManagementProps {
  onImportCustomers: (newCustomers: Customer[], override?: boolean) => void;
  onImportSamples: (newSamples: Sample[], override?: boolean) => void;
}

const DataManagement: React.FC<DataManagementProps> = ({ 
  onImportCustomers, 
  onImportSamples
}) => {
  const { t, clearDatabase, customers, samples, syncSampleToCatalog, companyName, userName, refreshTagsFromSamples } = useApp();
  const [activeTab, setActiveTab] = useState<'customers' | 'samples'>('customers');
  const [panelMode, setPanelMode] = useState<'import' | 'review'>('import');
  const [importData, setImportData] = useState('');
  const [reviewSearch, setReviewSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [excelPreview, setExcelPreview] = useState<{ customers: Customer[], samples: Sample[] } | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  const normalizeDate = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    const trimmed = String(dateStr).trim();
    const bracketMatch = trimmed.match(/【(.*?)】/);
    if (bracketMatch) return normalizeDate(bracketMatch[1]);
    return trimmed;
  };

  const mapStatusFromImport = (status: string): FollowUpStatus => {
    const s = status ? String(status).trim() : '';
    if (s === '我方跟进' || s === 'My Turn') return 'My Turn';
    if (s === '等待对方' || s === 'Waiting for Customer') return 'Waiting for Customer';
    return 'No Action'; 
  };

  const rowToSample = (cols: any[], tempIdPrefix: string, indexMap: Map<string, number>, lookupCustomers: Customer[]): Sample => {
    const safeCol = (i: number) => cols[i] !== undefined && cols[i] !== null ? String(cols[i]).trim() : '';
    const custName = safeCol(0) || 'Unknown';
    const matchedCustomer = lookupCustomers.find(c => c.name.toLowerCase() === custName.toLowerCase());
    
    const lowerCustName = custName.toLowerCase();
    let nextIndex = (indexMap.get(lowerCustName) || 0) + 1;
    indexMap.set(lowerCustName, nextIndex);
    
    const status = getCanonicalTag(safeCol(1)) as SampleStatus || 'Requested';
    
    // UPDATED: Handle three-state test outcome during import
    const rawTest = (safeCol(2) || '').toLowerCase();
    let testStatus: TestStatus = 'Ongoing';
    if (['yes', 'true', '是', 'finished', '完成'].includes(rawTest)) testStatus = 'Finished';
    else if (['terminated', '终止', 'closed', '项目终止'].includes(rawTest)) testStatus = 'Terminated';

    const crystal = getCanonicalTag(safeCol(3)) || '';
    const form = getCanonicalTag(safeCol(5)) || 'Powder';
    const categories = safeCol(4) ? safeCol(4).split(',').map(c => getCanonicalTag(c.trim()) as ProductCategory) : [];
    const origSize = safeCol(6) || '';
    const procSize = safeCol(7) ? ` > ${safeCol(7)}` : '';
    const generatedName = `${crystal} ${categories.join(', ')} ${form} - ${origSize}${procSize}`.trim();

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
      statusDetails: safeCol(15) || '',
      trackingNumber: safeCol(16) || '',
      sampleName: generatedName,
      productType: generatedName,
      specs: safeCol(6) ? `${safeCol(6)} -> ${safeCol(7)}` : '',
      requestDate: new Date().toISOString().split('T')[0],
    } as Sample;
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const custHeaders = ["客户", "地区", "展会", "等级", "总结", "更新日期", "跟进状态"];
    const custRows = customers.map(c => [c.name, c.region.join(' | '), c.tags.join(', '), c.rank, c.productSummary, c.lastStatusUpdate, c.followUpStatus]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([custHeaders, ...custRows]), "Customers");
    
    // UPDATED: Sample export to include status text
    const sampHeaders = ["Customer", "Status", "Test Progress", "Crystal", "Category", "Form", "Original Size", "Processed Size", "SKU", "Date", "Tracking"];
    const sampRows = samples.map(s => [
      s.customerName, s.status, s.testStatus, s.crystalType, s.productCategory?.join(', '),
      s.productForm, s.originalSize, s.processedSize, s.sampleSKU, s.lastStatusDate, s.trackingNumber
    ]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([sampHeaders, ...sampRows]), "Samples");

    XLSX.writeFile(wb, `MasterDB_${companyName}_${userName}_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const filteredReviewData = () => {
    const data = activeTab === 'customers' ? customers : samples;
    if (!reviewSearch) return data;
    const term = reviewSearch.toLowerCase();
    return data.filter((item: any) => 
      (item.name || item.customerName || '').toLowerCase().includes(term) ||
      (item.sampleSKU || '').toLowerCase().includes(term) ||
      (item.status || '').toLowerCase().includes(term)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('dataManagement')}</h2>
          <p className="text-slate-500 dark:text-slate-400">Bulk Import / Database Review</p>
        </div>
        <div className="flex gap-2">
           <Button variant="secondary" onClick={handleExportExcel} className="flex items-center gap-2"><FileSpreadsheet size={16} /> Export Excel</Button>
           <Button variant="danger" onClick={() => setIsClearModalOpen(true)}><Trash2 size={16} /> Clear DB</Button>
        </div>
      </div>

      <Card className="p-0 border-l-0 overflow-hidden">
        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 m-4 rounded-xl w-fit">
           <button onClick={() => setPanelMode('import')} className={`px-6 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${panelMode === 'import' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Upload size={16} /> Import Tool</button>
           <button onClick={() => setPanelMode('review')} className={`px-6 py-2 text-sm font-bold rounded-lg flex items-center gap-2 ${panelMode === 'review' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Database size={16} /> Live Database</button>
        </div>

        <div className="flex border-b bg-slate-50 dark:bg-slate-900">
           <button onClick={() => setActiveTab('customers')} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold ${activeTab === 'customers' ? 'bg-white text-blue-600 border-t-4 border-t-blue-600' : 'text-slate-500'}`}><Users size={20} /> Customers ({customers.length})</button>
           <button onClick={() => setActiveTab('samples')} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold ${activeTab === 'samples' ? 'bg-white text-amber-600 border-t-4 border-t-amber-600' : 'text-slate-500'}`}><FlaskConical size={20} /> Samples ({samples.length})</button>
        </div>

        <div className="p-6">
          {panelMode === 'import' ? (
            <div className="space-y-4">
              <textarea className="w-full h-64 border rounded-lg p-3 font-mono text-xs dark:bg-slate-900" placeholder="Paste tab-separated data here..." value={importData} onChange={e => setImportData(e.target.value)} />
              <Button className="w-full">Parse and Review Import</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                <input className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-900" placeholder={`Search ${activeTab}...`} value={reviewSearch} onChange={e => setReviewSearch(e.target.value)} />
              </div>
              <div className="overflow-auto max-h-[500px] border rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      {activeTab === 'customers' ? (
                        <><th>Company</th><th>Rank</th><th>Summary</th><th>Status</th></>
                      ) : (
                        <><th>Customer</th><th>Idx</th><th>Sample Name</th><th>Status</th><th>Test</th></>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReviewData().map((item: any, i: number) => (
                      <tr key={i} className="border-t hover:bg-slate-50">
                        {activeTab === 'customers' ? (
                          <>
                            <td className="p-3 font-bold">{item.name}</td>
                            <td className="p-3"><RankStars rank={item.rank} /></td>
                            <td className="p-3 text-xs truncate max-w-xs">{item.productSummary}</td>
                            <td className="p-3"><Badge color="blue">{item.followUpStatus}</Badge></td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-bold">{item.customerName}</td>
                            <td className="p-3">#{item.sampleIndex}</td>
                            <td className="p-3 font-bold text-blue-600">{item.sampleName}</td>
                            <td className="p-3"><Badge color="blue">{item.status}</Badge></td>
                            <td className="p-3">
                               {item.testStatus === 'Ongoing' ? (
                                  <Badge color="yellow">Open</Badge>
                               ) : item.testStatus === 'Terminated' ? (
                                  <Badge color="red">Terminated</Badge>
                               ) : (
                                  <Badge color="green">Done</Badge>
                               )}
                            </td>
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
           <p className="text-red-600 font-bold">This is irreversible. All data will be wiped.</p>
           <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setIsClearModalOpen(false)}>Cancel</Button>
              <Button variant="danger" onClick={() => { clearDatabase(); setIsClearModalOpen(false); }}>Clear Everything</Button>
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataManagement;
