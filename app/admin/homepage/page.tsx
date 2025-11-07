'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AdminHeader } from '@/components/admin/admin-header';
import { getSession } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function AdminHomepagePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [homepageData, setHomepageData] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadHomepage();
  }, [router]);

  async function checkAuthAndLoadHomepage() {
    const { session } = await getSession();
    if (!session) {
      router.push('/admin');
      return;
    }

    const { data, error } = await supabase
      .from('homepage_settings')
      .select('*')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading homepage:', error);
    }

    setHomepageData(data);
    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const backgroundImage = formData.get('hero_background_image') as string;

    const pageData = {
      hero_title: formData.get('hero_title') as string,
      hero_subtitle: formData.get('hero_subtitle') as string,
      hero_button_text: formData.get('hero_button_text') as string,
      hero_button_link: formData.get('hero_button_link') as string,
      hero_secondary_button_text: formData.get('hero_secondary_button_text') as string,
      hero_secondary_button_link: formData.get('hero_secondary_button_link') as string,
      hero_background_image: backgroundImage || null,
      stat_events_value: formData.get('stat_events_value') as string,
      stat_events_label: formData.get('stat_events_label') as string,
      stat_clients_value: formData.get('stat_clients_value') as string,
      stat_clients_label: formData.get('stat_clients_label') as string,
      stat_team_value: formData.get('stat_team_value') as string,
      stat_team_label: formData.get('stat_team_label') as string,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (homepageData) {
      ({ error } = await supabase
        .from('homepage_settings')
        .update(pageData)
        .eq('id', homepageData.id));
    } else {
      ({ error } = await supabase.from('homepage_settings').insert([pageData]));
    }

    if (error) {
      console.error('Error saving homepage:', error);
      toast.error('Failed to save homepage settings');
      setIsSubmitting(false);
      return;
    }

    toast.success('Homepage settings saved successfully!');
    setIsSubmitting(false);
    checkAuthAndLoadHomepage();
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
      <AdminHeader title="Homepage Settings" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero_title">Hero Title</Label>
                <Input
                  id="hero_title"
                  name="hero_title"
                  defaultValue={homepageData?.hero_title || 'Create Unforgettable Celebrations'}
                  placeholder="Create Unforgettable Celebrations"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                <Textarea
                  id="hero_subtitle"
                  name="hero_subtitle"
                  rows={2}
                  defaultValue={homepageData?.hero_subtitle || 'Expert event management and cultural celebrations that bring your vision to life'}
                  placeholder="Expert event management and cultural celebrations that bring your vision to life"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_button_text">Primary Button Text</Label>
                  <Input
                    id="hero_button_text"
                    name="hero_button_text"
                    defaultValue={homepageData?.hero_button_text || 'Explore Events'}
                    placeholder="Explore Events"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_button_link">Primary Button Link</Label>
                  <Input
                    id="hero_button_link"
                    name="hero_button_link"
                    defaultValue={homepageData?.hero_button_link || '/events'}
                    placeholder="/events"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_secondary_button_text">Secondary Button Text</Label>
                  <Input
                    id="hero_secondary_button_text"
                    name="hero_secondary_button_text"
                    defaultValue={homepageData?.hero_secondary_button_text || 'Contact Us'}
                    placeholder="Contact Us"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_secondary_button_link">Secondary Button Link</Label>
                  <Input
                    id="hero_secondary_button_link"
                    name="hero_secondary_button_link"
                    defaultValue={homepageData?.hero_secondary_button_link || '/contact'}
                    placeholder="/contact"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_background_image">Hero Background Image URL</Label>
                <Input
                  id="hero_background_image"
                  name="hero_background_image"
                  type="url"
                  defaultValue={homepageData?.hero_background_image || ''}
                  placeholder="https://example.com/hero-bg.jpg or Google Drive direct link"
                />
                <p className="text-sm text-gray-500">
                  Optional: Add a background image URL. Leave empty to use default gradient.
                  For Google Drive images, use the direct link format (see Media page for guide).
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stat_events_value">Events Stat Value</Label>
                  <Input
                    id="stat_events_value"
                    name="stat_events_value"
                    defaultValue={homepageData?.stat_events_value || '100+ Events'}
                    placeholder="100+ Events"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stat_events_label">Events Stat Label</Label>
                  <Input
                    id="stat_events_label"
                    name="stat_events_label"
                    defaultValue={homepageData?.stat_events_label || 'Successfully organized'}
                    placeholder="Successfully organized"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stat_clients_value">Clients Stat Value</Label>
                  <Input
                    id="stat_clients_value"
                    name="stat_clients_value"
                    defaultValue={homepageData?.stat_clients_value || '5000+ Guests'}
                    placeholder="5000+ Guests"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stat_clients_label">Clients Stat Label</Label>
                  <Input
                    id="stat_clients_label"
                    name="stat_clients_label"
                    defaultValue={homepageData?.stat_clients_label || 'Satisfied customers'}
                    placeholder="Satisfied customers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stat_team_value">Team Stat Value</Label>
                  <Input
                    id="stat_team_value"
                    name="stat_team_value"
                    defaultValue={homepageData?.stat_team_value || 'Expert Team'}
                    placeholder="Expert Team"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stat_team_label">Team Stat Label</Label>
                  <Input
                    id="stat_team_label"
                    name="stat_team_label"
                    defaultValue={homepageData?.stat_team_label || 'Professional planners'}
                    placeholder="Professional planners"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
