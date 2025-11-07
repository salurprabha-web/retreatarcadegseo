import React, { useState, useEffect } from 'react';
import { Testimonial } from '../types';
import { createClient } from '@/lib/supabase/client';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Table from './common/Table';
import Loader from './common/Loader';
import { getHighlightedQuote } from '../services/geminiService';

// Fix: Instantiate Supabase client
const supabase = createClient();

const emptyTestimonial: Omit<Testimonial, 'id' | 'created_at'> = {
  client_name: '',
  event_type: '',
  date: new Date().toISOString().split('T')[0],
  rating: 5,
  testimonial_text: '',
  highlighted_quote: '',
};

const StarRating: React.FC<{ rating: number; onRatingChange?: (rating: number) => void; isInteractive?: boolean }> = ({ rating, onRatingChange, isInteractive = false }) => {
    const [hoverRating, setHoverRating] = useState(0);

    return (
        <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className={`w-6 h-6 ${
                        (hoverRating || rating) >= star ? 'text-yellow-400' : 'text-gray-600'
                    } ${isInteractive ? 'cursor-pointer' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    onClick={() => isInteractive && onRatingChange?.(star)}
                    onMouseEnter={() => isInteractive && setHoverRating(star)}
                    onMouseLeave={() => isInteractive && setHoverRating(0)}
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
};

interface TestimonialsManagerProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const TestimonialsManager: React.FC<TestimonialsManagerProps> = ({ showToast }) => {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | Omit<Testimonial, 'id' | 'created_at'> | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTestimonials = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('testimonials').select('*').order('date', { ascending: false });
        if (error) {
            showToast("Could not fetch testimonials.", 'error');
        } else {
            setTestimonials(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const handleAddNew = () => {
        setEditingTestimonial(emptyTestimonial);
        setIsModalOpen(true);
    };

    const handleEdit = (testimonial: Testimonial) => {
        setEditingTestimonial(testimonial);
        setIsModalOpen(true);
    };
    
    const handleDelete = async (testimonialId: string) => {
        if (window.confirm('Are you sure you want to delete this testimonial?')) {
            const { error } = await supabase.from('testimonials').delete().eq('id', testimonialId);
            if (error) {
                showToast(`Error deleting testimonial: ${error.message}`, 'error');
            } else {
                showToast("Testimonial deleted successfully.", 'success');
                fetchTestimonials();
            }
        }
    };

    const handleSave = async (testimonialToSave: Testimonial | Omit<Testimonial, 'id' | 'created_at'>) => {
        const { error } = await supabase.from('testimonials').upsert(testimonialToSave);
        if (error) {
            showToast(`Error saving testimonial: ${error.message}`, 'error');
            console.error(error);
        } else {
            showToast("Testimonial saved successfully!", 'success');
            fetchTestimonials();
            closeModal();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTestimonial(null);
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">Testimonials</h1>
            <p className="text-gray-400 mb-8">
                Manage client feedback to build trust and social proof.
            </p>

            <Card title="All Testimonials">
                <div className="mb-4">
                    <Button onClick={handleAddNew} className="w-auto">
                        Add New Testimonial
                    </Button>
                </div>
                {loading ? <div className="flex justify-center py-8"><Loader /></div> :
                    <Table<Testimonial>
                        headers={['Client', 'Event Type', 'Rating', 'Date', 'Actions']}
                        data={testimonials}
                        renderRow={(testimonial) => (
                            <tr key={testimonial.id} className="border-b border-gray-700 hover:bg-brand-secondary">
                                <td className="p-4 font-medium">{testimonial.client_name}</td>
                                <td className="p-4 text-gray-400">{testimonial.event_type}</td>
                                <td className="p-4"><StarRating rating={testimonial.rating} /></td>
                                <td className="p-4 text-gray-400">{testimonial.date}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(testimonial)} className="text-brand-accent hover:text-brand-accent-hover font-semibold">Edit</button>
                                        <button onClick={() => handleDelete(testimonial.id)} className="text-red-500 hover:text-red-400 font-semibold">Delete</button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    />
                }
            </Card>

            {isModalOpen && editingTestimonial && (
                 <TestimonialFormModal
                    testimonial={editingTestimonial}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

interface TestimonialFormModalProps {
    testimonial: Testimonial | Omit<Testimonial, 'id' | 'created_at'>;
    onClose: () => void;
    onSave: (testimonial: Testimonial | Omit<Testimonial, 'id' | 'created_at'>) => void;
}

const TestimonialFormModal: React.FC<TestimonialFormModalProps> = ({ testimonial, onClose, onSave }) => {
    const [formData, setFormData] = useState(testimonial);
    const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
    const [quoteError, setQuoteError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRatingChange = (newRating: number) => {
        setFormData(prev => ({ ...prev, rating: newRating }));
    };

    const handleGenerateQuote = async () => {
        if (!formData.testimonial_text) {
            setQuoteError("Please enter the full testimonial text first.");
            return;
        }
        setQuoteError('');
        setIsGeneratingQuote(true);
        try {
            const quote = await getHighlightedQuote(formData.testimonial_text);
            setFormData(prev => ({ ...prev, highlighted_quote: quote }));
        } catch (error: any) {
            setQuoteError(error.message || "Failed to generate quote.");
        } finally {
            setIsGeneratingQuote(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={'id' in testimonial ? 'Edit Testimonial' : 'Add New Testimonial'}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                   <div className="grid grid-cols-2 gap-4">
                     <Input label="Client Name" name="client_name" value={formData.client_name} onChange={handleChange} required />
                     <Input label="Event Type" name="event_type" value={formData.event_type} onChange={handleChange} placeholder="e.g., Wedding" required />
                   </div>
                   <div className="grid grid-cols-2 gap-4 items-end">
                    <Input label="Date" name="date" type="date" value={formData.date} onChange={handleChange} required />
                    <div>
                         <label className="block text-sm font-medium text-gray-300 mb-1">Rating</label>
                         <StarRating rating={formData.rating} onRatingChange={handleRatingChange} isInteractive />
                    </div>
                   </div>
                   <TextArea label="Full Testimonial Text" name="testimonial_text" value={formData.testimonial_text} onChange={handleChange} rows={5} required/>

                   <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="highlighted_quote" className="block text-sm font-medium text-gray-300">Highlighted Quote (for marketing)</label>
                            <Button 
                                type="button" 
                                onClick={handleGenerateQuote}
                                isLoading={isGeneratingQuote}
                                disabled={!formData.testimonial_text || isGeneratingQuote}
                                className="text-xs px-2 py-1 w-auto !font-semibold bg-gray-600 hover:bg-gray-500 text-white !justify-start"
                            >
                                {isGeneratingQuote ? "Generating..." : "✨ Generate with AI"}
                            </Button>
                        </div>
                        <TextArea 
                            id="highlighted_quote"
                            name="highlighted_quote" 
                            value={formData.highlighted_quote || ''} 
                            onChange={handleChange}
                            placeholder="A short, powerful quote will be generated here..." 
                            rows={3}
                            maxLength={150}
                            showCharCount
                        />
                        {quoteError && <p className="text-red-400 text-xs mt-1">{quoteError}</p>}
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


export default TestimonialsManager;