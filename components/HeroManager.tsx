import React, { useState, useEffect } from 'react';
import { HeroSlide } from '../types';
import { supabase } from '../services/supabaseClient';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Table from './common/Table';
import Loader from './common/Loader';

const emptySlide: Omit<HeroSlide, 'id' | 'created_at'> = {
    type: 'image',
    background_url: '',
    alt_text: '',
    duration: 8,
    headline: '',
    subheadline: '',
    cta_text: '',
    cta_link: '/#contact',
};

interface HeroManagerProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const HeroManager: React.FC<HeroManagerProps> = ({ showToast }) => {
    const [slides, setSlides] = useState<HeroSlide[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchSlides = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('hero_slides').select('*').order('created_at').returns<HeroSlide[]>();
        if (error) {
            showToast('Could not fetch hero slides.', 'error');
        } else {
            setSlides(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSlides();
    }, []);

    const handleAddNew = () => {
        setEditingSlide(null);
        setIsModalOpen(true);
    };

    const handleEdit = (slide: HeroSlide) => {
        setEditingSlide(slide);
        setIsModalOpen(true);
    };
    
    const handleDelete = async (slideId: string) => {
        if (window.confirm('Are you sure you want to delete this hero slide?')) {
            const { error } = await supabase.from('hero_slides').delete().eq('id', slideId);
            if (error) {
                showToast(`Error deleting slide: ${error.message}`, 'error');
            } else {
                showToast('Slide deleted successfully.', 'success');
                fetchSlides();
            }
        }
    };

    const handleSave = async (slideToSave: HeroSlide) => {
        const { error } = await supabase.from('hero_slides').upsert(slideToSave);
        if (error) {
            showToast(`Error saving slide: ${error.message}`, 'error');
            console.error(error);
        } else {
            showToast('Slide saved successfully.', 'success');
            fetchSlides();
            closeModal();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingSlide(null);
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">Hero Section Manager</h1>
            <p className="text-gray-400 mb-8">
                Control the content of your homepage's main hero slideshow.
            </p>

            <Card title="All Hero Slides">
                <div className="mb-4">
                    <Button onClick={handleAddNew} className="w-auto">
                        Add New Slide
                    </Button>
                </div>
                {loading ? <div className="flex justify-center py-8"><Loader /></div> :
                    <Table<HeroSlide>
                        headers={['Headline', 'Type', 'Duration/Loop', 'Actions']}
                        data={slides}
                        renderRow={(slide) => (
                            <tr key={slide.id} className="border-b border-gray-700 hover:bg-brand-secondary">
                                <td className="p-4 font-medium" dangerouslySetInnerHTML={{ __html: slide.headline.replace(/<br \/>/g, ' ') }} />
                                <td className="p-4 text-gray-400 capitalize">{slide.type}</td>
                                <td className="p-4 text-gray-400">{slide.type === 'image' ? `${slide.duration}s` : 'Looping'}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(slide)} className="text-brand-accent hover:text-brand-accent-hover font-semibold">Edit</button>
                                        <button onClick={() => handleDelete(slide.id)} className="text-red-500 hover:text-red-400 font-semibold">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    />
                }
            </Card>

            {isModalOpen && (
                 <HeroSlideFormModal
                    slide={editingSlide}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

interface HeroSlideFormModalProps {
    slide: HeroSlide | null;
    onClose: () => void;
    onSave: (slide: HeroSlide) => void;
}

const HeroSlideFormModal: React.FC<HeroSlideFormModalProps> = ({ slide, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<HeroSlide, 'id' | 'created_at'>>(slide || emptySlide);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'duration' ? parseInt(value, 10) : value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalSlide: HeroSlide = {
            id: slide?.id || undefined, // Let Supabase create new UUID
            created_at: slide?.created_at || new Date().toISOString(),
            ...formData,
        };
        onSave(finalSlide);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={slide ? 'Edit Hero Slide' : 'Add New Hero Slide'}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                   <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Slide Type</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="w-full px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent">
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                        </select>
                   </div>
                   <Input label="Background Media URL" name="background_url" value={formData.background_url} onChange={handleChange} placeholder="https://example.com/image.jpg or /video.mp4" required />
                   {formData.type === 'image' && (
                    <>
                        <Input label="Alt Text (for SEO)" name="alt_text" value={formData.alt_text} onChange={handleChange} required />
                        <Input label="Image Duration (seconds)" name="duration" type="number" value={formData.duration} onChange={handleChange} min="3" required />
                    </>
                   )}
                   <TextArea label="Headline" name="headline" value={formData.headline} onChange={handleChange} rows={2} required placeholder='Use <br /> for a line break.'/>
                   <TextArea label="Subheadline" name="subheadline" value={formData.subheadline} onChange={handleChange} rows={3} required />
                   <div className="grid grid-cols-2 gap-4">
                     <Input label="CTA Button Text" name="cta_text" value={formData.cta_text} onChange={handleChange} required />
                     <Input label="CTA Button Link" name="cta_link" value={formData.cta_link} onChange={handleChange} required placeholder="/#contact or #/services" />
                   </div>
                </div>
                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-brand-secondary hover:bg-gray-700 font-semibold rounded-md transition-colors">Cancel</button>
                    <Button type="submit" className="w-auto">Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
};


export default HeroManager;