import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { RequirementStatus } from '../common/types';

// Cloud function to update requirement status when an approval is added
export const onRequirementApprovalCreate = functions.firestore
  .document('requirementApprovals/{approvalId}')
  .onCreate(async (snapshot, context) => {
    try {
      const approvalData = snapshot.data();
      const requirementId = approvalData.requirementId;
      
      // Get all approvals for this requirement
      const approvalsSnapshot = await admin.firestore()
        .collection('requirementApprovals')
        .where('requirementId', '==', requirementId)
        .get();
      
      const approvals = approvalsSnapshot.docs.map(doc => doc.data());
      
      // Check if all approvals are completed
      const allApproved = approvals.every(approval => approval.status === 'approved');
      const anyRejected = approvals.some(approval => approval.status === 'rejected');
      
      // Update requirement status based on approvals
      if (allApproved) {
        await admin.firestore().collection('requirements').doc(requirementId).update({
          status: RequirementStatus.APPROVED,
          approvedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else if (anyRejected) {
        await admin.firestore().collection('requirements').doc(requirementId).update({
          status: RequirementStatus.REJECTED,
          rejectedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      return null;
    } catch (error) {
      console.error('Error updating requirement status:', error);
      return null;
    }
  });

// Cloud function to send notification when a requirement is submitted for approval
export const onRequirementSubmitted = functions.firestore
  .document('requirements/{requirementId}')
  .onUpdate(async (change, context) => {
    try {
      const beforeData = change.before.data();
      const afterData = change.after.data();
      
      // Check if status changed to pending approval
      if (beforeData.status !== RequirementStatus.PENDING_APPROVAL && 
          afterData.status === RequirementStatus.PENDING_APPROVAL) {
        
        // Get administrators to notify
        const adminsSnapshot = await admin.firestore()
          .collection('users')
          .where('role', '==', 'administrator')
          .get();
        
        // In a real app, we would send notifications to administrators
        // For this MVP, we'll just log the notification
        adminsSnapshot.forEach(doc => {
          const adminData = doc.data();
          console.log(`Notification to admin ${adminData.displayName}: New requirement pending approval`);
        });
      }
      
      return null;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  });

// Cloud function to calculate requirement total price when items are added or updated
export const onRequirementItemChange = functions.firestore
  .document('requirementItems/{itemId}')
  .onWrite(async (change, context) => {
    try {
      // If item was deleted, get requirementId from before data
      // If item was created or updated, get requirementId from after data
      const requirementId = change.after.exists 
        ? change.after.data()?.requirementId 
        : change.before.data()?.requirementId;

      // If requirementId is undefined, exit early
      if (!requirementId) {
        console.error('No requirementId found in document');
        return null;
      }
      
      // Get all items for this requirement
      const itemsSnapshot = await admin.firestore()
        .collection('requirementItems')
        .where('requirementId', '==', requirementId)
        .get();
      
      // Calculate total price
      let totalPrice = 0;
      let currency = 'USD';
      
      itemsSnapshot.forEach(doc => {
        const itemData = doc.data();
        if (itemData.estimatedPrice) {
          totalPrice += itemData.quantity * itemData.estimatedPrice;
          currency = itemData.currency || currency;
        }
      });
      
      // Update requirement with total price
      await admin.firestore().collection('requirements').doc(requirementId).update({
        totalPrice,
        currency,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return null;
    } catch (error) {
      console.error('Error calculating requirement total price:', error);
      return null;
    }
  });
