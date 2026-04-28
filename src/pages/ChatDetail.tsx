import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Image as ImageIcon, ShieldCheck, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChatBubble } from '@/components/ChatBubble';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/u-cabo-logo.png';

type Message = { id: string; text: string; fromMe: boolean; time: string };

const ChatDetail = () => {
  const { id: receiverId } = useParams(); // URL params menyimpan ID lawan bicara
  const navigate = useNavigate();
  const { toast } = useToast();
  
   const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [receiver, setReceiver] = useState<any>(null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke bawah saat ada pesan baru
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [msgs]);

  useEffect(() => {
    let messageChannel: any = null;

    const initChat = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: 'Gagal', description: 'Anda harus login untuk mengakses chat', variant: 'destructive'});
        navigate('/login');
        return;
      }
      setCurrentUser(user);

      // Fetch user role
      const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profileData) setUserRole(profileData.role);

      // Ambil Info Lawan Bicara (Receiver) dari tabel profiles
      if (receiverId) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', receiverId).single();
        if (profile) setReceiver(profile);

        // Ambil riwayat chat lama dari database Supabase
        const { data: chatHistory, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });

        if (chatHistory) {
          const formatted = chatHistory.map((m: any) => ({
             id: m.id,
             text: m.text,
             fromMe: m.sender_id === user.id,
             time: new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          }));
          setMsgs(formatted);
        }
      }

      // Aktifkan Real-Time Listener
      messageChannel = supabase
        .channel('chat_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new;
            
            // Pastikan pesan yang masuk sesuai obrolan kita saat ini
            const isRelevant = 
              (newMessage.sender_id === user.id && newMessage.receiver_id === receiverId) ||
              (newMessage.sender_id === receiverId && newMessage.receiver_id === user.id);

            if (isRelevant) {
               setMsgs(prev => {
                  // Hindari duplikasi di state
                  if (prev.find(p => p.id === newMessage.id)) return prev;
                  return [...prev, {
                    id: newMessage.id,
                    text: newMessage.text,
                    fromMe: newMessage.sender_id === user.id,
                    time: new Date(newMessage.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                  }];
               });
            }
          } else if (payload.eventType === 'DELETE') {
            // Hapus pesan dari layar (secara real-time juga hilang di layar lawan bicara)
            setMsgs(prev => prev.filter(m => m.id !== payload.old.id));
          }
        })
        .subscribe();
    };

    initChat();

    return () => {
      // Bersihkan koneksi websocket ketika keluar halaman
      if (messageChannel) supabase.removeChannel(messageChannel);
    };
  }, [receiverId, navigate, toast]);

  const send = async () => {
    if (!input.trim() || !currentUser || !receiverId) return;
    
    const sentText = input;
    setInput('');

    // Kirim pesan ke Backend Supabase
    const { data: newMessage, error } = await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: receiverId,
      text: sentText
    }).select().single();

    if (error) {
      console.error("Detail Error Supabase:", error);
      toast({ 
        title: 'Gagal', 
        description: `Pesan gagal dikirim: ${error.message}`, 
        variant: 'destructive' 
      });
    } else if (newMessage) {
      // Langsung tambahkan ke state lokal agar muncul instan di layar
      setMsgs(prev => {
        if (prev.find(p => p.id === newMessage.id)) return prev;
        return [...prev, {
          id: newMessage.id,
          text: newMessage.text,
          fromMe: true,
          time: new Date(newMessage.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }];
      });
    }
  };

  const handleDeleteChat = async () => {
    if (!currentUser || !receiverId) return;
    
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh riwayat obrolan ini? Tindakan ini akan menghapus pesan di kedua belah pihak.')) {
      try {
        // Hapus pesan yang kita kirim
        const { error: err1 } = await supabase
          .from('messages')
          .delete()
          .eq('sender_id', currentUser.id)
          .eq('receiver_id', receiverId);

        // Hapus pesan yang kita terima
        const { error: err2 } = await supabase
          .from('messages')
          .delete()
          .eq('sender_id', receiverId)
          .eq('receiver_id', currentUser.id);

        if (err1 || err2) throw new Error('Penghapusan gagal di salah satu sisi');

        toast({ title: 'Berhasil', description: 'Riwayat obrolan bersih.' });
        setMsgs([]); // Kosongkan layar
        navigate('/chat'); // Kembali ke daftar chat
      } catch (error) {
        toast({ title: 'Gagal', description: 'Gagal menghapus obrolan.', variant: 'destructive' });
      }
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Header Desktop */}
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

      {/* Header Mobile / Chat Title */}
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-white px-4 py-3 shadow-sm md:mt-2">
        <button onClick={() => navigate(-1)} className="rounded-full p-2 hover:bg-slate-100 transition">
          <ArrowLeft className="h-5 w-5" />
        </button>
        {receiver ? (
          <>
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-sm font-bold text-primary">{(receiver.full_name || receiver.name)?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{receiver.full_name || receiver.name}</p>
              <p className="text-[10px] font-medium text-slate-500">{receiver.role === 'Seller' ? 'Penjual Terverifikasi' : 'Anggota Kampus'}</p>
            </div>
            <div className="ml-auto">
              <button 
                onClick={handleDeleteChat} 
                className="rounded-full p-2 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors" 
                title="Bersihkan Obrolan"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm font-bold text-slate-800">Chat Pengguna</p>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-6 bg-[#f3f4f6]">
        {msgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full mt-20 opacity-50">
             <div className="bg-slate-200 p-4 rounded-full mb-3">
               <Send className="h-8 w-8 text-slate-500" />
             </div>
             <p className="text-sm font-medium text-slate-500">Mulai percakapan dengan aman</p>
          </div>
        ) : (
          msgs.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 border-t bg-white p-3 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          <Input
            placeholder="Ketik balasan Anda..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            className="flex-1 rounded-full border-slate-300 bg-slate-50 px-5 focus-visible:ring-primary h-11"
          />
          <Button size="icon" onClick={send} className="bg-primary text-white hover:bg-primary/90 h-11 w-11 shrink-0 rounded-full shadow-sm transition-transform active:scale-95">
            <Send className="h-4 w-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatDetail;
