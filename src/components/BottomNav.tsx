import { Home, MessageCircle, PlusCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const location = useLocation();
  const [isSeller, setIsSeller] = useState(true); // Default tampilkan, lalu sembunyikan jika ternyata Buyer biasa

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'Buyer') {
          setIsSeller(false);
        }
      }
    };
    checkRole();
  }, []);

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageCircle, label: 'Chat', path: '/chat' },
    // Sembunyikan menu jual jika mendaftar sebagai Pembeli Saja
    ...(isSeller ? [{ icon: PlusCircle, label: 'Jual', path: '/sell' }] : []),
    { icon: User, label: 'Profil', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="mx-auto max-w-lg border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pointer-events-auto sm:border-x">
        <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs transition-colors',
                active ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
        </div>
      </div>
    </nav>
  );
}
