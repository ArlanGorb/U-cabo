import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BottomNav } from '@/components/BottomNav';
import { ProductCard } from '@/components/ProductCard';
import logo from '@/assets/u-cabo-logo.png';
import { supabase } from '@/lib/supabase';

const Index = () => {
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
    <div className="min-h-screen pb-20 bg-background flex flex-col w-full">
      <div className="w-full bg-background min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur hidden md:block">
        <div className="flex items-center gap-6 px-8 py-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="U-Cabo" className="h-12 lg:h-14 w-auto object-contain drop-shadow-sm" />
            <h1 className="text-3xl lg:text-4xl font-black text-primary tracking-tighter">U-Cabo</h1>
          </div>
          
          <div className="relative flex-1 max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari barang di UNKLAB..."
              className="pl-12 h-12 text-base rounded-full bg-muted/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-6">
            <a href="/" className="text-sm font-semibold hover:text-primary transition-colors">Home</a>
            <a href="/chat" className="text-sm font-semibold hover:text-primary transition-colors">Chat</a>
            {isSeller && <a href="/sell" className="text-sm font-semibold hover:text-primary transition-colors">Jual Barang</a>}
            <a href="/profile" className="text-sm font-semibold hover:text-primary transition-colors">Profil Saya</a>
          </div>
        </div>

        {/* Categories Desktop */}
        <div className="flex gap-3 overflow-x-auto px-8 pb-4 scrollbar-hide">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? 'default' : 'secondary'}
              className="shrink-0 cursor-pointer px-4 py-1.5 text-sm hover:bg-primary/90 transition-colors"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </header>

      {/* Header Mobile */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur md:hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="U-Cabo" className="h-10 w-auto object-contain drop-shadow-sm" />
            <h1 className="text-xl font-black text-primary tracking-tighter">U-Cabo</h1>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari barang di UNKLAB..."
              className="pl-9"
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
              className="shrink-0 cursor-pointer"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Badge>
          ))}
        </div>
      </header>

      {/* Hero Banner Modern - Liquid Glass */}
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 text-white shadow-2xl border border-white/20">
          {/* Liquid animated gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-[#264473] to-accent opacity-95 mix-blend-multiply"></div>
          {/* Glass overlay */}
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md"></div>
          
          <div className="relative z-10 flex flex-col gap-4 max-w-xl">
            <Badge variant="secondary" className="w-fit text-accent font-extrabold px-3 py-1 bg-white/95 backdrop-blur-sm border border-white/40 shadow-sm">{banner.badge}</Badge>
            <h2 className="text-3xl md:text-5xl font-black leading-tight drop-shadow-lg whitespace-pre-line text-white">
              {banner.title}
            </h2>
            <p className="text-base md:text-lg text-white/95 max-w-md drop-shadow-md font-medium">
              {banner.subtitle}
            </p>
          </div>
          {/* Abstract Decors glowing */}
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl mix-blend-screen animate-blob"></div>
          <div className="absolute right-0 -top-10 h-64 w-64 rounded-full bg-orange-400/40 blur-3xl mix-blend-screen animate-blob animation-delay-2000"></div>
          <div className="absolute right-40 -bottom-20 h-64 w-64 rounded-full bg-[#1f355c]/50 blur-3xl mix-blend-screen animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="px-4 md:px-8 pt-4 pb-20">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center text-muted-foreground flex flex-col items-center">
            <Search className="h-16 w-16 text-muted/30 mb-4" />
            <p className="text-xl font-bold text-foreground">Tidak ada produk ditemukan</p>
            <p className="mt-2">Coba kata kunci atau kategori lain</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      <div className="md:hidden">
        <BottomNav />
      </div>
      </div>
    </div>
  );
};

export default Index;


