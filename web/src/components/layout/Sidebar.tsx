'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShoppingCart, 
  FileText, 
  Users, 
  BarChart, 
  Settings, 
  ChevronDown,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import Logo from './Logo';
import useAuthStore from '@/modules/auth/store/authStore';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  hasSubMenu?: boolean;
  expanded?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ 
  href, 
  icon, 
  label, 
  active = false, 
  hasSubMenu = false,
  expanded = false,
  onClick
}: SidebarItemProps) => {
  return (
    <Link 
      href={href}
      className={`flex items-center space-x-2 px-4 py-3 rounded-md transition-colors ${
        active 
          ? 'bg-primary text-primary-foreground' 
          : 'text-secondary-foreground hover:bg-secondary-foreground/10'
      }`}
      onClick={onClick}
    >
      <span className="text-xl">{icon}</span>
      <span className="flex-1">{label}</span>
      {hasSubMenu && (
        <ChevronDown 
          className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} 
        />
      )}
    </Link>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'supply-chain': true,
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const logout = useAuthStore(state => state.logout);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle window resize to close mobile menu when switching to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const toggleMenu = (menu: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect is handled by auth state change in the app
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Sidebar content - reused in both desktop and mobile views
  const sidebarContent = (
    <>
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-xs uppercase text-muted-foreground font-semibold tracking-wider px-4 py-2">
          Construcción y Servicios Generales S.A.C.
        </div>
        
        {/* Supply Chain Management */}
        <div>
          <SidebarItem
            href="#"
            icon={<ShoppingCart />}
            label="SUPPLY CHAIN MANAGEMENT"
            hasSubMenu={true}
            expanded={expandedMenus['supply-chain']}
            onClick={() => toggleMenu('supply-chain')}
          />
          
          {expandedMenus['supply-chain'] && (
            <div className="ml-6 mt-1 space-y-1">
              <SidebarItem
                href="/dashboard/entities"
                icon={<Users size={18} />}
                label="Entidades"
                active={pathname.includes('/dashboard/entities')}
              />
              
              <SidebarItem
                href="#"
                icon={<ShoppingCart size={18} />}
                label="Gestión de Compras"
                hasSubMenu={true}
                expanded={expandedMenus['purchases']}
                onClick={() => toggleMenu('purchases')}
              />
              
              {expandedMenus['purchases'] && (
                <div className="ml-6 mt-1 space-y-1">
                  <SidebarItem
                    href="/dashboard/purchases/plan"
                    icon={<FileText size={16} />}
                    label="Plan anual de compras"
                    active={pathname.includes('/dashboard/purchases/plan')}
                  />
                  
                  <SidebarItem
                    href="/dashboard/requirements"
                    icon={<FileText size={16} />}
                    label="Requerimiento"
                    active={pathname.includes('/dashboard/requirements')}
                  />
                  
                  <SidebarItem
                    href="/dashboard/quotations"
                    icon={<FileText size={16} />}
                    label="Cotizaciones"
                    active={pathname.includes('/dashboard/quotations')}
                  />
                  
                  <SidebarItem
                    href="/dashboard/orders"
                    icon={<FileText size={16} />}
                    label="Orden de Compra / Servicio"
                    active={pathname.includes('/dashboard/orders')}
                  />
                  
                  <SidebarItem
                    href="/dashboard/conformity"
                    icon={<FileText size={16} />}
                    label="Conformidad"
                    active={pathname.includes('/dashboard/conformity')}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 w-full rounded-md text-secondary-foreground hover:bg-secondary-foreground/10 transition-colors"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger menu button */}
      <div className="lg:hidden fixed top-0 left-0 z-40 p-4">
        <button 
          onClick={toggleMobileMenu}
          className="p-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary-foreground/10 transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile sidebar */}
      <div 
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-secondary border-r border-border transform transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-4 border-b border-border flex justify-between items-center">
          <Logo />
          <button 
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-md text-secondary-foreground hover:bg-secondary-foreground/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {sidebarContent}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen w-64 bg-secondary border-r border-border flex-col">
        <div className="p-4 border-b border-border">
          <Logo />
        </div>
        {sidebarContent}
      </div>
    </>
  );
}
