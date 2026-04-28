import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';
import logo from '@/assets/u-cabo-logo.png';

type ChatThread = {
  id: string;      // ID user lawan bicara
  name: string;
  role: string;
  lastMessage: string | null;
  time: string | null;
  unread: number;
};

const ChatList = () => {
   const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchChatList = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Fetch user role
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile) setUserRole(profile.role);

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      setLoading(false);
      return;
    }

    const threadsMap = new Map<string, any>();
    messages?.forEach((msg: any) => {
      const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
      if (!threadsMap.has(partnerId)) {
        threadsMap.set(partnerId, { partnerId, lastMessage: msg.text, time: msg.created_at });
      }
    });

    const partnerIds = Array.from(threadsMap.keys());
    if (partnerIds.length === 0) {
      setThreads([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase.from('profiles').select('*').in('id', partnerIds);
    const profileMap = new Map();
    profiles?.forEach(p => profileMap.set(p.id, p));

    const finalThreads: ChatThread[] = [];
    threadsMap.forEach((chatInfo, partnerId) => {
      const profile = profileMap.get(partnerId);
      finalThreads.push({
        id: partnerId,
        name: profile?.full_name || profile?.name || 'Pengguna U-Cabo',
        role: profile?.role || 'User',
        lastMessage: chatInfo.lastMessage,
        time: new Date(chatInfo.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        unread: 0,
        rawDate: new Date(chatInfo.time)
      });
    });

    finalThreads.sort((a, b) => (b as any).rawDate - (a as any).rawDate);
    setThreads(finalThreads);
    setLoading(false);
  };

   useEffect(() => {
    fetchChatList();
  }, []);

  const handleDeleteThread = async (e: React.MouseEvent, partnerId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.confirm('Hapus seluruh percakapan dengan pengguna ini?')) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Optimistic update: Langsung hapus dari layar agar terasa instan
      setThreads(prev => prev.filter(t => t.id !== partnerId));

      try {
        // Hapus pesan di mana kita pengirim & partner penerima
        const { error: err1 } = await supabase
          .from('messages')
          .delete()
          .eq('sender_id', user.id)
          .eq('receiver_id', partnerId);

        // Hapus pesan di mana partner pengirim & kita penerima
        const { error: err2 } = await supabase
          .from('messages')
          .delete()
          .eq('sender_id', partnerId)
          .eq('receiver_id', user.id);

        if (err1 || err2) {
          throw new Error('Gagal menghapus beberapa pesan');
        }

        toast({ title: 'Berhasil', description: 'Percakapan telah dihapus.' });
      } catch (error) {
        toast({ title: 'Gagal', description: 'Gagal menghapus percakapan di database.', variant: 'destructive' });
        fetchChatList(); // Kembalikan data jika gagal
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-10 w-full">
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
            <a href="/chat" className="text-base font-bold text-primary transition-colors border-b-2 border-primary pb-1">Chat</a>
            {userRole && (userRole.toLowerCase() === 'seller' || userRole.toLowerCase() === 'admin') && (
              <a href="/sell" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Jual Barang</a>
            )}
            <a href="/about" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Visi & Misi</a>
            <a href="/profile" className="text-base font-bold text-slate-600 hover:text-primary transition-colors">Profil Saya</a>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-white px-4 py-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-primary tracking-tighter">Chat</h1>
        </div>
      </header>

      <div className="mx-auto w-full md:max-w-5xl min-h-[calc(100vh-140px)] overflow-hidden mt-6 perspective-1500">
        {loading ? (
           <p className="text-center py-10 text-slate-500">Memuat pesan...</p>
        ) : threads.length === 0 ? (
           <div className="flex flex-col items-center py-20 opacity-60">
             <div className="bg-slate-100 p-6 rounded-full mb-4">
               <span className="text-4xl">💬</span>
             </div>
             <p className="text-slate-600 font-semibold mb-1">Belum ada percakapan</p>
             <p className="text-sm text-slate-500 text-center px-8">Mulai hubungi penjual dari halaman detail produk kampus.</p>
           </div>
        ) : (
          threads.map((thread) => (
            <Link
              key={thread.id}
              to={`/chat/${thread.id}`}
              className="flex items-center gap-6 border-b border-border px-8 py-5 transition-colors hover:bg-muted/30"
            >
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                   <span className="text-2xl font-bold text-primary">{thread.name?.[0]?.toUpperCase()}</span>
                </div>
                {thread.unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm ring-2 ring-background">
                    {thread.unread}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-extrabold text-foreground">{thread.name}</span>
                  <span className="text-sm font-medium text-muted-foreground">{thread.time}</span>
                </div>
                <p className="truncate text-sm font-semibold text-primary mb-1">
                  {thread.role === 'Seller' ? 'Penjual' : 'Anggota Kampus'}
                </p>
                <p className={cn('truncate text-base', thread.unread > 0 ? 'font-bold text-foreground' : 'text-muted-foreground font-medium')}>
                  {thread.lastMessage}
                </p>
              </div>
              <button
                onClick={(e) => handleDeleteThread(e, thread.id)}
                className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all shrink-0"
                title="Hapus Percakapan"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
