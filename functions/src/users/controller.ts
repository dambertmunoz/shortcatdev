import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { UserRole } from '../common/types';

// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, companyId, limit = 50, offset = 0 } = req.query;
    
    // Start building the query
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = admin.firestore().collection('users');
    
    // Apply filters if provided
    if (role) {
      query = query.where('role', '==', role);
    }
    
    if (companyId) {
      query = query.where('companyId', '==', companyId);
    }
    
    // Order by display name
    query = query.orderBy('displayName', 'asc');
    
    // Apply pagination
    query = query.limit(Number(limit)).offset(Number(offset));
    
    // Execute the query
    const snapshot = await query.get();
    
    // Format the results
    const users: any[] = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      // Remove sensitive information
      delete userData.passwordHash;
      delete userData.passwordSalt;
      
      users.push({
        id: doc.id,
        ...userData
      });
    });
    
    return res.status(200).json({ users });
  } catch (error: any) {
    console.error('Error getting users:', error);
    return res.status(500).json({ error: error.message || 'Failed to get users' });
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if the requesting user is authorized
    const requestingUserId = req.user?.uid;
    const isAdmin = req.user?.role === 'administrator';
    
    if (!requestingUserId || (id !== requestingUserId && !isAdmin)) {
      return res.status(403).json({ error: 'Not authorized to view this user' });
    }
    
    // Get user from Firestore
    const userDoc = await admin.firestore().collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userData = userDoc.data();
    
    // Remove sensitive information
    delete userData?.passwordHash;
    delete userData?.passwordSalt;
    
    return res.status(200).json({
      user: {
        id: userDoc.id,
        ...userData
      }
    });
  } catch (error: any) {
    console.error('Error getting user:', error);
    return res.status(500).json({ error: error.message || 'Failed to get user' });
  }
};

// Update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { displayName, phoneNumber, email } = req.body;
    
    // Check if the requesting user is authorized
    const requestingUserId = req.user?.uid;
    const isAdmin = req.user?.role === 'administrator';
    
    if (!requestingUserId || (id !== requestingUserId && !isAdmin)) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }
    
    // Get user from Firestore
    const userDoc = await admin.firestore().collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Build update object
    const updates: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (displayName) updates.displayName = displayName;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    
    // If email is being updated and user is not an admin, verify that the email is not already in use
    if (email && email !== userDoc.data()?.email) {
      if (!isAdmin) {
        return res.status(403).json({ 
          error: 'Only administrators can update email addresses' 
        });
      }
      
      try {
        // Update email in Firebase Auth
        await admin.auth().updateUser(id, { email });
        updates.email = email;
      } catch (error: any) {
        return res.status(400).json({ 
          error: error.message || 'Failed to update email' 
        });
      }
    }
    
    // Update user in Firestore
    await admin.firestore().collection('users').doc(id).update(updates);
    
    // Get updated user
    const updatedUserDoc = await admin.firestore().collection('users').doc(id).get();
    const updatedUserData = updatedUserDoc.data();
    
    // Remove sensitive information
    delete updatedUserData?.passwordHash;
    delete updatedUserData?.passwordSalt;
    
    return res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: updatedUserDoc.id,
        ...updatedUserData
      }
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return res.status(500).json({ error: error.message || 'Failed to update user' });
  }
};

// Delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const userDoc = await admin.firestore().collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user from Firebase Auth
    await admin.auth().deleteUser(id);
    
    // Delete user from Firestore
    await admin.firestore().collection('users').doc(id).delete();
    
    return res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete user' });
  }
};

// Update user role
export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Validate role
    if (!role || !Object.values(UserRole).includes(role as UserRole)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }
    
    // Check if user exists
    const userDoc = await admin.firestore().collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update custom claims in Firebase Auth
    await admin.auth().setCustomUserClaims(id, { role });
    
    // Update role in Firestore
    await admin.firestore().collection('users').doc(id).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(200).json({
      message: 'User role updated successfully',
      user: {
        id,
        role
      }
    });
  } catch (error: any) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ error: error.message || 'Failed to update user role' });
  }
};

// Update user company
export const updateUserCompany = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { companyId } = req.body;
    
    // Check if the requesting user is authorized
    const requestingUserId = req.user?.uid;
    const isAdmin = req.user?.role === 'administrator';
    
    if (!requestingUserId || (id !== requestingUserId && !isAdmin)) {
      return res.status(403).json({ error: 'Not authorized to update this user' });
    }
    
    // Validate company ID
    if (!companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }
    
    // Check if user exists
    const userDoc = await admin.firestore().collection('users').doc(id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if company exists
    const companyDoc = await admin.firestore().collection('companies').doc(companyId).get();
    
    if (!companyDoc.exists) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Update user in Firestore
    await admin.firestore().collection('users').doc(id).update({
      companyId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(200).json({
      message: 'User company updated successfully',
      user: {
        id,
        companyId
      }
    });
  } catch (error: any) {
    console.error('Error updating user company:', error);
    return res.status(500).json({ error: error.message || 'Failed to update user company' });
  }
};
