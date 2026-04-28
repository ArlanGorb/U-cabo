import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

type ProtectedRouteProps = {
  children: JSX.Element;
  requireAuth?: boolean;
  requireSeller?: boolean;
  requireAdmin?: boolean;
};

export const ProtectedRoute = ({ children, requireAuth = true, requireSeller = false, requireAdmin = false }: ProtectedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setIsAuthorized(false);
      } else {
        setIsAuthenticated(true);
        
        // Ambil role langsung dari tabel profiles agar sinkron dengan database
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        
        let authorized = true;
        const role = profile?.role || user.user_metadata?.role;
        const email = user.email || '';

        // Jika butuh akses Admin - HANYA izinkan email admin spesifik
        if (requireAdmin) {
          const ADMIN_EMAIL = 'arlangorby81@gmail.com';
          if (email.toLowerCase() !== ADMIN_EMAIL) {
            authorized = false;
          }
        } 
        // Jika butuh akses Seller
        else if (requireSeller) {
          if (role !== 'Seller' && role !== 'Admin') {
            authorized = false;
          }
        }

        setIsAuthorized(authorized);
      }
      setLoading(false);
    };

    checkAccess();
  }, [requireSeller, requireAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium text-slate-500">Memeriksa Akses Keamanan...</p>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    // Belum login, arahkan ke /login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if ((requireSeller || requireAdmin) && !isAuthorized) {
    // Sudah login tapi tidak punya hak akses, kembalikan ke home /
    return <Navigate to="/" replace />;
  }

  return children;
};
