'use client';
import { useEffect, useState } from 'react';
import Link    from 'next/link';
import Image   from 'next/image';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    apiClient.get('/products', { params: { limit: 50 } })
      .then(({ data }) => setProducts(data.data.products))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await apiClient.delete('/products/' + id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link href="/dashboard/products/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm">
        <div className="p-5 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text" placeholder="Search products..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <span className="text-sm text-gray-500">{filtered.length} products</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Product', 'Price', 'Stock', 'Category', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">No products found</td></tr>
                ) : (
                  filtered.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <Image src={product.images[0].url} alt={product.title} width={48} height={48} className="w-full h-full object-cover" />
                            ) : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm line-clamp-1">{product.title}</p>
                            <p className="text-xs text-gray-400">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{product.basePrice?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.stock}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{product.category?.name || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={'text-xs font-semibold px-2.5 py-1 rounded-full ' + (product.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')}>
                          {product.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link href={'/products/' + product.slug} target="_blank" className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500 hover:text-gray-700">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link href={'/dashboard/products/' + product._id + '/edit'} className="p-1.5 hover:bg-blue-50 rounded-lg transition text-blue-500 hover:text-blue-700">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(product._id)} className="p-1.5 hover:bg-red-50 rounded-lg transition text-red-400 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
