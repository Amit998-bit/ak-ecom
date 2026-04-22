'use client';
import { useEffect, useState } from 'react';
import { Search, X, MapPin, ShoppingBag, Mail, Phone, Calendar } from 'lucide-react';
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
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    apiClient.get('/users')
      .then(({ data }) => setUsers(data.data.users))
      .finally(() => setLoading(false));
  }, []);

  const handleViewUser = async (user: any) => {
    setSelectedUser(user);
    setLoadingOrders(true);
    try {
      const res = await apiClient.get(`/orders?customer=${user._id}`);
      setUserOrders(res.data.data.orders || []);
    } catch {
      setUserOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleRoleUpdate = async (id: string, newRole: string) => {
    await apiClient.put(`/users/${id}/role`, { role: newRole });
    setUsers(users.map((u) => u._id === id ? { ...u, role: newRole } : u));
    if (selectedUser?._id === id) setSelectedUser({ ...selectedUser, role: newRole });
  };

  const filtered = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Users ({users.length})</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
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
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Action'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-400">#{user._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer ${ROLE_COLORS[user.role]}`}
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition font-semibold"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${ROLE_COLORS[selectedUser.role]}`}>
                      {selectedUser.role}
                    </span>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${selectedUser.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900 text-sm truncate">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-900 text-sm">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="font-semibold text-gray-900 text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Total Orders</p>
                    <p className="font-semibold text-gray-900 text-sm">{userOrders.length} orders</p>
                  </div>
                </div>
              </div>

              {/* Role Change */}
              <div className="p-4 border border-gray-200 rounded-xl">
                <p className="text-sm font-semibold text-gray-700 mb-2">Change Role</p>
                <div className="flex gap-2">
                  {['CUSTOMER', 'STAFF', 'ADMIN'].map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleUpdate(selectedUser._id, role)}
                      className={`flex-1 py-2 text-sm font-semibold rounded-xl transition ${
                        selectedUser.role === role
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Addresses */}
              {selectedUser.addresses?.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" /> Saved Addresses
                  </h4>
                  <div className="space-y-3">
                    {selectedUser.addresses.map((addr: any, i: number) => (
                      <div key={i} className="p-4 border border-gray-100 rounded-xl text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900">{addr.fullName}</p>
                          {addr.isDefault && (
                            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded font-semibold">Default</span>
                          )}
                        </div>
                        <p className="text-gray-600">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}</p>
                        <p className="text-gray-500 mt-1">📞 {addr.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-500" /> Recent Orders
                </h4>
                {loadingOrders ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : userOrders.length === 0 ? (
                  <p className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl">No orders yet</p>
                ) : (
                  <div className="space-y-2">
                    {userOrders.slice(0, 5).map((order: any) => (
                      <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-mono font-bold text-gray-900 text-sm">#{order.orderNumber}</p>
                          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₹{order.total?.toLocaleString()}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
