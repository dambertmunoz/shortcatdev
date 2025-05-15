'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import useRequirementsStore from '@/modules/requirements/store/requirementsStore';
import { RequirementFormData } from '@/modules/requirements/types';
import RequirementForm from '@/modules/requirements/components/RequirementForm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import useAuthStore from '@/modules/auth/store/authStore';

export default function EditRequirementPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    fetchRequirement, 
    currentRequirement, 
    updateRequirement, 
    loading 
  } = useRequirementsStore();
  const [initialData, setInitialData] = useState<RequirementFormData | null>(null);
  
  useEffect(() => {
    const id = params.id as string;
    if (id) {
      fetchRequirement(id).catch(error => {
        console.error('Error fetching requirement:', error);
        toast.error('Error al cargar el requerimiento');
      });
    }
  }, [params.id, fetchRequirement]);
  
  useEffect(() => {
    if (currentRequirement) {
      // Convert the requirement to form data format
      const formData: RequirementFormData = {
        title: currentRequirement.title,
        deliveryDate: currentRequirement.deliveryDate,
        costCenter: currentRequirement.costCenter,
        criticality: currentRequirement.criticality,
        paymentMethod: currentRequirement.paymentMethod,
        paymentTerm: currentRequirement.paymentTerm,
        warranty: currentRequirement.warranty,
        additionalConditions: currentRequirement.additionalConditions || [],
        items: currentRequirement.items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          specificDescription: item.specificDescription,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure,
          deliveryDate: item.deliveryDate,
          criticality: item.criticality,
          costCenter: item.costCenter,
          estimatedPrice: item.estimatedPrice,
          location: item.location,
          additionalInfo: item.additionalInfo
        }))
      };
      
      setInitialData(formData);
    }
  }, [currentRequirement]);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleSubmit = async (data: RequirementFormData) => {
    if (!user || !params.id) return;
    
    try {
      await updateRequirement(params.id as string, data);
      toast.success('Requerimiento actualizado correctamente');
      router.push(`/dashboard/requirements/${params.id}`);
    } catch (error) {
      console.error('Error updating requirement:', error);
      toast.error('Error al actualizar el requerimiento');
    }
  };
  
  if (loading || !initialData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Editar Requerimiento</h1>
      </div>
      
      <RequirementForm 
        initialData={initialData} 
        onSubmit={handleSubmit}
        isEditing={true}
        loading={loading}
      />
    </div>
  );
}
