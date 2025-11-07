import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Phone, Mail } from 'lucide-react';
import { getServiceBySlug } from '@/lib/services';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getServiceBySlug(params.slug);

  if (!service) {
    return {
      title: 'Service Not Found',
    };
  }

  return {
    title: service.title,
    description: service.summary || service.description,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const service = await getServiceBySlug(params.slug);

  if (!service) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="relative h-96 flex items-center justify-center"
        style={{
          backgroundImage: service.image_url
            ? `url(${service.image_url})`
            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            {service.title}
          </h1>
          {service.summary && (
            <p className="text-xl text-gray-200">{service.summary}</p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link href="/services">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  About This Service
                </h2>
                <div
                  className="prose prose-gray max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: service.content || service.description || '',
                  }}
                />
              </CardContent>
            </Card>

            {service.highlights && service.highlights.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Key Features
                  </h2>
                  <ul className="space-y-3">
                    {service.highlights.map((highlight: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-orange-600 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {service.gallery_images && service.gallery_images.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Gallery
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.gallery_images.map((image: string, index: number) => (
                      <div
                        key={index}
                        className="relative h-64 overflow-hidden rounded-lg"
                      >
                        <img
                          src={image}
                          alt={`${service.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Get a Quote
                </h3>
                <p className="text-gray-600 mb-6">
                  Interested in this service? Contact us to discuss your requirements and get a customized quote.
                </p>
                <div className="space-y-4">
                  <Button
                    asChild
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Link href="/contact">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Us
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-orange-600 text-orange-600 hover:bg-orange-50"
                  >
                    <a href="tel:+919876543210">
                      <Phone className="h-4 w-4 mr-2" />
                      Call Now
                    </a>
                  </Button>
                </div>
                {service.category && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-600 mb-2">Category</p>
                    <Badge className="bg-orange-100 text-orange-800">
                      {service.category}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
