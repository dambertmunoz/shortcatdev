import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  multiFactor,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  RecaptchaVerifier,
  getIdToken as firebaseGetIdToken
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User, LoginCredentials, RegisterData, UserRole } from '../types';

// Convert Firebase user to our User type
const mapFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  // Get additional user data from Firestore
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  const userData = userDoc.data();

  return {
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
};

// Register a new user
export const registerUser = async (data: RegisterData): Promise<User> => {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );
    
    // Update profile with display name
    if (userCredential.user && data.displayName) {
      await updateProfile(userCredential.user, {
        displayName: data.displayName
      });
    }
    
    // Store additional user data in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      companyId: data.companyId || null,
      phoneNumber: data.phoneNumber || null,
      twoFactorEnabled: false,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
    
    return await mapFirebaseUserToUser(userCredential.user);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to register user');
  }
};

// Sign in a user
export const signIn = async (credentials: LoginCredentials): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      credentials.email,
      credentials.password
    );
    
    // Update last login timestamp
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      lastLoginAt: serverTimestamp()
    }, { merge: true });
    
    return await mapFirebaseUserToUser(userCredential.user);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign out the current user
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

// Setup 2FA with phone number
export const setupTwoFactor = async (phoneNumber: string, recaptchaContainer: HTMLElement): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Create a RecaptchaVerifier instance
    const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
      size: 'normal',
      callback: () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
    
    // Get multi-factor session
    const multiFactorUser = multiFactor(user);
    const session = await multiFactorUser.getSession();
    
    // Setup phone auth provider
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneAuthProvider.verifyPhoneNumber({
      phoneNumber,
      session
    }, recaptchaVerifier);
    
    // Update user document to indicate 2FA is being set up
    await setDoc(doc(db, 'users', user.uid), {
      phoneNumber,
      twoFactorSetupPending: true
    }, { merge: true });
    
    return verificationId;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to setup two-factor authentication');
  }
};

// Complete 2FA setup with verification code
export const completeTwoFactorSetup = async (verificationId: string, verificationCode: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    // Get credential from verification
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
    
    // Enroll the multi-factor auth
    const multiFactorUser = multiFactor(user);
    await multiFactorUser.enroll(multiFactorAssertion, 'Phone Number');
    
    // Update user document to indicate 2FA is enabled
    await setDoc(doc(db, 'users', user.uid), {
      twoFactorEnabled: true,
      twoFactorSetupPending: false
    }, { merge: true });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to complete two-factor authentication setup');
  }
};

// Get the current user's ID token for API authentication
export const getIdToken = async (): Promise<string> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user');
  }
  
  try {
    return await firebaseGetIdToken(currentUser);
  } catch (error) {
    console.error('Error getting ID token:', error);
    throw error;
  }
};
