// src/lib/types.ts
// Portfolio and Product Types for the XML configuration
export interface Product {
  id: string;
  name: string;
  description?: string;
  metrics: Metric[]; // Updated to use the new Metric interface
  roadmap: Roadmap[];
  releaseGoals: ReleaseGoal[];
  releasePlans: ReleasePlan[];
  releaseNotes: ReleaseNote[];
  objectives?: ProductObjective[]; // Add objectives to Product type
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  products: Product[];
}

// Renamed from Metric to MetricItem
export interface MetricItem {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  unit: string;
  timestamp: string;
  description?: string;
  monthlyTarget?: number;
  annualTarget?: number;
  status?: "on-track" | "at-risk" | "off-track";
  notes?: string;
  source?: string;
  category?: string;
  owner?: string;
}

// New Metric interface to group MetricItems and hold versioning
export interface Metric {
  id: string;
  month: number;
  year: number;
  createdAt: string;
  version: number;
  metricItems: MetricItem[]; // Array of individual metric items
}

export interface Roadmap {
  id: string;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'delayed';
  createdAt: string;
  version: string;
  link?: string;
}

export interface RoadmapItem {
  id: string;
  quarter: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  status: 'planned' | 'in-progress' | 'completed' | 'delayed';
}

export interface ReleaseGoal {
  id: string;
  name?: string;
  month: number;
  year: number;
  description: string;
  currentState: string;
  targetState: string;
  status?: 'planned' | 'in-progress' | 'completed' | 'delayed';
  owner?: string;
  priority?: string;
  category?: string;
  createdAt: string;
  version: number;
  remarks?: string;
  
  // For supporting nested goals structure
  goals?: GoalItem[];
  
  // For backward compatibility with old data format
  goal?: string;
  futureState?: string;
}

export interface ReleasePlan {
  id: string;
  name?: string;
  month: number;
  year: number;
  title: string;
  description: string;
  category?: 'Enhancement' | 'Bug' | 'Improvement' | 'Clarification' | 'Training';
  priority?: 'High' | 'Medium' | 'Low';
  source?: 'Internal' | 'Customer' | 'Market' | 'Regulatory' | 'Other';
  targetDate: string;
  owner?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'delayed';
  createdAt: string;
  version: number;
  remarks?: string;
  
  // For supporting nested items structure
  items?: ReleasePlanItem[];
}

export interface ReleaseNote {
  id: string;
  month: number;
  year: number;
  highlights: string;
  title: string;
  description: string;
  type: 'feature' | 'enhancement' | 'fix' | 'other';
  createdAt: string;
  version: number;
  link?: string;
  
  // For supporting nested details structure
  details?: ReleaseNoteDetail[];
}

export interface ReleaseNoteDetail {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'enhancement' | 'fix' | 'other';
}

// Item types for components that expect nested structures
export interface GoalItem {
  id: string;
  description: string;
  currentState: string;
  targetState: string;
  status?: 'planned' | 'in-progress' | 'completed' | 'delayed';
  owner?: string;
  priority?: string;
  category?: string;
}

export interface ReleasePlanItem {
  id: string;
  title: string;
  description: string;
  category?: 'Enhancement' | 'Bug' | 'Improvement' | 'Clarification' | 'Training';
  priority?: 'High' | 'Medium' | 'Low';
  source?: 'Internal' | 'Customer' | 'Market' | 'Regulatory' | 'Other';
  targetDate: string;
  owner?: string;
  status: 'planned' | 'in-progress' | 'completed' | 'delayed';
}

// OKR Types
export interface Initiative {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
}

export interface ExpectedBenefit {
  id: string;
  title: string;
  description: string;
  targetValue: string;
  metricType: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
}

export interface ProductObjective {
  id: string;
  title: string;
  description: string;
  productId: string;
  initiatives: Initiative[];
  expectedBenefits: ExpectedBenefit[];
  status: 'Not Started' | 'In Progress' | 'Completed';
  priority: number;
  createdAt: string; // Add createdAt field for versioning
  version: number;   // Add version field for versioning
}

// Search types
export interface SearchResult {
  type: 'product' | 'portfolio';
  id: string;
  name: string;
  portfolioId?: string;
  portfolioName?: string;
  matchField?: string;
  matchValue?: string;
  semanticScore?: number;
  semanticText?: string;
}
