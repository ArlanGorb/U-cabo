import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Package, FileCheck, Settings, ChevronRight, LogOut, ShoppingBag, Info, Mail, Phone, Camera, Loader2, Shield, Users, BarChart3, AlertTriangle, CreditCard } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import logo from '@/assets/u-cabo-logo.png';

const menuItems = [
  { icon: ShoppingBag, label: 'Pesanan Saya', path: '/orders', desc: 'Riwayat belanja Anda' },
  { icon: Package, label: 'Produk Saya', path: '/seller', desc: 'Kelola barang jualan' },
  { icon: FileCheck, label: 'Verifikasi KYC', path: '/kyc', desc: 'Verifikasi identitas mahasiswa' },
];

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<string>('unverified');
  const [isSeller, setIsSeller] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const ADMIN_EMAIL = 'arlangorby81@gmail.com';

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase.from('profiles').select('role, avatar_url').eq('id', user.id).single();
        if (profile) {
          setIsSeller(profile.role !== 'Buyer');
          setUserRole(profile.role);
          setAvatarUrl(profile.avatar_url);

          // Admin hanya untuk email spesifik
          const emailIsAdmin = user.email?.toLowerCase() === ADMIN_EMAIL;
          setIsAdmin(emailIsAdmin);

          // Jika user bukan admin tapi punya role Admin, reset ke Seller
          if (!emailIsAdmin && profile.role === 'Admin') {
            await supabase.from('profiles').update({ role: 'Seller' }).eq('id', user.id);
            setUserRole('Seller');
          }
        }
        
        // Cek status KYC
        const { data: kycData } = await supabase.from('kyc_requests').select('status').eq('user_id', user.id).single();
        if (kycData) {
           setKycStatus(kycData.status);
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

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Pilih gambar terlebih dahulu.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast({ title: 'Berhasil', description: 'Foto profil Anda telah diperbarui.' });
    } catch (error: any) {
      toast({ title: 'Gagal Mengunggah', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50 pb-20 flex flex-col w-full font-sans">
      <div className="w-full min-h-screen relative">
        {/* Header Desktop Premium - 3D Glass */}
        <header className="sticky top-0 z-40 glass-3d hidden md:block">
          <div className="flex items-center justify-between px-12 py-5 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src={logo} alt="U-Cabo" className="h-10 md:h-12 w-auto object-contain" />
              <div className="flex flex-col">
                <h1 className="text-3xl font-black text-primary tracking-tighter leading-none">U-Cabo</h1>
                <p className="text-[8px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1">Praktis • Aman • Ekonomis</p>
              </div>
            </div>
            <div className="flex items-center gap-10">
              <a href="/" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Home</a>
              <a href="/chat" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Chat</a>
              {userRole && (userRole.toLowerCase() === 'seller' || userRole.toLowerCase() === 'admin') && (
                <a href="/sell" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Jual Barang</a>
              )}
              <a href="/about" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Visi & Misi</a>
              <a href="/profile" className="text-base font-bold text-primary transition-colors border-b-2 border-primary pb-1">Profil Saya</a>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-10 md:py-16 perspective-1500">
          {/* Profile Hero Card - 3D */}
          <section className="relative overflow-hidden bg-gradient-to-b from-white to-slate-50/80 rounded-[3rem] gradient-border shadow-3d-deep p-8 md:p-12 mb-12 inner-light animate-bounce-in transition-all duration-500 hover:shadow-3d-hover">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full -ml-10 -mb-10 blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10 text-center md:text-left">
              {/* Avatar Section with Upload */}
              <div className="relative group">
                <div className="relative h-32 w-32 md:h-44 md:w-44 overflow-hidden rounded-[2.5rem] border-8 border-white/80 bg-slate-100 shadow-3d-deep transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-3d-hover animate-pulse-glow">
                  <img 
                    src={avatarUrl || `https://ui-avatars.com/api/?name=${user?.user_metadata?.full_name || 'User'}&background=random`} 
                    alt="avatar" 
                    className="h-full w-full object-cover" 
                  />
                  
                  <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-sm">
                    {uploading ? (
                      <Loader2 className="h-10 w-10 text-white animate-spin" />
                    ) : (
                      <>
                        <Camera className="h-10 w-10 text-white mb-2" />
                        <span className="text-[10px] text-white font-black uppercase tracking-widest">Ganti Foto</span>
                      </>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
                </div>
                {!uploading && (
                  <div className="absolute -bottom-2 -right-2 h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-white md:h-14 md:w-14">
                    <Camera className="h-5 w-5 md:h-6 w-6" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 flex flex-col justify-center pt-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-3">
                  <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                    {user?.user_metadata?.full_name || 'Nama Pengguna'}
                  </h2>
                  {kycStatus === 'approved' && (
                    <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-full border border-green-100 shadow-sm">
                      <ShieldCheck className="h-5 w-5" />
                      <span className="text-xs font-black uppercase tracking-wider">Verified</span>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex items-center gap-1.5 bg-slate-900 text-yellow-400 px-3 py-1.5 rounded-full shadow-sm">
                      <Shield className="h-4 w-4" />
                      <span className="text-xs font-black uppercase tracking-wider">Admin</span>
                    </div>
                  )}
                </div>
                
                <p className="text-lg md:text-xl text-slate-500 font-bold mb-6">{user?.email}</p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <Badge className="px-5 py-2 text-sm bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl border-0">
                    {kycStatus === 'approved' ? (isSeller ? 'OFFICIAL SELLER' : 'BUYER') : 'UNVERIFIED'}
                  </Badge>
                  {user?.user_metadata?.phone && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-100 text-sm font-bold">
                      <Phone className="h-4 w-4" /> {user.user_metadata.phone}
                    </div>
                  )}
                </div>
              </div>
              
              <Button onClick={handleLogout} variant="outline" className="hidden md:flex h-14 px-8 rounded-2xl border-2 border-red-100 text-red-500 font-black hover:bg-red-50 hover:text-red-600 transition-all gap-3 shadow-3d btn-3d active:scale-95">
                <LogOut className="h-5 w-5" /> Keluar
              </Button>
            </div>
          </section>

          {/* Activity & Menu Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main Menu Cards */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-[0.2em] px-2 mb-4">Layanan Anda</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 stagger-bounce">
                {menuItems.filter(item => isSeller || item.path !== '/seller').map((item) => (
                  <Card
                    key={item.path}
                    className="card-3d group relative cursor-pointer overflow-hidden p-8 rounded-[2.5rem] inner-light active:scale-95"
                    onClick={() => navigate(item.path)}
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/5 text-primary mb-6 transition-all duration-500 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                      <item.icon className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xl font-black text-slate-900">{item.label}</p>
                      <p className="text-sm font-bold text-slate-400">{item.desc}</p>
                    </div>
                    <div className="absolute bottom-8 right-8 h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-300 flex transition-all group-hover:bg-primary group-hover:text-white group-hover:rotate-45 shadow-3d">
                      <ChevronRight className="h-6 w-6" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* ADMIN PANEL - Only visible for Admin role */}
            {isAdmin && (
              <div className="lg:col-span-3 space-y-6">
                <div className="flex items-center gap-3 px-2 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-[0.2em]">Panel Admin</h3>
                    <p className="text-xs text-slate-400 font-bold">Akses khusus administrator</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-bounce">
                  <Card
                    className="card-3d group relative cursor-pointer overflow-hidden p-6 rounded-[2rem] inner-light active:scale-95 border-2 border-slate-900/5 bg-gradient-to-br from-slate-50 to-white"
                    onClick={() => navigate('/admin')}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-yellow-400 mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg">
                      <BarChart3 className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-black text-slate-900">Dashboard</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Statistik & aktivitas</p>
                    <div className="absolute bottom-6 right-6 h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-300 flex transition-all group-hover:bg-slate-900 group-hover:text-yellow-400 group-hover:rotate-45">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Card>

                  <Card
                    className="card-3d group relative cursor-pointer overflow-hidden p-6 rounded-[2rem] inner-light active:scale-95 border-2 border-slate-900/5 bg-gradient-to-br from-slate-50 to-white"
                    onClick={() => navigate('/admin/kyc')}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg">
                      <Users className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-black text-slate-900">Verifikasi KYC</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Kelola identitas user</p>
                    <div className="absolute bottom-6 right-6 h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-300 flex transition-all group-hover:bg-emerald-600 group-hover:text-white group-hover:rotate-45">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Card>

                  <Card
                    className="card-3d group relative cursor-pointer overflow-hidden p-6 rounded-[2rem] inner-light active:scale-95 border-2 border-slate-900/5 bg-gradient-to-br from-slate-50 to-white"
                    onClick={() => navigate('/admin/products')}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg">
                      <Package className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-black text-slate-900">Moderasi Produk</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Take-down listing</p>
                    <div className="absolute bottom-6 right-6 h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-300 flex transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:rotate-45">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Card>

                  <Card
                    className="card-3d group relative cursor-pointer overflow-hidden p-6 rounded-[2rem] inner-light active:scale-95 border-2 border-slate-900/5 bg-gradient-to-br from-slate-50 to-white"
                    onClick={() => navigate('/admin/transactions')}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500 text-white mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg">
                      <CreditCard className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-black text-slate-900">Keuangan</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Transaksi & penarikan</p>
                    <div className="absolute bottom-6 right-6 h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-300 flex transition-all group-hover:bg-amber-500 group-hover:text-white group-hover:rotate-45">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Card>

                  <Card
                    className="card-3d group relative cursor-pointer overflow-hidden p-6 rounded-[2rem] inner-light active:scale-95 border-2 border-red-100/50 bg-gradient-to-br from-red-50/30 to-white"
                    onClick={() => navigate('/admin/reports')}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-white mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg">
                      <AlertTriangle className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-black text-slate-900">Laporan</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Fraud & penipuan</p>
                    <div className="absolute bottom-6 right-6 h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-300 flex transition-all group-hover:bg-red-600 group-hover:text-white group-hover:rotate-45">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Card>

                  <Card
                    className="card-3d group relative cursor-pointer overflow-hidden p-6 rounded-[2rem] inner-light active:scale-95 border-2 border-slate-900/5 bg-gradient-to-br from-slate-50 to-white"
                    onClick={() => navigate('/admin/settings')}
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-white mb-5 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg">
                      <Settings className="h-7 w-7" />
                    </div>
                    <p className="text-lg font-black text-slate-900">Pengaturan</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">Konfigurasi sistem</p>
                    <div className="absolute bottom-6 right-6 h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-300 flex transition-all group-hover:bg-violet-600 group-hover:text-white group-hover:rotate-45">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Sidebar Cards */}
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-[0.2em] px-2 mb-4">Informasi</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Card className="card-3d group cursor-pointer overflow-hidden p-8 rounded-[2.5rem] inner-light">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 mb-6 group-hover:bg-amber-500 group-hover:text-white transition-all">
                      <Info className="h-8 w-8" />
                    </div>
                    <p className="text-xl font-black text-slate-900 mb-1">Pusat Bantuan</p>
                    <p className="text-sm font-bold text-slate-400 leading-relaxed">Butuh bantuan transaksi atau pertanyaan seputar U-Cabo?</p>
                  </Card>
                </DialogTrigger>
                <DialogContent className="max-w-2xl rounded-[3rem] p-0 overflow-hidden border-0 shadow-2xl">
                  <div className="bg-primary p-12 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <h2 className="text-4xl font-black tracking-tight mb-2">Hubungi Kami</h2>
                    <p className="text-primary-foreground/80 font-bold">Tim kami siap membantu Anda kapan saja.</p>
                  </div>
                  <div className="p-12 space-y-8 bg-white">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <a href="mailto:admin@ucabomarket.co.id" className="flex flex-col gap-4 p-6 rounded-3xl border-2 border-slate-50 hover:border-primary/20 hover:bg-slate-50 transition-all">
                        <div className="h-12 w-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                          <Mail className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Kirim Email</p>
                          <p className="text-lg font-black text-slate-800">admin@ucabo.com</p>
                        </div>
                      </a>
                      <a href="https://wa.me/6281234567890" target="_blank" rel="noreferrer" className="flex flex-col gap-4 p-6 rounded-3xl border-2 border-slate-50 hover:border-primary/20 hover:bg-slate-50 transition-all">
                        <div className="h-12 w-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
                          <Phone className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">WhatsApp CS</p>
                          <p className="text-lg font-black text-slate-800">+62 812-3456</p>
                        </div>
                      </a>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Mobile Logout Button */}
              <Button onClick={handleLogout} variant="destructive" className="md:hidden w-full h-16 rounded-[2rem] text-lg font-black shadow-3d-deep btn-3d">
                <LogOut className="h-6 w-6 mr-3" /> Keluar
              </Button>
            </div>
          </div>
        </main>

        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default Profile;
