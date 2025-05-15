import { getIdToken } from '@/modules/auth/services/authApiService';

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

// Get all users (admin only)
export const getUsers = async (filters?: {
  role?: string;
  companyId?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> => {
  try {
    const headers = await getAuthHeaders();
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (filters?.role) queryParams.append('role', filters.role);
    if (filters?.companyId) queryParams.append('companyId', filters.companyId);
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());
    if (filters?.offset) queryParams.append('offset', filters.offset.toString());
    
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
    
    const response = await fetch(`${API_BASE_URL}/users${queryString}`, {
      method: 'GET',
      headers
    });
    
    const data = await handleResponse(response);
    return data.users;
  } catch (error: any) {
    console.error('Error getting users:', error);
    throw new Error(`Failed to get users: ${error.message}`);
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers
    });
    
    const data = await handleResponse(response);
    return data.user;
  } catch (error: any) {
    console.error('Error getting user:', error);
    throw new Error(`Failed to get user: ${error.message}`);
  }
};

// Update user
export const updateUser = async (
  id: string,
  updates: {
    displayName?: string;
    phoneNumber?: string;
    email?: string;
  }
): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    });
    
    const data = await handleResponse(response);
    return data.user;
  } catch (error: any) {
    console.error('Error updating user:', error);
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

// Delete user (admin only)
export const deleteUser = async (id: string): Promise<void> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers
    });
    
    await handleResponse(response);
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

// Update user role (admin only)
export const updateUserRole = async (
  id: string,
  role: 'buyer' | 'supplier' | 'administrator'
): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/${id}/role`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ role })
    });
    
    const data = await handleResponse(response);
    return data.user;
  } catch (error: any) {
    console.error('Error updating user role:', error);
    throw new Error(`Failed to update user role: ${error.message}`);
  }
};

// Update user company
export const updateUserCompany = async (
  id: string,
  companyId: string
): Promise<any> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/${id}/company`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ companyId })
    });
    
    const data = await handleResponse(response);
    return data.user;
  } catch (error: any) {
    console.error('Error updating user company:', error);
    throw new Error(`Failed to update user company: ${error.message}`);
  }
};

// Get user counts by role (admin only)
export const getUserCountsByRole = async (): Promise<{
  buyer: number;
  supplier: number;
  administrator: number;
  total: number;
}> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/users/counts`, {
      method: 'GET',
      headers
    });
    
    const data = await handleResponse(response);
    return data.counts;
  } catch (error: any) {
    console.error('Error getting user counts:', error);
    throw new Error(`Failed to get user counts: ${error.message}`);
  }
};
