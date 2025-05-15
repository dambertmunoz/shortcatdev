'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useAuthStore from '@/modules/auth/store/authStore';
import useRequirementsStore from '@/modules/requirements/store/requirementsStore';
import RequirementForm from '@/modules/requirements/components/RequirementForm';

export default function NewRequirementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  
  const { user } = useAuthStore();
  const { 
    currentRequirement, 
    fetchRequirement, 
    clearCurrentRequirement 
  } = useRequirementsStore();

  useEffect(() => {
    // If duplicating, fetch the requirement to duplicate
    if (duplicateId) {
      fetchRequirement(duplicateId);
    } else {
      // Clear any existing requirement data
      clearCurrentRequirement();
    }

    // Cleanup on unmount
    return () => {
      clearCurrentRequirement();
    };
  }, [duplicateId, fetchRequirement, clearCurrentRequirement]);

  const handleCancel = () => {
    router.push('/dashboard/requirements');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {duplicateId ? 'Duplicar Requerimiento' : 'Nuevo Requerimiento'}
      </h1>

      <RequirementForm 
        initialData={duplicateId ? currentRequirement : null}
        isDuplicate={!!duplicateId}
        onSubmit={(formData) => {
          // Handle form submission
          router.push('/dashboard/requirements');
        }}
      />
    </div>
  );
}
