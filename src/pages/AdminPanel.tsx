import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Users, Package, FileCheck, Save, Trash2, CreditCard, Banknote, History, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/AdminSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

// Tipe data yang disesuaikan dengan database
type KYCRequest = {
  id: string;
  user_id: string;
  name: string;
  nim: string;
  avatar: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  ktm_url: string;
  selfie_url: string;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  created_at?: string;
};

type Activity = {
  id: string;
  type: 'user' | 'product' | 'kyc';
  title: string;
  description: string;
  time: string;
  rawDate: Date;
};

type Category = {
  id: string;
  name: string;
  created_at: string;
};

type Withdrawal = {
  id: string;
  seller_id: string;
  seller_name: string;
  amount: number;
  bank_name: string;
  account_number: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
};

type SystemOrder = {
  id: string;
  buyer_id: string;
  seller_name: string;
  product_name: string;
  price: number;
  status: string;
  created_at: string;
};

type FraudReport = {
  id: string;
  order_id: string;
  reporter_id: string;
  reported_seller_id: string;
  reason: string;
  details: string;
  status: 'pending' | 'investigated' | 'resolved';
  created_at: string;
  reporter_name?: string;
  seller_name?: string;
};

type ProductItem = {
  id: string;
  name: string;
  price: number;
  seller_name: string;
  category: string;
  status: string;
  created_at: string;
  image_url: string;
};

const ReportsView = ({ reports, updateStatus }: { reports: FraudReport[], updateStatus: (id: string, status: any) => void }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan Penipuan</CardTitle>
        <CardDescription>Daftar laporan dari pembeli terhadap aktivitas penjual yang mencurigakan.</CardDescription>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground italic">Belum ada laporan masuk.</div>
        ) : (
          <div className="divide-y border rounded-lg">
            {reports.map((r) => (
              <div key={r.id} className="p-5 flex flex-col md:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={(r.status || 'pending') === 'pending' ? 'destructive' : (r.status || 'pending') === 'investigated' ? 'secondary' : 'default'}>
                      {(r.status || 'pending').toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-lg text-red-600">{r.reason}</h3>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-dashed italic">"{r.details}"</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
                    <p><b>Pelapor:</b> {r.reporter_name}</p>
                    <p><b>Dilaporkan:</b> <span className="text-red-600 font-bold">{r.seller_name}</span></p>
                    <p><b>Order ID:</b> <span className="font-mono">{(r.order_id || 'N/A').substring(0,8)}...</span></p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0 justify-center">
                  {r.status === 'pending' && (
                    <Button size="sm" variant="secondary" onClick={() => updateStatus(r.id, 'investigated')}>Tandai Investigasi</Button>
                  )}
                  {r.status !== 'resolved' && (
                    <Button size="sm" onClick={() => updateStatus(r.id, 'resolved')}>Tandai Selesai</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardView = ({ requests, totalUsers, activeProducts, activities }: { requests: KYCRequest[], totalUsers: number, activeProducts: number, activities: Activity[] }) => {
  const stats = [
    { label: 'Total User', value: totalUsers, icon: Users },
    { label: 'Produk Aktif', value: activeProducts, icon: Package },
    { label: 'KYC Pending', value: requests.filter((r) => r.status === 'pending').length, icon: FileCheck },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aktivitas Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
             <p className="text-sm text-muted-foreground">Tidak ada aktivitas terbaru di sistem hari ini.</p>
          ) : (
             <div className="space-y-4">
                {activities.map((act) => (
                  <div key={act.id} className="flex gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div className="mt-0.5 rounded-full bg-slate-100 p-2 shrink-0">
                       {act.type === 'user' ? <Users className="h-4 w-4 text-blue-500" /> :
                        act.type === 'product' ? <Package className="h-4 w-4 text-orange-500" /> :
                        <FileCheck className="h-4 w-4 text-green-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{act.title}</p>
                      <p className="text-xs text-muted-foreground">{act.description}</p>
                      <p className="text-[10px] items-center flex gap-1 mt-1 text-slate-400 font-medium">
                        <Clock className="h-3 w-3" /> {act.time}
                      </p>
                    </div>
                  </div>
                ))}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const KycView = ({ requests, updateStatus }: { requests: KYCRequest[], updateStatus: (id: string, status: 'approved' | 'rejected') => void }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pengajuan Verifikasi KYC</CardTitle>
        <CardDescription>Kelola dokumen validasi identitas (KTM Mahasiswa / ID Card Dosen) untuk penjual.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pengajuan verifikasi.</p>}
        {requests.map((req) => (
          <div key={req.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-3">
              <img src={req.avatar || `https://ui-avatars.com/api/?name=${req.name}&background=random`} alt={req.name} className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{req.name}</p>
                <p className="text-xs text-muted-foreground">ID (NIM/NIDN): {req.nim} Â· {new Date(req.created_at).toLocaleDateString('id-ID')}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {req.ktm_url && <a href={req.ktm_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline">Lihat Kartu ID</a>}
              {req.selfie_url && <a href={req.selfie_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 underline">Lihat Selfie</a>}
            </div>

            {req.status === 'pending' ? (
              <div className="mt-2 flex gap-2 sm:mt-0">
                <Button size="sm" className="h-7 gap-1 bg-green-600 text-xs text-white hover:bg-green-700" onClick={() => updateStatus(req.id, 'approved')}>
                  <CheckCircle className="h-3 w-3" /> Setujui
                </Button>
                <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-destructive" onClick={() => updateStatus(req.id, 'rejected')}>
                  <XCircle className="h-3 w-3" /> Tolak
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center mt-2 sm:mt-0">
                <Badge variant={req.status === 'approved' ? 'default' : 'destructive'} className="text-[10px]">
                  {req.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                </Badge>
                {req.status === 'approved' && (
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-[10px] text-destructive hover:bg-destructive/10" onClick={() => updateStatus(req.id, 'rejected')}>
                    <XCircle className="h-3 w-3" /> Cabut
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const UsersView = ({ users }: { users: UserProfile[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Manajemen Pengguna</CardTitle>
        <CardDescription>Daftar seluruh civitas akademika (Mahasiswa/Dosen/Staff) yang terdaftar di marketplace.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pengguna atau tabel <b>profiles</b> belum dibuat di Supabase.</p>}
          {users.map((user) => (
             <div key={user.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
               <div>
                 <p className="text-sm font-semibold">{user.name}</p>
                 <p className="text-xs text-muted-foreground">{user.email} {user.phone ? `Â· ${user.phone}` : ''}</p>
               </div>
               <Badge variant={user.role === 'Seller' ? 'default' : 'secondary'}>{user.role === 'Seller' ? 'Seller & Buyer' : 'Buyer'}</Badge>
             </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

type ProductItem = {
  id: string;
  name: string;
  price: number;
  condition: string;
  category: string;
  seller_name: string;
  image_url: string;
  status: string;
  created_at: string;
};

const CategoriesView = ({ categories, handleAddCategory, handleDeleteCategory }: { categories: Category[], handleAddCategory: (name: string) => void, handleDeleteCategory: (id: string) => void }) => {
  const [newCat, setNewCat] = useState('');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kategori Produk</CardTitle>
        <CardDescription>Kelola kategori (tambah/hapus) yang tersedia untuk produk di U-Cabo.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-6">
          <Input 
            placeholder="Nama kategori baru..." 
            value={newCat} 
            onChange={(e) => setNewCat(e.target.value)} 
          />
          <Button onClick={() => { 
            if(newCat.trim()) {
              handleAddCategory(newCat.trim());
              setNewCat('');
            }
          }}>Tambah</Button>
        </div>
        <div className="space-y-2 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {categories.map((c) => (
             <div key={c.id} className="flex items-center justify-between p-3 border rounded-md">
               <span className="font-medium text-sm text-slate-700">{c.name}</span>
               <Button variant="ghost" size="sm" className="text-red-500 h-8 w-8 p-0 hover:bg-red-50" onClick={() => handleDeleteCategory(c.id)}>
                 <Trash2 className="w-4 h-4" />
               </Button>
             </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-muted-foreground col-span-2">Belum ada kategori terdaftar.</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const ProductsView = ({ products, handleDelete }: { products: ProductItem[], handleDelete: (id: string) => void }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Manajemen Produk (Moderasi)</CardTitle>
        <CardDescription>Pantau daftar barang yang divalidasi. Anda bisa menghapus (take-down) listingan yang melanggar aturan.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {products.length === 0 && <p className="text-sm text-muted-foreground">Belum ada produk terdaftar.</p>}
          {products.map((p) => (
             <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
               <div className="flex items-center gap-3 w-3/4">
                 <img src={p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'} alt={p.name} className="h-10 w-10 rounded-md object-cover border shrink-0" />
                 <div className="min-w-0">
                   <p className="text-sm font-semibold truncate text-slate-800">{p.name}</p>
                   <p className="text-xs text-muted-foreground truncate">
                     Rp {p.price?.toLocaleString('id-ID')} Â· By: <span className="font-medium text-slate-600">{p.seller_name}</span> ({p.status})
                   </p>
                 </div>
               </div>
               <div className="flex gap-2 shrink-0">
                 <Button onClick={() => handleDelete(p.id)} size="sm" variant="destructive" className="h-8 gap-1.5 px-3 rounded-md">
                   <Trash2 className="h-4 w-4 hidden sm:block" /> {window.innerWidth < 640 ? 'Hapus' : 'Take Down'}
                 </Button>
               </div>
             </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const TransactionsView = ({ withdrawals, orders, handleApproveWithdrawal, handleResolveDispute }: { withdrawals: Withdrawal[], orders: SystemOrder[], handleApproveWithdrawal: (id: string, status: 'approved'|'rejected') => void, handleResolveDispute: (id: string, decision: 'completed'|'refunded') => void }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Keuangan & Transaksi</CardTitle>
        <CardDescription>Pantau riwayat transaksi seluruh pengguna dan kelola penarikan dana penjual.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="withdrawals" className="w-full">
          <TabsList className="mb-4">
             <TabsTrigger value="withdrawals">Penarikan Dana</TabsTrigger>
             <TabsTrigger value="disputed">Komplain & Sengketa</TabsTrigger>
             <TabsTrigger value="orders">Semua Transaksi</TabsTrigger>
          </TabsList>
          
          <TabsContent value="withdrawals" className="space-y-3">
             {withdrawals.length === 0 && <p className="text-sm text-muted-foreground">Belum ada data request penarikan dana atau tabel <b>withdrawals</b> belum dibuat.</p>}
             {withdrawals.map((w) => (
                <div key={w.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-3 bg-white">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{w.seller_name} <span className="text-xs font-normal text-muted-foreground">({new Date(w.created_at).toLocaleDateString('id-ID')})</span></p>
                    <p className="text-xs text-slate-500 mt-1">Bank: <span className="font-semibold text-slate-700">{w.bank_name}</span> - Rek: <span className="font-semibold text-slate-700">{w.account_number}</span></p>
                    <p className="text-lg font-bold text-primary mt-1">Rp {Number(w.amount).toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    {w.status === 'pending' ? (
                       <div className="flex gap-2">
                         <Button onClick={() => handleApproveWithdrawal(w.id, 'approved')} size="sm" className="bg-green-600 hover:bg-green-700 text-xs px-4 h-8"><CheckCircle className="h-3 w-3 mr-1" /> Transfer</Button>
                         <Button onClick={() => handleApproveWithdrawal(w.id, 'rejected')} size="sm" variant="outline" className="text-destructive text-xs h-8"><XCircle className="h-3 w-3 mr-1" /> Tolak</Button>
                       </div>
                    ) : (
                       <Badge variant={w.status === 'approved' ? 'default' : 'destructive'}>{w.status === 'approved' ? 'Ditransfer' : 'Ditolak'}</Badge>
                    )}
                  </div>
                </div>
             ))}
          </TabsContent>
          
          <TabsContent value="disputed" className="space-y-3">
             {orders.filter(o => o.status === 'disputed').length === 0 ? (
                <p className="text-sm text-muted-foreground">Tidak ada pesanan yang sedang dalam sengketa/komplain.</p>
             ) : (
                orders.filter(o => o.status === 'disputed').map((o) => (
                   <div key={o.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-orange-200 bg-orange-50/30 gap-4">
                      <div>
                         <p className="font-bold text-slate-800">{o.product_name}</p>
                         <p className="text-xs text-slate-500 mt-1">Penjual: <span className="font-semibold text-slate-700">{o.seller_name}</span> | Harga: <span className="font-bold text-primary">Rp {Number(o.price).toLocaleString('id-ID')}</span></p>
                         <p className="text-[10px] text-orange-600 font-bold mt-2 flex items-center gap-1 uppercase tracking-widest"><ShieldAlert className="h-3 w-3" /> Status: Menunggu Keputusan Admin</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                         <Button size="sm" variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700 hover:bg-green-100" onClick={() => handleResolveDispute(o.id, 'refunded')}>Kembalikan Dana (Refund)</Button>
                         <Button size="sm" variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100" onClick={() => handleResolveDispute(o.id, 'completed')}>Tolak & Selesaikan</Button>
                      </div>
                   </div>
                ))
             )}
          </TabsContent>
          
          <TabsContent value="orders" className="space-y-3">
             {orders.length === 0 && <p className="text-sm text-muted-foreground">Belum ada riwayat pesanan/transaksi di sistem.</p>}
             {orders.map((o) => (
               <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50">
                 <div>
                    <p className="text-sm font-bold">{o.product_name}</p>
                    <p className="text-xs text-muted-foreground">Penjual: {o.seller_name} | {new Date(o.created_at).toLocaleDateString('id-ID')}</p>
                 </div>
                 <div className="text-right flex flex-col items-end">
                    <p className="text-sm font-bold text-slate-800">Rp {Number(o.price).toLocaleString('id-ID')}</p>
                    <Badge variant={o.status === 'completed' || o.status === 'success' || o.status === 'shipped' ? 'default' : o.status === 'pending' || o.status === 'disputed' ? 'secondary' : 'destructive'} className="mt-1 text-[10px]">{o.status.toUpperCase()}</Badge>
                    {o.status === 'disputed' && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800" onClick={() => handleResolveDispute(o.id, 'refunded')}>Refund (Uang Kembali)</Button>
                        <Button size="sm" variant="outline" className="h-6 px-2 text-[10px] border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800" onClick={() => handleResolveDispute(o.id, 'completed')}>Tolak Komplain (Lanjut)</Button>
                      </div>
                    )}
                 </div>
               </div>
             ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const SettingsView = () => {
  const { toast } = useToast();
  const [fee, setFee] = useState<number>(2);
  const [minWithdrawal, setMinWithdrawal] = useState<number>(50000);
  const [appName, setAppName] = useState<string>('U-Cabo');
  const [contactEmail, setContactEmail] = useState<string>('support@u-cabo.com');

  const [bannerTitle, setBannerTitle] = useState<string>('Marketplace Khusus\\nMahasiswa UNKLAB');
  const [bannerSubtitle, setBannerSubtitle] = useState<string>('Jual & beli barang preloved, buku cetak, hingga perangkat praktikum dengan aman dan mudah.');
  const [bannerBadge, setBannerBadge] = useState<string>('U-Cabo');

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase.from('system_settings').select('*');
      if (data && data.length > 0) {
        data.forEach((setting) => {
          if (setting.key === 'service_fee') setFee(Number(setting.value));
          if (setting.key === 'min_withdrawal') setMinWithdrawal(Number(setting.value));
          if (setting.key === 'app_name') setAppName(setting.value);
          if (setting.key === 'contact_email') setContactEmail(setting.value);
          if (setting.key === 'banner_title') setBannerTitle(setting.value);
          if (setting.key === 'banner_subtitle') setBannerSubtitle(setting.value);
          if (setting.key === 'banner_badge') setBannerBadge(setting.value);
        });
      } else if (error && error.code === '42P01') {
        console.warn('Tabel system_settings belum dibuat.');
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    const settings = [
      { key: 'service_fee', value: fee.toString() },
      { key: 'min_withdrawal', value: minWithdrawal.toString() },
      { key: 'app_name', value: appName },
      { key: 'contact_email', value: contactEmail },
      { key: 'banner_title', value: bannerTitle },
      { key: 'banner_subtitle', value: bannerSubtitle },
      { key: 'banner_badge', value: bannerBadge },
    ];
    
    let hasError = false;
    for (const s of settings) {
      const { error } = await supabase.from('system_settings').upsert({ key: s.key, value: s.value }, { onConflict: 'key' });
      if (error) {
        hasError = true;
        console.error(error);
      }
    }

    if (!hasError) {
      toast({ title: 'Pengaturan Disimpan', description: 'Konfigurasi sistem berhasil diperbarui.' });
    } else {
      toast({ title: 'Gagal Menyimpan', description: 'Pastikan tabel system_settings sudah dibuat di Supabase.', variant: 'destructive' });
    }
  };

  return (
    <Card className="shadow-2xl border-slate-200">
      <CardHeader className="pb-10 border-b mb-10">
        <CardTitle className="text-3xl font-black text-slate-900">Pengaturan Sistem</CardTitle>
        <CardDescription className="text-xl font-medium mt-2">Atur komisi, batas penarikan, dan informasi platform.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Label className="text-xl font-black text-slate-800 uppercase tracking-tight">Nama Platform</Label>
            <Input className="h-16 text-lg font-bold shadow-md bg-white border-2 focus:border-primary" type="text" value={appName} onChange={(e) => setAppName(e.target.value)} />
          </div>
          <div className="space-y-4">
            <Label className="text-xl font-black text-slate-800 uppercase tracking-tight">Email Kontak / Bantuan</Label>
            <Input className="h-16 text-lg font-bold shadow-md bg-white border-2 focus:border-primary" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          </div>
          <div className="space-y-4">
            <Label className="text-xl font-black text-slate-800 uppercase tracking-tight">Biaya Layanan / Service Fee (%)</Label>
            <Input className="h-16 text-lg font-bold shadow-md bg-white border-2 focus:border-primary" type="number" value={fee} onChange={(e) => setFee(Number(e.target.value))} />
            <p className="text-base text-muted-foreground font-bold italic">Persentase potongan komisi per transaksi penjualan.</p>
          </div>
          <div className="space-y-4">
            <Label className="text-xl font-black text-slate-800 uppercase tracking-tight">Batas Minimum Penarikan Dana (Rp)</Label>
            <Input className="h-16 text-lg font-bold shadow-md bg-white border-2 focus:border-primary" type="number" value={minWithdrawal} onChange={(e) => setMinWithdrawal(Number(e.target.value))} />
          </div>
        </div>

        <div className="space-y-10 mt-16 pt-16 border-t-4 border-slate-100">
          <div className="flex flex-col gap-4 mb-8">
            <Label className="text-4xl font-black text-primary uppercase tracking-tighter">Tampilan Banner Halaman Depan</Label>
            <p className="text-lg text-slate-500 font-bold">Pengaturan teks yang muncul pada banner promo di halaman utama.</p>
          </div>
          
          <div className="space-y-4">
            <Label className="text-xl font-black text-slate-800 uppercase tracking-tight">Teks Label (Boks Putih Kecil)</Label>
            <Input className="h-16 text-lg font-bold shadow-md bg-white border-2 focus:border-primary" type="text" value={bannerBadge} onChange={(e) => setBannerBadge(e.target.value)} />
          </div>
          
          <div className="space-y-4">
            <Label className="text-xl font-black text-slate-800 uppercase tracking-tight">Judul Utama Banner</Label>
            <Input className="h-16 text-lg font-black shadow-md bg-white border-2 focus:border-primary" type="text" value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} />
            <p className="text-base text-muted-foreground font-bold italic">Gunakan \n untuk membuat baris baru pada judul.</p>
          </div>
          
          <div className="space-y-4">
            <Label className="text-xl font-black text-slate-800 uppercase tracking-tight">Sub-judul / Deskripsi Banner</Label>
            <Input className="h-16 text-lg font-bold shadow-md bg-white border-2 focus:border-primary" type="text" value={bannerSubtitle} onChange={(e) => setBannerSubtitle(e.target.value)} />
          </div>
        </div>

        <div className="pt-10 pb-6">
          <Button onClick={handleSave} className="h-20 px-16 rounded-2xl text-xl font-extrabold gap-4 shadow-2xl shadow-primary/40 transition-all hover:scale-[1.05] active:scale-100 bg-primary hover:bg-primary/90">
            <Save className="h-8 w-8"/> Simpan Pengaturan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const WithdrawalsView = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setWithdrawals(data);
    setLoading(true);
  };

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: newStatus })
      .eq('id', id);
      
    if (!error) {
      toast({ title: 'Berhasil', description: `Penarikan ditandai ${newStatus === 'approved' ? 'Berhasil' : 'Ditolak'}` });
      setWithdrawals(withdrawals.map(w => w.id === id ? { ...w, status: newStatus } : w));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Permintaan Penarikan Dana</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Penarikan</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left">
              <tr>
                <th className="p-4 font-medium">Penjual</th>
                <th className="p-4 font-medium">Nominal</th>
                <th className="p-4 font-medium">Bank & Rekening</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b transition-colors hover:bg-muted/50">
                  <td className="p-4">{w.seller_name || '-'}</td>
                  <td className="p-4 font-semibold text-primary">Rp {w.amount?.toLocaleString('id-ID')}</td>
                  <td className="p-4">{w.bank_name}<br/>{w.account_number}</td>
                  <td className="p-4">{w.status.toUpperCase()}</td>
                  <td className="p-4">
                    {w.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => handleUpdateStatus(w.id, 'approved')}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(w.id, 'rejected')}>Reject</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

const AdminPanel = () => {
  const location = useLocation();
  const { toast } = useToast();
  const currentPath = location.pathname;
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [activeProducts, setActiveProducts] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [orders, setOrders] = useState<SystemOrder[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reports, setReports] = useState<FraudReport[]>([]);

  useEffect(() => {
    fetchKYC();
    fetchUsers();
    fetchCategories();
    fetchProductsCount();
    fetchRecentActivities();
    fetchReports();
    if (currentPath === '/admin/products') {
      fetchAllProducts();
    }
    if (currentPath === '/admin/transactions') {
      fetchTransactionsData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  const fetchTransactionsData = async () => {
    // 1. Fetch Orders (Transaksi belanja seluruh kampus)
    const { data: ords } = await supabase.from('orders').select('*').order('date', { ascending: false });
    if (ords) setOrders(ords);

    // 2. Fetch Penarikan Dana Penjual
    const { data: wds, error } = await supabase.from('withdrawals').select('*').order('created_at', { ascending: false });
    if (wds) setWithdrawals(wds);
    if (error && error.code === '42P01') {
      toast({ title: 'Tabel Belum Tersedia', description: 'Tabel withdrawals belum dibuat di Supabase.' });
    }
  };

  const handleApproveWithdrawal = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('withdrawals').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Aksi Gagal', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Aksi Berhasil', description: `Status penarikan dana ${status === 'approved' ? 'Disetujui' : 'Ditolak'}.` });
      setWithdrawals((prev) => prev.map((w) => w.id === id ? { ...w, status } : w));
    }
  };

  const handleResolveDispute = async (id: string, decision: 'completed' | 'refunded') => {
    const confirmation = window.confirm(decision === 'refunded' ? "Setujui komplain dan kembalikan dana ke pembeli?" : "Tolak komplain dan teruskan dana ke penjual?");
    if (!confirmation) return;

    const { error } = await supabase.from('orders').update({ status: decision }).eq('id', id);
    if (error) {
      toast({ title: 'Aksi Gagal', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sengketa Selesai', description: `Pesanan telah ditandai sebagai ${decision === 'completed' ? 'Selesai (Dana ke Penjual)' : 'Refund (Uang Kembali)'}.` });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: decision } : o));
    }
  };

  const fetchReports = async () => {
    // Ambil data laporan dasar dulu
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Error fetching reports:", error);
      return;
    }

    if (data) {
      // Ambil semua profile untuk mencocokkan nama
      const { data: profiles } = await supabase.from('profiles').select('id, name');
      const profileMap = (profiles || []).reduce((acc: any, p) => {
        acc[p.id] = p.name;
        return acc;
      }, {});

      console.log("Fetched reports:", data);
      setReports(data.map(r => ({
        ...r,
        reporter_name: profileMap[r.reporter_id] || 'User (' + (r.reporter_id?.substring(0,5) || 'Unknown') + ')',
        seller_name: profileMap[r.reported_seller_id] || 'Seller (' + (r.reported_seller_id?.substring(0,5) || 'Unknown') + ')'
      })));
    }
  };

  const fetchAllProducts = async () => {
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setAllProducts(data);
    }
  };

  const handleProductDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus produk (take down) secara permanen?')) return;
    
    // Update state first
    setAllProducts((prev) => prev.filter((p) => p.id !== id));
    
    // Tambahkan .select() untuk mendeteksi apakah baris benar-benar terhapus
    const { data, error } = await supabase.from('products').delete().eq('id', id).select();
    
    if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
      fetchAllProducts(); // restore on fail
    } else if (data && data.length === 0) {
      // RLS silent failure: tidak ada error, tapi tidak ada baris yang dihapus karena tidak ada akses
      toast({ title: 'Akses Ditolak', description: 'Anda tidak memiliki hak akses (RLS) untuk menghapus produk ini di Supabase.', variant: 'destructive' });
      fetchAllProducts(); // restore state karena produk sebenarnya tidak terhapus
    } else {
      toast({ title: 'Berhasil', description: 'Listing produk berhasil dihapus/take-down.' });
      fetchProductsCount(); // Update the main active products count
    }
  };

  const fetchRecentActivities = async () => {
    const allActivities: Activity[] = [];

    // Ambil registrasi user terbaru
    const { data: recentUsers } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(3);
    if (recentUsers) {
      recentUsers.forEach(u => allActivities.push({
        id: `usr-${u.id}`,
        type: 'user',
        title: 'Pengguna Baru Terdaftar',
        description: `${u.name} baru saja mendaftar sebagai ${u.role === 'Seller' ? 'Penjual' : 'Pembeli'}.`,
        time: new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        rawDate: new Date(u.created_at)
      }));
    }

    // Ambil produk baru ditambahkan (cek tabel products kalau sudah ada, jika belum biarkan null)
    const { data: recentProducts, error: prodErr } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(3);
    if (recentProducts && !prodErr) {
      recentProducts.forEach(p => allActivities.push({
        id: `prod-${p.id}`,
        type: 'product',
        title: 'Listing Produk Baru',
        description: `${p.title} ditambahkan seharga Rp ${p.price.toLocaleString('id-ID')}.`,
        time: new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        rawDate: new Date(p.created_at)
      }));
    }

    // Ambil KYC terbaru
    const { data: recentKyc } = await supabase.from('kyc_requests').select('*').order('created_at', { ascending: false }).limit(3);
    if (recentKyc) {
      recentKyc.forEach(k => allActivities.push({
        id: `kyc-${k.id}`,
        type: 'kyc',
        title: 'Pengajuan KYC Baru',
        description: `${k.name} (NIM: ${k.nim}) mengajukan verifikasi data.`,
        time: new Date(k.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
        rawDate: new Date(k.created_at)
      }));
    }

    // Urutkan semua data aktivitas dari yang paling baru ke terlama
    allActivities.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
    
    // Potong, ambil 6 teratas saja
    setActivities(allActivities.slice(0, 6));
  };

  const fetchProductsCount = async () => {
    // Cari jumlah total produk yg belum terjual (status tidak sama dengan 'sold')
    const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true }).neq('status', 'sold');
    if (!error && count !== null) {
      setActiveProducts(count);
    }
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) {
      setUsers(data);
    } else if (error && error.code === '42P01') {
      console.warn('Tabel profiles belum dibuat di Supabase.');
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('*').order('name', { ascending: true });
    if (data) {
      setCategories(data);
    } else if (error && error.code === '42P01') {
      console.warn('Tabel categories belum dibuat.');
    }
  };

  const handleAddCategory = async (name: string) => {
    const { data, error } = await supabase.from('categories').insert([{ name }]).select();
    if (data) {
      setCategories((prev) => [...prev, ...data].sort((a, b) => a.name.localeCompare(b.name)));
      toast({ title: 'Berhasil', description: "Kategori $name ditambahkan." });
    } else if (error) {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (!error) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast({ title: 'Dihapus', description: 'Kategori dihapus.' });
    } else {
      toast({ title: 'Gagal', description: error.message, variant: 'destructive' });
    }
  };

  const fetchKYC = async () => {
    const { data, error } = await supabase.from('kyc_requests').select('*').order('created_at', { ascending: false });
    if (data) {
      setRequests(data);
    } else if (error) {
      if (error.code === '42P01') { 
        // Tabel belum dibuat (Postgres error 42P01: undefined_table)
        toast({ title: 'Menunggu Pengaturan Database', description: 'Silakan jalankan script SQL di Supabase terlebih dahulu.' }); 
      }
    }
  };

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const originalRequests = [...requests];
    // Update state agar UI langsung berubah cepat
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    
    // Update ke Supabase database
    const { error } = await supabase.from('kyc_requests').update({ status }).eq('id', id);
    
    if (error) {
       toast({ title: 'Gagal', description: 'Gagal memperbarui status KYC.', variant: 'destructive' });
       // Kembalikan ke data awal jika error dari server
       setRequests(originalRequests);
    } else {
       toast({ title: 'Berhasil', description: `Status pengguna telah ${status === 'approved' ? 'disetujui' : 'ditolak'}.` });
       
       // Update role to Seller if approved
       if (status === 'approved') {
         const req = requests.find(r => r.id === id);
         if (req) {
           await supabase.from('profiles').update({ role: 'Seller' }).eq('id', req.user_id);
         }
       }
    }
  };

  const updateReportStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('reports').update({ status }).eq('id', id);
    if (!error) {
      toast({ title: 'Status Diperbarui', description: 'Status laporan telah diubah.' });
      setReports(reports.map(r => r.id === id ? { ...r, status: status as any } : r));
    }
  };

  const renderContent = () => {
    if (currentPath === '/admin/kyc') return <KycView requests={requests} updateStatus={updateStatus} />;
    if (currentPath === '/admin/users') return <UsersView users={users} />;
    if (currentPath === '/admin/categories') return <CategoriesView categories={categories} handleAddCategory={handleAddCategory} handleDeleteCategory={handleDeleteCategory} />;
    if (currentPath === '/admin/reports') return <ReportsView reports={reports} updateStatus={updateReportStatus} />;
    if (currentPath === '/admin/settings') return <SettingsView />;
    if (currentPath === '/admin/transactions') return <TransactionsView withdrawals={withdrawals} orders={orders} handleApproveWithdrawal={handleApproveWithdrawal} handleResolveDispute={handleResolveDispute} />;
    if (currentPath === '/admin/products') return <ProductsView products={allProducts} handleDelete={handleProductDelete} />;
    return <DashboardView requests={requests} totalUsers={users.length} activeProducts={activeProducts} activities={activities} />;
  };

  return (
    <SidebarProvider>
      <div className="flex bg-slate-50 min-h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-1 flex-col">
          <header className="flex h-20 bg-white items-center gap-6 border-b px-8 shadow-sm">
            <div className="scale-125 origin-left">
              <SidebarTrigger />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              {currentPath === '/admin/kyc' ? 'Verifikasi Identitas' : 
               currentPath === '/admin/users' ? 'Manajemen Pengguna' :
               currentPath === '/admin/categories' ? 'Manajemen Kategori' :
               currentPath === '/admin/transactions' ? 'Transaksi & Saldo' :
               currentPath === '/admin/products' ? 'Manajemen Produk' :
               currentPath === '/admin/reports' ? 'Laporan Penipuan' :
               currentPath === '/admin/settings' ? 'Pengaturan Sistem' : 'Admin Dashboard'}
            </h1>
          </header>

          <main className="flex-1 space-y-6 p-4 md:p-6">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminPanel;





