
export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    customers: 'Customers',
    sampleTracking: 'Sample Tracking',
    dataManagement: 'Data Management',
    settings: 'Settings',

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
    
    // Dashboard
    totalCustomers: 'Total Customers',
    activeSamples: 'Active Samples',
    pendingFeedback: 'Pending Feedback',
    criticalActions: 'Critical Actions',
    priorityAttention: 'Priority Attention',
    noCriticalActions: 'No critical actions pending. Great job!',
    samplePipeline: 'Sample Pipeline',
    customersByRegion: 'Customers by Region',

    // Customer List
    customerDatabase: 'Customer Database',
    manageClients: 'Manage all client relationships, rankings, and status updates.',
    noCustomersFound: 'No customers found matching your criteria.',
    filterRank: 'All Ranks',
    
    // Profile
    overview: 'Overview',
    history: 'History',
    samples: 'Samples',
    keyContacts: 'Key Contacts',
    docLinks: 'Document Links',
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
    
    // Sample Tracker
    monitorSamples: 'Monitor sample production and customer feedback.',
    newSample: 'New Sample',
    board: 'Board',
    list: 'List',
    sampleId: 'Sample ID',
    product: 'Product',
    specs: 'Specs',
    tracking: 'Tracking',
    
    // Data Management
    bulkImport: 'Bulk Import',
    importDesc: 'Copy and paste rows directly from your Excel spreadsheet.',
    parseImport: 'Parse & Import Data',
    exportCustomers: 'Export Customers',
    exportSamples: 'Export Samples',
    
    // Settings
    appearance: 'Appearance',
    languageSettings: 'Language',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    english: 'English',
    chinese: 'Chinese (Simplified)',
    settingsDesc: 'Customize your application experience.',
    
    // Font Size
    fontSize: 'Font Size',
    fontSmall: 'Small',
    fontMedium: 'Medium',
    fontLarge: 'Large',
  },
  zh: {
    // Navigation
    dashboard: '仪表盘',
    customers: '客户列表',
    sampleTracking: '样品追踪',
    dataManagement: '数据管理',
    settings: '设置',

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

    // Dashboard
    totalCustomers: '客户总数',
    activeSamples: '进行中样品',
    pendingFeedback: '待反馈',
    criticalActions: '紧急事项',
    priorityAttention: '重点关注 (等级 1 & 2)',
    noCriticalActions: '暂无紧急事项，干得漂亮！',
    samplePipeline: '样品流程统计',
    customersByRegion: '客户地区分布',

    // Customer List
    customerDatabase: '客户数据库',
    manageClients: '管理所有客户关系、等级和状态更新。',
    noCustomersFound: '未找到符合条件的客户。',
    filterRank: '所有等级',

    // Profile
    overview: '总览',
    history: '历史记录',
    samples: '样品',
    keyContacts: '关键联系人',
    docLinks: '文档链接',
    productSummary: '状态与产品总结',
    lastUpdated: '最后更新',
    daysSinceUpdate: '更新距今天数',
    daysUntilDDL: 'DDL剩余天数',
    unrepliedDays: '未回复天数',
    unfollowedDays: '未跟进天数',
    interactionHistory: '互动历史',
    logInteraction: '记录互动',
    newRequest: '新建样品申请',
    noSamples: '该客户暂无样品记录。',

    // Sample Tracker
    monitorSamples: '监控样品生产和客户反馈。',
    newSample: '新建样品',
    board: '看板',
    list: '列表',
    sampleId: '样品编号',
    product: '产品',
    specs: '规格',
    tracking: '快递单号',

    // Data Management
    bulkImport: '批量导入',
    importDesc: '直接从Excel电子表格复制并粘贴行。',
    parseImport: '解析并导入数据',
    exportCustomers: '导出客户列表',
    exportSamples: '导出样品列表',

    // Settings
    appearance: '外观设置',
    languageSettings: '语言设置',
    lightMode: '浅色模式',
    darkMode: '深色模式',
    english: '英文',
    chinese: '中文 (简体)',
    settingsDesc: '自定义您的应用程序体验。',
    
    // Font Size
    fontSize: '字体大小',
    fontSmall: '小',
    fontMedium: '中',
    fontLarge: '大',
  }
};
