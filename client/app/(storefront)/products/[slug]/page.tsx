'use client';
import { useEffect, useState } from 'react';
import { useParams }           from 'next/navigation';
import Image                   from 'next/image';
import { ShoppingCart, Heart, Star, Truck, Shield, RefreshCw } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchProductBySlug } from '@/features/product/productSlice';
import { addToCart }          from '@/features/cart/cartSlice';
import toast                  from '@/lib/toast';

export default function ProductDetailPage() {
  const { slug }   = useParams<{ slug: string }>();
  const dispatch   = useAppDispatch();
  const { product, loading } = useAppSelector((s) => s.products);

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity,      setQuantity]      = useState(1);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [adding,        setAdding]        = useState(false);

  useEffect(() => {
    if (slug) dispatch(fetchProductBySlug(slug as string));
  }, [dispatch, slug]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-xl font-semibold">Product not found</p>
      </div>
    </div>
  );

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.basePrice) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = async () => {
    setAdding(true);
    await dispatch(addToCart({ productId: product._id, quantity }));
    setAdding(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
            {product.images?.[selectedImage] ? (
              <Image
                src={product.images[selectedImage].url}
                alt={product.images[selectedImage].alt || product.title}
                fill className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">📦</div>
            )}
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                    selectedImage === i ? 'border-blue-500' : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <Image src={img.url} alt={img.alt || ''} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-blue-600 font-medium mb-2">
              {product.category?.name}
            </p>
            <h1 className="text-3xl font-bold text-gray-900">{product.title}</h1>
          </div>

          {/* Price */}
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-gray-900">
              ₹{product.basePrice?.toLocaleString()}
            </span>
            {product.comparePrice && (
              <span className="text-2xl text-gray-400 line-through">
                ₹{product.comparePrice?.toLocaleString()}
              </span>
            )}
            {discount > 0 && (
              <span className="text-green-600 font-semibold text-lg">
                {discount}% off
              </span>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-gray-600 leading-relaxed">{product.shortDescription}</p>
          )}

          {/* Variants */}
          {product.options?.map((option: any) => (
            <div key={option.name}>
              <p className="text-sm font-semibold text-gray-700 mb-2">{option.name}</p>
              <div className="flex flex-wrap gap-2">
                {option.values.map((val: string) => (
                  <button
                    key={val}
                    onClick={() => setSelectedAttrs((prev) => ({ ...prev, [option.name]: val }))}
                    className={`px-4 py-2 border-2 rounded-lg text-sm font-medium transition ${
                      selectedAttrs[option.name] === val
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Quantity</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-gray-400 transition"
              >−</button>
              <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold hover:border-gray-400 transition"
              >+</button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="flex-1 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ShoppingCart className="w-5 h-5" />
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-xl hover:border-red-400 hover:text-red-500 transition">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-100">
            {[
              { icon: <Truck className="w-5 h-5" />,    text: 'Free Shipping' },
              { icon: <Shield className="w-5 h-5" />,   text: 'Secure Payment' },
              { icon: <RefreshCw className="w-5 h-5" />, text: 'Easy Returns' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex flex-col items-center gap-1 text-center text-xs text-gray-500">
                <span className="text-blue-500">{icon}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Long description */}
      {product.longDescription && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Details</h2>
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: product.longDescription }}
          />
        </div>
      )}
    </div>
  );
}
