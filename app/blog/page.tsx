import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, User, ArrowRight, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { getPublishedBlogPosts } from '@/lib/blog';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Event Planning Blog — Tips, Ideas & Guides | Retreat Arcade',
  description: 'Expert guides on corporate event activities, photo booth pricing, team building ideas and event planning tips across Hyderabad and India. Updated regularly.',
  alternates: { canonical: `${siteUrl}/blog` },
  openGraph: {
    title: 'Event Planning Blog | Retreat Arcade',
    description: 'Tips and guides for corporate events, photo booths, team building and interactive games across India.',
    url: `${siteUrl}/blog`,
  },
};

export default async function BlogPage() {
  const blogPosts = await getPublishedBlogPosts();

  // ✅ Blog schema — helps Google surface posts in rich results
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Retreat Arcade Event Planning Blog",
    url: `${siteUrl}/blog`,
    description: "Expert tips on corporate events, photo booths, team building and interactive games in Hyderabad.",
    publisher: {
      "@type": "Organization",
      name: "Retreat Arcade",
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` },
    },
    blogPost: blogPosts.slice(0, 10).map((post: any) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      datePublished: post.published_at || post.created_at,
      author: { "@type": "Person", name: post.author_name || "Retreat Arcade" },
      image: post.featured_image_url || `${siteUrl}/og-image.jpg`,
    })),
  };

  // Split posts — first one is featured hero, rest in grid
  const [featured, ...rest] = blogPosts;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />

      <div className="min-h-screen bg-gray-50">

        {/* ── Dark hero header ────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-charcoal-950 via-charcoal-900 to-charcoal-800 pt-24 pb-14">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <nav className="flex items-center justify-center gap-1.5 text-xs text-white/50 mb-6">
              <Link href="/" className="hover:text-white/80 transition">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/70">Blog</span>
            </nav>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-orange-400 bg-orange-400/10 border border-orange-400/20 px-3 py-1 rounded-full mb-4">
              {blogPosts.length} Article{blogPosts.length !== 1 ? 's' : ''}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
              Event Planning Blog
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Tips, guides and ideas for corporate events, photo booths, team building and interactive games across India.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">

          {blogPosts.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Coming Soon</h2>
              <p className="text-gray-500">Event planning tips and guides are on their way.</p>
            </div>
          ) : (
            <>
              {/* ── Featured post — large card, image always fully visible ── */}
              {featured && (
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group block bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all duration-300 mb-8"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                    {/* Image — object-contain so nothing is cropped */}
                    <div className="bg-[#07091a] flex items-center justify-center overflow-hidden"
                      style={{ minHeight: '280px' }}>
                      {featured.featured_image_url ? (
                        <img
                          src={featured.featured_image_url}
                          alt={featured.title}
                          className="w-full h-auto max-h-[360px] object-contain group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-64 flex items-center justify-center">
                          <BookOpen className="h-20 w-20 text-white/20" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-8 flex flex-col justify-center gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full uppercase tracking-wide">
                          {featured.category || 'Featured'}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">Latest Post</span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 group-hover:text-orange-600 transition leading-tight">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="text-gray-500 leading-relaxed line-clamp-3">{featured.excerpt}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        {featured.author_name && (
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" /> {featured.author_name}
                          </span>
                        )}
                        {featured.published_at && (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(featured.published_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'long', year: 'numeric'
                            })}
                          </span>
                        )}
                        {featured.reading_time && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" /> {featured.reading_time}
                          </span>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-orange-500 group-hover:gap-3 transition-all">
                        Read Full Article <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              {/* ── Rest of posts — 3-col grid ─────────────────────────────── */}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rest.map((post: any) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="group bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col"
                    >
                      {/* Image — object-contain, dark background, never crops */}
                      <div className="bg-[#07091a] flex items-center justify-center overflow-hidden"
                        style={{ minHeight: '200px' }}>
                        {post.featured_image_url ? (
                          <img
                            src={post.featured_image_url}
                            alt={post.title}
                            loading="lazy"
                            className="w-full h-auto max-h-[240px] object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-48 flex items-center justify-center">
                            <BookOpen className="h-12 w-12 text-white/20" />
                          </div>
                        )}
                      </div>

                      {/* Card body */}
                      <div className="p-5 flex flex-col flex-1 gap-3">
                        {post.category && (
                          <span className="self-start text-xs font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
                            {post.category}
                          </span>
                        )}
                        <h2 className="font-bold text-gray-900 group-hover:text-orange-600 transition leading-snug line-clamp-2">
                          {post.title}
                        </h2>
                        {post.excerpt && (
                          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed flex-1">
                            {post.excerpt}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-50 mt-auto">
                          <div className="flex items-center gap-4 text-xs text-gray-400 flex-1">
                            {post.published_at && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(post.published_at).toLocaleDateString('en-IN', {
                                  day: 'numeric', month: 'short', year: 'numeric'
                                })}
                              </span>
                            )}
                            {post.reading_time && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {post.reading_time}
                              </span>
                            )}
                          </div>
                          <span className="flex items-center gap-1 text-xs font-bold text-orange-500 group-hover:gap-2 transition-all flex-shrink-0">
                            Read <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── CTA strip ───────────────────────────────────────────────────── */}
          <div className="mt-14 bg-gradient-to-br from-charcoal-900 to-charcoal-950 rounded-3xl p-8 text-center">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-2">Plan Your Event</p>
            <h3 className="text-2xl font-bold text-white mb-3">Ready to book?</h3>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              Browse 65+ products and get a free quote for your next event in Hyderabad.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/events"
                className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition text-sm">
                Browse Products <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium py-3 px-6 rounded-xl transition text-sm">
                Get Free Quote
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
