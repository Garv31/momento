'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Plus, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { fetcher } from '@/lib/api';

interface Story {
  _id: string;
  image: string;
  author: {
    _id: string;
    username: string;
    name: string;
    image: string;
  };
  createdAt: string;
}

interface StoryGroup {
  author: {
    _id: string;
    username: string;
    name: string;
    image: string;
  };
  stories: Story[];
}

export default function StoryBar() {
  const { data: session } = useSession();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [activeStoryGroup, setActiveStoryGroup] =
    useState<StoryGroup | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadImage, setUploadImage] = useState('');

  useEffect(() => {
    if (session) fetchStories();
  }, [session]);

  useEffect(() => {
    if (!activeStoryGroup) return;

    const duration = 5000;
    const interval = 50;
    let currentProgress = 0;

    const timer = setInterval(() => {
      currentProgress += (interval / duration) * 100;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
          setActiveStoryIndex((prev) => prev + 1);
          setProgress(0);
        } else {
          setActiveStoryGroup(null);
          setActiveStoryIndex(0);
          setProgress(0);
        }
      }
    }, interval);

    return () => clearInterval(timer);
  }, [activeStoryGroup, activeStoryIndex]);

  const fetchStories = async () => {
    try {
      const data = await fetcher('/api/stories');
      setStoryGroups(data.stories);
    } catch {
      console.error('Failed to fetch stories');
    }
  };

  const handleUpload = async () => {
    if (!uploadImage) return;
    try {
      await fetcher('/api/stories', {
        method: 'POST',
        body: JSON.stringify({ image: uploadImage }),
      });
      toast.success('Story uploaded');
      setShowUpload(false);
      setUploadImage('');
      fetchStories();
    } catch {
      toast.error('Failed to upload story');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setUploadImage(data.url);
    } catch {
      toast.error('Failed to upload image');
    }
  };

  const goToNext = () => {
    if (!activeStoryGroup) return;
    if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      setActiveStoryGroup(null);
      setActiveStoryIndex(0);
      setProgress(0);
    }
  };

  const goToPrev = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto hide-scrollbar py-4 px-2">
        <button
          onClick={() => setShowUpload(true)}
          className="flex flex-col items-center gap-2 flex-shrink-0"
        >
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
            <Plus className="w-6 h-6 text-muted-foreground" />
          </div>
          <span className="text-xs">Add</span>
        </button>

        {storyGroups.map((group) => (
          <button
            key={group.author._id}
            onClick={() => {
              setActiveStoryGroup(group);
              setActiveStoryIndex(0);
              setProgress(0);
            }}
            className="flex flex-col items-center gap-2 flex-shrink-0"
          >
            <div className="story-ring p-[2px] rounded-full">
              <Avatar className="w-16 h-16 border-2 border-background">
                <AvatarImage src={group.author.image} />
                <AvatarFallback>{group.author.name[0]}</AvatarFallback>
              </Avatar>
            </div>
            <span className="text-xs truncate w-16 text-center">
              {group.author.username}
            </span>
          </button>
        ))}
      </div>

      {/* Story Viewer */}
      <AnimatePresence>
        {activeStoryGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          >
            <div className="absolute top-4 left-4 right-4 flex gap-1">
              {activeStoryGroup.stories.map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
                >
                  <div
                    className="h-full bg-white rounded-full transition-all duration-100"
                    style={{
                      width:
                        i < activeStoryIndex
                          ? '100%'
                          : i === activeStoryIndex
                          ? `${progress}%`
                          : '0%',
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="absolute top-10 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={activeStoryGroup.author.image} />
                  <AvatarFallback>
                    {activeStoryGroup.author.name[0]}
                  </AvatarFallback>
                </Avatar>
                <span className="text-white font-semibold text-sm">
                  {activeStoryGroup.author.username}
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveStoryGroup(null);
                  setProgress(0);
                }}
                className="text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <motion.img
              key={activeStoryIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={activeStoryGroup.stories[activeStoryIndex].image}
              alt="Story"
              className="max-h-full max-w-full object-contain"
            />

            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
              disabled={activeStoryIndex === 0}
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add to Story</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full"
            />
            {uploadImage && (
              <img
                src={uploadImage}
                alt="Preview"
                className="w-full rounded-lg"
              />
            )}
            <Button
              onClick={handleUpload}
              disabled={!uploadImage}
              className="w-full"
            >
              Share to Story
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
