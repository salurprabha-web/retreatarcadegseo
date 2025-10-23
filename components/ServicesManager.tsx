import React, { useState, useMemo, useEffect } from 'react';
import { Service } from '../types';
import { supabase } from '../services/supabaseClient';
import Card from './common/Card';
import Button from './common/Button';
import Modal from './common/Modal';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Table from './common/Table';
import Loader from './common/Loader';
import { getSimpleSeoScore } from '../utils/seo';
import { getServiceSeoSuggestions, generateServiceDetails, generateProductSchema } from '../services/geminiService';

const emptyService: Omit<Service, 'id' | 'created_at'> = {
    name: '',
    description: '',
    long_description: '',
    category: '',
    price: 0,
    image_url: '',
    gallery_image_urls: [],
    features: [],
    specifications: [],
    related_service_ids: [],
    seo: { metaTitle: '', metaDescription: '', slug: '' },
};

interface ServicesManagerProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

const ServicesManager: React.FC<ServicesManagerProps> = ({ showToast }) => {
    const [services, setServices] = useState<Service[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchServices = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('services').select('*').order('created_at').returns<Service[]>();
        if (error) {
            console.error('Error fetching services:', error);
            showToast('Could not fetch services.', 'error');
        } else {
            setServices(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchServices();
    }, []);

    const handleAddNew = () => {
        setEditingService(null);
        setIsModalOpen(true);
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };
    
    const handleDelete = async (serviceId: string) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            const { error } = await supabase.from('services').delete().match({ id: serviceId });
            if (error) {
                showToast(`Error deleting service: ${error.message}`, 'error');
            } else {
                showToast('Service deleted successfully.', 'success');
                fetchServices();
            }
        }
    };

    const handleSave = async (serviceToSave: Omit<Service, 'id' | 'created_at'>, id?: string) => {
        const payload = id ? { ...serviceToSave, id } : serviceToSave;
        const { data, error } = await supabase.from('services').upsert(payload).select().single();

        if (error) {
            console.error(error);
            showToast(`Error saving service: ${error.message}`, 'error');
        } else if (data) {
            showToast(`Service "${data.name}" saved successfully!`, 'success');
            await fetchServices();
            closeModal();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingService(null);
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">Services Management</h1>
            <p className="text-gray-400 mb-8">
                Add, edit, and manage all your premium service offerings.
            </p>

            <Card title="All Services">
                <div className="mb-4">
                    <Button onClick={handleAddNew} className="w-auto">
                        Add New Service
                    </Button>
                </div>
                {loading ? <div className="flex justify-center py-8"><Loader /></div> :
                    <Table<Service>
                        headers={['Service Name', 'Category', 'Price', 'SEO Score', 'Actions']}
                        data={services}
                        renderRow={(service) => {
                            const score = getSimpleSeoScore(service);
                            const scoreColor = score >= 75 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400';
                            return (
                                <tr key={service.id} className="border-b border-gray-700 hover:bg-brand-secondary">
                                    <td className="p-4 font-medium">{service.name}</td>
                                    <td className="p-4 text-gray-400">{service.category}</td>
                                    <td className="p-4 text-gray-400">${service.price.toFixed(2)}</td>
                                    <td className={`p-4 font-bold ${scoreColor}`}>{score}%</td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(service)} className="text-brand-accent hover:text-brand-accent-hover font-semibold">Edit</button>
                                            <button onClick={() => handleDelete(service.id)} className="text-red-500 hover:text-red-400 font-semibold">Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        }}
                    />
                }
            </Card>

            {isModalOpen && (
                 <ServiceFormModal
                    service={editingService}
                    allServices={services}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};

interface ServiceFormModalProps {
    service: Service | null;
    allServices: Service[];
    onClose: () => void;
    onSave: (service: Omit<Service, 'id' | 'created_at'>, id?: string) => void;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ service, allServices, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<Service, 'id' | 'created_at'>>(service || emptyService);
    const [isSeoLoading, setIsSeoLoading] = useState(false);
    const [isDetailsLoading, setIsDetailsLoading] = useState(false);
    const [isSchemaLoading, setIsSchemaLoading] = useState(false);
    const [productSchema, setProductSchema] = useState('');
    const [error, setError] = useState<string | null>(null);

    const uniqueCategories = useMemo(() => {
        return [...new Set(allServices.map(s => s.category).filter(Boolean))];
    }, [allServices]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.startsWith('seo.')) {
            const seoField = name.split('.')[1];
            setFormData(prev => ({ ...prev, seo: { ...prev.seo, [seoField]: value }}));
        } else {
            setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) || 0 : value }));
        }
    };
    
    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
        setFormData(prev => ({ ...prev, related_service_ids: values }));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData, service?.id);
    };

    const handleGenerateSeo = async () => {
        if (!formData.name || !formData.description) {
            setError("Please enter a service name and short description first.");
            return;
        }
        setError(null);
        setIsSeoLoading(true);
        try {
            const suggestions = await getServiceSeoSuggestions(formData.name, formData.description);
            setFormData(prev => ({...prev, seo: suggestions}));
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsSeoLoading(false);
        }
    };

    const handleGenerateDetails = async () => {
        if (!formData.name || !formData.description) {
            setError("Please enter a service name and short description first.");
            return;
        }
        setError(null);
        setIsDetailsLoading(true);
        try {
            const details = await generateServiceDetails(formData.name, formData.description);
            setFormData(prev => ({
                ...prev,
                long_description: details.long_description,
                features: details.features,
                specifications: details.specifications
            }));
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsDetailsLoading(false);
        }
    };
    
     const handleGenerateSchema = async () => {
        if (!formData.name || !formData.long_description) {
            setError("Please enter service details before generating schema.");
            return;
        }
        setError(null);
        setIsSchemaLoading(true);
        try {
            const schema = await generateProductSchema(formData as Service); // Cast because ID is missing but not needed for prompt
            setProductSchema(schema);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsSchemaLoading(false);
        }
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={service ? 'Edit Service' : 'Add New Service'}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
                   <Input label="Service Name" name="name" value={formData.name} onChange={handleChange} required />
                   <TextArea label="Short Description (for cards)" name="description" value={formData.description} onChange={handleChange} rows={3} required/>
                   <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Input label="Category" name="category" value={formData.category} onChange={handleChange} required list="category-suggestions" />
                            <datalist id="category-suggestions">
                                {uniqueCategories.map(cat => <option key={cat} value={cat} />)}
                            </datalist>
                        </div>
                        <Input label="Price ($)" name="price" type="number" value={formData.price} onChange={handleChange} required />
                   </div>
                   <Input label="Primary Image URL" name="image_url" value={formData.image_url} onChange={handleChange} placeholder="https://example.com/image.png" required/>
                    <div className="my-4 p-4 bg-brand-dark rounded-lg border border-gray-600 space-y-4">
                        <p className="text-sm text-gray-300">Use AI to generate all the content for this service based on its name and short description.</p>
                        <div className="flex flex-wrap gap-4">
                            <Button type="button" onClick={handleGenerateDetails} isLoading={isDetailsLoading} className="w-auto text-sm py-2">
                                {isDetailsLoading ? 'Generating...' : '✨ Generate Full Details'}
                            </Button>
                             <Button type="button" onClick={handleGenerateSeo} isLoading={isSeoLoading} className="w-auto text-sm py-2 bg-gray-600 hover:bg-gray-500">
                                {isSeoLoading ? 'Generating...' : '✨ Generate SEO & Slug'}
                            </Button>
                        </div>
                        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
                    </div>
                   <TextArea label="Long Description (for detail page)" name="long_description" value={formData.long_description} onChange={handleChange} rows={6} required/>
                   <TextArea label="Gallery Image URLs (one per line)" name="gallery_image_urls" value={formData.gallery_image_urls.join('\n')} onChange={e => setFormData(p => ({...p, gallery_image_urls: e.target.value.split('\n')}))} rows={4} />
                   <TextArea label="Key Features (comma-separated)" name="features" value={formData.features.join(', ')} onChange={e => setFormData(p => ({...p, features: e.target.value.split(',').map(f => f.trim())}))} rows={3} />
                   <TextArea label="Specifications (format: Key:Value, one per line)" name="specifications" value={formData.specifications.map(s => `${s.key}: ${s.value}`).join('\n')} onChange={e => setFormData(p => ({...p, specifications: e.target.value.split('\n').map(line => { const [key, ...val] = line.split(':'); return {key: key.trim(), value: val.join(':').trim()}}).filter(s => s.key)}))} rows={4} />
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Related Services</label>
                        <select
                            multiple
                            value={formData.related_service_ids}
                            onChange={handleMultiSelectChange}
                            className="w-full h-32 px-3 py-2 bg-brand-dark text-brand-light border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        >
                            {allServices.filter(s => s.id !== service?.id).map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                   
                   <h3 className="text-lg font-semibold text-gray-200 pt-4 border-t border-gray-600">SEO Details</h3>
                   <Input label="Meta Title" name="seo.metaTitle" value={formData.seo.metaTitle} onChange={handleChange} maxLength={60} showCharCount required />
                   <TextArea label="Meta Description" name="seo.metaDescription" value={formData.seo.metaDescription} onChange={handleChange} rows={3} maxLength={160} showCharCount required />
                   <Input label="URL Slug" name="seo.slug" value={formData.seo.slug} onChange={handleChange} required />
                   
                   <h3 className="text-lg font-semibold text-gray-200 pt-4 border-t border-gray-600">Product Schema (JSON-LD)</h3>
                   <p className="text-sm text-gray-400 -mt-3 mb-2">Generate structured data for search engines.</p>
                   <Button type="button" onClick={handleGenerateSchema} isLoading={isSchemaLoading} className="w-auto text-sm py-2">
                        {isSchemaLoading ? 'Generating...' : '✨ Generate Product Schema'}
                    </Button>
                    {productSchema && (
                        <TextArea value={productSchema} readOnly rows={8} />
                    )}

                </div>
                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-brand-secondary hover:bg-gray-700 font-semibold rounded-md transition-colors">Cancel</button>
                    <Button type="submit" className="w-auto">Save Changes</Button>
                </div>
            </form>
        </Modal>
    );
};


export default ServicesManager;