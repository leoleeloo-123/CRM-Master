
import { Customer, Sample, MasterProduct, Exhibition, Expense, FXRate } from '../types';
import { format, addDays } from 'date-fns';

// Helper to get consistent dates relative to today
const today = new Date();
const dateStr = (days: number) => format(addDays(today, days), 'yyyy-MM-dd');

export const MOCK_EXHIBITIONS: Exhibition[] = [
  {
    id: 'exh_1',
    name: 'SEMICON 2026',
    date: '2026-03-20',
    location: 'Shanghai, China',
    link: 'https://www.semiconchina.org',
    eventSeries: ['Semicon'],
    summary: 'Major focus on advanced packaging materials and next-gen substrate polishing solutions.'
  },
  {
    id: 'exh_2',
    name: 'Optical Expo 2026',
    date: '2026-05-15',
    location: 'Frankfurt, Germany',
    link: 'https://www.world-of-photonics.com',
    eventSeries: ['Optical Expo'],
    summary: 'International trade fair for photonics components, focusing on high-precision lens finishing.'
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'Lumina Optics GmbH',
    region: ['Europe', 'Germany'],
    rank: 1, // 5 Stars
    status: 'Active',
    productSummary: 'Leading European developer of high-end optical lenses. Primary user of high-purity single crystal diamond powders for precision finishing. Currently validating our new Agglomerated Series for their Q4 production line.',
    lastStatusUpdate: dateStr(-2),
    followUpStatus: 'My Turn',
    contacts: [
      { name: 'Dr. Klaus Weber', title: 'Head of R&D', email: 'k.weber@lumina-optics.de', isPrimary: true },
      { name: 'Sarah Schmidt', title: 'Senior Procurement Manager', email: 's.schmidt@lumina-optics.de' }
    ],
    lastContactDate: dateStr(-5),
    lastCustomerReplyDate: dateStr(-10),
    lastMyReplyDate: dateStr(-5),
    nextActionDate: dateStr(0),
    tags: ['SEMICON 2026', 'Optical Expo 2026'],
    docLinks: [
      { title: 'Technical Validation Report v2.4', url: 'https://example.com/reports/pp-v24' },
      { title: 'Standard Operating Procedures', url: 'https://example.com/docs/sop-diamond' }
    ],
    upcomingPlan: 'Follow up on the Batch A-707 polishing results. Need to discuss bulk pricing tiers for the upcoming annual contract renewal.',
    interactions: [
      {
        id: 'i1',
        date: '2026-03-21',
        summary: '(标星记录)<展会相见>//SEMICON 2026{我方跟进}Met with Dr. Klaus at our booth. We discussed the wear rate issue found in the previous trial. He confirmed that the new 0.5um formula is performing 15% better than competitors.',
      },
      {
        id: 'i2',
        date: '2026-05-16',
        summary: '(一般记录)<展会相见>//Optical Expo 2026{对方回复}Quick touch-base during the networking event. Klaus introduced their new CEO. They are interested in exploring our spherical diamond series for their infrared lens project.',
      },
      {
        id: 'i3',
        date: dateStr(-15),
        summary: '(一般记录)<双方邮件>{对方回复}Customer confirmed receipt of the sample batch and verified that the packaging integrity was maintained during international transit.',
      }
    ]
  },
  {
    id: 'c2',
    name: 'Apex Wafer Systems',
    region: ['Asia', 'Taiwan'],
    rank: 1, // 5 Stars
    status: 'Active',
    productSummary: 'Top-tier semiconductor wafer manufacturer. High-volume consumer of Diamond Balls for specialized wire saw applications. Strategic partner for co-developing low-damage slurry additives.',
    lastStatusUpdate: dateStr(-1),
    followUpStatus: 'Waiting for Customer',
    contacts: [
      { name: 'Mark Chen', title: 'Director of Engineering', isPrimary: true },
      { name: 'Alice Wu', title: 'Process Engineer', email: 'a.wu@apex-systems.com.tw' }
    ],
    lastContactDate: dateStr(-1),
    lastCustomerReplyDate: dateStr(-1),
    lastMyReplyDate: dateStr(-8),
    nextActionDate: dateStr(3),
    tags: ['SEMICON 2026'],
    upcomingPlan: 'Waiting for the internal quality control review of the 80um cluster samples. Anticipating a volume order of 50kg if tests pass.',
    interactions: [
      {
        id: 'i4',
        date: '2026-03-22',
        summary: '(标星记录)<展会相见>//SEMICON 2026{对方回复}Mark brought his entire technical team to our booth. We performed a live comparison of the FastCut-X series. The team was impressed by the uniformity and requested an immediate quote for mass production.',
      },
      {
        id: 'i5',
        date: dateStr(-5),
        summary: '(一般记录)<视频会议>{我方跟进}Held a technical seminar for their junior engineers regarding the proper suspension preparation methods to ensure consistent results.',
      }
    ]
  },
  {
    id: 'c3',
    name: 'Titan Aerospace Finishings',
    region: ['North America', 'USA'],
    rank: 2, // 4 Stars
    status: 'Active',
    productSummary: 'Specializes in high-performance abrasives for the aerospace industry. Currently evaluating our Nano-Diamond Suspensions for turbine blade finishing.',
    lastStatusUpdate: dateStr(-20),
    followUpStatus: 'Scheduled',
    contacts: [
      { name: 'Jim Parsons', title: 'Process Lead', email: 'j.parsons@titan-aero.com' }
    ],
    lastContactDate: dateStr(-20),
    lastCustomerReplyDate: dateStr(-25),
    lastMyReplyDate: dateStr(-20),
    nextActionDate: dateStr(1),
    tags: ['Optical Expo 2026'],
    upcomingPlan: 'Scheduled a technical consultation call to review the long-term storage stability of slurry.',
    interactions: [
      {
        id: 'i6',
        date: '2026-05-16',
        summary: '(一般记录)<展会相见>//Optical Expo 2026{我方跟进}Jim visited our booth in Frankfurt to ask about the stability of our suspensions. Provided him with the latest data charts.',
      }
    ]
  }
];

export const MOCK_SAMPLES: Sample[] = [
  {
    id: 's1',
    customerId: 'c1',
    customerName: 'Lumina Optics GmbH',
    sampleIndex: 1,
    sampleName: 'Single Crystal Agglomerated Powder - 0.5um > 0.5um (SuperPolish A)',
    productType: 'Powder',
    specs: '0.5um High Purity',
    quantity: '500g',
    status: '样品制作中',
    testStatus: 'Ongoing',
    crystalType: '单晶',
    productCategory: ['团聚'],
    productForm: '微粉',
    originalSize: '0.5um',
    processedSize: '0.5um',
    nickname: 'SuperPolish A',
    isStarredSample: true,
    requestDate: dateStr(-30),
    lastStatusDate: dateStr(-5),
    nextActionDate: dateStr(0),
    upcomingPlan: 'Finalizing the lab analysis for surface roughness on silicon carbide substrates.',
    statusDetails: '【' + dateStr(-30) + '】Request received ||| 【' + dateStr(-25) + '】Production phase started ||| 【' + dateStr(-5) + '】Quality check initiated.',
    // Fee Info
    isPaid: true,
    feeCategory: '样品费用',
    feeType: '收入',
    actualUnitPrice: '2.5',
    standardUnitPrice: '3.0',
    originationDate: dateStr(-30),
    transactionDate: dateStr(-28),
    feeStatus: '已付款',
    currency: 'USD',
    balance: '1250',
    feeComment: 'Trial batch payment received.'
  },
  {
    id: 's2',
    customerId: 'c2',
    customerName: 'Apex Wafer Systems',
    sampleIndex: 1,
    sampleName: 'Polycrystalline Diamond Ball Powder - 80um > 80um (FastCut-X)',
    productType: 'Diamond Ball',
    specs: '80um Cluster',
    quantity: '2kg',
    status: '样品制作中',
    testStatus: 'Ongoing',
    crystalType: '多晶',
    productCategory: ['金刚石球'],
    productForm: '微粉',
    originalSize: '80um',
    processedSize: '80um',
    nickname: 'FastCut-X',
    requestDate: dateStr(-15),
    lastStatusDate: dateStr(-1),
    nextActionDate: dateStr(5),
    upcomingPlan: 'Analyze feedback regarding the cutting speed vs wire lifespan trade-off.',
    statusDetails: '【' + dateStr(-15) + '】Urgent request ||| 【' + dateStr(-1) + '】Material batching complete.',
    // Fee Info
    isPaid: true,
    feeCategory: '定制产品',
    feeType: '收入',
    actualUnitPrice: '450',
    standardUnitPrice: '500',
    originationDate: dateStr(-15),
    transactionDate: dateStr(-10),
    feeStatus: '已付款',
    currency: 'USD',
    balance: '900',
    feeComment: 'Custom formulation surcharge included.'
  }
];

export const MOCK_MASTER_PRODUCTS: MasterProduct[] = [
  {
    id: 'mp1',
    productName: 'Single Crystal Agglomerated Powder - 0.5um > 0.5um (SuperPolish A)',
    crystalType: '单晶',
    productCategory: ['团聚'],
    productForm: '微粉',
    originalSize: '0.5um',
    processedSize: '0.5um',
    nickname: 'SuperPolish A'
  }
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    category: 'Exhibition Booth',
    detail: 'Booth Rental & Build',
    expInc: '支出',
    party: 'Shanghai Expo Center',
    name: 'SEMICON 2026',
    originationDate: dateStr(-60),
    transactionDate: dateStr(-55),
    status: 'Paid',
    currency: 'CNY',
    balance: '45000',
    comment: 'Down payment for 36sqm corner booth.',
    link: '#'
  },
  {
    id: 'exp_2',
    category: 'Travel Expense',
    detail: 'Flights & Hotel',
    expInc: '支出',
    party: 'Trip.com',
    name: 'Team Travel - Germany',
    originationDate: dateStr(-12),
    transactionDate: dateStr(-10),
    status: 'Paid',
    currency: 'USD',
    balance: '3200',
    comment: 'Round-trip tickets for 2 engineers.',
    link: '#'
  },
  {
    id: 'exp_3',
    category: 'Material Procurement',
    detail: 'Raw Diamond Grit',
    expInc: '支出',
    party: 'Element Six Ltd',
    name: 'Batch Q3-Materials',
    originationDate: dateStr(-5),
    transactionDate: '',
    status: 'Pending',
    currency: 'USD',
    balance: '12500',
    comment: 'Standard procurement cycle.',
    link: '#'
  }
];

export const MOCK_FXRATES: FXRate[] = [
  { id: 'fx1', currency: 'USD', rateToUSD: 1.0, lastUpdated: dateStr(0) },
  { id: 'fx2', currency: 'CNY', rateToUSD: 0.138, lastUpdated: dateStr(0) },
  { id: 'fx3', currency: 'EUR', rateToUSD: 1.085, lastUpdated: dateStr(0) },
  { id: 'fx4', currency: 'HKD', rateToUSD: 0.128, lastUpdated: dateStr(0) },
  { id: 'fx5', currency: 'JPY', rateToUSD: 0.0064, lastUpdated: dateStr(0) }
];
