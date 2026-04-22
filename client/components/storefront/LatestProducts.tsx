'use client';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchLatestProducts } from '@/features/product/productSlice';
import ProductCard             from './ProductCard';
import ProductCardSkeleton     from './ProductCardSkeleton';
import Link                    from 'next/link';

export default function LatestProducts() {
  const dispatch = useAppDispatch();
  const { latest } = useAppSelector((s) => s.products);

  useEffect(() => { dispatch(fetchLatestProducts(8)); }, [dispatch]);

  if (!latest.length) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Latest Arrivals</h2>
          <p className="text-gray-500 mt-1">Fresh products just added</p>
        </div>
        <Link href="/products?sort=-createdAt" className="text-sm text-blue-600 hover:underline font-medium">View all →</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {latest.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </section>
  );
}
