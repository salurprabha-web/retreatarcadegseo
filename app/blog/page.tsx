import type { Metadata } from 'next';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react';
import { getPublishedBlogPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Tips, trends, and insights about event planning and management',
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const blogPosts = await getPublishedBlogPosts();
  return (
    <div className="min-h-screen">
      <div
        className="relative h-96 flex items-center justify-center"
        style={{
          backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Blog
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Insights, tips, and inspiration for your next celebration
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {blogPosts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Blog Posts Available</h2>
            <p className="text-gray-600">Check back soon for event planning tips and insights!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="relative h-56 overflow-hidden">
                  {post.featured_image_url ? (
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <BookOpen className="h-20 w-20 text-purple-300" />
                    </div>
                  )}
                  {post.category && (
                    <Badge className="absolute top-4 right-4 bg-orange-600 hover:bg-orange-700">
                      {post.category}
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 mb-3">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {post.author_name && (
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {post.author_name}
                      </div>
                    )}
                    {post.published_at && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(post.published_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 line-clamp-3">{post.excerpt}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  >
                    <Link href={`/blog/${post.slug}`}>
                      Read More <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
