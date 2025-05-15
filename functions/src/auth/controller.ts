import { Request, Response } from 'express';
import * as admin from 'firebase-admin';

// User registration
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, displayName, role, companyId, phoneNumber } = req.body;

    // Validate required fields
    if (!email || !password || !displayName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate role
    if (!['buyer', 'supplier', 'administrator'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      phoneNumber
    });

    // Set custom claims for role
    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    // Store additional user data in Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      role,
      companyId: companyId || null,
      phoneNumber: phoneNumber || null,
      twoFactorEnabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName
      }
    });
  } catch (error: any) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: error.message || 'Failed to register user' });
  }
};

// User login
export const login = async (req: Request, res: Response) => {
  try {
    const { uid } = req.body;

    // Validate required fields
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get user from Firestore
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Update last login timestamp
    await admin.firestore().collection('users').doc(uid).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Check if 2FA is enabled
    if (userData?.twoFactorEnabled) {
      return res.status(200).json({
        requiresTwoFactor: true,
        user: {
          uid,
          email: userData.email,
          displayName: userData.displayName
        }
      });
    }

    return res.status(200).json({
      message: 'Login successful',
      user: {
        uid,
        email: userData?.email,
        displayName: userData?.displayName,
        role: userData?.role,
        companyId: userData?.companyId,
        phoneNumber: userData?.phoneNumber,
        twoFactorEnabled: userData?.twoFactorEnabled
      }
    });
  } catch (error: any) {
    console.error('Error logging in:', error);
    return res.status(500).json({ error: error.message || 'Failed to log in' });
  }
};

// Setup two-factor authentication
export const setupTwoFactor = async (req: Request, res: Response) => {
  try {
    const { uid, phoneNumber } = req.body;

    // Validate required fields
    if (!uid || !phoneNumber) {
      return res.status(400).json({ error: 'User ID and phone number are required' });
    }

    // Update user in Firestore
    await admin.firestore().collection('users').doc(uid).update({
      phoneNumber,
      twoFactorSetupPending: true
    });

    // In a real implementation, we would send a verification code to the phone number
    // For this MVP, we'll simulate it by generating a random code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the verification code in Firestore (in a real app, this would be stored securely)
    await admin.firestore().collection('twoFactorCodes').doc(uid).set({
      code: verificationCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 10 * 60 * 1000) // 10 minutes expiration
      )
    });

    console.log(`Verification code for user ${uid}: ${verificationCode}`);

    return res.status(200).json({
      message: 'Two-factor authentication setup initiated',
      // In a real app, we wouldn't return the code
      verificationCode
    });
  } catch (error: any) {
    console.error('Error setting up 2FA:', error);
    return res.status(500).json({ error: error.message || 'Failed to set up two-factor authentication' });
  }
};

// Verify two-factor authentication
export const verifyTwoFactor = async (req: Request, res: Response) => {
  try {
    const { uid, verificationCode } = req.body;

    // Validate required fields
    if (!uid || !verificationCode) {
      return res.status(400).json({ error: 'User ID and verification code are required' });
    }

    // Get the stored verification code
    const codeDoc = await admin.firestore().collection('twoFactorCodes').doc(uid).get();
    
    if (!codeDoc.exists) {
      return res.status(404).json({ error: 'Verification code not found or expired' });
    }

    const codeData = codeDoc.data();
    
    // Check if the code has expired
    if (codeData?.expiresAt.toDate() < new Date()) {
      await admin.firestore().collection('twoFactorCodes').doc(uid).delete();
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Verify the code
    if (codeData?.code !== verificationCode) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Update user in Firestore
    await admin.firestore().collection('users').doc(uid).update({
      twoFactorEnabled: true,
      twoFactorSetupPending: false
    });

    // Delete the used verification code
    await admin.firestore().collection('twoFactorCodes').doc(uid).delete();

    // Get updated user data
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();

    return res.status(200).json({
      message: 'Two-factor authentication verified successfully',
      user: {
        uid,
        email: userData?.email,
        displayName: userData?.displayName,
        role: userData?.role,
        companyId: userData?.companyId,
        phoneNumber: userData?.phoneNumber,
        twoFactorEnabled: true
      }
    });
  } catch (error: any) {
    console.error('Error verifying 2FA:', error);
    return res.status(500).json({ error: error.message || 'Failed to verify two-factor authentication' });
  }
};

// Reset password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate password reset link
    const link = await admin.auth().generatePasswordResetLink(email);

    // In a real app, we would send this link to the user's email
    console.log(`Password reset link for ${email}: ${link}`);

    return res.status(200).json({
      message: 'Password reset email sent',
      // In a real app, we wouldn't return the link
      link
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { uid, displayName, phoneNumber, role } = req.body;

    // Validate required fields
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const updates: Record<string, any> = {};

    // Add fields to update if provided
    if (displayName) updates.displayName = displayName;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    if (role) {
      // Validate role
      if (!['buyer', 'supplier', 'administrator'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      updates.role = role;
      
      // Update custom claims
      await admin.auth().setCustomUserClaims(uid, { role });
    }

    // Update user in Firestore
    await admin.firestore().collection('users').doc(uid).update({
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Get updated user data
    const userDoc = await admin.firestore().collection('users').doc(uid).get();
    const userData = userDoc.data();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        uid,
        email: userData?.email,
        displayName: userData?.displayName,
        role: userData?.role,
        companyId: userData?.companyId,
        phoneNumber: userData?.phoneNumber,
        twoFactorEnabled: userData?.twoFactorEnabled
      }
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
};
