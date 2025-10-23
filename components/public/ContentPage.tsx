import React, { useEffect } from 'react';
import { ContentPage as ContentPageType } from '../../types';

// Simple markdown to HTML converter
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
            // Basic list support
            if (paragraph.startsWith('- ')) {
                const items = paragraph.split('\n').map(item => `<li>${item.substring(2)}</li>`).join('');
                return `<ul class="list-disc list-inside space-y-2 mb-4">${items}</ul>`;
            }
            return `<p class="text-gray-300 leading-relaxed mb-4">${paragraph}</p>`;
        })
        .join('');

    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

interface ContentPageProps {
    page: ContentPageType;
}

const ContentPage: React.FC<ContentPageProps> = ({ page }) => {
    useEffect(() => {
        window.scrollTo(0,0);
    }, [page]);

    return (
        <div className="py-20 bg-brand-dark">
            <div className="container mx-auto px-6 max-w-4xl">
                <article className="bg-brand-secondary p-8 md:p-12 rounded-lg shadow-lg">
                    <header className="border-b border-gray-700 pb-6 mb-6">
                        <h1 className="text-4xl md:text-5xl font-bold text-white font-poppins leading-tight">{page.title}</h1>
                    </header>
                    <div className="prose prose-invert max-w-none">
                       <Markdown content={page.content} />
                    </div>
                </article>
            </div>
        </div>
    );
};

export default ContentPage;