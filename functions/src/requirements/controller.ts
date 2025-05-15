import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { 
  Requirement, 
  RequirementItem, 
  RequirementApproval, 
  RequirementStatus, 
  RequirementPriority 
} from '../common/types';

// Get all requirements
export const getRequirements = async (req: Request, res: Response) => {
  try {
    const { status, priority, createdBy, companyId, limit = 10, offset = 0 } = req.query;
    
    // Start building the query
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = admin.firestore().collection('requirements');
    
    // Apply filters if provided
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (priority) {
      query = query.where('priority', '==', priority);
    }
    
    if (createdBy) {
      query = query.where('createdBy', '==', createdBy);
    }
    
    if (companyId) {
      query = query.where('companyId', '==', companyId);
    }
    
    // Order by creation date
    query = query.orderBy('createdAt', 'desc');
    
    // Apply pagination
    query = query.limit(Number(limit)).offset(Number(offset));
    
    // Execute the query
    const snapshot = await query.get();
    
    // Format the results
    const requirements: Requirement[] = [];
    snapshot.forEach(doc => {
      requirements.push({
        id: doc.id,
        ...doc.data()
      } as Requirement);
    });
    
    // Get total count (for pagination)
    const countQuery = admin.firestore().collection('requirements');
    const countSnapshot = await countQuery.get();
    const totalCount = countSnapshot.size;
    
    return res.status(200).json({
      requirements,
      pagination: {
        total: totalCount,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: requirements.length === Number(limit)
      }
    });
  } catch (error: any) {
    console.error('Error getting requirements:', error);
    return res.status(500).json({ error: error.message || 'Failed to get requirements' });
  }
};

// Get requirement by ID
export const getRequirementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get requirement from Firestore
    const requirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    
    if (!requirementDoc.exists) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    const requirement = {
      id: requirementDoc.id,
      ...requirementDoc.data()
    } as Requirement;
    
    // Get requirement items
    const itemsSnapshot = await admin.firestore()
      .collection('requirementItems')
      .where('requirementId', '==', id)
      .get();
    
    const items: RequirementItem[] = [];
    itemsSnapshot.forEach(doc => {
      items.push({
        id: doc.id,
        ...doc.data()
      } as RequirementItem);
    });
    
    // Get requirement approvals
    const approvalsSnapshot = await admin.firestore()
      .collection('requirementApprovals')
      .where('requirementId', '==', id)
      .get();
    
    const approvals: RequirementApproval[] = [];
    approvalsSnapshot.forEach(doc => {
      approvals.push({
        id: doc.id,
        ...doc.data()
      } as RequirementApproval);
    });
    
    // Add items and approvals to the requirement
    requirement.items = items;
    requirement.approvals = approvals;
    
    return res.status(200).json({ requirement });
  } catch (error: any) {
    console.error('Error getting requirement:', error);
    return res.status(500).json({ error: error.message || 'Failed to get requirement' });
  }
};

// Create a new requirement
export const createRequirement = async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      description, 
      priority, 
      companyId, 
      costCenter, 
      paymentMethod, 
      warranty, 
      warrantyDuration, 
      additionalConditions,
      items = []
    } = req.body;
    
    // Validate required fields
    if (!title || !priority) {
      return res.status(400).json({ error: 'Title and priority are required' });
    }
    
    // Validate priority
    if (!Object.values(RequirementPriority).includes(priority as RequirementPriority)) {
      return res.status(400).json({ error: 'Invalid priority' });
    }
    
    // Get user info from the request
    const userId = req.user?.uid;
    const userName = req.user?.name || 'Unknown User';
    
    if (!userId) {
      return res.status(403).json({ error: 'User not authenticated' });
    }
    
    // Create a new requirement ID
    const requirementId = uuidv4();
    
    // Create the requirement object
    const requirement: Omit<Requirement, 'id'> = {
      title,
      description: description || '',
      status: RequirementStatus.DRAFT,
      priority: priority as RequirementPriority,
      createdBy: userId,
      createdByName: userName,
      companyId: companyId || null,
      costCenter: costCenter || null,
      paymentMethod: paymentMethod || null,
      warranty: warranty || false,
      warrantyDuration: warrantyDuration || null,
      additionalConditions: additionalConditions || null,
      attachments: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp() as any
    };
    
    // Save the requirement to Firestore
    await admin.firestore().collection('requirements').doc(requirementId).set(requirement);
    
    // Process items if provided
    const savedItems: RequirementItem[] = [];
    
    if (items && items.length > 0) {
      const batch = admin.firestore().batch();
      
      for (const item of items) {
        const itemId = uuidv4();
        const requirementItem: Omit<RequirementItem, 'id'> = {
          requirementId,
          name: item.name,
          description: item.description || '',
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure,
          estimatedPrice: item.estimatedPrice || null,
          currency: item.currency || 'USD',
          category: item.category || null,
          subcategory: item.subcategory || null,
          specifications: item.specifications || {},
          attachments: item.attachments || [],
          createdAt: admin.firestore.FieldValue.serverTimestamp() as any
        };
        
        const itemRef = admin.firestore().collection('requirementItems').doc(itemId);
        batch.set(itemRef, requirementItem);
        
        savedItems.push({
          id: itemId,
          ...requirementItem
        } as RequirementItem);
      }
      
      await batch.commit();
    }
    
    return res.status(201).json({
      message: 'Requirement created successfully',
      requirement: {
        id: requirementId,
        ...requirement,
        items: savedItems
      }
    });
  } catch (error: any) {
    console.error('Error creating requirement:', error);
    return res.status(500).json({ error: error.message || 'Failed to create requirement' });
  }
};

// Update an existing requirement
export const updateRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      priority,
      companyId,
      costCenter,
      paymentMethod,
      warranty,
      warrantyDuration,
      additionalConditions
    } = req.body;
    
    // Get requirement from Firestore
    const requirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    
    if (!requirementDoc.exists) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    const requirementData = requirementDoc.data() as Requirement;
    
    // Check if user is authorized to update the requirement
    const userId = req.user?.uid;
    
    if (!userId || (requirementData.createdBy !== userId && req.user?.role !== 'administrator')) {
      return res.status(403).json({ error: 'Not authorized to update this requirement' });
    }
    
    // Check if requirement can be updated (only draft or rejected requirements can be updated)
    if (![RequirementStatus.DRAFT, RequirementStatus.REJECTED].includes(requirementData.status)) {
      return res.status(400).json({ 
        error: 'Only draft or rejected requirements can be updated' 
      });
    }
    
    // Build update object
    const updates: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (title) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (priority) {
      // Validate priority
      if (!Object.values(RequirementPriority).includes(priority as RequirementPriority)) {
        return res.status(400).json({ error: 'Invalid priority' });
      }
      updates.priority = priority;
    }
    if (companyId !== undefined) updates.companyId = companyId;
    if (costCenter !== undefined) updates.costCenter = costCenter;
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod;
    if (warranty !== undefined) updates.warranty = warranty;
    if (warrantyDuration !== undefined) updates.warrantyDuration = warrantyDuration;
    if (additionalConditions !== undefined) updates.additionalConditions = additionalConditions;
    
    // Update the requirement in Firestore
    await admin.firestore().collection('requirements').doc(id).update(updates);
    
    // Get the updated requirement
    const updatedRequirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    const updatedRequirement = {
      id: updatedRequirementDoc.id,
      ...updatedRequirementDoc.data()
    } as Requirement;
    
    return res.status(200).json({
      message: 'Requirement updated successfully',
      requirement: updatedRequirement
    });
  } catch (error: any) {
    console.error('Error updating requirement:', error);
    return res.status(500).json({ error: error.message || 'Failed to update requirement' });
  }
};

// Delete a requirement
export const deleteRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get requirement from Firestore
    const requirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    
    if (!requirementDoc.exists) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    const requirementData = requirementDoc.data() as Requirement;
    
    // Check if user is authorized to delete the requirement
    const userId = req.user?.uid;
    
    if (!userId || (requirementData.createdBy !== userId && req.user?.role !== 'administrator')) {
      return res.status(403).json({ error: 'Not authorized to delete this requirement' });
    }
    
    // Check if requirement can be deleted (only draft requirements can be deleted)
    if (requirementData.status !== RequirementStatus.DRAFT) {
      return res.status(400).json({ 
        error: 'Only draft requirements can be deleted' 
      });
    }
    
    // Delete requirement items
    const itemsSnapshot = await admin.firestore()
      .collection('requirementItems')
      .where('requirementId', '==', id)
      .get();
    
    const batch = admin.firestore().batch();
    
    itemsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete requirement approvals
    const approvalsSnapshot = await admin.firestore()
      .collection('requirementApprovals')
      .where('requirementId', '==', id)
      .get();
    
    approvalsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the requirement
    batch.delete(admin.firestore().collection('requirements').doc(id));
    
    // Commit the batch
    await batch.commit();
    
    return res.status(200).json({
      message: 'Requirement deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting requirement:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete requirement' });
  }
};

// Get requirement items
export const getRequirementItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if requirement exists
    const requirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    
    if (!requirementDoc.exists) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    // Get requirement items
    const itemsSnapshot = await admin.firestore()
      .collection('requirementItems')
      .where('requirementId', '==', id)
      .get();
    
    const items: RequirementItem[] = [];
    itemsSnapshot.forEach(doc => {
      items.push({
        id: doc.id,
        ...doc.data()
      } as RequirementItem);
    });
    
    return res.status(200).json({ items });
  } catch (error: any) {
    console.error('Error getting requirement items:', error);
    return res.status(500).json({ error: error.message || 'Failed to get requirement items' });
  }
};

// Add requirement item
export const addRequirementItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      quantity, 
      unitOfMeasure, 
      estimatedPrice, 
      currency, 
      category, 
      subcategory, 
      specifications, 
      attachments 
    } = req.body;
    
    // Validate required fields
    if (!name || !quantity || !unitOfMeasure) {
      return res.status(400).json({ error: 'Name, quantity, and unit of measure are required' });
    }
    
    // Check if requirement exists
    const requirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    
    if (!requirementDoc.exists) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    const requirementData = requirementDoc.data() as Requirement;
    
    // Check if user is authorized to add items
    const userId = req.user?.uid;
    
    if (!userId || (requirementData.createdBy !== userId && req.user?.role !== 'administrator')) {
      return res.status(403).json({ error: 'Not authorized to modify this requirement' });
    }
    
    // Check if requirement can be modified (only draft or rejected requirements can be modified)
    if (![RequirementStatus.DRAFT, RequirementStatus.REJECTED].includes(requirementData.status)) {
      return res.status(400).json({ 
        error: 'Only draft or rejected requirements can be modified' 
      });
    }
    
    // Create a new item ID
    const itemId = uuidv4();
    
    // Create the item object
    const item: Omit<RequirementItem, 'id'> = {
      requirementId: id,
      name,
      description: description || '',
      quantity,
      unitOfMeasure,
      estimatedPrice: estimatedPrice || null,
      currency: currency || 'USD',
      category: category || null,
      subcategory: subcategory || null,
      specifications: specifications || {},
      attachments: attachments || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp() as any
    };
    
    // Save the item to Firestore
    await admin.firestore().collection('requirementItems').doc(itemId).set(item);
    
    // Update the requirement's updatedAt timestamp
    await admin.firestore().collection('requirements').doc(id).update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(201).json({
      message: 'Requirement item added successfully',
      item: {
        id: itemId,
        ...item
      }
    });
  } catch (error: any) {
    console.error('Error adding requirement item:', error);
    return res.status(500).json({ error: error.message || 'Failed to add requirement item' });
  }
};

// Update requirement item
export const updateRequirementItem = async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    const { 
      name, 
      description, 
      quantity, 
      unitOfMeasure, 
      estimatedPrice, 
      currency, 
      category, 
      subcategory, 
      specifications, 
      attachments 
    } = req.body;
    
    // Check if requirement exists
    const requirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    
    if (!requirementDoc.exists) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    const requirementData = requirementDoc.data() as Requirement;
    
    // Check if user is authorized to update items
    const userId = req.user?.uid;
    
    if (!userId || (requirementData.createdBy !== userId && req.user?.role !== 'administrator')) {
      return res.status(403).json({ error: 'Not authorized to modify this requirement' });
    }
    
    // Check if requirement can be modified (only draft or rejected requirements can be modified)
    if (![RequirementStatus.DRAFT, RequirementStatus.REJECTED].includes(requirementData.status)) {
      return res.status(400).json({ 
        error: 'Only draft or rejected requirements can be modified' 
      });
    }
    
    // Check if item exists
    const itemDoc = await admin.firestore().collection('requirementItems').doc(itemId).get();
    
    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Requirement item not found' });
    }
    
    // Build update object
    const updates: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (quantity) updates.quantity = quantity;
    if (unitOfMeasure) updates.unitOfMeasure = unitOfMeasure;
    if (estimatedPrice !== undefined) updates.estimatedPrice = estimatedPrice;
    if (currency) updates.currency = currency;
    if (category !== undefined) updates.category = category;
    if (subcategory !== undefined) updates.subcategory = subcategory;
    if (specifications) updates.specifications = specifications;
    if (attachments) updates.attachments = attachments;
    
    // Update the item in Firestore
    await admin.firestore().collection('requirementItems').doc(itemId).update(updates);
    
    // Update the requirement's updatedAt timestamp
    await admin.firestore().collection('requirements').doc(id).update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get the updated item
    const updatedItemDoc = await admin.firestore().collection('requirementItems').doc(itemId).get();
    const updatedItem = {
      id: updatedItemDoc.id,
      ...updatedItemDoc.data()
    } as RequirementItem;
    
    return res.status(200).json({
      message: 'Requirement item updated successfully',
      item: updatedItem
    });
  } catch (error: any) {
    console.error('Error updating requirement item:', error);
    return res.status(500).json({ error: error.message || 'Failed to update requirement item' });
  }
};

// Delete requirement item
export const deleteRequirementItem = async (req: Request, res: Response) => {
  try {
    const { id, itemId } = req.params;
    
    // Check if requirement exists
    const requirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    
    if (!requirementDoc.exists) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    const requirementData = requirementDoc.data() as Requirement;
    
    // Check if user is authorized to delete items
    const userId = req.user?.uid;
    
    if (!userId || (requirementData.createdBy !== userId && req.user?.role !== 'administrator')) {
      return res.status(403).json({ error: 'Not authorized to modify this requirement' });
    }
    
    // Check if requirement can be modified (only draft or rejected requirements can be modified)
    if (![RequirementStatus.DRAFT, RequirementStatus.REJECTED].includes(requirementData.status)) {
      return res.status(400).json({ 
        error: 'Only draft or rejected requirements can be modified' 
      });
    }
    
    // Check if item exists
    const itemDoc = await admin.firestore().collection('requirementItems').doc(itemId).get();
    
    if (!itemDoc.exists) {
      return res.status(404).json({ error: 'Requirement item not found' });
    }
    
    // Delete the item
    await admin.firestore().collection('requirementItems').doc(itemId).delete();
    
    // Update the requirement's updatedAt timestamp
    await admin.firestore().collection('requirements').doc(id).update({
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return res.status(200).json({
      message: 'Requirement item deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting requirement item:', error);
    return res.status(500).json({ error: error.message || 'Failed to delete requirement item' });
  }
};

// Get requirement approvals
export const getRequirementApprovals = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if requirement exists
    const requirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    
    if (!requirementDoc.exists) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    // Get requirement approvals
    const approvalsSnapshot = await admin.firestore()
      .collection('requirementApprovals')
      .where('requirementId', '==', id)
      .get();
    
    const approvals: RequirementApproval[] = [];
    approvalsSnapshot.forEach(doc => {
      approvals.push({
        id: doc.id,
        ...doc.data()
      } as RequirementApproval);
    });
    
    return res.status(200).json({ approvals });
  } catch (error: any) {
    console.error('Error getting requirement approvals:', error);
    return res.status(500).json({ error: error.message || 'Failed to get requirement approvals' });
  }
};

// Add requirement approval
export const addRequirementApproval = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    
    // Validate required fields
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (approved or rejected) is required' });
    }
    
    // Check if requirement exists
    const requirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    
    if (!requirementDoc.exists) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    const requirementData = requirementDoc.data() as Requirement;
    
    // Check if requirement is pending approval
    if (requirementData.status !== RequirementStatus.PENDING_APPROVAL) {
      return res.status(400).json({ 
        error: 'Only requirements pending approval can be approved or rejected' 
      });
    }
    
    // Get user info from the request
    const userId = req.user?.uid;
    const userName = req.user?.name || 'Unknown User';
    
    if (!userId) {
      return res.status(403).json({ error: 'User not authenticated' });
    }
    
    // Create a new approval ID
    const approvalId = uuidv4();
    
    // Create the approval object
    const approval: Omit<RequirementApproval, 'id'> = {
      requirementId: id,
      approverId: userId,
      approverName: userName,
      status,
      comments: comments || '',
      createdAt: admin.firestore.FieldValue.serverTimestamp() as any
    };
    
    // Save the approval to Firestore
    await admin.firestore().collection('requirementApprovals').doc(approvalId).set(approval);
    
    // Update the requirement's status based on the approval
    const updates: Record<string, any> = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    if (status === 'approved') {
      updates.status = RequirementStatus.APPROVED;
      updates.approvedAt = admin.firestore.FieldValue.serverTimestamp();
    } else {
      updates.status = RequirementStatus.REJECTED;
      updates.rejectedAt = admin.firestore.FieldValue.serverTimestamp();
    }
    
    await admin.firestore().collection('requirements').doc(id).update(updates);
    
    return res.status(201).json({
      message: `Requirement ${status} successfully`,
      approval: {
        id: approvalId,
        ...approval
      }
    });
  } catch (error: any) {
    console.error('Error adding requirement approval:', error);
    return res.status(500).json({ error: error.message || 'Failed to add requirement approval' });
  }
};

// Submit requirement for approval
export const submitRequirementForApproval = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if requirement exists
    const requirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    
    if (!requirementDoc.exists) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    const requirementData = requirementDoc.data() as Requirement;
    
    // Check if user is authorized to submit the requirement
    const userId = req.user?.uid;
    
    if (!userId || (requirementData.createdBy !== userId && req.user?.role !== 'administrator')) {
      return res.status(403).json({ error: 'Not authorized to submit this requirement' });
    }
    
    // Check if requirement can be submitted (only draft or rejected requirements can be submitted)
    if (![RequirementStatus.DRAFT, RequirementStatus.REJECTED].includes(requirementData.status)) {
      return res.status(400).json({ 
        error: 'Only draft or rejected requirements can be submitted for approval' 
      });
    }
    
    // Check if requirement has items
    const itemsSnapshot = await admin.firestore()
      .collection('requirementItems')
      .where('requirementId', '==', id)
      .get();
    
    if (itemsSnapshot.empty) {
      return res.status(400).json({ 
        error: 'Requirement must have at least one item to be submitted for approval' 
      });
    }
    
    // Update the requirement's status
    await admin.firestore().collection('requirements').doc(id).update({
      status: RequirementStatus.PENDING_APPROVAL,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get the updated requirement
    const updatedRequirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    const updatedRequirement = {
      id: updatedRequirementDoc.id,
      ...updatedRequirementDoc.data()
    } as Requirement;
    
    return res.status(200).json({
      message: 'Requirement submitted for approval successfully',
      requirement: updatedRequirement
    });
  } catch (error: any) {
    console.error('Error submitting requirement for approval:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit requirement for approval' });
  }
};

// Approve requirement
export const approveRequirement = async (req: Request, res: Response) => {
  try {
    // Add an approval with status 'approved'
    req.body.status = 'approved';
    return addRequirementApproval(req, res);
  } catch (error: any) {
    console.error('Error approving requirement:', error);
    return res.status(500).json({ error: error.message || 'Failed to approve requirement' });
  }
};

// Reject requirement
export const rejectRequirement = async (req: Request, res: Response) => {
  try {
    // Add an approval with status 'rejected'
    req.body.status = 'rejected';
    return addRequirementApproval(req, res);
  } catch (error: any) {
    console.error('Error rejecting requirement:', error);
    return res.status(500).json({ error: error.message || 'Failed to reject requirement' });
  }
};

// Cancel requirement
export const cancelRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Check if requirement exists
    const requirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    
    if (!requirementDoc.exists) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    const requirementData = requirementDoc.data() as Requirement;
    
    // Check if user is authorized to cancel the requirement
    const userId = req.user?.uid;
    
    if (!userId || (requirementData.createdBy !== userId && req.user?.role !== 'administrator')) {
      return res.status(403).json({ error: 'Not authorized to cancel this requirement' });
    }
    
    // Check if requirement can be cancelled (cannot cancel completed requirements)
    if (requirementData.status === RequirementStatus.COMPLETED) {
      return res.status(400).json({ 
        error: 'Completed requirements cannot be cancelled' 
      });
    }
    
    // Update the requirement's status
    await admin.firestore().collection('requirements').doc(id).update({
      status: RequirementStatus.CANCELLED,
      cancellationReason: reason || '',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get the updated requirement
    const updatedRequirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    const updatedRequirement = {
      id: updatedRequirementDoc.id,
      ...updatedRequirementDoc.data()
    } as Requirement;
    
    return res.status(200).json({
      message: 'Requirement cancelled successfully',
      requirement: updatedRequirement
    });
  } catch (error: any) {
    console.error('Error cancelling requirement:', error);
    return res.status(500).json({ error: error.message || 'Failed to cancel requirement' });
  }
};

// Complete requirement
export const completeRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if requirement exists
    const requirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    
    if (!requirementDoc.exists) {
      return res.status(404).json({ error: 'Requirement not found' });
    }
    
    const requirementData = requirementDoc.data() as Requirement;
    
    // Check if user is authorized to complete the requirement
    const userId = req.user?.uid;
    
    if (!userId || (requirementData.createdBy !== userId && req.user?.role !== 'administrator')) {
      return res.status(403).json({ error: 'Not authorized to complete this requirement' });
    }
    
    // Check if requirement can be completed (only approved requirements can be completed)
    if (requirementData.status !== RequirementStatus.APPROVED) {
      return res.status(400).json({ 
        error: 'Only approved requirements can be marked as completed' 
      });
    }
    
    // Update the requirement's status
    await admin.firestore().collection('requirements').doc(id).update({
      status: RequirementStatus.COMPLETED,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get the updated requirement
    const updatedRequirementDoc = await admin.firestore().collection('requirements').doc(id).get();
    const updatedRequirement = {
      id: updatedRequirementDoc.id,
      ...updatedRequirementDoc.data()
    } as Requirement;
    
    return res.status(200).json({
      message: 'Requirement marked as completed successfully',
      requirement: updatedRequirement
    });
  } catch (error: any) {
    console.error('Error completing requirement:', error);
    return res.status(500).json({ error: error.message || 'Failed to complete requirement' });
  }
};
