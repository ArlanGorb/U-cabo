import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, CheckCircle, Clock, XCircle, FileCheck, ShieldCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
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
  const [ktmPreview, setKtmPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  useEffect(() => {
    checkExistingKyc();
  }, []);

  const checkExistingKyc = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('kyc_requests')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (data) {
         setStatus(data.status);
      }

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) {
        setUserRole(profile.role);
      }
    } else {
      navigate('/login');
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'ktm' | 'selfie') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'ktm') {
        setKtmFile(file);
        setKtmPreview(URL.createObjectURL(file));
      } else {
        setSelfieFile(file);
        setSelfiePreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async () => {
    if (!ktmFile || !selfieFile || !nim) {
      toast({ title: 'Gagal', description: 'NIM, Foto Kartu, dan Selfie harus dilengkapi.', variant: 'destructive'});
      return;
    }
    
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setLoading(false);
      return;
    }

    try {
        const ktmPath = `public/ktm_${user.id}_${Date.now()}.jpg`;
        const { error: errorKtm } = await supabase.storage.from('kyc-images').upload(ktmPath, ktmFile);
        if (errorKtm) throw errorKtm;
        
        const { data: ktmData } = supabase.storage.from('kyc-images').getPublicUrl(ktmPath);
        const ktmUrl = ktmData.publicUrl;

        const selfiePath = `public/selfie_${user.id}_${Date.now()}.jpg`;
        const { error: errorSelfie } = await supabase.storage.from('kyc-images').upload(selfiePath, selfieFile);
        if (errorSelfie) throw errorSelfie;

        const { data: selfieData } = supabase.storage.from('kyc-images').getPublicUrl(selfiePath);
        const selfieUrl = selfieData.publicUrl;

        const { error: insertError } = await supabase.from('kyc_requests').upsert({
           user_id: user.id,
           name: user.user_metadata?.full_name || 'Civitas Akademika',
           nim: nim,
           status: 'pending',
           ktm_url: ktmUrl,
           selfie_url: selfieUrl
        }, { onConflict: 'user_id' });

        if (insertError) throw insertError;

        toast({ title: 'Berhasil', description: 'Permohonan KYC Anda telah dikirim.' });
        setStatus('pending');
    } catch (err: any) {
        toast({ title: 'Gagal', description: err.message, variant: 'destructive' });
    } finally {
        setLoading(false);
    }
  };

  const Header = () => (
    <>
      <header className="hidden md:flex sticky top-0 z-40 glass-3d">
        <div className="flex items-center justify-between px-12 py-5 max-w-7xl mx-auto w-full">
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
            <a href="/profile" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Profil Saya</a>
          </div>
        </div>
      </header>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <img src={logo} alt="U-Cabo" className="h-7 w-auto object-contain" />
            <h1 className="text-base font-extrabold tracking-tight">Verifikasi KYC</h1>
          </div>
        </div>
      </header>
    </>
  );

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  if (status !== 'idle') {
    const s = {
      pending: { icon: <Clock className="h-20 w-20 text-amber-500 animate-pulse" />, text: 'Permohonan Anda Sedang Ditinjau', color: 'text-amber-600', desc: 'Sabar ya! Admin akan memeriksa data Anda dalam waktu maksimal 24 jam.' },
      approved: { icon: <ShieldCheck className="h-20 w-20 text-green-500" />, text: 'Identitas Terverifikasi!', color: 'text-green-600', desc: 'Selamat! Anda sekarang sudah bisa mulai menjual barang di U-Cabo.' },
      rejected: { icon: <XCircle className="h-20 w-20 text-red-500" />, text: 'Permohonan Ditolak', color: 'text-red-600', desc: 'Maaf, data yang Anda kirimkan tidak sesuai. Silakan periksa kembali dan ajukan ulang.' }
    }[status as Exclude<KYCStatus, 'idle'>];

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col w-full">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <Card className="w-full max-w-lg p-10 rounded-[2.5rem] shadow-2xl border-0 bg-white text-center">
            <div className="flex justify-center mb-8">{s.icon}</div>
            <h2 className={`text-3xl font-black tracking-tight mb-4 ${s.color}`}>{s.text}</h2>
            <p className="text-slate-500 font-medium leading-relaxed mb-10">{s.desc}</p>
            
            {status === 'rejected' && (
              <Button 
                className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20" 
                onClick={() => { setStatus('idle'); setKtmFile(null); setSelfieFile(null); setKtmPreview(null); setSelfiePreview(null); }}
              >
                Ajukan Ulang Sekarang
              </Button>
            )}
            {status === 'approved' && (
              <Button 
                className="w-full h-14 rounded-2xl text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200" 
                onClick={() => navigate('/sell')}
              >
                Mulai Jual Barang
              </Button>
            )}
            {status === 'pending' && (
              <Button variant="outline" className="w-full h-14 rounded-2xl text-lg font-bold" onClick={() => navigate('/profile')}>
                Kembali ke Profil
              </Button>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 flex flex-col w-full">
      <Header />
      
      <div className="max-w-5xl mx-auto w-full px-6 py-10 md:py-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-4">
              <ShieldCheck className="h-4 w-4" /> Keamanan Akun
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">Verifikasi KYC</h1>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">
              Lengkapi identitas mahasiswa Anda untuk mulai berjualan dengan aman di ekosistem U-Cabo.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5 space-y-8">
            <Card className="p-8 rounded-[2rem] border-0 shadow-xl shadow-slate-200/50 bg-white">
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-black text-slate-700 uppercase tracking-wider ml-1">Nomor Induk Mahasiswa (NIM)</Label>
                  <Input 
                    placeholder="Contoh: 1050221100..." 
                    className="h-14 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all text-lg font-bold"
                    value={nim} 
                    onChange={(e) => setNim(e.target.value)} 
                  />
                </div>

                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                  <h4 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                    <Info className="h-4 w-4" /> Panduan Verifikasi
                  </h4>
                  <ul className="text-xs text-blue-700/80 space-y-2 font-medium">
                    <li>• Gunakan Kartu Tanda Mahasiswa (KTM) asli</li>
                    <li>• Pastikan wajah Anda terlihat jelas saat selfie</li>
                    <li>• Seluruh teks pada kartu harus terbaca</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Button
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] hidden md:flex items-center justify-center gap-3"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : <><CheckCircle className="h-6 w-6" /> Kirim Verifikasi</>}
            </Button>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KTM Card */}
            <div className="space-y-3">
              <Label className="text-sm font-black text-slate-700 uppercase tracking-wider ml-1">1. Foto Kartu ID</Label>
              <div 
                className={`group relative aspect-[3/4] rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center
                  ${ktmPreview ? 'border-primary' : 'border-slate-300 bg-white hover:border-primary hover:bg-primary/5'}`}
                onClick={() => document.getElementById('ktm-input')?.click()}
              >
                {ktmPreview ? (
                  <img src={ktmPreview} className="w-full h-full object-cover" alt="KTM" />
                ) : (
                  <div className="flex flex-col items-center text-center p-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                      <Upload className="h-8 w-8 text-slate-400 group-hover:text-primary" />
                    </div>
                    <span className="text-sm font-bold text-slate-500">Upload Foto KTM</span>
                    <span className="text-[10px] text-slate-400 mt-2 font-medium">JPG, PNG maks 5MB</span>
                  </div>
                )}
                <input id="ktm-input" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'ktm')} />
              </div>
            </div>

            {/* Selfie Card */}
            <div className="space-y-3">
              <Label className="text-sm font-black text-slate-700 uppercase tracking-wider ml-1">2. Foto Selfie</Label>
              <div 
                className={`group relative aspect-[3/4] rounded-[2rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center
                  ${selfiePreview ? 'border-primary' : 'border-slate-300 bg-white hover:border-primary hover:bg-primary/5'}`}
                onClick={() => document.getElementById('selfie-input')?.click()}
              >
                {selfiePreview ? (
                  <img src={selfiePreview} className="w-full h-full object-cover" alt="Selfie" />
                ) : (
                  <div className="flex flex-col items-center text-center p-6">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                      <Camera className="h-8 w-8 text-slate-400 group-hover:text-primary" />
                    </div>
                    <span className="text-sm font-bold text-slate-500">Upload Foto Selfie</span>
                    <span className="text-[10px] text-slate-400 mt-2 font-medium">Pegang KTM di samping wajah</span>
                  </div>
                )}
                <input id="selfie-input" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'selfie')} />
              </div>
            </div>

            <Button
              className="w-full h-16 bg-primary text-white rounded-[2rem] font-black text-lg md:hidden shadow-xl"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Mengirim...' : 'Kirim Verifikasi Sekarang'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCVerification;
