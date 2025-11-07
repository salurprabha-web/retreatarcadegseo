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

export default function AdminAboutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aboutData, setAboutData] = useState<any>(null);

  useEffect(() => {
    checkAuthAndLoadAbout();
  }, [router]);

  async function checkAuthAndLoadAbout() {
    const { session } = await getSession();
    if (!session) {
      router.push('/admin');
      return;
    }

    const { data, error } = await supabase
      .from('about_page')
      .select('*')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Error loading about page:', error);
    }

    setAboutData(data);
    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    const pageData = {
      title: formData.get('title') as string,
      subtitle: formData.get('subtitle') as string,
      hero_image_url: formData.get('hero_image_url') as string || null,
      mission_title: formData.get('mission_title') as string,
      mission_content: formData.get('mission_content') as string,
      vision_title: formData.get('vision_title') as string,
      vision_content: formData.get('vision_content') as string,
      story_title: formData.get('story_title') as string,
      story_content: formData.get('story_content') as string,
      team_title: formData.get('team_title') as string,
      team_description: formData.get('team_description') as string,
      values: (formData.get('values') as string).split('\n').filter(v => v.trim()),
      stats_clients: parseInt(formData.get('stats_clients') as string) || 0,
      stats_events: parseInt(formData.get('stats_events') as string) || 0,
      stats_years: parseInt(formData.get('stats_years') as string) || 0,
      stats_team: parseInt(formData.get('stats_team') as string) || 0,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (aboutData) {
      ({ error } = await supabase
        .from('about_page')
        .update(pageData)
        .eq('id', aboutData.id));
    } else {
      ({ error } = await supabase.from('about_page').insert([pageData]));
    }

    if (error) {
      console.error('Error saving about page:', error);
      toast.error('Failed to save about page');
      setIsSubmitting(false);
      return;
    }

    toast.success('About page saved successfully!');
    setIsSubmitting(false);
    checkAuthAndLoadAbout();
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
      <AdminHeader title="About Page" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Page Title *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  defaultValue={aboutData?.title || 'About Us'}
                  placeholder="About Us"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle *</Label>
                <Input
                  id="subtitle"
                  name="subtitle"
                  required
                  defaultValue={aboutData?.subtitle || ''}
                  placeholder="Creating Unforgettable Celebrations"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero_image_url">Hero Image URL</Label>
                <Input
                  id="hero_image_url"
                  name="hero_image_url"
                  type="url"
                  defaultValue={aboutData?.hero_image_url || ''}
                  placeholder="https://images.pexels.com/..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mission & Vision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mission_title">Mission Title *</Label>
                <Input
                  id="mission_title"
                  name="mission_title"
                  required
                  defaultValue={aboutData?.mission_title || 'Our Mission'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mission_content">Mission Content *</Label>
                <Textarea
                  id="mission_content"
                  name="mission_content"
                  required
                  rows={4}
                  defaultValue={aboutData?.mission_content || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vision_title">Vision Title *</Label>
                <Input
                  id="vision_title"
                  name="vision_title"
                  required
                  defaultValue={aboutData?.vision_title || 'Our Vision'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vision_content">Vision Content *</Label>
                <Textarea
                  id="vision_content"
                  name="vision_content"
                  required
                  rows={4}
                  defaultValue={aboutData?.vision_content || ''}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Our Story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="story_title">Story Title *</Label>
                <Input
                  id="story_title"
                  name="story_title"
                  required
                  defaultValue={aboutData?.story_title || 'Our Story'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="story_content">Story Content *</Label>
                <Textarea
                  id="story_content"
                  name="story_content"
                  required
                  rows={6}
                  defaultValue={aboutData?.story_content || ''}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Team Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team_title">Team Section Title *</Label>
                <Input
                  id="team_title"
                  name="team_title"
                  required
                  defaultValue={aboutData?.team_title || 'Our Team'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team_description">Team Description *</Label>
                <Textarea
                  id="team_description"
                  name="team_description"
                  required
                  rows={3}
                  defaultValue={aboutData?.team_description || ''}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Values</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="values">Core Values (one per line) *</Label>
                <Textarea
                  id="values"
                  name="values"
                  required
                  rows={6}
                  defaultValue={aboutData?.values?.join('\n') || 'Excellence\nCreativity\nIntegrity\nClient Focus'}
                  placeholder="Excellence&#10;Creativity&#10;Integrity"
                />
                <p className="text-sm text-gray-500">Enter each value on a new line</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stats_clients">Happy Clients</Label>
                <Input
                  id="stats_clients"
                  name="stats_clients"
                  type="number"
                  defaultValue={aboutData?.stats_clients || 500}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stats_events">Events Completed</Label>
                <Input
                  id="stats_events"
                  name="stats_events"
                  type="number"
                  defaultValue={aboutData?.stats_events || 1000}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stats_years">Years of Experience</Label>
                <Input
                  id="stats_years"
                  name="stats_years"
                  type="number"
                  defaultValue={aboutData?.stats_years || 10}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stats_team">Team Members</Label>
                <Input
                  id="stats_team"
                  name="stats_team"
                  type="number"
                  defaultValue={aboutData?.stats_team || 25}
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
              {isSubmitting ? 'Saving...' : 'Save About Page'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
