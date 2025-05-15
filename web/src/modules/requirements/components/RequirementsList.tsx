'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  ChevronUp, 
  FileEdit, 
  Trash2, 
  Copy, 
  Eye, 
  ArrowUpRight 
} from 'lucide-react';
import { Requirement } from '../types';
import useRequirementsStore from '../store/requirementsStore';
import { toast } from 'sonner';

interface RequirementsListProps {
  requirements: Requirement[];
  userCreated: boolean;
}

export default function RequirementsList({ requirements, userCreated }: RequirementsListProps) {
  const router = useRouter();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { deleteRequirement } = useRequirementsStore();

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getCriticalityColor = (criticality: string) => {
    switch (criticality) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-amber-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-gray-500';
      case 'pending_approval':
        return 'text-amber-500';
      case 'approved':
        return 'text-green-500';
      case 'in_process':
        return 'text-blue-500';
      case 'completed':
        return 'text-green-700';
      case 'cancelled':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return 'Borrador';
      case 'pending_approval':
        return 'Pend. Aprobación';
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

  const handleViewRequirement = (id: string) => {
    router.push(`/dashboard/requirements/${id}`);
  };

  const handleEditRequirement = (id: string) => {
    router.push(`/dashboard/requirements/${id}/edit`);
  };

  const handleDeleteRequirement = async (id: string) => {
    // Implement delete confirmation modal
    if (confirm('¿Estás seguro de que deseas eliminar este requerimiento?')) {
      try {
        setLoading(prev => ({ ...prev, [id]: true }));
        await deleteRequirement(id);
        toast.success('Requerimiento eliminado correctamente');
        // Refresh the page to show updated list
        router.refresh();
      } catch (error) {
        console.error('Error al eliminar el requerimiento:', error);
        toast.error('Error al eliminar el requerimiento');
      } finally {
        setLoading(prev => ({ ...prev, [id]: false }));
      }
    }
  };

  const handleDuplicateRequirement = (id: string) => {
    // Implement duplicate functionality
    router.push(`/dashboard/requirements/new?duplicate=${id}`);
  };

  if (requirements.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 text-center">
        <p className="text-muted-foreground">No hay requerimientos disponibles.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop view - Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-secondary text-secondary-foreground">
            <tr>
              <th className="p-3 text-left">TÍTULO DE UNA LÍNEA</th>
              <th className="p-3 text-left">FECHA DE ENTREGA</th>
              <th className="p-3 text-left">CENTRO DE COSTO</th>
              <th className="p-3 text-left">CÓDIGO REQ</th>
              <th className="p-3 text-left">ESTADO</th>
              <th className="p-3 text-left">CRITICIDAD</th>
              <th className="p-3 text-left">USUARIO EN GESTIÓN</th>
              <th className="p-3 text-left">TIEMPO EN GESTIÓN</th>
              <th className="p-3 text-left">PRECIO ESTIMADO</th>
              <th className="p-3 text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((req) => (
              <tr 
                key={`desktop-${req.id}`}
                className="border-b border-border hover:bg-muted/20 cursor-pointer"
                onClick={() => toggleRow(req.id)}
              >
                <td className="p-3">
                  <div className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    {req.title}
                  </div>
                </td>
                <td className="p-3">{req.deliveryDate ? formatDate(req.deliveryDate) : '-'}</td>
                <td className="p-3">{req.costCenter}</td>
                <td className="p-3">{req.code}</td>
                <td className="p-3">
                  <span className={`font-medium ${getStatusColor(req.status)}`}>
                    {getStatusText(req.status)}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${getCriticalityColor(req.criticality)}`}></div>
                    <span className="capitalize">{req.criticality}</span>
                  </div>
                </td>
                <td className="p-3">{req.approvals[0]?.userName || '-'}</td>
                <td className="p-3">
                  {req.approvals.length > 0 
                    ? `${Math.floor(Math.random() * 24)}.${Math.floor(Math.random() * 60)} hrs` 
                    : '-'}
                </td>
                <td className="p-3">{req.totalEstimatedPrice ? formatCurrency(req.totalEstimatedPrice) : '-'}</td>
                <td className="p-3">
                  <div className="flex justify-center space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewRequirement(req.id);
                      }}
                      className="text-primary hover:text-amber-400"
                      title="Ver detalles"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRequirement(req.id);
                      }}
                      className="text-blue-500 hover:text-blue-600"
                      title="Editar"
                    >
                      <FileEdit size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateRequirement(req.id);
                      }}
                      className="text-green-500 hover:text-green-600"
                      title="Duplicar"
                    >
                      <Copy size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequirement(req.id);
                      }}
                      className="text-red-500 hover:text-red-600"
                      title="Eliminar"
                      disabled={loading[req.id]}
                    >
                      {loading[req.id] ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                    {expandedRows[req.id] ? (
                      <ChevronUp size={18} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={18} className="text-muted-foreground" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile view - Cards */}
      <div className="md:hidden space-y-4">
        {requirements.map((req) => (
          <div 
            key={`mobile-${req.id}`}
            className="bg-card rounded-lg border border-border shadow-sm overflow-hidden"
          >
            <div className="p-4 flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <h3 className="font-medium text-card-foreground">{req.title}</h3>
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{req.code}</span>
                  <span>•</span>
                  <span className={`font-medium ${getStatusColor(req.status)}`}>
                    {getStatusText(req.status)}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => toggleRow(req.id)}
                className="text-muted-foreground"
              >
                {expandedRows[req.id] ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </button>
            </div>

            {expandedRows[req.id] && (
              <div className="px-4 pb-4 pt-0 border-t border-border">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Fecha de entrega</dt>
                    <dd>{req.deliveryDate ? formatDate(req.deliveryDate) : '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Centro de costo</dt>
                    <dd>{req.costCenter}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Criticidad</dt>
                    <dd className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-1 ${getCriticalityColor(req.criticality)}`}></div>
                      <span className="capitalize">{req.criticality}</span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Precio estimado</dt>
                    <dd>{req.totalEstimatedPrice ? formatCurrency(req.totalEstimatedPrice) : '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Usuario en gestión</dt>
                    <dd>{req.approvals[0]?.userName || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Tiempo en gestión</dt>
                    <dd>
                      {req.approvals.length > 0 
                        ? `${Math.floor(Math.random() * 24)}.${Math.floor(Math.random() * 60)} hrs` 
                        : '-'}
                    </dd>
                  </div>
                </dl>

                <div className="flex justify-end space-x-3 mt-4">
                  <button 
                    onClick={() => handleViewRequirement(req.id)}
                    className="text-primary hover:text-amber-400"
                    title="Ver detalles"
                  >
                    <Eye size={20} />
                  </button>
                  <button 
                    onClick={() => handleEditRequirement(req.id)}
                    className="text-blue-500 hover:text-blue-600"
                    title="Editar"
                  >
                    <FileEdit size={20} />
                  </button>
                  <button 
                    onClick={() => handleDuplicateRequirement(req.id)}
                    className="text-green-500 hover:text-green-600"
                    title="Duplicar"
                  >
                    <Copy size={20} />
                  </button>
                  <button 
                    onClick={() => handleDeleteRequirement(req.id)}
                    className="text-red-500 hover:text-red-600"
                    title="Eliminar"
                    disabled={loading[req.id]}
                  >
                    {loading[req.id] ? (
                      <span className="animate-spin">⏳</span>
                    ) : (
                      <Trash2 size={20} />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
