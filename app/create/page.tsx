'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Sidebar from '@/components/Sidebar';
import { fetcher } from '@/lib/api';

export default function CreatePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        newImages.push(data.url);
      } catch {
        toast.error('Failed to upload image');
      }
    }

    setImages((prev) => [...prev, ...newImages]);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast.error('Please add at least one image');
      return;
    }

    try {
      await fetcher('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ caption, images }),
      });
      toast.success('Post created!');
      router.push('/');
    } catch {
      toast.error('Failed to create post');
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 md:ml-[244px] pb-20 md:pb-0">
        <div className="max-w-[630px] mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-xl font-bold mb-6">Create New Post</h1>

            <div className="grid grid-cols-3 gap-2 mb-6">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-lg overflow-hidden"
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-accent/50 transition-colors cursor-pointer">
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              rows={4}
              className="mb-4"
            />

            <Button
              onClick={handleSubmit}
              disabled={uploading || images.length === 0}
              className="w-full"
            >
              {uploading ? 'Uploading...' : 'Share'}
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
