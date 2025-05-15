import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AuthState, User, UserRole } from '../types';
import { registerUser, signIn, signOut } from '../services/authService';

// Create the auth store
const useAuthStore = create<AuthState & {
  initialize: () => void;
  register: (email: string, password: string, displayName: string, role: UserRole, companyId?: string, phoneNumber?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}>((set) => ({
  user: null,
  loading: true,
  error: null,

  // Initialize the auth state
  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Get additional user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.data();

          const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL || '',
            emailVerified: firebaseUser.emailVerified,
            role: (userData?.role as UserRole) || 'buyer',
            companyId: userData?.companyId || '',
            phoneNumber: firebaseUser.phoneNumber || userData?.phoneNumber || '',
            twoFactorEnabled: userData?.twoFactorEnabled || false,
            createdAt: userData?.createdAt?.toDate() || new Date(),
            lastLoginAt: userData?.lastLoginAt?.toDate() || undefined,
          };

          set({ user, loading: false, error: null });
        } else {
          set({ user: null, loading: false, error: null });
        }
      } catch (error: any) {
        set({ user: null, loading: false, error: error.message });
      }
    });

    // Return unsubscribe function to clean up on unmount
    return () => unsubscribe();
  },

  // Register a new user
  register: async (email, password, displayName, role, companyId, phoneNumber) => {
    set({ loading: true, error: null });
    try {
      const user = await registerUser({
        email,
        password,
        displayName,
        role,
        companyId,
        phoneNumber
      });
      set({ user, loading: false, error: null });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Login a user
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = await signIn({ email, password });
      set({ user, loading: false, error: null });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Logout the current user
  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut();
      set({ user: null, loading: false, error: null });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  }
}));

export default useAuthStore;
