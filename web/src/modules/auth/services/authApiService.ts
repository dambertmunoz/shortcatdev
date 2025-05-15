import { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';

// API base URL - this should point to your Firebase Functions
const API_BASE_URL = '/api';

// Helper to get auth token
export const getIdToken = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No authenticated user');
  }
  return user.getIdToken();
};

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

// Register a new user
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  role: 'buyer' | 'supplier' | 'administrator',
  companyId?: string,
  phoneNumber?: string
): Promise<{ user: any }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        displayName,
        role,
        companyId,
        phoneNumber
      })
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error('Error registering user:', error);
    throw new Error(`Failed to register user: ${error.message}`);
  }
};

// Login user (after Firebase Auth login)
export const loginUser = async (uid: string): Promise<{ user: any, requiresTwoFactor?: boolean }> => {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ uid })
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error('Error logging in user:', error);
    throw new Error(`Failed to login user: ${error.message}`);
  }
};

// Setup two-factor authentication
export const setupTwoFactor = async (
  phoneNumber: string
): Promise<{ verificationCode: string }> => {
  try {
    const headers = await getAuthHeaders();
    const uid = auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('No authenticated user');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/setup-2fa`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        uid,
        phoneNumber
      })
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error('Error setting up 2FA:', error);
    throw new Error(`Failed to setup two-factor authentication: ${error.message}`);
  }
};

// Verify two-factor authentication code
export const verifyTwoFactor = async (
  verificationCode: string
): Promise<{ user: any }> => {
  try {
    const headers = await getAuthHeaders();
    const uid = auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('No authenticated user');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/verify-2fa`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        uid,
        verificationCode
      })
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error('Error verifying 2FA code:', error);
    throw new Error(`Failed to verify two-factor authentication: ${error.message}`);
  }
};

// Reset password
export const resetPassword = async (email: string): Promise<{ link: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email })
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error('Error resetting password:', error);
    throw new Error(`Failed to reset password: ${error.message}`);
  }
};

// Update user profile
export const updateProfile = async (
  displayName?: string,
  phoneNumber?: string
): Promise<{ user: any }> => {
  try {
    const headers = await getAuthHeaders();
    const uid = auth.currentUser?.uid;
    
    if (!uid) {
      throw new Error('No authenticated user');
    }
    
    const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        uid,
        displayName,
        phoneNumber
      })
    });
    
    return handleResponse(response);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    throw new Error(`Failed to update profile: ${error.message}`);
  }
};

// Check if user has 2FA enabled
export const checkTwoFactorStatus = async (): Promise<{ twoFactorEnabled: boolean, phoneNumber: string | null }> => {
  try {
    const checkTwoFactorStatus = httpsCallable(functions, 'checkTwoFactorStatus');
    const result = await checkTwoFactorStatus({});
    return result.data as { twoFactorEnabled: boolean, phoneNumber: string | null };
  } catch (error: any) {
    console.error('Error checking 2FA status:', error);
    throw new Error(`Failed to check two-factor authentication status: ${error.message}`);
  }
};

// Sync user data between Auth and Firestore
export const syncUserData = async (): Promise<{ success: boolean, message: string }> => {
  try {
    const syncUserData = httpsCallable(functions, 'syncUserData');
    const result = await syncUserData({});
    return result.data as { success: boolean, message: string };
  } catch (error: any) {
    console.error('Error syncing user data:', error);
    throw new Error(`Failed to sync user data: ${error.message}`);
  }
};
