'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, MapPin, ShoppingBag, Heart, Settings, Edit, Plus, Trash2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/hooks';
import { logout } from '@/features/auth/authSlice';
import Link from 'next/link';
import apiClient from '@/lib/api-client';

export default function AccountPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [stats, setStats] = useState({ orders: 0, wishlist: 0 });

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
    else {
      Promise.all([
        apiClient.get('/orders/my-orders'),
        apiClient.get('/wishlist')
      ]).then(([ordersRes, wishlistRes]) => {
        setStats({
          orders: ordersRes.data.data.orders?.length || 0,
          wishlist: wishlistRes.data.data.products?.length || 0
        });
      });
    }
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4">
                  {user.firstName[0]}{user.lastName[0]}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{user.firstName} {user.lastName}</h2>
                <p className="text-gray-500 text-sm">{user.email}</p>
                <span className="mt-3 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">
                  {user.role}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
                  <p className="text-xs text-gray-500">Orders</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <Heart className="w-5 h-5 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{stats.wishlist}</p>
                  <p className="text-xs text-gray-500">Wishlist</p>
                </div>
              </div>

              <button
                onClick={() => dispatch(logout())}
                className="w-full py-3 border border-red-200 text-red-600 font-semibold rounded-xl hover:bg-red-50 transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: ShoppingBag, label: 'My Orders', href: '/account/orders', color: 'blue' },
                { icon: Heart, label: 'Wishlist', href: '/wishlist', color: 'red' },
                { icon: MapPin, label: 'Addresses', href: '/account/addresses', color: 'green' },
                { icon: Settings, label: 'Settings', href: '/account/settings', color: 'gray' },
              ].map(({ icon: Icon, label, href, color }) => (
                <Link
                  key={href}
                  href={href}
                  className={`bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 flex items-center gap-4 hover:border-${color}-200`}
                >
                  <div className={`p-3 bg-${color}-50 rounded-xl`}>
                    <Icon className={`w-6 h-6 text-${color}-600`} />
                  </div>
                  <span className="font-semibold text-gray-900">{label}</span>
                </Link>
              ))}
            </div>

            {/* Addresses */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Saved Addresses</h3>
                <button className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition font-semibold">
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
              </div>

              {user.addresses?.length === 0 ? (
                <p className="text-center py-8 text-gray-400">No addresses saved yet</p>
              ) : (
                <div className="space-y-3">
                  {user.addresses?.map((address: any, idx: number) => (
                    <div key={idx} className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-gray-900">{address.fullName}</p>
                            {address.isDefault && (
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs font-semibold rounded">Default</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {address.addressLine1}, {address.city}, {address.state} - {address.postalCode}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">{address.phone}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
