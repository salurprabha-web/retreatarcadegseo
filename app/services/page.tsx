import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Briefcase, Music, Users, PartyPopper, Cake, ArrowRight } from 'lucide-react';
import { getPublishedServices } from '@/lib/services';

export const metadata: Metadata = {
  title: 'Services',
  description: 'Professional event management services for all occasions',
};

export const dynamic = 'force-dynamic';

const iconMap: Record<string, any> = {
  'wedding-planning': Heart,
  'corporate-events': Briefcase,
  'cultural-festivals': Music,
  'private-celebrations': PartyPopper,
  'social-gatherings': Users,
  'special-occasions': Cake,
};

export default async function ServicesPage() {
  const services = await getPublishedServices();
  return (
    <div className="min-h-screen">
      <div
        className="relative h-96 flex items-center justify-center"
        style={{
          backgroundImage: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Our Services
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Comprehensive event management solutions for every occasion
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {services.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Services Available</h2>
            <p className="text-gray-600">Check back soon for our service offerings!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => {
              const Icon = iconMap[service.slug] || Heart;
              return (
                <Card key={service.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
                  <div className="relative h-56 overflow-hidden">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
                        <Icon className="h-20 w-20 text-orange-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <div className="bg-orange-600 p-3 rounded-full">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>
                  <CardHeader>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {service.title}
                    </h3>
                    <p className="text-gray-600 mt-2">{service.summary}</p>
                  </CardHeader>
                  <CardFooter className="pt-6">
                    <Button
                      asChild
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Link href={`/services/${service.slug}`}>
                        View Details <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
