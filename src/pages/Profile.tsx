import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Package, FileCheck, Settings, ChevronRight, LogOut, ShoppingBag, Info, Mail, Phone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BottomNav } from '@/components/BottomNav';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const menuItems = [
  { icon: ShoppingBag, label: 'Pesanan Saya', path: '/orders', desc: 'Riwayat belanja Anda' },
  { icon: Package, label: 'Produk Saya', path: '/seller', desc: 'Kelola barang jualan' },
  { icon: FileCheck, label: 'Verifikasi KYC', path: '/kyc', desc: 'Verifikasi identitas mahasiswa' },
];

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string>('unverified');
  const [isSeller, setIsSeller] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        if (user.user_metadata?.role === 'Buyer') {
          setIsSeller(false);
        }
        
        // Cek status KYC
        const { data } = await supabase.from('kyc_requests').select('status').eq('user_id', user.id).single();
        if (data) {
           setKycStatus(data.status);
        }
      } else {
        navigate('/login');
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen pb-20 bg-background flex flex-col w-full">
      <div className="w-full bg-background min-h-screen relative">
        {/* Header Desktop (Same as Index) */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur hidden md:block">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <h1 className="text-2xl font-black text-primary tracking-tight">U-Cabo</h1>
            </div>
            <div className="flex items-center gap-6">
              <a href="/" className="text-sm font-semibold hover:text-primary transition-colors">Home</a>
              <a href="/chat" className="text-sm font-semibold hover:text-primary transition-colors">Chat</a>
              {isSeller && <a href="/sell" className="text-sm font-semibold hover:text-primary transition-colors">Jual Barang</a>}
              <a href="/profile" className="text-sm font-semibold text-primary transition-colors">Profil Saya</a>
            </div>
          </div>
        </header>

        {/* Profil Header dengan Gradient Keren */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 pb-8 pt-12 px-8 md:px-12 text-white shadow-md sm:rounded-b-[2.5rem]">
          <div className="absolute top-6 left-8 md:hidden flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 transition-colors rounded-full" onClick={() => navigate('/')}>
              <ChevronRight className="h-6 w-6 rotate-180" />
            </Button>
            <h1 className="text-xl font-extrabold tracking-tight">Profilku</h1>
          </div>
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 h-48 w-48 rounded-full bg-black/10 blur-2xl"></div>
        
        <div className="relative z-10 mt-14 flex items-center gap-6 md:gap-8">
          <div className="relative h-24 w-24 md:h-32 md:w-32 overflow-hidden rounded-full border-4 border-white/20 bg-white/10 shadow-2xl backdrop-blur-md">
            <img src={`https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`} alt="avatar" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col text-white">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-extrabold line-clamp-1 drop-shadow-md">{user?.user_metadata?.full_name || 'Nama Pengguna'}</h2>
              {kycStatus === 'approved' && <ShieldCheck className="h-6 w-6 md:h-8 md:w-8 shrink-0 text-green-300 drop-shadow-sm" />}
            </div>
            <p className="text-base md:text-lg text-white/90 font-medium mt-1">{user?.email || 'Memuat...'}</p>
            {user?.user_metadata?.phone && (
              <p className="text-sm text-white/80 mt-1">No. HP: {user.user_metadata.phone}</p>
            )}
            <Badge variant={kycStatus === 'approved' ? 'secondary' : 'destructive'} className="mt-3 md:mt-4 w-fit px-4 py-1.5 text-sm bg-white/20 hover:bg-white/30 backdrop-blur-md border-0 text-white shadow-sm font-bold">
               {kycStatus === 'approved' ? `${isSeller ? 'Seller' : 'Buyer'} Terverifikasi` : 'Belum Terverifikasi'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="mb-4 text-sm font-extrabold text-muted-foreground uppercase tracking-widest px-1">Aktivitas Anda</div>
            <div className="space-y-4">
                {menuItems.filter(item => {
                  // Jika bukan seller, hilangkan HANYA opsi '/seller' (Produk Saya). KYC tetap muncul.
                  if (!isSeller && item.path === '/seller') return false;
                  return true;
                }).map((item) => (
                <Card
                  key={item.path}
                  className="group flex cursor-pointer items-center gap-5 overflow-hidden border-transparent bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-black/5 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]"
                  onClick={() => navigate(item.path)}
                >
                  <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">
                    <item.icon className="h-7 w-7 md:h-8 md:w-8" />
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-bold text-foreground/90">{item.label}</p>
                    <p className="text-sm font-medium text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:bg-primary group-hover:text-white">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-4 text-sm font-extrabold text-muted-foreground uppercase tracking-widest px-1">Lainnya</div>
            <div className="space-y-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="group flex cursor-pointer items-center gap-5 overflow-hidden border-transparent bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-black/5 hover:shadow-lg hover:shadow-primary/5 active:scale-[0.98]">
                    <div className="flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-600 transition-colors group-hover:bg-orange-500/20">
                      <Info className="h-7 w-7 md:h-8 md:w-8" />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-foreground/90">Tentang U-Cabo</p>
                      <p className="text-sm font-medium text-muted-foreground mt-0.5">Pusat Bantuan & Kontak</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:bg-primary group-hover:text-white">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Card>
                </DialogTrigger>
                <DialogContent className="w-[90%] max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold text-primary">Tentang U-Cabo</DialogTitle>
                    <DialogDescription className="text-center">
                      Marketplace eksklusif untuk Mahasiswa Universitas Klabat (UNKLAB).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-2 space-y-4">
              <div className="rounded-xl bg-primary/5 p-4 text-sm leading-relaxed text-foreground">
                <p>
                  <strong>U-Cabo</strong> dibangun untuk mempermudah ekosistem jual beli kebutuhan kuliah seperti modul, alat praktikum, jas almamater preloved, hingga keperluan kosan yang aman karena hanya untuk kalangan mahasiswa kampus.
                </p>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-bold text-muted-foreground">Kontak Hubungi Kami / Bantuan:</h4>
                <div className="space-y-2">
                  <a href="mailto:admin@ucabomarket.co.id" className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-muted/50">
                    <Mail className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Email Bantuan & Bisnis</p>
                      <p className="text-sm font-bold">admin@ucabomarket.co.id</p>
                    </div>
                  </a>
                  <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-muted/50">
                    <Phone className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">WhatsApp Admin CS</p>
                      <p className="text-sm font-bold">+62 812-3456-7890</p>
                    </div>
                  </a>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-4">
                © 2026 U-Cabo UNKLAB. All rights reserved.
              </p>
            </div>
          </DialogContent>
        </Dialog>

              <Button onClick={handleLogout} variant="destructive" className="mt-8 w-full gap-2 rounded-xl py-7 text-lg font-bold shadow-sm transition-transform hover:-translate-y-0.5 active:scale-95">
                <LogOut className="h-6 w-6" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  </div>
  );
};

export default Profile;
