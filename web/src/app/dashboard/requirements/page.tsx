'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import useAuthStore from '@/modules/auth/store/authStore';
import useRequirementsStore from '@/modules/requirements/store/requirementsStore';
import RequirementsList from '@/modules/requirements/components/RequirementsList';

export default function RequirementsPage() {
  const { user } = useAuthStore();
  const { requirements, loading, error, fetchRequirements } = useRequirementsStore();

  useEffect(() => {
    if (user) {
      fetchRequirements(user.uid);
    }
  }, [user, fetchRequirements]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">REQUERIMIENTOS CREADOS POR TI</h1>
        <Link
          href="/dashboard/requirements/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-amber-400 transition-colors w-full sm:w-auto justify-center sm:justify-start"
        >
          <PlusCircle size={18} />
          <span>Agregar Requerimiento</span>
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-primary text-xl">Cargando requerimientos...</div>
        </div>
      ) : (
        <RequirementsList requirements={requirements} userCreated={true} />
      )}

      <div className="mt-8 md:mt-12">
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">REQUERIMIENTOS CENTRO DE COSTO: CREADOS POR OTROS USUARIOS</h2>
        {loading ? (
          <div className="flex justify-center items-center h-40 md:h-64">
            <div className="text-primary text-lg md:text-xl">Cargando requerimientos...</div>
          </div>
        ) : (
          <RequirementsList requirements={requirements} userCreated={false} />
        )}
      </div>
    </div>
  );
}
