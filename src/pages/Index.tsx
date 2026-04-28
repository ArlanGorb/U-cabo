import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BottomNav } from '@/components/BottomNav';
import { ProductCard } from '@/components/ProductCard';
import logo from '@/assets/u-cabo-logo.png';
import { supabase } from '@/lib/supabase';

const Index = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(['Semua']);
  const [loading, setLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(true);
  const [banner, setBanner] = useState({
    title: 'Marketplace Khusus\nMahasiswa UNKLAB',
    subtitle: 'Jual & beli barang preloved, buku cetak, hingga perangkat praktikum dengan aman dan mudah.',
    badge: 'U-Cabo'
  });

  // Mengambil data dari Supabase saat komponen dimuat
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('name').order('name', { ascending: true });
      if (data) setCategories(['Semua', ...data.map((c: any) => c.name)]);
    };
    fetchCategories();

    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile?.role === 'Buyer') {
          setIsSeller(false);
        }
      }
    };
    fetchUserRole();

    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .neq('status', 'sold') // Menyembunyikan produk yang sudah terjual
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
      } else if (data) {
        setProducts(data);
      }
      setLoading(false);
    };

    fetchProducts();

    const fetchBannerSetting = async () => {
      const { data, error } = await supabase.from('system_settings').select('*')
        .in('key', ['banner_title', 'banner_subtitle', 'banner_badge']);
      
      if (data && data.length > 0) {
        let newTitle = banner.title;
        let newSubtitle = banner.subtitle;
        let newBadge = banner.badge;
        
        data.forEach(item => {
          if (item.key === 'banner_title') newTitle = item.value.replace(/\\n/g, '\n');
          if (item.key === 'banner_subtitle') newSubtitle = item.value;
          if (item.key === 'banner_badge') newBadge = item.value;
        });
        
        setBanner({ title: newTitle, subtitle: newSubtitle, badge: newBadge });
      }
    };
    fetchBannerSetting();
  }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    // Ubah perbandingan kategori menjadi case-insensitive agar cocok dengan huruf besar/kecil
    const matchCat = activeCategory === 'Semua' || p.category.toLowerCase() === activeCategory.toLowerCase();
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen pb-20 bg-gradient-to-b from-slate-50 via-white to-slate-50/50 flex flex-col w-full">
      {/* Header Desktop Premium - 3D Glass */}
      <header className="sticky top-0 z-40 glass-3d hidden md:block">
        <div className="flex items-center justify-between px-12 py-5 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <img src={logo} alt="U-Cabo" className="h-10 md:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
            <div className="flex flex-col">
              <h1 className="text-3xl lg:text-4xl font-black text-primary tracking-tighter leading-none">U-Cabo</h1>
              <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase mt-1">Praktis • Aman • Ekonomis</p>
            </div>
          </div>
          
          <div className="relative flex-1 max-w-md mx-8">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari barang di UNKLAB..."
              className="pl-12 h-11 text-sm rounded-full bg-white/60 border border-white/80 shadow-3d focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:shadow-3d-hover transition-all duration-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-10">
            <a href="/" className="text-base font-bold text-primary transition-colors border-b-2 border-primary pb-1">Home</a>
            <a href="/chat" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Chat</a>
            {isSeller && <a href="/sell" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Jual Barang</a>}
            <a href="/about" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Visi & Misi</a>
            <a href="/profile" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Profil Saya</a>
          </div>
        </div>
        
        {/* Categories Desktop - 3D Pills */}
        <div className="flex gap-3 overflow-x-auto px-12 pb-4 max-w-7xl mx-auto scrollbar-hide">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? 'default' : 'secondary'}
              className={`shrink-0 cursor-pointer px-4 py-1.5 text-sm transition-all duration-300 ${activeCategory === cat ? 'shadow-3d btn-3d scale-105' : 'hover:shadow-3d hover:-translate-y-0.5'}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </header>

      {/* Header Mobile - 3D Glass */}
      <header className="sticky top-0 z-40 glass-3d md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="U-Cabo" className="h-8 w-auto object-contain" />
            <h1 className="text-lg font-black text-primary tracking-tighter">U-Cabo</h1>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari barang..."
              className="pl-9 h-9 text-xs rounded-full bg-white/60 border border-white/80 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Mobile */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-hide">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              className={`shrink-0 cursor-pointer transition-all duration-300 ${activeCategory === cat ? 'shadow-3d scale-105' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </header>

      {/* Hero Banner - 3D Perspective */}
      <div className="flex flex-col w-full max-w-7xl mx-auto perspective-1500">
        <div className="px-4 md:px-8 pt-6 pb-4">
          <div className="relative overflow-hidden rounded-[2rem] p-8 md:p-12 text-white shadow-3d-deep border border-white/20 animate-slide-up-3d inner-light transition-transform duration-700 hover:scale-[1.01]">
            {/* 3D Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#264473] to-accent opacity-95"></div>
            {/* Floating sparkle particles */}
            <div className="absolute top-[15%] left-[70%] w-2 h-2 bg-white/20 rounded-full animate-float-3d" style={{animationDelay: '0s'}}></div>
            <div className="absolute top-[40%] left-[80%] w-1.5 h-1.5 bg-white/15 rounded-full animate-float-3d" style={{animationDelay: '1s'}}></div>
            <div className="absolute top-[65%] left-[60%] w-1 h-1 bg-white/25 rounded-full animate-float-3d" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-[25%] left-[90%] w-2.5 h-2.5 bg-orange-300/15 rounded-full animate-float-3d" style={{animationDelay: '3s'}}></div>
            <div className="absolute top-[55%] left-[75%] w-1.5 h-1.5 bg-blue-300/20 rounded-full animate-float-3d" style={{animationDelay: '4s'}}></div>
            <div className="absolute top-[10%] left-[50%] w-1 h-1 bg-white/30 rounded-full animate-float-3d" style={{animationDelay: '1.5s'}}></div>
            <div className="absolute top-[75%] left-[85%] w-2 h-2 bg-white/10 rounded-full animate-float-3d" style={{animationDelay: '3.5s'}}></div>
            <div className="absolute top-[35%] left-[65%] w-1.5 h-1.5 bg-orange-200/12 rounded-full animate-float-3d" style={{animationDelay: '5s'}}></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/10 backdrop-blur-sm"></div>
            
            <div className="relative z-10 flex flex-col gap-4 max-w-xl">
              <Badge variant="secondary" className="w-fit text-accent font-extrabold px-3 py-1 glass-3d border border-white/40 animate-bounce-in animate-pulse-glow">{banner.badge}</Badge>
              <h2 className="text-3xl md:text-5xl font-black leading-tight whitespace-pre-line text-white" style={{textShadow: '0 2px 4px rgba(0,0,0,0.2), 0 4px 16px rgba(0,0,0,0.1)'}}>
                {banner.title}
              </h2>
              <p className="text-sm md:text-base font-black text-white/70 uppercase tracking-[0.3em] mb-1 shimmer-text">
                Praktis • Aman • Ekonomis
              </p>
              <p className="text-base md:text-lg text-white/95 max-w-md font-medium leading-relaxed" style={{textShadow: '0 1px 2px rgba(0,0,0,0.15)'}}>
                {banner.subtitle}
              </p>
            </div>
            {/* 3D Edge Highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-white/30 via-transparent to-transparent"></div>
          </div>
        </div>

        {/* Product Grid - 3D Staggered */}
        <main className="px-4 md:px-8 pt-4 pb-20">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="flex flex-col gap-3 animate-pulse">
                  <div className="skeleton aspect-square rounded-2xl"></div>
                  <div className="skeleton h-3 w-16 rounded-full"></div>
                  <div className="skeleton h-4 w-full rounded-full"></div>
                  <div className="skeleton h-5 w-24 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div 
              className="py-32 text-center text-muted-foreground flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
            >
              <div className="card-3d rounded-full p-8 mb-6 animate-pulse-glow">
                <Search className="h-16 w-16 text-slate-300" />
              </div>
              <p className="text-xl font-bold text-foreground">Tidak ada produk ditemukan</p>
              <p className="mt-2">Coba kata kunci atau kategori lain</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </main>
      </div>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default Index;


