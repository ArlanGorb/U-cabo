import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Menggunakan desain tab
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, LogIn, UserPlus, Eye, EyeOff, Lock, Shield } from 'lucide-react';
import logo from '@/assets/u-cabo-logo.png';
import SplashScreen from '@/components/SplashScreen';

export default function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Buyer'); // Default pembeli
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  
  // Admin secret code states
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [adminCode, setAdminCode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const ADMIN_SECRET_CODE = 'UCABO-ADMIN-2026';
  const ADMIN_EMAIL = 'arlangorby81@gmail.com';

  const handleLogoTap = () => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    
    if (newCount >= 5) {
      setShowAdminPanel(true);
      setLogoTapCount(0);
      toast({ title: '🔐 Mode Admin', description: 'Panel admin terbuka.' });
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminCode !== ADMIN_SECRET_CODE) {
      toast({ title: 'Ditolak', description: 'Kode rahasia salah.', variant: 'destructive' });
      return;
    }

    if ((adminEmail || ADMIN_EMAIL).toLowerCase().trim() !== ADMIN_EMAIL) {
      toast({ title: 'Ditolak', description: 'Email tidak diizinkan sebagai admin.', variant: 'destructive' });
      return;
    }

    setLoading(true);

    // Coba login dulu
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: adminPassword,
    });

    if (error) {
      // Jika akun belum ada, otomatis daftarkan
      if (error.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: ADMIN_EMAIL,
          password: adminPassword,
          options: {
            data: {
              full_name: 'Arlan Gorby',
              role: 'Admin'
            }
          }
        });

        if (signUpError) {
          toast({ title: 'Gagal Mendaftar', description: signUpError.message, variant: 'destructive' });
          setLoading(false);
          return;
        }

        // Insert profile sebagai Admin
        if (signUpData.user) {
          await supabase.from('profiles').upsert({
            id: signUpData.user.id,
            name: 'Arlan Gorby',
            full_name: 'Arlan Gorby',
            email: ADMIN_EMAIL,
            role: 'Admin'
          });
        }

        toast({ 
          title: '🛡️ Akun Admin Berhasil Dibuat!', 
          description: 'Cek email arlangorby81@gmail.com untuk verifikasi, lalu login kembali dengan password yang sama.' 
        });
        setLoading(false);
        return;
      }

      toast({ title: 'Gagal Masuk', description: 'Password salah.', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Update/create role ke Admin di profiles (upsert untuk mengatasi RLS)
    if (authData.user) {
      await supabase.from('profiles')
        .upsert({
          id: authData.user.id,
          name: 'Arlan Gorby',
          full_name: 'Arlan Gorby',
          email: ADMIN_EMAIL,
          role: 'Admin'
        }, { onConflict: 'id' });
    }

    toast({ title: '🛡️ Admin Aktif', description: 'Selamat datang, Arlan Gorby.' });
    setShowSplash(true);
    setLoading(false);
  };

  const handleAuth = async (e: React.FormEvent, isRegistering: boolean) => {
    e.preventDefault();
    
    const emailLower = email.toLowerCase().trim();

    // FILTER EKSKLUSIF: HANYA EMAIL UNKLAB
    if (!emailLower.endsWith('@student.unklab.ac.id') && !emailLower.endsWith('@unklab.ac.id')) {
      toast({
        title: 'Akses Ditolak!',
        description: 'U-Cabo adalah marketplace kampus. Anda wajib menggunakan Email Resmi UNKLAB.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    if (isRegistering) {
      // PROSES REGISTER (DAFTAR) - Membutuhkan Nama, Email, Password, dan No HP
      const { data: authData, error } = await supabase.auth.signUp({
        email: emailLower,
        password: password,
        options: {
          data: {
            full_name: name, // Simpan Nama Lengkap user
            phone: phone, // Simpan nomor HP ke metadata Supabase
            role: role // Simpan tipe user (Seller / Buyer)
          }
        }
      });

      if (error) {
        toast({ title: 'Gagal Mendaftar', description: error.message, variant: 'destructive' });
      } else {
        // Tembak data ke tabel profiles untuk ditampilkan di Admin Panel
        if (authData.user) {
          await supabase.from('profiles').insert({
            id: authData.user.id,
            name: name,
            full_name: name,
            email: emailLower,
            phone: phone,
            role: role
          });
        }

        toast({ 
          title: 'Pendaftaran Sukses!', 
          description: `Berhasil mendaftar sebagai ${role}. Cek email Anda untuk verifikasi.`,
        });
        // Kosongkan form password agar user bisa langsung pindah ke tab Login
        setPassword('');
      }
    } else {
      // PROSES LOGIN (MASUK) - Hanya butuh Email dan Password
      const { error } = await supabase.auth.signInWithPassword({
        email: emailLower,
        password: password,
      });

       if (error) {
        toast({ title: 'Gagal Masuk', description: 'Email atau password salah.', variant: 'destructive' });
      } else {
        toast({ title: 'Berhasil Masuk!', description: 'Selamat datang kembali di U-Cabo.' });
        setShowSplash(true); // Tampilkan Splash Screen sebagai transisi
      }
    }

    setLoading(false);
  };
   if (showSplash) {
    return <SplashScreen onFinish={() => navigate('/')} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-white to-slate-50 perspective-2000">
      {/* 3D Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-accent/5 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
        {/* Floating sparkles */}
        <div className="absolute top-[20%] left-[30%] w-1 h-1 bg-primary/20 rounded-full animate-float-3d"></div>
        <div className="absolute top-[60%] left-[70%] w-1.5 h-1.5 bg-accent/15 rounded-full animate-float-3d" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-[40%] left-[20%] w-1 h-1 bg-primary/10 rounded-full animate-float-3d" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="w-full max-w-sm space-y-6 card-3d gradient-border rounded-[2rem] bg-gradient-to-b from-white to-slate-50/80 p-8 animate-bounce-in relative overflow-hidden inner-light">
        <div className="flex flex-col items-center gap-2 text-center">
          <img 
            src={logo} 
            alt="U-Cabo Logo" 
            className="h-16 w-16 animate-float-3d cursor-pointer select-none" 
            onClick={handleLogoTap}
            draggable={false}
          />
          <h1 className="text-2xl font-black tracking-tight" style={{textShadow: '0 1px 2px rgba(0,0,0,0.05)'}}>Selamat Datang</h1>
          <p className="text-sm text-muted-foreground font-medium">Marketplace Eksklusif Universitas Klabat</p>
        </div>

        {/* Admin Secret Panel */}
        {showAdminPanel && (
          <div className="animate-slide-up-3d">
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-slate-900 text-white">
              <Shield className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm font-bold">Mode Administrator</p>
                <p className="text-[10px] text-slate-400">Hanya untuk Arlan Gorby</p>
              </div>
              <button 
                onClick={() => setShowAdminPanel(false)} 
                className="ml-auto text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="admin-code" className="text-xs">Kode Rahasia</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="admin-code" 
                    type="password" 
                    placeholder="Masukkan kode rahasia" 
                    required 
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-xs">Email Admin</Label>
                <Input 
                  id="admin-email" 
                  type="email" 
                  value={adminEmail || ADMIN_EMAIL}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder={ADMIN_EMAIL}
                  required
                  className="bg-slate-50"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-xs">Password</Label>
                <div className="relative">
                  <Input 
                    id="admin-password" 
                    type={showAdminPassword ? "text" : "password"} 
                    placeholder="Password admin"
                    required 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 btn-3d btn-ripple">
                <Shield className="h-4 w-4 mr-2" />
                {loading ? 'Memproses...' : 'Masuk sebagai Admin'}
              </Button>
            </form>
          </div>
        )}

        {!showAdminPanel && (
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login" className="flex items-center gap-2"><LogIn className="h-4 w-4"/> Masuk</TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2"><UserPlus className="h-4 w-4"/> Daftar</TabsTrigger>
          </TabsList>

          {/* TAB: MASUK */}
          <TabsContent value="login" className="space-y-4">
            <p className="text-xs text-center text-muted-foreground px-2">
              Satu Akun U-Cabo untuk berbelanja dan berjualan.
            </p>
            <form onSubmit={(e) => handleAuth(e, false)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">Email UNKLAB</Label>
                <Input 
                  id="email-login" 
                  type="email" 
                  placeholder="Misal: name@student.unklab.ac.id atau nama@unklab.ac.id" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">Password</Label>
                <div className="relative">
                  <Input 
                    id="password-login" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Masukkan password Anda"
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full btn-3d btn-ripple animate-glow-pulse">
                {loading ? 'Memproses...' : 'Masuk'}
              </Button>
            </form>
          </TabsContent>

          {/* TAB: DAFTAR */}
          <TabsContent value="register" className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-orange-50 p-3 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300 mb-2">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-xs leading-relaxed">
                  Demi keamanan kampus, kami menolak pendaftaran dari luar (Selain @student atau @unklab). Masukkan <b>No. HP (WhatsApp)</b> agar penjual/pembeli mudah menghubungi Anda.
                </p>
            </div>
            <form onSubmit={(e) => handleAuth(e, true)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name-register">Nama Lengkap</Label>
                <Input 
                  id="name-register" 
                  type="text" 
                  placeholder="Misal: John Doe" 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-register">Email UNKLAB Resmi</Label>
                <Input 
                  id="email-register" 
                  type="email" 
                  placeholder="Misal: name@student.unklab.ac.id atau nama@unklab.ac.id" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone-register">Nomor Handphone (WhatsApp)</Label>
                <Input 
                  id="phone-register" 
                  type="tel" 
                  placeholder="08123456789" 
                  required 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-register">Mendaftar Sebagai (Tipe Akun)</Label>
                <select
                  id="role-register"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="Buyer">Pembeli Saja</option>
                  <option value="Seller">Pembeli & Penjual</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-register">Buat Password</Label>
                <div className="relative">
                  <Input 
                    id="password-register" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Minimal 6 karakter" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-white btn-3d btn-ripple animate-glow-pulse">
                {loading ? 'Mendaftarkan...' : 'Daftar Akun Baru'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
}
