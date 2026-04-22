import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-6 max-w-md">
        <CheckCircle className="w-24 h-24 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold text-gray-900">Order Placed!</h1>
        <p className="text-gray-500">
          Thank you for your order. We will send you a confirmation email shortly.
          Your order is being processed.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Link href="/account/orders"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition">
            Track Orders
          </Link>
          <Link href="/products"
            className="px-6 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
