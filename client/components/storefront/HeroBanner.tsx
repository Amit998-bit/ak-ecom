import Link from 'next/link';

export default function HeroBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 flex flex-col items-center text-center">
        <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-sm font-medium rounded-full mb-6">
          🎉 New Collection Available
        </span>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
          Shop the Best<br />
          <span className="text-yellow-300">Deals Online</span>
        </h1>

        <p className="text-lg md:text-xl text-blue-100 max-w-2xl mb-10 leading-relaxed">
          Discover thousands of products at unbeatable prices.
          Free shipping on orders over ₹999. Shop with confidence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/products"
            className="px-8 py-4 bg-white text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition text-lg shadow-lg hover:shadow-xl">
            Shop Now →
          </Link>
          <Link href="/categories"
            className="px-8 py-4 border-2 border-white/50 text-white font-bold rounded-2xl hover:bg-white/10 transition text-lg">
            Browse Categories
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 md:gap-16 text-center">
          {[
            { value: '10K+', label: 'Products' },
            { value: '50K+', label: 'Customers' },
            { value: '99%',  label: 'Satisfaction' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-2xl md:text-3xl font-extrabold text-white">{value}</p>
              <p className="text-blue-200 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
