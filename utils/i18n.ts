
export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    customers: 'Customers',
    sampleTracking: 'Sample Tracking',
    dataManagement: 'Data Management',
    settings: 'Settings',

    // Page Subtitles
    dashboardDesc: 'Enterprise Edition & Console Overview',
    manageClients: 'Manage all client relationships, rankings, and status updates.',
    monitorSamples: 'Monitor sample production and customer feedback.',
    exhibitionDesc: 'Managing links and info for all exhibition entries.',
    dataManagementDesc: 'Bulk import and export tools for database management.',
    settingsDesc: 'Customize your application experience.',

    // Common
    search: 'Search...',
    welcome: 'Welcome back',
    today: 'Today',
    viewAll: 'View All',
    import: 'Import / Add',
    export: 'Export',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back',
    status: 'Status',
    rank: 'Rank',
    daysAgo: 'Days Ago',
    add: 'Add',
    remove: 'Remove',
    
    // Dashboard
    totalCustomers: 'Total Customers',
    activeSamples: 'Active Samples',
    pendingFeedback: 'Pending Feedback',
    criticalActions: 'Critical Actions',
    priorityAttention: 'Priority Attention',
    noCriticalActions: 'No critical actions pending. Great job!',
    samplePipeline: 'Sample Pipeline',
    customersByRegion: 'Customer Regions',
    statusReview: 'Status Summary',
    calendar: 'Calendar',
    viewDay: 'Day',
    viewWeek: 'Week',
    viewMonth: 'Month',
    filterTier1Only: 'Tier 1 Only',
    filterTier1And2: 'Tier 1 & 2',
    generateReport: 'Generate Report',
    exportPdf: 'Export PDF',
    sampleReportTitle: 'Sample Status Report',
    reportDetails: 'Report Details',
    reportSubtitlePrefix: 'Create a high-resolution image report of all samples in ',
    reportSubtitleSuffix: ' status.',
    previewExportJpg: 'Preview & Export JPG',
    selectTemplate: 'Select a visualization template',
    reportDescription: 'Report Description',
    filterByStage: 'Filter by Stage',
    sampleTrackingReport: 'Sample Tracking Report',

    // Customer List
    customerDatabase: 'Customer Database',
    noCustomersFound: 'No customers found matching your criteria.',
    filterRank: 'All Ranks',
    
    // Profile
    overview: 'Overview',
    history: 'History',
    samples: 'Samples',
    keyContacts: 'Key Contacts',
    docLinks: 'Document Links',
    exhibitions: 'Exhibitions',
    addExhibition: 'Add Exhibition',
    noExhibitions: 'No linked exhibitions.',
    upcomingPlanHeader: 'Upcoming Plan',
    productSummary: 'Status & Product Summary',
    lastUpdated: 'Last Updated',
    daysSinceUpdate: 'Days Since Update',
    daysUntilDDL: 'Days Until DDL',
    unrepliedDays: 'Unreplied Days',
    unfollowedDays: 'Unfollowed Days',
    interactionHistory: 'Interaction History',
    logInteraction: 'Log Interaction',
    newRequest: 'New Request',
    noSamples: 'No samples recorded for this customer.',
    confirmDeleteInteraction: 'Are you sure you want to delete this interaction?',
    confirmDeleteCustomer: 'Are you sure you want to delete this customer? This will also remove all associated sample records and cannot be undone.',
    editCustomerName: 'Edit Customer Name',
    confirmNameChange: 'Are you sure you want to change the customer name? This will update the name globally across all related records.',
    confirmTierChange: 'Are you sure you want to change this customer\'s rank/tier?',
    confirmDeleteExhibition: 'Are you sure you want to delete this exhibition? This will remove the reference from all linked customers.',
    editExhibitionName: 'Edit Exhibition Name',
    confirmExhibitionNameChange: 'Are you sure you want to change the exhibition name? This will update the name globally in all customer records.',
    
    // Interaction UI
    interactionLog: 'Interaction Log',
    dateLabel: 'Date',
    contentLabel: 'Content',
    saveLog: 'Save Log',
    normalRecord: 'Normal Record',
    starredRecord: 'Starred Record',
    describeInteraction: 'Describe the interaction...',

    // Contacts Edit
    addContact: 'Add Contact',
    primaryContact: 'Primary Contact',
    contactName: 'Name',
    contactTitle: 'Title',
    contactEmail: 'Email',
    contactPhone: 'Phone',
    confirmDeleteContact: 'Delete this contact?',
    
    // Status Options
    statusMyTurn: 'My Turn',
    statusWaiting: 'Waiting for Customer',
    statusNoAction: 'No Action',

    // Sample Tracker
    newSample: 'New Sample',
    board: 'Board',
    list: 'List',
    sampleId: 'Sample ID',
    product: 'Product',
    specs: 'Specs',
    tracking: 'Tracking',
    searchSample: 'Search Name, SKU, Size...',
    filters: 'Filters',
    filterTestAll: 'Test: All',
    filterTestFinished: 'Test Finished',
    filterTestOngoing: 'Test Ongoing',
    filterTestTerminated: 'Project Terminated',
    projectTerminated: 'Terminated',
    projectOngoing: 'Ongoing',
    projectFinished: 'Finished',
    idx: 'Idx',
    customer: 'Customer',
    sampleInfo: 'Sample Info',
    statusInfo: 'Status Info',
    sinceUpdate: 'Since Update',
    test: 'Test',
    deleteSample: 'Delete Sample',
    confirmDeleteSample: 'Are you sure you want to delete this sample record? This action cannot be undone.',
    fileLinks: 'File Links',
    addFileLink: 'Add Link',
    
    // Sample Columns & Statuses (UI Labels)
    colRequested: 'Requested',
    colProcessing: 'Processing',
    colSent: 'Sent / Testing',
    colFeedback: 'Feedback',

    // DATA KEYS (Mapping for tags saved in DB)
    '单晶': 'Single Crystal',
    '多晶': 'Polycrystalline',
    '微粉': 'Powder',
    '悬浮液': 'Suspension',
    '团聚': 'Agglomerated Diamond',
    '纳米金刚石': 'Nano Diamond',
    '球形金刚石': 'Spherical Diamond',
    '金刚石球': 'Diamond Ball',
    '微米粉': 'Micron',
    'CVD': 'CVD',
    
    // Interaction Tag Mapping (EN Labels for DB Keys)
    '无': 'None',
    '对方邮件': 'Customer Email',
    '我方邮件': 'Our Email',
    '双方邮件': 'Both Emails',
    '展会相见': 'Met at Exhibition',
    '视频会议': 'Video Call',
    '线下会面': 'In-person Meeting',
    '对方回复': 'Customer Reply',
    '我方跟进': 'Our Follow-up',
    '对方回复及我方跟进': 'Customer Reply & Follow-up',

    // Status Data Keys
    '等待中': 'Waiting',
    '样品制作中': 'Processing',
    '样品已发出': 'Sent',
    '已送达': 'Delivered',
    '客户初步测试': 'Testing',
    '客户初步结果': 'Feedback Received',
    '已关闭': 'Closed',
    'My Turn': 'My Turn',
    'Waiting for Customer': 'Waiting for Customer',
    'No Action': 'No Action',
    'Scheduled': 'Scheduled',

    // Test Status Keys
    'Ongoing': 'Ongoing',
    'Finished': 'Finished',
    'Terminated': 'Terminated',

    // Sample Modal
    editSample: 'Edit Sample',
    createSample: 'Create New Sample',
    selectCustomer: 'Select Customer',
    index: 'Index',
    productCatalog: 'Product Catalog',
    selectOrCustom: 'Select or Custom...',
    generatedName: 'Generated Product Name',
    autoGeneratedPlaceholder: 'Auto-generated based on specs below...',
    logicNote: 'Logic: Crystal + Category + Form - Orig > Processed',
    sampleSku: 'Sample SKU',
    grading: 'Grading',
    graded: 'Graded',
    ungraded: 'Ungraded',
    quantity: 'Quantity',
    qtyAbbr: 'Qty',
    application: 'Application',
    currentStatus: 'Current Status',
    statusDate: 'Status Date (Auto-updates)',
    testFinished: 'Test Status',
    statusHistory: 'Status Details / History',
    statusHistoryPlaceholder: 'Use \'|||\' to separate multiple entries. Add date in 【】...',
    trackingNum: 'Tracking #',
    saveRecord: 'Save Sample Record',
    crystal: 'Crystal',
    category: 'Category',
    form: 'Form',
    original: 'Original',
    processed: 'Processed',
    origLabel: 'Orig',
    procLabel: 'Proc',
    nickname: 'Nickname',
    starSample: 'Star Sample',
    confirmStarSample: 'Are you sure you want to star this sample? Its DDL will automatically synchronize with the customer\'s DDL.',
    confirmUnstarSample: 'Are you sure you want to unstar this sample?',
    starred: 'Starred',
    noApplicationProvided: 'No application details provided.',
    
    // Data Management
    bulkImport: 'Bulk Import',
    importDesc: 'Copy and paste rows directly from your Excel spreadsheet.',
    parseImport: 'Parse & Import Data',
    exportCustomers: 'Export Customers',
    exportSamples: 'Export Samples',
    
    // Settings
    orgProfile: 'Organization & Profile',
    orgName: 'Organization Name',
    uName: 'User Name',
    saveProfile: 'Save Profile',
    profileUpdated: 'Updated Successfully!',
    appearance: 'Appearance',
    languageSettings: 'Language',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    english: 'English',
    chinese: 'Chinese (Simplified)',
    
    // Tag Management
    tagManagement: 'Tag Management',
    tagDesc: 'Manage the dropdown options for samples.',
    tagsSampleStatus: 'Sample Status',
    tagsCrystalType: 'Crystal Types',
    tagsProductCategory: 'Product Categories',
    tagsProductForm: 'Product Forms',
    addTagPlaceholder: 'Add new option...',
    interactionTagManagement: 'Interaction Tag Management',
    exhibitionMetadata: 'Exhibition Metadata',
    eventSeries: 'Event Series',
    interactionType: 'Interaction Type',
    interactionEffect: 'Interaction Effect',
    availableTags: 'Available Tags',
    
    // Font Size
    fontSize: 'Font Size',
    fontSmall: 'Small',
    fontStandard: 'Standard',
    fontLarge: 'Large',
  },
  zh: {
    // Navigation
    dashboard: '仪表盘',
    customers: '客户列表',
    sampleTracking: '样品追踪',
    dataManagement: '数据管理',
    settings: '设置',

    // Page Subtitles
    dashboardDesc: '企业版 & 控制台概览',
    manageClients: '管理所有客户关系、等级和状态更新。',
    monitorSamples: '监控样品生产和客户反馈。',
    exhibitionDesc: '管理展会链接及详细记录。',
    dataManagementDesc: '用于数据库维护的批量导入和导出工具。',
    settingsDesc: '自定义您的应用程序体验。',

    // Common
    search: '搜索...',
    welcome: '欢迎回来',
    today: '今天',
    viewAll: '查看全部',
    import: '导入 / 新增',
    export: '导出',
    save: '保存',
    cancel: '取消',
    edit: '编辑',
    delete: '删除',
    back: '返回',
    status: '状态',
    rank: '等级',
    daysAgo: '天前',
    add: '添加',
    remove: '移除',

    // Dashboard
    totalCustomers: '客户总数',
    activeSamples: '进行中样品',
    pendingFeedback: '待反馈',
    criticalActions: '紧急事项',
    priorityAttention: '重点关注',
    noCriticalActions: '暂无紧急事项，干得漂亮！',
    samplePipeline: '样品流程统计',
    customersByRegion: '客户地区',
    statusReview: '样品状况总结',
    calendar: '工作日历',
    viewDay: '日视图',
    viewWeek: '周视图',
    viewMonth: '月视图',
    filterTier1Only: '仅显示 Tier 1',
    filterTier1And2: '显示 Tier 1 & 2',
    generateReport: '生成报告',
    exportPdf: '导出 PDF',
    sampleReportTitle: '样品状态报告',
    reportDetails: '报告详情',
    reportSubtitlePrefix: '为当前状态为“',
    reportSubtitleSuffix: '”的所有样品生成高分辨率长图报告。',
    previewExportJpg: '预览并导出 JPG',
    selectTemplate: '选择可视化模板',
    reportDescription: '报告说明',
    filterByStage: '阶段筛选',
    sampleTrackingReport: '样品追踪报告',

    // Customer List
    customerDatabase: '客户数据库',
    noCustomersFound: '未找到符合条件的客户。',
    filterRank: '所有等级',

    // Profile
    overview: '总览',
    history: '历史记录',
    samples: '样品',
    keyContacts: '关键联系人',
    docLinks: '文档链接',
    exhibitions: '展会信息',
    addExhibition: '添加展会',
    noExhibitions: '暂无关联展会。',
    upcomingPlanHeader: '后续计划',
    productSummary: '状态与产品总结',
    lastUpdated: '最后更新',
    daysSinceUpdate: '距更新天数',
    daysUntilDDL: 'DDL剩余天数',
    unrepliedDays: '未回复天数',
    unfollowedDays: '未跟进天数',
    interactionHistory: '互动历史',
    logInteraction: '记录互动',
    newRequest: '新建样品申请',
    noSamples: '该客户暂无样品记录。',
    confirmDeleteInteraction: '您确定要删除此互动记录吗？',
    confirmDeleteCustomer: '您确定要删除此客户吗？这将同时删除所有相关的样品记录，且无法撤销。',
    editCustomerName: '编辑客户名称',
    confirmNameChange: '您确定要修改客户名称吗？这将全局更新所有相关记录中的名称。',
    confirmTierChange: '您确定要更改该客户的等级吗？',
    confirmDeleteExhibition: '您确定要删除此展会记录吗？这将从所有关联客户的标签中移除该展会。',
    editExhibitionName: '编辑展会名称',
    confirmExhibitionNameChange: '您确定要修改展会名称吗？这将全局更新所有关联客户记录中的展会标签。',

    // Interaction UI
    interactionLog: '互动记录详情',
    dateLabel: '日期',
    contentLabel: '详细内容',
    saveLog: '保存记录',
    normalRecord: '一般记录',
    starredRecord: '标星记录',
    describeInteraction: '请描述此次互动细节...',

    // Contacts Edit
    addContact: '添加联系人',
    primaryContact: '主要联系人',
    contactName: '姓名',
    contactTitle: '职位',
    contactEmail: '邮箱',
    contactPhone: '电话',
    confirmDeleteContact: '确定删除此联系人？',

    // Status Options
    statusMyTurn: '我方跟进',
    statusWaiting: '等待对方',
    statusNoAction: '暂无',

    // Sample Tracker
    newSample: '新建样品',
    board: '看板',
    list: '列表',
    sampleId: '样品编号',
    product: '产品',
    specs: '规格',
    tracking: '快递单号',
    searchSample: '搜索名称, SKU, 粒度...',
    filters: '筛选',
    filterTestAll: '测试状态: 全部',
    filterTestFinished: '测试完成',
    filterTestOngoing: '测试进行中',
    filterTestTerminated: '项目终止',
    projectTerminated: '项目终止',
    projectOngoing: '测试进行中',
    projectFinished: '测试完成',
    idx: '序号',
    customer: '客户',
    sampleInfo: '样品信息',
    statusInfo: '状态详情',
    sinceUpdate: '距更新',
    test: '测试',
    deleteSample: '删除样品',
    confirmDeleteSample: '您确定要删除此样品记录吗？此操作无法撤销。',
    fileLinks: '超链接 / 文档',
    addFileLink: '添加链接',

    // Sample Columns & Statuses (UI Labels)
    colRequested: '等待中',
    colProcessing: '样品制作中',
    colSent: '样品已发出',
    colFeedback: '客户初步结果',

    // DATA KEYS
    '单晶': '单晶',
    '多晶': '多晶',
    '微粉': '微粉',
    '悬浮液': '悬浮液',
    '团聚': '团聚',
    '纳米金刚石': '纳米金刚石',
    '球形金刚石': '球形金刚石',
    '金刚石球': '金刚石球',
    '微米粉': '微米粉',
    'CVD': 'CVD',
    
    // Interaction Tag Mapping (Strictly matched to user's specified Chinese strings)
    '无': '无',
    '对方邮件': '对方邮件',
    '我方邮件': '我方邮件',
    '双方邮件': '双方邮件',
    '展会相见': '展会相见',
    '视频会议': '视频会议',
    '线下会面': '线下会面',
    '对方回复': '对方回复',
    '我方跟进': '我方跟进',
    '对方回复及我方跟进': '对方回复及我方跟进',

    // Status Data Keys
    '等待中': '等待中',
    '样品制作中': '样品制作中',
    '样品已发出': '样品已发出',
    '已送达': '已送达',
    '客户初步测试': '客户初步测试',
    '客户初步结果': '客户初步结果',
    '已关闭': '已关闭',
    'My Turn': '我方跟进',
    'Waiting for Customer': '等待对方',
    'No Action': '暂无',
    'Scheduled': '已排期',

    // Test Status Keys
    'Ongoing': '测试进行中',
    'Finished': '测试完成',
    'Terminated': '项目终止',

    // Sample Modal
    editSample: '编辑样品',
    createSample: '新建样品',
    selectCustomer: '选择客户',
    index: '序号',
    productCatalog: '产品目录',
    selectOrCustom: '选择或自定义...',
    generatedName: '生成产品名称',
    autoGeneratedPlaceholder: '根据下方规格自动生成...',
    logicNote: '逻辑: 晶体 + 分类 + 形态 - 原料 > 加工后',
    sampleSku: '样品 SKU',
    grading: '分级',
    graded: '分级',
    ungraded: '未分级',
    quantity: '数量',
    qtyAbbr: '数量',
    application: '应用领域',
    currentStatus: '当前状态',
    statusDate: '状态日期 (自动更新)',
    testFinished: '测试状态',
    statusHistory: '状态详情 / 历史',
    statusHistoryPlaceholder: '使用 \'|||\' 分隔多条记录。在【】中添加日期...',
    trackingNum: '快递单号',
    saveRecord: '保存记录',
    crystal: '晶体',
    category: '分类',
    form: '形态',
    original: '原料粒度',
    processed: '加工粒度',
    origLabel: '原料',
    procLabel: '加工',
    nickname: '昵称',
    starSample: '标星样品',
    confirmStarSample: '您确定要标星该样品吗？标星后，样品的DDL将自动与客户页面的DDL保持同步。',
    confirmUnstarSample: '您确定要取消标星吗？',
    starred: '标星',
    noApplicationProvided: '暂无应用详情。',

    // Data Management
    bulkImport: '批量导入',
    importDesc: '直接从Excel电子表格复制并粘贴行。',
    parseImport: '解析并导入数据',
    exportCustomers: '导出客户列表',
    exportSamples: '导出样品列表',

    // Settings
    orgProfile: '机构与个人资料',
    orgName: '公司/机构名称',
    uName: '用户姓名',
    saveProfile: '保存资料',
    profileUpdated: '资料更新成功！',
    appearance: '外观设置',
    languageSettings: '语言设置',
    lightMode: '浅色模式',
    darkMode: '深色模式',
    english: '英文',
    chinese: '中文 (简体)',

    // Tag Management
    tagManagement: '标签管理',
    tagDesc: '管理样品信息的下拉菜单选项。',
    tagsSampleStatus: '样品状态',
    tagsCrystalType: '晶体类型',
    tagsProductCategory: '产品分类',
    tagsProductForm: '产品形态',
    addTagPlaceholder: '输入新选项...',
    interactionTagManagement: '互动记录标签管理',
    exhibitionMetadata: '展会元数据',
    eventSeries: '展会系列',
    interactionType: '对接流程类型',
    interactionEffect: '流程作用标签',
    availableTags: '可用标签',
    
    // Font Size
    fontSize: '字体大小',
    fontSmall: '小',
    fontStandard: '标准',
    fontLarge: '大',
  }
};

/**
 * Normalizes an input value to a canonical tag (key) used in the translations object.
 */
export const getCanonicalTag = (val: string): string => {
  if (!val) return val;
  const trimmed = val.trim();
  
  // 1. Check if it's already a key in translations.en
  if (translations.en.hasOwnProperty(trimmed)) return trimmed;
  
  // 2. Search through values in en and zh
  for (const key of Object.keys(translations.en) as Array<keyof typeof translations.en>) {
    if (translations.en[key] === trimmed || translations.zh[key] === trimmed) {
      return key;
    }
  }
  
  return trimmed;
};

/**
 * Translates a canonical tag or its English value into its Chinese equivalent.
 */
export const translateToZh = (keyOrVal: string): string => {
  if (!keyOrVal) return keyOrVal;
  
  // 1. If it's a key in zh, return that translation
  if (translations.zh.hasOwnProperty(keyOrVal)) {
    return translations.zh[keyOrVal as keyof typeof translations.zh];
  }
  
  // 2. If it's a value in en, find the corresponding key and return zh[key]
  for (const k of Object.keys(translations.en) as Array<keyof typeof translations.en>) {
    if (translations.en[k] === keyOrVal) {
      return translations.zh[k];
    }
  }
  
  return keyOrVal;
};
