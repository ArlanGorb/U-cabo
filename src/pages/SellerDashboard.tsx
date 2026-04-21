import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Edit, Wallet, Clock, CheckCircle, XCircle, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BottomNav } from '@/components/BottomNav';
import { formatPrice } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'earnings' | 'reviews'>('products');
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellerId, setSellerId] = useState<string>('');
  const [sellerName, setSellerName] = useState<string>('');
  const [sellerRating, setSellerRating] = useState<number>(0);
  const [totalReviews, setTotalReviews] = useState<number>(0);

  // States for Withdrawals
  const [availableBalance, setAvailableBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [incomingOrders, setIncomingOrders] = useState<any[]>([]);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '', bank_name: '', account_number: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/login');
      return;
    }
    setSellerId(user.id);

    // Get User Profile for Name & Rating
    const { data: profile } = await supabase.from('profiles').select('name, seller_rating, total_reviews').eq('id', user.id).single();
    if (profile) {
      setSellerName(profile.name);
      setSellerRating(profile.seller_rating || 0);
      setTotalReviews(profile.total_reviews || 0);
    }

    // Check KYC status
    const { data: kycData } = await supabase.from('kyc_requests').select('status').eq('user_id', user.id).single();
    if (!kycData || kycData.status !== 'approved') {
      toast({ title: 'Akses Dibatasi', description: 'Anda harus menyelesaikan verifikasi KYC terlebih dahulu.', variant: 'destructive' });
      navigate('/kyc', { replace: true });
      return;
    }

    // Fetch Products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (products) setMyProducts(products);

    // Calculate Balance (from successful orders & subtract approved/pending withdrawals)
    let grossEarnings = 0;
    const { data: orders } = await supabase.from('orders').select('*').eq('seller_id', user.id).in('status', ['success', 'completed', 'shipped', 'processing', 'disputed']);
    if (orders) {
      setIncomingOrders(orders);
      // HANYA pesanan yang SELESAI (Diterima Tanpa Komplain) yang dihitung sebagai Saldo Bisa Ditarik
      const earningOrders = orders.filter(o => o.status === 'completed');
      grossEarnings = earningOrders.reduce((sum, o) => sum + (Number(o.price) * 0.98), 0);
    }

    let totalWithdrawn = 0;
    const { data: wds } = await supabase.from('withdrawals').select('*').eq('seller_id', user.id).order('created_at', { ascending: false });
    if (wds) {
      setWithdrawals(wds);
      wds.forEach((w) => {
        if (w.status === 'pending' || w.status === 'approved') {
          totalWithdrawn += Number(w.amount);
        }
      });
    }

    setAvailableBalance(grossEarnings - totalWithdrawn);

    // Fetch Reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*, profiles(name)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    
    if (reviewsData) {
      setReviews(reviewsData.map((r: any) => ({
        ...r,
        buyer_name: r.profiles?.name || 'Pembeli'
      })));
      
      // Jika rating di profile masih 0 tapi sudah ada ulasan, hitung ulang untuk tampilan
      if (reviewsData.length > 0) {
        const totalRating = reviewsData.reduce((acc: number, curr: any) => 
          acc + ((Number(curr.product_rating) + Number(curr.service_rating)) / 2), 0
        );
        const calculatedAvg = totalRating / reviewsData.length;
        setSellerRating(calculatedAvg);
        setTotalReviews(reviewsData.length);
      }
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const confirm = window.confirm("Yakin ingin menghapus produk ini?");
    if (!confirm) return;

    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Berhasil', description: 'Produk telah dihapus.' });
      setMyProducts((prev) => prev.filter((p) => p.id !== id));
    } else {
      toast({ title: 'Gagal', description: 'Gagal menghapus produk.', variant: 'destructive' });
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawForm.amount || !withdrawForm.bank_name || !withdrawForm.account_number) {
      toast({ title: 'Form Tidak Lengkap', description: 'Mohon lengkapi semua data penarikan.', variant: 'destructive' });
      return;
    }
    const amountNum = Number(withdrawForm.amount);
    if (amountNum < 50000) {
      toast({ title: 'Nominal Terlalu Kecil', description: 'Minimum penarikan adalah Rp 50.000.', variant: 'destructive' });
      return;
    }
    if (amountNum > availableBalance) {
      toast({ title: 'Saldo Tidak Cukup', description: 'Nominal melebihi saldo tersedia.', variant: 'destructive' });
      return;
    }

    setIsWithdrawing(true);
    const { data, error } = await supabase.from('withdrawals').insert({
      seller_id: sellerId,
      seller_name: sellerName || 'Unknown Seller',
      amount: amountNum,
      bank_name: withdrawForm.bank_name,
      account_number: withdrawForm.account_number,
      status: 'pending'
    }).select();

    if (data && !error) {
      toast({ title: 'Penarikan Diajukan', description: 'Permintaan Anda sedang diproses oleh Admin.' });
      setWithdrawForm({ amount: '', bank_name: '', account_number: '' });
      fetchDashboardData(); 
    } else {
      toast({ title: 'Pengajuan Gagal', description: error?.message || 'Terjadi kesalahan sistem.', variant: 'destructive' });
    }
    setIsWithdrawing(false);
  };

  return (
    <div className="min-h-screen pb-20 bg-background flex flex-col w-full">
      <div className="w-full bg-background min-h-screen relative px-4 md:px-8 mt-0 pt-0">
        
        {/* Header Desktop */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur hidden md:block mb-8">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <h1 className="text-2xl font-black text-primary tracking-tight">U-Cabo</h1>
            </div>
            <div className="flex items-center gap-6">
              <a href="/" className="text-sm font-semibold hover:text-primary transition-colors">Home</a>
              <a href="/chat" className="text-sm font-semibold hover:text-primary transition-colors">Chat</a>
              <a href="/sell" className="text-sm font-semibold text-primary transition-colors">Jual Barang</a>
              <a href="/profile" className="text-sm font-semibold hover:text-primary transition-colors">Profil Saya</a>
            </div>
          </div>
        </header>

        {/* Header Mobile */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-semibold">Dasbor Penjual</h1>
          </div>
          <div className="flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10">
             <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
             <span className="text-xs font-bold text-primary">{sellerRating > 0 ? sellerRating.toFixed(1) : '0.0'}</span>
          </div>
        </header>

        <div className="hidden md:flex items-center justify-between mb-6 px-4 mt-6">
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Dasbor Penjual</h1>
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-1.5">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-black text-slate-800">{sellerRating > 0 ? sellerRating.toFixed(1) : '0.0'}</span>
             </div>
             <div className="w-px h-8 bg-slate-200 mx-1"></div>
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Ulasan</span>
                <span className="text-sm font-bold text-slate-700 text-center">{totalReviews}</span>
             </div>
          </div>
        </div>

        <div className="px-4">
          <Tabs defaultValue="products" className="w-full">
            <TabsList className="mb-8 w-full max-w-md justify-start bg-slate-100 p-1">
              <TabsTrigger value="products" className="rounded-lg">Produk Saya</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-lg">Pesanan</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-lg">Ulasan</TabsTrigger>
              <TabsTrigger value="earnings" className="rounded-lg">Penghasilan</TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="space-y-4">
              <div className="flex justify-end mb-4">
                <Button className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate('/sell')}>
                  <Plus className="h-4 w-4" /> Jual Barang Baru
                </Button>
              </div>

              {loading ? (
                 <div className="py-20 text-center text-muted-foreground flex justify-center">
                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                 </div>
              ) : myProducts.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                  <p className="text-lg font-medium">Belum ada produk jualan</p>
                  <Button className="mt-4" onClick={() => navigate('/sell')}>Tambah Produk Pertama</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                  {myProducts.map((product) => (
                    <Card key={product.id} className="flex flex-col gap-3 p-4 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted relative">
                        <img 
                          src={product.image_url || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80'} 
                          alt={product.name} 
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" 
                        />
                        <Badge variant={product.status === 'active' ? 'default' : 'secondary'} className="absolute top-2 right-2 text-[10px]">
                          {product.status === 'active' ? 'Aktif' : 'Terjual'}
                        </Badge>
                      </div>
                      <div className="flex-1 flex flex-col justify-between mt-2">
                        <div>
                          <p className="truncate text-base font-bold text-foreground/90">{product.name}</p>
                          <p className="mt-1 text-lg font-extrabold text-accent">{formatPrice(product.price)}</p>
                        </div>
                        <div className="mt-4 flex gap-2 w-full">
                          <Button 
                            variant="outline" 
                            className="flex-1 h-10 gap-2 border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 disabled:opacity-50"
                            onClick={() => navigate(`/sell?edit=${product.id}`)}
                            disabled={product.status === 'sold'}
                          >
                            <Edit className="h-4 w-4" /> Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-10 w-10 shrink-0 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
                        </TabsContent>

            <TabsContent value="orders" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pesanan Masuk</CardTitle>
                </CardHeader>
                <CardContent>
                  {incomingOrders.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">Belum ada pesanan masuk.</div>
                  ) : (
                    <div className="divide-y border rounded-md">
                      {incomingOrders.map((o) => (
                        <div key={o.id} className="py-4 px-4 flex flex-col md:flex-row items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-base">{o.product_name}</p>
                            <p className="text-sm font-bold text-primary mt-1">{formatPrice(o.price)}</p>
                            <p className="text-xs text-muted-foreground mt-1">Pembeli ID: <span className="font-mono text-[10px]">{o.buyer_id.substring(0,8)}</span></p>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0 w-full md:w-auto">
                            <Badge variant={o.status === 'completed' || o.status === 'success' || o.status === 'shipped' || o.status === 'processing' ? 'default' : o.status === 'disputed' ? 'destructive' : 'secondary'} className={o.status === 'completed' ? 'bg-green-100 text-green-700' : ''}>
                               {o.status === 'completed' ? 'Selesai / Diterima' : 
                                o.status === 'shipped' ? 'Sedang Dikirim' : 
                                o.status === 'disputed' ? 'Pembeli Komplain (Ditahan)' :
                                (o.status === 'processing' || o.status === 'success') ? 'Perlu Dikemas' : o.status}
                            </Badge>
                            {(o.status === 'processing' || o.status === 'success') && (
                              <Button size="sm" onClick={async () => {
                                const { error } = await supabase.from('orders').update({ status: 'shipped' }).eq('id', o.id);
                                if (!error) {
                                  toast({ title: 'Berhasil', description: 'Pesanan ditandai sebagai Dikirim.' });
                                  setIncomingOrders(incomingOrders.map(io => io.id === o.id ? { ...io, status: 'shipped' } : io));
                                }
                              }}>
                                Tandai Dikirim
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <Star className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">Belum ada ulasan dari pembeli.</p>
                  </div>
                ) : (
                  reviews.map((r) => (
                    <Card key={r.id} className="p-5 border border-slate-100 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                            {r.buyer_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{r.buyer_name}</p>
                            <p className="text-xs text-slate-400 font-medium">
                              {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                             <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                             <span className="ml-1 text-sm font-black text-yellow-700">
                               {((Number(r.product_rating) + Number(r.service_rating)) / 2).toFixed(1)}
                             </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Produk</p>
                          <div className="flex gap-0.5">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} className={`h-3 w-3 ${i < r.product_rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                             ))}
                          </div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Pelayanan</p>
                          <div className="flex gap-0.5">
                             {[...Array(5)].map((_, i) => (
                               <Star key={i} className={`h-3 w-3 ${i < r.service_rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                             ))}
                          </div>
                        </div>
                      </div>

                      {r.comment && (
                        <div className="mt-4 p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 italic text-sm text-slate-600 leading-relaxed">
                          "{r.comment}"
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="earnings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Saldo Information */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-primary/80 flex items-center gap-2">
                      <Wallet className="h-4 w-4"/> Saldo Tersedia (Net)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-black text-primary">{formatPrice(availableBalance)}</p>
                    <p className="text-xs text-muted-foreground mt-2">Telah dipotong fee aplikasi 2% per transaksi berhasil.</p>
                  </CardContent>
                </Card>

                {/* Penarikan Form */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Minta Pencairan Dana</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nominal Penarikan (Rp)</Label>
                      <Input type="number" placeholder="Contoh: 50000" value={withdrawForm.amount} onChange={(e) => setWithdrawForm({...withdrawForm, amount: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Nama Bank</Label>
                        <Input placeholder="BCA / Mandiri / dll" value={withdrawForm.bank_name} onChange={(e) => setWithdrawForm({...withdrawForm, bank_name: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Nomor Rekening</Label>
                        <Input placeholder="123456789" value={withdrawForm.account_number} onChange={(e) => setWithdrawForm({...withdrawForm, account_number: e.target.value})} />
                      </div>
                    </div>
                    <Button className="w-full mt-2" onClick={handleWithdraw} disabled={isWithdrawing}>
                      {isWithdrawing ? 'Memproses...' : 'Tarik Saldo Sekarang'}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Riwayat Penarikan */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Riwayat Penarikan Dana</CardTitle>
                </CardHeader>
                <CardContent className="px-0 sm:px-6">
                  {withdrawals.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground">Belum ada riwayat penarikan dana.</div>
                  ) : (
                    <div className="divide-y">
                      {withdrawals.map((w) => (
                        <div key={w.id} className="py-3 px-4 sm:px-0 flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{formatPrice(w.amount)}</p>
                            <p className="text-xs text-muted-foreground">{w.bank_name} - {w.account_number}</p>
                            <p className="text-[10px] text-slate-400 mt-1">{new Date(w.created_at).toLocaleDateString('id-ID')}</p>
                          </div>
                          <div>
                            {w.status === 'pending' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100"><Clock className="w-3 h-3 mr-1"/> Proses</Badge>}
                            {w.status === 'approved' && <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><CheckCircle className="w-3 h-3 mr-1"/> Berhasil</Badge>}
                            {w.status === 'rejected' && <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100"><XCircle className="w-3 h-3 mr-1"/> Ditolak</Badge>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

            </TabsContent>
          </Tabs>
        </div>
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;



