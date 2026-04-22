'use client';
import { useEffect, useState } from 'react';
import Link                    from 'next/link';
import Image                   from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag, Tag } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchCart, removeFromCart, updateCartItem, clearCartItems, applyCoupon } from '@/features/cart/cartSlice';

export default function CartPage() {
  const dispatch = useAppDispatch();
  const { items, subtotal, total, discount, loading, error } = useAppSelector((s) => s.cart);

  const [couponCode, setCouponCode] = useState('');
  const [couponMsg,  setCouponMsg]  = useState('');
  const [applying,   setApplying]   = useState(false);

  useEffect(() => { dispatch(fetchCart()); }, [dispatch]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplying(true);
    const result = await dispatch(applyCoupon(couponCode));
    if (applyCoupon.fulfilled.match(result)) {
      setCouponMsg('✅ Coupon applied successfully!');
    } else {
      setCouponMsg('❌ ' + (result.payload as string));
    }
    setApplying(false);
  };

  if (!loading && items.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto" />
        <h2 className="text-2xl font-bold text-gray-700">Your cart is empty</h2>
        <p className="text-gray-500">Add some products to get started!</p>
        <Link href="/products" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold">
          Browse Products
        </Link>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <span className="text-gray-500 text-sm">{items.length} item{items.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any) => (
              <div key={item._id} className="bg-white rounded-2xl shadow-sm p-5 flex gap-5">
                {/* Image */}
                <div className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  {item.product?.images?.[0] ? (
                    <Image src={item.product.images[0].url} alt={item.product.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.product?.title}</h3>
                  <p className="text-blue-600 font-bold mt-1">₹{item.price?.toLocaleString()}</p>

                  {/* Qty controls */}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => item.quantity > 1 && dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }))}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-40"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))}
                      className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Subtotal + Remove */}
                <div className="flex flex-col items-end justify-between">
                  <p className="font-bold text-gray-900">₹{(item.price * item.quantity)?.toLocaleString()}</p>
                  <button
                    onClick={() => dispatch(removeFromCart(item._id))}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Clear cart */}
            {items.length > 0 && (
              <button
                onClick={() => dispatch(clearCartItems())}
                className="text-sm text-red-500 hover:text-red-700 transition"
              >
                Clear entire cart
              </button>
            )}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Coupon Code
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={applying}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
                >
                  {applying ? '...' : 'Apply'}
                </button>
              </div>
              {couponMsg && <p className="text-sm mt-2">{couponMsg}</p>}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Order Summary</h3>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} items)</span>
                  <span>₹{subtotal?.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{discount?.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">Free</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-base">
                  <span>Total</span>
                  <span>₹{total?.toLocaleString()}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition text-center"
              >
                Proceed to Checkout
              </Link>

              <Link href="/products" className="block text-center text-sm text-blue-600 hover:underline">
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
