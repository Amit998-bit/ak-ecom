// fix-all-issues.js
// Run: node fix-all-issues.js

import fs from 'fs';
import path from 'path';

const files = {};

// ============================================
// 1. EDIT PRODUCT PAGE
// ============================================

files['client/app/(admin)/dashboard/products/[id]/edit/page.tsx'] = `
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
      apiClient.get(\`/products/\${id}\`),
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

      await apiClient.put(\`/products/\${id}\`, formData, {
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
              <div key={\`ex-\${i}\`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-200">
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
              <div key={\`new-\${i}\`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-200">
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
`;

// ============================================
// 2. NEW PRODUCT PAGE WITH IMAGE UPLOAD + SEO
// ============================================

files['client/app/(admin)/dashboard/products/new/page.tsx'] = `
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/api-client';

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
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

  useEffect(() => {
    apiClient.get('/categories').then(({ data }) => setCategories(data.data));
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }
    setImages((prev) => [...prev, ...files]);
    setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
      images.forEach((img) => formData.append('images', img));

      await apiClient.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      router.push('/dashboard/products');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/products" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-500 text-sm">Create a new product listing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Images */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Product Images
            <span className="ml-2 text-sm font-normal text-gray-400">({images.length}/5)</span>
          </h2>
          <p className="text-xs text-gray-400 mb-4">First image will be the main product image. Max 5 images.</p>

          <div className="grid grid-cols-5 gap-3">
            {previewUrls.map((url, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-blue-200">
                <Image src={url} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Main</span>
                )}
              </div>
            ))}
            {images.length < 5 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition cursor-pointer flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-blue-500">
                <Upload className="w-6 h-6" />
                <span className="text-xs font-medium text-center">Add Photo</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
              </label>
            )}
          </div>
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
                placeholder="e.g., Premium Cotton T-Shirt"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Short Description</label>
              <input
                type="text"
                value={form.shortDescription}
                onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief product description"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Long Description</label>
              <textarea
                rows={5}
                value={form.longDescription}
                onChange={(e) => setForm({ ...form, longDescription: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Detailed product description"
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                value={form.basePrice}
                onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Compare Price (₹)</label>
              <input
                type="number"
                value={form.comparePrice}
                onChange={(e) => setForm({ ...form, comparePrice: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="PROD-001"
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
                placeholder="0"
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
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type keyword and press Enter"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {form.seo.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.seo.keywords.map((kw) => (
                    <span key={kw} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                      {kw}
                      <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-500">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
            {loading ? 'Creating...' : 'Create Product'}
          </button>
          <Link href="/dashboard/products" className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
`;

// ============================================
// 3. EDIT CATEGORY PAGE
// ============================================

files['client/app/(admin)/dashboard/categories/[id]/edit/page.tsx'] = `
'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import apiClient from '@/lib/api-client';

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    parent: '',
    isActive: true,
  });

  useEffect(() => {
    Promise.all([
      apiClient.get(\`/categories/\${id}\`),
      apiClient.get('/categories'),
    ]).then(([catRes, allRes]) => {
      const cat = catRes.data.data;
      setForm({
        name: cat.name || '',
        description: cat.description || '',
        parent: cat.parent?._id || cat.parent || '',
        isActive: cat.isActive ?? true,
      });
      if (cat.image) setImagePreview(cat.image);
      setAllCategories(allRes.data.data.filter((c: any) => c._id !== id));
    }).finally(() => setFetching(false));
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('parent', form.parent || '');
      formData.append('isActive', String(form.isActive));
      if (imageFile) formData.append('image', imageFile);

      await apiClient.put(\`/categories/\${id}\`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      router.push('/dashboard/categories');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="max-w-3xl mx-auto space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard/categories" className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Category</h1>
          <p className="text-gray-500 text-sm">Update category information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Category Image</h2>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-gray-200 flex items-center justify-center bg-gray-50">
              {imagePreview ? (
                <Image src={imagePreview} alt="Category" width={128} height={128} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">📁</span>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition font-semibold text-sm">
                <Upload className="w-4 h-4" />
                {imagePreview ? 'Change Image' : 'Upload Image'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(''); }}
                  className="mt-2 flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
                >
                  <X className="w-4 h-4" /> Remove Image
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Category Details</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Parent Category</label>
            <select
              value={form.parent}
              onChange={(e) => setForm({ ...form, parent: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None (Root Category)</option>
              {allCategories.filter((c) => !c.parent).map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-5 h-5 accent-blue-600"
            />
            <div>
              <p className="font-semibold text-gray-900">Active</p>
              <p className="text-sm text-gray-500">Category is visible to customers</p>
            </div>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <Link href="/dashboard/categories" className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
`;

// ============================================
// 4. ADMIN ORDERS PAGE - FULL DETAILS
// ============================================

files['client/app/(admin)/dashboard/orders/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Filter, Package, Truck, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import apiClient from '@/lib/api-client';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING:    { label: 'Pending',    color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
  CONFIRMED:  { label: 'Confirmed',  color: 'text-blue-700',   bg: 'bg-blue-100',   icon: Package },
  PROCESSING: { label: 'Processing', color: 'text-purple-700', bg: 'bg-purple-100', icon: Package },
  SHIPPED:    { label: 'Shipped',    color: 'text-indigo-700', bg: 'bg-indigo-100', icon: Truck },
  DELIVERED:  { label: 'Delivered',  color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  CANCELLED:  { label: 'Cancelled',  color: 'text-red-700',    bg: 'bg-red-100',    icon: XCircle },
};

const ALL_STATUSES = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/orders')
      .then(({ data }) => setOrders(data.data.orders))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    await apiClient.put(\`/orders/\${orderId}/status\`, { status: newStatus });
    setOrders(orders.map((o) => o._id === orderId ? { ...o, status: newStatus } : o));
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm">{orders.length} total orders</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 flex-wrap">
        {ALL_STATUSES.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={\`px-4 py-2 rounded-xl text-sm font-semibold transition \${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }\`}
          >
            {status}
            <span className="ml-2 text-xs opacity-70">
              {status === 'ALL' ? orders.length : orders.filter(o => o.status === status).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by order number, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No orders found</p>
          </div>
        ) : (
          filtered.map((order) => {
            const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = statusInfo.icon;
            const isExpanded = expandedOrder === order._id;

            return (
              <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Order Header */}
                <div className="p-5 border-b border-gray-50">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-mono font-bold text-gray-900 text-sm">#{order.orderNumber}</p>
                          <span className={\`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full \${statusInfo.bg} \${statusInfo.color}\`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Customer */}
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {order.customer?.firstName?.[0]}{order.customer?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{order.customer?.email}</p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">₹{order.total?.toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{order.items?.length} item{order.items?.length !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Status Changer */}
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {Object.keys(STATUS_CONFIG).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-xl transition font-semibold"
                    >
                      <Eye className="w-4 h-4" />
                      {isExpanded ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>

                {/* Products Preview (always visible) */}
                <div className="p-5">
                  <div className="flex gap-3 flex-wrap">
                    {order.items?.slice(0, 4).map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 flex-1 min-w-[200px]">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                          {item.product?.images?.[0]?.url ? (
                            <Image
                              src={item.product.images[0].url}
                              alt={item.title}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{item.title}</p>
                          {item.variant && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {Object.entries(item.variant).map(([k, v]) => \`\${k}: \${v}\`).join(', ')}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium">
                              Qty: {item.quantity}
                            </span>
                            <span className="text-sm font-bold text-gray-900">
                              ₹{(item.price * item.quantity)?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 4 && (
                      <div className="flex items-center justify-center bg-gray-50 rounded-xl p-3 min-w-[100px]">
                        <span className="text-gray-500 text-sm font-medium">+{order.items.length - 4} more</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-5">
                    {/* All Items */}
                    <div>
                      <h4 className="font-bold text-gray-900 mb-3">All Items</h4>
                      <div className="space-y-2">
                        {order.items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                              {item.product?.images?.[0]?.url ? (
                                <Image
                                  src={item.product.images[0].url}
                                  alt={item.title}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{item.title}</p>
                              {item.variant && Object.keys(item.variant).length > 0 && (
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  {Object.entries(item.variant).map(([k, v]) => (
                                    <span key={k} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium capitalize">
                                      {k}: {v as string}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-sm text-gray-500">SKU: {item.product?.sku || 'N/A'}</span>
                                <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                                <span className="text-sm font-semibold text-gray-900">
                                  ₹{item.price?.toLocaleString()} each
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                ₹{(item.price * item.quantity)?.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Shipping Address */}
                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span>📍</span> Shipping Address
                        </h4>
                        {order.shippingAddress ? (
                          <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-semibold text-gray-900">{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.addressLine1}</p>
                            {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                            <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                            <p>{order.shippingAddress.postalCode}, {order.shippingAddress.country}</p>
                            <p className="font-medium text-gray-700 mt-2">📞 {order.shippingAddress.phone}</p>
                          </div>
                        ) : <p className="text-gray-400 text-sm">No address</p>}
                      </div>

                      {/* Payment Info */}
                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span>💳</span> Payment
                        </h4>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Method</span>
                            <span className="font-semibold text-gray-900">{order.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status</span>
                            <span className={\`font-semibold \${order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-yellow-600'}\`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                          {order.razorpayOrderId && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Transaction</span>
                              <span className="font-mono text-xs text-gray-700">{order.razorpayOrderId.slice(-12)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Summary */}
                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <span>🧾</span> Summary
                        </h4>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-medium">₹{order.subtotal?.toLocaleString()}</span>
                          </div>
                          {order.discount > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Discount</span>
                              <span className="font-medium text-green-600">-₹{order.discount?.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-gray-500">Shipping</span>
                            <span className="font-medium">
                              {order.shippingCost === 0 ? 'FREE' : \`₹\${order.shippingCost}\`}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tax</span>
                            <span className="font-medium">₹{order.tax?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-100">
                            <span className="font-bold text-gray-900">Total</span>
                            <span className="font-bold text-blue-600 text-lg">₹{order.total?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
`;

// ============================================
// 5. USERS PAGE WITH VIEW USER MODAL
// ============================================

files['client/app/(admin)/dashboard/users/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import { Search, X, MapPin, ShoppingBag, Mail, Phone, Calendar } from 'lucide-react';
import apiClient from '@/lib/api-client';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-700',
  STAFF: 'bg-blue-100 text-blue-700',
  CUSTOMER: 'bg-green-100 text-green-700',
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    apiClient.get('/users')
      .then(({ data }) => setUsers(data.data.users))
      .finally(() => setLoading(false));
  }, []);

  const handleViewUser = async (user: any) => {
    setSelectedUser(user);
    setLoadingOrders(true);
    try {
      const res = await apiClient.get(\`/orders?customer=\${user._id}\`);
      setUserOrders(res.data.data.orders || []);
    } catch {
      setUserOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleRoleUpdate = async (id: string, newRole: string) => {
    await apiClient.put(\`/users/\${id}/role\`, { role: newRole });
    setUsers(users.map((u) => u._id === id ? { ...u, role: newRole } : u));
    if (selectedUser?._id === id) setSelectedUser({ ...selectedUser, role: newRole });
  };

  const filtered = users.filter((u) =>
    \`\${u.firstName} \${u.lastName} \${u.email}\`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Users ({users.length})</h1>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['User', 'Email', 'Phone', 'Role', 'Status', 'Joined', 'Action'].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-6 py-3 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-400">#{user._id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                        className={\`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer \${ROLE_COLORS[user.role]}\`}
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="STAFF">Staff</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={\`text-xs font-semibold px-2.5 py-1 rounded-full \${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition font-semibold"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">User Profile</h2>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
                  {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={\`text-xs font-semibold px-3 py-1 rounded-full \${ROLE_COLORS[selectedUser.role]}\`}>
                      {selectedUser.role}
                    </span>
                    <span className={\`text-xs font-semibold px-3 py-1 rounded-full \${selectedUser.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                      {selectedUser.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-semibold text-gray-900 text-sm truncate">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-semibold text-gray-900 text-sm">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="font-semibold text-gray-900 text-sm">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <ShoppingBag className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Total Orders</p>
                    <p className="font-semibold text-gray-900 text-sm">{userOrders.length} orders</p>
                  </div>
                </div>
              </div>

              {/* Role Change */}
              <div className="p-4 border border-gray-200 rounded-xl">
                <p className="text-sm font-semibold text-gray-700 mb-2">Change Role</p>
                <div className="flex gap-2">
                  {['CUSTOMER', 'STAFF', 'ADMIN'].map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleUpdate(selectedUser._id, role)}
                      className={\`flex-1 py-2 text-sm font-semibold rounded-xl transition \${
                        selectedUser.role === role
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      }\`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Addresses */}
              {selectedUser.addresses?.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" /> Saved Addresses
                  </h4>
                  <div className="space-y-3">
                    {selectedUser.addresses.map((addr: any, i: number) => (
                      <div key={i} className="p-4 border border-gray-100 rounded-xl text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-gray-900">{addr.fullName}</p>
                          {addr.isDefault && (
                            <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded font-semibold">Default</span>
                          )}
                        </div>
                        <p className="text-gray-600">{addr.addressLine1}, {addr.city}, {addr.state} - {addr.postalCode}</p>
                        <p className="text-gray-500 mt-1">📞 {addr.phone}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              <div>
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-500" /> Recent Orders
                </h4>
                {loadingOrders ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
                  </div>
                ) : userOrders.length === 0 ? (
                  <p className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl">No orders yet</p>
                ) : (
                  <div className="space-y-2">
                    {userOrders.slice(0, 5).map((order: any) => (
                      <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-mono font-bold text-gray-900 text-sm">#{order.orderNumber}</p>
                          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">₹{order.total?.toLocaleString()}</p>
                          <span className={\`text-xs font-semibold px-2 py-0.5 rounded-full \${
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }\`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

// ============================================
// 6. COUPONS PAGE WITH EDIT MODAL
// ============================================

files['client/app/(admin)/dashboard/coupons/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import { Plus, Trash2, Tag, Copy, X, Save } from 'lucide-react';
import apiClient from '@/lib/api-client';

const EMPTY_FORM = {
  code: '',
  description: '',
  discountType: 'PERCENTAGE',
  discountValue: '',
  minPurchase: '0',
  maxDiscount: '',
  usageLimit: '',
  expiresAt: '',
  isActive: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const loadCoupons = () => {
    apiClient.get('/coupons')
      .then(({ data }) => setCoupons(data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCoupons(); }, []);

  const openNew = () => {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (coupon: any) => {
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'PERCENTAGE',
      discountValue: coupon.discountValue?.toString() || '',
      minPurchase: coupon.minPurchase?.toString() || '0',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
      isActive: coupon.isActive ?? true,
    });
    setEditingId(coupon._id);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        minPurchase: Number(form.minPurchase),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        expiresAt: form.expiresAt || undefined,
      };
      if (editingId) {
        await apiClient.put(\`/coupons/\${editingId}\`, payload);
      } else {
        await apiClient.post('/coupons', payload);
      }
      setShowModal(false);
      loadCoupons();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await apiClient.delete(\`/coupons/\${id}\`);
    loadCoupons();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => <div key={i} className="h-52 bg-gray-200 rounded-2xl animate-pulse" />)
        ) : coupons.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No coupons yet</p>
            <button onClick={openNew} className="mt-4 text-blue-600 font-semibold text-sm hover:underline">
              Create your first coupon
            </button>
          </div>
        ) : (
          coupons.map((coupon) => (
            <div key={coupon._id} className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-blue-200 p-6 hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-blue-600" />
                  <button
                    onClick={() => copyCode(coupon.code)}
                    className="font-mono font-bold text-xl text-gray-900 hover:text-blue-600 transition flex items-center gap-1"
                    title="Copy code"
                  >
                    {coupon.code}
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <span className={\`text-xs font-semibold px-2 py-1 rounded-full \${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}\`}>
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {coupon.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{coupon.description}</p>
              )}

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span className="font-bold text-blue-600 text-base">
                    {coupon.discountType === 'PERCENTAGE'
                      ? \`\${coupon.discountValue}% OFF\`
                      : \`₹\${coupon.discountValue} OFF\`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Min Purchase</span>
                  <span className="font-semibold">₹{coupon.minPurchase || 0}</span>
                </div>
                {coupon.maxDiscount && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Max Discount</span>
                    <span className="font-semibold">₹{coupon.maxDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Used / Limit</span>
                  <span className="font-semibold">{coupon.usageCount || 0} / {coupon.usageLimit || '∞'}</span>
                </div>
                {coupon.expiresAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Expires</span>
                    <span className={\`font-semibold \${new Date(coupon.expiresAt) < new Date() ? 'text-red-500' : 'text-gray-900'}\`}>
                      {new Date(coupon.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => openEdit(coupon)}
                  className="flex-1 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(coupon._id)}
                  className="flex-1 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition font-semibold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Coupon' : 'New Coupon'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                  placeholder="SAVE20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 20% off on all orders"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Discount Type</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Discount Value {form.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                  </label>
                  <input
                    type="number"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Min Purchase (₹)</label>
                  <input
                    type="number"
                    value={form.minPurchase}
                    onChange={(e) => setForm({ ...form, minPurchase: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Max Discount (₹)</label>
                  <input
                    type="number"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Unlimited"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Expires At</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-4 border border-gray-200 rounded-xl hover:border-blue-200 transition">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-5 h-5 accent-blue-600"
                />
                <div>
                  <p className="font-semibold text-gray-900">Active</p>
                  <p className="text-sm text-gray-500">Coupon can be used by customers</p>
                </div>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Coupon'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

// ============================================
// 7. HOMEPAGE BUILDER - DRAG + SETTINGS
// ============================================

files['client/app/(admin)/dashboard/homepage/page.tsx'] = `
'use client';
import { useEffect, useState, useRef } from 'react';
import { GripVertical, Eye, EyeOff, Settings, Plus, X, Save, Trash2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

const SECTION_TYPES = [
  { type: 'BANNER', icon: '🎨', label: 'Hero Banner' },
  { type: 'FEATURED_PRODUCTS', icon: '⭐', label: 'Featured Products' },
  { type: 'LATEST_PRODUCTS', icon: '🆕', label: 'Latest Products' },
  { type: 'CATEGORIES', icon: '📂', label: 'Categories Grid' },
  { type: 'TESTIMONIALS', icon: '💬', label: 'Testimonials' },
  { type: 'GALLERY', icon: '🖼️', label: 'Image Gallery' },
  { type: 'VIDEO', icon: '🎥', label: 'Video Section' },
  { type: 'OFFER_BANNER', icon: '🏷️', label: 'Offer Banner' },
  { type: 'BRANDS', icon: '🏢', label: 'Brands' },
];

const DEFAULT_SETTINGS: Record<string, any> = {
  BANNER: { title: '', subtitle: '', buttonText: 'Shop Now', buttonLink: '/products', backgroundImage: '' },
  FEATURED_PRODUCTS: { title: 'Featured Products', limit: 8 },
  LATEST_PRODUCTS: { title: 'New Arrivals', limit: 8 },
  CATEGORIES: { title: 'Shop by Category', limit: 6 },
  TESTIMONIALS: { title: 'What our customers say' },
  GALLERY: { title: 'Gallery', images: [] },
  VIDEO: { title: '', videoUrl: '' },
  OFFER_BANNER: { title: '', subtitle: '', buttonText: '', buttonLink: '', backgroundColor: '#1d4ed8' },
  BRANDS: { title: 'Our Brands' },
};

export default function HomepageBuilderPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [settingsSection, setSettingsSection] = useState<any>(null);
  const [settingsIndex, setSettingsIndex] = useState<number>(-1);
  const dragIndex = useRef<number | null>(null);
  const dragOverIndex = useRef<number | null>(null);

  useEffect(() => {
    apiClient.get('/homepage')
      .then(({ data }) => setSections(data.data?.sections || []))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/homepage', { sections });
      alert('Homepage saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (index: number) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], enabled: !updated[index].enabled };
    setSections(updated);
  };

  const handleRemove = (index: number) => {
    if (!confirm('Remove this section?')) return;
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleAddSection = (type: string) => {
    const newSection = {
      type,
      enabled: true,
      order: sections.length + 1,
      settings: { ...DEFAULT_SETTINGS[type] },
    };
    setSections([...sections, newSection]);
    setShowAddModal(false);
  };

  const openSettings = (section: any, index: number) => {
    setSettingsSection({ ...section, settings: { ...section.settings } });
    setSettingsIndex(index);
  };

  const saveSettings = () => {
    const updated = [...sections];
    updated[settingsIndex] = settingsSection;
    setSections(updated);
    setSettingsSection(null);
    setSettingsIndex(-1);
  };

  // Drag handlers
  const onDragStart = (index: number) => { dragIndex.current = index; };
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverIndex.current = index;
  };
  const onDrop = () => {
    if (dragIndex.current === null || dragOverIndex.current === null) return;
    if (dragIndex.current === dragOverIndex.current) return;
    const updated = [...sections];
    const [moved] = updated.splice(dragIndex.current, 1);
    updated.splice(dragOverIndex.current, 0, moved);
    const reordered = updated.map((s, i) => ({ ...s, order: i + 1 }));
    setSections(reordered);
    dragIndex.current = null;
    dragOverIndex.current = null;
  };

  if (loading) return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Builder</h1>
          <p className="text-gray-500 text-sm">Drag to reorder • Toggle visibility • Click ⚙️ to configure</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-blue-600 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-50 transition"
          >
            <Plus className="w-4 h-4" /> Add Section
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Sections List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        {sections.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium mb-2">No sections yet</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-blue-600 font-semibold hover:underline"
            >
              + Add your first section
            </button>
          </div>
        ) : (
          sections.map((section, index) => {
            const sectionMeta = SECTION_TYPES.find((s) => s.type === section.type);
            return (
              <div
                key={index}
                draggable
                onDragStart={() => onDragStart(index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDrop={onDrop}
                className={\`flex items-center gap-4 p-4 border rounded-xl transition cursor-move select-none \${
                  section.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/50'
                }\`}
              >
                <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />

                <div className="text-3xl flex-shrink-0">{sectionMeta?.icon || '📄'}</div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{sectionMeta?.label || section.type}</p>
                  <p className="text-xs text-gray-400">
                    Order: {index + 1}
                    {section.settings?.title && \` • "\${section.settings.title}"\`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={\`text-xs font-semibold px-2.5 py-1 rounded-full \${
                    section.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }\`}>
                    {section.enabled ? 'Visible' : 'Hidden'}
                  </span>

                  <button
                    onClick={() => handleToggle(index)}
                    className={\`p-2 rounded-lg transition \${
                      section.enabled ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }\`}
                    title={section.enabled ? 'Hide' : 'Show'}
                  >
                    {section.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => openSettings(section, index)}
                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                    title="Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleRemove(index)}
                    className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <p className="text-sm text-blue-700">
          💡 <strong>Tip:</strong> Drag sections to reorder. Click the eye icon to toggle visibility. Click ⚙️ to edit section content.
        </p>
      </div>

      {/* Add Section Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Add Section</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              {SECTION_TYPES.map((s) => (
                <button
                  key={s.type}
                  onClick={() => handleAddSection(s.type)}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition text-left"
                >
                  <span className="text-2xl">{s.icon}</span>
                  <span className="font-semibold text-gray-900 text-sm">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section Settings Modal */}
      {settingsSection && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {SECTION_TYPES.find(s => s.type === settingsSection.type)?.label} Settings
              </h2>
              <button onClick={() => setSettingsSection(null)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Common Settings */}
              {['title', 'subtitle'].map((field) =>
                field in (DEFAULT_SETTINGS[settingsSection.type] || {}) ? (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1 capitalize">{field}</label>
                    <input
                      type="text"
                      value={settingsSection.settings?.[field] || ''}
                      onChange={(e) => setSettingsSection({
                        ...settingsSection,
                        settings: { ...settingsSection.settings, [field]: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={field === 'title' ? 'Section title' : 'Subtitle'}
                    />
                  </div>
                ) : null
              )}

              {settingsSection.settings?.hasOwnProperty('limit') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Number of Items</label>
                  <input
                    type="number"
                    value={settingsSection.settings?.limit || 8}
                    onChange={(e) => setSettingsSection({
                      ...settingsSection,
                      settings: { ...settingsSection.settings, limit: Number(e.target.value) }
                    })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={1}
                    max={20}
                  />
                </div>
              )}

              {settingsSection.settings?.hasOwnProperty('buttonText') && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={settingsSection.settings?.buttonText || ''}
                      onChange={(e) => setSettingsSection({
                        ...settingsSection,
                        settings: { ...settingsSection.settings, buttonText: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Shop Now"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Button Link</label>
                    <input
                      type="text"
                      value={settingsSection.settings?.buttonLink || ''}
                      onChange={(e) => setSettingsSection({
                        ...settingsSection,
                        settings: { ...settingsSection.settings, buttonLink: e.target.value }
                      })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="/products"
                    />
                  </div>
                </>
              )}

              {settingsSection.settings?.hasOwnProperty('backgroundImage') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Background Image URL</label>
                  <input
                    type="text"
                    value={settingsSection.settings?.backgroundImage || ''}
                    onChange={(e) => setSettingsSection({
                      ...settingsSection,
                      settings: { ...settingsSection.settings, backgroundImage: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://..."
                  />
                </div>
              )}

              {settingsSection.settings?.hasOwnProperty('videoUrl') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Video URL (YouTube/Vimeo)</label>
                  <input
                    type="text"
                    value={settingsSection.settings?.videoUrl || ''}
                    onChange={(e) => setSettingsSection({
                      ...settingsSection,
                      settings: { ...settingsSection.settings, videoUrl: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://youtube.com/..."
                  />
                </div>
              )}

              {settingsSection.settings?.hasOwnProperty('backgroundColor') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Background Color</label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      value={settingsSection.settings?.backgroundColor || '#1d4ed8'}
                      onChange={(e) => setSettingsSection({
                        ...settingsSection,
                        settings: { ...settingsSection.settings, backgroundColor: e.target.value }
                      })}
                      className="w-14 h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                    />
                    <input
                      type="text"
                      value={settingsSection.settings?.backgroundColor || '#1d4ed8'}
                      onChange={(e) => setSettingsSection({
                        ...settingsSection,
                        settings: { ...settingsSection.settings, backgroundColor: e.target.value }
                      })}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveSettings}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition"
                >
                  <Save className="w-4 h-4" /> Save Settings
                </button>
                <button
                  onClick={() => setSettingsSection(null)}
                  className="px-6 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

// ============================================
// 8. THEME CUSTOMIZER - APPLY TO STOREFRONT
// ============================================

files['client/app/(admin)/dashboard/theme/page.tsx'] = `
'use client';
import { useEffect, useState } from 'react';
import { Palette, Type, Layout, Save, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api-client';

const DEFAULT_THEME = {
  colors: {
    primary: '#2563eb',
    secondary: '#7c3aed',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#111827',
    muted: '#6b7280',
  },
  fonts: {
    primary: 'Inter',
    secondary: 'Inter',
  },
  layout: {
    headerStyle: 'MODERN',
    footerStyle: 'DETAILED',
    borderRadius: 'rounded',
  },
};

export default function ThemeCustomizerPage() {
  const [theme, setTheme] = useState<any>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiClient.get('/theme')
      .then(({ data }) => {
        if (data.data) setTheme(data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateColor = (key: string, value: string) => {
    setTheme({ ...theme, colors: { ...theme.colors, [key]: value } });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/theme', theme);
      // Apply CSS variables to document for live preview
      applyTheme(theme);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const applyTheme = (t: any) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', t.colors?.primary);
    root.style.setProperty('--color-secondary', t.colors?.secondary);
    root.style.setProperty('--color-accent', t.colors?.accent);
    root.style.setProperty('--color-background', t.colors?.background);
    root.style.setProperty('--color-text', t.colors?.text);
    root.style.setProperty('--color-muted', t.colors?.muted);
    // Store in localStorage for storefront to pick up
    localStorage.setItem('store-theme', JSON.stringify(t));
  };

  const handleReset = () => {
    if (!confirm('Reset to default theme?')) return;
    setTheme(DEFAULT_THEME);
  };

  const colorFields = [
    { key: 'primary', label: 'Primary Color', desc: 'Buttons, links, highlights' },
    { key: 'secondary', label: 'Secondary Color', desc: 'Accents, badges' },
    { key: 'accent', label: 'Accent Color', desc: 'Sale badges, notifications' },
    { key: 'background', label: 'Background', desc: 'Page background' },
    { key: 'text', label: 'Text Color', desc: 'Main text color' },
    { key: 'muted', label: 'Muted Text', desc: 'Descriptions, hints' },
  ];

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Theme Customizer</h1>
          <p className="text-gray-500 text-sm">Changes reflect instantly on your storefront</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={\`flex items-center gap-2 px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 \${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}\`}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Theme'}
          </button>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-700 font-medium text-sm">
          ✅ Theme saved and applied to storefront successfully!
        </div>
      )}

      {/* Colors */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-blue-50 rounded-xl">
            <Palette className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Colors</h2>
            <p className="text-xs text-gray-400">Customize your brand colors</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {colorFields.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition">
              <div className="relative">
                <div
                  className="w-14 h-14 rounded-xl border-2 border-white shadow-md"
                  style={{ backgroundColor: theme.colors?.[key] }}
                />
                <input
                  type="color"
                  value={theme.colors?.[key] || '#000000'}
                  onChange={(e) => updateColor(key, e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
                <input
                  type="text"
                  value={theme.colors?.[key] || ''}
                  onChange={(e) => updateColor(key, e.target.value)}
                  className="mt-1.5 w-full px-3 py-1.5 border border-gray-200 rounded-lg font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fonts */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-purple-50 rounded-xl">
            <Type className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Typography</h2>
            <p className="text-xs text-gray-400">Choose your store fonts</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {[
            { key: 'primary', label: 'Heading Font' },
            { key: 'secondary', label: 'Body Font' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
              <select
                value={theme.fonts?.[key] || 'Inter'}
                onChange={(e) => setTheme({ ...theme, fonts: { ...theme.fonts, [key]: e.target.value } })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: theme.fonts?.[key] }}
              >
                {['Inter', 'Roboto', 'Poppins', 'Montserrat', 'Playfair Display', 'Lato', 'Nunito', 'Open Sans'].map((f) => (
                  <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                ))}
              </select>
              <p className="mt-2 text-sm text-gray-500" style={{ fontFamily: theme.fonts?.[key] }}>
                The quick brown fox jumps over the lazy dog
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-green-50 rounded-xl">
            <Layout className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Layout</h2>
            <p className="text-xs text-gray-400">Configure layout preferences</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Header Style</label>
            <div className="space-y-2">
              {['CLASSIC', 'MODERN', 'MINIMAL'].map((style) => (
                <label key={style} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition">
                  <input
                    type="radio"
                    name="headerStyle"
                    value={style}
                    checked={theme.layout?.headerStyle === style}
                    onChange={() => setTheme({ ...theme, layout: { ...theme.layout, headerStyle: style } })}
                    className="accent-blue-600"
                  />
                  <span className="font-medium text-gray-900 text-sm">{style}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Footer Style</label>
            <div className="space-y-2">
              {['SIMPLE', 'DETAILED'].map((style) => (
                <label key={style} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition">
                  <input
                    type="radio"
                    name="footerStyle"
                    value={style}
                    checked={theme.layout?.footerStyle === style}
                    onChange={() => setTheme({ ...theme, layout: { ...theme.layout, footerStyle: style } })}
                    className="accent-blue-600"
                  />
                  <span className="font-medium text-gray-900 text-sm">{style}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Border Radius</label>
            <div className="space-y-2">
              {[
                { value: 'none', label: 'Square' },
                { value: 'rounded', label: 'Rounded' },
                { value: 'rounded-2xl', label: 'Extra Rounded' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition">
                  <input
                    type="radio"
                    name="borderRadius"
                    value={value}
                    checked={theme.layout?.borderRadius === value}
                    onChange={() => setTheme({ ...theme, layout: { ...theme.layout, borderRadius: value } })}
                    className="accent-blue-600"
                  />
                  <span className="font-medium text-gray-900 text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Live Preview</h2>
        <div
          className="rounded-xl p-8 border-2 border-dashed border-gray-200"
          style={{ backgroundColor: theme.colors?.background, fontFamily: theme.fonts?.primary }}
        >
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <h2 className="text-2xl font-bold" style={{ color: theme.colors?.primary }}>ShopMERN</h2>
            <nav className="flex gap-6 text-sm font-medium" style={{ color: theme.colors?.text }}>
              <span>Home</span>
              <span>Products</span>
              <span>About</span>
            </nav>
          </div>

          <div className="text-center py-8">
            <h1 className="text-4xl font-bold mb-3" style={{ color: theme.colors?.text, fontFamily: theme.fonts?.primary }}>
              Welcome to Our Store
            </h1>
            <p className="text-lg mb-6" style={{ color: theme.colors?.muted }}>
              Discover amazing products at great prices
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="px-8 py-3 text-white font-semibold \${theme.layout?.borderRadius}"
                style={{ backgroundColor: theme.colors?.primary, borderRadius: theme.layout?.borderRadius === 'none' ? '0' : theme.layout?.borderRadius === 'rounded-2xl' ? '16px' : '8px' }}
              >
                Shop Now
              </button>
              <button
                className="px-8 py-3 font-semibold border-2"
                style={{
                  color: theme.colors?.secondary,
                  borderColor: theme.colors?.secondary,
                  borderRadius: theme.layout?.borderRadius === 'none' ? '0' : theme.layout?.borderRadius === 'rounded-2xl' ? '16px' : '8px'
                }}
              >
                Learn More
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6">
            {['Product 1', 'Product 2', 'Product 3'].map((p, i) => (
              <div
                key={i}
                className="border border-gray-200 p-4"
                style={{ borderRadius: theme.layout?.borderRadius === 'none' ? '0' : theme.layout?.borderRadius === 'rounded-2xl' ? '16px' : '8px' }}
              >
                <div className="h-24 mb-3 rounded" style={{ backgroundColor: theme.colors?.primary + '20' }} />
                <p className="font-semibold" style={{ color: theme.colors?.text }}>{p}</p>
                <p className="text-sm" style={{ color: theme.colors?.muted }}>₹999</p>
                <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: theme.colors?.accent + '30', color: theme.colors?.accent }}>SALE</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
`;

// ============================================
// 9. THEME PROVIDER FOR STOREFRONT
// ============================================

files['client/components/ThemeProvider.tsx'] = `
'use client';
import { useEffect } from 'react';
import apiClient from '@/lib/api-client';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const applyTheme = (theme: any) => {
      if (!theme?.colors) return;
      const root = document.documentElement;
      root.style.setProperty('--color-primary', theme.colors.primary || '#2563eb');
      root.style.setProperty('--color-secondary', theme.colors.secondary || '#7c3aed');
      root.style.setProperty('--color-accent', theme.colors.accent || '#f59e0b');
      root.style.setProperty('--color-background', theme.colors.background || '#ffffff');
      root.style.setProperty('--color-text', theme.colors.text || '#111827');
      root.style.setProperty('--color-muted', theme.colors.muted || '#6b7280');
      if (theme.fonts?.primary) {
        root.style.setProperty('--font-primary', theme.fonts.primary);
      }
    };

    // First apply from localStorage (instant)
    const cached = localStorage.getItem('store-theme');
    if (cached) {
      try { applyTheme(JSON.parse(cached)); } catch {}
    }

    // Then fetch from API (fresh)
    apiClient.get('/theme')
      .then(({ data }) => {
        if (data.data) {
          applyTheme(data.data);
          localStorage.setItem('store-theme', JSON.stringify(data.data));
        }
      })
      .catch(() => {});
  }, []);

  return <>{children}</>;
}
`;

files['client/app/(storefront)/layout.tsx'] = `
import type { Metadata } from 'next';
import Header from '@/components/storefront/Header';
import Footer from '@/components/storefront/Footer';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'ShopMERN - Your Online Store',
  description: 'Shop the best products at great prices',
};

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}
`;

// ============================================
// WRITE ALL FILES
// ============================================

let created = 0;
let errors = 0;

console.log('\n🚀 Fixing all issues...\n');

for (const [filePath, content] of Object.entries(files)) {
  try {
    const fullPath = path.resolve(filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(fullPath, content.trimStart(), 'utf8');
    console.log('✅  ' + filePath);
    created++;
  } catch (err) {
    console.error('❌  ' + filePath + ' — ' + err);
    errors++;
  }
}

console.log('\n' + '═'.repeat(60));
console.log('📊  SUMMARY');
console.log('═'.repeat(60));
console.log('✅  Fixed/Created : ' + created + ' files');
console.log('❌  Errors        : ' + errors + ' files');
console.log('═'.repeat(60));
console.log('\n🎉  All issues fixed!\n');
console.log('What was fixed:');
console.log('  ✅ Edit Product  - /dashboard/products/[id]/edit');
console.log('  ✅ New Product   - Image upload (5 max) + SEO keywords');
console.log('  ✅ Edit Category - /dashboard/categories/[id]/edit');
console.log('  ✅ Orders Page   - Full details with images & variants');
console.log('  ✅ Users Page    - View user modal with orders & addresses');
console.log('  ✅ Coupons Page  - Edit coupon modal fully working');
console.log('  ✅ Homepage Builder - Drag & drop + Add sections + Settings modal');
console.log('  ✅ Theme Customizer - Applied to storefront via CSS vars + localStorage\n');