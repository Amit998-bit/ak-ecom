'use client';
import Image from 'next/image';
import Link  from 'next/link';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useAppDispatch } from '@/lib/hooks';
import { addToCart }      from '@/features/cart/cartSlice';
import { useState }       from 'react';

interface ProductCardProps {
  product: {
    _id:          string;
    title:        string;
    slug:         string;
    basePrice:    number;
    comparePrice?: number;
    images:       { url: string; alt?: string }[];
    isFeatured?:  boolean;
    salesCount?:  number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const dispatch = useAppDispatch();
  const [adding, setAdding] = useState(false);

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    setAdding(true);
    await dispatch(addToCart({ productId: product._id, quantity: 1 }));
    setAdding(false);
  };

  return (
    <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-gray-100">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {discount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">-{discount}%</span>
        )}
        {product.isFeatured && (
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2.5 py-1 rounded-full">⭐ Featured</span>
        )}
      </div>

      {/* Wishlist */}
      <button className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-sm hover:bg-red-50 hover:text-red-500 transition opacity-0 group-hover:opacity-100">
        <Heart className="w-4 h-4" />
      </button>

      <Link href={'/products/' + product.slug}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          {product.images?.[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.images[0].alt || product.title}
              fill className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">📦</div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">{product.title}</h3>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg font-bold text-gray-900">₹{product.basePrice?.toLocaleString()}</span>
            {product.comparePrice && (
              <span className="text-sm text-gray-400 line-through">₹{product.comparePrice?.toLocaleString()}</span>
            )}
          </div>
        </div>
      </Link>

      {/* Add to cart */}
      <div className="px-4 pb-4">
        <button
          onClick={handleAddToCart}
          disabled={adding}
          className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <ShoppingCart className="w-4 h-4" />
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
