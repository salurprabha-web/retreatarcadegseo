import BlogDetailPage from '@/components/public/BlogDetailPage';
import { createClient } from '@/lib/supabase/server';
import { BlogPost } from '@/types';
import { notFound } from 'next/navigation';
import type { Metadata, ResolvingMetadata } from 'next';

type Props = {
  params: { slug: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const supabase = createClient();
  const { data: post } = await supabase.from('blog_posts').select('seo').eq('seo->>slug', params.slug).single<Pick<BlogPost, 'seo'>>();
 
  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }
 
  return {
    title: `${post.seo.metaTitle} | Retreat Arcade Blog`,
    description: post.seo.metaDescription,
  }
}

export async function generateStaticParams() {
  const supabase = createClient();
  const { data: posts } = await supabase.from('blog_posts').select('seo').eq('status', 'Published').returns<Pick<BlogPost, 'seo'>[]>();
 
  return posts?.map((post) => ({
    slug: post.seo.slug,
  })) || [];
}

export default async function Page({ params }: { params: { slug: string } }) {
    const supabase = createClient();
    const { data: post } = await supabase.from('blog_posts').select('*').eq('seo->>slug', params.slug).eq('status', 'Published').single<BlogPost>();

    if (!post) {
        notFound();
    }

    return <BlogDetailPage post={post} />;
}
