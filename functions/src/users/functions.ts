import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Cloud function to sync user data between Auth and Firestore
export const syncUserData = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  try {
    const { uid } = context.auth;
    
    // Get user from Auth
    const userRecord = await admin.auth().getUser(uid);
    
    // Get user from Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    // If user doesn't exist in Firestore, create it
    if (!userDoc.exists) {
      await admin.firestore().collection('users').doc(uid).set({
        email: userRecord.email || '',
        displayName: userRecord.displayName || '',
        photoURL: userRecord.photoURL || '',
        emailVerified: userRecord.emailVerified,
        phoneNumber: userRecord.phoneNumber || '',
        role: userRecord.customClaims?.role || 'buyer',
        twoFactorEnabled: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, message: 'User created in Firestore' };
    }
    
    // Update user in Firestore
    const updates: Record<string, any> = {
      email: userRecord.email || userDoc.data()?.email,
      displayName: userRecord.displayName || userDoc.data()?.displayName,
      photoURL: userRecord.photoURL || userDoc.data()?.photoURL,
      emailVerified: userRecord.emailVerified,
      phoneNumber: userRecord.phoneNumber || userDoc.data()?.phoneNumber,
      role: userRecord.customClaims?.role || userDoc.data()?.role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await admin.firestore().collection('users').doc(uid).update(updates);
    
    return { success: true, message: 'User synced successfully' };
  } catch (error: any) {
    console.error('Error syncing user data:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to sync user data'
    );
  }
});

// Cloud function to get user role
export const getUserRole = functions.https.onCall(async (data, context) => {
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
      role: userData?.role || 'buyer'
    };
  } catch (error: any) {
    console.error('Error getting user role:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to get user role'
    );
  }
});

// Cloud function to count users by role
export const countUsersByRole = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated and is an administrator
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  if (context.auth.token.role !== 'administrator') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only administrators can access this function.'
    );
  }
  
  try {
    const counts: Record<string, number> = {
      buyer: 0,
      supplier: 0,
      administrator: 0,
      total: 0
    };
    
    // Count buyers
    const buyersSnapshot = await admin.firestore()
      .collection('users')
      .where('role', '==', 'buyer')
      .get();
    
    counts.buyer = buyersSnapshot.size;
    
    // Count suppliers
    const suppliersSnapshot = await admin.firestore()
      .collection('users')
      .where('role', '==', 'supplier')
      .get();
    
    counts.supplier = suppliersSnapshot.size;
    
    // Count administrators
    const adminsSnapshot = await admin.firestore()
      .collection('users')
      .where('role', '==', 'administrator')
      .get();
    
    counts.administrator = adminsSnapshot.size;
    
    // Calculate total
    counts.total = counts.buyer + counts.supplier + counts.administrator;
    
    return counts;
  } catch (error: any) {
    console.error('Error counting users by role:', error);
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Failed to count users by role'
    );
  }
});
