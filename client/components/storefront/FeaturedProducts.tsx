'use client';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchFeaturedProducts } from '@/features/product/productSlice';
import ProductCard               from './ProductCard';
import ProductCardSkeleton       from './ProductCardSkeleton';
import Link                      from 'next/link';

export default function FeaturedProducts() {
  const dispatch = useAppDispatch();
  const { featured, loading } = useAppSelector((s) => s.products);

  useEffect(() => { dispatch(fetchFeaturedProducts(8)); }, [dispatch]);

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
          <p className="text-gray-500 mt-1">Handpicked products just for you</p>
        </div>
        <Link href="/products?featured=true" className="text-sm text-blue-600 hover:underline font-medium">View all →</Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : featured.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🛍️</p>
          <p>No featured products yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {featured.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </section>
  );
}
