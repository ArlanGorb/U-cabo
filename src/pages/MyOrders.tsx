import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Star, ShieldAlert, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BottomNav } from '@/components/BottomNav';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/u-cabo-logo.png';

const MyOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [userRole, setUserRole] = useState<string>('Buyer');
  
  // Rating states
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [productRating, setProductRating] = useState(5);
  const [serviceRating, setServiceRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Report states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('buyer_id', user.id)
        .order('date', { ascending: false });

      if (ordersError) {
        console.error(ordersError);
      } else if (ordersData) {
        // Fetch all reviews by this buyer to mark orders as rated
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('order_id')
          .eq('buyer_id', user.id);
        
        const ratedOrderIds = new Set((reviewsData || []).map(r => r.order_id));

        const formattedOrders = ordersData.map((order: any) => ({
          ...order,
          rated: ratedOrderIds.has(order.id)
        }));
        setOrders(formattedOrders);
      }

      // Fetch User Role
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) {
        setUserRole(profile.role);
      }

      setLoading(false);
    };

    fetchOrders();
  }, [navigate, toast]);

  const handleSubmitRating = async () => {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Anda harus login.');

      let finalSellerId = selectedOrder.seller_id;
      
      if (!finalSellerId || finalSellerId === 'Anonymous') {
        const { data: productData } = await supabase
          .from('products')
          .select('seller_id')
          .eq('id', selectedOrder.product_id)
          .single();
        
        if (productData?.seller_id) {
          finalSellerId = productData.seller_id;
        }
      }

      if (!finalSellerId) {
        throw new Error('ID Penjual tidak ditemukan. Tidak dapat memberikan penilaian.');
      }

      const { error: reviewError } = await supabase.from('reviews').upsert({
        order_id: selectedOrder.id,
        buyer_id: user.id,
        seller_id: finalSellerId,
        product_rating: productRating,
        service_rating: serviceRating,
        comment: comment
      }, { onConflict: 'order_id' });

      if (reviewError) throw reviewError;

      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, rated: true } : o));

      const { data: reviews } = await supabase
        .from('reviews')
        .select('product_rating, service_rating')
        .eq('seller_id', finalSellerId);
      
      if (reviews && reviews.length > 0) {
        const totalSum = reviews.reduce((sum, r) => {
          const avg = (Number(r.product_rating) + Number(r.service_rating)) / 2;
          return sum + avg;
        }, 0);
        
        const avgRating = totalSum / reviews.length;
        
        await supabase.from('profiles')
          .update({ 
            seller_rating: avgRating,
            total_reviews: reviews.length
          })
          .eq('id', finalSellerId);
      }

      toast({ title: 'Berhasil', description: 'Terima kasih atas penilaian Anda!' });
      setIsRatingModalOpen(false);
      
    } catch (error: any) {
      console.error(error);
      toast({ 
        title: 'Gagal', 
        description: error.message || 'Gagal mengirim penilaian.', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus riwayat pesanan ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    try {
      console.log("Attempting to delete order ID:", orderId);
      
      const { data, error, status } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId)
        .select();

      console.log("Supabase Delete Response:", { data, error, status });

      if (error) {
        console.error("Supabase Error:", error);
        throw error;
      }
      
      if (status === 204 || (data && data.length > 0)) {
        console.log("Delete successful in database.");
        setOrders(prev => prev.filter(o => o.id !== orderId));
        toast({ title: 'Berhasil', description: 'Riwayat pesanan telah dihapus.' });
      } else {
        console.warn("Delete call finished, but no rows were affected. Check RLS policies.");
        toast({ 
          title: 'Peringatan', 
          description: 'Berhasil di layar, tapi database menolak penghapusan. Periksa kebijakan RLS Supabase Anda.',
          variant: 'destructive'
        });
        // Tetap hapus dari state agar user merasa ada perubahan, tapi ingatkan mereka
        setOrders(prev => prev.filter(o => o.id !== orderId));
      }
    } catch (error: any) {
      console.error("Delete Error:", error);
      toast({ title: 'Gagal Menghapus', description: error.message, variant: 'destructive' });
    }
  };

  const handleSendReport = async () => {
    if (!selectedOrder || !reportReason) return;
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Anda harus login.');

      const { error } = await supabase.from('reports').insert({
        order_id: selectedOrder.id,
        reporter_id: user.id,
        reported_seller_id: selectedOrder.seller_id,
        reason: reportReason,
        details: reportDetails
      });

      if (error) throw error;

      toast({ title: 'Laporan Dikirim', description: 'Laporan Anda telah diterima tim admin untuk ditinjau.' });
      setIsReportModalOpen(false);
      setReportReason('');
      setReportDetails('');
    } catch (error: any) {
      toast({ title: 'Gagal Melapor', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 text-center">
        <ShoppingBag className="h-16 w-16 mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Belum Login</h2>
        <p className="text-sm text-slate-500 mb-6">Silakan login untuk melihat riwayat pesanan Anda.</p>
        <Button onClick={() => navigate('/login')} className="w-full max-w-xs rounded-full">Ke Halaman Login</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-40 text-center text-slate-500 bg-slate-50 font-medium flex justify-center items-center flex-col">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        Memuat Riwayat Pesanan...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 flex flex-col w-full">
      <div className="w-full bg-slate-50 min-h-screen relative">
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
              <a href="/profile" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Profil Saya</a>
            </div>
          </div>
        </header>

        {/* Header Mobile */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
             <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-slate-100 transition-colors">
                <ArrowLeft className="h-5 w-5 text-slate-700" />
             </button>
             <h1 className="text-lg font-bold text-slate-800">Riwayat Pesanan</h1>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-4 md:px-8 pt-6 md:pt-10">
          <div className="hidden md:flex items-center gap-3 mb-8">
             <ShoppingBag className="h-8 w-8 text-primary" />
             <h1 className="text-3xl font-black text-slate-800 tracking-tight">Riwayat Pesanan</h1>
          </div>

          {orders.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center opacity-80">
              <div className="h-20 w-20 bg-slate-200 rounded-full flex items-center justify-center mb-4">
                 <ShoppingBag className="h-10 w-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-slate-700 mb-1">Belum Ada Transaksi</h2>
              <p className="text-sm text-slate-500 max-w-[250px]">Anda belum pernah melakukan pembelian produk apapun di kampus.</p>
              <Button className="mt-8 rounded-full px-8 bg-primary hover:bg-primary/90 shadow-sm" onClick={() => navigate('/')}>
                Mulai Belanja
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:gap-6">
               {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all hover:shadow-md bg-white">
                     <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-4 py-2">
                        <div className="flex items-center gap-2">
                           <ShoppingBag className="h-4 w-4 text-slate-400" />
                           <span className="text-xs font-semibold text-slate-500">Belanja</span>
                           <span className="text-[10px] text-slate-400 font-medium ml-1">{order.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={order.status === 'success' || order.status === 'completed' || order.status === 'shipped' || order.status === 'processing' ? 'default' : (order.status === 'pending' ? 'secondary' : 'destructive')} 
                            className={`h-6 text-[10px] font-bold tracking-wide rounded-md px-2.5 ${(order.status === 'success' || order.status === 'completed') ? 'bg-green-500/10 text-green-700 hover:bg-green-500/20' : (order.status === 'shipped' || order.status === 'processing') ? 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20' : order.status === 'disputed' ? 'bg-orange-500/10 text-orange-700 hover:bg-orange-500/20' : order.status === 'refunded' ? 'bg-red-500/10 text-red-700 hover:bg-red-500/20' : order.status === 'pending' ? 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20' : 'bg-red-500/10 text-red-700 hover:bg-red-500/20'}`}
                          >
                            {order.status === 'completed' ? 'Selesai' : 
                             order.status === 'shipped' ? 'Dikirim' : 
                             order.status === 'disputed' ? 'Komplain Diproses' :
                             order.status === 'refunded' ? 'Dana Dikembalikan' :
                             (order.status === 'processing' || order.status === 'success') ? 'Dikemas' :
                             (order.status === 'pending' ? 'Menunggu' : 'Dibatalkan')}
                          </Badge>
                          <button 
                            onClick={() => handleDeleteOrder(order.id)}
                            className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Hapus riwayat"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                     </div>
                     
                     <div className="p-4 flex gap-4 md:gap-6">
                       <div className="h-20 w-20 md:h-24 md:w-24 shrink-0 overflow-hidden rounded-lg border border-slate-100 bg-white">
                          <img src={order.image} alt={order.product_name} className="h-full w-full object-cover" />
                       </div>
                       <div className="flex flex-1 flex-col justify-between min-w-0">
                         <div>
                           <h3 className="truncate font-bold text-slate-800 leading-tight md:text-lg">{order.product_name}</h3>
                           <p className="text-xs font-medium text-slate-500 mt-1 md:text-sm">Penjual: <span className="text-primary font-semibold">{order.seller_name}</span></p>
                         </div>
                         <p className="text-sm font-bold text-primary mt-2 md:text-base">Rp {Number(order.price).toLocaleString('id-ID')}</p>
                       </div>
                     </div>
  
                     <div className="border-t border-slate-50 bg-slate-50/30 px-4 py-3 flex items-center justify-between">

                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider">ID: {order.id.substring(0, 15).toUpperCase()}</span>
                            <button 
                              onClick={() => { setSelectedOrder(order); setIsReportModalOpen(true); }}
                              className="text-[10px] font-bold text-red-500 hover:text-red-700 underline text-left w-fit"
                            >
                              Laporkan Penipuan?
                            </button>
                          </div>
                        
                        <div className="flex gap-2">
                          {order.status === 'shipped' && (
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 md:h-9 text-xs font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 rounded-full px-3 md:px-4" 
                                onClick={async () => {
                                   const reason = prompt('Tuliskan alasan komplain Anda (misal: Barang rusak/tidak sesuai):');
                                   if (!reason) return;
                                   const { error } = await supabase.from('orders').update({ status: 'disputed' }).eq('id', order.id);
                                   if (!error) {
                                      toast({ title: 'Komplain Diajukan', description: 'Admin sedang meninjau pesanan.' });
                                      setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'disputed' } : o));
                                   }
                                }}>
                                  Ajukan Komplain
                              </Button>
                              <Button 
                                size="sm" 
                                className="h-8 md:h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 md:px-6 shadow-sm"
                                onClick={async () => {
                                  if (confirm('Konfirmasi bahwa barang sudah Anda terima dengan baik?')) {
                                    const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id);
                                    if (!error) {
                                      toast({ title: 'Selesai', description: 'Pesanan telah diterima. Silakan berikan penilaian.' });
                                      const updatedOrder = { ...order, status: 'completed' };
                                      setOrders(orders.map(o => o.id === order.id ? updatedOrder : o));
                                      
                                      setSelectedOrder(updatedOrder);
                                      setProductRating(5);
                                      setServiceRating(5);
                                      setComment('');
                                      setIsRatingModalOpen(true);
                                    }
                                  }
                                }}
                              >
                                Pesanan Diterima
                              </Button>
                            </div>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 md:h-9 text-xs font-semibold text-primary hover:bg-primary/10 rounded-full px-4" asChild>
                             <a href={`/chat/${order.seller_id}`}>Hubungi Penjual</a>
                          </Button>
                           {order.status === 'completed' && !order.rated && (
                             <Button 
                               size="sm" 
                               className="h-8 md:h-9 text-xs font-semibold bg-primary hover:bg-primary/90 text-white rounded-full px-4 md:px-6"
                               onClick={() => {
                                 setSelectedOrder(order);
                                 setProductRating(5);
                                 setServiceRating(5);
                                 setComment('');
                                 setIsRatingModalOpen(true);
                               }}
                             >
                               Beri Penilaian
                             </Button>
                           )}
                           {order.status === 'completed' && order.rated && (
                             <Badge variant="outline" className="h-8 md:h-9 text-[10px] font-bold text-green-600 border-green-200 bg-green-50 rounded-full px-3 md:px-4 flex items-center gap-1">
                               <Star className="h-3 w-3 fill-green-600" />
                               Sudah Dinilai
                             </Badge>
                           )}
                        </div>
                     </div>
                  </Card>
               ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={isRatingModalOpen} onOpenChange={setIsRatingModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Beri Penilaian</DialogTitle>
            <DialogDescription>
              Bagaimana pengalaman Anda berbelanja di <span className="font-semibold text-primary">{selectedOrder?.seller_name}</span>?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Keunikan Produk</Label>
              <p className="text-[11px] text-slate-500 -mt-2">Apakah barang sesuai deskripsi, kualitas baik, dan layak pakai?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setProductRating(star)}
                    className="focus:outline-none transition-transform active:scale-90"
                  >
                    <Star 
                      className={`h-8 w-8 ${star <= productRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Pelayanan Seller</Label>
              <p className="text-[11px] text-slate-500 -mt-2">Kecepatan respon, keramahan, dan ketepatan pengiriman.</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star} 
                    onClick={() => setServiceRating(star)}
                    className="focus:outline-none transition-transform active:scale-90"
                  >
                    <Star 
                      className={`h-8 w-8 ${star <= serviceRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-700">Komentar (Opsional)</Label>
              <Textarea 
                placeholder="Ceritakan lebih lanjut tentang produk dan pelayanan..." 
                className="resize-none rounded-xl border-slate-200 focus:border-primary"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">Total Rating</span>
                  <div className="flex items-center gap-1.5">
                     <Star className="h-4 w-4 fill-primary text-primary" />
                     <span className="text-lg font-black text-primary">{(productRating + serviceRating) / 2}</span>
                  </div>
               </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              className="w-full rounded-xl py-6 font-bold text-base shadow-lg shadow-primary/20" 
              onClick={handleSubmitRating}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Mengirim...' : 'Kirim Penilaian'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
              <ShieldAlert className="h-6 w-6" /> Laporkan Penjual
            </DialogTitle>
            <DialogDescription>
              Gunakan fitur ini jika penjual melakukan penipuan, mengirim barang palsu, atau tidak mengirimkan barang.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-bold">Alasan Utama</Label>
              <select 
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-red-500 outline-none"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
              >
                <option value="">Pilih alasan...</option>
                <option value="Penipuan Uang">Penipuan / Uang tidak kembali</option>
                <option value="Barang Palsu">Barang tidak sesuai / Palsu</option>
                <option value="Tidak Dikirim">Barang tidak dikirim</option>
                <option value="Pelayanan Buruk">Pelayanan sangat buruk / Kasar</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-bold">Detail Kejadian</Label>
              <Textarea 
                placeholder="Ceritakan secara detail kronologi kejadian agar tim admin bisa meninjau dengan adil..." 
                className="min-h-[120px] resize-none rounded-xl border-slate-200"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
            
            <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex gap-3">
              <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-700 leading-relaxed">
                <b>Peringatan:</b> Laporan palsu dapat menyebabkan akun Anda ditangguhkan. Pastikan Anda memiliki bukti yang kuat.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="destructive"
              className="w-full rounded-xl py-6 font-bold text-base shadow-lg shadow-red-200" 
              onClick={handleSendReport}
              disabled={isSubmitting || !reportReason}
            >
              {isSubmitting ? 'Mengirim Laporan...' : 'Kirim Laporan Penipuan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default MyOrders;
