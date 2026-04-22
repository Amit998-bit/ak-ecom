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
