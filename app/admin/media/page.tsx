'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { getSession } from '@/lib/supabase-client';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type MediaFile = {
  id: string;
  filename: string;
  url: string;
  alt_text: string | null;
  caption: string | null;
  category: string;
  tags: string[] | null;
  created_at: string;
};

export default function AdminMediaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuthAndFetchMedia();
  }, [router]);

  async function checkAuthAndFetchMedia() {
    const { session } = await getSession();
    if (!session) {
      router.push('/admin');
      return;
    }

    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching media:', error);
      toast.error('Failed to load media files');
    } else {
      setMediaFiles(data || []);
    }

    setIsLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const url = formData.get('url') as string;
    const filename = formData.get('filename') as string;
    const altText = formData.get('alt_text') as string;
    const caption = formData.get('caption') as string;
    const category = formData.get('category') as string;
    const tags = (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t);

    const { error } = await supabase.from('media').insert([{
      filename,
      url,
      alt_text: altText || null,
      caption: caption || null,
      category: category || 'General',
      tags: tags.length > 0 ? tags : null,
    }]);

    if (error) {
      console.error('Error adding media:', error);
      toast.error('Failed to add media file');
      setIsSubmitting(false);
      return;
    }

    toast.success('Media file added successfully!');
    setIsDialogOpen(false);
    setIsSubmitting(false);
    checkAuthAndFetchMedia();
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this media file?')) return;

    const { error } = await supabase.from('media').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete media file');
    } else {
      toast.success('Media file deleted successfully');
      setMediaFiles(mediaFiles.filter((m) => m.id !== id));
    }
  }

  async function copyToClipboard(url: string) {
    await navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-orange-600">Nirvahana Utsav</h1>
              <span className="text-gray-400">|</span>
              <span className="text-gray-600">Media Library</span>
            </div>
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Media Library</h2>
            <p className="text-gray-600 mt-1">Manage your images and media files</p>
          </div>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Media
          </Button>
        </div>

        {mediaFiles.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Media Files</h3>
              <p className="text-gray-600 mb-4">Get started by adding your first media file</p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Add Media File
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {mediaFiles.map((file) => (
              <Card key={file.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={file.url}
                    alt={file.alt_text || file.filename}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm text-gray-900 truncate mb-2">
                    {file.filename}
                  </h3>
                  <div className="mb-2">
                    <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                      {file.category}
                    </span>
                  </div>
                  {file.caption && (
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{file.caption}</p>
                  )}
                  {file.alt_text && (
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">Alt: {file.alt_text}</p>
                  )}
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {file.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => copyToClipboard(file.url)}
                    >
                      Copy URL
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Media File</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Image URL *</Label>
              <Input
                id="url"
                name="url"
                type="url"
                required
                placeholder="https://images.pexels.com/... or Cloudinary URL"
              />
              <p className="text-xs text-gray-500">
                Paste a Cloudinary, Google Drive, or Pexels image URL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filename">Filename *</Label>
              <Input
                id="filename"
                name="filename"
                required
                placeholder="wedding-decoration.jpg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                name="category"
                required
                placeholder="Wedding, Corporate, Festival, Party"
              />
              <p className="text-xs text-gray-500">
                Category for gallery filtering
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                name="caption"
                placeholder="A beautiful moment captured"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alt_text">Alt Text (SEO)</Label>
              <Input
                id="alt_text"
                name="alt_text"
                placeholder="Beautiful wedding decoration with flowers"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="wedding, decoration, flowers"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Media'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
