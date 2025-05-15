import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Cloud function to create a user record in Firestore when a new user is created in Auth
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  try {
    // Check if user already has a Firestore record
    const userDoc = await admin.firestore().collection('users').doc(user.uid).get();
    
    if (userDoc.exists) {
      console.log(`User ${user.uid} already has a Firestore record`);
      return null;
    }
    
    // Create user record in Firestore
    const userData = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber || '',
      role: 'buyer', // Default role
      twoFactorEnabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await admin.firestore().collection('users').doc(user.uid).set(userData);
    
    console.log(`Created Firestore record for user ${user.uid}`);
    return null;
  } catch (error) {
    console.error('Error creating user record:', error);
    return null;
  }
});

// Cloud function to delete user data when a user is deleted from Auth
export const onUserDelete = functions.auth.user().onDelete(async (user) => {
  try {
    // Delete user record from Firestore
    await admin.firestore().collection('users').doc(user.uid).delete();
    
    // Delete 2FA codes
    await admin.firestore().collection('twoFactorCodes').doc(user.uid).delete();
    
    console.log(`Deleted Firestore records for user ${user.uid}`);
    return null;
  } catch (error) {
    console.error('Error deleting user records:', error);
    return null;
  }
});

// Cloud function to check if a user has 2FA enabled
export const checkTwoFactorStatus = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  try {
    const uid = data.uid || context.auth.uid;
    
    // Get user from Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User not found'
      );
    }
    
    const userData = userDoc.data();
    
    return {
      twoFactorEnabled: userData?.twoFactorEnabled || false,
      phoneNumber: userData?.phoneNumber || null
    };
  } catch (error: any) {
    console.error('Error checking 2FA status:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to check two-factor authentication status'
    );
  }
});
