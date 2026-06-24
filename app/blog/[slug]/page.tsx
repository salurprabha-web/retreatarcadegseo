import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Calendar, User, Clock, ArrowLeft, Tag, ExternalLink, ChevronRight, Phone, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getBlogPostBySlug, getPublishedBlogPosts } from '@/lib/blog';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.retreatarcade.in';

type Props = { params: { slug: string } };

// ─── SEO metadata ─────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) return { title: 'Blog Post Not Found' };

  // ✅ Fallback chain: dedicated SEO field → content field → default
  const metaTitle = post.meta_title || post.title;
  const metaDescription = post.meta_description || post.excerpt;
  const canonical = post.canonical_url || `${siteUrl}/blog/${post.slug}`;
  const ogImage = post.og_image_url || post.featured_image_url || `${siteUrl}/og-image.jpg`;
  const keywords = post.meta_keywords && post.meta_keywords.length > 0 ? post.meta_keywords : undefined;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: keywords,
    alternates: { canonical },
    // ✅ noindex support — excludes this specific post from Google indexing
    robots: post.noindex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: metaTitle, description: metaDescription, url: canonical, type: 'article',
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      ...(post.published_at && { publishedTime: post.published_at }),
      ...(post.author_name && { authors: [post.author_name] }),
    },
    twitter: { card: 'summary_large_image', title: metaTitle, description: metaDescription, images: [ogImage] },
  };
}

// ─── Fetch related products mentioned in the blog ──────────────────────────────
async function getRelatedProducts(category?: string) {
  // Fetch featured/published events — shown as "Products in this article"
  const query = supabase
    .from('events')
    .select('id, title, slug, image_url, summary, price, category')
    .eq('status', 'published')
    .limit(5);
  // Try to match category if provided
  if (category) {
    const { data: catData } = await query.eq('category', category);
    if (catData && catData.length > 0) return catData;
  }
  const { data } = await supabase
    .from('events')
    .select('id, title, slug, image_url, summary, price')
    .eq('status', 'published')
    .eq('is_featured', true)
    .limit(5);
  return data || [];
}

async function getRecentPosts(currentSlug: string) {
  const posts = await getPublishedBlogPosts();
  return posts.filter((p: any) => p.slug !== currentSlug).slice(0, 3);
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogDetailPage({ params }: Props) {
  const post = await getBlogPostBySlug(params.slug);
  if (!post) notFound();

  const [relatedProducts, recentPosts] = await Promise.all([
    getRelatedProducts(post.category),
    getRecentPosts(params.slug),
  ]);

  const tags = post.tags || [];
  const canonical = post.canonical_url || `${siteUrl}/blog/${post.slug}`;
  const ogImage = post.og_image_url || post.featured_image_url || `${siteUrl}/og-image.jpg`;

  // ✅ Use custom schema_json from CMS if provided, otherwise auto-generate
  const blogSchema = post.schema_json || {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: post.title, description: post.meta_description || post.excerpt || '', image: ogImage, url: canonical,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at || post.published_at || post.created_at,
    author: { '@type': 'Person', name: post.author_name || 'Retreat Arcade' },
    publisher: { '@type': 'Organization', name: 'Retreat Arcade', logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${siteUrl}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="min-h-screen bg-gray-50">

        {/* ── Hero image ──────────────────────────────────────────────────────── */}
        {post.featured_image_url && (
          <div className="relative h-[480px] w-full overflow-hidden">
            <Image
              src={post.featured_image_url}
              alt={post.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 800px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end">
              <div className="max-w-5xl mx-auto w-full px-4 pb-10">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-1.5 text-sm text-white/70 mb-4">
                  <Link href="/" className="hover:text-white transition">Home</Link>
                  <ChevronRight className="h-3 w-3" />
                  <Link href="/blog" className="hover:text-white transition">Blog</Link>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-white/90 truncate max-w-[200px]">{post.title}</span>
                </nav>
                {post.category && (
                  <span className="inline-block bg-orange-500 text-white text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                    {post.category}
                  </span>
                )}
                <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-4 max-w-3xl">
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
                  {post.author_name && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
                        {post.author_name.charAt(0)}
                      </div>
                      {post.author_name}
                    </div>
                  )}
                  {post.published_at && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                  {post.reading_time && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {post.reading_time}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── No image header ─────────────────────────────────────────────────── */}
        {!post.featured_image_url && (
          <div className="bg-gradient-to-br from-charcoal-900 to-charcoal-950 pt-28 pb-12">
            <div className="max-w-5xl mx-auto px-4">
              <nav className="flex items-center gap-1.5 text-sm text-white/50 mb-6">
                <Link href="/" className="hover:text-white/80 transition">Home</Link>
                <ChevronRight className="h-3 w-3" />
                <Link href="/blog" className="hover:text-white/80 transition">Blog</Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-white/70 truncate">{post.title}</span>
              </nav>
              {post.category && (
                <span className="inline-block bg-orange-500 text-white text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                  {post.category}
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6 max-w-3xl">
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                {post.author_name && <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{post.author_name}</div>}
                {post.published_at && <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{new Date(post.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
                {post.reading_time && <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{post.reading_time}</div>}
              </div>
            </div>
          </div>
        )}

        {/* ── Main content + sidebar ────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start">

            {/* LEFT: Article */}
            <main>
              <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Excerpt pull quote */}
                {post.excerpt && (
                  <div className="px-8 pt-8 pb-0">
                    <p className="text-lg text-gray-700 leading-relaxed font-medium border-l-4 border-orange-500 pl-5 py-2 bg-orange-50 rounded-r-xl italic">
                      {post.excerpt}
                    </p>
                  </div>
                )}

                {/* Article body */}
                <div className="px-6 md:px-10 py-8">
                  <div
                    className="
                      prose prose-lg max-w-none
                      prose-headings:font-bold prose-headings:text-gray-900
                      prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-100
                      prose-h3:text-xl prose-h3:mt-7 prose-h3:mb-3 prose-h3:text-orange-700
                      prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                      prose-strong:text-gray-900 prose-strong:font-semibold
                      prose-ul:my-4 prose-li:text-gray-700 prose-li:my-1
                      prose-ol:my-4 prose-ol:text-gray-700
                      prose-a:text-orange-600 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                      prose-table:text-sm prose-th:bg-gray-50 prose-th:font-semibold prose-td:border prose-th:border
                    "
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="px-8 pb-8 pt-2 border-t border-gray-100 flex flex-wrap items-center gap-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500 mr-1">Tags:</span>
                    {tags.map((tag: string, i: number) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-orange-50 hover:text-orange-700 transition cursor-default">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>

              {/* ── Related products BELOW article (inline, very visible) ────── */}
              {relatedProducts.length > 0 && (
                <section className="mt-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-1 w-8 bg-orange-500 rounded-full" />
                    <h2 className="text-xl font-bold text-gray-900">Products Mentioned in This Article</h2>
                    <div className="h-1 flex-1 bg-gray-200 rounded-full" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedProducts.map((product: any) => (
                      <Link
                        key={product.id}
                        href={`/events/${product.slug}`}
                        className="group flex gap-4 bg-white border border-gray-100 rounded-xl p-4 hover:border-orange-300 hover:shadow-md transition-all duration-200"
                      >
                        {product.image_url && (
                          <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <Image
                              src={product.image_url}
                              alt={product.title}
                              fill
                              loading="lazy"
                              sizes="(max-width: 768px) 50vw, 280px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition text-sm leading-tight mb-1 line-clamp-2">
                            {product.title}
                          </h3>
                          {product.price && (
                            <p className="text-orange-600 font-bold text-sm">₹{Number(product.price).toLocaleString('en-IN')}+</p>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-medium mt-1.5 group-hover:gap-2 transition-all">
                            View details <ExternalLink className="h-3 w-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Recent posts ───────────────────────────────────────────────── */}
              {recentPosts.length > 0 && (
                <section className="mt-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-1 w-8 bg-gray-300 rounded-full" />
                    <h2 className="text-xl font-bold text-gray-900">More from the Blog</h2>
                    <div className="h-1 flex-1 bg-gray-200 rounded-full" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {recentPosts.map((p: any) => (
                      <Link key={p.id} href={`/blog/${p.slug}`} className="group bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-200 transition-all">
                        {p.featured_image_url && (
                          <div className="relative h-36 overflow-hidden">
                            <Image
                              src={p.featured_image_url}
                              alt={p.title}
                              fill
                              loading="lazy"
                              sizes="(max-width: 768px) 50vw, 280px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          {p.category && <span className="text-xs text-orange-500 font-semibold uppercase tracking-wide">{p.category}</span>}
                          <h3 className="text-sm font-semibold text-gray-900 mt-1 line-clamp-2 group-hover:text-orange-600 transition">{p.title}</h3>
                          {p.published_at && (
                            <p className="text-xs text-gray-400 mt-2">
                              {new Date(p.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Back to blog */}
              <div className="mt-8">
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-orange-600 transition font-medium">
                  <ArrowLeft className="h-4 w-4" /> Back to all articles
                </Link>
              </div>
            </main>

            {/* RIGHT: Sticky sidebar ─────────────────────────────────────────── */}
            <aside className="space-y-6 lg:sticky lg:top-28">

              {/* CTA card — Book now */}
              <div className="bg-gradient-to-br from-charcoal-900 to-charcoal-950 rounded-2xl p-6 text-white">
                <div className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-2">Ready to Book?</div>
                <h3 className="text-lg font-bold mb-2 leading-snug">Get a free quote for your event in Hyderabad</h3>
                <p className="text-sm text-gray-300 mb-5 leading-relaxed">Interactive games, photo booths, VR simulators & more. We respond within a few hours.</p>
                <Link
                  href="/contact"
                  className="flex items-center justify-center gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition text-sm"
                >
                  <Phone className="h-4 w-4" /> Get Free Quote
                </Link>
                <a
                  href="https://wa.me/917993912762"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full mt-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-3 px-4 rounded-xl transition text-sm"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp Us
                </a>
              </div>

              {/* Featured products sidebar */}
              {relatedProducts.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">Featured in This Guide</h3>
                  <p className="text-xs text-gray-500 mb-4">Click any product to see full details & pricing</p>
                  <div className="space-y-3">
                    {relatedProducts.slice(0, 5).map((product: any) => (
                      <Link
                        key={product.id}
                        href={`/events/${product.slug}`}
                        className="group flex items-center gap-3 p-2.5 rounded-xl hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-200"
                      >
                        {product.image_url && (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                            <Image
                              src={product.image_url}
                              alt={product.title}
                              fill
                              loading="lazy"
                              sizes="(max-width: 768px) 50vw, 280px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 group-hover:text-orange-600 transition line-clamp-2 leading-snug">
                            {product.title}
                          </p>
                          {product.price && (
                            <p className="text-xs text-orange-500 font-bold mt-0.5">
                              from ₹{Number(product.price).toLocaleString('en-IN')}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-orange-400 transition flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/events"
                    className="mt-4 flex items-center justify-center gap-1.5 text-xs text-orange-600 font-semibold hover:text-orange-700 transition pt-3 border-t border-gray-100"
                  >
                    View all products <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              {/* Quick links */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Explore Our Services</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Photo Booth Rentals', href: '/services/photobooth-rentals' },
                    { label: 'Interactive Games', href: '/services/interactive-games-rental-hyderabad' },
                    { label: 'Corporate Events', href: '/services/corporate-events' },
                    { label: 'Team Building', href: '/services/team-building-activities' },
                    { label: 'Brand Activation', href: '/services/brand-activation-activities' },
                    { label: 'Employee Engagement', href: '/services/employee-engagement-activities' },
                  ].map(({ label, href }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center justify-between text-xs text-gray-600 hover:text-orange-600 py-2 border-b border-gray-50 last:border-0 transition group"
                    >
                      <span className="font-medium">{label}</span>
                      <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-orange-400 transition" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Contact info strip */}
              <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 text-center">
                <p className="text-xs text-gray-600 mb-1">Call us directly</p>
                <a href="tel:+919063679687" className="text-lg font-bold text-orange-600 hover:text-orange-700 transition block">
                  +91 9063679687
                </a>
                <p className="text-xs text-gray-500 mt-1">Mon–Sun, 9am–9pm</p>
              </div>

            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
