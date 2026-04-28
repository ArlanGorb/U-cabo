import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logo from '@/assets/u-cabo-logo.png';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const About = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setUserRole(profile.role);
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/50 flex flex-col w-full font-sans">
      <div className="w-full min-h-screen relative">
        {/* Header Desktop - 3D Glass */}
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
              <a href="/about" className="text-base font-bold text-primary transition-colors border-b-2 border-primary pb-1">Visi & Misi</a>
              <a href="/profile" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Profil Saya</a>
            </div>
          </div>
        </header>

        {/* Header Mobile */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-lg font-extrabold tracking-tight">Visi & Misi</h1>
          </div>
        </header>

        <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 perspective-1500">
          <div className="text-center mb-16 md:mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-6">
              <Info className="h-4 w-4" /> Tentang U-Cabo
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">Membangun Ekosistem<br/><span className="text-primary">Kampus Berkelanjutan</span></h1>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg md:text-xl font-medium leading-relaxed">
              U-Cabo hadir sebagai solusi modern bagi mahasiswa untuk saling berbagi nilai guna barang secara aman dan terpercaya.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
            {/* Visi Card */}
            <div className="card-3d bg-gradient-to-b from-white to-slate-50/80 p-12 rounded-[3rem] inner-light flex flex-col items-center text-center group hover:scale-[1.02] transition-all duration-500">
              <div className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center mb-10 shadow-xl shadow-primary/30 group-hover:rotate-6 transition-transform">
                <ShieldCheck className="h-10 w-10" />
              </div>
              <h3 className="text-3xl font-black text-slate-800 mb-8 tracking-tight">Visi Kami</h3>
              <p className="text-xl text-slate-600 leading-relaxed font-semibold italic">
                "Menjadi platform jual beli barang bekas terpercaya bagi civitas akademika yang memudahkan transaksi secara praktis, aman, dan ekonomis."
              </p>
            </div>

            {/* Misi List */}
            <div className="flex flex-col gap-5 stagger-children">
              <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight pl-4 border-l-4 border-primary">Misi Kami</h3>
              {[
                "Menyediakan akses barang terjangkau bagi mahasiswa, dosen, dan staf kampus melalui sistem jual beli barang bekas berkualitas.",
                "Mengoptimalkan pemanfaatan barang yang tidak terpakai dengan menjadi wadah penjualan agar barang tetap bernilai guna.",
                "Menciptakan transaksi yang aman dan terpercaya melalui verifikasi pengguna dari lingkungan kampus.",
                "Mendorong gaya hidup hemat dan berkelanjutan dengan mendukung penggunaan kembali barang layak pakai."
              ].map((misi, index) => (
                <div key={index} className="card-3d flex gap-6 p-6 rounded-[2rem] inner-light">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-lg">
                    {index + 1}
                  </div>
                  <p className="text-slate-700 text-base md:text-lg font-bold leading-relaxed">
                    {misi}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-20 text-center">
            <Button 
              onClick={() => navigate('/')} 
              className="h-16 px-10 rounded-full text-lg font-black bg-slate-900 hover:bg-slate-800 transition-all shadow-3d-deep btn-3d"
            >
              Mulai Belanja di U-Cabo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
