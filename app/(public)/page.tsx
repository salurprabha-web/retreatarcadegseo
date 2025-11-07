import HomePage from '@/components/public/HomePage';
import { createClient } from '@/lib/supabase/server';
import { Service, BlogPost } from '@/types';

export default async function Page() {
  const supabase = createClient();

  // Fetch data in parallel for efficiency
  const servicesPromise = supabase.from('services').select('*').order('created_at').returns<Service[]>();
  const blogPostsPromise = supabase.from('blog_posts').select('*').eq('status', 'Published').order('publish_date', { ascending: false }).returns<BlogPost[]>();

  const [{ data: services, error: servicesError }, { data: blogPosts, error: blogError }] = await Promise.all([
    servicesPromise,
    blogPostsPromise
  ]);

  if (servicesError) console.error("Homepage services fetch error:", servicesError.message);
  if (blogError) console.error("Homepage blog fetch error:", blogError.message);

  return <HomePage services={services || []} posts={blogPosts || []} />;
}
