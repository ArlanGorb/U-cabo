import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Menggunakan desain tab
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import logo from '@/assets/u-cabo-logo.png';

export default function Login() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Buyer'); // Default pembeli
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
        navigate('/'); // Arahkan ke Beranda
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <img src={logo} alt="U-Cabo Logo" className="h-16 w-16" />
          <h1 className="text-2xl font-bold">Selamat Datang</h1>
          <p className="text-sm text-muted-foreground">Marketplace Eksklusif Universitas Klabat</p>
        </div>

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
              <Button type="submit" disabled={loading} className="w-full">
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
              <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-white">
                {loading ? 'Mendaftarkan...' : 'Daftar Akun Baru'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
