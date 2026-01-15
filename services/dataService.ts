
import { Customer, Sample, MasterProduct } from '../types';
import { format, addDays, subDays } from 'date-fns';

// Helper to get consistent dates relative to today for demo purposes
const today = new Date();
const dateStr = (days: number) => format(addDays(today, days), 'yyyy-MM-dd');

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Precision Photonics Ltd',
    region: ['Europe', 'Germany'],
    rank: 1,
    status: 'Active',
    productSummary: 'Primary user of high-purity single crystal powders for lens polishing. Currently testing the new Agglomerated Series for next-gen optics.',
    lastStatusUpdate: dateStr(-2),
    followUpStatus: 'My Turn',
    contacts: [
      { name: 'Dr. Klaus Weber', title: 'Head of R&D', email: 'k.weber@photonics.de', isPrimary: true },
      { name: 'Sarah Schmidt', title: 'Procurement', email: 's.schmidt@photonics.de' }
    ],
    lastContactDate: dateStr(-5),
    lastCustomerReplyDate: dateStr(-10),
    lastMyReplyDate: dateStr(-5),
    nextActionDate: dateStr(0), // Today - Shows in Daily Agenda
    tags: ['SEMICON 2024', 'Laser World of Photonics'],
    docLinks: [
      { title: 'Technical Spec Sheet v2', url: 'https://example.com/specs' },
      { title: 'SLA Agreement', url: 'https://example.com/sla' }
    ],
    upcomingPlan: 'Follow up on the 500g sample results. Need to discuss bulk pricing for Q3 if results meet the 0.5nm roughness target.',
    interactions: [
      {
        id: 'i1',
        date: dateStr(-5),
        summary: '(标星记录)<Our Email>{Our Follow-up}Sent revised technical datasheet and confirmed arrival of Batch A samples.',
      },
      {
        id: 'i2',
        date: dateStr(-15),
        summary: '(一般记录)<Customer Email>{Customer Reply}Customer confirmed that current removal rates are acceptable but they want better surface finish.',
      }
    ]
  },
  {
    id: 'c2',
    name: 'Global Wafer Solutions',
    region: ['Asia', 'Taiwan'],
    rank: 1,
    status: 'Active',
    productSummary: 'Massive demand for Diamond Balls in wire saw applications. Exploring transition to Spherical Diamond for higher efficiency.',
    lastStatusUpdate: dateStr(-1),
    followUpStatus: 'Waiting for Customer',
    contacts: [
      { name: 'Mark Chen', title: 'Engineering Director', isPrimary: true }
    ],
    lastContactDate: dateStr(-1),
    lastCustomerReplyDate: dateStr(-1),
    lastMyReplyDate: dateStr(-8),
    nextActionDate: dateStr(3), // Thursday/Friday depending on when run
    tags: ['Semicon Taiwan'],
    upcomingPlan: 'Customer is reviewing the cost-benefit analysis of switching to Spherical Diamond. Expecting feedback by end of week.',
    interactions: [
      {
        id: 'i3',
        date: dateStr(-1),
        summary: '(标星记录)<Customer Email>{Customer Reply}Mark sent the preliminary testing data. The wear rate is 15% lower than competition.',
      }
    ]
  },
  {
    id: 'c3',
    name: 'Innovative Abrasives Inc',
    region: ['North America', 'USA'],
    rank: 2,
    status: 'Active',
    productSummary: 'Focus on Suspension and Slurry products. Testing "Batch 707" for aerospace turbine polishing.',
    lastStatusUpdate: dateStr(-20),
    followUpStatus: 'Scheduled',
    contacts: [
      { name: 'Jim Parsons', title: 'Process Engineer', email: 'j.parsons@inn-abrasives.com' }
    ],
    lastContactDate: dateStr(-20),
    lastCustomerReplyDate: dateStr(-25),
    lastMyReplyDate: dateStr(-20),
    nextActionDate: dateStr(1), // Tomorrow
    tags: ['IMTS 2024'],
    upcomingPlan: 'Scheduled technical call to review the suspension stability issues reported last month.',
    interactions: []
  },
  {
    id: 'c4',
    name: 'NanoTech Materials',
    region: ['Asia', 'Japan'],
    rank: 3,
    status: 'Pending',
    productSummary: 'Interested in CVD Diamond components for thermal management. Initial discussions phase.',
    lastStatusUpdate: dateStr(-45),
    followUpStatus: 'No Action',
    contacts: [
      { name: 'Sato-san', title: 'R&D', isPrimary: true }
    ],
    lastContactDate: dateStr(-45),
    lastCustomerReplyDate: dateStr(-50),
    lastMyReplyDate: dateStr(-45),
    nextActionDate: dateStr(14), // Farther out
    tags: ['JPCA Show'],
    upcomingPlan: 'Re-engage in two weeks once their project budget is finalized.',
    interactions: []
  },
  {
    id: 'c5',
    name: 'Advanced Tools Corp',
    region: ['Europe', 'France'],
    rank: 4,
    status: 'Prospect',
    productSummary: 'Potential lead from exhibition. Interested in Micron powders for dental tool manufacturing.',
    lastStatusUpdate: dateStr(-5),
    followUpStatus: 'My Turn',
    contacts: [
      { name: 'Marie Curie', title: 'Product Lead' }
    ],
    lastContactDate: dateStr(-5),
    lastCustomerReplyDate: undefined,
    lastMyReplyDate: dateStr(-5),
    nextActionDate: dateStr(0), // Today
    tags: ['IDS Cologne'],
    upcomingPlan: 'Send company intro and standard catalog for Micron series.',
    interactions: [
      {
        id: 'i5',
        date: dateStr(-5),
        summary: '(一般记录)<Met at Exhibition>{Established Contact}Met at IDS. Marie requested catalog and price list for dental applications.',
      }
    ]
  }
];

export const MOCK_SAMPLES: Sample[] = [
  {
    id: 's1',
    customerId: 'c1',
    customerName: 'Precision Photonics Ltd',
    sampleIndex: 1,
    sampleName: 'Single Crystal Agglomerated Diamond Powder - 0.5um > 0.5um (SuperPolish A)',
    productType: 'Powder',
    specs: '0.5um High Purity',
    quantity: '500g',
    status: 'Testing',
    testStatus: 'Ongoing',
    crystalType: 'Single Crystal',
    productCategory: ['Agglomerated Diamond'],
    productForm: 'Powder',
    originalSize: '0.5um',
    processedSize: '0.5um',
    nickname: 'SuperPolish A',
    isStarredSample: true, // Starred - Syncs with Customer DDL
    isGraded: 'Graded',
    application: 'Sapphire Lens Polishing',
    sampleDetails: 'Strict PSD control required. Narrow distribution.',
    requestDate: dateStr(-30),
    lastStatusDate: dateStr(-5),
    nextActionDate: dateStr(0), // Synced with Customer c1
    upcomingPlan: 'Wait for lab report on Batch A surface roughness.',
    statusDetails: '【' + dateStr(-30) + '】Request received ||| 【' + dateStr(-25) + '】Production started ||| 【' + dateStr(-10) + '】Sample shipped via DHL',
    trackingNumber: 'DHL-99882211'
  },
  {
    id: 's2',
    customerId: 'c2',
    customerName: 'Global Wafer Solutions',
    sampleIndex: 1,
    sampleName: 'Polycrystalline Diamond Ball Powder - 80um > 80um (FastCut-X)',
    productType: 'Diamond Ball',
    specs: '80um Cluster',
    quantity: '2kg',
    status: 'Feedback Received',
    testStatus: 'Ongoing',
    crystalType: 'Polycrystalline',
    productCategory: ['Diamond Ball'],
    productForm: 'Powder',
    originalSize: '80um',
    processedSize: '80um',
    nickname: 'FastCut-X',
    isStarredSample: false,
    isGraded: 'Graded',
    application: 'Silicon Wafer Dicing',
    requestDate: dateStr(-15),
    lastStatusDate: dateStr(-1),
    nextActionDate: dateStr(5), // Custom Sample DDL
    upcomingPlan: 'Analyze feedback from engineer regarding cutting speed vs life-time.',
    statusDetails: '【' + dateStr(-15) + '】Request ||| 【' + dateStr(-1) + '】First results received - very positive speed improvement.',
    trackingNumber: 'UPS-1234567'
  },
  {
    id: 's3',
    customerId: 'c3',
    customerName: 'Innovative Abrasives Inc',
    sampleIndex: 1,
    sampleName: 'Single Crystal Nano Diamond Suspension - 20nm > 20nm (Aerospace Slurry v4)',
    productType: 'Suspension',
    specs: '20nm water-based',
    quantity: '5L',
    status: 'Processing',
    testStatus: 'Ongoing',
    crystalType: 'Single Crystal',
    productCategory: ['Nano Diamond'],
    productForm: 'Suspension',
    originalSize: '20nm',
    processedSize: '20nm',
    nickname: 'Aerospace Slurry v4',
    isStarredSample: true, // Starred
    isGraded: 'Ungraded',
    application: 'Aerospace Components',
    requestDate: dateStr(-5),
    lastStatusDate: dateStr(-2),
    nextActionDate: dateStr(1), // Synced with Customer c3
    upcomingPlan: 'Finish mixing Batch 707 and ship by end of week.',
    statusDetails: '【' + dateStr(-5) + '】Urgent request for high-stability formula.'
  }
];

export const MOCK_MASTER_PRODUCTS: MasterProduct[] = [
  {
    id: 'mp1',
    productName: 'Single Crystal Agglomerated Diamond Powder - 0.5um > 0.5um (SuperPolish A)',
    crystalType: 'Single Crystal',
    productCategory: ['Agglomerated Diamond'],
    productForm: 'Powder',
    originalSize: '0.5um',
    processedSize: '0.5um',
    nickname: 'SuperPolish A'
  },
  {
    id: 'mp2',
    productName: 'Polycrystalline Diamond Ball Powder - 80um > 80um (FastCut-X)',
    crystalType: 'Polycrystalline',
    productCategory: ['Diamond Ball'],
    productForm: 'Powder',
    originalSize: '80um',
    processedSize: '80um',
    nickname: 'FastCut-X'
  },
  {
    id: 'mp3',
    productName: 'Single Crystal Nano Diamond Suspension - 20nm > 20nm (Aerospace Slurry v4)',
    crystalType: 'Single Crystal',
    productCategory: ['Nano Diamond'],
    productForm: 'Suspension',
    originalSize: '20nm',
    processedSize: '20nm',
    nickname: 'Aerospace Slurry v4'
  }
];
