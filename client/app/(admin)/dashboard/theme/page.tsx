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
            className={`flex items-center gap-2 px-6 py-2.5 text-white text-sm font-semibold rounded-xl transition disabled:opacity-60 ${saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
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
                className="px-8 py-3 text-white font-semibold ${theme.layout?.borderRadius}"
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
