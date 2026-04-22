'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/api-client';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    longDescription: '',
    basePrice: '',
    comparePrice: '',
    sku: '',
    stock: '',
    category: '',
    isFeatured: false,
    isPublished: true,
    seo: {
      metaTitle: '',
      metaDescription: '',
      keywords: [] as string[],
    },
  });
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get(`/products/${id}`),
      apiClient.get('/categories'),
    ]).then(([productRes, catRes]) => {
      const p = productRes.data.data;
      setForm({
        title: p.title || '',
        shortDescription: p.shortDescription || '',
        longDescription: p.longDescription || '',
        basePrice: p.basePrice?.toString() || '',
        comparePrice: p.comparePrice?.toString() || '',
        sku: p.sku || '',
        stock: p.stock?.toString() || '',
        category: p.category?._id || p.category || '',
        isFeatured: p.isFeatured || false,
        isPublished: p.isPublished ?? true,
        seo: {
          metaTitle: p.seo?.metaTitle || '',
          metaDescription: p.seo?.metaDescription || '',
          keywords: p.seo?.keywords || [],
        },
      });
      setExistingImages(p.images || []);
      setCategories(catRes.data.data);
    }).finally(() => setFetching(false));
  }, [id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;
    if (totalImages > 5) {
      alert('Maximum 5 images allowed');
      return;
    }
    setNewImages((prev) => [...prev, ...files]);
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...urls]);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (kw && !form.seo.keywords.includes(kw)) {
      setForm({ ...form, seo: { ...form.seo, keywords: [...form.seo.keywords, kw] } });
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setForm({ ...form, seo: { ...form.seo, keywords: form.seo.keywords.filter((k) => k !== kw) } });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('shortDescription', form.shortDescription);
      formData.append('longDescription', form.longDescription);
      formData.append('basePrice', form.basePrice);
      if (form.comparePrice) formData.append('comparePrice', form.comparePrice);
      formData.append('sku', form.sku);
      formData.append('stock', form.stock);
      formData.append('category', form.category);
      formData.append('isFeatured', String(form.isFeatured));
      formData.append('isPublished', String(form.isPublished));
      formData.append('seo', JSON.stringify(form.seo));
      formData.append('existingImages', JSON.stringify(existingImages));
      newImages.forEach((img) => formData.append('images', img));

      await apiClient.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      router.push('/dashboard/products');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="max-w-4xl mx-auto space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-gray-200 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/products" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-gray-500 text-sm">Update product information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Product Images
            <span className="ml-2 text-sm font-normal text-gray-400">
              ({existingImages.length + newImages.length}/5)
            </span>
          </h2>

          <div className="grid grid-cols-5 gap-3 mb-4">
            {existingImages.map((img, i) => (
              <div key={`ex-${i}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-200">
                <Image src={img.url} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Main</span>
                )}
              </div>
            ))}

            {previewUrls.map((url, i) => (
              <div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-200">
                <Image src={url} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                <span className="absolute bottom-1 left-1 text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">New</span>
              </div>
            ))}

            {existingImages.length + newImages.length < 5 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500">
                <Upload className="w-6 h-6" />
                <span className="text-xs font-medium">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-400">Upload up to 5 images. First image will be the main product image.</p>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Long Description</label>
              <textarea
                rows={5}
                value={form.longDescription}
                onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Pricing & Inventory</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Price *</label>
              <input
                type="number"
                required
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Compare Price</label>
              <input
                type="number"
                value={form.comparePrice}
                onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Stock *</label>
              <input
                type="number"
                required
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">SEO Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Title</label>
              <input
                type="text"
                value={form.seo.metaTitle}
                onChange={(e) => setForm({ ...form, seo: { ...form.seo, metaTitle: e.target.value } })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SEO optimized title"
              />
              <p className="text-xs text-gray-400 mt-1">{form.seo.metaTitle.length}/60 characters</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Meta Description</label>
              <textarea
                rows={3}
                value={form.seo.metaDescription}
                onChange={(e) => setForm({ ...form, seo: { ...form.seo, metaDescription: e.target.value } })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description for search engines"
              />
              <p className="text-xs text-gray-400 mt-1">{form.seo.metaDescription.length}/160 characters</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Keywords</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type keyword and press Enter or Add"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-semibold"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.seo.keywords.map((kw) => (
                  <span key={kw} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-500 transition">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="w-5 h-5 accent-blue-600"
              />
              <div>
                <p className="font-semibold text-gray-900">Featured Product</p>
                <p className="text-sm text-gray-500">Display in featured section on homepage</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="w-5 h-5 accent-blue-600"
              />
              <div>
                <p className="font-semibold text-gray-900">Published</p>
                <p className="text-sm text-gray-500">Make product visible to customers</p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/dashboard/products" className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
