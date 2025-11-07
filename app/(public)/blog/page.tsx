import BlogPage from '@/components/public/BlogPage';
import { createClient } from '@/lib/supabase/server';
import { BlogPost } from '@/types';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Retreat Arcade',
  description: 'Insights, ideas, and inspiration for planning your next unforgettable event with luxury arcade rentals.',
};

export default async function Page() {
  const supabase = createClient();
  const { data: posts, error } = await supabase.from('blog_posts').select('*').eq('status', 'Published').order('publish_date', { ascending: false }).returns<BlogPost[]>();
  
  if (error) {
    console.error("Blog page fetch error:", error.message);
  }

  return <BlogPage posts={posts || []} />;
}
