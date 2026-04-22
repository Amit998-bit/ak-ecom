import { Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';

const perks = [
  { icon: <Truck       className="w-5 h-5" />, title: 'Free Shipping',   desc: 'On orders over ₹999' },
  { icon: <ShieldCheck className="w-5 h-5" />, title: 'Secure Payments', desc: '100% secure & safe'   },
  { icon: <RefreshCw   className="w-5 h-5" />, title: 'Easy Returns',    desc: '30-day return policy' },
  { icon: <Headphones  className="w-5 h-5" />, title: '24/7 Support',    desc: 'Always here to help'  },
];

export default function PromoStrip() {
  return (
    <div className="bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200">
          {perks.map(({ icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3 py-5 px-6">
              <div className="text-blue-600 flex-shrink-0">{icon}</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
