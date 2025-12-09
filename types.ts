
export type Rank = 1 | 2 | 3 | 4 | 5; // 1 is Highest Importance, 5 is Lowest

export type CustomerStatus = 'Active' | 'Pending' | 'Inactive' | 'Prospect';

export type FollowUpStatus = 'My Turn' | 'Waiting for Customer' | 'No Action' | 'Scheduled';

export interface Contact {
  name: string;
  title: string;
  email?: string;
  phone?: string;
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

export interface Sample {
  id: string;
  customerId: string;
  customerName: string;
  
  // New Fields
  serialNumber?: string; // Customer specific serial
  status: SampleStatus;
  isTestFinished: boolean; // Test Finished vs Ongoing
  
  crystalType?: CrystalType;
  productCategory?: ProductCategory[]; // Multi-select
  productForm?: ProductForm;
  
  sampleName?: string; // Core info description
  sampleLabelId?: string; // Optional ID for label
  sampleLabelLink?: string; // Hyperlink for label PDF
  sampleDetails?: string; // Extra details
  
  quantity: string;
  application?: string; // Customer application
  
  lastStatusDate: string; // Date of status update
  statusDetails?: string; // Summary of status (me/them)
  
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
