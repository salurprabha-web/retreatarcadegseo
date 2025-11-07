import React from 'react';
import { BlogPost } from '../../types';

// A simple markdown to HTML converter
const Markdown: React.FC<{ content: string }> = ({ content }) => {
    const htmlContent = content
        .split('\n\n')
        .map(paragraph => {
            if (paragraph.startsWith('## ')) {
                return `<h2 class="text-2xl font-bold text-white font-poppins mt-8 mb-4">${paragraph.substring(3)}</h2>`;
            }
            if (paragraph.startsWith('# ')) {
                 return `<h1 class="text-3xl font-bold text-white font-poppins mt-10 mb-6">${paragraph.substring(2)}</h1>`;
            }
            return `<p class="text-gray-300 leading-relaxed mb-4">${paragraph}</p>`;
        })
        .join('');

    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

interface BlogDetailPageProps {
    post: BlogPost;
}

const BlogDetailPage: React.FC<BlogDetailPageProps> = ({ post }) => {

    return (
        <div className="py-20 bg-brand-dark">
            <div className="container mx-auto px-6 max-w-4xl">
                 <a 
                    href="#/blog" 
                    className="mb-8 text-brand-accent hover:text-brand-accent-hover font-semibold flex items-center">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Blog
                </a>

                <article className="bg-brand-secondary p-8 md:p-12 rounded-lg shadow-lg">
                    <header className="border-b border-gray-700 pb-6 mb-6">
                        <p className="text-gray-400 text-sm mb-2">{post.publish_date}</p>
                        <h1 className="text-4xl md:text-5xl font-bold text-white font-poppins leading-tight">{post.title}</h1>
                    </header>
                    <div className="prose prose-invert max-w-none">
                       <Markdown content={post.content} />
                    </div>
                </article>
            </div>
        </div>
    );
};

export default BlogDetailPage;
