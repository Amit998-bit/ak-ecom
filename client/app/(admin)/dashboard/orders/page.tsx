'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Filter, Package, Truck, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import apiClient from '@/lib/api-client';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:    { label: 'Pending',    color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  CONFIRMED:  { label: 'Confirmed',  color: 'text-blue-700',   bg: 'bg-blue-100',   icon: Package },
  PROCESSING: { label: 'Processing', color: 'text-purple-700', bg: 'bg-purple-100', icon: Package },
  SHIPPED:    { label: 'Shipped',    color: 'text-indigo-700', bg: 'bg-indigo-100', icon: Truck },
  DELIVERED:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  CANCELLED:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-100',    icon: XCircle },
};

const ALL_STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/orders')
      .then(({ data }) => setOrders(data.data.orders))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await apiClient.put(`/orders/${orderId}/status`, { status: newStatus });
    setOrders(orders.map((o) => o._id === orderId ? { ...o, status: newStatus } : o));
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{orders.length} total orders</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {status}
            <span className="ml-2 text-xs opacity-70">
              {status === 'ALL' ? orders.length : orders.filter(o => o.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by order number, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
          </div>
        ) : (
          filtered.map((order) => {
            const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedOrder === order._id;

            return (
              <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Order Header */}
                <div className="p-5 border-b border-gray-50">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-bold text-gray-900 text-sm">#{order.orderNumber}</p>
                          <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {order.customer?.firstName?.[0]}{order.customer?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{order.customer?.email}</p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">₹{order.total?.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Status Changer */}
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(STATUS_CONFIG).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-xl transition font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>

                {/* Products Preview (always visible) */}
                <div className="p-5">
                  <div className="flex gap-3 flex-wrap">
                    {order.items?.slice(0, 4).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 flex-1 min-w-[200px]">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                          {item.product?.images?.[0]?.url ? (
                            <Image
                              src={item.product.images[0].url}
                              alt={item.title}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{item.title}</p>
                          {item.variant && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {Object.entries(item.variant).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">
                              Qty: {item.quantity}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              ₹{(item.price * item.quantity)?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 4 && (
                      <div className="flex items-center justify-center bg-gray-50 rounded-xl p-3 min-w-[100px]">
                        <span className="text-gray-500 text-sm font-medium">+{order.items.length - 4} more</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-5">
                    {/* All Items */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3">All Items</h4>
                      <div className="space-y-2">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                              {item.product?.images?.[0]?.url ? (
                                <Image
                                  src={item.product.images[0].url}
                                  alt={item.title}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.title}</p>
                              {item.variant && Object.keys(item.variant).length > 0 && (
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  {Object.entries(item.variant).map(([k, v]) => (
                                    <span key={k} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium capitalize">
                                      {k}: {v as string}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-sm text-gray-500">SKU: {item.product?.sku || 'N/A'}</span>
                                <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  ₹{item.price?.toLocaleString()} each
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                ₹{(item.price * item.quantity)?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Shipping Address */}
                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span>📍</span> Shipping Address
                        </h4>
                        {order.shippingAddress ? (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.addressLine1}</p>
                            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                            <p>{order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
                            <p className="font-medium text-gray-700 mt-2">📞 {order.shippingAddress.phone}</p>
                          </div>
                        ) : <p className="text-gray-400 text-sm">No address</p>}
                      </div>

                      {/* Payment Info */}
                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span>💳</span> Payment
                        </h4>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Method</span>
                            <span className="font-semibold text-gray-900">{order.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <span className={`font-semibold ${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                          {order.razorpayOrderId && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Transaction</span>
                              <span className="font-mono text-xs text-gray-700">{order.razorpayOrderId.slice(-12)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span>🧾</span> Summary
                        </h4>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium">₹{order.subtotal?.toLocaleString()}</span>
                          </div>
                          {order.discount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Discount</span>
                              <span className="font-medium text-green-600">-₹{order.discount?.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Shipping</span>
                            <span className="font-medium">
                              {order.shippingCost === 0 ? 'FREE' : `₹${order.shippingCost}`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tax</span>
                            <span className="font-medium">₹{order.tax?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-100">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="font-bold text-blue-600 text-lg">₹{order.total?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
