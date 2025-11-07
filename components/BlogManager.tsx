import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { createClient } from '../lib/supabase/client';
import { generateFullBlogPost } from '../services/geminiService';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Table from './common/Table';
import Loader from './common/Loader';

// Fix: Instantiate Supabase client
const supabase = createClient();

const emptyPostData: Omit<BlogPost, 'id' | 'publish_date' | 'status' | 'created_at'> = {
    title: '',
    content: '',
    seo: {
        metaTitle: '',
        metaDescription: '',
        slug: ''
    }
};

interface BlogManagerProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const BlogManager: React.FC<BlogManagerProps> = ({ showToast }) => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false }).returns<BlogPost[]>();
        if (error) {
            showToast("Could not fetch blog posts.", 'error');
            console.error(error);
        } else {
            setPosts(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleAddNew = () => {
        setEditingPost(null);
        setIsModalOpen(true);
    };

    const handleEdit = (post: BlogPost) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };
    
    const handleDelete = async (postId: string) => {
        if (window.confirm('Are you sure you want to delete this post?')) {
            const { error } = await supabase.from('blog_posts').delete().eq('id', postId);
            if (error) {
                showToast(`Error deleting post: ${error.message}`, 'error');
            } else {
                showToast('Post deleted successfully.', 'success');
                fetchPosts();
            }
        }
    };

    const handleSave = async (postToSave: BlogPost) => {
        const { error } = await supabase.from('blog_posts').upsert(postToSave);
        if (error) {
            showToast(`Error saving post: ${error.message}`, 'error');
            console.error(error);
        } else {
            showToast(`Post "${postToSave.title}" saved successfully.`, 'success');
            fetchPosts();
            closeModal();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPost(null);
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">AI Blog Manager</h1>
            <p className="text-gray-400 mb-8">
                Create, manage, and publish SEO-optimized blog content with a powerful AI assistant.
            </p>

            <Card title="All Blog Posts">
                <div className="mb-4">
                    <Button onClick={handleAddNew} className="w-auto">
                        Add New Post
                    </Button>
                </div>
                {loading ? <div className="flex justify-center py-8"><Loader /></div> :
                    <Table<BlogPost>
                        headers={['Title', 'Status', 'Publish Date', 'Actions']}
                        data={posts}
                        renderRow={(post) => {
                            const statusColor = post.status === 'Published' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300';
                            return (
                                <tr key={post.id} className="border-b border-gray-700 hover:bg-brand-secondary">
                                    <td className="p-4 font-medium">{post.title}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                                            {post.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-400">{post.publish_date}</td>
                                    <td className="p-4">
                                        <div className="flex gap-4">
                                            <button onClick={() => handleEdit(post)} className="text-brand-accent hover:text-brand-accent-hover font-semibold">Edit</button>
                                            <button onClick={() => handleDelete(post.id)} className="text-red-500 hover:text-red-400 font-semibold">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        }}
                    />
                }
            </Card>

            {isModalOpen && (
                 <BlogFormModal
                    post={editingPost}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

interface BlogFormModalProps {
    post: BlogPost | null;
    onClose: () => void;
    onSave: (post: BlogPost) => void;
}

const BlogFormModal: React.FC<BlogFormModalProps> = ({ post, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<BlogPost, 'id' | 'publish_date' | 'status' | 'created_at'>>(post || emptyPostData);
    
    const [topic, setTopic] = useState('');
    const [keywords, setKeywords] = useState('');
    const [tone, setTone] = useState('Professional');
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const isGenerated = formData.title.trim() !== '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('seo.')) {
            const seoField = name.split('.')[1];
            setFormData(prev => ({ ...prev, seo: { ...prev.seo, [seoField]: value }}));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            setError("Please provide a topic to generate a blog post.");
            return;
        }
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateFullBlogPost(topic, keywords, tone);
            setFormData(result);
        } catch (err: any) {
            setError(err.message || 'Failed to generate post.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = (status: 'Draft' | 'Published') => {
        const finalPost: BlogPost = {
            id: post?.id || undefined, // Let Supabase generate ID if new
            ...formData,
            status,
            publish_date: status === 'Published' ? new Date().toISOString().split('T')[0] : (post?.publish_date || new Date().toISOString().split('T')[0]),
            created_at: post?.created_at || new Date().toISOString(),
        };
        onSave(finalPost);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={post ? 'Edit Blog Post' : 'Add New Blog Post'}>
            <div className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
                <Card title="1. Generate with AI">
                    <div className="space-y-4">
                        <TextArea label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g., Why luxury arcade games are perfect for weddings" rows={2}/>
                        <Input label="Keywords to include" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="e.g., wedding entertainment, unique reception ideas" />
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Tone of Voice</label>
                            <select value={tone} onChange={(e) => setTone(e.target.value)} className="w-full px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent">
                                <option>Professional</option><option>Casual</option><option>Exciting</option><option>Luxurious</option><option>Informative</option>
                            </select>
                        </div>
                        <Button type="button" onClick={handleGenerate} isLoading={isLoading} className="w-auto">{isLoading ? 'Generating...' : '✨ Generate Post'}</Button>
                        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                    </div>
                </Card>
                
                {isLoading && !isGenerated && <div className="flex justify-center py-8"><Loader /></div>}

                {isGenerated && (
                    <div className="space-y-4 pt-4">
                       <h3 className="text-xl font-semibold text-gray-200 font-poppins pt-4 border-t border-gray-700">2. Review &amp; Edit</h3>
                       <Input label="Blog Title" name="title" value={formData.title} onChange={handleChange} required />
                       <TextArea label="Content (Markdown)" name="content" value={formData.content} onChange={handleChange} rows={15} required/>
                       <h3 className="text-lg font-semibold text-gray-200 pt-4 border-t border-gray-600">SEO Details</h3>
                       <Input label="Meta Title" name="seo.metaTitle" value={formData.seo.metaTitle} onChange={handleChange} maxLength={60} showCharCount required />
                       <TextArea label="Meta Description" name="seo.metaDescription" value={formData.seo.metaDescription} onChange={handleChange} rows={3} maxLength={160} showCharCount required />
                       <Input label="URL Slug" name="seo.slug" value={formData.seo.slug} onChange={handleChange} required />
                    </div>
                )}
            </div>
            <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-700">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-brand-secondary hover:bg-gray-700 font-semibold rounded-md transition-colors">Cancel</button>
                <Button type="button" onClick={() => handleSave('Draft')} className="w-auto bg-gray-600 hover:bg-gray-500" disabled={!isGenerated}>Save as Draft</Button>
                <Button type="button" onClick={() => handleSave('Published')} className="w-auto" disabled={!isGenerated}>Publish</Button>
            </div>
        </Modal>
    );
};

export default BlogManager;