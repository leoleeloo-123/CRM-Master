
export type Rank = 1 | 2 | 3 | 4 | 5; // 1 is Highest Importance, 5 is Lowest

export type CustomerStatus = 'Active' | 'Pending' | 'Inactive' | 'Prospect' | string;

export type FollowUpStatus = 'My Turn' | 'Waiting for Customer' | 'No Action' | 'Scheduled' | string;

export interface Contact {
  name: string;
  title: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface Interaction {
  id: string;
  date: string;
  summary: string; // The "Process Summary" - Now formatted as (Star)<Type>{Effect}Content
  nextSteps?: string; 
  tags?: string[]; 
  docLinks?: string[]; 
}

export interface Exhibition {
  id: string;
  name: string;
  date: string;
  location: string;
  link: string;
  eventSeries?: string[]; 
  summary?: string; 
}

export interface Customer {
  id: string;
  name: string;
  region: string[]; 
  rank: Rank;
  status: CustomerStatus;
  productSummary: string; 
  lastStatusUpdate: string; 
  followUpStatus: FollowUpStatus; 
  contacts: Contact[];
  lastContactDate: string; 
  nextActionDate?: string; 
  lastCustomerReplyDate?: string; 
  lastMyReplyDate?: string; 
  tags: string[]; 
  interactions: Interaction[]; 
  docLinks?: SampleDocLink[]; 
  upcomingPlan?: string;
}

export type SampleStatus = 'Requested' | 'Processing' | 'Sent' | 'Delivered' | 'Testing' | 'Feedback Received' | 'Closed' | string;

export type CrystalType = 'Single Crystal' | 'Polycrystalline' | string;
export type ProductForm = 'Powder' | 'Suspension' | string;
export type ProductCategory = 'Agglomerated Diamond' | 'Nano Diamond' | 'Spherical Diamond' | 'Diamond Ball' | 'Micron' | 'CVD' | string;
export type GradingStatus = 'Graded' | 'Ungraded';
export type TestStatus = 'Ongoing' | 'Finished' | 'Terminated';

export interface MasterProduct {
  id: string;
  productName: string; 
  crystalType: CrystalType;
  productCategory: ProductCategory[];
  productForm: ProductForm;
  originalSize: string;
  processedSize?: string;
  nickname?: string;
}

export interface SampleDocLink {
  title: string;
  url: string;
}

export interface Sample {
  id: string;
  customerId: string;
  customerName: string;
  sampleIndex: number; 
  sampleSKU?: string; 
  status: SampleStatus;
  lastStatusDate: string; 
  statusDetails?: string; 
  testStatus: TestStatus; 
  crystalType?: CrystalType; 
  productCategory?: ProductCategory[]; 
  productForm?: ProductForm; 
  originalSize?: string; 
  processedSize?: string; 
  isGraded?: GradingStatus; 
  sampleName?: string; 
  sampleDetails?: string; 
  nickname?: string;
  quantity: string; 
  application?: string; 
  trackingNumber?: string;
  trackingLink?: string; 
  requestDate: string; 
  productType: string; 
  specs: string; 
  sentDate?: string;
  feedback?: string;
  feedbackDate?: string;
  upcomingPlan?: string;
  nextActionDate?: string;
  docLinks?: SampleDocLink[];
}

export interface TagOptions {
  sampleStatus: string[];
  crystalType: string[];
  productCategory: string[];
  productForm: string[];
  eventSeries: string[];
  interactionTypes: string[];   // New: <Type>
  interactionEffects: string[]; // New: {Effect}
}
