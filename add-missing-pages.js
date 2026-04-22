// add-missing-pages.js
// Run: node add-missing-pages.js

import fs from 'fs';
import path from 'path';

const files = {};

// ============================================
// STOREFRONT PAGES
// ============================================

files['client/app/(storefront)/categories/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Grid3x3 } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/categories')
      .then(({ data }) => setCategories(data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-2xl mb-3" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );

  const parentCategories = categories.filter((c) => !c.parent);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-4">
            <Grid3x3 className="w-4 h-4" />
            Browse by Category
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">Shop by Category</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Explore our wide range of categories and find exactly what you're looking for
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {parentCategories.map((category) => (
            <Link
              key={category._id}
              href={\`/products?category=\${category._id}\`}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    📦
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mb-3">{category.description}</p>
                )}
                <div className="flex items-center text-blue-600 text-sm font-semibold">
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
`;

files['client/app/(storefront)/wishlist/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { useAppDispatch } from '@/lib/hooks';
import { addToCart } from '@/features/cart/cartSlice';
import apiClient from '@/lib/api-client';

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadWishlist = () => {
    apiClient.get('/wishlist')
      .then(({ data }) => setWishlist(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadWishlist(); }, []);

  const handleRemove = async (productId: string) => {
    await apiClient.delete(\`/wishlist/\${productId}\`);
    loadWishlist();
  };

  const handleAddToCart = async (productId: string) => {
    await dispatch(addToCart({ productId, quantity: 1 }));
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-2xl mb-3" />
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );

  const products = wishlist?.products || [];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-500 mt-1">{products.length} items saved</p>
          </div>
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl">
            <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save items you love to buy them later!</p>
            <Link href="/products" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <div key={product._id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100">
                <Link href={\`/products/\${product.slug}\`} className="block relative aspect-square overflow-hidden bg-gray-50">
                  {product.images?.[0] ? (
                    <Image src={product.images[0].url} alt={product.title} fill className="object-cover hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                  )}
                </Link>
                
                <div className="p-4">
                  <Link href={\`/products/\${product.slug}\`}>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-blue-600 transition">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="text-xl font-bold text-gray-900 mb-4">
                    ₹{product.basePrice?.toLocaleString()}
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product._id)}
                      className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add
                    </button>
                    <button
                      onClick={() => handleRemove(product._id)}
                      className="p-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
                    >
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
  );
}
`;

files['client/app/(storefront)/account/page.tsx'] = `
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
                  className={\`bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition border border-gray-100 flex items-center gap-4 hover:border-\${color}-200\`}
                >
                  <div className={\`p-3 bg-\${color}-50 rounded-xl\`}>
                    <Icon className={\`w-6 h-6 text-\${color}-600\`} />
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
`;

files['client/app/(storefront)/account/orders/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '@/lib/api-client';

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  PENDING: { icon: Package, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  CONFIRMED: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
  PROCESSING: { icon: Package, color: 'text-purple-600', bg: 'bg-purple-50' },
  SHIPPED: { icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  DELIVERED: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  CANCELLED: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/orders/my-orders')
      .then(({ data }) => setOrders(data.data.orders))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">Start shopping to see your orders here!</p>
            <Link href="/products" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
              const Icon = statusInfo.icon;

              return (
                <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Order Number</p>
                        <p className="font-mono font-bold text-gray-900">{order.orderNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-semibold text-gray-900">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-xl font-bold text-gray-900">₹{order.total?.toLocaleString()}</p>
                      </div>
                      <div className={\`flex items-center gap-2 px-4 py-2 \${statusInfo.bg} rounded-full\`}>
                        <Icon className={\`w-4 h-4 \${statusInfo.color}\`} />
                        <span className={\`text-sm font-semibold \${statusInfo.color}\`}>{order.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="p-6">
                    <div className="space-y-3">
                      {order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.product?.images?.[0] ? (
                              <Image src={item.product.images[0].url} alt={item.title} width={64} height={64} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">{item.title}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900">₹{(item.price * item.quantity)?.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="mt-6 pt-6 border-t border-gray-100 flex gap-3">
                      <Link href={\`/account/orders/\${order._id}\`} className="flex-1 py-2.5 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition text-center text-sm">
                        View Details
                      </Link>
                      {order.status === 'DELIVERED' && (
                        <button className="flex-1 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-sm">
                          Reorder
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
`;

// ============================================
// ADMIN PAGES
// ============================================

files['client/app/(admin)/dashboard/products/new/page.tsx'] = `
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    longDescription: '',
    basePrice: '',
    comparePrice: '',
    sku: '',
    stock: '',
    category: '',
    isFeatured: false,
    isPublished: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/products', {
        ...form,
        basePrice: Number(form.basePrice),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        stock: Number(form.stock),
      });
      router.push('/dashboard/products');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/products" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-500 text-sm">Create a new product listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Premium Cotton T-Shirt"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief product description"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Long Description</label>
              <textarea
                rows={4}
                value={form.longDescription}
                onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed product description"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pricing & Inventory</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Price *</label>
              <input
                type="number"
                required
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Compare Price</label>
              <input
                type="number"
                value={form.comparePrice}
                onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="PROD-001"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                required
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Settings</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="w-5 h-5 accent-blue-600"
              />
              <div>
                <p className="font-semibold text-gray-900">Featured Product</p>
                <p className="text-sm text-gray-500">Display in featured section</p>
              </div>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="w-5 h-5 accent-blue-600"
              />
              <div>
                <p className="font-semibold text-gray-900">Published</p>
                <p className="text-sm text-gray-500">Make product visible to customers</p>
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Product'}
          </button>
          <Link
            href="/dashboard/products"
            className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
`;

files['client/app/(admin)/dashboard/categories/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategories = () => {
    apiClient.get('/categories')
      .then(({ data }) => setCategories(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCategories(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await apiClient.delete(\`/categories/\${id}\`);
    loadCategories();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Link href="/dashboard/categories/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Add Category
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Category', 'Description', 'Parent', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No categories yet</td></tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {category.image ? (
                          <Image src={category.image} alt={category.name} width={40} height={40} className="rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{category.name}</p>
                          <p className="text-xs text-gray-400">{category.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{category.description || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{category.parent?.name || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={\`text-xs font-semibold px-2.5 py-1 rounded-full \${category.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}\`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link href={\`/dashboard/categories/\${category._id}/edit\`} className="p-1.5 hover:bg-blue-50 rounded-lg transition text-blue-500">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(category._id)} className="p-1.5 hover:bg-red-50 rounded-lg transition text-red-400">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
`;

// Continue with remaining files in next response due to length...

// Continue add-missing-pages.js

files['client/app/(admin)/dashboard/categories/new/page.tsx'] = `
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import apiClient from '@/lib/api-client';

export default function NewCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    parent: '',
    isActive: true,
  });

  useEffect(() => {
    apiClient.get('/categories').then(({ data }) => setCategories(data.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post('/categories', {
        ...form,
        parent: form.parent || null,
      });
      router.push('/dashboard/categories');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/categories" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Category</h1>
          <p className="text-gray-500 text-sm">Create a new product category</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Category Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Electronics"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Category</label>
          <select
            value={form.parent}
            onChange={(e) => setForm({ ...form, parent: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None (Root Category)</option>
            {categories.filter(c => !c.parent).map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="w-5 h-5 accent-blue-600"
          />
          <div>
            <p className="font-semibold text-gray-900">Active</p>
            <p className="text-sm text-gray-500">Category is visible to customers</p>
          </div>
        </label>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Category'}
          </button>
          <Link
            href="/dashboard/categories"
            className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
`;

files['client/app/(admin)/dashboard/users/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import { Search, Shield, User as UserIcon } from 'lucide-react';
import apiClient from '@/lib/api-client';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  STAFF: 'bg-blue-100 text-blue-700',
  CUSTOMER: 'bg-green-100 text-green-700',
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiClient.get('/users')
      .then(({ data }) => setUsers(data.data.users))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.firstName.toLowerCase().includes(search.toLowerCase())
  );

  const handleRoleUpdate = async (id: string, newRole: string) => {
    await apiClient.put(\`/users/\${id}/role\`, { role: newRole });
    setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Action'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-400">ID: {user._id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '—'}</td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                      className={\`text-xs font-semibold px-3 py-1.5 rounded-full border-0 \${ROLE_COLORS[user.role]}\`}
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="STAFF">Staff</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className={\`text-xs font-semibold px-2.5 py-1 rounded-full \${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button className="text-sm text-blue-600 hover:underline font-medium">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
`;

files['client/app/(admin)/dashboard/coupons/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Tag, Copy } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCoupons = () => {
    apiClient.get('/coupons')
      .then(({ data }) => setCoupons(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCoupons(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await apiClient.delete(\`/coupons/\${id}\`);
    loadCoupons();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Copied: ' + code);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
          ))
        ) : coupons.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No coupons yet</p>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div key={coupon._id} className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-blue-200 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <button
                    onClick={() => copyCode(coupon.code)}
                    className="font-mono font-bold text-xl text-gray-900 hover:text-blue-600 transition flex items-center gap-1"
                  >
                    {coupon.code}
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <span className={\`text-xs font-semibold px-2 py-1 rounded-full \${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}\`}>
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">{coupon.description}</p>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount:</span>
                  <span className="font-semibold text-blue-600">
                    {coupon.discountType === 'PERCENTAGE' ? \`\${coupon.discountValue}%\` : \`₹\${coupon.discountValue}\`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Min Purchase:</span>
                  <span className="font-semibold">₹{coupon.minPurchase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Used:</span>
                  <span className="font-semibold">{coupon.usageCount} / {coupon.usageLimit || '∞'}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button className="flex-1 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition font-semibold">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(coupon._id)}
                  className="flex-1 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
`;

files['client/app/(admin)/dashboard/reviews/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import { Star, Check, X } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviews = () => {
    apiClient.get('/reviews')
      .then(({ data }) => setReviews(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReviews(); }, []);

  const handleApprove = async (id: string) => {
    await apiClient.put(\`/reviews/\${id}/approve\`);
    loadReviews();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this review?')) return;
    await apiClient.delete(\`/reviews/\${id}\`);
    loadReviews();
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={\`w-4 h-4 \${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}\`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>

      <div className="space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
          ))
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No reviews yet</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                      {review.customer?.firstName?.[0]}{review.customer?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {review.customer?.firstName} {review.customer?.lastName}
                      </p>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        {review.isVerifiedPurchase && (
                          <span className="text-xs text-green-600 font-medium">Verified Purchase</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="font-semibold text-gray-900 mb-1">{review.title}</p>
                  <p className="text-gray-600">{review.comment}</p>
                  
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">
                      Product: <span className="font-medium text-gray-700">{review.product?.title}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  {!review.isApproved && (
                    <button
                      onClick={() => handleApprove(review._id)}
                      className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition"
                      title="Approve"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review._id)}
                    className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                    title="Delete"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {review.isApproved && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
                    ✓ Approved
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
`;

files['client/app/(admin)/dashboard/homepage/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import { GripVertical, Eye, EyeOff, Settings } from 'lucide-react';
import apiClient from '@/lib/api-client';

const SECTION_ICONS: Record<string, string> = {
  BANNER: '🎨',
  FEATURED_PRODUCTS: '⭐',
  LATEST_PRODUCTS: '🆕',
  CATEGORIES: '📂',
  TESTIMONIALS: '💬',
  GALLERY: '🖼️',
  VIDEO: '🎥',
};

export default function HomepageBuilderPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/homepage')
      .then(({ data }) => setConfig(data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (index: number) => {
    const updated = { ...config };
    updated.sections[index].enabled = !updated.sections[index].enabled;
    await apiClient.put('/homepage', updated);
    setConfig(updated);
  };

  const handleSave = async () => {
    await apiClient.put('/homepage', config);
    alert('Homepage configuration saved!');
  };

  if (loading) return <div className="animate-pulse space-y-4">
    {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl" />)}
  </div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Builder</h1>
          <p className="text-gray-500 text-sm">Configure homepage sections</p>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
        >
          Save Changes
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="space-y-3">
          {config?.sections?.map((section: any, index: number) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-blue-200 transition"
            >
              <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
              
              <div className="text-3xl">{SECTION_ICONS[section.type] || '📄'}</div>
              
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{section.type.replace(/_/g, ' ')}</p>
                <p className="text-sm text-gray-500">Order: {section.order}</p>
              </div>

              <button
                onClick={() => handleToggle(index)}
                className={\`p-2 rounded-lg transition \${
                  section.enabled 
                    ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }\`}
              >
                {section.enabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>

              <button className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Pro Tip</h3>
        <p className="text-sm text-blue-700">
          Drag sections to reorder them. Disabled sections won't be visible on the homepage but will remain in the configuration.
        </p>
      </div>
    </div>
  );
}
`;

files['client/app/(admin)/dashboard/theme/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import { Palette, Type, Layout } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function ThemeCustomizerPage() {
  const [theme, setTheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/theme')
      .then(({ data }) => setTheme(data.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    await apiClient.put('/theme', theme);
    alert('Theme saved successfully!');
  };

  if (loading) return <div className="animate-pulse space-y-4">
    {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded-2xl" />)}
  </div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Theme Customizer</h1>
          <p className="text-gray-500 text-sm">Customize your store's appearance</p>
        </div>
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
        >
          Save Theme
        </button>
      </div>

      {/* Colors */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Palette className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Colors</h2>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {Object.entries(theme?.colors || {}).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-2 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={value as string}
                  onChange={(e) => setTheme({
                    ...theme,
                    colors: { ...theme.colors, [key]: e.target.value }
                  })}
                  className="w-16 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                />
                <input
                  type="text"
                  value={value as string}
                  onChange={(e) => setTheme({
                    ...theme,
                    colors: { ...theme.colors, [key]: e.target.value }
                  })}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Type className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Typography</h2>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Font</label>
            <select
              value={theme?.fonts?.primary}
              onChange={(e) => setTheme({
                ...theme,
                fonts: { ...theme.fonts, primary: e.target.value }
              })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Secondary Font</label>
            <select
              value={theme?.fonts?.secondary}
              onChange={(e) => setTheme({
                ...theme,
                fonts: { ...theme.fonts, secondary: e.target.value }
              })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Poppins">Poppins</option>
              <option value="Montserrat">Montserrat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Layout className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Layout</h2>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Header Style</label>
            <select
              value={theme?.layout?.headerStyle}
              onChange={(e) => setTheme({
                ...theme,
                layout: { ...theme.layout, headerStyle: e.target.value }
              })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CLASSIC">Classic</option>
              <option value="MODERN">Modern</option>
              <option value="MINIMAL">Minimal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Footer Style</label>
            <select
              value={theme?.layout?.footerStyle}
              onChange={(e) => setTheme({
                ...theme,
                layout: { ...theme.layout, footerStyle: e.target.value }
              })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SIMPLE">Simple</option>
              <option value="DETAILED">Detailed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border-2 border-dashed border-blue-200">
        <h3 className="font-bold text-gray-900 mb-4">Live Preview</h3>
        <div
          className="bg-white rounded-xl p-6 shadow-lg"
          style={{
            color: theme?.colors?.text,
            fontFamily: theme?.fonts?.primary
          }}
        >
          <h1 style={{ color: theme?.colors?.primary }} className="text-3xl font-bold mb-2">
            ShopMERN
          </h1>
          <p className="mb-4">This is how your store will look with the current theme.</p>
          <button
            style={{ backgroundColor: theme?.colors?.primary, color: 'white' }}
            className="px-6 py-3 rounded-xl font-semibold"
          >
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}
`;

files['client/app/(admin)/dashboard/settings/page.tsx'] = `
'use client';
import { Save, Store, Mail, CreditCard, Truck } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 text-sm">Manage your store settings</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Store Settings */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Store className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Store Information</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Store Name</label>
            <input
              type="text"
              defaultValue="ShopMERN"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Store Description</label>
            <textarea
              rows={3}
              defaultValue="Your one-stop shop for everything"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                defaultValue="support@shopmern.com"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                defaultValue="+91 9999999999"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Email Notifications</h2>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Order Confirmation', desc: 'Send email when order is placed' },
            { label: 'Order Shipped', desc: 'Notify customer when order is shipped' },
            { label: 'Order Delivered', desc: 'Notify customer on delivery' },
            { label: 'Low Stock Alert', desc: 'Alert admin when product stock is low' },
          ].map((item) => (
            <label key={item.label} className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-200 transition cursor-pointer">
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-blue-600" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Payment Settings */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Payment Methods</h2>
        </div>

        <div className="space-y-4">
          {[
            { label: 'Cash on Delivery', enabled: true },
            { label: 'Razorpay', enabled: true },
            { label: 'Stripe', enabled: false },
          ].map((method) => (
            <label key={method.label} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer">
              <span className="font-semibold text-gray-900">{method.label}</span>
              <input type="checkbox" defaultChecked={method.enabled} className="w-5 h-5 accent-blue-600" />
            </label>
          ))}
        </div>
      </div>

      {/* Shipping Settings */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <Truck className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-bold text-gray-900">Shipping</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Free Shipping Above</label>
            <input
              type="number"
              defaultValue="999"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Flat Shipping Fee</label>
            <input
              type="number"
              defaultValue="50"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// ============================================
// WRITE ALL FILES
// ============================================

let created = 0;
let errors  = 0;

console.log('\n🚀 Adding missing pages...\n');

for (const [filePath, content] of Object.entries(files)) {
  try {
    const fullPath = path.resolve(filePath);
    const dir      = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, content.trimStart(), 'utf8');
    console.log('✅  ' + filePath);
    created++;
  } catch (err) {
    console.error('❌  ' + filePath + ' — ' + err);
    errors++;
  }
}

console.log('\n' + '═'.repeat(55));
console.log('📊  SUMMARY');
console.log('═'.repeat(55));
console.log('✅  Created : ' + created + ' files');
console.log('❌  Errors  : ' + errors  + ' files');
console.log('═'.repeat(55));
console.log('\n🎉  All missing pages added!\n');
console.log('🌐  Now you can access:\n');
console.log('  • http://localhost:3000/categories');
console.log('  • http://localhost:3000/wishlist');
console.log('  • http://localhost:3000/account');
console.log('  • http://localhost:3000/account/orders');
console.log('  • http://localhost:3000/dashboard/products/new');
console.log('  • http://localhost:3000/dashboard/categories');
console.log('  • http://localhost:3000/dashboard/users');
console.log('  • http://localhost:3000/dashboard/coupons');
console.log('  • http://localhost:3000/dashboard/reviews');
console.log('  • http://localhost:3000/dashboard/homepage');
console.log('  • http://localhost:3000/dashboard/theme');
console.log('  • http://localhost:3000/dashboard/settings\n');

console.log('✅ Script ready! Save this as add-missing-pages.js and run: node add-missing-pages.js');