'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileEdit } from 'lucide-react';
import useRequirementsStore from '@/modules/requirements/store/requirementsStore';
import { Requirement } from '@/modules/requirements/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function RequirementDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { fetchRequirement, currentRequirement, loading } = useRequirementsStore();
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  
  useEffect(() => {
    const id = params.id as string;
    if (id) {
      fetchRequirement(id).catch(console.error);
    }
  }, [params.id, fetchRequirement]);
  
  useEffect(() => {
    if (currentRequirement) {
      setRequirement(currentRequirement);
    }
  }, [currentRequirement]);
  
  const handleBack = () => {
    router.back();
  };
  
  const handleEdit = () => {
    router.push(`/dashboard/requirements/${params.id}/edit`);
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-200 text-gray-800';
      case 'pending_approval':
        return 'bg-amber-200 text-amber-800';
      case 'approved':
        return 'bg-green-200 text-green-800';
      case 'in_process':
        return 'bg-blue-200 text-blue-800';
      case 'completed':
        return 'bg-green-700 text-white';
      case 'cancelled':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };
  
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'pending_approval':
        return 'Pendiente de Aprobación';
      case 'approved':
        return 'Aprobado';
      case 'in_process':
        return 'En Proceso';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-60" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!requirement) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <h2 className="text-2xl font-semibold mb-2">Requerimiento no encontrado</h2>
        <p className="text-muted-foreground mb-4">
          El requerimiento que estás buscando no existe o ha sido eliminado.
        </p>
        <Button onClick={handleBack}>Volver a la lista</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Detalles del Requerimiento</h1>
        </div>
        <Button onClick={handleEdit}>
          <FileEdit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">{requirement.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Código: <span className="font-medium">{requirement.code}</span>
            </p>
          </div>
          <Badge className={getStatusColor(requirement.status)}>
            {getStatusText(requirement.status)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de Entrega</p>
              <p>{requirement.deliveryDate ? formatDate(requirement.deliveryDate) : 'No especificada'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Centro de Costo</p>
              <p>{requirement.costCenter || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Criticidad</p>
              <p className="capitalize">{requirement.criticality}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Método de Pago</p>
              <p>{requirement.paymentMethod || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Plazo de Pago</p>
              <p>{requirement.paymentTerm || 'No especificado'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Garantía</p>
              <p>{requirement.warranty || 'No especificada'}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Ítems del Requerimiento</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-secondary text-secondary-foreground">
                  <tr>
                    <th className="p-2 text-left">Nombre</th>
                    <th className="p-2 text-left">Descripción</th>
                    <th className="p-2 text-left">Cantidad</th>
                    <th className="p-2 text-left">Unidad</th>
                    <th className="p-2 text-left">Precio Est.</th>
                    <th className="p-2 text-left">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {requirement.items.map((item) => (
                    <tr key={item.id} className="border-b border-border">
                      <td className="p-2">{item.name}</td>
                      <td className="p-2">{item.description}</td>
                      <td className="p-2">{item.quantity}</td>
                      <td className="p-2">{item.unitOfMeasure}</td>
                      <td className="p-2">
                        {item.estimatedPrice ? formatCurrency(item.estimatedPrice) : '-'}
                      </td>
                      <td className="p-2">
                        {item.totalEstimatedPrice ? formatCurrency(item.totalEstimatedPrice) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted">
                  <tr>
                    <td colSpan={5} className="p-2 text-right font-medium">Total Estimado:</td>
                    <td className="p-2 font-bold">
                      {requirement.totalEstimatedPrice ? formatCurrency(requirement.totalEstimatedPrice) : '-'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          {requirement.additionalConditions && requirement.additionalConditions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Condiciones Adicionales</h3>
              <ul className="list-disc list-inside space-y-1">
                {requirement.additionalConditions.map((condition, index) => (
                  <li key={index}>{condition}</li>
                ))}
              </ul>
            </div>
          )}
          
          {requirement.approvals && requirement.approvals.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Historial de Aprobaciones</h3>
              <div className="space-y-2">
                {requirement.approvals.map((approval) => (
                  <div key={approval.id} className="border rounded p-3">
                    <div className="flex justify-between">
                      <p className="font-medium">{approval.userName}</p>
                      <p className="text-sm text-muted-foreground">
                        {approval.timestamp.toLocaleString('es-PE')}
                      </p>
                    </div>
                    <p className="capitalize text-sm mt-1">
                      Estado: <span className="font-medium">{approval.status}</span>
                    </p>
                    {approval.comments && (
                      <p className="text-sm mt-1">
                        Comentarios: {approval.comments}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
