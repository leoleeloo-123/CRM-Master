
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
    other: 'Other Info',
    results: 'Results',
    
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
    exhibitionRecapTitle: 'Exhibition Recap Report',
    reportDetails: 'Report Details',
    reportSubtitlePrefix: 'Create a high-resolution image report of all samples in ',
    reportSubtitleSuffix: ' status.',
    exhibitionReportSubtitle: 'Summary of all customer interactions and meeting notes for ',
    previewExportJpg: 'Preview & Export JPG',
    selectTemplate: 'Select a visualization template',
    reportDescription: 'Report Description',
    filterByStage: 'Filter by Stage',
    selectExhibition: 'Select Exhibition',
    sampleTrackingReport: 'Sample Tracking Report',
    exhibitionRecapReport: 'Exhibition Recap Report',
    dailyAgenda: 'Daily Agenda',
    agendaCustomers: 'Customers',
    agendaSamples: 'Samples',
    actionNeeded: 'Action needed',

    // Customer List
    customerDatabase: 'Customer Database',
    noCustomersFound: 'No customers found matching your criteria.',
    filterRank: 'All Ranks',
    
    // Profile
    overview: 'Overview',
    history: 'History',
    samples: 'Samples',
    sampleSummary: 'Sample Summary',
    keyContacts: 'Key Contacts',
    docLinks: 'Document Links',
    exhibitions: 'Exhibitions',
    addExhibition: 'Add Exhibition',
    noExhibitions: 'No linked exhibitions.',
    upcomingPlanHeader: 'Upcoming Plan',
    productSummary: 'Status Summary',
    lastUpdated: 'Last Updated',
    statusUpdateHeader: 'Status Updates',
    daysSinceUpdate: 'Days Since Update',
    updateStatus: 'Update Status',
    daysUntilDDL: 'Days Until DDL',
    unrepliedDays: 'Customer Unreplied Days',
    unfollowedDays: 'Our Unfollowed Days',
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
    
    // Exhibition List
    exhibitionSearchPlaceholder: 'Search by exhibition name or location...',
    allSeries: 'All Series',
    allYears: 'All Years',
    allCustomers: 'All Customers',
    collapseAll: 'Collapse All',
    expandAll: 'Expand All',
    colExhibitionSeries: 'Exhibition / Series',
    colLocation: 'Location',
    colDate: 'Date',
    colOfficialLink: 'Official Link',
    colLinkedCustomers: 'Linked Customers',
    colEventSummary: 'Event Summary',
    untaggedEvents: 'Untagged Events',
    noLink: 'No link',
    noSummary: 'No summary.',

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
    colRequested: 'Waiting',
    colProcessing: 'Processing',
    colSent: 'Sent',
    colFeedback: 'Feedback Received',

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
    '客户初步测试': 'Testing',
    '客户初步结果': 'Feedback Received',
    '已送达': 'Delivered',
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
    fontSize: '字体大小',
    fontSmall: '小',
    fontStandard: '标准',
    fontLarge: '大',
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
    dataManagementDesc: '用于数据库维护的批量导入 and 导出工具。',
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
    other: '其它',
    results: '结果',

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
    exhibitionRecapTitle: '展会会面总结报告',
    reportDetails: '报告详情',
    reportSubtitlePrefix: '为当前状态为“',
    reportSubtitleSuffix: '”的所有样品生成高分辨率长图报告。',
    exhibitionReportSubtitle: '汇总在此展会中的所有客户交流记录及会议摘要：',
    previewExportJpg: '预览并导出 JPG',
    selectTemplate: '选择可视化模板',
    reportDescription: '报告说明',
    filterByStage: '阶段筛选',
    selectExhibition: '选择具体展会',
    sampleTrackingReport: '样品追踪报告',
    exhibitionRecapReport: '展会会面总结报告',
    dailyAgenda: '每日日程',
    agendaCustomers: '客户事项',
    agendaSamples: '样品日程',
    actionNeeded: '需跟进',

    // Customer List
    customerDatabase: '客户数据库',
    noCustomersFound: '未找到符合条件的客户。',
    filterRank: '所有等级',

    // Profile
    overview: '总览',
    history: '历史记录',
    samples: '样品',
    sampleSummary: '样品汇总',
    keyContacts: '关键联系人',
    docLinks: '文档链接',
    exhibitions: '展会信息',
    addExhibition: '添加展会',
    noExhibitions: '暂无关联展会。',
    upcomingPlanHeader: '后续计划',
    productSummary: '状态总结',
    lastUpdated: '最后更新',
    statusUpdateHeader: '状态更新',
    daysSinceUpdate: '距更新天数',
    updateStatus: '更新状态',
    daysUntilDDL: 'DDL剩余天数',
    unrepliedDays: '客户未回复天数',
    unfollowedDays: '我方未跟进天数',
    interactionHistory: '互动历史',
    logInteraction: '记录互动',
    newRequest: '新样品申请',
    noSamples: '该客户暂无样品记录。',
    confirmDeleteInteraction: '您确定要删除此互动记录吗？',
    confirmDeleteCustomer: '您确定要删除此客户吗？这将同时删除所有相关的样品记录，且无法撤销。',
    editCustomerName: '编辑客户名称',
    confirmNameChange: '您确定要修改客户名称吗？这将全局更新所有相关记录中的名称。',
    confirmTierChange: '您确定要更改该客户的等级吗？',
    confirmDeleteExhibition: '您确定要删除此展会记录吗？这将从所有关联客户的标签中移除该展会。',
    editExhibitionName: '编辑展会名称',
    confirmExhibitionNameChange: '您确定要修改展会名称吗？这将全局更新所有关联客户记录中的展会标签。',

    // Exhibition List
    exhibitionSearchPlaceholder: '搜索展会名称或地点...',
    allSeries: '所有系列',
    allYears: '所有年份',
    allCustomers: '所有客户',
    collapseAll: '折叠全部',
    expandAll: '展开全部',
    colExhibitionSeries: '展会 / 系列',
    colLocation: '地点',
    colDate: '日期',
    colOfficialLink: '官网链接',
    colLinkedCustomers: '关联客户',
    colEventSummary: '展会总结',
    untaggedEvents: '未标记展会',
    noLink: '暂无链接',
    noSummary: '暂无总结',

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
    
    // Interaction Tag Mapping
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
    '客户初步测试': '客户初步测试',
    '客户初步结果': '客户初步结果',
    '已送达': '已送达',
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
 * Always returns the Chinese key version for internal stability.
 */
export const getCanonicalTag = (val: string): string => {
  if (!val) return '无';
  const trimmed = val.trim().toUpperCase();
  
  // Search through keys and values to find a match
  for (const key of Object.keys(translations.en) as Array<keyof typeof translations.en>) {
    const enVal = translations.en[key];
    const zhVal = translations.zh[key];
    
    // If it matches English label, return the Key (which is the Chinese string)
    if (typeof enVal === 'string' && enVal.toUpperCase() === trimmed) return key;
    // If it matches Chinese label, return the Key
    if (typeof zhVal === 'string' && zhVal.toUpperCase() === trimmed) return key;
    // If it matches the Key itself
    if (key.toUpperCase() === trimmed) return key;
  }
  
  return val.trim();
};

/**
 * Specifically converts any input to its corresponding Chinese label.
 * Useful for forcing Chinese storage in summary strings.
 */
export const translateToZh = (keyOrVal: string): string => {
  if (!keyOrVal) return '无';
  
  // 1. If it exists in zh as a key, it is already our canonical key
  if (translations.zh.hasOwnProperty(keyOrVal)) {
    return translations.zh[keyOrVal as keyof typeof translations.zh] as string;
  }
  
  // 2. Otherwise, find it in en/zh values and return the canonical key
  const canonical = getCanonicalTag(keyOrVal);
  return translations.zh[canonical as keyof typeof translations.zh] || canonical;
};
