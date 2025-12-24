
import { Customer, Sample, MasterProduct } from '../types';

// Mock Data updated with generic demo data to avoid data leakage
export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Acme Corp',
    region: ['North America'],
    rank: 1,
    status: 'Active',
    productSummary: '[Status] Negotiating annual contract for Type A powders. 1. Agglomerated diamond testing successful. 2. Interested in new suspension formula.',
    lastStatusUpdate: '2025-01-15',
    followUpStatus: 'My Turn',
    contacts: [
      { name: 'John Doe', title: 'Procurement Manager', email: 'john.doe@acme.com' },
      { name: 'Jane Smith', title: 'R&D Director', email: 'jane.smith@acme.com' }
    ],
    lastContactDate: '2025-01-20',
    lastCustomerReplyDate: '2025-01-18',
    lastMyReplyDate: '2025-01-20',
    nextActionDate: '2025-02-01',
    tags: ['CES 2024', 'Tech Expo 2025'],
    docLinks: ['https://example.com/contract-draft'],
    interactions: [
      {
        id: 'i1',
        date: '2025-01-20',
        summary: 'Zoom call to discuss Q2 pricing. They are requesting a 5% discount on bulk orders.',
        nextSteps: 'Send revised quotation.',
        tags: ['Negotiation']
      },
      {
        id: 'i2',
        date: '2024-12-10',
        summary: 'Received positive feedback on Sample S-101. Removal rate met targets.',
        tags: ['Email']
      }
    ]
  },
  {
    id: 'c2',
    name: 'Nebula Industries',
    region: ['Europe', 'Germany'],
    rank: 2,
    status: 'Pending',
    productSummary: 'Evaluating 20nm Nano Diamond for polishing application. Currently comparing with competitor.',
    lastStatusUpdate: '2025-02-01',
    followUpStatus: 'Waiting for Customer',
    contacts: [
      { name: 'Hans Muller', title: 'Process Engineer', email: 'h.muller@nebula.de' }
    ],
    lastContactDate: '2025-02-01',
    lastCustomerReplyDate: '2025-01-25',
    lastMyReplyDate: '2025-02-01',
    nextActionDate: '2025-02-15',
    tags: ['Industry Fair 2024'],
    interactions: [
      {
        id: 'i3',
        date: '2025-02-01',
        summary: 'Sent technical datasheet for Nano Series. Pending their lab review.',
        nextSteps: 'Follow up on lab results.'
      }
    ]
  },
  {
    id: 'c3',
    name: 'Quantum Optics',
    region: ['Asia', 'China'],
    rank: 1,
    status: 'Active',
    productSummary: 'High-volume buyer for Single Crystal. 1. Monthly recurring orders. 2. Developing new lens polishing process.',
    lastStatusUpdate: '2025-02-05',
    followUpStatus: 'Scheduled',
    contacts: [
      { name: 'Li Wei', title: 'Supply Chain Head' }
    ],
    lastContactDate: '2025-02-03',
    lastCustomerReplyDate: '2025-02-03',
    lastMyReplyDate: '2025-02-02',
    nextActionDate: '2025-02-10',
    tags: ['Photonics West'],
    interactions: []
  },
  {
    id: 'c4',
    name: 'StartUp Dynamics',
    region: ['USA'],
    rank: 4,
    status: 'Prospect',
    productSummary: 'Looking for cost-effective alternatives for CMP slurry. Early stage discussion.',
    lastStatusUpdate: '2024-11-15',
    followUpStatus: 'No Action',
    contacts: [
      { name: 'Sarah Connor', title: 'Founder' }
    ],
    lastContactDate: '2024-11-15',
    lastCustomerReplyDate: '2024-11-10',
    lastMyReplyDate: '2024-11-15',
    nextActionDate: '2025-03-01',
    tags: [],
    interactions: [
      {
        id: 'i4',
        date: '2024-11-15',
        summary: 'Sent standard price list. No immediate project timeline.',
        tags: ['Email']
      }
    ]
  },
  {
    id: 'c5',
    name: 'Global Wafer Co.',
    region: ['Taiwan'],
    rank: 3,
    status: 'Active',
    productSummary: 'Testing Diamond Ball for wire saw application. Sample 2 sent.',
    lastStatusUpdate: '2025-01-28',
    followUpStatus: 'Waiting for Customer',
    contacts: [
      { name: 'Chen', title: 'R&D' }
    ],
    lastContactDate: '2025-01-28',
    lastCustomerReplyDate: '2025-01-20',
    lastMyReplyDate: '2025-01-28',
    nextActionDate: '2025-02-20',
    tags: ['Semicon Taiwan'],
    interactions: []
  }
];

export const MOCK_MASTER_PRODUCTS: MasterProduct[] = [
  {
    id: 'mp1',
    productName: '多晶 团聚 微粉 - 5um > 5um',
    crystalType: '多晶',
    productCategory: ['团聚'],
    productForm: '微粉',
    originalSize: '5um',
    processedSize: '5um'
  },
  {
    id: 'mp2',
    productName: '单晶 纳米金刚石 悬浮液 - 20nm > 20nm',
    crystalType: '单晶',
    productCategory: ['纳米金刚石'],
    productForm: '悬浮液',
    originalSize: '20nm',
    processedSize: '20nm'
  },
  {
    id: 'mp3',
    productName: '单晶 微米粉 微粉 - 0.25um > 0.25um',
    crystalType: '单晶',
    productCategory: ['微米粉'],
    productForm: '微粉',
    originalSize: '0.25um',
    processedSize: '0.25um'
  },
  {
    id: 'mp4',
    productName: '多晶 金刚石球 微粉 - 80um > 80um',
    crystalType: '多晶',
    productCategory: ['金刚石球'],
    productForm: '微粉',
    originalSize: '80um',
    processedSize: '80um'
  }
];

export const MOCK_SAMPLES: Sample[] = [
  {
    id: 's1',
    customerId: 'c1',
    customerName: 'Acme Corp',
    sampleIndex: 1,
    sampleName: '多晶 团聚 微粉 - 5um > 5um',
    productType: 'Powder',
    specs: '5um, Hydrophilic',
    quantity: '500g',
    status: '已反馈',
    testStatus: 'Finished',
    crystalType: '多晶',
    productCategory: ['团聚'],
    productForm: '微粉',
    originalSize: '5um',
    processedSize: '5um',
    isGraded: 'Graded',
    application: 'Sapphire Polishing',
    sampleDetails: 'Custom size distribution requested.',
    requestDate: '2024-11-01',
    lastStatusDate: '2024-12-10',
    statusDetails: '【2024-12-10】Feedback positive. Moving to commercial negotiation.',
    feedback: 'Excellent surface finish.',
    trackingNumber: '1Z999AA10123456784'
  },
  {
    id: 's2',
    customerId: 'c2',
    customerName: 'Nebula Industries',
    sampleIndex: 1,
    sampleName: '单晶 纳米金刚石 悬浮液 - 20nm > 20nm',
    productType: 'Slurry',
    specs: '20nm, pH 7',
    quantity: '1 L',
    status: '已寄出',
    testStatus: 'Ongoing',
    crystalType: '单晶',
    productCategory: ['纳米金刚石'],
    productForm: '悬浮液',
    originalSize: '20nm',
    processedSize: '20nm',
    isGraded: 'Ungraded',
    application: 'Lens Polishing',
    sampleDetails: 'pH neutral suspension.',
    requestDate: '2025-01-10',
    lastStatusDate: '2025-01-15',
    statusDetails: '【2025-01-15】In transit to Germany.',
    trackingNumber: 'DHL-123456789'
  },
  {
    id: 's3',
    customerId: 'c3',
    customerName: 'Quantum Optics',
    sampleIndex: 1,
    sampleName: '单晶 微米粉 微粉 - 0.25um > 0.25um',
    productType: 'Powder',
    specs: '0.25 micron',
    quantity: '1000 ct',
    status: '处理中',
    testStatus: 'Ongoing',
    crystalType: '单晶',
    productCategory: ['微米粉'],
    productForm: '微粉',
    originalSize: '0.25um',
    processedSize: '0.25um',
    isGraded: 'Graded',
    application: 'Precision Optics',
    sampleDetails: 'Strict PSD control.',
    requestDate: '2025-02-01',
    lastStatusDate: '2025-02-02',
    statusDetails: '【2025-02-02】Waiting for production batch #404.',
  },
  {
    id: 's4',
    customerId: 'c5',
    customerName: 'Global Wafer Co.',
    sampleIndex: 1,
    sampleName: '多晶 金刚石球 微粉 - 80um > 80um',
    productType: 'Diamond Ball',
    specs: '80 micron cluster',
    quantity: '50g',
    status: '已申请',
    testStatus: 'Ongoing',
    crystalType: '多晶',
    productCategory: ['金刚石球'],
    productForm: '微粉',
    originalSize: '80um',
    processedSize: '80um',
    isGraded: 'Graded',
    application: 'Wire Saw',
    sampleDetails: 'Test for new wafer cutting process.',
    requestDate: '2025-02-06',
    lastStatusDate: '2025-02-06',
    statusDetails: '【2025-02-06】New request from Chen.',
  }
];
