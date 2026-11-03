import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, AlertCircle, Layout, Phone, Mail, MapPin } from 'lucide-react';
import { WebsiteSettings } from '../../types';
import { api } from '../../services/api';

interface AdminSettingsProps {
  settings: WebsiteSettings | null;
  onRefresh: () => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({ settings, onRefresh }) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key] === 'false' ? 'true' : 'false'
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await api.updateSettings(formData);
      setSuccessMsg('Website configuration updated successfully.');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-stone-900">
          Website Settings & Configuration
        </h2>
        <p className="text-xs text-stone-500">
          Customize welcome headlines, mission statement, contact details, and homepage section displays.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Brand & Welcome Hero Section */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#064E3B] flex items-center gap-2">
            <Layout className="w-4 h-4" />
            <span>Brand Identity & Welcome Hero</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Website Name
              </label>
              <input
                type="text"
                value={formData.website_name || ''}
                onChange={(e) => handleChange('website_name', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Welcome Hero Title
              </label>
              <input
                type="text"
                value={formData.welcome_title || ''}
                onChange={(e) => handleChange('welcome_title', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-stone-700 mb-1">
              Welcome Message (Hero Paragraph)
            </label>
            <textarea
              rows={3}
              value={formData.welcome_message || ''}
              onChange={(e) => handleChange('welcome_message', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
            />
          </div>
        </div>

        {/* Homepage Sections Toggles */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#064E3B] flex items-center gap-2">
            <Layout className="w-4 h-4" />
            <span>Homepage Section Visibility</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {[
              { key: 'show_stats_dashboard', label: 'Website Statistics Dashboard' },
              { key: 'show_featured_scholars', label: 'Featured Scholars Section' },
              { key: 'show_latest_speeches', label: 'Latest Speeches Section' },
              { key: 'show_reels_section', label: 'Islamic Reels Carousel' },
              { key: 'show_featured_books', label: 'Featured Books Shelves' },
              { key: 'show_articles_section', label: 'Latest Articles Feed' },
              { key: 'show_aqwaal_section', label: 'Aqwaal & Nasihat Section' },
              { key: 'show_shayariyan_section', label: 'Shayariyan & Sharah Section' },
              { key: 'show_hero_cta', label: 'Hero Quick-Action Buttons' },
            ].map((sec) => {
              const isEnabled = formData[sec.key] !== 'false';
              return (
                <div
                  key={sec.key}
                  onClick={() => handleToggle(sec.key)}
                  className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                    isEnabled
                      ? 'bg-emerald-50/60 border-emerald-200'
                      : 'bg-stone-50 border-stone-200 text-stone-400'
                  }`}
                >
                  <span className={`font-semibold ${isEnabled ? 'text-stone-800' : 'text-stone-400'}`}>
                    {sec.label}
                  </span>
                  <span className={`w-3.5 h-3.5 rounded-full ${isEnabled ? 'bg-[#064E3B]' : 'bg-stone-300'}`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer & Contact Information */}
        <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#064E3B] flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>Footer & Contact Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contact_email || ''}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.contact_phone || ''}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-stone-700 mb-1">
              Contact Address / Location
            </label>
            <input
              type="text"
              value={formData.contact_address || ''}
              onChange={(e) => handleChange('contact_address', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
            />
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-stone-700 mb-1">
              About Text (Footer Mission)
            </label>
            <textarea
              rows={2}
              value={formData.about_text || ''}
              onChange={(e) => handleChange('about_text', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
            />
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-stone-700 mb-1">
              Footer Tagline Quote
            </label>
            <input
              type="text"
              value={formData.footer_tagline || ''}
              onChange={(e) => handleChange('footer_tagline', e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#064E3B]"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 font-bold text-white bg-[#064E3B] hover:bg-[#075c46] rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 text-xs"
          >
            <Save className="w-4 h-4 text-[#D4AF37]" />
            <span>{isSaving ? 'Updating Settings...' : 'Save Website Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
