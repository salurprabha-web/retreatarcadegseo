import React from 'react';
import { BlogPost } from '../../types';
import Link from 'next/link';

interface BlogSectionProps {
    posts: BlogPost[];
}

const BlogSection: React.FC<BlogSectionProps> = ({ posts }) => {
  return (
    <section id="blog" className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white font-poppins">From the Blog</h2>
          <p className="text-lg text-gray-400 mt-2">Insights and ideas for your next amazing event.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.slice(0, 3).map(post => (
            <Link 
                key={post.id} 
                href={`/blog/${post.seo.slug}`} 
                className="block bg-brand-secondary rounded-lg overflow-hidden shadow-lg group"
            >
                <div className="p-8">
                    <p className="text-sm text-gray-400 mb-2">{post.publish_date}</p>
                    <h3 className="text-2xl font-bold text-white font-poppins mb-4 group-hover:text-brand-accent transition-colors duration-200">{post.title}</h3>
                    <p className="text-gray-300 mb-6 line-clamp-3">
                        {post.content.split('##')[0].replace(/#/g, '').trim()}
                    </p>
                    <span className="font-bold text-brand-accent hover:text-brand-accent-hover transition-colors">
                        Read More &rarr;
                    </span>
                </div>
            </Link>
          ))}
        </div>
         <div className="text-center mt-12">
            <Link 
                href="/blog"
                className="inline-block bg-transparent border-2 border-brand-accent text-brand-accent font-bold py-3 px-8 rounded-lg text-lg hover:bg-brand-accent hover:text-brand-dark transition-colors duration-300"
            >
                View All Posts
            </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
