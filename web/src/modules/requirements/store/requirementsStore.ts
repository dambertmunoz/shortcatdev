import { create } from 'zustand';
import { 
  Requirement, 
  RequirementsState, 
  RequirementFormData 
} from '../types';
import { 
  getRequirements, 
  getRequirementById, 
  createRequirement, 
  updateRequirement, 
  deleteRequirement,
  submitRequirementForApproval,
  approveRequirement,
  rejectRequirement
} from '../services/requirementsService';

// Create the requirements store
const useRequirementsStore = create<RequirementsState & {
  fetchRequirements: (userId: string) => Promise<void>;
  fetchRequirement: (id: string) => Promise<void>;
  createRequirement: (data: RequirementFormData, userId: string, userName: string) => Promise<string>;
  updateRequirement: (id: string, data: RequirementFormData) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;
  submitForApproval: (id: string, userId: string, userName: string) => Promise<void>;
  approveRequirement: (id: string, userId: string, userName: string, comments?: string) => Promise<void>;
  rejectRequirement: (id: string, userId: string, userName: string, comments: string) => Promise<void>;
  clearCurrentRequirement: () => void;
}>((set, get) => ({
  requirements: [],
  currentRequirement: null,
  loading: false,
  error: null,

  // Fetch all requirements for a user
  fetchRequirements: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const requirements = await getRequirements(userId);
      set({ requirements, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Fetch a single requirement by ID
  fetchRequirement: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const requirement = await getRequirementById(id);
      set({ currentRequirement: requirement, loading: false });
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Create a new requirement
  createRequirement: async (data: RequirementFormData, userId: string, userName: string) => {
    set({ loading: true, error: null });
    try {
      const id = await createRequirement(data, userId, userName);
      const requirement = await getRequirementById(id);
      
      set(state => ({
        requirements: [requirement, ...state.requirements],
        currentRequirement: requirement,
        loading: false
      }));
      
      return id;
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Update an existing requirement
  updateRequirement: async (id: string, data: RequirementFormData) => {
    set({ loading: true, error: null });
    try {
      await updateRequirement(id, data);
      const updatedRequirement = await getRequirementById(id);
      
      set(state => ({
        requirements: state.requirements.map(req => 
          req.id === id ? updatedRequirement : req
        ),
        currentRequirement: updatedRequirement,
        loading: false
      }));
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Delete a requirement
  deleteRequirement: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteRequirement(id);
      
      set(state => ({
        requirements: state.requirements.filter(req => req.id !== id),
        currentRequirement: state.currentRequirement?.id === id ? null : state.currentRequirement,
        loading: false
      }));
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Submit a requirement for approval
  submitForApproval: async (id: string, userId: string, userName: string) => {
    set({ loading: true, error: null });
    try {
      await submitRequirementForApproval(id, userId, userName);
      const updatedRequirement = await getRequirementById(id);
      
      set(state => ({
        requirements: state.requirements.map(req => 
          req.id === id ? updatedRequirement : req
        ),
        currentRequirement: updatedRequirement,
        loading: false
      }));
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Approve a requirement
  approveRequirement: async (id: string, userId: string, userName: string, comments?: string) => {
    set({ loading: true, error: null });
    try {
      await approveRequirement(id, userId, userName, comments);
      const updatedRequirement = await getRequirementById(id);
      
      set(state => ({
        requirements: state.requirements.map(req => 
          req.id === id ? updatedRequirement : req
        ),
        currentRequirement: updatedRequirement,
        loading: false
      }));
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Reject a requirement
  rejectRequirement: async (id: string, userId: string, userName: string, comments: string) => {
    set({ loading: true, error: null });
    try {
      await rejectRequirement(id, userId, userName, comments);
      const updatedRequirement = await getRequirementById(id);
      
      set(state => ({
        requirements: state.requirements.map(req => 
          req.id === id ? updatedRequirement : req
        ),
        currentRequirement: updatedRequirement,
        loading: false
      }));
    } catch (error: any) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // Clear the current requirement
  clearCurrentRequirement: () => {
    set({ currentRequirement: null });
  }
}));

export default useRequirementsStore;
