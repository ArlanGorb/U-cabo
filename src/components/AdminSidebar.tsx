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
        <div className="flex items-center gap-2 px-4 py-4">
          <img src={logo} alt="U-Cabo" className="h-8 w-8 object-contain" />
          {!collapsed && <span className="text-sm font-bold">Admin Panel</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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

