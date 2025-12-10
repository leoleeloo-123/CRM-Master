
export type Rank = 1 | 2 | 3 | 4 | 5; // 1 is Highest Importance, 5 is Lowest

export type CustomerStatus = 'Active' | 'Pending' | 'Inactive' | 'Prospect';

export type FollowUpStatus = 'My Turn' | 'Waiting for Customer' | 'No Action' | 'Scheduled';

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
  summary: string; // The "Process Summary"
  nextSteps?: string;
  tags?: string[]; 
  docLinks?: string[]; // Hyperlinks to docs
}

export interface Customer {
  id: string;
  name: string;
  region: string[]; // Changed to string array to support multiple regions
  rank: Rank;
  status: CustomerStatus;
  
  // New/Updated Fields based on spreadsheet
  productSummary: string; // "Status & Product Summary"
  lastStatusUpdate: string; // Date of last edit to summary
  
  followUpStatus: FollowUpStatus; // "Status" column (My turn vs Their turn)
  
  contacts: Contact[];
  
  // Tracking Dates
  lastContactDate: string; // General last contact
  nextActionDate?: string; // "Key Date"
  lastCustomerReplyDate?: string; // For "Unreplied" calculation
  lastMyReplyDate?: string; // For "Unfollowed" calculation
  
  tags: string[]; // Exhibitions
  interactions: Interaction[]; // "Connection Process Summary"
  
  docLinks?: string[]; // General document links for the company
}

export type SampleStatus = 'Requested' | 'Processing' | 'Sent' | 'Delivered' | 'Testing' | 'Feedback Received' | 'Closed';

export type CrystalType = 'Single Crystal' | 'Polycrystalline';
export type ProductForm = 'Powder' | 'Suspension';
export type ProductCategory = 'Agglomerated Diamond' | 'Nano Diamond' | 'Spherical Diamond' | 'Diamond Ball' | 'Micron' | 'CVD';
export type GradingStatus = 'Graded' | 'Ungraded';

// New Master Product Catalog Interface
export interface MasterProduct {
  id: string;
  productName: string; // Unique Key
  crystalType: CrystalType;
  productCategory: ProductCategory[];
  productForm: ProductForm;
  originalSize: string;
  processedSize?: string;
}

export interface Sample {
  id: string;
  customerId: string;
  customerName: string;
  
  // -- New Fields per latest request --
  sampleIndex: number; // Integer, used for sorting per customer
  sampleSKU?: string; // Internal SKU
  
  status: SampleStatus;
  lastStatusDate: string; // Date of status update
  statusDetails?: string; // "【Date】Details ||| 【Date】Details"
  
  isTestFinished: boolean; // Test Finished vs Ongoing
  
  // Technical Specs
  crystalType?: CrystalType; // Single/Poly
  productCategory?: ProductCategory[]; // Multi-select
  productForm?: ProductForm; // Powder/Suspension
  originalSize?: string; // e.g. "10um"
  processedSize?: string; // e.g. "50nm"
  isGraded?: GradingStatus; // Graded/Ungraded
  
  sampleName?: string; // Core info description (Generated or Mapped)
  sampleDetails?: string; // Extra details (Mapped from 'Details')
  
  // Logistics & Metadata
  quantity: string; // 10 ct, 50 g, etc.
  application?: string; // Customer application
  
  trackingNumber?: string;
  
  trackingLink?: string; // Hyperlink for tracking

  // Legacy fields kept for compatibility or mapped
  requestDate: string; 
  productType: string; // Mapped to productCategory string representation
  specs: string; // Mapped to sampleName/Details
  sentDate?: string;
  feedback?: string;
  feedbackDate?: string;
}

export interface DashboardStats {
  totalCustomers: number;
  activeSamples: number;
  upcomingActions: number;
  overdueActions: number;
}
