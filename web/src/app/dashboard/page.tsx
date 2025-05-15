'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/modules/auth/store/authStore';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    // Redirect to requirements page as the main dashboard view
    router.push('/dashboard/requirements');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="text-foreground text-xl">Redirigiendo...</div>
    </div>
  );
}
