'use client';
import Link           from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, FolderOpen, ShoppingBag,
  Users, Tag, Star, Settings, Palette, Home, ChevronRight,
} from 'lucide-react';

const links = [
  { href: '/dashboard',             icon: LayoutDashboard, label: 'Dashboard'   },
  { href: '/dashboard/products',    icon: Package,         label: 'Products'    },
  { href: '/dashboard/categories',  icon: FolderOpen,      label: 'Categories'  },
  { href: '/dashboard/orders',      icon: ShoppingBag,     label: 'Orders'      },
  { href: '/dashboard/users',       icon: Users,           label: 'Users'       },
  { href: '/dashboard/coupons',     icon: Tag,             label: 'Coupons'     },
  { href: '/dashboard/reviews',     icon: Star,            label: 'Reviews'     },
  { href: '/dashboard/homepage',    icon: Home,            label: 'Homepage'    },
  { href: '/dashboard/theme',       icon: Palette,         label: 'Theme'       },
  { href: '/dashboard/settings',    icon: Settings,        label: 'Settings'    },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col flex-shrink-0">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800">
        <span className="text-xl font-extrabold text-blue-400">ShopMERN</span>
        <span className="ml-2 text-xs text-gray-500 font-medium">Admin</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="px-6 py-2 text-[10px] font-bold text-gray-600 uppercase tracking-widest">Main Menu</p>
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}
              className={'flex items-center gap-3 px-5 py-2.5 mx-2 rounded-xl text-sm font-medium transition ' + (active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-gray-800">
        <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 transition">
          <span>←</span>
          <span>Back to Store</span>
        </Link>
      </div>
    </aside>
  );
}
