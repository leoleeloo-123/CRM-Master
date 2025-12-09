
import { Customer, Sample } from '../types';

// Mock Data updated to match new spreadsheet requirements
export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Pureon',
    region: 'Switzerland/USA',
    rank: 1,
    status: 'Active',
    productSummary: '[Status] Deep communication on pricing. 1. Polycrystalline made into agglomerated diamond (size 60um); 2. Suzhou factory single crystal purchase.',
    lastStatusUpdate: '2025-12-07',
    followUpStatus: 'My Turn',
    contacts: [
      { name: 'Christian', title: 'CEO', email: 'christian@pureon.com' },
      { name: 'William', title: 'Engineering Manager', email: 'william@pureon.com' }
    ],
    lastContactDate: '2025-01-20',
    lastCustomerReplyDate: '2024-12-02',
    lastMyReplyDate: '2025-01-20',
    nextActionDate: '2026-01-05',
    tags: ['Semicon West 2024', 'Ceramic Expo 2025', 'SPIE Optifab 2025'],
    docLinks: ['https://drive.google.com/file/d/pureon-meeting-notes'],
    interactions: [
      {
        id: 'i1',
        date: '2025-01-20',
        summary: 'Video meeting with Christian regarding polycrystalline agglomeration testing issues. Told them cleaning steps are needed.',
        nextSteps: 'Send new samples for testing.',
        docLinks: ['https://drive.google.com/notes/video-call-summary']
      },
      {
        id: 'i2',
        date: '2024-10-27',
        summary: 'Pureon sent 4 emails to follow up. CEO and Christian welcome a visit to Swiss HQ at year end.',
        tags: ['Email']
      }
    ]
  },
  {
    id: 'c2',
    name: 'Asahi Diamond',
    region: 'Japan',
    rank: 1,
    status: 'Active',
    productSummary: '[Status] Purchasing Diamond Balls. Specification 20/25 mesh. Pricing negotiation ongoing.',
    lastStatusUpdate: '2025-01-10',
    followUpStatus: 'Waiting for Customer',
    contacts: [
      { name: 'Nanako Shibuye', title: 'R&D', email: 'nanako@asahi.jp' },
      { name: 'Karen Sim', title: 'Procurement', email: 'karen@asahi.jp' }
    ],
    lastContactDate: '2024-12-10',
    lastCustomerReplyDate: '2024-12-05',
    lastMyReplyDate: '2024-12-10',
    nextActionDate: '2025-02-15',
    tags: ['Semicon Japan 2024'],
    interactions: [
      {
        id: 'i2',
        date: '2024-12-10',
        summary: 'Reviewing pricing for bulk order of Grade 180.',
        tags: ['Semicon Japan 2024']
      }
    ]
  },
  {
    id: 'c3',
    name: 'Noritake',
    region: 'Japan',
    rank: 2,
    status: 'Active',
    productSummary: 'Interested in Grinding Wheels for precision optics. 1. 5um Resin bond.',
    lastStatusUpdate: '2025-02-01',
    followUpStatus: 'My Turn',
    contacts: [
      { name: 'L. Keita Miyajima', title: 'General Manager' }
    ],
    lastContactDate: '2025-02-01',
    lastCustomerReplyDate: '2025-01-15',
    lastMyReplyDate: '2025-02-01',
    nextActionDate: '2025-03-01',
    tags: ['Semicon Japan 2024'],
    interactions: []
  },
  {
    id: 'c4',
    name: 'Mipox',
    region: 'Japan',
    rank: 1,
    status: 'Prospect',
    productSummary: 'Film / Slurry requirement. Need removal rate comparison data.',
    lastStatusUpdate: '2025-02-05',
    followUpStatus: 'No Action',
    contacts: [
      { name: 'Kaihori Makoto', title: 'Sales Specialist' }
    ],
    lastContactDate: '2025-02-05',
    lastCustomerReplyDate: '2025-02-05',
    nextActionDate: '2025-02-12',
    tags: ['Semicon West 2025'],
    interactions: [
      {
        id: 'i4',
        date: '2025-02-05',
        summary: 'Initial introduction at the booth. Interested in removal rate data.',
        tags: ['Semicon West 2025']
      }
    ]
  },
  {
    id: 'c5',
    name: 'Universal Photonics',
    region: 'USA',
    rank: 3,
    status: 'Pending',
    productSummary: 'Polishing pads inquiry. Waiting for R&D feedback on initial samples.',
    lastStatusUpdate: '2024-11-20',
    followUpStatus: 'Waiting for Customer',
    contacts: [
      { name: 'Floyd McClung', title: 'Director of R&D' }
    ],
    lastContactDate: '2024-11-20',
    lastCustomerReplyDate: '2024-11-15',
    lastMyReplyDate: '2024-11-20',
    nextActionDate: '2025-03-01',
    tags: ['SPIE Photonics West'],
    interactions: []
  }
];

export const MOCK_SAMPLES: Sample[] = [
  {
    id: 's1',
    customerId: 'c1',
    customerName: 'Pureon',
    sampleName: '1 um Cluster Powder',
    productType: 'Powder',
    specs: '1 um Cluster',
    quantity: '100g',
    status: 'Sent',
    isTestFinished: false,
    crystalType: 'Polycrystalline',
    productCategory: ['Agglomerated Diamond'],
    productForm: 'Powder',
    application: 'Pad Conditioning',
    requestDate: '2024-12-01',
    lastStatusDate: '2024-12-05',
    statusDetails: 'Sample sent via FedEx. Waiting for initial removal rate test.',
    trackingNumber: '77742123',
    trackingLink: 'https://fedex.com/track/77742123'
  },
  {
    id: 's2',
    customerId: 'c1',
    customerName: 'Pureon',
    sampleName: '1.5 um Micro Powder',
    productType: 'Powder',
    specs: '1.5 um',
    quantity: '50g',
    status: 'Feedback Received',
    isTestFinished: true,
    crystalType: 'Polycrystalline',
    productCategory: ['Micron'],
    productForm: 'Powder',
    application: 'Precision Polishing',
    requestDate: '2024-10-15',
    lastStatusDate: '2024-11-08',
    statusDetails: 'Removal rate is good, but surface finish needs improvement. Customer requesting finer grade.',
    feedback: 'Removal rate is good, but surface finish needs improvement.'
  },
  {
    id: 's3',
    customerId: 'c2',
    customerName: 'Asahi Diamond',
    sampleName: 'Gold Coated Diamond Balls',
    productType: 'Diamond Balls',
    specs: '20/25 mesh',
    quantity: '20g',
    status: 'Processing',
    isTestFinished: false,
    crystalType: 'Single Crystal',
    productCategory: ['Diamond Ball'],
    productForm: 'Powder',
    application: 'Wire Saw',
    requestDate: '2025-02-01',
    lastStatusDate: '2025-02-02',
    statusDetails: 'Coating process in progress. Expected completion next week.'
  },
  {
    id: 's4',
    customerId: 'c4',
    customerName: 'Mipox',
    sampleName: 'Nano Slurry Test A',
    productType: 'Slurry',
    specs: 'Nano Grade',
    quantity: '1 Liter',
    status: 'Requested',
    isTestFinished: false,
    crystalType: 'Single Crystal',
    productCategory: ['Nano Diamond'],
    productForm: 'Suspension',
    application: 'CMP',
    requestDate: '2025-02-07',
    lastStatusDate: '2025-02-07',
    statusDetails: 'New request from exhibition. Needs SDS documentation sent first.'
  }
];
