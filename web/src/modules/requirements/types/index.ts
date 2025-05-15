export type RequirementStatus = 'draft' | 'pending_approval' | 'approved' | 'in_process' | 'completed' | 'cancelled';
export type CriticalityLevel = 'low' | 'medium' | 'high';
export type PaymentMethod = 'transfer' | 'credit_card' | 'cash' | 'check';

export interface RequirementItem {
  id: string;
  name: string;
  description: string;
  specificDescription?: string;
  quantity: number;
  unitOfMeasure: string;
  deliveryDate: Date;
  criticality: CriticalityLevel;
  costCenter: string;
  estimatedPrice?: number;
  totalEstimatedPrice?: number;
  location?: string;
  additionalInfo?: Record<string, any>;
}

export interface Requirement {
  id: string;
  code: string;
  title: string;
  status: RequirementStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deliveryDate?: Date;
  costCenter: string;
  criticality: CriticalityLevel;
  items: RequirementItem[];
  paymentMethod: PaymentMethod;
  paymentTerm: string; // e.g., "30 days"
  warranty: boolean;
  additionalConditions?: string[];
  approvals: RequirementApproval[];
  totalEstimatedPrice?: number;
}

export interface RequirementApproval {
  id: string;
  requirementId: string;
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  timestamp: Date;
}

export interface RequirementsState {
  requirements: Requirement[];
  currentRequirement: Requirement | null;
  loading: boolean;
  error: string | null;
}

export interface RequirementFormData {
  title: string;
  deliveryDate?: Date;
  costCenter: string;
  criticality: CriticalityLevel;
  paymentMethod: PaymentMethod;
  paymentTerm: string;
  warranty: boolean;
  additionalConditions?: string[];
  items: RequirementItemFormData[];
}

export interface RequirementItemFormData {
  name: string;
  description: string;
  specificDescription?: string;
  quantity: number;
  unitOfMeasure: string;
  deliveryDate: Date;
  criticality: CriticalityLevel;
  costCenter: string;
  estimatedPrice?: number;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
}
