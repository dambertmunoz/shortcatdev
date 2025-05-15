'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import useAuthStore from '@/modules/auth/store/authStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    // Initialize auth state
    initialize();
    
    // No cleanup needed as initialize doesn't return a function in this implementation
    return () => {};
  }, [initialize]);

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-secondary">
        <div className="text-primary text-xl">Cargando...</div>
      </div>
    );
  }

  // Don't render the dashboard if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto lg:ml-64">
        {/* Top padding for mobile to avoid content being hidden under the hamburger button */}
        <div className="pt-14 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
