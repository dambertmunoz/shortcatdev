import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Requirement, 
  RequirementFormData, 
  RequirementItem,
  RequirementStatus,
  RequirementApproval
} from '../types';

// Collection references
const requirementsCollection = collection(db, 'requirements');
const requirementItemsCollection = collection(db, 'requirement_items');
const requirementApprovalsCollection = collection(db, 'requirement_approvals');

// Helper to convert Firestore data to our types
const convertRequirement = (doc: any): Requirement => {
  const data = doc.data();
  return {
    id: doc.id,
    code: data.code,
    title: data.title,
    status: data.status as RequirementStatus,
    createdBy: data.createdBy,
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
    deliveryDate: data.deliveryDate?.toDate(),
    costCenter: data.costCenter,
    criticality: data.criticality,
    items: [], // Items will be fetched separately
    paymentMethod: data.paymentMethod,
    paymentTerm: data.paymentTerm,
    warranty: data.warranty,
    additionalConditions: data.additionalConditions || [],
    approvals: [], // Approvals will be fetched separately
    totalEstimatedPrice: data.totalEstimatedPrice
  };
};

// Get all requirements for a user
export const getRequirements = async (userId: string): Promise<Requirement[]> => {
  try {
    // Query requirements created by the user
    const q = query(
      requirementsCollection,
      where('createdBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const requirements: Requirement[] = [];
    
    // Process each requirement
    for (const doc of querySnapshot.docs) {
      const requirement = convertRequirement(doc);
      
      // Get items for this requirement
      const itemsQuery = query(
        requirementItemsCollection,
        where('requirementId', '==', doc.id)
      );
      const itemsSnapshot = await getDocs(itemsQuery);
      
      requirement.items = itemsSnapshot.docs.map(itemDoc => {
        const itemData = itemDoc.data();
        return {
          id: itemDoc.id,
          name: itemData.name,
          description: itemData.description,
          specificDescription: itemData.specificDescription,
          quantity: itemData.quantity,
          unitOfMeasure: itemData.unitOfMeasure,
          deliveryDate: itemData.deliveryDate?.toDate() || new Date(),
          criticality: itemData.criticality,
          costCenter: itemData.costCenter,
          estimatedPrice: itemData.estimatedPrice,
          totalEstimatedPrice: itemData.totalEstimatedPrice,
          location: itemData.location,
          additionalInfo: itemData.additionalInfo
        };
      });
      
      // Get approvals for this requirement
      const approvalsQuery = query(
        requirementApprovalsCollection,
        where('requirementId', '==', doc.id),
        orderBy('timestamp', 'desc')
      );
      const approvalsSnapshot = await getDocs(approvalsQuery);
      
      requirement.approvals = approvalsSnapshot.docs.map(approvalDoc => {
        const approvalData = approvalDoc.data();
        return {
          id: approvalDoc.id,
          requirementId: approvalData.requirementId,
          userId: approvalData.userId,
          userName: approvalData.userName,
          status: approvalData.status,
          comments: approvalData.comments,
          timestamp: approvalData.timestamp?.toDate() || new Date()
        };
      });
      
      requirements.push(requirement);
    }
    
    return requirements;
  } catch (error: any) {
    throw new Error(`Failed to get requirements: ${error.message}`);
  }
};

// Get requirements for a specific cost center
export const getRequirementsByCostCenter = async (costCenterId: string): Promise<Requirement[]> => {
  try {
    const q = query(
      requirementsCollection,
      where('costCenter', '==', costCenterId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const requirements: Requirement[] = [];
    
    for (const doc of querySnapshot.docs) {
      const requirement = convertRequirement(doc);
      
      // Get items for this requirement
      const itemsQuery = query(
        requirementItemsCollection,
        where('requirementId', '==', doc.id)
      );
      const itemsSnapshot = await getDocs(itemsQuery);
      
      requirement.items = itemsSnapshot.docs.map(itemDoc => {
        const itemData = itemDoc.data();
        return {
          id: itemDoc.id,
          name: itemData.name,
          description: itemData.description,
          specificDescription: itemData.specificDescription,
          quantity: itemData.quantity,
          unitOfMeasure: itemData.unitOfMeasure,
          deliveryDate: itemData.deliveryDate?.toDate() || new Date(),
          criticality: itemData.criticality,
          costCenter: itemData.costCenter,
          estimatedPrice: itemData.estimatedPrice,
          totalEstimatedPrice: itemData.totalEstimatedPrice,
          location: itemData.location,
          additionalInfo: itemData.additionalInfo
        };
      });
      
      // Get approvals for this requirement
      const approvalsQuery = query(
        requirementApprovalsCollection,
        where('requirementId', '==', doc.id),
        orderBy('timestamp', 'desc')
      );
      const approvalsSnapshot = await getDocs(approvalsQuery);
      
      requirement.approvals = approvalsSnapshot.docs.map(approvalDoc => {
        const approvalData = approvalDoc.data();
        return {
          id: approvalDoc.id,
          requirementId: approvalData.requirementId,
          userId: approvalData.userId,
          userName: approvalData.userName,
          status: approvalData.status,
          comments: approvalData.comments,
          timestamp: approvalData.timestamp?.toDate() || new Date()
        };
      });
      
      requirements.push(requirement);
    }
    
    return requirements;
  } catch (error: any) {
    throw new Error(`Failed to get requirements by cost center: ${error.message}`);
  }
};

// Get a single requirement by ID
export const getRequirementById = async (id: string): Promise<Requirement> => {
  try {
    const docRef = doc(requirementsCollection, id);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Requirement with ID ${id} not found`);
    }
    
    const requirement = convertRequirement(docSnap);
    
    // Get items for this requirement
    const itemsQuery = query(
      requirementItemsCollection,
      where('requirementId', '==', id)
    );
    const itemsSnapshot = await getDocs(itemsQuery);
    
    requirement.items = itemsSnapshot.docs.map(itemDoc => {
      const itemData = itemDoc.data();
      return {
        id: itemDoc.id,
        name: itemData.name,
        description: itemData.description,
        specificDescription: itemData.specificDescription,
        quantity: itemData.quantity,
        unitOfMeasure: itemData.unitOfMeasure,
        deliveryDate: itemData.deliveryDate?.toDate() || new Date(),
        criticality: itemData.criticality,
        costCenter: itemData.costCenter,
        estimatedPrice: itemData.estimatedPrice,
        totalEstimatedPrice: itemData.totalEstimatedPrice,
        location: itemData.location,
        additionalInfo: itemData.additionalInfo
      };
    });
    
    // Get approvals for this requirement
    const approvalsQuery = query(
      requirementApprovalsCollection,
      where('requirementId', '==', id),
      orderBy('timestamp', 'desc')
    );
    const approvalsSnapshot = await getDocs(approvalsQuery);
    
    requirement.approvals = approvalsSnapshot.docs.map(approvalDoc => {
      const approvalData = approvalDoc.data();
      return {
        id: approvalDoc.id,
        requirementId: approvalData.requirementId,
        userId: approvalData.userId,
        userName: approvalData.userName,
        status: approvalData.status,
        comments: approvalData.comments,
        timestamp: approvalData.timestamp?.toDate() || new Date()
      };
    });
    
    return requirement;
  } catch (error: any) {
    throw new Error(`Failed to get requirement: ${error.message}`);
  }
};

// Create a new requirement
export const createRequirement = async (
  data: RequirementFormData, 
  userId: string,
  userName: string
): Promise<string> => {
  try {
    // Generate a unique code for the requirement
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get count of requirements for today to generate sequential code
    const todayStart = new Date(date.setHours(0, 0, 0, 0));
    const todayEnd = new Date(date.setHours(23, 59, 59, 999));
    
    const countQuery = query(
      requirementsCollection,
      where('createdAt', '>=', Timestamp.fromDate(todayStart)),
      where('createdAt', '<=', Timestamp.fromDate(todayEnd))
    );
    
    const countSnapshot = await getDocs(countQuery);
    const count = countSnapshot.size + 1;
    
    // Format: R-YYMMDD-XXXX where XXXX is sequential number
    const code = `R-${year}${month}${day}-${count.toString().padStart(4, '0')}`;
    
    // Calculate total estimated price
    const totalEstimatedPrice = data.items.reduce((total, item) => {
      return total + (item.estimatedPrice || 0) * item.quantity;
    }, 0);
    
    // Create the requirement document
    const requirementData = {
      code,
      title: data.title,
      status: 'draft' as RequirementStatus,
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      costCenter: data.costCenter,
      criticality: data.criticality,
      paymentMethod: data.paymentMethod,
      paymentTerm: data.paymentTerm,
      warranty: data.warranty,
      additionalConditions: data.additionalConditions || [],
      totalEstimatedPrice
    };
    
    // Use a batch write to create the requirement and its items
    const batch = writeBatch(db);
    
    // Add the requirement
    const requirementRef = doc(requirementsCollection);
    batch.set(requirementRef, requirementData);
    
    // Add each item
    for (const item of data.items) {
      const itemRef = doc(requirementItemsCollection);
      batch.set(itemRef, {
        requirementId: requirementRef.id,
        name: item.name,
        description: item.description,
        specificDescription: item.specificDescription,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure,
        deliveryDate: Timestamp.fromDate(item.deliveryDate),
        criticality: item.criticality,
        costCenter: item.costCenter,
        estimatedPrice: item.estimatedPrice,
        totalEstimatedPrice: (item.estimatedPrice || 0) * item.quantity,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    // Create initial approval record (for the creator)
    const approvalRef = doc(requirementApprovalsCollection);
    batch.set(approvalRef, {
      requirementId: requirementRef.id,
      userId,
      userName,
      status: 'approved',
      timestamp: serverTimestamp(),
      comments: 'Requirement created'
    });
    
    // Commit the batch
    await batch.commit();
    
    return requirementRef.id;
  } catch (error: any) {
    throw new Error(`Failed to create requirement: ${error.message}`);
  }
};

// Update an existing requirement
export const updateRequirement = async (
  id: string, 
  data: RequirementFormData
): Promise<void> => {
  try {
    const requirementRef = doc(requirementsCollection, id);
    const requirementSnap = await getDoc(requirementRef);
    
    if (!requirementSnap.exists()) {
      throw new Error(`Requirement with ID ${id} not found`);
    }
    
    // Calculate total estimated price
    const totalEstimatedPrice = data.items.reduce((total, item) => {
      return total + (item.estimatedPrice || 0) * item.quantity;
    }, 0);
    
    // Update the requirement document
    await updateDoc(requirementRef, {
      title: data.title,
      updatedAt: serverTimestamp(),
      costCenter: data.costCenter,
      criticality: data.criticality,
      paymentMethod: data.paymentMethod,
      paymentTerm: data.paymentTerm,
      warranty: data.warranty,
      additionalConditions: data.additionalConditions || [],
      totalEstimatedPrice
    });
    
    // Get existing items
    const itemsQuery = query(
      requirementItemsCollection,
      where('requirementId', '==', id)
    );
    const itemsSnapshot = await getDocs(itemsQuery);
    
    // Delete all existing items
    const batch = writeBatch(db);
    itemsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Add new items
    for (const item of data.items) {
      const itemRef = doc(requirementItemsCollection);
      batch.set(itemRef, {
        requirementId: id,
        name: item.name,
        description: item.description,
        specificDescription: item.specificDescription,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure,
        deliveryDate: Timestamp.fromDate(item.deliveryDate),
        criticality: item.criticality,
        costCenter: item.costCenter,
        estimatedPrice: item.estimatedPrice,
        totalEstimatedPrice: (item.estimatedPrice || 0) * item.quantity,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    // Commit the batch
    await batch.commit();
  } catch (error: any) {
    throw new Error(`Failed to update requirement: ${error.message}`);
  }
};

// Delete a requirement
export const deleteRequirement = async (id: string): Promise<void> => {
  try {
    const requirementRef = doc(requirementsCollection, id);
    
    // Get items for this requirement
    const itemsQuery = query(
      requirementItemsCollection,
      where('requirementId', '==', id)
    );
    const itemsSnapshot = await getDocs(itemsQuery);
    
    // Get approvals for this requirement
    const approvalsQuery = query(
      requirementApprovalsCollection,
      where('requirementId', '==', id)
    );
    const approvalsSnapshot = await getDocs(approvalsQuery);
    
    // Use a batch to delete the requirement and all related documents
    const batch = writeBatch(db);
    
    // Delete the requirement
    batch.delete(requirementRef);
    
    // Delete all items
    itemsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete all approvals
    approvalsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Commit the batch
    await batch.commit();
  } catch (error: any) {
    throw new Error(`Failed to delete requirement: ${error.message}`);
  }
};

// Submit a requirement for approval
export const submitRequirementForApproval = async (
  id: string,
  userId: string,
  userName: string
): Promise<void> => {
  try {
    const requirementRef = doc(requirementsCollection, id);
    
    // Update the requirement status
    await updateDoc(requirementRef, {
      status: 'pending_approval' as RequirementStatus,
      updatedAt: serverTimestamp()
    });
    
    // Create an approval record
    await addDoc(requirementApprovalsCollection, {
      requirementId: id,
      userId,
      userName,
      status: 'pending',
      timestamp: serverTimestamp(),
      comments: 'Requirement submitted for approval'
    });
  } catch (error: any) {
    throw new Error(`Failed to submit requirement for approval: ${error.message}`);
  }
};

// Approve a requirement
export const approveRequirement = async (
  id: string,
  userId: string,
  userName: string,
  comments?: string
): Promise<void> => {
  try {
    const requirementRef = doc(requirementsCollection, id);
    
    // Update the requirement status
    await updateDoc(requirementRef, {
      status: 'approved' as RequirementStatus,
      updatedAt: serverTimestamp()
    });
    
    // Create an approval record
    await addDoc(requirementApprovalsCollection, {
      requirementId: id,
      userId,
      userName,
      status: 'approved',
      timestamp: serverTimestamp(),
      comments: comments || 'Requirement approved'
    });
  } catch (error: any) {
    throw new Error(`Failed to approve requirement: ${error.message}`);
  }
};

// Reject a requirement
export const rejectRequirement = async (
  id: string,
  userId: string,
  userName: string,
  comments: string
): Promise<void> => {
  try {
    const requirementRef = doc(requirementsCollection, id);
    
    // Update the requirement status
    await updateDoc(requirementRef, {
      status: 'draft' as RequirementStatus,
      updatedAt: serverTimestamp()
    });
    
    // Create a rejection record
    await addDoc(requirementApprovalsCollection, {
      requirementId: id,
      userId,
      userName,
      status: 'rejected',
      timestamp: serverTimestamp(),
      comments: comments || 'Requirement rejected'
    });
  } catch (error: any) {
    throw new Error(`Failed to reject requirement: ${error.message}`);
  }
};
