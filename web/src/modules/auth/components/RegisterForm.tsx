'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '../store/authStore';
import { UserRole } from '../types';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'buyer' as UserRole,
    phoneNumber: '',
    companyId: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const register = useAuthStore(state => state.register);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register(
        formData.email,
        formData.password,
        formData.displayName,
        formData.role,
        formData.companyId || undefined,
        formData.phoneNumber || undefined
      );
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-center text-foreground">
        Crear Cuenta
      </h2>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-foreground">
          Correo Electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary shortcat-input"
          placeholder="ejemplo@correo.com"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="displayName" className="block text-sm font-medium text-foreground">
          Nombre Completo
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          value={formData.displayName}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary shortcat-input"
          placeholder="Juan Pérez"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground">
          Número de Teléfono
        </label>
        <input
          id="phoneNumber"
          name="phoneNumber"
          type="tel"
          value={formData.phoneNumber}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary shortcat-input"
          placeholder="+51 999 888 777"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="role" className="block text-sm font-medium text-foreground">
          Rol
        </label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary shortcat-input"
        >
          <option value="buyer">Comprador</option>
          <option value="supplier">Proveedor</option>
          <option value="administrator">Administrador</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="companyId" className="block text-sm font-medium text-foreground">
          ID de Empresa (opcional)
        </label>
        <input
          id="companyId"
          name="companyId"
          type="text"
          value={formData.companyId}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary shortcat-input"
          placeholder="ID de empresa si ya está registrada"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-foreground">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary shortcat-input"
          placeholder="********"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
          Confirmar Contraseña
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary shortcat-input"
          placeholder="********"
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors shortcat-button"
        >
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </div>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
        <Link href="/auth/login" className="text-primary hover:underline">
          Inicia Sesión
        </Link>
      </div>
    </form>
  );
}
