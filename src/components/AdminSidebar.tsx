import { Shield, Users, FileCheck, BarChart3, Settings, Package, CreditCard, Tags, ShieldAlert } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import logo from '@/assets/u-cabo-logo.png';

const items = [
  { title: 'Dashboard', url: '/admin', icon: BarChart3 },
  { title: 'Produk Aktif', url: '/admin/products', icon: Package },
  { title: 'Transaksi & Saldo', url: '/admin/transactions', icon: CreditCard },
  { title: 'Kategori', url: '/admin/categories', icon: Tags },
  { title: 'Penarikan Dana', url: '/admin/withdrawals', icon: CreditCard },
  { title: 'Verifikasi KYC', url: '/admin/kyc', icon: FileCheck },
  { title: 'Laporan Penipuan', url: '/admin/reports', icon: ShieldAlert },
  { title: 'Pengguna', url: '/admin/users', icon: Users },
  { title: 'Pengaturan', url: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-4 px-5 py-6 border-b mb-4">
          <img src={logo} alt="U-Cabo" className="h-12 w-12 object-contain" />
          {!collapsed && <span className="text-xl font-black text-primary tracking-tighter uppercase">Admin Panel</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-5">Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 px-3">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-14">
                    <NavLink to={item.url} end className="flex items-center gap-4 px-4 rounded-xl transition-all duration-200 hover:bg-slate-200" activeClassName="bg-primary text-white font-black shadow-lg shadow-primary/30 hover:bg-primary/90">
                      <item.icon className="h-6 w-6 shrink-0" />
                      {!collapsed && <span className="text-lg font-extrabold tracking-tight">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

