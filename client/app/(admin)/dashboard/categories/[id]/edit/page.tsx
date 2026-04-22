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
      apiClient.get(`/categories/${id}`),
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

      await apiClient.put(`/categories/${id}`, formData, {
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
