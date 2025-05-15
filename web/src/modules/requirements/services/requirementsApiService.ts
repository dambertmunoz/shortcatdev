import { 
  Requirement, 
  RequirementFormData, 
  RequirementItem,
  RequirementStatus,
  RequirementApproval
} from '../types';
import { getIdToken } from '@/modules/auth/services/authService';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

// API base URL - this should point to your Firebase Functions
const API_BASE_URL = '/api';

// Helper to get auth headers
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const token = await getIdToken();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

// Helper to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || `API error: ${response.status}`);
  }
  return response.json();
};

// Get all requirements for a user
export const getRequirements = async (filters?: {
  status?: RequirementStatus;
  priority?: string;
  limit?: number;
  offset?: number;
}): Promise<Requirement[]> => {
  try {
    const headers = await getAuthHeaders();
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.priority) queryParams.append('priority', filters.priority);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.offset) queryParams.append('offset', filters.offset.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await fetch(`${API_BASE_URL}/requirements${queryString}`, {
      method: 'GET',
      headers
    });
    
    const data = await handleResponse(response);
    return data.requirements.map((req: any) => ({
      ...req,
      createdAt: new Date(req.createdAt),
      updatedAt: new Date(req.updatedAt),
      deliveryDate: req.deliveryDate ? new Date(req.deliveryDate) : undefined,
      submittedAt: req.submittedAt ? new Date(req.submittedAt) : undefined,
      approvedAt: req.approvedAt ? new Date(req.approvedAt) : undefined,
      rejectedAt: req.rejectedAt ? new Date(req.rejectedAt) : undefined,
      completedAt: req.completedAt ? new Date(req.completedAt) : undefined,
      cancelledAt: req.cancelledAt ? new Date(req.cancelledAt) : undefined,
      // Convert dates in approvals
      approvals: req.approvals ? req.approvals.map((approval: any) => ({
        ...approval,
        createdAt: new Date(approval.createdAt),
        updatedAt: approval.updatedAt ? new Date(approval.updatedAt) : undefined
      })) : []
    }));
  } catch (error: any) {
    console.error('Error getting requirements:', error);
    throw new Error(`Failed to get requirements: ${error.message}`);
  }
};

// Get a single requirement by ID
export const getRequirementById = async (id: string): Promise<Requirement> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${id}`, {
      method: 'GET',
      headers
    });
    
    const data = await handleResponse(response);
    const req = data.requirement;
    
    return {
      ...req,
      createdAt: new Date(req.createdAt),
      updatedAt: new Date(req.updatedAt),
      deliveryDate: req.deliveryDate ? new Date(req.deliveryDate) : undefined,
      submittedAt: req.submittedAt ? new Date(req.submittedAt) : undefined,
      approvedAt: req.approvedAt ? new Date(req.approvedAt) : undefined,
      rejectedAt: req.rejectedAt ? new Date(req.rejectedAt) : undefined,
      completedAt: req.completedAt ? new Date(req.completedAt) : undefined,
      cancelledAt: req.cancelledAt ? new Date(req.cancelledAt) : undefined,
      // Convert dates in items
      items: req.items ? req.items.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined
      })) : [],
      // Convert dates in approvals
      approvals: req.approvals ? req.approvals.map((approval: any) => ({
        ...approval,
        createdAt: new Date(approval.createdAt),
        updatedAt: approval.updatedAt ? new Date(approval.updatedAt) : undefined
      })) : []
    };
  } catch (error: any) {
    console.error('Error getting requirement:', error);
    throw new Error(`Failed to get requirement: ${error.message}`);
  }
};

// Create a new requirement
export const createRequirement = async (
  data: RequirementFormData
): Promise<string> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    
    const responseData = await handleResponse(response);
    return responseData.requirement.id;
  } catch (error: any) {
    console.error('Error creating requirement:', error);
    throw new Error(`Failed to create requirement: ${error.message}`);
  }
};

// Update an existing requirement
export const updateRequirement = async (
  id: string, 
  data: Partial<RequirementFormData>
): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    
    await handleResponse(response);
  } catch (error: any) {
    console.error('Error updating requirement:', error);
    throw new Error(`Failed to update requirement: ${error.message}`);
  }
};

// Delete a requirement
export const deleteRequirement = async (id: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${id}`, {
      method: 'DELETE',
      headers
    });
    
    await handleResponse(response);
  } catch (error: any) {
    console.error('Error deleting requirement:', error);
    throw new Error(`Failed to delete requirement: ${error.message}`);
  }
};

// Get requirement items
export const getRequirementItems = async (requirementId: string): Promise<RequirementItem[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/items`, {
      method: 'GET',
      headers
    });
    
    const data = await handleResponse(response);
    return data.items.map((item: any) => ({
      ...item,
      createdAt: new Date(item.createdAt),
      updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined
    }));
  } catch (error: any) {
    console.error('Error getting requirement items:', error);
    throw new Error(`Failed to get requirement items: ${error.message}`);
  }
};

// Add requirement item
export const addRequirementItem = async (
  requirementId: string,
  item: Omit<RequirementItem, 'id' | 'requirementId'>
): Promise<string> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify(item)
    });
    
    const data = await handleResponse(response);
    return data.item.id;
  } catch (error: any) {
    console.error('Error adding requirement item:', error);
    throw new Error(`Failed to add requirement item: ${error.message}`);
  }
};

// Update requirement item
export const updateRequirementItem = async (
  requirementId: string,
  itemId: string,
  item: Partial<RequirementItem>
): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/items/${itemId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(item)
    });
    
    await handleResponse(response);
  } catch (error: any) {
    console.error('Error updating requirement item:', error);
    throw new Error(`Failed to update requirement item: ${error.message}`);
  }
};

// Delete requirement item
export const deleteRequirementItem = async (
  requirementId: string,
  itemId: string
): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/items/${itemId}`, {
      method: 'DELETE',
      headers
    });
    
    await handleResponse(response);
  } catch (error: any) {
    console.error('Error deleting requirement item:', error);
    throw new Error(`Failed to delete requirement item: ${error.message}`);
  }
};

// Get requirement approvals
export const getRequirementApprovals = async (requirementId: string): Promise<RequirementApproval[]> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/approvals`, {
      method: 'GET',
      headers
    });
    
    const data = await handleResponse(response);
    return data.approvals.map((approval: any) => ({
      ...approval,
      createdAt: new Date(approval.createdAt),
      updatedAt: approval.updatedAt ? new Date(approval.updatedAt) : undefined
    }));
  } catch (error: any) {
    console.error('Error getting requirement approvals:', error);
    throw new Error(`Failed to get requirement approvals: ${error.message}`);
  }
};

// Submit requirement for approval
export const submitRequirementForApproval = async (requirementId: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/submit`, {
      method: 'PUT',
      headers
    });
    
    await handleResponse(response);
  } catch (error: any) {
    console.error('Error submitting requirement for approval:', error);
    throw new Error(`Failed to submit requirement for approval: ${error.message}`);
  }
};

// Approve requirement
export const approveRequirement = async (
  requirementId: string,
  comments?: string
): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/approve`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ comments })
    });
    
    await handleResponse(response);
  } catch (error: any) {
    console.error('Error approving requirement:', error);
    throw new Error(`Failed to approve requirement: ${error.message}`);
  }
};

// Reject requirement
export const rejectRequirement = async (
  requirementId: string,
  comments: string
): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/reject`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ comments })
    });
    
    await handleResponse(response);
  } catch (error: any) {
    console.error('Error rejecting requirement:', error);
    throw new Error(`Failed to reject requirement: ${error.message}`);
  }
};

// Cancel requirement
export const cancelRequirement = async (
  requirementId: string,
  reason?: string
): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/cancel`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ reason })
    });
    
    await handleResponse(response);
  } catch (error: any) {
    console.error('Error cancelling requirement:', error);
    throw new Error(`Failed to cancel requirement: ${error.message}`);
  }
};

// Complete requirement
export const completeRequirement = async (requirementId: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/requirements/${requirementId}/complete`, {
      method: 'PUT',
      headers
    });
    
    await handleResponse(response);
  } catch (error: any) {
    console.error('Error completing requirement:', error);
    throw new Error(`Failed to complete requirement: ${error.message}`);
  }
};

// Alternative implementation using Firebase Functions directly
// These can be used if you prefer to call Firebase Functions directly instead of via REST API

export const callRequirementsFunction = async (functionName: string, data: any) => {
  try {
    const callable = httpsCallable(functions, functionName);
    const result = await callable(data);
    return result.data;
  } catch (error: any) {
    console.error(`Error calling function ${functionName}:`, error);
    throw new Error(`Failed to call ${functionName}: ${error.message}`);
  }
};

// Example of using Firebase Functions directly:
// export const getRequirementsViaFunction = async () => {
//   return callRequirementsFunction('getRequirements', {});
// };
