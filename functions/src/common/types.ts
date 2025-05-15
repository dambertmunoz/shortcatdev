import * as admin from 'firebase-admin';

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

// User roles
export enum UserRole {
  BUYER = 'buyer',
  SUPPLIER = 'supplier',
  ADMINISTRATOR = 'administrator'
}

// Requirement status
export enum RequirementStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Requirement priority
export enum RequirementPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Payment method
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  PURCHASE_ORDER = 'purchase_order',
  CASH = 'cash'
}

// Requirement item
export interface RequirementItem {
  id: string;
  requirementId: string;
  name: string;
  description?: string;
  quantity: number;
  unitOfMeasure: string;
  estimatedPrice?: number;
  currency?: string;
  category?: string;
  subcategory?: string;
  specifications?: Record<string, any>;
  attachments?: string[];
  createdAt: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

// Requirement approval
export interface RequirementApproval {
  id: string;
  requirementId: string;
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  createdAt: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
}

// Requirement
export interface Requirement {
  id: string;
  title: string;
  description?: string;
  status: RequirementStatus;
  priority: RequirementPriority;
  createdBy: string;
  createdByName: string;
  companyId?: string;
  costCenter?: string;
  paymentMethod?: PaymentMethod;
  warranty?: boolean;
  warrantyDuration?: number;
  additionalConditions?: string;
  attachments?: string[];
  items?: RequirementItem[];
  approvals?: RequirementApproval[];
  createdAt: admin.firestore.Timestamp;
  updatedAt?: admin.firestore.Timestamp;
  submittedAt?: admin.firestore.Timestamp;
  approvedAt?: admin.firestore.Timestamp;
  rejectedAt?: admin.firestore.Timestamp;
  completedAt?: admin.firestore.Timestamp;
  cancelledAt?: admin.firestore.Timestamp;
}
