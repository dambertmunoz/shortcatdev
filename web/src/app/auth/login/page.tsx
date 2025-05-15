import { Metadata } from 'next';
import LoginForm from '@/modules/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Login | ShortCat Platform',
  description: 'Inicia sesión en ShortCat Platform',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="flex flex-col items-center">
          {/* <img 
            src="/logo.png" 
            alt="ShortCat Logo" 
            className="h-16 sm:h-20 w-auto mb-3 sm:mb-4" 
          /> */}
          <h1 className="text-2xl sm:text-3xl font-bold text-primary text-center">ShortCat Platform</h1>
          <p className="text-secondary-foreground mt-2 text-center text-sm sm:text-base">Marketplace de construcción y ferretería</p>
        </div>
        
        <div className="bg-card p-4 sm:p-8 rounded-lg shadow-lg border border-primary w-full">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
