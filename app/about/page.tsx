import type { Metadata } from 'next';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Users, Heart, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Nirvahana Utsav and our passion for creating unforgettable events',
};

export const revalidate = 60;

async function getAboutData() {
  const { data } = await supabase
    .from('about_page')
    .select('*')
    .maybeSingle();

  return data;
}

export default async function AboutPage() {
  const aboutData = await getAboutData();

  const stats = [
    { label: 'Events Organized', value: aboutData?.stats_events ? `${aboutData.stats_events}+` : '100+', icon: Award },
    { label: 'Happy Clients', value: aboutData?.stats_clients ? `${aboutData.stats_clients}+` : '5000+', icon: Users },
    { label: 'Years of Experience', value: aboutData?.stats_years ? `${aboutData.stats_years}+` : '10+', icon: Heart },
    { label: 'Team Members', value: aboutData?.stats_team ? `${aboutData.stats_team}+` : '50+', icon: Target },
  ];
  return (
    <div className="min-h-screen">
      <div
        className="relative h-96 flex items-center justify-center"
        style={{
          backgroundImage: aboutData?.hero_image_url
            ? `url(${aboutData.hero_image_url})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            {aboutData?.title || 'About Us'}
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            {aboutData?.subtitle || 'Creating memorable moments through exceptional event management'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {aboutData?.mission_title && aboutData?.mission_content && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {aboutData.mission_title}
            </h2>
            <div className="prose prose-lg max-w-4xl mx-auto text-gray-700">
              <p>{aboutData.mission_content}</p>
            </div>
          </div>
        )}

        {aboutData?.vision_title && aboutData?.vision_content && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              {aboutData.vision_title}
            </h2>
            <div className="prose prose-lg max-w-4xl mx-auto text-gray-700">
              <p>{aboutData.vision_content}</p>
            </div>
          </div>
        )}

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            {aboutData?.story_title || 'Our Story'}
          </h2>
          <div className="prose prose-lg max-w-4xl mx-auto text-gray-700 whitespace-pre-line">
            <p>
              {aboutData?.story_content ||
              'Founded with a passion for creating unforgettable experiences, Nirvahana Utsav has been transforming events into cherished memories for over a decade. Our journey began with a simple belief: every celebration deserves to be extraordinary.\n\nFrom intimate gatherings to grand celebrations, we bring together creativity, precision, and cultural authenticity. Our team of dedicated professionals works tirelessly to understand your vision and bring it to life with meticulous attention to detail.\n\nToday, we stand proud as one of India\'s leading event management companies, having organized hundreds of successful events and earned the trust of thousands of satisfied clients. Our commitment to excellence and innovation continues to drive us forward.'}
            </p>
          </div>
        </div>

        {aboutData?.values && aboutData.values.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              Our Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {aboutData.values.map((value: string, index: number) => {
                const parts = value.split(':');
                const valueName = parts[0]?.trim() || value;
                const valueDesc = parts[1]?.trim() || '';
                return (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <Badge className="bg-orange-600 mb-4">{valueName}</Badge>
                      {valueDesc && <p className="text-gray-700">{valueDesc}</p>}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            {aboutData?.team_title || 'Meet Our Team'}
          </h2>
          {aboutData?.team_description && (
            <p className="text-center text-gray-600 mb-8 max-w-3xl mx-auto">
              {aboutData.team_description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
