import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, ShieldCheck, MessageCircle, ShoppingCart, Handshake, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [sellerRating, setSellerRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  useEffect(() => {
    const fetchAuth = async () => {
       const { data } = await supabase.auth.getUser();
       if (data?.user) setCurrentUserId(data.user.id);
    };
    fetchAuth();

    const fetchProduct = async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
      if (data) {
        setProduct(data);
        
        // Fetch seller rating from profiles
        if (data.seller_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, seller_rating, total_reviews')
            .eq('id', data.seller_id)
            .single();
          
          if (profile) {
            setProduct(prev => ({ ...prev, sellerName: profile.name }));
            setSellerRating(profile.seller_rating || 0);
            setTotalReviews(profile.total_reviews || 0);
          }
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleCOD = () => {
    if (!product) return;
    if (confirm("Metode: Ketemuan di Kampus.\n\nAnda akan diarahkan ke chat penjual untuk janjian di sekitar UNKLAB. Barang ini akan ditandai sbg 'Dipesan' saat COD deal. Lanjut?")) {
      navigate(`/chat/${product.seller_id || 'c1'}`);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setIsPaying(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Gagal', description: 'Anda harus login terlebih dahulu.', variant: 'destructive' });
        setIsPaying(false);
        return;
      }

      // Pastikan ID Pesanan tidak lebih dari 50 karakter, Midtrans membatasi panjangnya.
      const exactOrderId = `ORD-${product.id.substring(0, 8)}-${Date.now()}`;

      const response = await fetch('/api/midtrans-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: exactOrderId,
          gross_amount: product.price,
          customer_details: {
            first_name: user.user_metadata?.full_name || "Pembeli",
            email: user.email || "pembeli@example.com"
          },
          item_details: [{
            id: product.id,
            price: product.price,
            quantity: 1,
            name: product.name.substring(0, 50)
          }]
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || data.message || Object.values(data).join(', '));

      // @ts-ignore
      window.snap.pay(data.token, {
        onSuccess: async function (result: any) {
          toast({ title: 'Berhasil!', description: 'Pembayaran berhasil.' });
          
          // Simpan order ke dalam tabel 'orders'
          await supabase.from('orders').insert({
             id: exactOrderId,
             buyer_id: user.id,
             seller_id: product.seller_id,
             product_name: product.name,
             price: product.price,
             seller_name: product.sellerName || 'Penjual U-Cabo',
             image: product.image_url || product.image,
             status: 'processing',
             date: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
          });
          
          // Update status produk menjadi 'sold'
          supabase.from('products').update({ status: 'sold' }).eq('id', product.id).then();
          navigate('/orders');
        },
        onPending: function () {
          toast({ title: 'Menunggu', description: 'Menunggu pembayaran diselesaikan.' });
        },
        onError: function () {
          toast({ title: 'Gagal', description: 'Pembayaran gagal.', variant: 'destructive' });
        },
        onClose: function () {
          setIsPaying(false);
        }
      });
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error Midtrans', description: error.message, variant: 'destructive' });
      setIsPaying(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center">Memuat...</div>;

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Produk tidak ditemukan</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background flex flex-col w-full">
      <div className="w-full bg-background min-h-screen relative md:pb-12">
        {/* Header Desktop */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur hidden md:block mb-8">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <h1 className="text-2xl font-black text-primary tracking-tight">U-Cabo</h1>
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
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="truncate text-sm font-semibold">Detail Produk</h1>
        </header>

        <div className="md:px-8 py-2 md:py-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-8 md:max-w-5xl md:mx-auto">
            
            {/* Left Column: Image */}
            <div className="md:col-span-5">
              {/* Image with Tokopedia-like Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="aspect-[4/3] md:aspect-square w-full overflow-hidden bg-slate-100 md:rounded-2xl cursor-pointer relative group">
                    <img 
                      src={product.image_url || product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'} 
                      alt={product.name} 
                      className="h-full w-full object-cover transition-transform duration-300 md:group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100">
                       <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full font-medium">Klik untuk memperbesar</span>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black/95 flex flex-col justify-center border-none rounded-none outline-none">
                  <VisuallyHidden>
                    <DialogTitle>Tampilan Penuh Gambar Produk</DialogTitle>
                  </VisuallyHidden>
                  
                  {/* Header Bar inside Dialog */}
                  <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent z-50">
                    <span className="text-white/80 text-sm font-medium">{product.name}</span>
                    <DialogClose asChild>
                       <button className="bg-black/20 hover:bg-white/20 p-2 rounded-full text-white transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                       </button>
                    </DialogClose>
                  </div>
                  
                  <div className="flex-1 w-full h-full flex items-center justify-center p-2 pt-16 pb-16">
                    <img 
                      src={product.image_url || product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'} 
                      alt={product.name} 
                      className="max-w-[100vw] max-h-[80vh] md:max-w-[70vw] object-contain mx-auto drop-shadow-2xl select-none" 
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Right Column: Product Detail & Action */}
            <div className="md:col-span-7 flex flex-col pt-4 md:pt-0 pb-20 md:pb-0 px-4 md:px-0">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground/90">{product.name}</h2>
                  <p className="mt-1 text-2xl md:text-3xl font-extrabold text-accent">{formatPrice(product.price)}</p>
                </div>
                <Badge variant={product.condition === 'Baru' ? 'default' : 'secondary'} className="text-xs md:text-sm px-2 py-0.5">{product.condition}</Badge>
              </div>

              <p className="mt-2 text-xs md:text-sm font-medium text-muted-foreground">{product.createdAt} · Kategori: {product.category}</p>

              <Separator className="my-6" />

              {/* Description */}
              <div>
                <h3 className="text-base font-bold text-foreground/90">Deskripsi Produk</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>

              {/* Minus */}
              {product.minus && (
                <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-100">
                  <h3 className="text-sm font-bold text-red-600">Minus / Kekurangan</h3>
                  <p className="mt-1 text-sm text-red-600/80 leading-relaxed">{product.minus}</p>
                </div>
              )}

              <Separator className="my-6" />

              {/* Seller Info */}
              <div className="mb-6 md:mb-8">
                <h3 className="text-sm font-bold text-foreground/90 mb-3">Informasi Penjual</h3>
                <Card className="flex items-center gap-4 p-4 shadow-sm hover:shadow-md transition-shadow border-black/5 bg-slate-50/50">
                  <img src={product.sellerAvatar} alt={product.sellerName} className="h-12 w-12 rounded-full object-cover border border-black/5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-bold text-foreground/90">{product.sellerName}</span>
                      {product.sellerVerified && <ShieldCheck className="h-5 w-5 text-blue-500" />}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                       <div className="flex items-center">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-bold ml-1 text-slate-700">{sellerRating > 0 ? sellerRating.toFixed(1) : 'No rating'}</span>
                       </div>
                       <span className="text-[10px] text-slate-400 font-medium">({totalReviews} ulasan)</span>
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mt-1">
                      {product.sellerVerified ? <span className="text-blue-600">Seller Terverifikasi</span> : 'Belum Terverifikasi'}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Desktop Actions (Hidden on Mobile) */}
              <div className="hidden md:flex gap-3 mt-auto pt-6 border-t">
                {currentUserId === product.seller_id ? (
                   <Button variant="secondary" disabled className="w-full h-12 text-sm font-bold opacity-60">
                      Anda adalah penjual produk ini
                   </Button>
                ) : (
                   <>
                     <Button variant="outline" className="flex-1 h-12 gap-2 border-foreground/20 hover:bg-slate-50 hover:text-primary transition-colors text-sm font-bold" asChild>
                       <Link to={`/chat/${product.seller_id || 'c1'}`}>
                         <MessageCircle className="h-5 w-5" />
                         Chat Penjual
                       </Link>
                     </Button>
                     <Button 
                        onClick={handleCOD}
                        disabled={product.status === 'sold'}
                        className="flex-1 h-12 gap-2 bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-bold transition-colors shadow-sm"
                     >
                       <Handshake className="h-5 w-5" />
                       COD Kampus
                     </Button>
                     <Button 
                       onClick={handleBuyNow}
                       disabled={isPaying || product.status === 'sold'}
                       className="flex-[1.5] h-12 gap-2 bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-extrabold shadow-md transition-transform active:scale-[0.98]"
                     >
                       <ShoppingCart className="h-5 w-5" />
                       {isPaying ? 'Memproses...' : product.status === 'sold' ? 'Terjual' : 'Bayar Langsung'}
                     </Button>
                   </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Action Fix */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 md:hidden">
          <div className="mx-auto flex flex-col max-w-lg gap-3">
             {currentUserId === product.seller_id ? (
                <Button variant="secondary" disabled className="w-full h-12 font-bold opacity-60">
                   Ini Iklan Anda Sendiri
                </Button>
             ) : (
                <>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-1.5 h-11 border-foreground/20 font-semibold" asChild>
                      <Link to={`/chat/${product.seller_id || 'c1'}`}>
                        <MessageCircle className="h-4 w-4" />
                        Chat
                      </Link>
                    </Button>
                    <Button 
                       onClick={handleCOD}
                       disabled={product.status === 'sold'}
                       className="flex-1 gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 h-11 font-semibold"
                    >
                      <Handshake className="h-4 w-4" />
                      COD Kampus
                    </Button>
                  </div>
                  <Button 
                    onClick={handleBuyNow}
                    disabled={isPaying || product.status === 'sold'}
                    className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90 h-12 font-extrabold text-base"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    {isPaying ? 'Memproses...' : product.status === 'sold' ? 'Sold Out' : 'Beli & Bayar Online'}
                  </Button>
                </>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
