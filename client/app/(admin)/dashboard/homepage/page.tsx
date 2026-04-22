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
                className={`flex items-center gap-4 p-4 border rounded-xl transition cursor-move select-none ${
                  section.enabled ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200 bg-gray-50/50'
                }`}
              >
                <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />

                <div className="text-3xl flex-shrink-0">{sectionMeta?.icon || '📄'}</div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900">{sectionMeta?.label || section.type}</p>
                  <p className="text-xs text-gray-400">
                    Order: {index + 1}
                    {section.settings?.title && ` • "${section.settings.title}"`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    section.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {section.enabled ? 'Visible' : 'Hidden'}
                  </span>

                  <button
                    onClick={() => handleToggle(index)}
                    className={`p-2 rounded-lg transition ${
                      section.enabled ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
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
