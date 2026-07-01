'use client';

import { useState, useRef } from 'react';
import { X, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { fetcher } from '@/lib/api';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreatePostModal({
  open,
  onClose,
  onSuccess,
}: CreatePostModalProps) {
  const [caption, setCaption] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    setImages([...images, ...newImages]);
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
      setCaption('');
      setImages([]);
      onClose();
      onSuccess?.();
    } catch {
      toast.error('Failed to create post');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:bg-accent/50 transition-colors"
            >
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Add Photo</span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Write a caption..."
            rows={3}
          />

          <Button
            onClick={handleSubmit}
            disabled={uploading || images.length === 0}
            className="w-full"
          >
            {uploading ? 'Uploading...' : 'Share'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
