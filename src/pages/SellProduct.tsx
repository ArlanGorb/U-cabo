import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BottomNav } from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase'; // Import Supabase

const SellProduct = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('Buyer');
  
  const [formData, setFormData] = useState({
    name: '', price: '', condition: '', category: '', desc: '', minus: ''
  });
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name', { ascending: true });
      if (data) setCategories(data);
    };
    fetchCategories();

    const checkKyc = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('kyc_requests').select('status').eq('user_id', user.id).single();
        if (!data || data.status !== 'approved') {
          toast({ title: 'Akses Ditolak', description: 'Anda harus menyelesaikan verifikasi KYC dari Admin untuk berjualan.', variant: 'destructive' });
          navigate('/kyc', { replace: true });
        }

        // Fetch user role
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile) setUserRole(profile.role);
      } else {
        navigate('/login', { replace: true });
      }
    };
    checkKyc();
  }, [navigate]);

  useEffect(() => {
    if (editId) {
      const fetchProduct = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('products').select('*').eq('id', editId).single();
        if (data) {
          setFormData({
            name: data.name || '',
            price: data.price?.toString() || '',
            condition: data.condition || '',
            category: data.category || '',
            desc: data.description || '',
            minus: data.minus || ''
          });
          setImagePreview(data.image_url);
          setExistingImageUrl(data.image_url);
        }
        setLoading(false);
      };
      fetchProduct();
    }
  }, [editId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let imageUrl = existingImageUrl || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';

    if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, imageFile);

        if (!uploadError) {
             const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
             imageUrl = data.publicUrl;
        } else {
             console.error("Gagal mengupload gambar:", uploadError.message);
        }
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({ title: 'Gagal', description: 'Anda harus login terlebih dahulu', variant: 'destructive' });
      setLoading(false);
      navigate('/login');
      return;
    }

    const productData = {
      name: formData.name,
      price: parseInt(formData.price),
      condition: formData.condition,
      category: formData.category,
      description: formData.desc,
      minus: formData.minus,
      seller_id: user.id, 
      seller_name: user.user_metadata?.full_name || 'Penjual',
      status: 'active',
      image_url: imageUrl
    };

    if (editId) {
      const { error } = await supabase.from('products').update(productData).eq('id', editId);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Berhasil', description: 'Produk berhasil diperbarui!' });
        navigate('/seller');
      }
    } else {
      const { error } = await supabase.from('products').insert([productData]);
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Berhasil', description: 'Produk berhasil ditambahkan!' });
        navigate('/');
      }
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen pb-20 bg-background flex flex-col w-full">
      <div className="w-full bg-background min-h-screen relative">
        
        {/* Header Desktop */}
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur hidden md:block mb-8">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <h1 className="text-2xl font-black text-primary tracking-tight">U-Cabo</h1>
            </div>
            <div className="flex items-center gap-6">
              <a href="/" className="text-sm font-semibold hover:text-primary transition-colors">Home</a>
              <a href="/chat" className="text-sm font-semibold hover:text-primary transition-colors">Chat</a>
              {userRole === 'Seller' && (
                <a href="/sell" className="text-sm font-semibold text-primary transition-colors">Jual Barang</a>
              )}
              <a href="/profile" className="text-sm font-semibold hover:text-primary transition-colors">Profil Saya</a>
            </div>
          </div>
        </header>

        {/* Header Mobile */}
        <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
            <h1 className="text-sm font-semibold">{editId ? 'Edit Produk' : 'Jual Barang'}</h1>
          </div>
        </header>

        <div className="mx-auto w-full md:max-w-4xl pt-4 md:pt-8 px-4 md:px-8 pb-12">
          <div className="hidden md:block mb-10 text-center">
            <h1 className="text-4xl font-black text-primary tracking-tight">{editId ? 'Edit Jualan' : 'Jual Barang Baru'}</h1>
            <p className="text-lg text-muted-foreground mt-3">Isi detail lengkap barang yang ingin Anda jual dengan jujur.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 bg-card/30 p-6 md:p-10 rounded-3xl border shadow-sm">
            {/* Photo upload */}
            <div>
              <Label>Foto Produk</Label>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 p-4 transition-all duration-300 hover:border-accent hover:bg-accent/5 aspect-video relative bg-slate-50 group">
                {imagePreview ? (
                   <img src={imagePreview} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                   <div className="flex flex-col items-center gap-2">
                      <div className="h-10 w-10 text-muted-foreground group-hover:text-accent flex items-center justify-center rounded-full bg-slate-200 group-hover:bg-accent/10 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Click to upload photo</span>
                   </div>
                )}
                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Produk</Label>
                <Input id="name" placeholder="contoh: MacBook Air M1 2020" required className="h-12" 
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp)</Label>
                <Input id="price" type="number" placeholder="contoh: 8500000" required className="h-12" 
                   value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Kondisi</Label>
                <Select value={formData.condition || ''} required onValueChange={(val) => setFormData({...formData, condition: val})}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Pilih kondisi" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baru">Baru</SelectItem>
                    <SelectItem value="bekas">Bekas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={formData.category || ''} required onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger className="h-12"><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <SelectItem value="loading" disabled>Memuat kategori...</SelectItem>
                    ) : (
                      categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name.toLowerCase()}>{cat.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Deskripsi</Label>
              <Textarea id="desc" placeholder="Jelaskan detail produk Anda..." required className="min-h-[100px]" rows={4} 
                 value={formData.desc} onChange={(e) => setFormData({...formData, desc: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minus">Minus / Kekurangan</Label>
              <Textarea id="minus" placeholder="Sebutkan kekurangan produk jika ada..." className="min-h-[80px]" rows={2} 
                 value={formData.minus} onChange={(e) => setFormData({...formData, minus: e.target.value})} />
            </div>

            <Button type="submit" disabled={loading} className="w-full h-12 mt-4 text-base font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-md">
              {loading ? 'Memproses...' : (editId ? 'Simpan Perubahan' : 'Pasang Iklan')}
            </Button>
          </form>
        </div>

        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
};

export default SellProduct;





