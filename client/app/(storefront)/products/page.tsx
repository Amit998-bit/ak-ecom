'use client';
import { useEffect, useState } from 'react';
import { useSearchParams }     from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchProducts }  from '@/features/product/productSlice';
import ProductCard        from '@/components/storefront/ProductCard';
import ProductCardSkeleton from '@/components/storefront/ProductCardSkeleton';
import Pagination         from '@/components/ui/Pagination';

export default function ProductsPage() {
  const dispatch     = useAppDispatch();
  const searchParams = useSearchParams();
  const { products, loading, pagination } = useAppSelector((s) => s.products);

  const [search, setSearch] = useState('');
  const [sort,   setSort]   = useState('-createdAt');
  const [page,   setPage]   = useState(1);

  useEffect(() => {
    dispatch(fetchProducts({ page, limit: 12, search, sort }));
  }, [dispatch, page, search, sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
          {pagination && (
            <p className="text-sm text-gray-500 mt-1">{pagination.total} products found</p>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="-createdAt">Newest</option>
            <option value="basePrice">Price: Low to High</option>
            <option value="-basePrice">Price: High to Low</option>
            <option value="-salesCount">Best Selling</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(12)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🛍️</p>
          <p className="text-xl font-semibold text-gray-700">No products found</p>
          <p className="text-gray-500 mt-2">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="mt-12">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
