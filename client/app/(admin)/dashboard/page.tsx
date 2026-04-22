'use client';
import { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, Package, TrendingUp, Eye } from 'lucide-react';
import Link    from 'next/link';
import apiClient from '@/lib/api-client';

interface Stats {
  totalRevenue:  number;
  totalOrders:   number;
  totalUsers:    number;
  totalProducts: number;
  recentOrders:  any[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-yellow-100 text-yellow-700',
  CONFIRMED:  'bg-blue-100   text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED:    'bg-indigo-100 text-indigo-700',
  DELIVERED:  'bg-green-100  text-green-700',
  CANCELLED:  'bg-red-100    text-red-700',
};

export default function DashboardPage() {
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/admin/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { title: 'Total Revenue',   value: '₹' + ((stats?.totalRevenue  || 0).toLocaleString()), icon: <DollarSign  className="w-6 h-6" />, color: 'from-blue-500   to-blue-600',   link: '/dashboard/orders'   },
    { title: 'Total Orders',    value: stats?.totalOrders   || 0,                             icon: <ShoppingBag className="w-6 h-6" />, color: 'from-green-500  to-green-600',  link: '/dashboard/orders'   },
    { title: 'Total Customers', value: stats?.totalUsers    || 0,                             icon: <Users       className="w-6 h-6" />, color: 'from-yellow-500 to-yellow-600', link: '/dashboard/users'    },
    { title: 'Total Products',  value: stats?.totalProducts || 0,                             icon: <Package     className="w-6 h-6" />, color: 'from-purple-500 to-purple-600', link: '/dashboard/products' },
  ];

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-200 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, here's what's happening today</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map((card) => (
          <Link key={card.title} href={card.link}
            className={'bg-gradient-to-br ' + card.color + ' rounded-2xl p-6 text-white hover:shadow-lg transition-shadow cursor-pointer'}>
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/20 rounded-xl">{card.icon}</div>
              <TrendingUp className="w-4 h-4 opacity-70" />
            </div>
            <p className="text-3xl font-bold">{card.value}</p>
            <p className="text-white/80 text-sm mt-1">{card.title}</p>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:underline font-medium">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['Order #', 'Customer', 'Total', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats?.recentOrders?.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No orders yet</td></tr>
              ) : (
                stats?.recentOrders?.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-mono text-xs text-gray-600">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.customer?.firstName} {order.customer?.lastName}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{order.total?.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + (STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600')}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <Link href={'/dashboard/orders/' + order._id} className="text-blue-500 hover:text-blue-700">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
