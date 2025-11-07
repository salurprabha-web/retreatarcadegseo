import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, User, Clock, ArrowLeft, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getBlogPostBySlug, getPublishedBlogPosts } from '@/lib/blog';

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const post = await getBlogPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  const contentImages = post.content_images || [];
  const tags = post.tags || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>
        </Link>

        <article className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {post.featured_image_url && (
            <div className="relative h-[500px] w-full overflow-hidden">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                {post.category && (
                  <Badge className="bg-orange-600 hover:bg-orange-700 mb-4">
                    {post.category}
                  </Badge>
                )}
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  {post.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-200">
                  {post.author_name && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      {post.author_name}
                    </div>
                  )}
                  {post.published_at && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(post.published_at).toLocaleDateString('en-IN', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  )}
                  {post.reading_time && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {post.reading_time}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {!post.featured_image_url && (
            <div className="p-8 border-b">
              {post.category && (
                <Badge className="bg-orange-600 hover:bg-orange-700 mb-4">
                  {post.category}
                </Badge>
              )}
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900 leading-tight">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {post.author_name && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {post.author_name}
                  </div>
                )}
                {post.published_at && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(post.published_at).toLocaleDateString('en-IN', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                )}
                {post.reading_time && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    {post.reading_time}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-8 md:p-12">
            {post.excerpt && (
              <p className="text-xl text-gray-700 leading-relaxed mb-8 font-medium border-l-4 border-orange-500 pl-6 italic">
                {post.excerpt}
              </p>
            )}

            <div
              className="prose prose-lg prose-headings:text-gray-900 prose-h2:text-3xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:my-4 prose-li:text-gray-700 max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {contentImages.length > 0 && (
              <div className="mt-12 space-y-10">
                {contentImages.map((image: any, index: number) => (
                  <figure key={index} className="my-10">
                    <div className="relative overflow-hidden rounded-xl shadow-xl">
                      <img
                        src={image.url}
                        alt={image.alt || 'Content image'}
                        className="w-full h-auto"
                      />
                    </div>
                    {image.caption && (
                      <figcaption className="text-center text-sm text-gray-600 mt-3 italic">
                        {image.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}

            {tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center flex-wrap gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700 mr-2">Tags:</span>
                  {tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        <div className="mt-12 text-center">
          <Link href="/blog">
            <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Posts
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
