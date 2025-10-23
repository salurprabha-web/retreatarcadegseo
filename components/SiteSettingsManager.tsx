import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../types';
import { supabase } from '../services/supabaseClient';
import Card from './common/Card';
import Button from './common/Button';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Loader from './common/Loader';
import { generateBusinessSchema } from '../services/geminiService';

interface SiteSettingsManagerProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const SiteSettingsManager: React.FC<SiteSettingsManagerProps> = ({ showToast }) => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [schema, setSchema] = useState<string>('');
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
      const fetchSettings = async () => {
          setLoading(true);
          const { data, error } = await supabase.from('site_settings').select('*').limit(1).single<SiteSettings>();
          if (error) {
              showToast("Failed to load site settings.", 'error');
              console.error(error);
          } else {
              setSettings(data);
          }
          setLoading(false);
      };
      fetchSettings();
  }, [showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!settings) return;
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setSettings(prev => ({
        ...prev!,
        [parent]: {
          ...prev![parent as keyof SiteSettings] as object,
          [child]: value,
        },
      }));
    } else {
      setSettings(prev => ({ ...prev!, [name]: value }));
    }
  };
  
  const handleSaveChanges = async () => {
    if (!settings) return;
    setIsSaving(true);
    const { error } = await supabase.from('site_settings').update(settings).eq('id', settings.id);
    if (error) {
        showToast(`Failed to save settings: ${error.message}`, 'error');
    } else {
        showToast('Site settings saved successfully!', 'success');
    }
    setIsSaving(false);
  };

  const handleGenerateSchema = async () => {
    if (!settings) return;
    setIsGeneratingSchema(true);
    setSchemaError('');
    setSchema('');
    try {
        const generatedSchema = await generateBusinessSchema(settings);
        setSchema(generatedSchema);
    } catch (error: any) {
        setSchemaError(error.message);
    } finally {
        setIsGeneratingSchema(false);
    }
  };

  const handleCopySchema = () => {
    if(!schema) return;
    navigator.clipboard.writeText(schema);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  if (loading) {
    return <div className="p-8 flex justify-center"><Loader /></div>;
  }
  
  if (!settings) {
    return <div className="p-8 text-center text-red-400">Could not load site settings. Please ensure they are set up in the database.</div>
  }

  return (
    <div className="p-8 text-brand-light">
      <h1 className="text-4xl font-bold mb-2 font-poppins">Site Settings</h1>
      <p className="text-gray-400 mb-8">
        Manage global settings for your website, including contact info and social media links.
      </p>

      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <Card title="Business Information">
          <div className="space-y-4">
            <Input
              label="Business Name"
              name="business_name"
              value={settings.business_name}
              onChange={handleChange}
            />
            <div className="grid md:grid-cols-2 gap-4">
               <Input
                label="Contact Email"
                name="contact_email"
                type="email"
                value={settings.contact_email}
                onChange={handleChange}
                />
                <Input
                label="Phone Number"
                name="phone_number"
                type="tel"
                value={settings.phone_number}
                onChange={handleChange}
                />
            </div>
            <Input
                label="WhatsApp Number (for chat button)"
                name="whatsapp_number"
                type="tel"
                value={settings.whatsapp_number}
                onChange={handleChange}
                placeholder="e.g., 15551234567"
            />
            <p className="text-xs text-gray-500 -mt-2 ml-1">Include country code. No dashes, spaces, or symbols.</p>
            <TextArea
                label="Business Address"
                name="address"
                value={settings.address}
                onChange={handleChange}
                rows={3}
            />
          </div>
        </Card>

        <Card title="Social Media Links">
            <div className="grid md:grid-cols-2 gap-4">
                <Input label="Facebook URL" name="socials.facebook" value={settings.socials.facebook} onChange={handleChange} />
                <Input label="Instagram URL" name="socials.instagram" value={settings.socials.instagram} onChange={handleChange} />
                <Input label="Twitter (X) URL" name="socials.twitter" value={settings.socials.twitter} onChange={handleChange} />
                <Input label="LinkedIn URL" name="socials.linkedin" value={settings.socials.linkedin} onChange={handleChange} />
            </div>
        </Card>

        <Card title="Structured Data (JSON-LD)">
            <p className="text-gray-400 mb-4 text-sm">
                Generate a JSON-LD schema script to improve how search engines understand your business information. Copy and paste this into the {'<head>'} of your website.
            </p>
            <Button onClick={handleGenerateSchema} isLoading={isGeneratingSchema} className="w-auto">
                {isGeneratingSchema ? 'Generating...' : '✨ Generate Business Schema'}
            </Button>

            {isGeneratingSchema && <div className="flex justify-center mt-4"><Loader /></div>}
            {schemaError && <p className="text-red-400 mt-4">{schemaError}</p>}
            {schema && (
                <div className="mt-4 relative bg-brand-dark rounded-md p-4 border border-gray-700">
                    <button
                        onClick={handleCopySchema}
                        className="absolute top-2 right-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs font-semibold rounded-md transition-colors"
                    >
                        {isCopied ? 'Copied!' : 'Copy'}
                    </button>
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                        <code>
                            {schema}
                        </code>
                    </pre>
                </div>
            )}
        </Card>

        <div className="flex justify-end mt-4">
            <Button onClick={handleSaveChanges} className="w-auto" isLoading={isSaving}>
                {isSaving ? 'Saving...' : 'Save All Changes'}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default SiteSettingsManager;