

import React from 'react';
import { BlogPost } from '../../types';

interface BlogPageProps {
  posts: BlogPost[];
}

const BlogPage: React.FC<BlogPageProps> = ({ posts }) => {
  const publishedPosts = posts.filter(p => p.status === 'Published');
  
  return (
    <section id="blog-page" className="py-20 bg-brand-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white font-poppins">Retreat Arcade Blog</h1>
          <p className="text-lg text-gray-400 mt-2">Insights and ideas for your next amazing event.</p>
        </div>
        <div className="max-w-4xl mx-auto space-y-8">
          {publishedPosts.map(post => (
            <a 
                key={post.id} 
                href={`#/blog/${post.seo.slug}`} 
                className="block bg-brand-secondary rounded-lg p-8 shadow-lg group hover:bg-gray-800 transition-colors duration-200"
            >
                <p className="text-sm text-gray-400 mb-2">{post.publish_date}</p>
                <h2 className="text-3xl font-bold text-white font-poppins mb-4 group-hover:text-brand-accent transition-colors duration-200">{post.title}</h2>
                <p className="text-gray-300 mb-6 line-clamp-3">
                    {post.content.split('##')[0].replace(/#/g, '').trim()}
                </p>
                <span className="font-bold text-brand-accent hover:text-brand-accent-hover transition-colors">
                    Read More &rarr;
                </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogPage;
