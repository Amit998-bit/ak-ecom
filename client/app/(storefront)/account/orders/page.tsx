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
                      <div className={`flex items-center gap-2 px-4 py-2 ${statusInfo.bg} rounded-full`}>
                        <Icon className={`w-4 h-4 ${statusInfo.color}`} />
                        <span className={`text-sm font-semibold ${statusInfo.color}`}>{order.status}</span>
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
                      <Link href={`/account/orders/${order._id}`} className="flex-1 py-2.5 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition text-center text-sm">
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
