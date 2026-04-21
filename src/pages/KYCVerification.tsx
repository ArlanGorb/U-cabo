import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/u-cabo-logo.png';

type KYCStatus = 'idle' | 'pending' | 'approved' | 'rejected';

const KYCVerification = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<KYCStatus>('idle');
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('Buyer');
  
  const [nim, setNim] = useState('');
  const [ktmFile, setKtmFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  // Pengecekan awal saat halaman dibuka, kita periksa apakah user sudah mengirim KYC
  useEffect(() => {
    checkExistingKyc();
  }, []);

  const checkExistingKyc = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('kyc_requests')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (data) {
         setStatus(data.status); // pending, approved, atau rejected
      }

      // Fetch User Role
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) {
        setUserRole(profile.role);
      }
    } else {
      navigate('/login');
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!ktmFile || !selfieFile || !nim) {
      toast({ title: 'Gagal', description: 'Nomor ID, Foto Kartu, dan Selfie harus dilengkapi.', variant: 'destructive'});
      return;
    }
    
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    let ktmUrl = '';
    let selfieUrl = '';

    // Upload KTM ke Storage Supabase 
    // Catatan: Anda perlu membuat bucket 'kyc-images' dan mengizinkan publik
    try {
        const ktmPath = `public/ktm_${user.id}_${Math.random()}.jpg`;
        const { error: errorKtm } = await supabase.storage.from('kyc-images').upload(ktmPath, ktmFile);
        if (!errorKtm) {
           const { data } = supabase.storage.from('kyc-images').getPublicUrl(ktmPath);
           ktmUrl = data.publicUrl;
        }

        const selfiePath = `public/selfie_${user.id}_${Math.random()}.jpg`;
        const { error: errorSelfie } = await supabase.storage.from('kyc-images').upload(selfiePath, selfieFile);
        if (!errorSelfie) {
           const { data } = supabase.storage.from('kyc-images').getPublicUrl(selfiePath);
           selfieUrl = data.publicUrl;
        }

        // Simpan ke Tabel database kyc_requests
        const { error: insertError } = await supabase.from('kyc_requests').upsert({
           user_id: user.id,
           name: user.user_metadata?.full_name || 'Civitas Akademika',
           nim: nim,
           status: 'pending',
           ktm_url: ktmUrl,
           selfie_url: selfieUrl
        }, { onConflict: 'user_id' }); // Jika sudah ada, ia akan update

        if (insertError) {
          toast({ title: 'Server Error', description: 'Gagal menyimpan ke database.', variant: 'destructive'});
        } else {
          setStatus('pending');
          toast({ title: 'Berhasil', description: 'Data verifikasi berhasil dikirim.'});
        }
    } catch (e) {
        toast({ title: 'Error', description: 'Ada kesalahan saat upload.', variant: 'destructive'});
    }
    
    setLoading(false);
  };

  const statusUI: Record<KYCStatus, { icon: React.ReactNode; text: string; color: string }> = {
    idle: { icon: null, text: '', color: '' },
    pending: { icon: <Clock className="h-12 w-12 text-yellow-500" />, text: 'Verifikasi sedang diproses. Tunggu 1-2 hari kerja.', color: 'text-yellow-600' },
    approved: { icon: <CheckCircle className="h-12 w-12 text-green-500" />, text: 'Akun Anda sudah terverifikasi! Selamat berjualan.', color: 'text-green-600' },
    rejected: { icon: <XCircle className="h-12 w-12 text-destructive" />, text: 'Verifikasi ditolak. Silakan upload ulang dokumen.', color: 'text-destructive' },
  };

  if (loading) {
     return <div className="min-h-screen pt-40 text-center text-slate-500 bg-slate-50 font-medium flex justify-center items-center flex-col">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        Memuat data verifikasi...
     </div>;
  }

  if (status !== 'idle') {
    const s = statusUI[status];
    return (
      <div className="min-h-screen bg-slate-50 pb-20 flex flex-col w-full">
        <div className="w-full bg-slate-50 min-h-screen relative">
          {/* Header Desktop */}
          <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur hidden md:block">
            <div className="flex items-center justify-between px-8 py-4">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                <img src={logo} alt="U-Cabo" className="h-10 w-auto object-contain" />
                <h1 className="text-2xl font-black text-primary tracking-tighter">U-Cabo</h1>
              </div>
              <div className="flex items-center gap-6">
                <a href="/" className="text-sm font-semibold hover:text-primary transition-colors">Home</a>
                <a href="/chat" className="text-sm font-semibold hover:text-primary transition-colors">Chat</a>
                {userRole === 'Seller' && (
                  <a href="/sell" className="text-sm font-semibold hover:text-primary transition-colors">Jual Barang</a>
                )}
                <a href="/profile" className="text-sm font-semibold hover:text-primary transition-colors">Profil Saya</a>
              </div>
            </div>
          </header>

          {/* Header Mobile */}
          <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-white px-4 py-4 backdrop-blur md:hidden">
            <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-semibold">Verifikasi KYC</h1>
          </header>

          <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-20 text-center">
            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center max-w-lg w-full">
               {s.icon}
               <p className={`mt-6 text-lg font-bold ${s.color} leading-relaxed`}>{s.text}</p>
               {status === 'rejected' && (
                 <Button className="mt-8 px-8 py-6 rounded-full text-base font-bold" onClick={() => { setStatus('idle'); setKtmFile(null); setSelfieFile(null); }}>Upload Ulang Sekarang</Button>
               )}
               {status === 'approved' && (
                 <Button className="mt-8 px-8 py-6 rounded-full text-base font-bold bg-primary" onClick={() => navigate('/sell')}>Mulai Jual Barang</Button>
               )}
            </div>
          </div>
          <div className="md:hidden">
            <BottomNav />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 flex flex-col w-full">
      <div className="w-full bg-slate-50 min-h-screen relative">
        {/* Header Desktop */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur hidden md:block">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src={logo} alt="U-Cabo" className="h-10 w-auto object-contain" />
              <h1 className="text-2xl font-black text-primary tracking-tighter">U-Cabo</h1>
            </div>
            <div className="flex items-center gap-6">
              <a href="/" className="text-sm font-semibold hover:text-primary transition-colors">Home</a>
              <a href="/chat" className="text-sm font-semibold hover:text-primary transition-colors">Chat</a>
              <a href="/sell" className="text-sm font-semibold hover:text-primary transition-colors">Jual Barang</a>
              <a href="/profile" className="text-sm font-semibold hover:text-primary transition-colors">Profil Saya</a>
            </div>
          </div>
        </header>

        {/* Header Mobile */}
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-white px-4 py-4 backdrop-blur md:hidden">
          <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
          <h1 className="text-sm font-semibold">Verifikasi KYC</h1>
        </header>

        <div className="mx-auto max-w-4xl px-4 md:px-8 pt-6 md:pt-10">
          <div className="hidden md:flex items-center gap-3 mb-8">
             <CheckCircle className="h-8 w-8 text-primary" />
             <h1 className="text-3xl font-black text-slate-800 tracking-tight">Verifikasi KYC Mahasiswa</h1>
          </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
                Untuk bisa berjualan di U-Cabo, Anda perlu memverifikasi identitas sebagai civitas akademika UNKLAB (Mahasiswa, Dosen, atau Staff).
            </p>
            
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">Nomor Induk / Nomor ID (NIM/NIDN/NIK)</CardTitle>
              </CardHeader>
              <CardContent>
                 <Input 
                     placeholder="Contoh: 2021... atau 0914..." 
                     className="h-12 rounded-xl"
                     value={nim} 
                     onChange={(e) => setNim(e.target.value)} 
                 />
              </CardContent>
            </Card>

            <Button
              className="w-full h-14 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl font-bold text-lg shadow-lg shadow-accent/20 hidden md:flex"
              onClick={handleSubmit}
            >
              Kirim Verifikasi Sekarang
            </Button>
          </div>

          <div className="space-y-4">
            {/* KTM Upload */}
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">1. Foto Kartu ID (KTM / ID Pegawai)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-[11px] text-muted-foreground">Pastikan foto jelas, nama dan Nomor ID terlihat.</p>
                <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 p-8 transition-all hover:border-primary hover:bg-primary/5">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-slate-600 text-center">
                     {ktmFile ? ktmFile.name : 'Pilih atau Foto Kartu ID'}
                  </span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setKtmFile(e.target.files?.[0] ?? null)} />
                </label>
              </CardContent>
            </Card>

            {/* Selfie Upload */}
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold">2. Selfie dengan Kartu ID</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-[11px] text-muted-foreground">Pegang Kartu ID di samping wajah Anda.</p>
                <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 p-8 transition-all hover:border-primary hover:bg-primary/5">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-slate-600 text-center">
                     {selfieFile ? selfieFile.name : 'Pilih atau Foto Selfie'}
                  </span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0] ?? null)} />
                </label>
              </CardContent>
            </Card>

            <Button
              className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl font-bold md:hidden"
              onClick={handleSubmit}
            >
              Kirim Verifikasi
            </Button>
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

export default KYCVerification;
