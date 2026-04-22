'use client';
import { useState }  from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { clearCartItems } from '@/features/cart/cartSlice';
import apiClient from '@/lib/api-client';

interface Address {
  fullName: string; phone: string; addressLine1: string;
  addressLine2: string; city: string; state: string;
  postalCode: string; country: string;
}

const emptyAddress: Address = {
  fullName: '', phone: '', addressLine1: '', addressLine2: '',
  city: '', state: '', postalCode: '', country: 'India',
};

export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { items, total } = useAppSelector((s) => s.cart);
  const user             = useAppSelector((s) => s.auth.user);

  const [address,  setAddress]  = useState<Address>(emptyAddress);
  const [payment,  setPayment]  = useState('COD');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setLoading(true); setError('');
    try {
      await apiClient.post('/orders', { shippingAddress: address, paymentMethod: payment });
      dispatch(clearCartItems());
      router.push('/orders/success');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Order failed. Please try again.');
    } finally { setLoading(false); }
  };

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Address Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Shipping Address</h2>
              {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'fullName', label: 'Full Name', type: 'text', colSpan: 2 },
                  { name: 'phone', label: 'Phone Number', type: 'tel', colSpan: 1 },
                  { name: 'addressLine1', label: 'Address Line 1', type: 'text', colSpan: 2 },
                  { name: 'addressLine2', label: 'Address Line 2 (Optional)', type: 'text', colSpan: 2 },
                  { name: 'city',  label: 'City',    type: 'text', colSpan: 1 },
                  { name: 'state', label: 'State',   type: 'text', colSpan: 1 },
                  { name: 'postalCode', label: 'Postal Code', type: 'text', colSpan: 1 },
                  { name: 'country',    label: 'Country',     type: 'text', colSpan: 1 },
                ].map(({ name, label, type, colSpan }) => (
                  <div key={name} className={colSpan === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      type={type} name={name}
                      value={(address as any)[name]}
                      onChange={handleChange}
                      required={name !== 'addressLine2'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-5">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: 'COD',      label: 'Cash on Delivery',   desc: 'Pay when your order arrives' },
                  { value: 'RAZORPAY', label: 'Razorpay',           desc: 'UPI, Cards, Net Banking' },
                  { value: 'STRIPE',   label: 'Stripe',             desc: 'International cards' },
                ].map(({ value, label, desc }) => (
                  <label key={value} className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${payment === value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value={value} checked={payment === value} onChange={(e) => setPayment(e.target.value)} className="accent-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{label}</p>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map((item: any) => (
                  <div key={item._id} className="flex gap-3 text-sm">
                    <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] && (
                        <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.product?.title}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">₹{(item.price * item.quantity)?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{total?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className="text-green-600">Free</span></div>
                <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2">
                  <span>Total</span><span>₹{total?.toLocaleString()}</span>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="mt-6 w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-60 text-lg"
              >
                {loading ? 'Placing Order...' : 'Place Order →'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
