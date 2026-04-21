import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    const fetchChatList = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Ambil semua pesan di mana kita adalah pengirim ATAU penerima
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching chats:", error);
        setLoading(false);
        return;
      }

      // Kelompokkan pesan berdasarkan "lawan bicara" (partner)
      const threadsMap = new Map<string, any>();

      messages?.forEach((msg: any) => {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!threadsMap.has(partnerId)) {
          threadsMap.set(partnerId, {
            partnerId,
            lastMessage: msg.text,
            time: msg.created_at
          });
        }
      });

      const partnerIds = Array.from(threadsMap.keys());
      
      if (partnerIds.length === 0) {
        setLoading(false);
        return;
      }

      // Ambil nama profil lawan bicara
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', partnerIds);

      const profileMap = new Map();
      profiles?.forEach(p => profileMap.set(p.id, p));

      const finalThreads: ChatThread[] = [];
      
      // Gunakan threadsMap sebagai basis agar semua chat muncul
      threadsMap.forEach((chatInfo, partnerId) => {
        const profile = profileMap.get(partnerId);
        finalThreads.push({
          id: partnerId,
          name: profile?.name || 'Pengguna U-Cabo',
          role: profile?.role || 'User',
          lastMessage: chatInfo.lastMessage,
          time: new Date(chatInfo.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          unread: 0,
          rawDate: new Date(chatInfo.time) // Untuk sorting
        });
      });

      // Sortir secara descending (chat terbaru di atas)
      finalThreads.sort((a, b) => (b as any).rawDate - (a as any).rawDate);

      setThreads(finalThreads);
      setLoading(false);
    };

    fetchChatList();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-10 w-full">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 backdrop-blur px-6 py-5 shadow-sm md:px-12 w-full">
        <h1 className="text-2xl font-extrabold text-primary">Pesan</h1>
        <div className="flex items-center gap-4 md:gap-6">
              <a href="/" className="text-sm font-semibold hover:text-primary transition-colors">Home</a>
              <a href="/chat" className="text-sm font-semibold text-primary transition-colors">Chat</a>
              <a href="/profile" className="text-sm font-semibold hover:text-primary transition-colors">Profil Saya</a>
        </div>
      </header>

      <div className="mx-auto w-full md:max-w-5xl bg-background min-h-[calc(100vh-140px)] shadow-sm border-x border-b rounded-b-xl overflow-hidden mt-6">
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
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatList;
