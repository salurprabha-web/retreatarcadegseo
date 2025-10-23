import React, { useState, useRef, useEffect } from 'react';
import { GalleryImage } from '../types';
import { supabase } from '../services/supabaseClient';
import Button from './common/Button';
import Modal from './common/Modal';
import Input from './common/Input';
import TextArea from './common/TextArea';
import Loader from './common/Loader';
import { generateImage, getAltTextSuggestion, editImage } from '../services/geminiService';

const emptyImage: Omit<GalleryImage, 'id' | 'created_at' | 'storage_path'> = {
  title: '',
  alt_text: '',
  image_url: '',
};

const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Camera Capture Component
const CameraCapture: React.FC<{ onCapture: (dataUrl: string) => void; onClose: () => void }> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        alert("Could not access camera. Please ensure permissions are granted.");
        onClose();
      }
    };
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onClose]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col justify-center items-center p-4">
        <video ref={videoRef} autoPlay playsInline className="w-full max-w-lg rounded-lg shadow-xl" />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="mt-4 flex gap-4">
            <Button onClick={handleCapture} className="w-auto">Capture Photo</Button>
            <button onClick={onClose} className="px-4 py-2 bg-red-600 hover:bg-red-700 font-semibold rounded-md transition-colors text-white">Cancel</button>
        </div>
    </div>
  );
};

interface GalleryManagerProps {
    showToast: (message: string, type: 'success' | 'error') => void;
}

// Main Component
const GalleryManager: React.FC<GalleryManagerProps> = ({ showToast }) => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingImage, setEditingImage] = useState<GalleryImage | Omit<GalleryImage, 'id' | 'created_at' | 'storage_path'> | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchImages = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('gallery_images').select('*').order('created_at');
        if (error) {
            showToast("Could not fetch gallery images.", 'error');
            console.error(error);
        } else {
            setImages(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchImages();
    }, []);

    const handleAddNew = () => {
        setEditingImage(emptyImage);
        setIsModalOpen(true);
    };

    const handleEdit = (image: GalleryImage) => {
        setEditingImage(image);
        setIsModalOpen(true);
    };

    const handleDelete = async (image: GalleryImage) => {
        if (window.confirm('Are you sure you want to delete this image?')) {
            if (image.storage_path) {
                const { error: storageError } = await supabase.storage.from('gallery').remove([image.storage_path]);
                if (storageError) {
                    showToast("Error deleting image from storage.", 'error');
                    console.error(storageError);
                    return;
                }
            }
            const { error: dbError } = await supabase.from('gallery_images').delete().eq('id', image.id);
            if (dbError) {
                showToast("Error deleting image from database.", 'error');
            } else {
                showToast("Image deleted successfully.", 'success');
                fetchImages();
            }
        }
    };

    const handleSave = async (imageToSave: GalleryImage | Omit<GalleryImage, 'id' | 'created_at' | 'storage_path'>) => {
        setLoading(true);
        
        let imageUrl = imageToSave.image_url;
        let storagePath = 'id' in imageToSave ? imageToSave.storage_path : '';

        // Check if image is a new base64 string
        if (imageUrl.startsWith('data:image')) {
            const mimeType = imageUrl.substring(imageUrl.indexOf(':') + 1, imageUrl.indexOf(';'));
            const fileExt = mimeType.split('/')[1];
            const fileName = `${Date.now()}.${fileExt}`;
            storagePath = `public/${fileName}`;
            
            const imageBlob = base64ToBlob(imageUrl, mimeType);

            const { error: uploadError } = await supabase.storage.from('gallery').upload(storagePath, imageBlob, {
                cacheControl: '3600',
                upsert: true,
            });

            if (uploadError) {
                showToast(`Failed to upload image: ${uploadError.message}`, 'error');
                console.error(uploadError);
                setLoading(false);
                return;
            }
            
            const { data: urlData } = supabase.storage.from('gallery').getPublicUrl(storagePath);
            imageUrl = urlData.publicUrl;
        }

        const finalData = {
            id: 'id' in imageToSave ? imageToSave.id : undefined,
            title: imageToSave.title,
            alt_text: imageToSave.alt_text,
            image_url: imageUrl,
            storage_path: storagePath
        };

        const { error: dbError } = await supabase.from('gallery_images').upsert(finalData);
        if (dbError) {
            showToast(`Failed to save image details: ${dbError.message}`, 'error');
            console.error(dbError);
        } else {
            showToast("Image saved successfully!", 'success');
            closeModal();
        }

        fetchImages();
    };


    const closeModal = () => {
        setIsModalOpen(false);
        setEditingImage(null);
    };

    return (
        <div className="p-8 text-brand-light">
            <h1 className="text-4xl font-bold mb-2 font-poppins">Gallery Management</h1>
            <p className="text-gray-400 mb-8">
                Manage your visual portfolio to attract and impress clients.
            </p>
            <div className="mb-6">
                <Button onClick={handleAddNew} className="w-auto">Add New Image</Button>
            </div>
             {loading ? <div className="flex justify-center py-16"><Loader /></div> :
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {images.map((image) => (
                        <div key={image.id} className="bg-brand-secondary rounded-lg shadow-lg overflow-hidden group">
                            <img src={image.image_url} alt={image.alt_text} className="w-full h-48 object-cover"/>
                            <div className="p-4">
                                <h3 className="font-semibold truncate">{image.title}</h3>
                                <p className="text-sm text-gray-400 truncate">Alt: {image.alt_text}</p>
                                <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button onClick={() => handleEdit(image)} className="text-sm text-brand-accent hover:text-brand-accent-hover font-semibold">Edit</button>
                                    <button onClick={() => handleDelete(image)} className="text-sm text-red-500 hover:text-red-400 font-semibold">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {images.length === 0 && !loading && (
                        <div className="col-span-full text-center py-16 bg-brand-secondary rounded-lg">
                            <p className="text-gray-500">No images in your gallery yet.</p>
                            <p className="text-gray-500">Click "Add New Image" to get started.</p>
                        </div>
                    )}
                </div>
            }

            {isModalOpen && editingImage && (
                <ImageFormModal
                    image={editingImage}
                    onClose={closeModal}
                    onSave={handleSave}
                />
            )}
        </div>
    );
};


// Form Modal Sub-component
interface ImageFormModalProps {
    image: GalleryImage | Omit<GalleryImage, 'id' | 'created_at' | 'storage_path'>;
    onClose: () => void;
    onSave: (image: GalleryImage | Omit<GalleryImage, 'id' | 'created_at' | 'storage_path'>) => void;
}

const ImageFormModal: React.FC<ImageFormModalProps> = ({ image, onClose, onSave }) => {
    const [formData, setFormData] = useState(image);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showCamera, setShowCamera] = useState(false);
    
    // AI State
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState('');
    const [isGeneratingAltText, setIsGeneratingAltText] = useState(false);
    const [altTextError, setAltTextError] = useState('');
    const [editPrompt, setEditPrompt] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editError, setEditError] = useState('');


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const base64 = await blobToBase64(file);
            setFormData(prev => ({ ...prev, image_url: base64 }));
        }
    };

    const handleGenerateImage = async () => {
      if (!aiPrompt.trim()) {
        setAiError("Please enter a prompt to generate an image.");
        return;
      }
      setAiError('');
      setIsGenerating(true);
      setFormData(prev => ({ ...prev, image_url: '' })); // Clear previous image
      try {
        const imageUrl = await generateImage(aiPrompt);
        setFormData(prev => ({ ...prev, image_url: imageUrl }));
      } catch (error: any) {
        setAiError(error.message || "Failed to generate image.");
      } finally {
        setIsGenerating(false);
      }
    };

    const handleEditImage = async () => {
        if (!formData.image_url) {
            setEditError("There is no image to edit.");
            return;
        }
        if (!editPrompt.trim()) {
            setEditError("Please enter an editing prompt.");
            return;
        }
        setEditError('');
        setIsEditing(true);
        try {
            const editedImageUrl = await editImage(formData.image_url, editPrompt);
            setFormData(prev => ({ ...prev, image_url: editedImageUrl }));
            setEditPrompt(''); // Clear prompt on success
        } catch (error: any) {
            setEditError(error.message || "Failed to edit image.");
        } finally {
            setIsEditing(false);
        }
    };

    const handleGenerateAltText = async () => {
        if (!formData.image_url) {
            setAltTextError("Please upload, capture, or generate an image first.");
            return;
        }
        setAltTextError('');
        setIsGeneratingAltText(true);
        try {
            const suggestion = await getAltTextSuggestion(formData.image_url);
            setFormData(prev => ({ ...prev, alt_text: suggestion }));
        } catch (error: any) {
            setAltTextError(error.message || "Failed to generate alt text.");
        } finally {
            setIsGeneratingAltText(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.image_url) {
            alert('Please upload, capture, or generate an image.');
            return;
        }
        onSave(formData);
    };

    return (
        <Modal isOpen={true} onClose={onClose} title={'id' in image ? 'Edit Image' : 'Add New Image'}>
            <form onSubmit={handleSubmit}>
                <div className="space-y-4 max-h-[80vh] overflow-y-auto p-1 pr-4">
                   <Input label="Image Title" name="title" value={formData.title} onChange={handleChange} required />
                   
                   <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Image Preview</label>
                        <div className="w-full h-64 bg-brand-dark rounded-md flex justify-center items-center overflow-hidden border-2 border-dashed border-gray-600">
                            {isGenerating || isEditing ? (
                                <Loader />
                            ) : formData.image_url ? (
                                <img src={formData.image_url} alt="Preview" className="h-full w-full object-contain" />
                            ) : (
                                <p className="text-gray-500">Image will appear here</p>
                            )}
                        </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2 flex flex-col justify-between">
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                        <Button type="button" onClick={() => fileInputRef.current?.click()} className="w-full">Upload an Image</Button>
                        <Button type="button" onClick={() => setShowCamera(true)} className="w-full bg-brand-secondary hover:bg-gray-700">Use Camera</Button>
                      </div>

                      <div className="bg-brand-dark p-4 rounded-lg border border-gray-700 space-y-2">
                         <Input 
                            label="Or Generate with AI"
                            name="aiPrompt"
                            placeholder="e.g., A neon arcade in a forest"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                         />
                         <Button type="button" onClick={handleGenerateImage} isLoading={isGenerating} className="w-full">
                            {isGenerating ? 'Generating...' : 'Generate'}
                         </Button>
                         {aiError && <p className="text-red-400 text-xs mt-1">{aiError}</p>}
                      </div>
                   </div>

                    <div className="pt-4 mt-4 border-t border-gray-700">
                        <h4 className="text-lg font-semibold text-gray-200 mb-2">✨ AI Image Editor</h4>
                        <p className="text-sm text-gray-400 mb-3">Modify the current image with a text prompt.</p>
                        <div className="bg-brand-dark p-4 rounded-lg border border-gray-700 space-y-2">
                            <Input 
                                label="Editing Prompt"
                                name="editPrompt"
                                placeholder="e.g., Add a golden hour glow, make it black and white"
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                disabled={!formData.image_url || isEditing}
                            />
                            <Button 
                                type="button" 
                                onClick={handleEditImage} 
                                isLoading={isEditing}
                                disabled={!formData.image_url || isEditing}
                                className="w-full"
                            >
                                {isEditing ? 'Applying Edit...' : 'Apply AI Edit'}
                            </Button>
                            {editError && <p className="text-red-400 text-xs mt-1">{editError}</p>}
                        </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-gray-700">
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="alt_text" className="block text-sm font-medium text-gray-300">Alt Text (for SEO)</label>
                            <Button 
                                type="button" 
                                onClick={handleGenerateAltText}
                                isLoading={isGeneratingAltText}
                                disabled={!formData.image_url || isGeneratingAltText}
                                className="text-xs px-2 py-1 w-auto !font-semibold bg-gray-600 hover:bg-gray-500 text-white !justify-start"
                            >
                                {isGeneratingAltText ? "Generating..." : "✨ Generate with AI"}
                            </Button>
                        </div>
                        <TextArea 
                            id="alt_text"
                            name="alt_text" 
                            value={formData.alt_text} 
                            onChange={handleChange}
                            placeholder="Describe the image for search engines" 
                            required 
                            rows={3}
                        />
                        {altTextError && <p className="text-red-400 text-xs mt-1">{altTextError}</p>}
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-6 pt-4 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-brand-secondary hover:bg-gray-700 font-semibold rounded-md transition-colors">Cancel</button>
                    <Button type="submit" className="w-auto">Save Changes</Button>
                </div>
            </form>

            {showCamera && (
                <CameraCapture 
                    onClose={() => setShowCamera(false)}
                    onCapture={(dataUrl) => {
                        setFormData(prev => ({ ...prev, image_url: dataUrl }));
                    }}
                />
            )}
        </Modal>
    );
};

export default GalleryManager;