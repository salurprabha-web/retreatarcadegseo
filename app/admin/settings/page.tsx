'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';
import { getSession } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type Setting = {
  key: string;
  value: any;
  description: string;
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<Record<string, any>>({});

  useEffect(() => {
    checkAuthAndLoadSettings();
  }, [router]);

  async function checkAuthAndLoadSettings() {
    const { session } = await getSession();
    if (!session) {
      router.push('/admin');
      return;
    }

    const { data, error } = await supabase
      .from('site_settings')
      .select('*');

    if (error) {
      console.error('Error loading settings:', error);
    } else if (data) {
      const settingsMap: Record<string, any> = {};
      data.forEach((setting: Setting) => {
        settingsMap[setting.key] = setting.value;
      });
      setSettings(settingsMap);
    }

    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const settingsToUpdate = [
      {
        key: 'site_name',
        value: { text: formData.get('site_name') as string },
        description: 'Website name displayed in header and titles'
      },
      {
        key: 'site_tagline',
        value: { text: formData.get('site_tagline') as string },
        description: 'Website tagline or slogan'
      },
      {
        key: 'contact_email',
        value: { text: formData.get('contact_email') as string },
        description: 'Primary contact email address'
      },
      {
        key: 'contact_phone',
        value: { text: formData.get('contact_phone') as string },
        description: 'Primary contact phone number'
      },
      {
        key: 'whatsapp_number',
        value: { text: formData.get('whatsapp_number') as string },
        description: 'WhatsApp contact number'
      },
      {
        key: 'address',
        value: { text: formData.get('address') as string },
        description: 'Business address'
      },
      {
        key: 'social_facebook',
        value: { text: formData.get('social_facebook') as string },
        description: 'Facebook page URL'
      },
      {
        key: 'social_instagram',
        value: { text: formData.get('social_instagram') as string },
        description: 'Instagram profile URL'
      },
      {
        key: 'social_twitter',
        value: { text: formData.get('social_twitter') as string },
        description: 'Twitter profile URL'
      },
      {
        key: 'social_linkedin',
        value: { text: formData.get('social_linkedin') as string },
        description: 'LinkedIn profile URL'
      }
    ];

    for (const setting of settingsToUpdate) {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          description: setting.description,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error(`Error updating ${setting.key}:`, error);
        toast.error(`Failed to update ${setting.key}`);
        setIsSubmitting(false);
        return;
      }
    }

    toast.success('Settings updated successfully!');
    setIsSubmitting(false);
    checkAuthAndLoadSettings();
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-orange-600">Nirvahana Utsav</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Site Settings</span>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic information about your website</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  name="site_name"
                  placeholder="Nirvahana Utsav"
                  defaultValue={settings.site_name?.text || 'Nirvahana Utsav'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_tagline">Tagline</Label>
                <Input
                  id="site_tagline"
                  name="site_tagline"
                  placeholder="Creating Unforgettable Celebrations"
                  defaultValue={settings.site_tagline?.text || ''}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How customers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email Address</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  placeholder="contact@nirvahanautsav.com"
                  defaultValue={settings.contact_email?.text || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone Number</Label>
                <Input
                  id="contact_phone"
                  name="contact_phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  defaultValue={settings.contact_phone?.text || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                <Input
                  id="whatsapp_number"
                  name="whatsapp_number"
                  type="tel"
                  placeholder="+919876543210"
                  defaultValue={settings.whatsapp_number?.text || ''}
                />
                <p className="text-sm text-gray-500">Include country code without spaces or special characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  rows={3}
                  placeholder="123 Event Street, Mumbai, Maharashtra, India"
                  defaultValue={settings.address?.text || ''}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>Links to your social media profiles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="social_facebook">Facebook URL</Label>
                <Input
                  id="social_facebook"
                  name="social_facebook"
                  type="url"
                  placeholder="https://facebook.com/yourpage"
                  defaultValue={settings.social_facebook?.text || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_instagram">Instagram URL</Label>
                <Input
                  id="social_instagram"
                  name="social_instagram"
                  type="url"
                  placeholder="https://instagram.com/yourprofile"
                  defaultValue={settings.social_instagram?.text || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_twitter">Twitter URL</Label>
                <Input
                  id="social_twitter"
                  name="social_twitter"
                  type="url"
                  placeholder="https://twitter.com/yourprofile"
                  defaultValue={settings.social_twitter?.text || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_linkedin">LinkedIn URL</Label>
                <Input
                  id="social_linkedin"
                  name="social_linkedin"
                  type="url"
                  placeholder="https://linkedin.com/company/yourcompany"
                  defaultValue={settings.social_linkedin?.text || ''}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
