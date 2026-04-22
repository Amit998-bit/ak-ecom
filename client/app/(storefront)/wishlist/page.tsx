'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Trash2, ShoppingCart, Heart } from 'lucide-react';
import { useAppDispatch } from '@/lib/hooks';
import { addToCart } from '@/features/cart/cartSlice';
import apiClient from '@/lib/api-client';

export default function WishlistPage() {
  const dispatch = useAppDispatch();
  const [wishlist, setWishlist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadWishlist = () => {
    apiClient.get('/wishlist')
      .then(({ data }) => setWishlist(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadWishlist(); }, []);

  const handleRemove = async (productId: string) => {
    await apiClient.delete(`/wishlist/${productId}`);
    loadWishlist();
  };

  const handleAddToCart = async (productId: string) => {
    await dispatch(addToCart({ productId, quantity: 1 }));
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-2xl mb-3" />
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );

  const products = wishlist?.products || [];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-500 mt-1">{products.length} items saved</p>
          </div>
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl">
            <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 mb-6">Save items you love to buy them later!</p>
            <Link href="/products" className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product: any) => (
              <div key={product._id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100">
                <Link href={`/products/${product.slug}`} className="block relative aspect-square overflow-hidden bg-gray-50">
                  {product.images?.[0] ? (
                    <Image src={product.images[0].url} alt={product.title} fill className="object-cover hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">📦</div>
                  )}
                </Link>
                
                <div className="p-4">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-blue-600 transition">
                      {product.title}
                    </h3>
                  </Link>
                  <p className="text-xl font-bold text-gray-900 mb-4">
                    ₹{product.basePrice?.toLocaleString()}
                  </p>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product._id)}
                      className="flex-1 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add
                    </button>
                    <button
                      onClick={() => handleRemove(product._id)}
                      className="p-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
