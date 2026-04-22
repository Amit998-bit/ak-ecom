'use client';
import Link            from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Heart, User, Search, Menu, X } from 'lucide-react';
import { useState }    from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { logout } from '@/features/auth/authSlice';

export default function Header() {
  const dispatch  = useAppDispatch();
  const pathname  = usePathname();
  const cartCount = useAppSelector((s) => s.cart.items.length);
  const user      = useAppSelector((s) => s.auth.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen,   setUserOpen]   = useState(false);

  const navLinks = [
    { href: '/',          label: 'Home'       },
    { href: '/products',  label: 'Products'   },
    { href: '/categories',label: 'Categories' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-extrabold text-blue-600 flex-shrink-0">ShopMERN</Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href}
                className={'px-4 py-2 rounded-xl text-sm font-medium transition ' + (pathname === href ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900')}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Link href="/wishlist" className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
              <Heart className="w-5 h-5" />
            </Link>

            <Link href="/cart" className="relative p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            <div className="relative">
              <button onClick={() => setUserOpen(!userOpen)}
                className="p-2.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition">
                <User className="w-5 h-5" />
              </button>

              {userOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl py-2 z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-semibold text-sm text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                      <Link href="/account" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">My Account</Link>
                      <Link href="/account/orders" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">My Orders</Link>
                      {(user.role === 'ADMIN' || user.role === 'STAFF') && (
                        <Link href="/dashboard" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 text-sm text-blue-600 font-medium hover:bg-blue-50 transition">Admin Panel</Link>
                      )}
                      <button onClick={() => { dispatch(logout()); setUserOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login"    onClick={() => setUserOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">Sign In</Link>
                      <Link href="/register" onClick={() => setUserOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">Create Account</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2.5 text-gray-500 hover:bg-gray-50 rounded-xl transition">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={'block px-4 py-2.5 rounded-xl text-sm font-medium transition ' + (pathname === href ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50')}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
